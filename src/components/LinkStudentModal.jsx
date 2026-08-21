// src/components/LinkStudentModal.jsx
import React, { useState } from 'react';
import { X, UserPlus, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import API from '../api/axiosInstance';

const LinkStudentModal = ({ isOpen, onClose, onSiblingLinked }) => {
  const [admissionNo, setAdmissionNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setAdmissionNo('');
    setPassword('');
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!admissionNo.trim() || !password) {
      setError("Please enter both Admission Number / Username and Password.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await API.post('/students/link-sibling', {
        admissionNo: admissionNo.trim(),
        password: password
      });

      if (response.data?.success) {
        setSuccessMsg(response.data.message || "Sibling account linked successfully!");
        if (onSiblingLinked) {
          onSiblingLinked(response.data.linkedSiblings || response.data.sibling);
        }
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Link Sibling Error:", err);
      setError(err.response?.data?.message || "Invalid credentials. Failed to link sibling account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.iconCircle}>
              <UserPlus size={18} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 style={styles.title}>Link Another Student</h3>
              <p style={styles.subtitle}>Enter child's login credentials to link their account.</p>
            </div>
          </div>
          <button onClick={handleClose} style={styles.closeBtn}>
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        {/* FEEDBACK ALERTS */}
        {error && (
          <div style={{ ...styles.alertBox, background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)', color: 'var(--accent-danger)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ ...styles.alertBox, background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)', color: 'var(--accent-success)' }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>ADMISSION NUMBER / USERNAME *</label>
            <input 
              type="text" 
              placeholder="e.g. RC/26/8419" 
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>SIBLING PASSWORD *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter child's account password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, paddingRight: '2.5rem' }}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={16} color="var(--text-muted)" /> : <Eye size={16} color="var(--text-muted)" />}
              </button>
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={handleClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>{loading ? 'Authenticating...' : 'Link Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3, 7, 18, 0.75)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  modalCard: { width: '100%', maxWidth: '440px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-main)', boxSizing: 'border-box' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' },
  iconCircle: { width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' },
  subtitle: { margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' },
  closeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' },
  alertBox: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', marginBottom: '14px', border: '1px solid' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  eyeBtn: { position: 'absolute', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  buttonGroup: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' },
  cancelBtn: { background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--accent-primary)', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }
};

export default LinkStudentModal;