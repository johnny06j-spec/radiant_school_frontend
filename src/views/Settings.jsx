                     // src/View/Settings.jsx
import React, { useState } from 'react';
import { Lock, Eye, Save } from 'lucide-react';

const Settings = ({ studentData }) => {
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    alert("Security synchronization engine mock triggered.");
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>Account Settings</h2>
        <p style={styles.subtitle}>Configure user access controls and account credentials.</p>
      </header>

      <div style={styles.splitLayout}>
        {/* Profile Card View */}
        <div style={styles.settingBox}>
          <h3 style={styles.boxHeading}>SECURITY GATE CONFIGURATION</h3>
          <form onSubmit={handleUpdatePassword} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>CURRENT SESSION PASSWORD</label>
              <input 
                type="password" 
                style={styles.input} 
                placeholder="••••••••"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>NEW SECURITY ACCESS PIN / PASSWORD</label>
              <input 
                type="password" 
                style={styles.input} 
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>

            <button type="submit" style={styles.saveBtn}>
              <Save size={14} /> <span>Commit Credentials Update</span>
            </button>
          </form>
        </div>

        {/* Identity Context Sheet */}
        <div style={styles.settingBox}>
          <h3 style={styles.boxHeading}>ACCOUNT METADATA CLEARANCE</h3>
          <div style={styles.metaField}>
            <span style={styles.metaLabel}>AUTHORIZED USERNAME</span>
            <span style={styles.metaText}>{studentData?.email || 'student@radiant.edu'}</span>
          </div>
          <div style={styles.metaField}>
            <span style={styles.metaLabel}>REGISTERED ASSIGNED PHONE</span>
            <span style={styles.metaText}>{studentData?.phone || 'Not Available'}</span>
          </div>
          <div style={styles.metaField}>
            <span style={styles.metaLabel}>CLEARANCE LEVEL POOL</span>
            <span style={{ ...styles.metaText, color: '#2563eb', fontWeight: '700' }}>STUDENT ROLE LEVEL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { marginBottom: '0.5rem' },
  title: { margin: 0, fontSize: '22px', fontWeight: '700', color: '#f8fafc' },
  subtitle: { margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' },
  splitLayout: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' },
  settingBox: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.25rem' },
  boxHeading: { margin: '0 0 1.25rem 0', fontSize: '11px', fontWeight: '700', color: '#475569' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '10px', color: '#64748b', fontWeight: '700' },
  input: { background: '#070c17', border: '1px solid #1e293b', color: '#cbd5e1', padding: '10px', borderRadius: '6px', fontSize: '13px', outline: 'none' },
  saveBtn: { background: '#2563eb', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' },
  metaField: { display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '12px', borderBottom: '1px solid #1e293b', marginBottom: '12px' },
  metaLabel: { fontSize: '9px', color: '#475569', fontWeight: '700' },
  metaText: { fontSize: '13px', color: '#cbd5e1' }
};

export default Settings;