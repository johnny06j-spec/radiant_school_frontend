// src/components/teacher/TeacherAttendanceDesk.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, XCircle, FileText, Save, 
  Eye, FileSpreadsheet, CheckCheck, Lock, UserCheck, AlertCircle 
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

export default function TeacherAttendanceDesk({ currentUser }) {
  const [activeTab, setActiveTab] = useState('take-attendance');
  
  // Dynamic assigned class resolution
  const userAssignedClass = currentUser?.assignedClass || currentUser?.classTeacherOf || currentUser?.assignedClasses?.[0] || 'KG 1';
  const [className, setClassName] = useState(userAssignedClass);
  const [sessionPeriod, setSessionPeriod] = useState('Morning');
  
  // Separate date states for taking attendance vs generating reports
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState([]);
  const [recentReportsList, setRecentReportsList] = useState([]);
  const [activeReportWeek, setActiveReportWeek] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isNotClassTeacher, setIsNotClassTeacher] = useState(false);
  const [showBroadsheet, setShowBroadsheet] = useState(false);

  // Helper function to derive Monday and Friday bounds + 5 daily ISO dates
  const getWeekBounds = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    
    const monday = new Date(d.setDate(diffToMon));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const formatShort = (dt) => `${dt.getDate()} ${dt.toLocaleString('en-US', { month: 'short' })}`;
    const formatFull = (dt) => `${dt.getDate()} ${dt.toLocaleString('en-US', { month: 'short' })} ${dt.getFullYear()}`;

    // Generate individual day labels & ISO dates (MON 14/09, TUE 15/09, etc.)
    const weekDays = [0, 1, 2, 3, 4].map(i => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const name = ['MON', 'TUE', 'WED', 'THU', 'FRI'][i];
      const dd = String(dayDate.getDate()).padStart(2, '0');
      const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
      const isoDate = dayDate.toISOString().split('T')[0];
      return { label: `${name} ${dd}/${mm}`, isoDate };
    });

    return {
      monday,
      friday,
      rangeString: `${formatFull(monday)} - ${formatFull(friday)}`,
      shortRange: `${formatShort(monday)} - ${formatShort(friday)} ${monday.getFullYear()}`,
      weekDays
    };
  };

  const currentTakeWeek = getWeekBounds(attendanceDate);
  const currentReportWeek = getWeekBounds(reportDate);

  // Sync className when currentUser prop resolves/updates
  useEffect(() => {
    if (currentUser) {
      const assigned = currentUser?.assignedClass || currentUser?.classTeacherOf || currentUser?.assignedClasses?.[0];
      if (assigned) {
        setClassName(assigned);
      }
    }
  }, [currentUser]);

  const fetchAttendanceSheet = async () => {
    if (!className) return;
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

  const fetchWeeklyReport = async (targetWeekBounds) => {
    if (!className) return;
    try {
      setLoading(true);
      const bounds = targetWeekBounds || currentReportWeek;
      const startDate = bounds.monday.toISOString().split('T')[0];
      const endDate = bounds.friday.toISOString().split('T')[0];

      const res = await axiosInstance.get('/attendance/weekly-report', {
        params: { className, startDate, endDate, sessionPeriod }
      });
      setWeeklyReport(res.data?.data || []);
      setActiveReportWeek(bounds);
    } catch (err) {
      console.error('Failed fetching weekly report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'take-attendance' && className) {
      fetchAttendanceSheet();
    }
  }, [className, attendanceDate, sessionPeriod, activeTab]);

  const handleGenerateReport = async () => {
    await fetchWeeklyReport(currentReportWeek);
    
    // Add report to history list if unique
    const newEntry = {
      id: `${currentReportWeek.shortRange}-${sessionPeriod}-${className}`,
      dateRange: currentReportWeek.shortRange,
      className,
      sessionPeriod,
      generatedOn: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      bounds: currentReportWeek
    };

    setRecentReportsList(prev => {
      const exists = prev.some(r => r.id === newEntry.id);
      return exists ? prev : [newEntry, ...prev];
    });

    setShowBroadsheet(true);
  };

  const handleOpenSavedReport = async (reportItem) => {
    await fetchWeeklyReport(reportItem.bounds);
    setShowBroadsheet(true);
  };

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
    const unmarked = students.filter(s => !s.status);
    if (unmarked.length > 0) {
      alert(`Please select a status for all students. ${unmarked.length} student(s) currently unmarked.`);
      return;
    }

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
      fetchAttendanceSheet();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusSymbol = (status) => {
    switch (status) {
      case 'Present': return 'P';
      case 'Late': return 'L';
      case 'Absent': return 'A';
      case 'Excused': return 'E';
      default: return '-';
    }
  };

  const metrics = {
    present: students.filter(s => s.status === 'Present').length,
    late: students.filter(s => s.status === 'Late').length,
    absent: students.filter(s => s.status === 'Absent').length,
    excused: students.filter(s => s.status === 'Excused').length,
    unmarked: students.filter(s => !s.status).length
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

  const activeWeekBounds = activeReportWeek || currentReportWeek;

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#052e16', border: '1px solid #15803d', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={24} color="#22c55e" />
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#22c55e' }}>{metrics.present}</div>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#86efac', textTransform: 'uppercase' }}>Present</div>
              </div>
            </div>

            <div style={{ background: '#451a03', border: '1px solid #b45309', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={24} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#f59e0b' }}>{metrics.late}</div>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#fde68a', textTransform: 'uppercase' }}>Late</div>
              </div>
            </div>

            <div style={{ background: '#450a0a', border: '1px solid #b91c1c', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <XCircle size={24} color="#ef4444" />
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#ef4444' }}>{metrics.absent}</div>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#fca5a5', textTransform: 'uppercase' }}>Absent</div>
              </div>
            </div>

            <div style={{ background: '#172554', border: '1px solid #1d4ed8', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={24} color="#3b82f6" />
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#3b82f6' }}>{metrics.excused}</div>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#93c5fd', textTransform: 'uppercase' }}>Excused</div>
              </div>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #475569', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={24} color="#94a3b8" />
              <div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#94a3b8' }}>{metrics.unmarked}</div>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase' }}>Unmarked</div>
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
                        value={st.status || ''} 
                        onChange={e => handleStatusChange(idx, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          background: st.status === 'Present' ? 'rgba(34,197,94,0.15)' : st.status === 'Late' ? 'rgba(245,158,11,0.15)' : st.status === 'Absent' ? 'rgba(239,68,68,0.15)' : st.status === 'Excused' ? 'rgba(59,130,246,0.15)' : '#1e293b',
                          color: st.status === 'Present' ? '#22c55e' : st.status === 'Late' ? '#f59e0b' : st.status === 'Absent' ? '#ef4444' : st.status === 'Excused' ? '#3b82f6' : '#94a3b8',
                          border: 'none',
                          outline: 'none'
                        }}
                      >
                        <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>-- Select Status --</option>
                        <option value="Present" style={{ background: '#0f172a', color: '#22c55e' }}>● Present</option>
                        <option value="Late" style={{ background: '#0f172a', color: '#f59e0b' }}>● Late</option>
                        <option value="Absent" style={{ background: '#0f172a', color: '#ef4444' }}>● Absent</option>
                        <option value="Excused" style={{ background: '#0f172a', color: '#3b82f6' }}>● Excused</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <input 
                        type="text" 
                        value={st.remark || ''}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end', marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>CLASS</label>
              <select value={className} onChange={e => setClassName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#020617', color: '#fff', border: '1px solid #1e293b', marginTop: '4px' }}>
                <option value={className}>{className}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>REGISTER PERIOD</label>
              <select value={sessionPeriod} onChange={e => setSessionPeriod(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#020617', color: '#fff', border: '1px solid #1e293b', marginTop: '4px' }}>
                <option value="Morning">Morning Period</option>
                <option value="Afternoon">Afternoon Period</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>SELECT DATE</label>
              <input 
                type="date" 
                value={reportDate} 
                onChange={e => setReportDate(e.target.value)} 
                style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#020617', color: '#fff', border: '1px solid #1e293b', marginTop: '4px', fontWeight: 'bold' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>WEEK RANGE</label>
              <input type="text" value={currentReportWeek.shortRange} readOnly style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#020617', color: '#fff', border: '1px solid #1e293b', marginTop: '4px', fontWeight: 'bold', opacity: 0.8 }} />
            </div>
            <button 
              onClick={handleGenerateReport} 
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
                <th style={{ padding: '10px' }}>SESSION</th>
                <th style={{ padding: '10px' }}>GENERATED ON</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {recentReportsList.length === 0 ? (
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{currentReportWeek.shortRange}</td>
                  <td style={{ padding: '12px 10px' }}>{className}</td>
                  <td style={{ padding: '12px 10px', color: '#38bdf8' }}>{sessionPeriod}</td>
                  <td style={{ padding: '12px 10px', color: '#94a3b8' }}>Current Selected Week</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <button onClick={handleGenerateReport} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginRight: '6px' }}>Download</button>
                    <button onClick={handleGenerateReport} style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}><Eye size={12} /></button>
                  </td>
                </tr>
              ) : (
                recentReportsList.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{item.dateRange}</td>
                    <td style={{ padding: '12px 10px' }}>{item.className}</td>
                    <td style={{ padding: '12px 10px', color: '#38bdf8' }}>{item.sessionPeriod}</td>
                    <td style={{ padding: '12px 10px', color: '#94a3b8' }}>{item.generatedOn}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button onClick={() => handleOpenSavedReport(item)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginRight: '6px' }}>Download</button>
                      <button onClick={() => handleOpenSavedReport(item)} style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}><Eye size={12} /></button>
                    </td>
                  </tr>
                ))
              )}
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
              <h3 style={{ margin: '10px 0 0 0', fontSize: '14px', background: '#1e3a8a', color: '#fff', padding: '4px 0', textTransform: 'uppercase' }}>
                WEEKLY ATTENDANCE RECORD ({sessionPeriod.toUpperCase()} SESSION)
              </h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '16px', fontWeight: 'bold' }}>
              <div>
                <div>Class: {className}</div>
                <div>Class Teacher: {currentUser?.firstName ? `${currentUser.firstName} ${currentUser.surname || ''}` : currentUser?.name || 'Mr. Adeboye'}</div>
                <div>Week: {activeWeekBounds.rangeString}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>Term: First Term</div>
                <div>Register Session: {sessionPeriod}</div>
                <div>Academic Year: 2026/2027</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', border: '1px solid #000' }}>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>S/N</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>STUDENT NAME</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>REG. NO</th>
                  {activeWeekBounds.weekDays.map((wd, i) => (
                    <th key={i} style={{ border: '1px solid #000', padding: '6px' }}>{wd.label}</th>
                  ))}
                  <th style={{ border: '1px solid #000', padding: '6px' }}>TOTAL PRESENT</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>TOTAL ABSENT</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>ATTENDANCE %</th>
                </tr>
              </thead>
              <tbody style={{ textAlign: 'center' }}>
                {(weeklyReport.length > 0 ? weeklyReport : students).map((st, i) => (
                  <tr key={st.studentId || i}>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>{st.name}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{st.admissionNo}</td>
                    
                    {/* Dynamic columns for Monday through Friday */}
                    {activeWeekBounds.weekDays.map((wd, idx) => {
                      const dayStatus = st.logsByDate ? st.logsByDate[wd.isoDate] : '';
                      return (
                        <td key={idx} style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>
                          {getStatusSymbol(dayStatus)}
                        </td>
                      );
                    })}

                    <td style={{ border: '1px solid #000', padding: '6px' }}>{st.present ?? (st.status === 'Present' ? 1 : 0)}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{st.absent ?? (st.status === 'Absent' ? 1 : 0)}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>{st.attendancePercentage ?? 100}%</td>
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
