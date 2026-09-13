//src/views/StudentAttendance.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, FileText, Calendar } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

export default function StudentAttendance({ currentUser }) {
  const [term, setTerm] = useState('First Term (2025/2026)');
  const [filterType, setFilterType] = useState('All Days'); // 'All Days' | 'This Week' | 'This Month' | 'This Term'
  const [summary, setSummary] = useState({ present: 36, late: 3, absent: 1, excused: 0, percentage: 92 });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudentAttendance = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/attendance/student-portal');
        if (res.data?.success) {
          setSummary(res.data.summary);
          setRecords(res.data.records);
        }
      } catch (err) {
        console.error('Failed fetching student attendance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentAttendance();
  }, [term]);

  return (
    <div style={{ padding: '24px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* GREETING & TERM CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>
            Good Morning, {currentUser?.firstName || 'Martins'} ☀️
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
            Here's your attendance record for the current term.
          </p>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '8px 14px', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', display: 'block' }}>CURRENT TERM</span>
          <select 
            value={term}
            onChange={e => setTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="First Term (2025/2026)" style={{ background: '#0f172a' }}>First Term (2025/2026)</option>
            <option value="Second Term (2025/2026)" style={{ background: '#0f172a' }}>Second Term (2025/2026)</option>
          </select>
        </div>
      </div>

      {/* METRIC COUNTERS + DONUT OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        
        {/* COUNTER GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <div style={{ background: '#052e16', border: '1px solid #15803d', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <CheckCircle size={24} color="#22c55e" style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#22c55e' }}>{summary.present}</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#86efac', textTransform: 'uppercase' }}>Present</div>
          </div>

          <div style={{ background: '#451a03', border: '1px solid #b45309', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <Clock size={24} color="#f59e0b" style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#f59e0b' }}>{summary.late}</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#fde68a', textTransform: 'uppercase' }}>Late</div>
          </div>

          <div style={{ background: '#450a0a', border: '1px solid #b91c1c', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <XCircle size={24} color="#ef4444" style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#ef4444' }}>{summary.absent}</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#fca5a5', textTransform: 'uppercase' }}>Absent</div>
          </div>

          <div style={{ background: '#172554', border: '1px solid #1d4ed8', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <FileText size={24} color="#3b82f6" style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#3b82f6' }}>{summary.excused}</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#93c5fd', textTransform: 'uppercase' }}>Excused</div>
          </div>
        </div>

        {/* DONUT SUMMARY SIDEBAR */}
        <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: `conic-gradient(#22c55e ${summary.percentage}%, #1e293b 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px' }}>
              {summary.percentage}%
            </div>
          </div>

          <div style={{ fontSize: '11px', lineHeight: '1.8' }}>
            <div><span style={{ color: '#22c55e' }}>● Present:</span> <strong>{summary.present}</strong></div>
            <div><span style={{ color: '#f59e0b' }}>● Late:</span> <strong>{summary.late}</strong></div>
            <div><span style={{ color: '#ef4444' }}>● Absent:</span> <strong>{summary.absent}</strong></div>
            <div><span style={{ color: '#3b82f6' }}>● Excused:</span> <strong>{summary.excused}</strong></div>
          </div>
        </div>

      </div>

      {/* ATTENDANCE RECORDS TABLE */}
      <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Attendance Records</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Your daily attendance for the current term.</p>
          </div>

          <div style={{ display: 'flex', gap: '6px', background: '#020617', padding: '4px', borderRadius: '8px' }}>
            {['All Days', 'This Week', 'This Month', 'This Term'].map(t => (
              <button 
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: filterType === t ? '#2563eb' : 'transparent',
                  color: filterType === t ? '#fff' : '#64748b',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ color: '#64748b', borderBottom: '1px solid #1e293b', fontSize: '11px' }}>
              <th style={{ padding: '10px' }}>DATE</th>
              <th style={{ padding: '10px' }}>DAY</th>
              <th style={{ padding: '10px' }}>STATUS</th>
              <th style={{ padding: '10px' }}>ATTENDANCE</th>
            </tr>
          </thead>
          <tbody>
            {(records.length > 0 ? records : [
              { date: '2025-08-21', day: 'Thu', status: 'Present' },
              { date: '2025-08-20', day: 'Wed', status: 'Present' },
              { date: '2025-08-19', day: 'Tue', status: 'Late' },
              { date: '2025-08-18', day: 'Mon', status: 'Absent' },
              { date: '2025-08-15', day: 'Fri', status: 'Present' },
              { date: '2025-08-13', day: 'Wed', status: 'Excused' }
            ]).map((rec, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{rec.date}</td>
                <td style={{ padding: '12px 10px', color: '#94a3b8' }}>{rec.day || 'Mon'}</td>
                <td style={{ padding: '12px 10px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '50px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: rec.status === 'Present' ? 'rgba(34,197,94,0.15)' : rec.status === 'Late' ? 'rgba(245,158,11,0.15)' : rec.status === 'Absent' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                    color: rec.status === 'Present' ? '#22c55e' : rec.status === 'Late' ? '#f59e0b' : rec.status === 'Absent' ? '#ef4444' : '#3b82f6'
                  }}>
                    ● {rec.status}
                  </span>
                </td>
                <td style={{ padding: '12px 10px', fontWeight: 'bold', color: rec.status === 'Present' ? '#22c55e' : rec.status === 'Late' ? '#f59e0b' : rec.status === 'Absent' ? '#ef4444' : '#3b82f6' }}>
                  {rec.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}