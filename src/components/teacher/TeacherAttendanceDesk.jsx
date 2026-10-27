// src/components/teacher/TeacherAttendanceDesk.jsx
import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import axiosInstance from '../../api/axiosInstance';

import AttendanceTakeDesk from './AttendanceTakeDesk';
import AttendanceReportDesk from './AttendanceReportDesk';

export default function TeacherAttendanceDesk({ currentUser }) {
  const [activeTab, setActiveTab] = useState('take-attendance');

  const resolveUserClass = (user) => {
    if (!user) return '';
    const isSec = (user?.schoolSection || user?.department || '').toUpperCase().includes('SECONDARY');

    let classCandidate = isSec 
      ? (user?.classTeacherOf || user?.assignedClass)
      : (user?.assignedClass || user?.classTeacherOf || user?.assignedClasses?.[0]);

    if (!classCandidate && Array.isArray(user?.subjectAllocations) && user.subjectAllocations.length > 0) {
      classCandidate = user.subjectAllocations[0]?.className;
    }

    return (!classCandidate || classCandidate === 'N/A') ? '' : classCandidate.trim();
  };

  const [className, setClassName] = useState(resolveUserClass(currentUser));
  const [sessionPeriod, setSessionPeriod] = useState('Morning');

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

  const getWeekBounds = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);

    const monday = new Date(d.setDate(diffToMon));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const formatShort = (dt) => `${dt.getDate()} ${dt.toLocaleString('en-US', { month: 'short' })}`;
    const formatFull = (dt) => `${dt.getDate()} ${dt.toLocaleString('en-US', { month: 'short' })} ${dt.getFullYear()}`;

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

  useEffect(() => {
    if (currentUser) {
      const resolved = resolveUserClass(currentUser);
      if (resolved) {
        setClassName(resolved);
      }
    }
  }, [currentUser]);

  const fetchAttendanceSheet = async () => {
    if (!className || className === 'N/A') return;
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
    if (!className || className === 'N/A') return;
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
    if (activeTab === 'take-attendance' && className && className !== 'N/A') {
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

  const handleDownloadPDF = () => {
    const element = document.getElementById('attendance-broadsheet-content');
    if (!element) return;

    setDownloading(true);

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

  if (isNotClassTeacher) {
    return (
      <div style={{ padding: '16px', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px 16px', maxWidth: '650px', margin: '20px auto', textAlign: 'center' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#ef4444' }}>
            <Lock size={28} />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 10px 0' }}>Class Teacher Assignment Required</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
            Only the designated Class Teacher for <strong style={{ color: '#38bdf8' }}>{className || 'your class'}</strong> can mark and manage daily attendance.
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
        <AttendanceTakeDesk
          className={className}
          sessionPeriod={sessionPeriod}
          setSessionPeriod={setSessionPeriod}
          attendanceDate={attendanceDate}
          setAttendanceDate={setAttendanceDate}
          students={students}
          handleStatusChange={handleStatusChange}
          handleRemarkChange={handleRemarkChange}
          markAllPresent={markAllPresent}
          handleSaveAttendance={handleSaveAttendance}
          saving={saving}
        />
      ) : (
        <AttendanceReportDesk
          className={className}
          setClassName={setClassName}
          sessionPeriod={sessionPeriod}
          setSessionPeriod={setSessionPeriod}
          reportDate={reportDate}
          setReportDate={setReportDate}
          currentReportWeek={currentReportWeek}
          handleGenerateReport={handleGenerateReport}
          recentReportsList={recentReportsList}
          handleOpenSavedReport={handleOpenSavedReport}
          showBroadsheet={showBroadsheet}
          setShowBroadsheet={setShowBroadsheet}
          activeReportWeek={activeReportWeek}
          currentUser={currentUser}
          weeklyReport={weeklyReport}
          students={students}
          handleDownloadPDF={handleDownloadPDF}
          downloading={downloading}
        />
      )}

    </div>
  );
}