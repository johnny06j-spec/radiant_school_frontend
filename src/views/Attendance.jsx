// src/views/Attendance.jsx (or src/views/student/Attendance.jsx)
import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const Attendance = ({ studentData }) => {
  // Sample student attendance records (Replace with dynamic API call when ready)
  const attendanceLogs = [
    { date: '2026-03-05', status: 'Present', remarks: 'On Time' },
    { date: '2026-03-04', status: 'Absent', remarks: 'Sick Leave' },
    { date: '2026-03-03', status: 'Present', remarks: 'On Time' },
    { date: '2026-03-02', status: 'Present', remarks: 'On Time' },
  ];

  const totalPresent = attendanceLogs.filter(a => a.status === 'Present').length;
  const totalAbsent = attendanceLogs.filter(a => a.status === 'Absent').length;
  const attendancePercentage = Math.round((totalPresent / attendanceLogs.length) * 100) || 0;

  return (
    <div style={styles.container}>
      {/* PAGE HEADER */}
      <div>
        <h2 style={styles.pageTitle}>Attendance Tracker</h2>
        <p style={styles.pageSubtitle}>Monitor your dynamic term attendance performance ratio.</p>
      </div>

      {/* METRICS CARDS GRID */}
      <div style={styles.metricsGrid}>
        <div style={{ ...styles.metricCard, borderLeft: '4px solid var(--accent-success)' }}>
          <div style={styles.metricHeader}>
            <span style={{ ...styles.metricLabel, color: 'var(--accent-success)' }}>TOTAL PRESENT</span>
            <CheckCircle2 size={18} color="var(--accent-success)" />
          </div>
          <p style={styles.metricValue}>{attendancePercentage}%</p>
        </div>

        <div style={{ ...styles.metricCard, borderLeft: '4px solid var(--accent-danger)' }}>
          <div style={styles.metricHeader}>
            <span style={{ ...styles.metricLabel, color: 'var(--accent-danger)' }}>TOTAL ABSENT</span>
            <XCircle size={18} color="var(--accent-danger)" />
          </div>
          <p style={{ ...styles.metricValue, color: 'var(--accent-danger)' }}>{totalAbsent} Days</p>
        </div>
      </div>

      {/* JOURNAL TABLE CARD */}
      <div style={styles.tableCard}>
        <h3 style={styles.tableCardTitle}>TERM ATTENDANCE JOURNAL</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>DATE</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {attendanceLogs.map((log, index) => (
                <tr key={index} style={styles.tr}>
                  <td style={styles.tdDate}>{log.date}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: log.status === 'Present' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: log.status === 'Present' ? 'var(--accent-success)' : 'var(--accent-danger)',
                      border: log.status === 'Present' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={styles.tdRemarks}>{log.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  pageTitle: { margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' },
  pageSubtitle: { margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' },

  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  metricCard: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', boxShadow: 'var(--shadow-subtle)' },
  metricHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' },
  metricValue: { margin: '8px 0 0 0', fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)' },

  tableCard: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-subtle)' },
  tableCardTitle: { margin: '0 0 16px 0', fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' },
  tr: { borderBottom: '1px solid var(--border-color)' },
  td: { padding: '12px' },
  tdDate: { padding: '12px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' },
  tdRemarks: { padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' },
  statusBadge: { padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', display: 'inline-block' }
};

export default Attendance;