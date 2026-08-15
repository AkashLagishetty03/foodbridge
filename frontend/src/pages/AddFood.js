import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { foodAPI } from '../services/api';
import { Alert } from '../components/Shared';

const AddFood = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', quantity: '',
    expiryTime: '', category: 'cooked',
    address: '', lat: '', lng: '',
    foodType: 'cooked',
    preparedAt: new Date().toISOString().slice(0, 16),
    storageMethod: 'room temperature',
    currentStorageTemperature: '',
    packagingCondition: 'sealed',
    foodAppearance: 'normal',
    odor: 'normal',
    contaminationRisk: 'none',
    hygiene: 'good',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.quantity || !form.expiryTime || !form.lat || !form.lng || !form.preparedAt) {
      return setError('Title, quantity, expiry date, preparation time, latitude, and longitude are required.');
    }
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) return setError('Latitude and longitude must be valid numbers.');
    if (new Date(form.expiryTime) <= new Date()) return setError('Expiry time must be in the future.');
    
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
      title: form.title, description: form.description,
      quantity: form.quantity, expiryTime: form.expiryTime,
      category: form.category,
      location: { address: form.address, lat, lng },
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
      await foodAPI.create(payload);
      navigate('/my-foods');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo auto-fill
  const fillDemo = () => setForm({
    title: 'Leftover Biryani – Large Batch',
    description: 'Chicken biryani prepared for an event. No nuts. Approx 40 servings available.',
    quantity: '40 servings',
    expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 16),
    category: 'cooked',
    address: '123 Spice Lane, New York, NY',
    lat: '40.7128',
    lng: '-74.0060',
    foodType: 'cooked',
    preparedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    storageMethod: 'hot-held',
    currentStorageTemperature: '62',
    packagingCondition: 'sealed',
    foodAppearance: 'normal',
    odor: 'normal',
    contaminationRisk: 'none',
    hygiene: 'good',
  });

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>➕ Add Food Listing</h1>
          <p>Share surplus food with NGOs and communities in need</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/my-foods')}>← Back</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div className="card">
          {error && <Alert type="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Food Title *</label>
              <input className="form-input" placeholder="e.g. Chicken Biryani – 40 servings" value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input className="form-input" placeholder="e.g. 40 servings / 5 kg / 20 boxes" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={(e) => set('category', e.target.value)}>
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
              <input className="form-input" type="datetime-local" value={form.expiryTime} onChange={(e) => set('expiryTime', e.target.value)} />
              <div className="form-hint">When does the food expire or become unsafe to consume?</div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3} placeholder="Describe the food: ingredients, allergens, preparation details, serving notes…" value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>

            <hr className="divider" />
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray-700)', marginBottom: '12px' }}>🛡️ Food Safety Parameters</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Food Type *</label>
                <select className="form-select" value={form.foodType} onChange={(e) => set('foodType', e.target.value)}>
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
                <input className="form-input" type="datetime-local" value={form.preparedAt} onChange={(e) => set('preparedAt', e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Storage Method *</label>
                <select className="form-select" value={form.storageMethod} onChange={(e) => set('storageMethod', e.target.value)}>
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
                  onChange={(e) => set('currentStorageTemperature', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Packaging Condition *</label>
                <select className="form-select" value={form.packagingCondition} onChange={(e) => set('packagingCondition', e.target.value)}>
                  <option value="sealed">📦 Sealed</option>
                  <option value="properly covered">🥣 Properly Covered</option>
                  <option value="partially damaged">⚠️ Partially Damaged</option>
                  <option value="open">❌ Open</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Food Appearance *</label>
                <select className="form-select" value={form.foodAppearance} onChange={(e) => set('foodAppearance', e.target.value)}>
                  <option value="normal">✅ Normal</option>
                  <option value="slightly changed">⚠️ Slightly Changed</option>
                  <option value="clearly abnormal">❌ Clearly Abnormal</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Odor / Smell *</label>
                <select className="form-select" value={form.odor} onChange={(e) => set('odor', e.target.value)}>
                  <option value="normal">👃 Normal</option>
                  <option value="slightly unusual">⚠️ Slightly Unusual</option>
                  <option value="unusual">❌ Unusual / Bad</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contamination Risk *</label>
                <select className="form-select" value={form.contaminationRisk} onChange={(e) => set('contaminationRisk', e.target.value)}>
                  <option value="none">🛡️ None</option>
                  <option value="possible">⚠️ Possible</option>
                  <option value="known">❌ Known Contamination</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Handling & Preparation Hygiene *</label>
              <select className="form-select" value={form.hygiene} onChange={(e) => set('hygiene', e.target.value)}>
                <option value="good">🧼 Good (Excellent Standards)</option>
                <option value="acceptable">🧼 Acceptable (Safe Standards)</option>
                <option value="poor">🧼 Poor (Substandard / Risky)</option>
              </select>
            </div>

            <hr className="divider" />
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray-700)', marginBottom: '12px' }}>📍 Pickup Location</div>

            <div className="form-group">
              <label className="form-label">Address (optional)</label>
              <input className="form-input" placeholder="123 Main St, City, State" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitude *</label>
                <input className="form-input" type="number" step="any" placeholder="40.7128" value={form.lat} onChange={(e) => set('lat', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude *</label>
                <input className="form-input" type="number" step="any" placeholder="-74.0060" value={form.lng} onChange={(e) => set('lng', e.target.value)} />
              </div>
            </div>
            <div className="form-hint" style={{ marginTop: '-10px', marginBottom: '16px' }}>
              💡 Find coordinates at <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--green-600)' }}>maps.google.com</a>. Right-click any location → "What's here?"
            </div>

            <div className="flex gap-3">
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                {loading ? '⏳ Creating…' : '🌱 Create Listing'}
              </button>
              <button className="btn btn-secondary btn-lg" type="button" onClick={() => navigate('/my-foods')}>Cancel</button>
            </div>
          </form>
        </div>

        {/* Sidebar tips */}
        <div>
          <div className="card mb-4">
            <div className="card-header">
              <div className="card-title">💡 Tips for Donors</div>
            </div>
            <ul style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: 1.7, paddingLeft: '16px' }}>
              <li>Be specific about quantity and portions</li>
              <li>Mention allergens in the description</li>
              <li>Set realistic expiry times</li>
              <li>Include pickup address details</li>
              <li>Respond to requests promptly</li>
            </ul>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">🧪 Demo Auto-fill</div>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--gray-500)', marginBottom: '12px' }}>
              Click below to populate the form with sample data for testing.
            </p>
            <button className="btn btn-outline btn-block" onClick={fillDemo}>
              Fill Demo Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFood;
