// src/views/AcademicRecords.jsx
import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Download, CheckCircle2, Loader2, CreditCard } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const AcademicRecords = ({ activeStudent }) => {
  const [loading, setLoading] = useState(true);
  const [resultState, setResultState] = useState({
    isReleased: false,
    isCleared: false,
    outstandingBalance: 0,
    data: null,
    message: ''
  });

  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('2026/2027');

  const fetchStudentResult = async () => {
    if (!activeStudent?._id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Direct call to teachers/my-results route
      const res = await axiosInstance.get(`/teachers/my-results/${activeStudent._id}`, {
        params: {
          term: selectedTerm,
          session: selectedSession
        }
      });

      if (res.data?.success) {
        setResultState({
          isReleased: res.data.isReleased ?? false,
          isCleared: res.data.isCleared ?? true,
          outstandingBalance: res.data.outstandingBalance || 0,
          data: res.data.data || null,
          message: res.data.message || ''
        });
      } else {
        setResultState({
          isReleased: false,
          isCleared: true,
          outstandingBalance: 0,
          data: null,
          message: res.data?.message || 'No performance records found.'
        });
      }
    } catch (err) {
      console.error("Error loading performance record:", err);
      setResultState({
        isReleased: false,
        isCleared: true,
        outstandingBalance: 0,
        data: null,
        message: 'Could not connect to server to verify performance records.'
      });
    } finally {
      setLoading(false); // Guarantees spinner stops
    }
  };

  useEffect(() => {
    fetchStudentResult();
  }, [activeStudent?._id, selectedTerm, selectedSession]);

  const handlePrintPDF = async () => {
    try {
      const response = await axiosInstance.get(`/teachers/download-result-pdf/${activeStudent._id}`, {
        params: { term: selectedTerm, session: selectedSession },
        responseType: 'text'
      });

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(response.data);
        printWindow.document.close();
      }
    } catch (err) {
      alert("Failed to render printable report card.");
    }
  };

  return (
    <div style={{ padding: '1.5rem', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER & TERM SELECTOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Academic Performance Records</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
            Official term report cards and continuous assessment sheets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px', outline: 'none' }}
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>

          <select 
            value={selectedSession} 
            onChange={(e) => setSelectedSession(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px', outline: 'none' }}
          >
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
          </select>
        </div>
      </div>

      {/* RENDER LOGIC */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <Loader2 size={28} className="spin-loader" style={{ color: '#38bdf8', marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Verifying release status and financial clearance...</p>
        </div>
      ) : !resultState.isReleased ? (
        <div style={{ padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <AlertCircle size={36} style={{ color: '#f59e0b', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '800' }}>No Performance Slips Released</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            {resultState.message || `Continuous assessment sheets for ${activeStudent?.assignedClass || activeStudent?.currentClass || 'this class'} are currently undergoing executive audit reviews.`}
          </p>
        </div>
      ) : !resultState.isCleared ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Lock size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#f87171' }}>Academic Result Access Restricted</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#cbd5e1', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
            Your term report card has been processed and approved by the Executive Desk. However, access is locked due to an outstanding fee balance of <strong style={{ color: '#ef4444' }}>₦{resultState.outstandingBalance?.toLocaleString()}</strong>.
          </p>
          <button 
            onClick={() => window.location.href = '/portal/finance'}
            style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <CreditCard size={16} /> Clear Outstanding Fees Now
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={22} style={{ color: '#10b981' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Official Report Card Available</h3>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>Financially Cleared & Verified</span>
              </div>
            </div>

            <button 
              onClick={handlePrintPDF}
              style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} /> Download / Print Report Card
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', backgroundColor: '#1e293b', padding: '1rem', borderRadius: '8px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Class:</span>{' '}
              <strong>{activeStudent?.currentClass || activeStudent?.assignedClass}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Overall Average:</span>{' '}
              <strong style={{ color: '#38bdf8' }}>{resultState.data?.overallAverage || 0}%</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Decision:</span>{' '}
              <strong style={{ color: '#10b981' }}>
                {resultState.data?.promotionDecision && resultState.data.promotionDecision !== 'N/A'
                  ? resultState.data.promotionDecision
                  : 'PASSED'}
              </strong>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AcademicRecords;