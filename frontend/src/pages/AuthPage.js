import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Shared';

const AuthPage = () => {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState('');
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'DONOR', phone: '', organization: '',
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginForm.email || !loginForm.password) return setError('Please fill in all fields.');
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const { name, email, password, confirmPassword, role, phone, organization } = registerForm;
    if (!name || !email || !password) return setError('Name, email, and password are required.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register({ name, email, password, role, phone, organization });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Directly call login API — bypasses Chrome Password Manager interception entirely
  const quickLogin = async (label, email, password) => {
    setError('');
    setDemoLoading(label);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Demo login failed. Make sure you ran: cd backend && npm run seed'
      );
    } finally {
      setDemoLoading('');
    }
  };

  const DEMO_ACCOUNTS = [
    { label: 'Admin', email: 'admin@foodwaste.com', password: 'admin123', color: 'var(--red-500)'   },
    { label: 'Donor', email: 'donor1@example.com',  password: 'donor123', color: 'var(--green-600)' },
    { label: 'NGO',   email: 'ngo1@example.com',    password: 'ngo123',   color: 'var(--blue-600)'  },
  ];

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-emoji">🌿</span>
          <h1>FoodBridge</h1>
          <p>Connecting donors with communities in need</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}>
            Sign In
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}>
            Register
          </button>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                autoComplete="username"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : '🔐 Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Full Name / Organization</label>
              <input className="form-input" type="text" placeholder="Green Valley Restaurant"
                autoComplete="off"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                autoComplete="off"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" placeholder="Repeat password"
                  autoComplete="new-password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">I am a…</label>
              <select className="form-select" value={registerForm.role}
                onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}>
                <option value="DONOR">🍽️ Food Donor (Restaurant / Individual)</option>
                <option value="NGO">🤝 NGO / Food Bank</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone (optional)</label>
                <input className="form-input" type="tel" placeholder="+1-555-000-0000"
                  autoComplete="off"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Organization (optional)</label>
                <input className="form-input" type="text" placeholder="Your org name"
                  autoComplete="off"
                  value={registerForm.organization}
                  onChange={(e) => setRegisterForm({ ...registerForm, organization: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : '🌱 Create Account'}
            </button>
          </form>
        )}

        {/* Quick Demo Login — directly calls login API, never fills the form fields */}
        <div style={{
          marginTop: '20px', padding: '14px',
          background: 'var(--gray-50)', borderRadius: 'var(--radius)',
          border: '1px solid var(--gray-200)',
        }}>
          <p style={{
            fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--gray-400)', marginBottom: '10px',
          }}>
            🧪 Quick Demo Login
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                onClick={() => quickLogin(acc.label, acc.email, acc.password)}
                disabled={!!demoLoading}
                style={{
                  padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                  borderRadius: '20px', border: `1.5px solid ${acc.color}`,
                  background: demoLoading === acc.label ? acc.color : 'white',
                  color: demoLoading === acc.label ? 'white' : acc.color,
                  cursor: demoLoading ? 'not-allowed' : 'pointer',
                  opacity: (demoLoading && demoLoading !== acc.label) ? 0.5 : 1,
                  transition: 'all 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                }}
              >
                {demoLoading === acc.label ? 'Signing in…' : (
                  <>
                    {acc.label === 'Admin' && '🛡️ '}
                    {acc.label === 'Donor' && '🍽️ '}
                    {acc.label === 'NGO'   && '🤝 '}
                    {acc.label}
                  </>
                )}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '8px' }}>
            One click → instant login, no password manager popups.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
