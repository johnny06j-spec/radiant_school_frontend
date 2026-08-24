// src/pages/SystemSettings.jsx
import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import API from '../api/axiosInstance';

const SystemSettings = () => {
  const [session, setSession] = useState('2026/2027');
  const [term, setTerm] = useState('First Term');
  const [initialSession, setInitialSession] = useState('2026/2027');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const sessionOptions = ['2025/2026', '2026/2027', '2027/2028', '2028/2029'];
  const termOptions = ['First Term', 'Second Term', 'Third Term'];

  useEffect(() => {
    const fetchCurrentSettings = async () => {
      try {
        const { data } = await API.get('/system/config');
        const config = data?.data || data?.config;
        if (data?.success && config) {
          if (config.currentSession) {
            setSession(config.currentSession);
            setInitialSession(config.currentSession);
          }
          if (config.currentTerm) setTerm(config.currentTerm);
        }
      } catch (err) {
        console.error('Failed to fetch system settings:', err);
      }
    };
    fetchCurrentSettings();
  }, []);

  const isSessionChanging = initialSession && session !== initialSession;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await API.put('/system/config', {
        currentSession: session,
        currentTerm: term,
      });

      const successMsg = data?.message || 'System configurations updated successfully!';
      setMessage({ type: 'success', text: successMsg });
      setInitialSession(session);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        'Network connection error. Failed to save configuration.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '650px',
      margin: '0 auto',
      padding: '1rem 0',
      backgroundColor: 'var(--bg-main)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
    },
    header: {
      marginBottom: '2rem',
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      margin: '0 0 6px 0',
      letterSpacing: '-0.5px',
      color: 'var(--text-primary)',
    },
    subtitle: {
      color: 'var(--text-muted)',
      margin: 0,
      fontSize: '14px',
      fontWeight: '500',
    },
    card: {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: 'var(--shadow-subtle)',
    },
    formGroup: {
      marginBottom: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    label: {
      fontSize: '11px',
      fontWeight: '800',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    select: {
      width: '100%',
      padding: '0.85rem 1rem',
      background: 'var(--bg-input)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      color: 'var(--text-primary)',
      fontSize: '14px',
      fontWeight: '600',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    rolloverNotice: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '12px 14px',
      borderRadius: '8px',
      background: 'rgba(234, 179, 8, 0.08)',
      border: '1px solid rgba(234, 179, 8, 0.25)',
      color: 'var(--accent-warning)',
      fontSize: '12px',
      lineHeight: '1.5',
      marginBottom: '1.5rem',
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      width: '100%',
      padding: '0.85rem',
      background: '#9333ea',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
      marginTop: '1.5rem',
      transition: 'all 0.2s ease',
    },
    alert: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '1.5rem',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
          <Settings size={22} style={{ color: '#9333ea' }} />
          <h1 style={styles.title}>Academic Settings</h1>
        </div>
        <p style={styles.subtitle}>Configure the active system-wide dynamic academic timeline configurations.</p>
      </header>

      <div style={styles.card}>
        {message.text && (
          <div
            style={{
              ...styles.alert,
              background:
                message.type === 'success'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
              border:
                message.type === 'success'
                  ? '1px solid rgba(34, 197, 94, 0.25)'
                  : '1px solid rgba(239, 68, 68, 0.25)',
              color:
                message.type === 'success'
                  ? 'var(--accent-success)'
                  : 'var(--accent-danger)',
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Active Academic Session</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              style={styles.select}
            >
              {sessionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Active Academic Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              style={styles.select}
            >
              {termOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {isSessionChanging && (
            <div style={styles.rolloverNotice}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Academic Session Rollover Trigger:</strong> Changing the session from{' '}
                <span style={{ textDecoration: 'underline' }}>{initialSession}</span> to{' '}
                <span style={{ fontWeight: '800' }}>{session}</span> will automatically execute all approved student promotions and advance all students to the new academic year.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              transform: loading ? 'scale(0.98)' : 'scale(1)',
            }}
          >
            <Save size={18} />
            {loading ? 'Executing Academic Rollover...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SystemSettings;