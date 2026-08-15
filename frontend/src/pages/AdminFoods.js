import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { Spinner, Alert, ConfirmDialog, EmptyState, Pagination, Badge, formatDate, formatDateTime } from '../components/Shared';

const AdminFoods = () => {
  const [foods, setFoods] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, limit: 15 };
      if (!params.status) delete params.status;
      const res = await adminAPI.getFoods(params);
      setFoods(res.data.data.foods);
      setPagination(res.data.data.pagination);
    } catch {
      setError('Failed to load food listings.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchFoods(); }, [fetchFoods]);

  const handleDelete = async () => {
    try {
      const res = await adminAPI.deleteFood(deleteTarget._id);
      setDeleteTarget(null);
      setSuccess(res.data.message);
      fetchFoods();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>🍱 All Food Listings</h1>
        <p>Admin view — monitor and manage all food donations on the platform</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="filters-bar">
        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
        >
          <option value="">All Statuses</option>
          <option value="available">✅ Available</option>
          <option value="requested">🟡 Requested</option>
          <option value="completed">🔵 Completed</option>
          <option value="expired">⚫ Expired</option>
        </select>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setFilters({ status: '', page: 1 })}
        >
          ↺ Reset
        </button>
        {pagination && (
          <span className="text-sm text-gray" style={{ marginLeft: 'auto' }}>
            {pagination.total} listing{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : foods.length === 0 ? (
        <EmptyState icon="🍽️" message="No food listings found." />
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Donor</th>
                  <th>Quantity</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Expires</th>
                  <th>Posted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((f) => (
                  <tr key={f._id}>
                    <td>
                      <strong>{f.title}</strong>
                      {f.description && (
                        <div style={{ fontSize: '11.5px', color: 'var(--gray-400)', marginTop: '2px' }}>
                          {f.description.slice(0, 45)}{f.description.length > 45 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>{f.donor?.name}</span>
                      <div style={{ fontSize: '11.5px', color: 'var(--gray-400)' }}>{f.donor?.email}</div>
                    </td>
                    <td>{f.quantity}</td>
                    <td><span className="tag">{f.category}</span></td>
                    <td><Badge status={f.status} /></td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                      {f.location?.address
                        ? f.location.address.slice(0, 25) + (f.location.address.length > 25 ? '…' : '')
                        : `${f.location?.lat?.toFixed(2)}, ${f.location?.lng?.toFixed(2)}`}
                    </td>
                    <td style={{ fontSize: '12.5px', color: new Date(f.expiryTime) < new Date() ? 'var(--red-500)' : 'inherit' }}>
                      {formatDate(f.expiryTime)}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{formatDateTime(f.createdAt)}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(f)}
                        title="Delete listing"
                      >
                        🗑️ Delete
                      </button>
                    </td>
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Food Listing"
        message={`Permanently delete "${deleteTarget?.title}"? This will also remove all requests associated with this listing.`}
        confirmLabel="Delete Listing"
        dangerous
      />
    </div>
  );
};

export default AdminFoods;
