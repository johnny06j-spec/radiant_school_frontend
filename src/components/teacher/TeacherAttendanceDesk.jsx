// src/components/teacher/TeacherAttendanceDesk.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, XCircle, FileText, Save, 
  Eye, FileSpreadsheet, CheckCheck, Lock, UserCheck, AlertCircle, Download
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
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
  const [downloading, setDownloading] = useState(false);
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
    
    const newEntry = {
      id: `${currentReportWeek.shortRange}-${sessionPeriod}-${className}`,
      dateRange: currentReportWeek.shortRange,
      className,
      sessionPeriod,
      generatedOn: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      bounds: currentReportWeek
    };

    setRecentReportsList(prev => {
      const filtered = prev.filter(r => r.id !== newEntry.id);
      return [newEntry, ...filtered];
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

  // 📄 DOWNLOAD PDF BROADSHEET FUNCTION
  const handleDownloadPDF = () => {
    const element = document.getElementById('attendance-broadsheet-content');
    if (!element) return;

    setDownloading(true);

    const activeBounds = activeReportWeek || currentReportWeek;
    const sanitizedFileName = `Weekly_Attendance_${className}_${sessionPeriod}_Period.pdf`.replace(/\s+/g, '_');

    const opt = {
      margin:       [8, 8, 8, 8],
      filename:     sanitizedFileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => setDownloading(false))
      .catch((err) => {
        console.error('PDF generation error:', err);
        setDownloading(false);
      });
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
      <div style={{ padding: '16px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px 16px', maxWidth: '650px', margin: '20px auto', textAlign: 'center' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#ef4444' }}>
            <Lock size={28} />
          </div>
          
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 10px 0' }}>Class Teacher Assignment Required</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
            Only the designated Class Teacher for <strong style={{ color: '#38bdf8' }}>{className}</strong> can mark and manage daily attendance for this class.
          </p>

          <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '10px' }}>
              HOW ACCESS RIGHTS WORK:
            </div>
            
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
              <li><strong>Primary Section:</strong> Class teachers automatically manage their room.</li>
              <li><strong>Secondary Section:</strong> Management explicitly assigns one Class Teacher per arm.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const activeWeekBounds = activeReportWeek || currentReportWeek;

  return (
    <div style={{ padding: '12px', color: '#fff', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER & TABS */}
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
            {activeTab === 'take-attendance' ? 'Take Attendance' : 'Attendance Reports'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0 0' }}>
            {activeTab === 'take-attendance' 
              ? 'Mark and manage your class attendance for the day.' 
              : 'Generate and download attendance records for your class.'}
          </p>
        </div>

        <div style={{ display: 'flex', width: '100%', maxWidth: '320px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <button 
            onClick={() => setActiveTab('take-attendance')}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: 'none', background: activeTab === 'take-attendance' ? '#2563eb' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', textAlign: 'center' }}
          >
            Take Attendance
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: 'none', background: activeTab === 'reports' ? '#2563eb' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', textAlign: 'center' }}
          >
            Attendance Reports
          </button>
        </div>
      </div>

      {activeTab === 'take-attendance' ? (
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
                    <tr key={st.studentId} style={{ borderBottom: '1px solid #1e293b' }}>
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
      ) : (
        /* REPORTS TAB */
        <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end', marginBottom: '20px' }}>
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
              style={{ width: '100%', background: '#2563eb', border: 'none', color: '#fff', padding: '9px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <FileSpreadsheet size={16} /> Generate Report
            </button>
          </div>

          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Recent Reports</h4>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '1px solid #1e293b', fontSize: '10px' }}>
                  <th style={{ padding: '8px' }}>DATE RANGE</th>
                  <th style={{ padding: '8px' }}>CLASS</th>
                  <th style={{ padding: '8px' }}>SESSION</th>
                  <th style={{ padding: '8px' }}>GENERATED ON</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {recentReportsList.length === 0 ? (
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{currentReportWeek.shortRange}</td>
                    <td style={{ padding: '10px 8px' }}>{className}</td>
                    <td style={{ padding: '10px 8px', color: '#38bdf8' }}>{sessionPeriod}</td>
                    <td style={{ padding: '10px 8px', color: '#94a3b8' }}>Current Selected Week</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <button onClick={handleGenerateReport} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginRight: '4px' }}>Download</button>
                      <button onClick={handleGenerateReport} style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}><Eye size={12} /></button>
                    </td>
                  </tr>
                ) : (
                  recentReportsList.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 'bold' }}>{item.dateRange}</td>
                      <td style={{ padding: '10px 8px' }}>{item.className}</td>
                      <td style={{ padding: '10px 8px', color: '#38bdf8' }}>{item.sessionPeriod}</td>
                      <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{item.generatedOn}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <button onClick={() => handleOpenSavedReport(item)} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginRight: '4px' }}>Download</button>
                        <button onClick={() => handleOpenSavedReport(item)} style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}><Eye size={12} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINTABLE & DOWNLOADABLE BROADSHEET MODAL */}
      {showBroadsheet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '12px' }}>
          <div style={{ background: '#ffffff', color: '#000', width: '100%', maxWidth: '850px', padding: '20px 16px', borderRadius: '8px', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'sans-serif' }}>
            
            {/* 🟢 ID ADDED HERE FOR HTML2PDF TARGETING */}
            <div id="attendance-broadsheet-content" style={{ background: '#ffffff', color: '#000', padding: '10px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1e3a8a' }}>RADIANT INTELLECTUALS' COLLEGE</h2>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Knowledge • Discipline • Excellence</div>
                <h3 style={{ margin: '8px 0 0 0', fontSize: '12px', background: '#1e3a8a', color: '#fff', padding: '4px 0', textTransform: 'uppercase' }}>
                  WEEKLY ATTENDANCE RECORD ({sessionPeriod.toUpperCase()} SESSION)
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', fontSize: '10px', marginBottom: '14px', fontWeight: 'bold', gap: '8px' }}>
                <div>
                  <div>Class: {className}</div>
                  <div>Class Teacher: {currentUser?.firstName ? `${currentUser.firstName} ${currentUser.surname || ''}` : currentUser?.name || 'Mr. Adeboye'}</div>
                  <div>Week: {activeWeekBounds.rangeString}</div>
                </div>
                <div>
                  <div>Term: First Term</div>
                  <div>Register Session: {sessionPeriod}</div>
                  <div>Academic Year: 2026/2027</div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', border: '1px solid #000' }}>
                      <th style={{ border: '1px solid #000', padding: '4px' }}>S/N</th>
                      <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>STUDENT NAME</th>
                      <th style={{ border: '1px solid #000', padding: '4px' }}>REG. NO</th>
                      {activeWeekBounds.weekDays.map((wd, i) => (
                        <th key={i} style={{ border: '1px solid #000', padding: '4px' }}>{wd.label}</th>
                      ))}
                      <th style={{ border: '1px solid #000', padding: '4px' }}>PRESENT</th>
                      <th style={{ border: '1px solid #000', padding: '4px' }}>ABSENT</th>
                      <th style={{ border: '1px solid #000', padding: '4px' }}>%</th>
                    </tr>
                  </thead>
                  <tbody style={{ textAlign: 'center' }}>
                    {(weeklyReport.length > 0 ? weeklyReport : students).map((st, i) => (
                      <tr key={st.studentId || i}>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>{i + 1}</td>
                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'left', fontWeight: 'bold' }}>{st.name}</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>{st.admissionNo}</td>
                        
                        {activeWeekBounds.weekDays.map((wd, idx) => {
                          const dayStatus = st.logsByDate ? st.logsByDate[wd.isoDate] : '';
                          return (
                            <td key={idx} style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>
                              {getStatusSymbol(dayStatus)}
                            </td>
                          );
                        })}

                        <td style={{ border: '1px solid #000', padding: '4px' }}>{st.present ?? (st.status === 'Present' ? 1 : 0)}</td>
                        <td style={{ border: '1px solid #000', padding: '4px' }}>{st.absent ?? (st.status === 'Absent' ? 1 : 0)}</td>
                        <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>{st.attendancePercentage ?? 100}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: '24px', fontSize: '10px', gap: '16px' }}>
                <div>
                  <div>Teacher's Signature: __________________</div>
                  <div style={{ marginTop: '2px' }}>Date: {new Date().toLocaleDateString()}</div>
                </div>
                <div>
                  <div>Principal/HM Signature: __________________</div>
                  <div style={{ marginTop: '2px' }}>Date: ______________</div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ marginTop: '20px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleDownloadPDF} 
                disabled={downloading}
                style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Download size={14} /> {downloading ? 'Downloading PDF...' : 'Download PDF'}
              </button>
              <button onClick={() => window.print()} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>Print Broadsheet</button>
              <button onClick={() => setShowBroadsheet(false)} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}