import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = {
  DONOR: [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'My Listings', icon: '🍱', path: '/my-foods' },
    { label: 'Add Listing', icon: '➕', path: '/add-food' },
    { label: 'Incoming Requests', icon: '📬', path: '/donor-requests' },
    { label: 'Browse All', icon: '🔍', path: '/foods' },
  ],
  NGO: [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'Browse Food', icon: '🔍', path: '/foods' },
    { label: 'My Requests', icon: '📋', path: '/ngo-requests' },
  ],
  ADMIN: [
    { label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { label: 'All Users', icon: '👥', path: '/admin/users' },
    { label: 'All Listings', icon: '🍱', path: '/admin/foods' },
    { label: 'All Requests', icon: '📋', path: '/admin/requests' },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;
  const items = NAV_ITEMS[user.role] || [];
  const initials = user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🌿</span>
        <div>
          <div className="logo-text">FoodBridge</div>
          <div className="logo-sub">Waste Redistribution</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-label">Navigation</div>
          {items.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user.name?.split(' ')[0]}</div>
            <span className={`user-role role-${user.role}`}>{user.role}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={logout}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
