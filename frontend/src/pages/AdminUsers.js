import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import { Spinner, Alert, ConfirmDialog, EmptyState, Pagination, RoleBadge, formatDate } from '../components/Shared';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ role: '', search: '', page: 1 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, limit: 15 };
      if (!params.role) delete params.role;
      if (!params.search) delete params.search;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
  };

  const handleToggle = async (user) => {
    try {
      const res = await adminAPI.toggleUser(user._id);
      setSuccess(res.data.message);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await adminAPI.deleteUser(deleteTarget._id);
      setDeleteTarget(null);
      setSuccess(res.data.message);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>👥 User Management</h1>
        <p>View, activate/deactivate, and remove platform users</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="filters-bar">
        <form onSubmit={handleSearch} className="flex gap-2 items-center" style={{ flex: 1 }}>
          <input
            className="form-input search-box"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button className="btn btn-secondary btn-sm" type="submit">🔍 Search</button>
        </form>
        <select
          className="form-select"
          value={filters.role}
          onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))}
        >
          <option value="">All Roles</option>
          <option value="DONOR">🍽️ Donors</option>
          <option value="NGO">🤝 NGOs</option>
          <option value="ADMIN">🛡️ Admins</option>
        </select>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setFilters({ role: '', search: '', page: 1 }); setSearchInput(''); }}
        >
          ↺ Reset
        </button>
        {pagination && (
          <span className="text-sm text-gray" style={{ marginLeft: 'auto' }}>
            {pagination.total} user{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon="👤" message="No users match your search." />
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: u.role === 'DONOR' ? 'var(--green-100)' : u.role === 'NGO' ? 'var(--blue-50)' : 'var(--red-50)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: '700',
                            color: u.role === 'DONOR' ? 'var(--green-700)' : u.role === 'NGO' ? 'var(--blue-600)' : 'var(--red-600)',
                          }}
                        >
                          {u.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--gray-500)' }}>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '12.5px' }}>{u.organization || '—'}</td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                          background: u.isActive ? 'var(--green-100)' : 'var(--gray-100)',
                          color: u.isActive ? 'var(--green-700)' : 'var(--gray-500)',
                        }}
                      >
                        {u.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px' }}>{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="flex gap-2">
                        {u.role !== 'ADMIN' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleToggle(u)}
                              title={u.isActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {u.isActive ? '🔒 Deactivate' : '🔓 Activate'}
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteTarget(u)}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                        {u.role === 'ADMIN' && (
                          <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Admin</span>
                        )}
                      </div>
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
        title="Delete User"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}" (${deleteTarget?.email})? This will also delete all their food listings and associated requests.`}
        confirmLabel="Delete User"
        dangerous
      />
    </div>
  );
};

export default AdminUsers;
