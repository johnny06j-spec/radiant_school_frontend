// src/components/teacher/AttendanceReportDesk.jsx
import React from 'react';
import { Eye, FileSpreadsheet, Download } from 'lucide-react';

export default function AttendanceReportDesk({
  className,
  setClassName,
  sessionPeriod,
  setSessionPeriod,
  reportDate,
  setReportDate,
  currentReportWeek,
  handleGenerateReport,
  recentReportsList,
  handleOpenSavedReport,
  showBroadsheet,
  setShowBroadsheet,
  activeReportWeek,
  currentUser,
  weeklyReport,
  students,
  handleDownloadPDF,
  downloading
}) {
  const getStatusSymbol = (status) => {
    switch (status) {
      case 'Present': return 'P';
      case 'Late': return 'L';
      case 'Absent': return 'A';
      case 'Excused': return 'E';
      default: return '-';
    }
  };

  const activeWeekBounds = activeReportWeek || currentReportWeek;

  return (
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

      {/* PRINTABLE & DOWNLOADABLE BROADSHEET MODAL */}
      {showBroadsheet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '12px' }}>
          <div style={{ background: '#ffffff', color: '#000', width: '100%', maxWidth: '850px', padding: '20px 16px', borderRadius: '8px', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'sans-serif' }}>
            
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