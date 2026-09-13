// src/views/StudentAttendance.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, XCircle, FileText, RefreshCw } from 'lucide-react';
import API from '../api/axiosInstance';

export default function StudentAttendance({ currentUser }) {
  const [term, setTerm] = useState('First Term (2025/2026)');
  const [filterType, setFilterType] = useState('All Days');
  const [summary, setSummary] = useState({ present: 0, late: 0, absent: 0, excused: 0, percentage: 100 });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentAttendance = async () => {
      try {
        setLoading(true);
        const res = await API.get('/attendance/student-portal', { params: { term } });
        if (res.data?.success) {
          setSummary(res.data.summary || { present: 0, late: 0, absent: 0, excused: 0, percentage: 100 });
          setRecords(res.data.records || []);
        }
      } catch (err) {
        console.error('Failed fetching student attendance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentAttendance();
  }, [term]);

  // Client-side Filter Logic
  const filteredRecords = records.filter(rec => {
    if (filterType === 'All Days') return true;
    const recDate = new Date(rec.date);
    const now = new Date();

    if (filterType === 'This Week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return recDate >= oneWeekAgo;
    }
    if (filterType === 'This Month') {
      return recDate.getMonth() === now.getMonth() && recDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return { bg: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' };
      case 'Late':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' };
      case 'Absent':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' };
      case 'Excused':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' };
      default:
        return { bg: 'var(--bg-main)', color: 'var(--text-secondary)' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
        <RefreshCw size={24} className="animate-spin" color="var(--accent-primary)" />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading attendance history...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* GREETING & TERM CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Good Morning, {currentUser?.firstName || 'Student'} ☀️
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0 0' }}>
            Here's your attendance record for the current term.
          </p>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '8px' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>SELECT TERM</span>
          <select 
            value={term}
            onChange={e => setTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="First Term (2025/2026)" style={{ background: 'var(--bg-surface)' }}>First Term (2025/2026)</option>
            <option value="Second Term (2025/2026)" style={{ background: 'var(--bg-surface)' }}>Second Term (2025/2026)</option>
          </select>
        </div>
      </div>

      {/* METRIC COUNTERS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', width: '100%' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
          <CheckCircle2 size={18} color="#22c55e" style={{ margin: '0 auto 4px auto', display: 'block' }} />
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#22c55e' }}>{summary.present}</div>
          <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>PRESENT</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
          <Clock size={18} color="#f59e0b" style={{ margin: '0 auto 4px auto', display: 'block' }} />
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#f59e0b' }}>{summary.late}</div>
          <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>LATE</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
          <XCircle size={18} color="#ef4444" style={{ margin: '0 auto 4px auto', display: 'block' }} />
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#ef4444' }}>{summary.absent}</div>
          <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>ABSENT</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
          <FileText size={18} color="#3b82f6" style={{ margin: '0 auto 4px auto', display: 'block' }} />
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6' }}>{summary.excused}</div>
          <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>EXCUSED</div>
        </div>
      </div>

      {/* ATTENDANCE TABLE CARD */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* CARD CONTROLS HEADER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Daily Records</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Class session attendance log</p>
            </div>
            
            {/* Overall Percentage Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#22c55e' }}>{summary.percentage}% Score</span>
            </div>
          </div>

          {/* RESPONSIVE FILTER PILLS CONTAINER */}
          <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }}>
            {['All Days', 'This Week', 'This Month'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  flex: 1,
                  background: filterType === t ? 'var(--accent-primary)' : 'transparent',
                  color: filterType === t ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '6px 0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* DATA TABLE */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 4px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>DATE</th>
                <th style={{ padding: '8px 4px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>DAY</th>
                <th style={{ padding: '8px 4px', textAlign: 'right', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec, idx) => {
                  const d = new Date(rec.date);
                  const formattedDate = !isNaN(d) ? d.toISOString().split('T')[0] : rec.date;
                  const dayName = !isNaN(d) ? d.toLocaleDateString('en-US', { weekday: 'short' }) : (rec.day || 'N/A');
                  const badge = getStatusBadge(rec.status);

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 4px', color: 'var(--text-primary)', fontWeight: '600' }}>{formattedDate}</td>
                      <td style={{ padding: '10px 4px', color: 'var(--text-muted)', fontSize: '11px' }}>{dayName}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: '800'
                        }}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No attendance logs found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}