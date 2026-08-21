// src/components/teacher/ResultEntryModule.jsx
import React, { useState, useEffect } from 'react';
import { Save, BookOpen, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

// 📘 Core Academic Subject Tracks Matrix Configuration
const PRE_SCHOOL_TRACK = [
  'ENGLISH', 'MATHEMATICS', 'BASIC SCIENCE', 'NUMBER WORK', 'MENTAL WORK', 
  'HEALTH EDUCATION', 'CRS', 'CREATIVE ART', 'MUSIC', 'POEM', 'HANDWRITING'
];

const BASIC_SCHOOL_TRACK = [
  'ENGLISH', 'MATHEMATICS', 'C.C.A', 'HISTORY', 'P.V.E', 'CRS', 
  'SOCIAL & CITIZENSHIP STUDIES', 'SECURITY EDUCATION', 'BASIC SCIENCE', 
  'PHYSICAL & HEALTH EDUCATION', 'DIGITAL LITERACY', 'VERBAL REASONING', 'QUANTITATIVE REASONING'
];

// Helper to evaluate Grade and Remark according to Section Scale
const evaluateGradeAndRemark = (score, isSecondary) => {
  const val = Number(score) || 0;

  if (isSecondary) {
    // 🏫 Secondary School Rating Scale
    if (val >= 90) return { grade: 'A*', remark: 'EXCELLENT', bg: '#064e3b', border: '#10b981', color: '#34d399' };
    if (val >= 70) return { grade: 'A',  remark: 'VERY GOOD', bg: '#047857', border: '#059669', color: '#6ee7b7' };
    if (val >= 60) return { grade: 'B',  remark: 'GOOD',      bg: '#082f49', border: '#38bdf8', color: '#7dd3fc' };
    if (val >= 50) return { grade: 'C',  remark: 'AVERAGE',   bg: '#312e81', border: '#6366f1', color: '#a5b4fc' };
    if (val >= 40) return { grade: 'D',  remark: 'FAIR',      bg: '#451a03', border: '#f59e0b', color: '#fcd34d' };
    if (val >= 30) return { grade: 'E',  remark: 'WEAK',      bg: '#78350f', border: '#d97706', color: '#fef08a' };
    return { grade: 'F', remark: 'FAIL', bg: '#4c0519', border: '#f43f5e', color: '#fda4af' };
  } else {
    // 🏫 Primary School Rating Scale
    if (val >= 86) return { grade: 'A', remark: 'EXCELLENT', bg: '#064e3b', border: '#10b981', color: '#34d399' };
    if (val >= 70) return { grade: 'B', remark: 'VERY GOOD', bg: '#082f49', border: '#38bdf8', color: '#7dd3fc' };
    if (val >= 50) return { grade: 'C', remark: 'GOOD',      bg: '#312e81', border: '#6366f1', color: '#a5b4fc' };
    if (val >= 45) return { grade: 'D', remark: 'FAIR',      bg: '#451a03', border: '#f59e0b', color: '#fcd34d' };
    if (val >= 40) return { grade: 'E', remark: 'WEAK',      bg: '#78350f', border: '#d97706', color: '#fef08a' };
    return { grade: 'F', remark: 'POOR', bg: '#4c0519', border: '#f43f5e', color: '#fda4af' };
  }
};

const ResultEntryModule = ({ profile }) => {
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  // 🔒 Admin System Settings Controlled States
  const [activeSession, setActiveSession] = useState('2026/2027');
  const [activeTerm, setActiveTerm] = useState('First Term');
  const [fetchingSettings, setFetchingSettings] = useState(true);

  // Grid Data & Action States
  const [gridData, setGridData] = useState([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Status & Locking States
  const [classStatus, setClassStatus] = useState('Pending Review');
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  // Section determinations
  const isSecondarySetup = profile?.schoolSection === 'SECONDARY';
  const isPreschoolClass = (profile?.assignedClass || '').trim().toUpperCase().startsWith('KG') || 
                           (profile?.assignedClass || '').trim().toUpperCase().startsWith('NURSERY');
  const targetPrimaryTrackSubjects = isPreschoolClass ? PRE_SCHOOL_TRACK : BASIC_SCHOOL_TRACK;

  // 🔒 Check lock condition
  const isEntryLocked = ['Submitted', 'Approved by Principal', 'Released'].includes(classStatus);
  const isReturnedForRevision = classStatus === 'Returned for Revision';

  // 1. Initialise Admin System Settings
  useEffect(() => {
    const initSystemSettings = async () => {
      setFetchingSettings(true);
      try {
        const res = await axiosInstance.get('/system/config'); 
        const settingsData = res.data?.data || res.data?.config || res.data;
        
        if (settingsData) {
          setActiveTerm(settingsData.currentTerm || 'First Term');
          setActiveSession(settingsData.currentSession || '2026/2027');
        }
      } catch (err) {
        console.warn('⚠️ Settings API Fetch Error:', err.message);
      } finally {
        setFetchingSettings(false);
      }
    };

    initSystemSettings();

    if (profile?.schoolSection === 'PRIMARY') {
      const targetClass = profile.assignedClass ? profile.assignedClass.trim() : '';
      const baselineSubject = isPreschoolClass ? PRE_SCHOOL_TRACK[0] : BASIC_SCHOOL_TRACK[0];
      setSelectedAllocation({ className: targetClass, subjectName: baselineSubject });
    } else if (profile?.schoolSection === 'SECONDARY' && profile?.subjectAllocations?.length > 0) {
      setSelectedAllocation(profile.subjectAllocations[0]);
    }
  }, [profile]);

  // 2. Fetch Student Roster Grid
  useEffect(() => {
    if (!selectedAllocation || !selectedAllocation.className || fetchingSettings) return;

    const syncGradingGrid = async () => {
      setGridLoading(true);
      setActionMessage({ type: '', text: '' });
      try {
        const response = await axiosInstance.get('/teachers/fetch-grid', {
          params: {
            className: selectedAllocation.className.trim(), 
            subjectName: selectedAllocation.subjectName,
            term: activeTerm,
            session: activeSession
          }
        });

        if (response.data?.success && response.data?.data) {
          const gridPayload = response.data.data;
          
          setClassStatus(gridPayload.status || 'Pending Review');
          setRejectionFeedback(gridPayload.rejectionReason || '');

          const sanitized = (gridPayload.studentsScores || []).map(row => {
            const t1 = row.ca1 ?? 0;
            const t2 = row.ca2 ?? 0;
            const proj = isSecondarySetup ? (row.project ?? 0) : 0;
            const exam = row.exam ?? 0;
            const total = t1 + t2 + proj + exam;

            const bf = row.broughtForward ?? row.historical?.t1Total ?? 0;
            const hasBF = activeTerm !== 'First Term';
            const avgScore = hasBF ? Math.round(((total + bf) / 2) * 100) / 100 : total;

            const evaluated = evaluateGradeAndRemark(avgScore, isSecondarySetup);

            return {
              ...row,
              id: row.id || row._id || row.studentId || '',
              ca1: t1,
              ca2: t2,
              project: proj,
              exam,
              totalScore: total,
              broughtForward: bf,
              averageScore: avgScore,
              grade: evaluated.grade,
              remark: evaluated.remark
            };
          });
          setGridData(sanitized);
        } else {
          setGridData([]);
        }
      } catch (err) {
        console.error("💥 SPREADSHEET PULL FAULT:", err);
        setGridData([]);
        setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to synchronize spreadsheet roster cells.' });
      } finally {
        setGridLoading(false);
      }
    };

    syncGradingGrid();
  }, [selectedAllocation, activeTerm, activeSession, fetchingSettings]);

  // 3. Dynamic Score Change Handler with Correct Upper Caps
  const handleScoreChange = (index, field, value) => {
    if (isEntryLocked) return;

    const updatedGrid = [...gridData];
    const numericVal = value === '' ? '' : parseInt(value, 10) || 0;

    // Apply Upper Caps strictly per section rules
    let absoluteCap = 15;
    if (isSecondarySetup) {
      if (field === 'ca1' || field === 'ca2' || field === 'project') absoluteCap = 15; // Secondary Tests/Proj = 15
      if (field === 'exam') absoluteCap = 55;                                          // Secondary Exam = 55
    } else {
      if (field === 'ca1' || field === 'ca2') absoluteCap = 20;                        // Primary Tests = 20
      if (field === 'exam') absoluteCap = 60;                                          // Primary Exam = 60
    }

    const standardValue = numericVal === '' ? 0 : Math.min(Math.max(numericVal, 0), absoluteCap);
    updatedGrid[index][field] = numericVal === '' ? '' : standardValue;

    const t1 = Number(updatedGrid[index].ca1) || 0;
    const t2 = Number(updatedGrid[index].ca2) || 0;
    const proj = isSecondarySetup ? (Number(updatedGrid[index].project) || 0) : 0;
    const exam = Number(updatedGrid[index].exam) || 0;

    const currentTotal = Math.min(100, t1 + t2 + proj + exam);
    updatedGrid[index].totalScore = currentTotal;

    const bf = Number(updatedGrid[index].broughtForward) || 0;
    const isCumulativeTerm = activeTerm !== 'First Term';
    const finalAvg = isCumulativeTerm ? Math.round(((currentTotal + bf) / 2) * 100) / 100 : currentTotal;
    
    updatedGrid[index].averageScore = finalAvg;

    const evaluated = evaluateGradeAndRemark(finalAvg, isSecondarySetup);
    updatedGrid[index].grade = evaluated.grade;
    updatedGrid[index].remark = evaluated.remark;

    setGridData(updatedGrid);
  };

  // 4. Save Draft Payload Handler
  const handleSaveDraft = async () => {
    if (isEntryLocked) return;

    setSavingDraft(true);
    setActionMessage({ type: 'loading', text: 'Saving draft scores down to servers...' });

    const structuralPayload = gridData.map(row => ({
      studentId: row.id || row._id || row.studentId,
      name: row.name || row.studentName,
      ca1: Number(row.ca1) || 0,
      ca2: Number(row.ca2) || 0,
      project: isSecondarySetup ? (Number(row.project) || 0) : 0,
      exam: Number(row.exam) || 0,
      totalScore: Number(row.totalScore) || 0,
      broughtForward: Number(row.broughtForward) || 0,
      averageScore: Number(row.averageScore) || 0,
      grade: row.grade || 'F',
      remark: row.remark || 'FAIL'
    }));

    try {
      const response = await axiosInstance.post('/teachers/save-grid', {
        className: selectedAllocation.className,
        schoolSection: profile.schoolSection,
        subjectName: selectedAllocation.subjectName,
        term: activeTerm,
        session: activeSession,
        studentsScores: structuralPayload
      });

      if (response.data?.success || response.status === 200) {
        setActionMessage({ type: 'success', text: 'Score card draft written successfully!' });
      } else {
        setActionMessage({ type: 'error', text: 'Error executing draft saving actions.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Error executing draft saving actions.' });
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER BAR */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#fff' }}>Academic Grading Registry</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Cross-class subject grading network workspace ledger.</p>
        </div>

        <button 
          disabled={gridLoading || savingDraft || isEntryLocked} 
          onClick={handleSaveDraft}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
            borderRadius: '10px', backgroundColor: isEntryLocked ? '#334155' : '#1d4ed8', color: '#fff', fontSize: '12px',
            fontWeight: 'bold', border: 'none', cursor: (gridLoading || savingDraft || isEntryLocked) ? 'not-allowed' : 'pointer'
          }}
        >
          <Save size={15} /> {savingDraft ? 'SAVING...' : isEntryLocked ? 'ENTRY LOCKED' : 'SAVE DRAFT'}
        </button>
      </div>

      {/* METADATA FILTERS PANEL */}
      <div style={{ backgroundColor: '#070c14', border: '1px solid #1e293b', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* TARGET CLASS & SUBJECT */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Target Classroom & Subject</label>
          {profile?.schoolSection === 'PRIMARY' ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '35%', backgroundColor: '#0b111e', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
                {profile.assignedClass}
              </div>
              <select
                value={selectedAllocation?.subjectName || ''}
                onChange={(e) => setSelectedAllocation({ className: profile.assignedClass, subjectName: e.target.value })}
                style={{ width: '65%', backgroundColor: '#0b111e', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 'bold', color: '#fff', outline: 'none' }}
              >
                {targetPrimaryTrackSubjects.map((subject, idx) => (
                  <option key={idx} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          ) : (
            <select 
              value={selectedAllocation ? JSON.stringify(selectedAllocation) : ''} 
              onChange={(e) => setSelectedAllocation(JSON.parse(e.target.value))}
              style={{ width: '100%', backgroundColor: '#0b111e', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', fontSize: '13px', fontWeight: 'bold', color: '#fff', outline: 'none' }}
            >
              {profile?.subjectAllocations?.map((alloc, idx) => (
                <option key={idx} value={JSON.stringify(alloc)}>
                  {alloc.className} — {alloc.subjectName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ACADEMIC TERM */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            <Lock size={11} style={{ color: '#fbbf24' }} /> Academic Term
          </label>
          <div style={{ width: '100%', backgroundColor: '#0b111e', border: '1px solid #1e293b', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{activeTerm}</span>
            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>Active</span>
          </div>
        </div>

        {/* SESSION YEAR */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            <Lock size={11} style={{ color: '#fbbf24' }} /> Session Year
          </label>
          <div style={{ width: '100%', backgroundColor: '#0b111e', border: '1px solid #1e293b', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{activeSession}</span>
            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>Active</span>
          </div>
        </div>

        {/* CURRICULUM TRACK */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Curriculum Track</label>
          <div style={{ backgroundColor: '#0b111e', border: '1px solid #1e293b', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', fontWeight: 'bold', color: '#c084fc', textAlign: 'center', textTransform: 'uppercase' }}>
            {profile?.schoolSection} Matrix
          </div>
        </div>
      </div>

      {/* LOCK BANNER / REJECTION NOTIFICATION */}
      {isEntryLocked && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} />
          <span><strong>RESULT ENTRY LOCKED:</strong> Broad sheet scores submitted to Principal for sign-off review.</span>
        </div>
      )}

      {isReturnedForRevision && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <AlertCircle size={16} /> RETURNED BY PRINCIPAL FOR REVISION
          </div>
          {rejectionFeedback && <p style={{ margin: 0, fontSize: '12px', color: '#fff', fontStyle: 'italic' }}>"{rejectionFeedback}"</p>}
        </div>
      )}

      {/* FEEDBACK BANNER */}
      {actionMessage.text && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: actionMessage.type === 'error' ? '#450a0a' : '#064e3b', border: `1px solid ${actionMessage.type === 'error' ? '#991b1b' : '#10b981'}`, color: actionMessage.type === 'error' ? '#f87171' : '#34d399' }}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {actionMessage.text}
        </div>
      )}

      {/* TABLE WORKSPACE */}
      {gridLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace', fontSize: '13px' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto', display: 'block' }} />
          Synchronizing Student Roster Data...
        </div>
      ) : gridData.length === 0 ? (
        <div style={{ padding: '40px', backgroundColor: '#070c14', border: '1px solid #1e293b', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
          No active student rows found for this classroom track setup.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(30, 58, 138, 0.2)', border: '1px solid rgba(30, 58, 138, 0.4)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Recording scores for <strong style={{ color: '#fff' }}>{selectedAllocation?.subjectName}</strong> in <strong style={{ color: '#fff' }}>{selectedAllocation?.className}</strong> ({activeTerm}, {activeSession}).
              Structure: <strong style={{ color: '#c084fc', fontFamily: 'monospace' }}>{isSecondarySetup ? 'Secondary [15+15+15+55]' : 'Primary [20+20+60]'}</strong>.
            </span>
          </div>

          <div style={{ backgroundColor: '#070c14', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#05080f', borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 16px', position: 'sticky', left: 0, backgroundColor: '#05080f', zIndex: 10 }}>Student Particulars</th>
                    
                    {/* TEST 1 */}
                    <th style={{ padding: '14px', textAlign: 'center', width: '90px' }}>{isSecondarySetup ? 'TEST 1 (15)' : 'TEST 1 (20)'}</th>
                    
                    {/* TEST 2 */}
                    <th style={{ padding: '14px', textAlign: 'center', width: '90px' }}>{isSecondarySetup ? 'TEST 2 (15)' : 'TEST 2 (20)'}</th>
                    
                    {/* PROJECT (Secondary Only) */}
                    {isSecondarySetup && <th style={{ padding: '14px', textAlign: 'center', width: '90px' }}>PROJ (15)</th>}
                    
                    {/* EXAM */}
                    <th style={{ padding: '14px', textAlign: 'center', width: '90px' }}>{isSecondarySetup ? 'EXAM (55)' : 'EXAM (60)'}</th>
                    
                    {/* TOTAL (A) */}
                    <th style={{ padding: '14px', textAlign: 'center', width: '100px' }}>TOTAL (100) A</th>

                    {/* Dynamic Cumulative Columns for 2nd & 3rd Term */}
                    {activeTerm !== 'First Term' && (
                      <>
                        <th style={{ padding: '14px', textAlign: 'center', width: '120px', color: '#c084fc', borderLeft: '1px solid #1e293b' }}>CUM B.F (100) B</th>
                        <th style={{ padding: '14px', textAlign: 'center', width: '120px', color: '#c084fc', backgroundColor: 'rgba(88, 28, 135, 0.15)' }}>TOTAL AVG (A+B)/2</th>
                      </>
                    )}

                    <th style={{ padding: '14px', textAlign: 'center', width: '70px' }}>GRADE</th>
                    <th style={{ padding: '14px', textAlign: 'center', width: '120px' }}>REMARK</th>
                  </tr>
                </thead>
                <tbody>
                  {gridData.map((row, idx) => {
                    const evaluated = evaluateGradeAndRemark(activeTerm !== 'First Term' ? row.averageScore : row.totalScore, isSecondarySetup);

                    return (
                      <tr key={row.id || idx} style={{ borderBottom: '1px solid #1e293b', fontSize: '13px' }}>
                        <td style={{ padding: '12px 16px', position: 'sticky', left: 0, backgroundColor: '#070c14', zIndex: 10 }}>
                          <div style={{ fontWeight: 'bold', color: '#fff' }}>{row.name || row.studentName || 'Unknown Student'}</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>{row.admissionNo || `ID-#${idx}`}</div>
                        </td>

                        {/* TEST 1 */}
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <input type="number" min="0" max={isSecondarySetup ? 15 : 20} disabled={isEntryLocked} value={row.ca1 ?? ''} onChange={(e) => handleScoreChange(idx, 'ca1', e.target.value)} style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: isEntryLocked ? '#1e293b' : '#05080f', color: isEntryLocked ? '#94a3b8' : '#fff', textAlign: 'center', fontWeight: 'bold', cursor: isEntryLocked ? 'not-allowed' : 'text' }} />
                        </td>

                        {/* TEST 2 */}
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <input type="number" min="0" max={isSecondarySetup ? 15 : 20} disabled={isEntryLocked} value={row.ca2 ?? ''} onChange={(e) => handleScoreChange(idx, 'ca2', e.target.value)} style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: isEntryLocked ? '#1e293b' : '#05080f', color: isEntryLocked ? '#94a3b8' : '#fff', textAlign: 'center', fontWeight: 'bold', cursor: isEntryLocked ? 'not-allowed' : 'text' }} />
                        </td>

                        {/* PROJECT (Secondary Only) */}
                        {isSecondarySetup && (
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <input type="number" min="0" max="15" disabled={isEntryLocked} value={row.project ?? ''} onChange={(e) => handleScoreChange(idx, 'project', e.target.value)} style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: isEntryLocked ? '#1e293b' : '#05080f', color: isEntryLocked ? '#94a3b8' : '#fff', textAlign: 'center', fontWeight: 'bold', cursor: isEntryLocked ? 'not-allowed' : 'text' }} />
                          </td>
                        )}

                        {/* EXAM */}
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <input type="number" min="0" max={isSecondarySetup ? 55 : 60} disabled={isEntryLocked} value={row.exam ?? ''} onChange={(e) => handleScoreChange(idx, 'exam', e.target.value)} style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: isEntryLocked ? '#1e293b' : '#05080f', color: isEntryLocked ? '#94a3b8' : '#fff', textAlign: 'center', fontWeight: 'bold', cursor: isEntryLocked ? 'not-allowed' : 'text' }} />
                        </td>

                        {/* TOTAL (A) */}
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '900', fontFamily: 'monospace', color: '#60a5fa' }}>
                          {row.totalScore || 0}%
                        </td>

                        {/* CUMULATIVE SECOND & THIRD TERM COLUMNS */}
                        {activeTerm !== 'First Term' && (
                          <>
                            <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: '#c084fc', borderLeft: '1px solid #1e293b' }}>
                              {row.broughtForward ?? 0}%
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '900', color: '#38bdf8', backgroundColor: 'rgba(88, 28, 135, 0.1)' }}>
                              {row.averageScore ?? 0}%
                            </td>
                          </>
                        )}

                        {/* GRADE */}
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace', backgroundColor: evaluated.bg, border: `1px solid ${evaluated.border}`, color: evaluated.color }}>
                            {evaluated.grade}
                          </span>
                        </td>

                        {/* REMARK */}
                        <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', color: evaluated.color }}>
                          {evaluated.remark}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ResultEntryModule;