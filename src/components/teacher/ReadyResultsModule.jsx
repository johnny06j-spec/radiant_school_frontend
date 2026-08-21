// src/components/teacher/ReadyResultsModule.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Save, CheckCircle2, AlertCircle, Send, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import ExecutiveReviewDesk from '../admin/ExecutiveReviewDesk';

// 🎯 Primary vs Secondary Rating Scale Labels
const getPrimaryRatingLabel = (grade) => {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Very Good';
    case 'C': return 'Good';
    case 'D': return 'Fair';
    case 'E': return 'Weak';
    case 'F': return 'Poor';
    default:  return 'Good';
  }
};

const getSecondaryRatingLabel = (grade) => {
  switch (grade) {
    case 'A*': return 'Excellent';
    case 'A':  return 'Very Good';
    case 'B':  return 'Good';
    case 'C':  return 'Average';
    case 'D':  return 'Fair';
    case 'E':  return 'Weak';
    default:   return 'Good';
  }
};

const RATING_SCALE_PRIMARY = ['A', 'B', 'C', 'D', 'E', 'F'];
const RATING_SCALE_SECONDARY = ['A*', 'A', 'B', 'C', 'D', 'E'];

/**
 * 🎯 Precise Grade Evaluator for Primary and Secondary Sections
 */
const getOverallGradeAndRemark = (score, schoolSection = 'SECONDARY') => {
  const num = Number(score) || 0;

  if (schoolSection === 'PRIMARY') {
    if (num >= 86) return { grade: 'A', remark: 'EXCELLENT' };
    if (num >= 70) return { grade: 'B', remark: 'VERY GOOD' };
    if (num >= 50) return { grade: 'C', remark: 'GOOD' };
    if (num >= 45) return { grade: 'D', remark: 'FAIR' };
    if (num >= 40) return { grade: 'E', remark: 'WEAK' };
    return { grade: 'F', remark: 'POOR' };
  }

  // Secondary School Scale
  if (num >= 90) return { grade: 'A*', remark: 'EXCELLENT' };
  if (num >= 70) return { grade: 'A', remark: 'VERY GOOD' };
  if (num >= 60) return { grade: 'B', remark: 'GOOD' };
  if (num >= 50) return { grade: 'C', remark: 'AVERAGE' };
  if (num >= 40) return { grade: 'D', remark: 'FAIR' };
  if (num >= 30) return { grade: 'E', remark: 'WEAK' };
  return { grade: 'F', remark: 'POOR' };
};

