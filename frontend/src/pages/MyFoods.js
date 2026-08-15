import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { foodAPI } from '../services/api';
import { Spinner, Badge, Alert, Modal, ConfirmDialog, EmptyState, Pagination, formatDate } from '../components/Shared';

const FoodFormModal = ({ food, onClose, onSuccess }) => {
  const editing = !!food;
  const [form, setForm] = useState({
    title: food?.title || '',
    description: food?.description || '',
    quantity: food?.quantity || '',
    expiryTime: food?.expiryTime ? food.expiryTime.slice(0, 16) : '',
    category: food?.category || 'other',
    'location.address': food?.location?.address || '',
    'location.lat': food?.location?.lat || '',
    'location.lng': food?.location?.lng || '',
    foodType: food?.foodType || 'cooked',
    preparedAt: food?.preparedAt ? food.preparedAt.slice(0, 16) : new Date().toISOString().slice(0, 16),
    storageMethod: food?.storageMethod || 'room temperature',
    currentStorageTemperature: food?.currentStorageTemperature !== undefined && food?.currentStorageTemperature !== null ? food.currentStorageTemperature.toString() : '',
    packagingCondition: food?.packagingCondition || 'sealed',
    foodAppearance: food?.foodAppearance || 'normal',
    odor: food?.odor || 'normal',
    contaminationRisk: food?.contaminationRisk || 'none',
    hygiene: food?.hygiene || 'good',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    setError('');
    if (!form.title || !form.quantity || !form.expiryTime || !form['location.lat'] || !form['location.lng'] || !form.preparedAt) {
      return setError('Please fill in all required fields (title, quantity, expiry, preparation time, lat, lng).');
    }
    const lat = parseFloat(form['location.lat']);
    const lng = parseFloat(form['location.lng']);
    if (isNaN(lat) || isNaN(lng)) return setError('Latitude and longitude must be valid numbers.');

    if (new Date(form.preparedAt) > new Date()) {
      return setError('Preparation time cannot be in the future.');
    }
    if (new Date(form.preparedAt) > new Date(form.expiryTime)) {
      return setError('Preparation time cannot be after the expiry time.');
    }
    if (form.currentStorageTemperature !== '') {
      const temp = parseFloat(form.currentStorageTemperature);
      if (isNaN(temp)) return setError('Current storage temperature must be a valid number.');
    }

    const payload = {
      title: form.title,
      description: form.description,
      quantity: form.quantity,
      expiryTime: form.expiryTime,
      category: form.category,
      location: { address: form['location.address'], lat, lng },
      foodType: form.foodType,
      preparedAt: form.preparedAt,
      storageMethod: form.storageMethod,
      currentStorageTemperature: form.currentStorageTemperature !== '' ? parseFloat(form.currentStorageTemperature) : null,
      packagingCondition: form.packagingCondition,
      foodAppearance: form.foodAppearance,
      odor: form.odor,
      contaminationRisk: form.contaminationRisk,
      hygiene: form.hygiene,
    };
    setLoading(true);
    try {
      if (editing) {
        await foodAPI.update(food._id, payload);
      } else {
        await foodAPI.create(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={editing ? '✏️ Edit Listing' : '➕ Add Food Listing'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : editing ? 'Save Changes' : '🌱 Create Listing'}
          </button>
        </>
      }
    >
      {error && <Alert type="error">{error}</Alert>}
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="form-input" placeholder="e.g. Pasta Primavera - 50 servings" value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Quantity *</label>
          <input className="form-input" placeholder="e.g. 30 servings" value={form.quantity} onChange={(e) => handleChange('quantity', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
            <option value="cooked">🍲 Cooked Food</option>
            <option value="raw">🥦 Raw Ingredients</option>
            <option value="packaged">📦 Packaged Items</option>
            <option value="beverages">🧃 Beverages</option>
            <option value="other">📋 Other</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Expiry Date & Time *</label>
        <input className="form-input" type="datetime-local" value={form.expiryTime} onChange={(e) => handleChange('expiryTime', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" placeholder="Describe the food, any allergens, prep details…" value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
      </div>

      <hr className="divider" />
      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray-700)', marginBottom: '12px' }}>🛡️ Food Safety Parameters</div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Food Type *</label>
          <select className="form-select" value={form.foodType} onChange={(e) => handleChange('foodType', e.target.value)}>
            <option value="cooked">🍲 Cooked Food</option>
            <option value="raw">🥦 Raw Ingredients</option>
            <option value="packaged">📦 Packaged Items</option>
            <option value="bakery">🥯 Bakery</option>
            <option value="fruits-vegetables">🍇 Fruits & Vegetables</option>
            <option value="dairy">🧀 Dairy Products</option>
            <option value="other">📋 Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Preparation Time / Food Age *</label>
          <input className="form-input" type="datetime-local" value={form.preparedAt} onChange={(e) => handleChange('preparedAt', e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Storage Method *</label>
          <select className="form-select" value={form.storageMethod} onChange={(e) => handleChange('storageMethod', e.target.value)}>
            <option value="refrigerated">❄️ Refrigerated</option>
            <option value="frozen">🥶 Frozen</option>
            <option value="room temperature">🌡️ Room Temperature</option>
            <option value="hot-held">🔥 Hot Held</option>
            <option value="other">📋 Other</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Current Temp (°C)</label>
          <input
            className="form-input"
            type="number"
            placeholder="e.g. 4 or 62 (Optional)"
            value={form.currentStorageTemperature}
            onChange={(e) => handleChange('currentStorageTemperature', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Packaging Condition *</label>
          <select className="form-select" value={form.packagingCondition} onChange={(e) => handleChange('packagingCondition', e.target.value)}>
            <option value="sealed">📦 Sealed</option>
            <option value="properly covered">🥣 Properly Covered</option>
            <option value="partially damaged">⚠️ Partially Damaged</option>
            <option value="open">❌ Open</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Food Appearance *</label>
          <select className="form-select" value={form.foodAppearance} onChange={(e) => handleChange('foodAppearance', e.target.value)}>
            <option value="normal">✅ Normal</option>
            <option value="slightly changed">⚠️ Slightly Changed</option>
            <option value="clearly abnormal">❌ Clearly Abnormal</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Odor / Smell *</label>
          <select className="form-select" value={form.odor} onChange={(e) => handleChange('odor', e.target.value)}>
            <option value="normal">👃 Normal</option>
            <option value="slightly unusual">⚠️ Slightly Unusual</option>
            <option value="unusual">❌ Unusual / Bad</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Contamination Risk *</label>
          <select className="form-select" value={form.contaminationRisk} onChange={(e) => handleChange('contaminationRisk', e.target.value)}>
            <option value="none">🛡️ None</option>
            <option value="possible">⚠️ Possible</option>
            <option value="known">❌ Known Contamination</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Handling & Preparation Hygiene *</label>
        <select className="form-select" value={form.hygiene} onChange={(e) => handleChange('hygiene', e.target.value)}>
          <option value="good">🧼 Good (Excellent Standards)</option>
          <option value="acceptable">🧼 Acceptable (Safe Standards)</option>
          <option value="poor">🧼 Poor (Substandard / Risky)</option>
        </select>
      </div>

      <hr className="divider" />
      <div className="form-group">
        <label className="form-label">Address (optional)</label>
        <input className="form-input" placeholder="123 Main St, New York, NY" value={form['location.address']} onChange={(e) => handleChange('location.address', e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Latitude *</label>
          <input className="form-input" type="number" step="any" placeholder="40.7128" value={form['location.lat']} onChange={(e) => handleChange('location.lat', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Longitude *</label>
          <input className="form-input" type="number" step="any" placeholder="-74.0060" value={form['location.lng']} onChange={(e) => handleChange('location.lng', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

const MyFoods = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [showForm, setShowForm] = useState(false);
  const [editFood, setEditFood] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 10 };
      if (!params.status) delete params.status;
      const res = await foodAPI.getMy(params);
      setFoods(res.data.data.foods);
      setPagination(res.data.data.pagination);
    } catch {
      setError('Failed to load your listings.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchFoods(); }, [fetchFoods]);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditFood(null);
    setSuccess('Listing saved successfully!');
    fetchFoods();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = async () => {
    try {
      await foodAPI.delete(deleteTarget._id);
      setDeleteTarget(null);
      setSuccess('Listing deleted.');
      fetchFoods();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>🍱 My Food Listings</h1>
          <p>Manage your active and past donations</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/add-food')}>➕ Add New</button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="filters-bar">
        <select className="form-select" value={filters.status} onChange={(e) => setFilters({ status: e.target.value, page: 1 })}>
          <option value="">All Statuses</option>
          <option value="available">✅ Available</option>
          <option value="requested">🟡 Requested</option>
          <option value="completed">🔵 Completed</option>
          <option value="expired">⚫ Expired</option>
        </select>
        {pagination && <span className="text-sm text-gray" style={{ marginLeft: 'auto' }}>{pagination.total} listings</span>}
      </div>

      {loading ? (
        <Spinner />
      ) : foods.length === 0 ? (
        <EmptyState icon="🍽️" message="You haven't posted any food listings yet." action={<button className="btn btn-primary" onClick={() => navigate('/add-food')}>➕ Add Your First Listing</button>} />
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Title</th><th>Quantity</th><th>Category</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {foods.map((f) => (
                  <tr key={f._id}>
                    <td>
                      <strong>{f.title}</strong>
                      {f.description && <div style={{ fontSize: '11.5px', color: 'var(--gray-400)', marginTop: '2px' }}>{f.description.slice(0, 50)}{f.description.length > 50 ? '…' : ''}</div>}
                    </td>
                    <td>{f.quantity}</td>
                    <td><span className="tag">{f.category}</span></td>
                    <td><Badge status={f.status} /></td>
                    <td style={{ color: new Date(f.expiryTime) < new Date() ? 'var(--red-500)' : 'inherit' }}>
                      {formatDate(f.expiryTime)}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {!['completed', 'expired'].includes(f.status) && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditFood(f)}>✏️ Edit</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(f)}>🗑️</button>
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

      {(showForm || editFood) && (
        <FoodFormModal
          food={editFood}
          onClose={() => { setShowForm(false); setEditFood(null); }}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Listing"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also remove any related requests.`}
        confirmLabel="Delete"
        dangerous
      />
    </div>
  );
};

export default MyFoods;
