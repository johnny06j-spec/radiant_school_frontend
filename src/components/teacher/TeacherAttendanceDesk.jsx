// src/components/teacher/TeacherAttendanceDesk.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, XCircle, FileText, Save, 
  Eye, FileSpreadsheet, CheckCheck, Lock, UserCheck 
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

export default function TeacherAttendanceDesk({ currentUser }) {
  const [activeTab, setActiveTab] = useState('take-attendance');
  const [className, setClassName] = useState(currentUser?.assignedClass || currentUser?.classTeacherOf || 'JSS 1');
  const [sessionPeriod, setSessionPeriod] = useState('Morning');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isNotClassTeacher, setIsNotClassTeacher] = useState(false);

  const [showBroadsheet, setShowBroadsheet] = useState(false);

  const fetchAttendanceSheet = async () => {
    try {
      setLoading(true);
      setIsNotClassTeacher(false);
      const res = await axiosInstance.get('/attendance/class-sheet', {
        params: { className, date: attendanceDate, sessionPeriod }
      });
      setStudents(res.data?.data || []);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.isNotClassTeacher) {
        setIsNotClassTeacher(true);
      } else {
        console.error('Failed fetching attendance sheet', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'take-attendance') {
      fetchAttendanceSheet();
    }
  }, [className, attendanceDate, sessionPeriod, activeTab]);

  const handleStatusChange = (index, status) => {
    const updated = [...students];
    updated[index].status = status;
    setStudents(updated);
  };

  const handleRemarkChange = (index, remark) => {
    const updated = [...students];
    updated[index].remark = remark;
    setStudents(updated);
  };

  const markAllPresent = () => {
    setStudents(students.map(s => ({ ...s, status: 'Present' })));
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      await axiosInstance.post('/attendance/save', {
        className,
        date: attendanceDate,
        sessionPeriod,
        term: 'First Term',
        session: '2026/2027',
        records: students
      });
      alert('Attendance recorded successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  const metrics = {
    present: students.filter(s => s.status === 'Present').length,
    late: students.filter(s => s.status === 'Late').length,
    absent: students.filter(s => s.status === 'Absent').length,
    excused: students.filter(s => s.status === 'Excused').length,
  };

  // 🔒 RESTRICTED LOCK VIEW FOR UNASSIGNED TEACHERS
  if (isNotClassTeacher) {
    return (
      <div style={{ padding: '30px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '40px', maxWidth: '650px', margin: '40px auto', textAlign: 'center' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: '#ef4444' }}>
            <Lock size={32} />
          </div>
          
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 10px 0' }}>Class Teacher Assignment Required</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
            Only the designated Class Teacher for <strong style={{ color: '#38bdf8' }}>{className}</strong> can mark and manage daily attendance for this class.
          </p>

          <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '12px' }}>
              HOW ACCESS RIGHTS WORK:
            </div>
            
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
              <li>
                <strong>Primary Section:</strong> Class teachers are automatically assigned to their room (e.g., KG 1, Primary 2).
              </li>
              <li>
                <strong>Secondary Section:</strong> School management explicitly assigns one designated Class Teacher per secondary arm (JSS 1 - SSS 3).
              </li>
              <li>
                Subject teachers taking secondary classes cannot mark daily register attendance unless assigned as Class Teacher for that form.
              </li>
            </ul>
          </div>

          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '8px', padding: '10px 14px', color: '#22c55e', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={16} /> This rule guarantees accurate attendance records & accountability.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER & TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>
            {activeTab === 'take-attendance' ? 'Take Attendance' : 'Attendance Reports'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0 0' }}>
            {activeTab === 'take-attendance' 
              ? 'Mark and manage your class attendance for the day.' 
              : 'Generate and download attendance records for your class.'}
          </p>
        </div>

        <div style={{ display: 'flex', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <button 
            onClick={() => setActiveTab('take-attendance')}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'take-attendance' ? '#2563eb' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
          >
            Take Attendance
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: activeTab === 'reports' ? '#2563eb' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
          >
            Attendance Reports
          </button>
        </div>
      </div>

      {activeTab === 'take-attendance' ? (
        <>
          {/* CONTROL SELECTORS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: '#0f172a', padding: '12px 16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>CLASS</span>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '2px', color: '#38bdf8' }}>{className}</div>
            </div>

            <div style={{ background: '#0f172a', padding: '12px 16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>SESSION PERIOD</span>
              <select 
                value={sessionPeriod} 
                onChange={e => setSessionPeriod(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontWeight: 'bold', outline: 'none', marginTop: '2px' }}
              >
                <option value="Morning" style={{ background: '#0f172a' }}>Morning Period</option>
                <option value="Afternoon" style={{ background: '#0f172a' }}>Afternoon Period</option>
              </select>
            </div>

            <div style={{ background: '#0f172a', padding: '12px 16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#052e16', border: '1px solid #15803d', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <CheckCircle size={28} color="#22c55e" />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#22c55e' }}>{metrics.present}</div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#86efac', textTransform: 'uppercase' }}>Present</div>
              </div>
            </div>

            <div style={{ background: '#451a03', border: '1px solid #b45309', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Clock size={28} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>{metrics.late}</div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#fde68a', textTransform: 'uppercase' }}>Late</div>
              </div>
            </div>

            <div style={{ background: '#450a0a', border: '1px solid #b91c1c', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <XCircle size={28} color="#ef4444" />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>{metrics.absent}</div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#fca5a5', textTransform: 'uppercase' }}>Absent</div>
              </div>
            </div>

            <div style={{ background: '#172554', border: '1px solid #1d4ed8', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <FileText size={28} color="#3b82f6" />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>{metrics.excused}</div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#93c5fd', textTransform: 'uppercase' }}>Excused</div>
              </div>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Student Attendance</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={markAllPresent} 
                  style={{ background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCheck size={14} /> Mark All Present
                </button>
                <button 
                  onClick={handleSaveAttendance} 
                  disabled={saving}
                  style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '1px solid #1e293b', fontSize: '11px' }}>
                  <th style={{ padding: '10px' }}>#</th>
                  <th style={{ padding: '10px' }}>STUDENT NAME</th>
                  <th style={{ padding: '10px' }}>REG. NO</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                  <th style={{ padding: '10px' }}>REMARK</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st, idx) => (
                  <tr key={st.studentId} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 10px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{st.name}</td>
                    <td style={{ padding: '12px 10px', color: '#38bdf8', fontFamily: 'monospace' }}>{st.admissionNo}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <select 
                        value={st.status} 
                        onChange={e => handleStatusChange(idx, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          background: st.status === 'Present' ? 'rgba(34,197,94,0.15)' : st.status === 'Late' ? 'rgba(245,158,11,0.15)' : st.status === 'Absent' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                          color: st.status === 'Present' ? '#22c55e' : st.status === 'Late' ? '#f59e0b' : st.status === 'Absent' ? '#ef4444' : '#3b82f6',
                          border: 'none',
                          outline: 'none'
                        }}
                      >
                        <option value="Present" style={{ background: '#0f172a', color: '#22c55e' }}>● Present</option>
                        <option value="Late" style={{ background: '#0f172a', color: '#f59e0b' }}>● Late</option>
                        <option value="Absent" style={{ background: '#0f172a', color: '#ef4444' }}>● Absent</option>
                        <option value="Excused" style={{ background: '#0f172a', color: '#3b82f6' }}>● Excused</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <input 
                        type="text" 
                        value={st.remark}
                        placeholder="Add note..."
                        onChange={e => handleRemarkChange(idx, e.target.value)}
                        style={{ background: '#020617', border: '1px solid #1e293b', padding: '6px 10px', borderRadius: '6px', color: '#fff', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* REPORTS TAB */
        <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end', marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>CLASS</label>
              <select value={className} onChange={e => setClassName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#020617', color: '#fff', border: '1px solid #1e293b', marginTop: '4px' }}>
                <option value={className}>{className}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>PERIOD</label>
              <select style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#020617', color: '#fff', border: '1px solid #1e293b', marginTop: '4px' }}>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>WEEK RANGE</label>
              <input type="text" value="7 Sep - 11 Sep 2026" readOnly style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#020617', color: '#fff', border: '1px solid #1e293b', marginTop: '4px' }} />
            </div>
            <button 
              onClick={() => setShowBroadsheet(true)}
              style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '9px 18px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileSpreadsheet size={16} /> Generate Report
            </button>
          </div>

          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Recent Reports</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: '#64748b', borderBottom: '1px solid #1e293b', fontSize: '10px' }}>
                <th style={{ padding: '10px' }}>DATE RANGE</th>
                <th style={{ padding: '10px' }}>CLASS</th>
                <th style={{ padding: '10px' }}>TYPE</th>
                <th style={{ padding: '10px' }}>GENERATED ON</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>7 Sep - 11 Sep 2026</td>
                <td style={{ padding: '12px 10px' }}>{className}</td>
                <td style={{ padding: '12px 10px' }}>Weekly</td>
                <td style={{ padding: '12px 10px', color: '#94a3b8' }}>10 Sep 2026, 10:24 AM</td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                  <button onClick={() => setShowBroadsheet(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginRight: '6px' }}>Download</button>
                  <button onClick={() => setShowBroadsheet(true)} style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}><Eye size={12} /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* PRINTABLE BROADSHEET MODAL */}
      {showBroadsheet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', color: '#000', width: '100%', maxWidth: '850px', padding: '30px', borderRadius: '8px', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'sans-serif' }}>
            
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e3a8a' }}>RADIANT INTELLECTUALS' COLLEGE</h2>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Knowledge • Discipline • Excellence</div>
              <h3 style={{ margin: '10px 0 0 0', fontSize: '14px', background: '#1e3a8a', color: '#fff', padding: '4px 0', textTransform: 'uppercase' }}>WEEKLY ATTENDANCE RECORD</h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '16px', fontWeight: 'bold' }}>
              <div>
                <div>Class: {className}</div>
                <div>Class Teacher: {currentUser?.name || 'Mr. Adeboye'}</div>
                <div>Week: 7 Sep - 11 Sep 2026</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>Term: First Term</div>
                <div>Session: Morning</div>
                <div>Academic Year: 2026/2027</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', border: '1px solid #000' }}>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>S/N</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>STUDENT NAME</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>REG. NO</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>MON 7/09</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>TUE 8/09</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>WED 9/09</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>THU 10/09</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>FRI 11/09</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>TOTAL PRESENT</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>TOTAL ABSENT</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>ATTENDANCE %</th>
                </tr>
              </thead>
              <tbody style={{ textAlign: 'center' }}>
                {students.map((st, i) => (
                  <tr key={st.studentId}>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>{st.name}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{st.admissionNo}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>P</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>P</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>P</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>P</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>P</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>5</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>0</td>
                    <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>100%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '11px' }}>
              <div>
                <div>Teacher's Signature: __________________</div>
                <div style={{ marginTop: '4px' }}>Date: {new Date().toLocaleDateString()}</div>
              </div>
              <div>
                <div>Principal/HM Signature: __________________</div>
                <div style={{ marginTop: '4px' }}>Date: ______________</div>
              </div>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'right' }}>
              <button onClick={() => window.print()} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginRight: '8px' }}>Print Broadsheet</button>
              <button onClick={() => setShowBroadsheet(false)} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}