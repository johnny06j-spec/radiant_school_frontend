// src/components/teacher/AttendanceTakeDesk.jsx
import React from 'react';
import { CheckCircle, Clock, XCircle, FileText, Save, CheckCheck, AlertCircle } from 'lucide-react';

export default function AttendanceTakeDesk({
  className,
  sessionPeriod,
  setSessionPeriod,
  attendanceDate,
  setAttendanceDate,
  students,
  handleStatusChange,
  handleRemarkChange,
  markAllPresent,
  handleSaveAttendance,
  saving
}) {
  const metrics = {
    present: students.filter(s => s.status === 'Present').length,
    late: students.filter(s => s.status === 'Late').length,
    absent: students.filter(s => s.status === 'Absent').length,
    excused: students.filter(s => s.status === 'Excused').length,
    unmarked: students.filter(s => !s.status).length
  };

  return (
    <>
      {/* CONTROL SELECTORS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#0f172a', padding: '12px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>CLASS</span>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '2px', color: '#38bdf8' }}>{className}</div>
        </div>

        <div style={{ background: '#0f172a', padding: '12px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>SESSION PERIOD</span>
          <select 
            value={sessionPeriod} 
            onChange={e => setSessionPeriod(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontWeight: 'bold', outline: 'none', marginTop: '2px', cursor: 'pointer' }}
          >
            <option value="Morning" style={{ background: '#0f172a' }}>Morning Period</option>
            <option value="Afternoon" style={{ background: '#0f172a' }}>Afternoon Period</option>
          </select>
        </div>

        <div style={{ background: '#0f172a', padding: '12px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>ATTENDANCE DATE</span>
          <input 
            type="date" 
            value={attendanceDate}
            onChange={e => setAttendanceDate(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontWeight: 'bold', outline: 'none', marginTop: '2px' }}
          />
        </div>
      </div>

      {/* COUNTER CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: '#052e16', border: '1px solid #15803d', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} color="#22c55e" />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#22c55e' }}>{metrics.present}</div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#86efac', textTransform: 'uppercase' }}>Present</div>
          </div>
        </div>

        <div style={{ background: '#451a03', border: '1px solid #b45309', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#f59e0b' }}>{metrics.late}</div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#fde68a', textTransform: 'uppercase' }}>Late</div>
          </div>
        </div>

        <div style={{ background: '#450a0a', border: '1px solid #b91c1c', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <XCircle size={20} color="#ef4444" />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#ef4444' }}>{metrics.absent}</div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#fca5a5', textTransform: 'uppercase' }}>Absent</div>
          </div>
        </div>

        <div style={{ background: '#172554', border: '1px solid #1d4ed8', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} color="#3b82f6" />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#3b82f6' }}>{metrics.excused}</div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#93c5fd', textTransform: 'uppercase' }}>Excused</div>
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #475569', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} color="#94a3b8" />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#94a3b8' }}>{metrics.unmarked}</div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase' }}>Unmarked</div>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>Student Attendance</h3>
          <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '360px' }}>
            <button 
              onClick={markAllPresent} 
              style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <CheckCheck size={14} /> Mark All
            </button>
            <button 
              onClick={handleSaveAttendance} 
              disabled={saving}
              style={{ flex: 1, background: '#2563eb', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: '#64748b', borderBottom: '1px solid #1e293b', fontSize: '11px' }}>
                <th style={{ padding: '8px' }}>#</th>
                <th style={{ padding: '8px' }}>STUDENT NAME</th>
                <th style={{ padding: '8px' }}>REG. NO</th>
                <th style={{ padding: '8px' }}>STATUS</th>
                <th style={{ padding: '8px' }}>REMARK</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, idx) => (
                <tr key={st.studentId || idx} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{st.name}</td>
                  <td style={{ padding: '10px 8px', color: '#38bdf8', fontFamily: 'monospace' }}>{st.admissionNo}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <select 
                      value={st.status || ''} 
                      onChange={e => handleStatusChange(idx, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        background: st.status === 'Present' ? 'rgba(34,197,94,0.15)' : st.status === 'Late' ? 'rgba(245,158,11,0.15)' : st.status === 'Absent' ? 'rgba(239,68,68,0.15)' : st.status === 'Excused' ? 'rgba(59,130,246,0.15)' : '#1e293b',
                        color: st.status === 'Present' ? '#22c55e' : st.status === 'Late' ? '#f59e0b' : st.status === 'Absent' ? '#ef4444' : st.status === 'Excused' ? '#3b82f6' : '#94a3b8',
                        border: 'none',
                        outline: 'none'
                      }}
                    >
                      <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>-- Select --</option>
                      <option value="Present" style={{ background: '#0f172a', color: '#22c55e' }}>● Present</option>
                      <option value="Late" style={{ background: '#0f172a', color: '#f59e0b' }}>● Late</option>
                      <option value="Absent" style={{ background: '#0f172a', color: '#ef4444' }}>● Absent</option>
                      <option value="Excused" style={{ background: '#0f172a', color: '#3b82f6' }}>● Excused</option>
                    </select>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <input 
                      type="text" 
                      value={st.remark || ''}
                      placeholder="Add note..."
                      onChange={e => handleRemarkChange(idx, e.target.value)}
                      style={{ background: '#020617', border: '1px solid #1e293b', padding: '6px 8px', borderRadius: '6px', color: '#fff', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}