const ReadyResultsModule = ({ profile: initialProfile }) => {
  const [activeSession, setActiveSession] = useState('2026/2027');
  const [activeTerm, setActiveTerm] = useState('First Term');
  const [profile, setProfile] = useState(initialProfile || {});

  // Fetch Fresh Profile on Mount
  useEffect(() => {
    const refreshProfile = async () => {
      try {
        const res = await axiosInstance.get('/auth/me').catch(() => null);
        if (res?.data?.user) {
          setProfile(res.data.user);
        } else if (initialProfile) {
          setProfile(initialProfile);
        }
      } catch (err) {
        if (initialProfile) setProfile(initialProfile);
      }
    };
    refreshProfile();
  }, [initialProfile]);

  const userRole = (profile?.role || '').toLowerCase();
  const isExecutive = 
    userRole === 'headmaster' || 
    userRole === 'principal' || 
    profile?.department === 'Executive Administration';

  const isPrimary = profile?.schoolSection === 'PRIMARY';
  const activeRatingScale = isPrimary ? RATING_SCALE_PRIMARY : RATING_SCALE_SECONDARY;
  const getRatingLabelFn = isPrimary ? getPrimaryRatingLabel : getSecondaryRatingLabel;

  // Available Classes Dropdown
  const availableClasses = useMemo(() => {
    const classSet = new Set();
    
    if (profile?.assignedClass && profile.assignedClass !== 'N/A') {
      classSet.add(profile.assignedClass.trim());
    }
    
    if (Array.isArray(profile?.subjectAllocations)) {
      profile.subjectAllocations.forEach(alloc => {
        if (alloc.className) classSet.add(alloc.className.trim());
      });
    }

    if (profile?.classTeacherOf) {
      classSet.add(profile.classTeacherOf.trim());
    }

    if (classSet.size === 0) classSet.add('KG 2');

    return Array.from(classSet);
  }, [profile]);

  const [selectedClass, setSelectedClass] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [reviewData, setReviewData] = useState(null);
  const [subjectScores, setSubjectScores] = useState([]);
  const [overallAverage, setOverallAverage] = useState(0);

  const [characterDev, setCharacterDev] = useState({
    attendance: 'A', attentiveness: 'A', neatness: 'A', selfControl: 'A', punctuality: 'A', relationshipWithOthers: 'A'
  });
  const [practicalSkills, setPracticalSkills] = useState({
    handwriting: 'A', music: 'A', drama: 'A', games: 'A', crafts: 'A', clubs: 'A', reading: 'A'
  });
  const [teacherRemark, setTeacherRemark] = useState('');

  const [loadingRoster, setLoadingRoster] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Permission Evaluation
  const isOfficialClassTeacherForSelectedClass = useMemo(() => {
    if (!selectedClass) return false;
    
    const cleanSel = selectedClass.replace(/\s+/g, '').toUpperCase();
    const cleanCTOf = (profile?.classTeacherOf || '').replace(/\s+/g, '').toUpperCase();
    const cleanAssigned = (profile?.assignedClass || '').replace(/\s+/g, '').toUpperCase();

    if (isPrimary) {
      return (
        cleanAssigned === cleanSel || 
        cleanCTOf === cleanSel ||
        Boolean(profile?.isClassTeacher && (cleanAssigned === cleanSel || cleanCTOf === cleanSel))
      );
    }

    const isCTFlag = Boolean(profile?.isClassTeacher);
    const isMatchingClass = cleanCTOf === cleanSel || cleanAssigned === cleanSel;

    return isCTFlag && isMatchingClass;
  }, [profile, selectedClass, isPrimary]);

  // Initialise System Settings
  useEffect(() => {
    const initData = async () => {
      try {
        const configRes = await axiosInstance.get('/system/config');
        const cfg = configRes.data?.data || configRes.data?.config || configRes.data;
        if (cfg) {
          setActiveTerm(cfg.currentTerm || 'First Term');
          setActiveSession(cfg.currentSession || '2026/2027');
        }
      } catch (err) {
        console.warn("⚠️ System Settings API Fetch Error:", err);
      }
    };

    initData();

    if (profile?.assignedClass && profile.assignedClass !== 'N/A') {
      setSelectedClass(profile.assignedClass.trim());
    } else if (profile?.classTeacherOf) {
      setSelectedClass(profile.classTeacherOf.trim());
    } else if (availableClasses.length > 0) {
      setSelectedClass(availableClasses[0]);
    }
  }, [profile, availableClasses]);

  // Fetch Class Roster
  useEffect(() => {
    if (!selectedClass || isExecutive) return;

    const fetchClassRoster = async () => {
      setLoadingRoster(true);
      try {
        let roster = [];

        const studentsRes = await axiosInstance.get('/students', { 
          params: { assignedClass: selectedClass } 
        }).catch(() => null);

        if (studentsRes?.data?.students && studentsRes.data.students.length > 0) {
          roster = studentsRes.data.students.map(s => ({
            _id: s._id,
            name: s.name || `${s.surname || ''} ${s.firstName || s.firstname || ''}`.trim(),
            surname: s.surname || s.name?.split(' ')[0] || 'Student',
            firstName: s.firstName || s.firstname || s.name?.split(' ').slice(1).join(' ') || '',
            admissionNo: s.admissionNo || s.registrationNo || 'N/A'
          }));
        }

        if (roster.length === 0) {
          const gridRes = await axiosInstance.get('/teachers/fetch-grid', {
            params: { 
              className: selectedClass, 
              subjectName: profile?.subjectAllocations?.[0]?.subjectName || 'ENGLISH', 
              term: activeTerm, 
              session: activeSession 
            }
          }).catch(() => null);

          const gridData = gridRes?.data?.data?.studentsScores || [];

          roster = gridData.map((s, idx) => ({
            _id: s.studentId && s.studentId.length > 10 ? s.studentId : `fallback-${idx}`,
            name: s.name || 'Unnamed Student',
            surname: s.name ? s.name.split(' ')[0] : 'Student',
            firstName: s.name ? s.name.split(' ').slice(1).join(' ') : '',
            admissionNo: s.admissionNo || 'N/A'
          }));
        }

        setStudentsList(roster);
        if (roster.length > 0) {
          setSelectedStudentId(roster[0]._id);
        } else {
          setSelectedStudentId('');
          setSubjectScores([]);
          setReviewData(null);
        }
      } catch (err) {
        console.error("💥 Roster fetch error:", err);
      } finally {
        setLoadingRoster(false);
      }
    };

    fetchClassRoster();
  }, [selectedClass, activeTerm, activeSession, profile, isExecutive]);

  // Fetch Student Review Details
  useEffect(() => {
    if (!selectedStudentId || !selectedClass || isExecutive) return;

    const fetchReview = async () => {
      setLoadingReview(true);
      try {
        const selectedStudent = studentsList.find(s => s._id === selectedStudentId);

        const res = await axiosInstance.get('/teachers/review-single', {
          params: { 
            studentId: selectedStudent?._id, 
            className: selectedClass, 
            term: activeTerm, 
            session: activeSession,
            admissionNo: selectedStudent?.admissionNo !== 'N/A' ? selectedStudent?.admissionNo : undefined,
            studentName: selectedStudent?.name
          }
        });

        if (res.data?.success) {
          const { review, subjects, overallAverage } = res.data.data;
          setReviewData(review);
          setSubjectScores(subjects || []);
          setOverallAverage(overallAverage || 0);

          if (review?.characterDevelopment && Object.keys(review.characterDevelopment).length > 0) {
            setCharacterDev(prev => ({ ...prev, ...review.characterDevelopment }));
          }
          if (review?.practicalSkills && Object.keys(review.practicalSkills).length > 0) {
            setPracticalSkills(prev => ({ ...prev, ...review.practicalSkills }));
          }
          setTeacherRemark(review?.teacherRemark || '');
        }
      } catch (err) {
        console.error("💥 Error pulling student review details:", err);
      } finally {
        setLoadingReview(false);
      }
    };

    fetchReview();
  }, [selectedStudentId, activeTerm, activeSession, selectedClass, studentsList, isExecutive]);

  // Save Review Draft or Submit
  const handleSaveOrSubmit = async (submitAction = 'DRAFT') => {
    if (!isOfficialClassTeacherForSelectedClass) {
      setActionMessage({ type: 'error', text: 'Unauthorized: Only the assigned Class Teacher can submit or edit comments for this class.' });
      return;
    }

    setSaving(true);
    setActionMessage({ type: '', text: '' });

    try {
      const res = await axiosInstance.post('/teachers/save-review', {
        studentId: selectedStudentId,
        className: selectedClass,
        schoolSection: profile?.schoolSection,
        term: activeTerm,
        session: activeSession,
        characterDevelopment: characterDev,
        practicalSkills,
        teacherRemark,
        submitAction
      });

      if (res.data?.success) {
        setActionMessage({
          type: 'success',
          text: submitAction === 'SUBMIT' ? 'Student result submitted for Headmaster approval!' : 'Review draft saved successfully!'
        });
        setReviewData(res.data.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (isExecutive) {
    return (
      <div style={{ padding: '10px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', marginBottom: '20px', color: '#34d399', fontSize: '13px', fontWeight: 'bold' }}>
          <ShieldCheck size={18} />
          <span>EXECUTIVE SIGN-OFF DESK ACTIVE — SECTION OVERALL REVIEW & PROMOTIONS DESK</span>
        </div>
        <ExecutiveReviewDesk currentUser={profile} />
      </div>
    );
  }

  const isSubmitted = reviewData?.status === 'Submitted' || reviewData?.status === 'Approved by Principal' || reviewData?.status === 'Released';
  const isReadOnly = !isOfficialClassTeacherForSelectedClass || isSubmitted;
  const showCumulative = activeTerm !== 'First Term';

  const computedOverall = getOverallGradeAndRemark(overallAverage, profile?.schoolSection);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#fff' }}>Result Review & Approval</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>Review student results, add your remark, and approve for final release.</p>
        </div>

        <div>
          {isOfficialClassTeacherForSelectedClass ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
              <ShieldCheck size={16} /> Class Teacher (Full Access)
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
              <ShieldAlert size={16} /> Subject Teacher (View Only)
            </div>
          )}
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div style={{ backgroundColor: '#070c14', border: '1px solid #1e293b', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>ACADEMIC TERM</label>
          <div style={{ padding: '8px', color: '#38bdf8', fontWeight: 'bold' }}>{activeTerm}</div>
        </div>
        
        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>SESSION YEAR</label>
          <div style={{ padding: '8px', color: '#38bdf8', fontWeight: 'bold' }}>{activeSession}</div>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>SELECT CLASS</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ width: '100%', backgroundColor: '#0b111e', border: '1px solid #38bdf8', borderRadius: '8px', padding: '8px', color: '#fff', fontWeight: 'bold', outline: 'none' }}
          >
            {availableClasses.map((cls, idx) => (
              <option key={idx} value={cls}>
                {cls} {isOfficialClassTeacherForSelectedClass && cls === selectedClass ? '★ (Your Managed Class)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>SELECT STUDENT</label>
          <select 
            value={selectedStudentId} 
            onChange={(e) => setSelectedStudentId(e.target.value)}
            disabled={studentsList.length === 0 || loadingRoster}
            style={{ width: '100%', backgroundColor: '#0b111e', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#fff', fontWeight: 'bold', outline: 'none' }}
          >
            {loadingRoster ? (
              <option value="">Loading Roster...</option>
            ) : studentsList.length === 0 ? (
              <option value="">No Enrolled Students</option>
            ) : (
              studentsList.map(s => (
                <option key={s._id} value={s._id}>
                  {s.surname || s.name} {s.firstName || ''} ({s.admissionNo || 'N/A'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {actionMessage.text && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', backgroundColor: actionMessage.type === 'error' ? '#450a0a' : '#064e3b', color: actionMessage.type === 'error' ? '#f87171' : '#34d399', border: `1px solid ${actionMessage.type === 'error' ? '#991b1b' : '#10b981'}` }}>
          {actionMessage.text}
        </div>
      )}

      {/* SUBJECTS & SCORES */}
      <div style={{ backgroundColor: '#070c14', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#60a5fa' }}>SUBJECTS & SCORES ({profile?.schoolSection || 'PRIMARY'})</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: 'bold', color: '#c084fc' }}>
            <span>
              Overall Term Average: <span style={{ color: '#38bdf8' }}>{overallAverage}%</span>
            </span>
            <span style={{ 
              backgroundColor: 'rgba(56, 189, 248, 0.15)', 
              border: '1px solid #38bdf8', 
              color: '#38bdf8', 
              padding: '2px 10px', 
              borderRadius: '6px', 
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Overall Grade: <strong style={{ color: '#fff', fontSize: '14px' }}>{computedOverall.grade}</strong> ({computedOverall.remark})
            </span>
          </div>
        </div>

        {loadingReview ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto', display: 'block' }} />
            Consolidating subject scores...
          </div>
        ) : subjectScores.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '13px' }}>
            No recorded subject scores found for this student in {selectedClass}.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px' }}>Subject</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Test 1</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Test 2</th>
                {!isPrimary && <th style={{ padding: '10px', textAlign: 'center' }}>Proj</th>}
                <th style={{ padding: '10px', textAlign: 'center' }}>Exam</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>{showCumulative ? 'Total (100) A' : 'Total (100)'}</th>
                {showCumulative && <th style={{ padding: '10px', textAlign: 'center', color: '#c084fc' }}>Cum B.F (100) B</th>}
                {showCumulative && <th style={{ padding: '10px', textAlign: 'center', color: '#38bdf8' }}>TOTAL AVG (A+B)/2</th>}
                <th style={{ padding: '10px', textAlign: 'center' }}>Grade</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {subjectScores.map((row, idx) => {
                const evaluated = getOverallGradeAndRemark(row.totalScore, profile?.schoolSection);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#fff' }}>{row.subject}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.ca1}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.ca2}</td>
                    {!isPrimary && <td style={{ padding: '10px', textAlign: 'center' }}>{row.project}</td>}
                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.exam}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{row.totalScore}%</td>
                    {showCumulative && <td style={{ padding: '10px', textAlign: 'center', color: '#c084fc', fontWeight: 'bold' }}>{row.broughtForward}%</td>}
                    {showCumulative && <td style={{ padding: '10px', textAlign: 'center', color: '#38bdf8', fontWeight: 'bold' }}>{row.averageScore}%</td>}
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{evaluated.grade}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}>{evaluated.remark}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* DOMAINS & REMARKS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* CHARACTER DEVELOPMENT */}
        <div style={{ backgroundColor: '#070c14', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', opacity: isReadOnly ? 0.7 : 1 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#c084fc' }}>CHARACTER DEVELOPMENT</h4>
          {Object.keys(characterDev).map((key) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
              <select 
                disabled={isReadOnly}
                value={characterDev[key]} 
                onChange={(e) => setCharacterDev({ ...characterDev, [key]: e.target.value })}
                style={{ backgroundColor: '#0b111e', border: '1px solid #1e293b', borderRadius: '6px', color: '#38bdf8', padding: '4px 8px', cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
              >
                {activeRatingScale.map(r => <option key={r} value={r}>{r} - {getRatingLabelFn(r)}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* PRACTICAL SKILLS */}
        <div style={{ backgroundColor: '#070c14', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', opacity: isReadOnly ? 0.7 : 1 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#c084fc' }}>PRACTICAL SKILLS</h4>
          {Object.keys(practicalSkills).map((key) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize' }}>{key}</span>
              <select 
                disabled={isReadOnly}
                value={practicalSkills[key]} 
                onChange={(e) => setPracticalSkills({ ...practicalSkills, [key]: e.target.value })}
                style={{ backgroundColor: '#0b111e', border: '1px solid #1e293b', borderRadius: '6px', color: '#38bdf8', padding: '4px 8px', cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
              >
                {activeRatingScale.map(r => <option key={r} value={r}>{r} - {getRatingLabelFn(r)}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* REMARKS PANEL */}
        <div style={{ backgroundColor: '#070c14', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '13px', color: '#c084fc' }}>STUDENT REMARKS & APPROVAL</h4>
          
          <div>
            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TEACHER'S REMARK</label>
            <textarea 
              disabled={isReadOnly}
              rows={4}
              value={teacherRemark}
              onChange={(e) => setTeacherRemark(e.target.value)}
              placeholder={
                isSubmitted 
                  ? "Result submitted and locked for executive sign-off." 
                  : !isOfficialClassTeacherForSelectedClass 
                  ? "Remarks locked (Subject Teacher - View Only)" 
                  : "Write your remark about this student's overall performance..."
              }
              style={{ width: '100%', backgroundColor: isReadOnly ? '#05080f' : '#0b111e', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: isReadOnly ? '#64748b' : '#fff', fontSize: '12px', marginTop: '6px', cursor: isReadOnly ? 'not-allowed' : 'text' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>HEADMASTER / HM REMARK (READ ONLY)</label>
            <textarea 
              disabled
              rows={3}
              value={reviewData?.principalRemark || ''}
              placeholder="Pending Headmaster review..."
              style={{ width: '100%', backgroundColor: '#05080f', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px', color: '#64748b', fontSize: '12px', marginTop: '6px', cursor: 'not-allowed' }}
            />
          </div>
        </div>

      </div>

      {/* ACTIONS */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
        <button 
          disabled={isReadOnly || saving}
          onClick={() => handleSaveOrSubmit('DRAFT')}
          style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold', border: 'none', cursor: (isReadOnly || saving) ? 'not-allowed' : 'pointer', opacity: (isReadOnly || saving) ? 0.5 : 1 }}
        >
          {saving ? 'Saving...' : 'Save Review Draft'}
        </button>

        <button 
          disabled={isReadOnly || saving}
          onClick={() => handleSaveOrSubmit('SUBMIT')}
          style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 'bold', border: 'none', cursor: (isReadOnly || saving) ? 'not-allowed' : 'pointer', opacity: (isReadOnly || saving) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Send size={15} /> {saving ? 'Submitting...' : 'Submit Student Result'}
        </button>
      </div>

    </div>
  );
};

export default ReadyResultsModule;