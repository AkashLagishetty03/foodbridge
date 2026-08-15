import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute, PublicRoute } from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import FoodListings from './pages/FoodListings';
import MyFoods from './pages/MyFoods';
import AddFood from './pages/AddFood';
import DonorRequests from './pages/DonorRequests';
import NGORequests from './pages/NGORequests';
import AdminUsers from './pages/AdminUsers';
import AdminFoods from './pages/AdminFoods';
import AdminRequests from './pages/AdminRequests';

// App shell wraps authenticated pages with sidebar + topbar
const AppShell = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">
      <Topbar />
      <main className="page-content">{children}</main>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><AuthPage /></PublicRoute>} />

          {/* Authenticated routes (all roles) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppShell><Dashboard /></AppShell>
            </ProtectedRoute>
          } />
          <Route path="/foods" element={
            <ProtectedRoute>
              <AppShell><FoodListings /></AppShell>
            </ProtectedRoute>
          } />

          {/* DONOR only */}
          <Route path="/my-foods" element={
            <RoleRoute roles={['DONOR']}>
              <AppShell><MyFoods /></AppShell>
            </RoleRoute>
          } />
          <Route path="/add-food" element={
            <RoleRoute roles={['DONOR']}>
              <AppShell><AddFood /></AppShell>
            </RoleRoute>
          } />
          <Route path="/donor-requests" element={
            <RoleRoute roles={['DONOR']}>
              <AppShell><DonorRequests /></AppShell>
            </RoleRoute>
          } />

          {/* NGO only */}
          <Route path="/ngo-requests" element={
            <RoleRoute roles={['NGO']}>
              <AppShell><NGORequests /></AppShell>
            </RoleRoute>
          } />

          {/* ADMIN only */}
          <Route path="/admin/users" element={
            <RoleRoute roles={['ADMIN']}>
              <AppShell><AdminUsers /></AppShell>
            </RoleRoute>
          } />
          <Route path="/admin/foods" element={
            <RoleRoute roles={['ADMIN']}>
              <AppShell><AdminFoods /></AppShell>
            </RoleRoute>
          } />
          <Route path="/admin/requests" element={
            <RoleRoute roles={['ADMIN']}>
              <AppShell><AdminRequests /></AppShell>
            </RoleRoute>
          } />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🍃</div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--gray-800)' }}>Page Not Found</h2>
              <p style={{ color: 'var(--gray-500)', marginTop: '8px' }}>The page you're looking for doesn't exist.</p>
              <a href="/dashboard" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', background: 'var(--green-600)', color: 'white', borderRadius: 'var(--radius)', fontWeight: '600', fontSize: '14px' }}>
                Go to Dashboard
              </a>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
