import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestAPI } from '../services/api';
import { Spinner, Badge, Alert, EmptyState, Pagination, formatDate, formatDateTime } from '../components/Shared';

const NGORequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', page: 1 });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, limit: 10 };
      if (!params.status) delete params.status;
      const res = await requestAPI.getNGORequests(params);
      setRequests(res.data.data.requests);
      setPagination(res.data.data.pagination);
    } catch {
      setError('Failed to load your requests.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>📋 My Requests</h1>
          <p>Track the status of your food pickup requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/foods')}>🔍 Browse More Food</button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Mini stat row */}
      {requests.length > 0 && (
        <div className="flex gap-3 mb-4">
          {['pending', 'accepted', 'rejected', 'completed'].map((s) => (
            <div key={s} style={{ padding: '10px 14px', background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '13px', textAlign: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '18px' }}>{statusCounts[s] || 0}</div>
              <div style={{ color: 'var(--gray-500)', textTransform: 'capitalize' }}>{s}</div>
            </div>
          ))}
        </div>
      )}

      <div className="filters-bar">
        <select className="form-select" value={filters.status} onChange={(e) => setFilters({ status: e.target.value, page: 1 })}>
          <option value="">All Requests</option>
          <option value="pending">⏳ Pending</option>
          <option value="accepted">✅ Accepted</option>
          <option value="rejected">❌ Rejected</option>
          <option value="completed">🔵 Completed</option>
        </select>
        {pagination && <span className="text-sm text-gray" style={{ marginLeft: 'auto' }}>{pagination.total} total</span>}
      </div>

      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="📭"
          message="You haven't made any requests yet."
          action={<button className="btn btn-primary" onClick={() => navigate('/foods')}>🔍 Browse Available Food</button>}
        />
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Food Item</th><th>Donor</th><th>Quantity</th><th>My Message</th><th>Donor's Response</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.food?.title}</strong>
                      <div style={{ fontSize: '11.5px', color: 'var(--gray-400)' }}>
                        Expires: {formatDate(r.food?.expiryTime)}
                      </div>
                    </td>
                    <td>
                      <strong>{r.donor?.name}</strong>
                      <div style={{ fontSize: '11.5px', color: 'var(--gray-400)' }}>{r.donor?.phone}</div>
                    </td>
                    <td>{r.food?.quantity}</td>
                    <td style={{ maxWidth: '160px', fontSize: '12.5px', color: 'var(--gray-500)', fontStyle: 'italic' }}>
                      {r.message || '—'}
                    </td>
                    <td style={{ maxWidth: '160px', fontSize: '12.5px', color: r.responseNote ? 'var(--gray-700)' : 'var(--gray-400)' }}>
                      {r.responseNote || (r.status === 'pending' ? 'Awaiting response…' : '—')}
                    </td>
                    <td><Badge status={r.status} /></td>
                    <td>{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={(p) => setFilters({ ...filters, page: p })} />
        </>
      )}
    </div>
  );
};

export default NGORequests;
