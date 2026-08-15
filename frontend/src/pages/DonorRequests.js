import React, { useState, useEffect, useCallback } from 'react';
import { requestAPI } from '../services/api';
import { Spinner, Badge, Alert, Modal, EmptyState, Pagination, formatDate, formatDateTime } from '../components/Shared';

const RespondModal = ({ request, onClose, onSuccess }) => {
  const [form, setForm] = useState({ status: 'accepted', responseNote: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await requestAPI.updateStatus(request._id, form);
      onSuccess(form.status);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Respond to Request"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${form.status === 'accepted' ? 'btn-primary' : 'btn-danger'}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving…' : form.status === 'accepted' ? '✅ Accept' : '❌ Reject'}
          </button>
        </>
      }
    >
      {error && <Alert type="error">{error}</Alert>}
      <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--gray-600)' }}>
        <strong>{request.food?.title}</strong> requested by <strong>{request.ngo?.name}</strong>
        {request.message && <p style={{ marginTop: '6px', fontStyle: 'italic', color: 'var(--gray-500)' }}>"{request.message}"</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Decision</label>
        <div className="flex gap-3">
          {['accepted', 'rejected'].map((s) => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => setForm({ ...form, status: s })} />
              {s === 'accepted' ? '✅ Accept' : '❌ Reject'}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Note to NGO (optional)</label>
        <textarea
          className="form-textarea"
          placeholder={form.status === 'accepted' ? 'e.g. Please come by at 6pm. Call us when you arrive.' : 'e.g. Sorry, already committed to another NGO.'}
          value={form.responseNote}
          onChange={(e) => setForm({ ...form, responseNote: e.target.value })}
        />
      </div>
    </Modal>
  );
};

const DonorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [respondTarget, setRespondTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, limit: 10 };
      if (!params.status) delete params.status;
      const res = await requestAPI.getDonorRequests(params);
      setRequests(res.data.data.requests);
      setPagination(res.data.data.pagination);
    } catch {
      setError('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleRespondSuccess = (status) => {
    setRespondTarget(null);
    setSuccess(`Request ${status} successfully.`);
    fetchRequests();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleComplete = async () => {
    try {
      await requestAPI.complete(completeTarget._id);
      setCompleteTarget(null);
      setSuccess('Donation marked as completed! 🎉');
      fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete.');
      setCompleteTarget(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>📬 Incoming Requests</h1>
        <p>Review and respond to NGO requests for your food listings</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="filters-bar">
        <select className="form-select" value={filters.status} onChange={(e) => setFilters({ status: e.target.value, page: 1 })}>
          <option value="">All Requests</option>
          <option value="pending">⏳ Pending</option>
          <option value="accepted">✅ Accepted</option>
          <option value="rejected">❌ Rejected</option>
          <option value="completed">🔵 Completed</option>
        </select>
        {pagination && <span className="text-sm text-gray" style={{ marginLeft: 'auto' }}>{pagination.total} requests</span>}
      </div>

      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState icon="📭" message="No requests here yet. Post food listings to start receiving requests." />
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Food Item</th><th>Requested By</th><th>Message</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.food?.title}</strong>
                      <div style={{ fontSize: '11.5px', color: 'var(--gray-400)' }}>{r.food?.quantity}</div>
                    </td>
                    <td>
                      <strong>{r.ngo?.name}</strong>
                      <div style={{ fontSize: '11.5px', color: 'var(--gray-400)' }}>{r.ngo?.phone}</div>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--gray-500)', fontStyle: r.message ? 'italic' : 'normal' }}>
                        {r.message || '—'}
                      </span>
                    </td>
                    <td><Badge status={r.status} /></td>
                    <td>{formatDateTime(r.createdAt)}</td>
                    <td>
                      <div className="flex gap-2">
                        {r.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" onClick={() => setRespondTarget(r)}>Respond</button>
                        )}
                        {r.status === 'accepted' && (
                          <button className="btn btn-outline btn-sm" onClick={() => setCompleteTarget(r)}>✅ Complete</button>
                        )}
                        {r.responseNote && (
                          <span title={r.responseNote} style={{ cursor: 'help', fontSize: '16px' }}>💬</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={(p) => setFilters({ ...filters, page: p })} />
        </>
      )}

      {respondTarget && (
        <RespondModal request={respondTarget} onClose={() => setRespondTarget(null)} onSuccess={handleRespondSuccess} />
      )}

      {completeTarget && (
        <div className="modal-overlay" onClick={() => setCompleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">✅ Mark as Completed</span>
              <button className="modal-close" onClick={() => setCompleteTarget(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-600)' }}>
                Confirm that <strong>{completeTarget.ngo?.name}</strong> has successfully picked up "<strong>{completeTarget.food?.title}</strong>"?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCompleteTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleComplete}>🎉 Mark Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorRequests;
