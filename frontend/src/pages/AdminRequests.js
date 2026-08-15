import React, { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { Spinner, Alert, EmptyState, Pagination, Badge, formatDateTime, formatDate } from '../components/Shared';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', page: 1 });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, limit: 15 };
      if (!params.status) delete params.status;
      const res = await API.get('/request/all', { params });
      setRequests(res.data.data.requests);
      setPagination(res.data.data.pagination);
    } catch {
      setError('Failed to load requests. Make sure you are logged in as ADMIN.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Count by status for summary row
  const statusSummary = { pending: 0, accepted: 0, rejected: 0, completed: 0 };
  requests.forEach((r) => { if (statusSummary[r.status] !== undefined) statusSummary[r.status]++; });

  return (
    <div>
      <div className="page-header">
        <h1>📋 All Requests</h1>
        <p>Admin view — monitor all food pickup requests across the platform</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Summary chips */}
      <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        {Object.entries(statusSummary).map(([status, count]) => (
          <div
            key={status}
            onClick={() => setFilters({ status: filters.status === status ? '' : status, page: 1 })}
            style={{
              padding: '8px 14px', background: 'var(--white)', border: `2px solid ${filters.status === status ? 'var(--green-500)' : 'var(--gray-200)'}`,
              borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <Badge status={status} />
            <span style={{ fontWeight: '700', fontSize: '16px' }}>{count}</span>
          </div>
        ))}
        {filters.status && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setFilters({ status: '', page: 1 })}
          >
            ↺ Show All
          </button>
        )}
      </div>

      <div className="filters-bar">
        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
        >
          <option value="">All Statuses</option>
          <option value="pending">⏳ Pending</option>
          <option value="accepted">✅ Accepted</option>
          <option value="rejected">❌ Rejected</option>
          <option value="completed">🔵 Completed</option>
        </select>
        {pagination && (
          <span className="text-sm text-gray" style={{ marginLeft: 'auto' }}>
            {pagination.total} total requests
          </span>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState icon="📭" message="No requests found for the selected filter." />
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Donor</th>
                  <th>NGO</th>
                  <th>NGO Message</th>
                  <th>Donor Response</th>
                  <th>Pickup Time</th>
                  <th>Status</th>
                  <th>Requested At</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.food?.title}</strong>
                      <div style={{ fontSize: '11.5px', color: 'var(--gray-400)' }}>{r.food?.quantity}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>{r.donor?.name}</span>
                      <div style={{ fontSize: '11.5px', color: 'var(--gray-400)' }}>{r.donor?.email}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>{r.ngo?.name}</span>
                      <div style={{ fontSize: '11.5px', color: 'var(--gray-400)' }}>{r.ngo?.organization}</div>
                    </td>
                    <td style={{ maxWidth: '160px', fontSize: '12.5px', color: 'var(--gray-500)', fontStyle: 'italic' }}>
                      {r.message || '—'}
                    </td>
                    <td style={{ maxWidth: '160px', fontSize: '12.5px', color: 'var(--gray-600)' }}>
                      {r.responseNote || '—'}
                    </td>
                    <td style={{ fontSize: '12.5px' }}>
                      {r.pickupTime ? formatDate(r.pickupTime) : '—'}
                    </td>
                    <td><Badge status={r.status} /></td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            pagination={pagination}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        </>
      )}
    </div>
  );
};

export default AdminRequests;
