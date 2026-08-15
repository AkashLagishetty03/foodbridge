import React, { useState, useEffect, useCallback } from 'react';
import { foodAPI, requestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, Badge, Alert, Modal, EmptyState, Pagination, formatDate } from '../components/Shared';

const PriorityBadge = ({ score }) => {
  let colorClass = 'var(--red-500)';
  let bg = 'rgba(239, 68, 68, 0.1)';
  if (score >= 80) {
    colorClass = 'var(--green-600)';
    bg = 'rgba(22, 163, 74, 0.1)';
  } else if (score >= 50) {
    colorClass = 'var(--orange-500)';
    bg = 'rgba(249, 115, 22, 0.1)';
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: colorClass,
      backgroundColor: bg,
      border: `1px solid ${colorClass}`,
    }}>
      {score}/100
    </span>
  );
};

const SafetyBadge = ({ safety }) => {
  const { status, score, reasons } = safety || {};
  let color = 'var(--green-600)';
  let bg = 'rgba(22, 163, 74, 0.1)';
  let icon = '🛡️';
  
  if (status === 'UNSAFE') {
    color = 'var(--red-500)';
    bg = 'rgba(239, 68, 68, 0.1)';
    icon = '❌';
  } else if (status === 'CAUTION') {
    color = 'var(--orange-500)';
    bg = 'rgba(249, 115, 22, 0.1)';
    icon = '⚠️';
  }
  
  return (
    <span
      title={reasons && reasons.length > 0 ? `Reasons: ${reasons.join(', ')}` : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11.5px',
        fontWeight: '600',
        color: color,
        backgroundColor: bg,
        border: `1px dashed ${color}`,
        cursor: reasons && reasons.length > 0 ? 'help' : 'default',
      }}
    >
      {icon} {score || 0}% ({status || 'SAFE'})
    </span>
  );
};

const UrgencyBadge = ({ urgency }) => {
  const { level, score } = urgency || {};
  let color = 'var(--gray-500)';
  let bg = 'rgba(107, 114, 128, 0.1)';
  
  if (level === 'CRITICAL') {
    color = 'var(--red-500)';
    bg = 'rgba(239, 68, 68, 0.1)';
  } else if (level === 'HIGH') {
    color = 'var(--orange-500)';
    bg = 'rgba(249, 115, 22, 0.1)';
  } else if (level === 'MEDIUM') {
    color = 'var(--blue-500)';
    bg = 'rgba(59, 130, 246, 0.1)';
  }
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11.5px',
      fontWeight: '600',
      color: color,
      backgroundColor: bg,
    }}>
      {level || 'LOW'} ({score || 0})
    </span>
  );
};

const getRemainingTime = (expiryTime) => {
  if (!expiryTime) return 'Unknown';
  const diffMs = new Date(expiryTime) - new Date();
  if (diffMs <= 0) return 'Expired';
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHrs > 24) {
    const days = Math.floor(diffHrs / 24);
    return `${days}d ${diffHrs % 24}h remaining`;
  }
  return `${diffHrs}h ${diffMins}m remaining`;
};

const expiryOptions = [
  { value: '', label: 'All expiry dates' },
  { value: '24', label: 'Expires in 24h' },
  { value: '72', label: 'Expires in 3 days' },
  { value: 'today', label: 'Expires today' },
];

