// src/components/admin/AdminReleaseDesk.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, RotateCcw, Download, Archive, 
  Layers, X, RefreshCw, Building2, GraduationCap, AlertTriangle 
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const PRIMARY_CLASSES = ['KG 1', 'KG 2', 'Nursery 1', 'Nursery 2', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5'];
const SECONDARY_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

export default function AdminReleaseDesk() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'history'
  const [section, setSection] = useState('PRIMARY');
  const [className, setClassName] = useState('KG 1');
  
  const [term, setTerm] = useState('Second Term');
  const [session, setSession] = useState('2026/2027');

  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Return to HM / Principal Modal State
  const [returnModal, setReturnModal] = useState({ open: false, student: null, reason: '' });

  const classes = section === 'PRIMARY' ? PRIMARY_CLASSES : SECONDARY_CLASSES;

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/teachers/admin-approved-reviews', {
        params: { className, term, session, section, _t: Date.now() }
      });
      setQueue(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch approved review queue:', err);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/teachers/released-history', {
        params: { className, term, session, _t: Date.now() }
      });
      setHistory(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch release history:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueue();
    } else {
      fetchHistory();
    }
  }, [className, term, session, section, activeTab]);

  const handleRelease = async () => {
    if (queue.length === 0) return;
    if (!window.confirm(`Publish ${queue.length} approved result(s) for ${className} (${term}, ${session}) to Student Portals?`)) {
      return;
    }

    setReleasing(true);
    setFeedback(null);

    try {
      const res = await axiosInstance.post('/teachers/admin-release-results', {
        className,
        term,
        session
      });
      setFeedback({ type: 'success', msg: res.data?.message || `Successfully released results for ${className}.` });
      fetchQueue();
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        msg: err.response?.data?.message || 'Failed to publish results to portals.' 
      });
    } finally {
      setReleasing(false);
    }
  };

  const submitReturn = async () => {
    if (!returnModal.reason.trim()) {
      alert('Please provide a specific reason for returning this result.');
      return;
    }

    try {
      const res = await axiosInstance.post('/teachers/admin-return-results', {
        reviewId: returnModal.student?.reviewId,
        studentId: returnModal.student?._id,
        className,
        term,
        session,
        reason: returnModal.reason.trim()
      });

      setFeedback({ 
        type: 'success', 
        msg: res.data?.message || `Result for ${returnModal.student?.name} returned for correction.` 
      });
      setReturnModal({ open: false, student: null, reason: '' });
      fetchQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return result record.');
    }
  };

  const handleDownload = async (targetId) => {
    try {
      const res = await axiosInstance.get(`/teachers/download-result-pdf/${targetId}`, {
        params: {
          term,
          session,
          className,
          _t: Date.now()
        },
        responseType: 'text'
      });

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(res.data);
        printWindow.document.close();
      }
    } catch (err) {
      console.error('PDF view error:', err);
      alert('Could not render result sheet. Please verify student review data.');
    }
  };

  return (
    <div style={{ padding: '1rem 0', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--text-primary)' }}>
      
      {/* HEADER & TAB NAVIGATION */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>Result Release Desk</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Audit and publish verified Headmaster & Principal signed-off results to student portals.
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setActiveTab('queue')}
            style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: activeTab === 'queue' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'queue' ? '#fff' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle size={16} /> Ready for Release ({queue.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: activeTab === 'history' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'history' ? '#fff' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Archive size={16} /> Released Archive
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {feedback && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '20px', backgroundColor: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: feedback.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)', border: `1px solid ${feedback.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* SECTION CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div 
          onClick={() => { setSection('PRIMARY'); setClassName('KG 1'); }}
          style={{ padding: '14px', borderRadius: '10px', border: section === 'PRIMARY' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', backgroundColor: section === 'PRIMARY' ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <Building2 size={24} style={{ color: section === 'PRIMARY' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '13px' }}>Primary School Section (Headmaster)</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>KG 1 to Basic 5 broadsheets</div>
          </div>
        </div>

        <div 
          onClick={() => { setSection('SECONDARY'); setClassName('JSS 1'); }}
          style={{ padding: '14px', borderRadius: '10px', border: section === 'SECONDARY' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)', backgroundColor: section === 'SECONDARY' ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <GraduationCap size={24} style={{ color: section === 'SECONDARY' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '13px' }}>Secondary School Section (Principal)</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JSS 1 to SSS 3 broadsheets</div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', backgroundColor: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>TARGET CLASS</label>
          <select value={className} onChange={(e) => setClassName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '12px', marginTop: '4px', outline: 'none' }}>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>ACADEMIC TERM</label>
          <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '12px', marginTop: '4px', outline: 'none' }}>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>SESSION</label>
          <select value={session} onChange={(e) => setSession(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '12px', marginTop: '4px', outline: 'none' }}>
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
            <option value="2027/2028">2027/2028</option>
          </select>
        </div>
      </div>

      {/* QUEUE TAB */}
      {activeTab === 'queue' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>{className} Release Queue</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Genuinely signed-off results waiting for publication</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={fetchQueue} 
                  disabled={loading} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                >
                  <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Data
                </button>

                {queue.length > 0 && (
                  <button 
                    onClick={handleRelease} 
                    disabled={releasing} 
                    style={{ padding: '8px 16px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle size={14} /> {releasing ? 'Releasing...' : `Release ${className} Results (${queue.length})`}
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontSize: '10px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px' }}>Student Name</th>
                    <th style={{ padding: '10px' }}>Admission No</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Term Average</th>
                    <th style={{ padding: '10px' }}>Executive Remark</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.length > 0 ? queue.map((st) => (
                    <tr key={st.reviewId || st._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{st.name}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{st.admissionNo}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-success)' }}>{st.termAverage}%</td>
                      <td style={{ padding: '12px 10px', fontStyle: 'italic', color: 'var(--text-muted)' }}>"{st.executiveRemark}"</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleDownload(st.studentId || st._id)}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Download size={12} /> View PDF
                          </button>
                          <button 
                            onClick={() => setReturnModal({ open: true, student: st, reason: '' })}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <RotateCcw size={12} /> Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {loading ? 'Checking approval state...' : `No signed-off results waiting for release in ${className} (${term}, ${session}).`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ARCHIVE TAB */
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Released Archive</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>History of successfully published results for {className} ({term}, {session})</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontSize: '10px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px' }}>Student Name</th>
                  <th style={{ padding: '10px' }}>Admission No</th>
                  <th style={{ padding: '10px' }}>Class</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Average</th>
                  <th style={{ padding: '10px' }}>Released Date</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Report Card</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? history.map((st) => (
                  <tr key={st._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{st.name}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--accent-primary)', fontFamily: 'monospace' }}>{st.admissionNo}</td>
                    <td style={{ padding: '12px 10px' }}>{st.className}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-success)' }}>{Number(st.overallAverage || 0).toFixed(2)}%</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{st.releasedAt ? new Date(st.releasedAt).toLocaleDateString() : 'Released'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDownload(st.studentId || st._id)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Download size={12} /> Download
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No published results archived for {className} ({term}, {session}).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {returnModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', maxWidth: '440px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={16} /> Return Result to {section === 'PRIMARY' ? 'Headmaster' : 'Principal'}
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Returning result record for <strong style={{ color: 'var(--text-primary)' }}>{returnModal.student?.name}</strong> ({returnModal.student?.admissionNo}).
            </p>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>REASON FOR RETURN</label>
              <textarea 
                rows="3"
                value={returnModal.reason}
                onChange={(e) => setReturnModal({ ...returnModal, reason: e.target.value })}
                placeholder="e.g. Missing practical assessment or remarks need correction..."
                style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => setReturnModal({ open: false, student: null, reason: '' })}
                style={{ padding: '8px 14px', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={submitReturn}
                style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--accent-danger)', color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Confirm & Return
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}