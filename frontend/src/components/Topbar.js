import React from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your activity' },
  '/foods': { title: 'Browse Food', subtitle: 'Available food listings near you' },
  '/my-foods': { title: 'My Listings', subtitle: 'Manage your food donations' },
  '/add-food': { title: 'Add Listing', subtitle: 'Share food with those who need it' },
  '/donor-requests': { title: 'Incoming Requests', subtitle: 'Review NGO requests for your food' },
  '/ngo-requests': { title: 'My Requests', subtitle: 'Track your food pickup requests' },
  '/admin/users': { title: 'User Management', subtitle: 'Manage all platform users' },
  '/admin/foods': { title: 'Food Listings', subtitle: 'Admin view of all food listings' },
  '/admin/requests': { title: 'All Requests', subtitle: 'Admin view of all requests' },
};

const Topbar = () => {
  const location = useLocation();
  const info = PAGE_TITLES[location.pathname] || { title: 'FoodBridge', subtitle: '' };

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{info.title}</div>
        {info.subtitle && <div className="topbar-subtitle">{info.subtitle}</div>}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </header>
  );
};

export default Topbar;
