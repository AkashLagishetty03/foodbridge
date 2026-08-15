import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { foodAPI, requestAPI, adminAPI } from '../services/api';
import { Spinner, Badge, formatDateTime, formatDate } from '../components/Shared';

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
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: 'bold',
      color: colorClass,
      backgroundColor: bg,
      border: `1px solid ${colorClass}`,
    }}>
      ⭐ {score}/100
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
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
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
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      color: color,
      backgroundColor: bg,
    }}>
      ⏳ {level || 'LOW'} ({score || 0})
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

const StatCard = ({ label, value, icon, color = 'green' }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-card-inner">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-icon">{icon}</div>
    </div>
  </div>
);

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

const Dashboard = () => {
  const { user, isAdmin, isDonor, isNGO } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listingFilters, setListingFilters] = useState({
    expiry: '',
    sortBy: 'created',
    lat: '',
    lng: '',
    radiusKm: '10',
  });
  const [locationStatus, setLocationStatus] = useState('');

  useEffect(() => {
    if (isNGO) {
      setListingFilters((prev) => ({
        ...prev,
        sortBy: prev.sortBy === 'created' ? 'recommended' : prev.sortBy,
      }));
    }
  }, [isNGO]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const res = await adminAPI.getStats();
          setData({ type: 'admin', stats: res.data.data });
        } else if (isDonor) {
          const foodParams = {
            limit: 5,
            sortBy: listingFilters.sortBy,
          };
          if (listingFilters.expiry) {
            if (['today', 'tomorrow', 'expired'].includes(listingFilters.expiry)) {
              foodParams.expiry = listingFilters.expiry;
            } else {
              foodParams.expiryWithinHours = listingFilters.expiry;
            }
          }
          const [foodsRes, reqRes] = await Promise.all([
            foodAPI.getMy(foodParams),
            requestAPI.getDonorRequests({ limit: 5 }),
          ]);
          setData({
            type: 'donor',
            foods: foodsRes.data.data.foods,
            foodPagination: foodsRes.data.data.pagination,
            requests: reqRes.data.data.requests,
            reqPagination: reqRes.data.data.pagination,
          });
        } else if (isNGO) {
          const foodParams = {
            status: 'available',
            limit: 5,
            sortBy: listingFilters.sortBy,
          };
          if (listingFilters.expiry) {
            if (['today', 'tomorrow', 'expired'].includes(listingFilters.expiry)) {
              foodParams.expiry = listingFilters.expiry;
            } else {
              foodParams.expiryWithinHours = listingFilters.expiry;
            }
          }
          if (listingFilters.lat && listingFilters.lng) {
            foodParams.lat = listingFilters.lat;
            foodParams.lng = listingFilters.lng;
            foodParams.radiusKm = listingFilters.radiusKm;
          }
          const [foodsRes, reqRes] = await Promise.all([
            foodAPI.getAll(foodParams),
            requestAPI.getNGORequests({ limit: 5 }),
          ]);
          setData({
            type: 'ngo',
            foods: foodsRes.data.data.foods,
            foodPagination: foodsRes.data.data.pagination,
            requests: reqRes.data.data.requests,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, isDonor, isNGO, listingFilters]);

  useEffect(() => {
    if (!isNGO || listingFilters.lat || listingFilters.lng || !navigator.geolocation) return;

    setLocationStatus('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setListingFilters((prev) => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
        }));
        setLocationStatus('Distances are sorted from your current location.');
      },
      () => setLocationStatus('Set your location to calculate distance and radius filters.'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [isNGO, listingFilters.lat, listingFilters.lng]);

  const updateListingFilter = (field, value) => {
    setListingFilters((prev) => ({ ...prev, [field]: value }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported in this browser.');
      return;
    }

    setLocationStatus('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setListingFilters((prev) => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          lng: position.coords.longitude.toString(),
        }));
        setLocationStatus('Showing listings near your current location.');
      },
      () => setLocationStatus('Location permission was blocked. You can still browse all listings.')
    );
  };

  const clearLocation = () => {
    setListingFilters((prev) => ({ ...prev, lat: '', lng: '' }));
    setLocationStatus('');
  };

  const ListingFilters = ({ showLocation = false }) => (
    <div className="dashboard-listing-filters">
      <select
        className="form-select"
        value={listingFilters.expiry}
        onChange={(e) => updateListingFilter('expiry', e.target.value)}
      >
        {expiryOptions.map((option) => (
          <option value={option.value} key={option.value}>{option.label}</option>
        ))}
      </select>
      <select
        className="form-select"
        value={listingFilters.sortBy}
        onChange={(e) => updateListingFilter('sortBy', e.target.value)}
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
      {showLocation && (
        <>
          <select
            className="form-select"
            value={listingFilters.radiusKm}
            onChange={(e) => updateListingFilter('radiusKm', e.target.value)}
            disabled={!listingFilters.lat || !listingFilters.lng}
          >
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
          </select>
          <button className="btn btn-secondary btn-sm" type="button" onClick={useCurrentLocation}>
            Use my location
          </button>
          {(listingFilters.lat && listingFilters.lng) && (
            <button className="btn btn-outline btn-sm" type="button" onClick={clearLocation}>
              Clear location
            </button>
          )}
          <input
            className="form-input"
            type="number"
            step="any"
            placeholder="Your latitude"
            value={listingFilters.lat}
            onChange={(e) => updateListingFilter('lat', e.target.value)}
          />
          <input
            className="form-input"
            type="number"
            step="any"
            placeholder="Your longitude"
            value={listingFilters.lng}
            onChange={(e) => updateListingFilter('lng', e.target.value)}
          />
        </>
      )}
      {showLocation && locationStatus && (
        <span className="text-sm text-gray dashboard-location-status">{locationStatus}</span>
      )}
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user.name.split(' ')[0]}! 👋</h1>
        <p>Here's what's happening on the platform today.</p>
      </div>

      {/* ADMIN DASHBOARD */}
      {isAdmin && data?.stats && (
        <>
          <div className="stat-grid">
            <StatCard label="Total Users" value={data.stats.users.total} icon="👥" color="blue" />
            <StatCard label="Food Donors" value={data.stats.users.donors} icon="🍽️" color="green" />
            <StatCard label="NGOs" value={data.stats.users.ngos} icon="🤝" color="orange" />
            <StatCard label="Total Listings" value={data.stats.foods.total} icon="🍱" color="green" />
            <StatCard label="Available Food" value={data.stats.foods.available} icon="✅" color="green" />
            <StatCard label="Completed" value={data.stats.foods.completed} icon="🎉" color="blue" />
            <StatCard label="Total Requests" value={data.stats.requests.total} icon="📋" color="orange" />
            <StatCard label="Pending" value={data.stats.requests.pending} icon="⏳" color="red" />
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>👥 Manage Users</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/foods')}>🍱 View Listings</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/requests')}>📋 View Requests</button>
          </div>
        </>
      )}

      {/* DONOR DASHBOARD */}
      {isDonor && data && (
        <>
          <div className="stat-grid">
            <StatCard label="My Listings" value={data.foodPagination?.total ?? 0} icon="🍱" color="green" />
            <StatCard label="Incoming Requests" value={data.reqPagination?.total ?? 0} icon="📬" color="orange" />
            <StatCard
              label="Pending Requests"
              value={data.requests?.filter((r) => r.status === 'pending').length ?? 0}
              icon="⏳" color="red"
            />
          </div>
          <div className="flex gap-3 mb-6">
            <button className="btn btn-primary" onClick={() => navigate('/add-food')}>➕ Add New Listing</button>
            <button className="btn btn-secondary" onClick={() => navigate('/donor-requests')}>📬 View Requests</button>
          </div>

          {data.requests?.length > 0 && (
            <div className="card mb-4">
              <div className="card-header flex justify-between items-center">
                <div>
                  <div className="card-title">Recent Requests</div>
                  <div className="card-subtitle">Latest NGO requests for your food</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/donor-requests')}>View All</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Food Item</th><th>Requested By</th><th>Status</th><th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.requests.map((r) => (
                      <tr key={r._id}>
                        <td><strong>{r.food?.title}</strong></td>
                        <td>{r.ngo?.name}</td>
                        <td><Badge status={r.status} /></td>
                        <td>{formatDateTime(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.foods?.length > 0 && (
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <div>
                  <div className="card-title">My Recent Listings</div>
                  <div className="card-subtitle">Your latest food donations by expiry</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-foods')}>View All</button>
              </div>
              <ListingFilters />
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Title</th><th>Quantity</th><th>Status</th><th>Expires</th></tr>
                  </thead>
                  <tbody>
                    {data.foods.map((f) => (
                      <tr key={f._id}>
                        <td><strong>{f.title}</strong></td>
                        <td>{f.quantity}</td>
                        <td><Badge status={f.status} /></td>
                        <td>{formatDate(f.expiryTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* NGO DASHBOARD */}
      {isNGO && data && (
        <>
          <div className="stat-grid">
            <StatCard label="Available Food" value={data.foodPagination?.total ?? 0} icon="🍱" color="green" />
            <StatCard label="My Requests" value={data.requests?.length ?? 0} icon="📋" color="blue" />
            <StatCard
              label="Accepted"
              value={data.requests?.filter((r) => r.status === 'accepted').length ?? 0}
              icon="✅" color="green"
            />
          </div>
          <div className="flex gap-3 mb-6">
            <button className="btn btn-primary" onClick={() => navigate('/foods')}>🔍 Browse Available Food</button>
            <button className="btn btn-secondary" onClick={() => navigate('/ngo-requests')}>📋 My Requests</button>
          </div>

          {data.foods?.length > 0 && (
            <div className="card mb-4">
              <div className="card-header flex justify-between items-center">
                <div>
                  <div className="card-title">Available Food Nearby</div>
                  <div className="card-subtitle">Available listings filtered by distance and expiry</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/foods')}>Browse All</button>
              </div>
              <ListingFilters showLocation />
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Priority</th>
                      <th>Safety Gate</th>
                      <th>Urgency</th>
                      <th>Distance</th>
                      <th>Remaining Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.foods.map((f) => (
                      <tr key={f._id}>
                        <td>
                          <strong>{f.title}</strong>
                          <br />
                          <span style={{ fontSize: '11.5px', color: 'var(--gray-500)' }}>{f.donor?.name}</span>
                        </td>
                        <td>{f.quantity}</td>
                        <td><PriorityBadge score={f.priority?.score} /></td>
                        <td><SafetyBadge safety={f.foodSafety} /></td>
                        <td><UrgencyBadge urgency={f.urgency} /></td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                            {typeof f.distanceKm === 'number'
                              ? formatDistance(f.distanceKm)
                              : listingFilters.lat && listingFilters.lng
                                ? formatDistance(f.distance?.km)
                                : 'Set location to calculate'}
                          </span>
                          {f.location?.address && (
                            <div style={{ fontSize: '11.5px', color: 'var(--gray-400)', marginTop: '2px' }}>{f.location.address}</div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '12.5px', fontWeight: '500' }}>
                            {getRemainingTime(f.expiryTime)}
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                            {formatDate(f.expiryTime)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.requests?.length > 0 && (
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <div>
                  <div className="card-title">My Recent Requests</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ngo-requests')}>View All</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Food Item</th><th>Donor</th><th>Status</th><th>Requested</th></tr>
                  </thead>
                  <tbody>
                    {data.requests.map((r) => (
                      <tr key={r._id}>
                        <td><strong>{r.food?.title}</strong></td>
                        <td>{r.donor?.name}</td>
                        <td><Badge status={r.status} /></td>
                        <td>{formatDateTime(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
