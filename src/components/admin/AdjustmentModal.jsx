// src/components/admin/AdjustmentModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, ShieldAlert, Tag, Lock } from 'lucide-react';
import API from '../../api/axiosInstance';

const AdjustmentModal = ({ isOpen, onClose, student, onAdjustmentApplied }) => {
  const [session, setSession] = useState('2026/2027');
  const [term, setTerm] = useState('First Term');
  const [reason, setReason] = useState('');
  
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🔒 1. Fetch System Settings to lock Session & Term to active operational term
  useEffect(() => {
    if (!isOpen) return;

    const fetchSystemSettings = async () => {
      setLoadingSettings(true);
      try {
        const response = await API.get('/system/config');
        const configData = response.data?.data || response.data?.config || response.data;

        if (configData?.currentSession) setSession(configData.currentSession);
        if (configData?.currentTerm) setTerm(configData.currentTerm);
      } catch (err) {
        console.warn("⚠️ System settings fetch failed in modal, using active defaults:", err);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSystemSettings();
  }, [isOpen]);

  // 🟢 2. Fetch student fee breakdown for active Session & Term once resolved
  useEffect(() => {
    if (!isOpen || !student || !session || !term) return;

    const fetchStudentFees = async () => {
      setLoadingItems(true);
      try {
        const studentId = student._id || student.id;
        const response = await API.get(`/finance/student-ledger/${studentId}`, {
          params: {
            term: term.trim(),
            session: session.trim()
          }
        });

        const result = response.data;
        if (result?.success && result?.data) {
          const mappedItems = (result.data.items || []).map(item => ({
            name: item.name,
            amount: Number(item.amount) || 0,
            originalAmount: Number(item.amount) || 0,
            isOriginal: true 
          }));
          setItems(mappedItems);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("💥 Failed loading student fee rows:", err);
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchStudentFees();
  }, [isOpen, student, session, term]);

  if (!isOpen || !student) return null;

  const handleAddItemRow = () => {
    setItems([...items, { name: '', amount: '', originalAmount: 0, isOriginal: false }]);
  };

  const handleRemoveRow = (index) => {
    const targetItem = items[index];
    
    if (targetItem.isOriginal) {
      const updated = [...items];
      updated[index].amount = 0;
      setItems(updated);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const calculatedStackTotal = items.reduce(
    (sum, item) => sum + (typeof item.amount === 'string' ? Number(item.amount) || 0 : item.amount || 0), 
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some(item => !item.name.trim() || Number(item.amount) < 0)) {
      alert("Please ensure all item rows have valid names and valid positive values.");
      return;
    }
    if (!reason.trim()) {
      alert("Please provide an official justification note for auditing requirements.");
      return;
    }

    setSubmitting(true);
    const studentId = student._id || student.id;

    try {
      await Promise.all(
        items.map(item => {
          let adjustmentType = 'Fee Increase';
          let finalAmount = Number(item.amount);

          if (item.isOriginal) {
            const difference = finalAmount - item.originalAmount;
            if (difference === 0) return Promise.resolve();
            
            if (difference < 0) {
              adjustmentType = 'Discount';
              finalAmount = Math.abs(difference);
            } else {
              adjustmentType = 'Fee Increase';
              finalAmount = difference;
            }
          }

          return API.post('/finance/adjustment', {
            studentId,
            type: adjustmentType,
            amount: finalAmount,
            term: term.trim(),
            session: session.trim(),
            reason: `[Matrix Modification for: ${item.name}] - ${reason}`
          });
        })
      );

      alert("Individual student fee matrix adjustments committed successfully!");
      if (onAdjustmentApplied) onAdjustmentApplied();
      onClose();
      setReason('');
    } catch (error) {
      console.error("💥 Failed saving student matrix overrides:", error);
      alert(error.response?.data?.message || "Server connection runtime fault committing profile overrides.");
    } finally {
      setSubmitting(false);
    }
  };

  const getRowTag = (item) => {
    if (!item.isOriginal) {
      return { text: 'Custom Add', bg: 'rgba(147, 51, 234, 0.15)', color: '#a855f7' };
    }
    
    const current = Number(item.amount) || 0;
    const original = Number(item.originalAmount) || 0;
    
    if (current === original) {
      return { text: 'Original', bg: '#1f2937', color: '#94a3b8' };
    }
    
    return current > original 
      ? { text: 'Increased', bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }
      : { text: 'Reduced', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalBox}>
        <header style={styles.header}>
          <div>
            <h3 style={styles.title}>Adjust Individual Student Fees</h3>
            <p style={styles.subtitle}>Modifying layout matrices directly for {student.name || `${student.firstName || ''} ${student.surname || student.lastName || ''}`}</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* 🔒 LOCKED ACADEMIC SESSION & TERM INPUTS */}
          <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>
                ACADEMIC SESSION <span style={{ color: '#d97706', fontSize: '9px' }}>(System Locked)</span>
              </label>
              <div style={styles.lockedWrapper}>
                <Lock size={12} style={{ color: '#d97706', marginRight: '6px' }} />
                <input
                  type="text"
                  value={session}
                  disabled
                  style={styles.lockedInput}
                />
              </div>
            </div>

            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>
                TARGET TERM <span style={{ color: '#d97706', fontSize: '9px' }}>(System Locked)</span>
              </label>
              <div style={styles.lockedWrapper}>
                <Lock size={12} style={{ color: '#d97706', marginRight: '6px' }} />
                <input
                  type="text"
                  value={term}
                  disabled
                  style={styles.lockedInput}
                />
              </div>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <div style={styles.tableHeaderRow}>
              <span style={{ flex: 2, fontSize: '10px', color: '#64748b', fontWeight: '800' }}>FEE ITEM NAME</span>
              <span style={{ flex: 1.5, fontSize: '10px', color: '#64748b', fontWeight: '800', textAlign: 'center' }}>ADJUSTMENT TAG</span>
              <span style={{ flex: 1, fontSize: '10px', color: '#64748b', fontWeight: '800', textAlign: 'right', paddingRight: '2.5rem' }}>AMOUNT (₦)</span>
            </div>

            {loadingItems || loadingSettings ? (
              <div style={styles.centerBox}>
                <Loader2 size={16} className="spin-loader animate-spin" style={{ color: '#3b82f6' }} />
                <span>Loading active term fee breakdown...</span>
              </div>
            ) : (
              <div style={styles.tableRowsStack}>
                {items.map((item, index) => {
                  const tag = getRowTag(item);
                  return (
                    <div key={index} style={styles.tableDataRow}>
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                        placeholder="e.g. Special Practical Fee"
                        style={styles.tableInput}
                        disabled={item.isOriginal} 
                      />
                      
                      <div style={{ flex: 1.5, display: 'flex', justifyContent: 'center' }}>
                        <span style={{ ...styles.badge, background: tag.bg, color: tag.color }}>
                          <Tag size={10} style={{ marginRight: '4px' }} />
                          {tag.text}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <input 
                          type="number" 
                          value={item.amount} 
                          onChange={(e) => handleRowChange(index, 'amount', e.target.value)}
                          placeholder="0"
                          style={{ 
                            ...styles.tableInput, 
                            textAlign: 'right',
                            borderColor: item.isOriginal && Number(item.amount) !== item.originalAmount ? tag.color : '#1f2937'
                          }}
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveRow(index)} 
                          style={{ ...styles.deleteRowBtn, color: '#ef4444', opacity: 1, cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div style={styles.emptyBox}>No active fee rules configured for this session/term.</div>
                )}
              </div>
            )}

            <div style={styles.tableFooterActions}>
              <button type="button" onClick={handleAddItemRow} style={styles.addBtnRow}>
                <Plus size={14} />
                <span>Add Custom Item Row</span>
              </button>

              <div style={styles.totalStackBox}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800' }}>ADJUSTED TOTAL BILL</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#10b981' }}>₦{calculatedStackTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>OFFICIAL JUSTIFICATION REASON / NOTES</label>
            <textarea 
              rows={2} 
              placeholder="Provide context for this individual fee audit track..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ ...styles.input, resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div style={styles.warningBox}>
            <ShieldAlert size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <p style={styles.warningText}>
              Submitting updates calculates differences automatically and locks an audit log entry strictly under System Settings active term.
            </p>
          </div>

          <footer style={styles.footer}>
            <button type="button" onClick={onClose} disabled={submitting} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || loadingItems || loadingSettings} style={styles.submitBtn}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Commit Structure Updates'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modalBox: { background: '#0b0f19', border: '1px solid #1f2937', borderRadius: '12px', width: '100%', maxWidth: '650px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.5rem', borderBottom: '1px solid #1f2937' },
  title: { margin: 0, color: '#fff', fontSize: '16px', fontWeight: '700' },
  subtitle: { margin: '4px 0 0 0', color: '#64748b', fontSize: '12px' },
  closeBtn: { background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 },
  form: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  row: { display: 'flex', gap: '1rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.5px' },
  input: { background: '#030712', border: '1px solid #1f2937', borderRadius: '6px', padding: '0.75rem', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box', width: '100%' },
  
  lockedWrapper: { display: 'flex', alignItems: 'center', background: '#090f1d', border: '1px solid #d9770633', borderRadius: '6px', padding: '0 0.75rem' },
  lockedInput: { background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '13px', fontWeight: '700', padding: '0.75rem 0', width: '100%', cursor: 'not-allowed' },

  tableContainer: { border: '1px solid #1f2937', borderRadius: '8px', background: '#030712', overflow: 'hidden' },
  tableHeaderRow: { display: 'flex', padding: '0.75rem 1rem', background: '#0b0f19', borderBottom: '1px solid #1f2937' },
  tableRowsStack: { display: 'flex', flexDirection: 'column', maxHeight: '200px', overflowY: 'auto' },
  tableDataRow: { display: 'flex', padding: '0.5rem 1rem', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #111827' },
  tableInput: { flex: 2, background: '#090f1d', border: '1px solid #1f2937', padding: '0.5rem', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' },
  deleteRowBtn: { background: 'transparent', border: 'none', display: 'flex', padding: '4px' },
  tableFooterActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#0b0f19', borderTop: '1px solid #1f2937' },
  addBtnRow: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#090f1d', border: '1px solid #1f2937', padding: '6px 12px', color: '#94a3b8', fontSize: '12px', fontWeight: '700', borderRadius: '6px', cursor: 'pointer' },
  totalStackBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  
  centerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '2rem', color: '#64748b', fontSize: '12px' },
  emptyBox: { padding: '1.5rem', textAlign: 'center', color: '#4b5563', fontSize: '12px', fontStyle: 'italic' },
  warningBox: { background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '6px', padding: '0.75rem 1rem', display: 'flex', gap: '10px', alignItems: 'center' },
  warningText: { margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  cancelBtn: { background: 'transparent', border: '1px solid #1f2937', borderRadius: '6px', padding: '0.65rem 1.25rem', color: '#94a3b8', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  submitBtn: { background: '#9333ea', border: 'none', borderRadius: '6px', padding: '0.65rem 1.25rem', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }
};

export default AdjustmentModal;