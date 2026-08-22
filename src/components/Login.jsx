// src/components/Login.jsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import API from '../api/axiosInstance';
import schoolLogo from '../assets/Logo.jpg';

const Login = () => {
  const [credentials, setCredentials] = useState({ usernameOrEmail: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sends login request payload cleanly to /auth/login
      const response = await API.post('/auth/login', {
        usernameOrEmail: credentials.usernameOrEmail.trim(),
        password: credentials.password
      });

      if (response.data.success) {
        // 1. Save auth credentials to local storage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // 2. Redirect dynamically based on the returned user role
        const role = (response.data.user?.role || '').toLowerCase();

        if (role === 'admin') {
          window.location.href = '/admin-dashboard';
        } else if (role === 'teacher' || role === 'principal' || role === 'headmaster') {
          // 🟢 Headmaster role included to navigate directly to Faculty Workspace
          window.location.href = '/teacher-dashboard';
        } else if (role === 'student') {
          window.location.href = '/student-dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setError(response.data.message || 'Access Gate authentication failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Access Gate authentication failed. Verify connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#091124', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div style={{ background: '#192239', padding: '3rem 2.2rem', borderRadius: '8px', width: '430px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', border: '1px solid #232d4b', textAlign: 'center' }}>
        
        {/* Logo Container */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div style={{ width: '105px', height: '105px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <img 
              src={schoolLogo} 
              alt="Radiant College Emblem" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
        </div>

        {/* Brand Header */}
        <h1 style={{ fontSize: '25px', fontWeight: '800', letterSpacing: '0.8px', margin: '0 0 6px 0', color: '#ffffff' }}>RADIANT COLLEGE</h1>
        <p style={{ color: '#566681', fontSize: '13px', margin: '0 0 2rem 0', fontWeight: '600', letterSpacing: '0.3px' }}>Portal Engine Access Gate</p>

        {error && (
          <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '13px', textAlign: 'left', border: '1px solid #991b1b' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {/* Email / Username field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '13px', color: '#cbd5e1', fontWeight: '600', letterSpacing: '0.2px' }}>Email Address / Username</label>
            <input 
              type="text" 
              name="usernameOrEmail" 
              placeholder="Email or RAD/26/XXXX"
              value={credentials.usernameOrEmail} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '0.95rem 1.1rem', borderRadius: '6px', border: '1px solid #24304f', backgroundColor: '#0d162d', color: '#fff', boxSizing: 'border-box', fontSize: '14px', letterSpacing: '0.3px' }} 
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <label style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '600', letterSpacing: '0.2px' }}>Security Key / Password</label>
              <a href="#forgot" style={{ color: '#2563eb', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}>Forgot Password?</a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                name="password" 
                placeholder="••••••••"
                value={credentials.password} 
                onChange={handleChange} 
                required 
                style={{ width: '100%', padding: '0.95rem 2.75rem 0.95rem 1.1rem', borderRadius: '8px', border: '1px solid #24304f', backgroundColor: '#0d162d', color: '#fff', boxSizing: 'border-box', fontSize: '14px', letterSpacing: '0.3px', outline: 'none' }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '1rem', borderRadius: '6px', border: 'none', backgroundColor: '#1d58f3', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', letterSpacing: '0.2px' }}
          >
            {loading ? 'Verifying Gateway...' : 'Authenticate Credentials'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;