const formatDistance = (distanceKm) => {
  if (typeof distanceKm !== 'number') return 'Distance unknown';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(1)} km away`;
};

const RequestModal = ({ food, onClose, onSuccess }) => {
  const [form, setForm] = useState({ message: '', pickupTime: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await requestAPI.create({ foodId: food._id, message: form.message, pickupTime: form.pickupTime || undefined });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Request: ${food.title}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting…' : '📬 Submit Request'}
          </button>
        </>
      }
    >
      {error && <Alert type="error">{error}</Alert>}
      <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
          <strong>Quantity:</strong> {food.quantity} &nbsp;·&nbsp;
          <strong>Category:</strong> {food.category} &nbsp;·&nbsp;
          <strong>Expires:</strong> {formatDate(food.expiryTime)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '4px' }}>
          <strong>Donor:</strong> {food.donor?.name}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Message to Donor (optional)</label>
        <textarea
          className="form-textarea"
          placeholder="Explain why you need this food, how many people it will serve, etc."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Preferred Pickup Time (optional)</label>
        <input
          className="form-input" type="datetime-local"
          value={form.pickupTime} onChange={(e) => setForm({ ...form, pickupTime: e.target.value })}
        />
      </div>
    </Modal>
  );
};

const FoodListings = () => {
  const { isNGO, isDonor } = useAuth();
  const [foods, setFoods] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    status: isDonor ? '' : 'available',
    category: '',
    expiry: '',
    sortBy: 'created',
    lat: '',
    lng: '',
    radiusKm: '10',
    page: 1,
  });
  const [locationStatus, setLocationStatus] = useState('');
  const [requestTarget, setRequestTarget] = useState(null);

  useEffect(() => {
    if (isNGO) {
      setFilters((prev) => ({
        ...prev,
        sortBy: prev.sortBy === 'created' ? 'recommended' : prev.sortBy,
      }));
    }
  }, [isNGO]);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, limit: 9 };
      if (!params.status) delete params.status;
      if (!params.category) delete params.category;
      if (!params.expiry) delete params.expiry;
      if (!params.lat || !params.lng) {
        delete params.lat;
        delete params.lng;
        delete params.radiusKm;
      }
      if (params.expiry && !['today', 'tomorrow', 'expired'].includes(params.expiry)) {
        params.expiryWithinHours = params.expiry;
        delete params.expiry;
      }
      const res = await foodAPI.getAll(params);
      setFoods(res.data.data.foods);
      setPagination(res.data.data.pagination);
    } catch {
      setError('Failed to load food listings.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchFoods(); }, [fetchFoods]);

  const handleRequestSuccess = () => {
    setRequestTarget(null);
    setSuccess('Request submitted! The donor will be notified.');
    fetchFoods();
    setTimeout(() => setSuccess(''), 4000);
  };

  const updateFilters = (updates) => setFilters((prev) => ({ ...prev, ...updates, page: 1 }));

  useEffect(() => {
    if (!isNGO || filters.lat || filters.lng || !navigator.geolocation) return;

    setLocationStatus('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateFilters({
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
        });
        setLocationStatus('Distances are sorted from your current location.');
      },
      () => setLocationStatus('Set your location to calculate distance and radius filters.'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [isNGO, filters.lat, filters.lng]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported in this browser.');
      return;
    }

    setLocationStatus('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateFilters({
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
        });
        setLocationStatus('Showing listings near your current location.');
      },
      () => setLocationStatus('Location permission was blocked. You can still browse all listings.')
    );
  };

  const resetFilters = () => {
    setFilters({
      status: isNGO ? 'available' : '',
      category: '',
      expiry: '',
      sortBy: 'created',
      lat: '',
      lng: '',
      radiusKm: '10',
      page: 1,
    });
    setLocationStatus('');
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>🍱 Food Listings</h1>
          <p>{isNGO ? 'Browse available food from donors near you' : 'All food listings on the platform'}</p>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="filters-bar">
        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="available">✅ Available</option>
          <option value="requested">🟡 Requested</option>
          <option value="completed">🔵 Completed</option>
          <option value="expired">⚫ Expired</option>
        </select>
        <select
          className="form-select"
          value={filters.category}
          onChange={(e) => updateFilters({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="cooked">🍲 Cooked</option>
          <option value="raw">🥦 Raw</option>
          <option value="packaged">📦 Packaged</option>
          <option value="beverages">🧃 Beverages</option>
          <option value="other">📋 Other</option>
        </select>
        <select
          className="form-select"
          value={filters.expiry}
          onChange={(e) => updateFilters({ expiry: e.target.value })}
        >
          {expiryOptions.map((option) => (
            <option value={option.value} key={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={filters.sortBy}
          onChange={(e) => updateFilters({ sortBy: e.target.value })}
        >
          {isNGO ? (
            <>
              <option value="recommended">⭐ Recommended</option>
              <option value="nearest">📍 Nearest</option>
              <option value="most-urgent">⏳ Most Urgent</option>
              <option value="highest-safety">🛡️ Highest Safety</option>
              <option value="created">Newest first</option>
              <option value="expiry">Expiring soon</option>
            </>
          ) : (
            <>
              <option value="created">Newest first</option>
              <option value="expiry">Expiring soon</option>
            </>
          )}
        </select>
        <select
          className="form-select"
          value={filters.radiusKm}
          onChange={(e) => updateFilters({ radiusKm: e.target.value })}
          disabled={!filters.lat || !filters.lng}
        >
          <option value="5">Within 5 km</option>
          <option value="10">Within 10 km</option>
          <option value="25">Within 25 km</option>
          <option value="50">Within 50 km</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={useCurrentLocation}>
          Use my location
        </button>
        <input
          className="form-input"
          type="number"
          step="any"
          placeholder="Your latitude"
          value={filters.lat}
          onChange={(e) => updateFilters({ lat: e.target.value })}
        />
        <input
          className="form-input"
          type="number"
          step="any"
          placeholder="Your longitude"
          value={filters.lng}
          onChange={(e) => updateFilters({ lng: e.target.value })}
        />
        <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
          ↺ Reset
        </button>
        {locationStatus && <span className="text-sm text-gray">{locationStatus}</span>}
        {pagination && (
          <span className="text-sm text-gray" style={{ marginLeft: 'auto' }}>
            {pagination.total} listing{pagination.total !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : foods.length === 0 ? (
        <EmptyState icon="🍽️" message="No food listings match your filters." />
      ) : (
        <>
          <div className="food-grid">
            {foods.map((food) => (
              <div className="food-card" key={food._id}>
                <div className="food-card-header">
                  <div>
                    <div className="food-card-title">{food.title}</div>
                    <div className="food-card-donor">by {food.donor?.name}</div>
                  </div>
                  <Badge status={food.status} />
                </div>
                <div className="food-card-body">
                  <div className="food-card-meta">
                    <div className="meta-item">
                      <span className="meta-label">Quantity</span>
                      <span className="meta-value">🍽️ {food.quantity}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Category</span>
                      <span className="meta-value">{food.category}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Expires</span>
                      <span className="meta-value" style={{ color: new Date(food.expiryTime) < new Date() ? 'var(--red-500)' : 'inherit' }}>
                        📅 {formatDate(food.expiryTime)}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Location</span>
                      <span className="meta-value">
                        📍 {typeof food.distanceKm === 'number'
                          ? formatDistance(food.distanceKm)
                          : filters.lat && filters.lng
                            ? 'Distance unavailable'
                            : 'Set location to calculate'}
                      </span>
                    </div>
                  </div>

                  {/* Ranking & Safety Gate Metrics */}
                  <div style={{
                    margin: '12px 0',
                    padding: '12px',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--gray-200)',
                    fontSize: '12.5px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: 'var(--gray-700)' }}>⭐ Priority Score:</span>
                      <PriorityBadge score={food.priority?.score} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: 'var(--gray-700)' }}>🛡️ Safety Gate:</span>
                      <SafetyBadge safety={food.foodSafety} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: 'var(--gray-700)' }}>⏳ Urgency:</span>
                      <UrgencyBadge urgency={food.urgency} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: 'var(--gray-700)' }}>⏱️ Remaining:</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--gray-800)' }}>{getRemainingTime(food.expiryTime)}</span>
                    </div>
                  </div>
                  {food.description && (
                    <div className="food-card-desc">{food.description}</div>
                  )}
                  {food.location?.address && (
                    <div className="food-card-location">📍 {food.location.address}</div>
                  )}
                </div>
                {isNGO && food.status === 'available' && (
                  <div className="food-card-footer">
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => setRequestTarget(food)}
                    >
                      📬 Request This Food
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={(p) => setFilters({ ...filters, page: p })} />
        </>
      )}

      {requestTarget && (
        <RequestModal
          food={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
};

export default FoodListings;
