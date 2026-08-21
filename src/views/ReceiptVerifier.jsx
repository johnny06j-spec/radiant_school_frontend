// src/views/ReceiptVerifier.jsx
import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Search, Loader2, Calendar, User, FileText, CheckCircle2, GraduationCap, Printer, Clock } from 'lucide-react';

const ReceiptVerifier = () => {
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setLoading(true);
    setError('');
    setReceiptData(null);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/finance/verify-receipt?reference=${encodeURIComponent(reference.trim())}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success && result.data) {
        setReceiptData(result.data);
      } else {
        setError(result.message || "Invalid Receipt Reference. No authentic matches found in system database records.");
      }
    } catch (err) {
      console.error("💥 Receipt authentication process error:", err);
      setError("Network runtime exception connecting to secure audit log engine.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintClearance = () => {
    window.print();
  };

  // 🟢 Safe Name Resolution
  const resolvedStudentName = receiptData?.studentName || 
    (receiptData?.studentId ? `${receiptData.studentId.surname || ''} ${receiptData.studentId.firstName || ''}`.trim() : null) || 
    "Active Student";

  // 🟢 Safe Class Resolution
  const resolvedClass = receiptData?.className || 
    receiptData?.studentClass || 
    receiptData?.studentId?.currentClass || 
    receiptData?.studentId?.assignedClass || 
    "N/A";

  // 🟢 Safe Timestamp Resolution
  const rawDate = receiptData?.paidAt || receiptData?.createdAt || receiptData?.date || receiptData?.updatedAt;
  const resolvedPaidAt = rawDate 
    ? new Date(rawDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) 
    : "N/A";

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Receipt Authentication Desk</h1>
        <p style={styles.subtitle}>Cross-reference transaction keys or scan system tokens to eliminate forge vectors instantly.</p>
      </header>

      <div style={styles.layoutGrid}>
        {/* Search Console Input Block */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Verify Unique Reference ID</h3>
          <form onSubmit={handleVerify} style={styles.form}>
            <div style={styles.inputWrapper}>
              <Search size={16} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Enter Receipt No. or Transaction Ref (e.g. RAD-SYHSA4ULX...)" 
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                style={styles.input}
              />
            </div>
            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Run Cryptographic Audit'}
            </button>
          </form>

          {error && (
            <div style={styles.errorBox}>
              <ShieldAlert size={18} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--accent-danger)', display: 'block', marginBottom: '2px' }}>Authentication Failure</strong>
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Audit Results Stream Display Frame */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Live Database Verification Feed</h3>
          
          {receiptData ? (
            <div style={styles.feedBox}>
              <div style={styles.verifiedBadge}>
                <CheckCircle2 size={20} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
                <span style={{ fontWeight: '800', color: 'var(--accent-success)', fontSize: '13px', letterSpacing: '0.3px' }}>
                  AUTHENTIC TRANSACTION RECORD FOUND
                </span>
              </div>

              <div style={styles.gridDetails}>
                <div style={styles.detailRow}>
                  <User size={14} style={styles.rowIcon} /> 
                  <span style={styles.detailLabel}>Student:</span> 
                  <strong style={styles.detailValue}>{resolvedStudentName}</strong>
                </div>

                <div style={styles.detailRow}>
                  <FileText size={14} style={styles.rowIcon} /> 
                  <span style={styles.detailLabel}>Admission No:</span> 
                  <strong style={{ ...styles.detailValue, color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                    {receiptData.admissionNo || receiptData.studentId?.admissionNo || "N/A"}
                  </strong>
                </div>

                <div style={styles.detailRow}>
                  <GraduationCap size={14} style={styles.rowIcon} /> 
                  <span style={styles.detailLabel}>Student Class:</span> 
                  <strong style={styles.detailValue}>{resolvedClass}</strong>
                </div>

                <div style={styles.detailRow}>
                  <Calendar size={14} style={styles.rowIcon} /> 
                  <span style={styles.detailLabel}>Session / Term:</span> 
                  <strong style={styles.detailValue}>{receiptData.session} ({receiptData.term || 'First Term'})</strong>
                </div>

                <div style={styles.detailRow}>
                  <ShieldCheck size={14} style={styles.rowIcon} /> 
                  <span style={styles.detailLabel}>Payment Mode:</span> 
                  <strong style={styles.detailValue}>{receiptData.paymentMethod || receiptData.channel || 'Online Gateway Channel'}</strong>
                </div>

                <div style={styles.detailRow}>
                  <Clock size={14} style={styles.rowIcon} /> 
                  <span style={styles.detailLabel}>Payment Date:</span> 
                  <strong style={styles.detailValue}>{resolvedPaidAt}</strong>
                </div>
              </div>

              <div style={styles.totalBlock}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>
                  VERIFIED SYSTEM COLLECTION VALUE
                </span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--accent-success)' }}>
                  ₦{(Number(receiptData.amountPaid || receiptData.amount) || 0).toLocaleString('en-NG')}
                </span>
              </div>

              <button onClick={handlePrintClearance} style={styles.printBtn}>
                <Printer size={14} /> <span>Print Verification Slip</span>
              </button>
            </div>
          ) : error ? (
            <div style={styles.unverifiedCard}>
              <ShieldAlert size={42} color="var(--accent-danger)" style={{ marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 6px 0', color: 'var(--accent-danger)', fontSize: '15px', fontWeight: '800' }}>
                FORGED OR UNRECORDED TRANSACTION
              </h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', lineHeight: '1.5' }}>
                The reference code <code style={{ color: 'var(--text-primary)', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{reference}</code> does not match any authenticated ledger record in the system.
              </p>
            </div>
          ) : (
            <div style={styles.emptyFeed}>
              <ShieldCheck size={48} strokeWidth={1} style={{ marginBottom: '1rem', color: 'var(--border-color)' }} />
              <span>Awaiting input query execution. Verified receipts will stream record parameters here securely.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { marginBottom: '0.5rem' },
  title: { fontSize: '28px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.5px', color: 'var(--text-primary)' },
  subtitle: { color: 'var(--text-muted)', margin: 0, fontSize: '14px', fontWeight: '500' },
  layoutGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' },
  card: { background: 'var(--bg-surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: 'var(--shadow-subtle)' },
  cardTitle: { margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '0.3px' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '12px', color: 'var(--text-muted)' },
  input: { background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '0.75rem 0.75rem 0.75rem 2.5rem', color: 'var(--text-primary)', fontSize: '13px', borderRadius: '6px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  btn: { background: '#9333ea', border: 'none', color: '#ffffff', padding: '0.75rem', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  errorBox: { background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '0.75rem 1rem', display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-primary)', fontSize: '12px' },
  emptyFeed: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '0 2rem' },
  unverifiedCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', background: 'rgba(239, 68, 68, 0.04)', border: '1px dashed rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '1.5rem' },
  feedBox: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  verifiedBadge: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.75rem 1rem', borderRadius: '6px' },
  gridDetails: { display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' },
  detailRow: { display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)' },
  detailLabel: { width: '120px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' },
  detailValue: { color: 'var(--text-primary)', fontSize: '13px' },
  rowIcon: { marginRight: '10px', color: 'var(--text-muted)', flexShrink: 0 },
  totalBlock: { display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-main)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)' },
  printBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--accent-primary)', border: 'none', color: '#ffffff', padding: '0.65rem', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }
};

export default ReceiptVerifier;