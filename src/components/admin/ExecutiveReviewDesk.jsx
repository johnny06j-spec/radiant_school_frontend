// src/components/admin/ExecutiveReviewDesk.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertTriangle, ShieldCheck, Search, 
  RotateCcw, Award, FileText, ArrowRight, X, Check, Lock,
  ArrowLeft, Send, GraduationCap
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const RATING_LABELS = {
  A: 'Excellent',
  B: 'Very Good',
  C: 'Good',
  D: 'Fair',
  E: 'Weak'
};

const ExecutiveReviewDesk = ({ currentUser }) => {
  // Check Executive Authority
  const isHM = currentUser?.role === 'headmaster' || currentUser?.schoolSection === 'PRIMARY';
  
  const PRIMARY_CLASSES = ['KG 1', 'KG 2', 'Nursery 1', 'Nursery 2', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5'];
  const SECONDARY_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

  const availableClasses = isHM ? PRIMARY_CLASSES : SECONDARY_CLASSES;

  const [selectedClass, setSelectedClass] = useState(availableClasses[0] || 'Basic 1');
  
  // LOCKED SYSTEM CONFIGURATION STATES
  const [term, setTerm] = useState('');
  const [session, setSession] = useState('');
  const [systemConfigLoaded, setSystemConfigLoaded] = useState(false);

  const [statusFilter, setStatusFilter] = useState('Submitted');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [singleReview, setSingleReview] = useState(null);
  
  const [principalRemark, setPrincipalRemark] = useState('');
  const [promotionDecision, setPromotionDecision] = useState('PROMOTED');
  const [promotedToClass, setPromotedToClass] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Section-aware grading calculator helper
  const getGrade = (score, isPrimary) => {
    const num = Number(score) || 0;
    if (isPrimary) {
      if (num >= 86) return 'A';
      if (num >= 70) return 'B';
      if (num >= 50) return 'C';
      if (num >= 45) return 'D';
      if (num >= 40) return 'E';
      return 'F';
    } else {
      if (num >= 90) return 'A*';
      if (num >= 70) return 'A';
      if (num >= 60) return 'B';
      if (num >= 50) return 'C';
      if (num >= 40) return 'D';
      if (num >= 30) return 'E';
      return 'F';
    }
  };

  const getNextClass = (current) => {
    const idx = SECONDARY_CLASSES.indexOf(current);
    if (idx !== -1 && idx < SECONDARY_CLASSES.length - 1) {
      return SECONDARY_CLASSES[idx + 1];
    }
    const pIdx = PRIMARY_CLASSES.indexOf(current);
    if (pIdx !== -1 && pIdx < PRIMARY_CLASSES.length - 1) {
      return PRIMARY_CLASSES[pIdx + 1];
    }
    return 'Graduated';
  };

  useEffect(() => {
    setPromotedToClass(getNextClass(selectedClass));
  }, [selectedClass]);

  // 1. FETCH LIVE ACADEMIC TERM & SESSION FROM ADMIN SETTINGS
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const res = await axiosInstance.get('/system/config');
        const config = res.data?.data || res.data?.config || res.data || {};
        
        setTerm(config.currentTerm || 'Third Term');
        setSession(config.currentSession || '2026/2027');
      } catch (err) {
        setTerm('Third Term');
        setSession('2026/2027');
      } finally {
        setSystemConfigLoaded(true);
      }
    };

    fetchSystemSettings();
  }, []);

  // 2. FETCH STRICT CLASS ROSTER
  const fetchClassReviews = async () => {
    if (!term || !session || !selectedClass) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const revRes = await axiosInstance.get('/teachers/executive-reviews', {
        params: {
          className: selectedClass,
          term,
          session,
          status: statusFilter,
          schoolSection: isHM ? 'PRIMARY' : 'SECONDARY'
        }
      }).catch(() => null);

      if (revRes?.data?.success && Array.isArray(revRes.data.data)) {
        setStudents(revRes.data.data);
        setLoading(false);
        return;
      }

      const res = await axiosInstance.get(`/students`, {
        params: { 
          assignedClass: selectedClass,
          currentClass: selectedClass 
        }
      });
      const list = res.data?.students || res.data || [];
      
      const strictFiltered = list.filter(s => {
        const target = selectedClass.replace(/\s+/g, '').toUpperCase();
        const cur = (s.currentClass || '').replace(/\s+/g, '').toUpperCase();
        const asg = (s.assignedClass || '').replace(/\s+/g, '').toUpperCase();
        return cur === target || asg === target;
      });

      setStudents(strictFiltered);
    } catch (err) {
      setErrorMsg('Failed to load class roster for review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (systemConfigLoaded) {
      fetchClassReviews();
    }
  }, [selectedClass, term, session, statusFilter, systemConfigLoaded]);

  // 3. LOAD SINGLE STUDENT FULL REVIEW
  const handleSelectStudent = async (student) => {
    setActiveStudent(student);
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axiosInstance.get(
        `/teachers/review-single?studentId=${student._id}&className=${encodeURIComponent(selectedClass)}&term=${encodeURIComponent(term)}&session=${encodeURIComponent(session)}`
      );
      if (res.data?.success) {
        setSingleReview(res.data.data);
        const review = res.data.data.review || {};
        setPrincipalRemark(review.principalRemark || 'Satisfactory academic performance. Keep it up.');
        setPromotionDecision(review.promotionDecision && review.promotionDecision !== 'N/A' ? review.promotionDecision : 'PROMOTED');
      }
    } catch (err) {
      setErrorMsg('Failed to fetch student result card details.');
    } finally {
      setLoading(false);
    }
  };

  // 🟢 4. SUBMIT EXECUTIVE APPROVAL WITH EXACT CUMULATIVE AVERAGE & SUBJECTS ARRAY
  const handleApprove = async () => {
    if (!activeStudent) return;
    setErrorMsg('');
    setSuccessMsg('');

    const isFirstTerm = term.trim().toLowerCase() === 'first term';
    const rawSubjects = singleReview?.subjects || [];

    // Format subjects with explicit cumulative values
    let cumulativeSum = 0;
    let subjectCount = 0;

    const formattedSubjects = rawSubjects.map((sub) => {
      const ca1 = Number(sub.ca1 ?? sub.test1 ?? sub.ca1Score ?? 0);
      const ca2 = Number(sub.ca2 ?? sub.test2 ?? sub.ca2Score ?? 0);
      const proj = Number(sub.project ?? sub.proj ?? sub.projectScore ?? 0);
      const exam = Number(sub.exam ?? sub.examScore ?? 0);
      const totalScore = Number(sub.totalScore) || (ca1 + ca2 + (!isHM ? proj : 0) + exam);
      const bf = Number(sub.broughtForward ?? sub.cumBF ?? 0);

      const averageScore = (!isFirstTerm && bf > 0)
        ? Math.round(((totalScore + bf) / 2) * 100) / 100
        : totalScore;

      cumulativeSum += averageScore;
      subjectCount++;

      return {
        subject: sub.subject || sub.subjectName,
        ca1,
        ca2,
        project: proj,
        exam,
        totalScore,
        broughtForward: bf,
        averageScore,
        grade: getGrade(averageScore, isHM),
        remark: sub.remark || 'SATISFACTORY'
      };
    });

    // Compute true cumulative overall average
    const calculatedOverallAvg = subjectCount > 0
      ? Math.round((cumulativeSum / subjectCount) * 100) / 100
      : Number(singleReview?.overallAverage || 0);

    try {
      const payload = {
        studentId: activeStudent._id,
        className: selectedClass,
        term,
        session,
        schoolSection: isHM ? 'PRIMARY' : 'SECONDARY',
        overallAverage: Number(calculatedOverallAvg), // 👈 Sends exact 83.41%
        subjects: formattedSubjects,                 // 👈 Sends array with CUM B.F scores intact
        principalRemark,
        promotionDecision: term.toLowerCase().includes('third') ? promotionDecision : 'N/A',
        promotedToClass: promotionDecision === 'PROMOTED' ? promotedToClass : '',
        userRole: currentUser?.role || (isHM ? 'headmaster' : 'principal')
      };

      const res = await axiosInstance.post('/teachers/principal-approve', payload);
      if (res.data?.success) {
        const studentMeta = singleReview?.student || activeStudent;
        const sName = studentMeta.firstName || studentMeta.firstname || studentMeta.name || 'Student';
        setSuccessMsg(res.data?.message || `Result for ${sName} approved successfully.`);
        setActiveStudent(null);
        setSingleReview(null);
        fetchClassReviews();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Approval authorization failed.');
    }
  };

  // Return Result to Teacher
  const handleReject = async () => {
    if (!activeStudent || !rejectionReason.trim()) {
      alert('Please enter a valid reason for returning the result.');
      return;
    }

    try {
      const payload = {
        studentId: activeStudent._id,
        term,
        session,
        rejectionReason
      };

      const res = await axiosInstance.post('/teachers/principal-reject', payload);
      if (res.data?.success) {
        setSuccessMsg(`Result returned to class teacher for correction.`);
        setShowRejectModal(false);
        setRejectionReason('');
        setActiveStudent(null);
        setSingleReview(null);
        fetchClassReviews();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reject result.');
    }
  };

  const showCumulative = term.trim().toLowerCase() !== 'first term';

  const getStudentFullName = (sObj) => {
    if (!sObj) return 'Student';
    const first = sObj.firstName || sObj.firstname || sObj.name?.split(' ')[0] || '';
    const last = sObj.lastName || sObj.surname || sObj.name?.split(' ').slice(1).join(' ') || '';
    const combined = `${first} ${last}`.trim();
    return combined || sObj.name || 'Student';
  };

  const getStudentPhotoUrl = (sObj) => {
    if (!sObj) return null;
    return sObj.passportPhoto || sObj.passportUrl || sObj.passport || sObj.avatar || sObj.photo || null;
  };

  const currentStudentMeta = singleReview?.student || activeStudent;
  const headerPhotoUrl = getStudentPhotoUrl(currentStudentMeta);

  return (
    <div style={{ padding: '10px 0', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f8fafc' }}>
      <style>{`
        .exec-grid-container {
          display: grid;
          grid-template-columns: ${activeStudent ? '320px 1fr' : '1fr'};
          gap: 20px;
          align-items: start;
        }
        .exec-header-grid {
          display: grid;
          grid-template-columns: 110px 1fr 200px;
          gap: 16px;
          align-items: center;
        }
        .exec-domains-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .exec-grid-container {
            grid-template-columns: 1fr !important;
          }
          .exec-header-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .exec-domains-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* LOCKED FILTER CONTROL BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', backgroundColor: '#0b1329', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={10} /> ACADEMIC TERM
          </label>
          <input type="text" value={term} disabled style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#38bdf8', marginTop: '4px', fontSize: '12px', outline: 'none', fontWeight: 'bold', cursor: 'not-allowed' }} />
        </div>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={10} /> SESSION
          </label>
          <input type="text" value={session} disabled style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#38bdf8', marginTop: '4px', fontSize: '12px', outline: 'none', fontWeight: 'bold', cursor: 'not-allowed' }} />
        </div>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>TARGET CLASS</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#fff', marginTop: '4px', fontSize: '12px', outline: 'none', fontWeight: 'bold' }}>
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>STATUS</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#fff', marginTop: '4px', fontSize: '12px', outline: 'none', fontWeight: 'bold' }}>
            <option value="Submitted">Submitted for Review</option>
            <option value="Returned for Revision">Returned for Revision</option>
            <option value="Pending Review">Pending Review (All Enrolled)</option>
            <option value="Approved">Approved by Executive</option>
            <option value="Released">Released to Portals</option>
          </select>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}

      {/* DUAL WORKSPACE LAYOUT */}
      <div className="exec-grid-container">
        
        {/* LEFT COLUMN: ROSTER QUEUE */}
        <div style={{ backgroundColor: '#0b1329', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#fff' }}>
              Students Awaiting Review ({students.length})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>Click a student to view full result and take action</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '720px', overflowY: 'auto', paddingRight: '4px' }}>
            {students.map(s => {
              const isSelected = activeStudent?._id === s._id;
              const photoUrl = getStudentPhotoUrl(s);
              const fullName = getStudentFullName(s);
              const isReturned = (s.status || '').toLowerCase().includes('returned');

              return (
                <div 
                  key={s._id} 
                  onClick={() => handleSelectStudent(s)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.18)' : '#030712', 
                    border: `1px solid ${isSelected ? '#3b82f6' : '#1e293b'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#1e293b', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>
                      {photoUrl ? <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (fullName[0] || 'S')}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{fullName}</div>
                      <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{s.admissionNo || 'N/A'}</span>
                    </div>
                  </div>

                  <span style={{ 
                    fontSize: '10px', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    backgroundColor: isReturned ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)', 
                    color: isReturned ? '#f87171' : '#facc15', 
                    border: `1px solid ${isReturned ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`, 
                    fontWeight: 'bold' 
                  }}>
                    {s.status || statusFilter}
                  </span>
                </div>
              );
            })}
            {students.length === 0 && !loading && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                No students matching status "{statusFilter}" found in {selectedClass}.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REPORT CARD REVIEW PANEL */}
        {activeStudent && singleReview ? (
          <div style={{ backgroundColor: '#0b1329', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            
            {/* TOP BAR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => setActiveStudent(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                  <ArrowLeft size={14} /> Back to List
                </button>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>
                  {currentStudentMeta?.admissionNo} • {getStudentFullName(currentStudentMeta)}
                </span>
              </div>
            </div>

            {/* REJECTION / RETURN NOTICE BANNER */}
            {(activeStudent.rejectionReason || singleReview.review?.rejectionReason) && (
              <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '16px', color: '#f87171', fontSize: '12px' }}>
                <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <AlertTriangle size={14} /> RETURNED BY ADMIN FOR REVISION:
                </div>
                <div style={{ fontStyle: 'italic', color: '#fca5a5' }}>
                  "{activeStudent.rejectionReason || singleReview.review?.rejectionReason}"
                </div>
              </div>
            )}

            {/* STUDENT HEADER CARD WITH IMAGE & UNIFIED NAME */}
            <div className="exec-header-grid" style={{ backgroundColor: '#030712', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b', marginBottom: '20px' }}>
              <div style={{ width: '100px', height: '110px', borderRadius: '8px', backgroundColor: '#1e293b', overflow: 'hidden', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                {headerPhotoUrl ? (
                  <img src={headerPhotoUrl} alt="passport" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#38bdf8' }}>{getStudentFullName(currentStudentMeta)[0]}</span>
                )}
              </div>

              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '900', color: '#fff' }}>
                  {getStudentFullName(currentStudentMeta)}
                </h2>
                <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>Admission No: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{currentStudentMeta?.admissionNo || 'N/A'}</strong></span>
                  <span>Class: <strong style={{ color: '#fff' }}>{selectedClass}</strong> • Term: <strong style={{ color: '#38bdf8' }}>{term}</strong></span>
                  <span>Session: <strong style={{ color: '#38bdf8' }}>{session}</strong></span>
                </div>
              </div>

              <div style={{ backgroundColor: '#0b1329', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>OVERALL TERM AVG: <strong style={{ color: '#38bdf8' }}>{singleReview.overallAverage}%</strong></span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>SUBJECTS ENTERED: <strong style={{ color: '#fff' }}>{singleReview.subjectCount || singleReview.subjects?.length || 0}</strong></span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>STATUS: <strong style={{ color: '#facc15' }}>{singleReview.review?.status || statusFilter}</strong></span>
              </div>
            </div>

            {/* SUBJECTS & SCORES TABLE */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase' }}>SUBJECTS & SCORES</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '11px' }}>
                      <th style={{ padding: '8px' }}>SUBJECT</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>TEST 1</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>TEST 2</th>
                      {!isHM && <th style={{ padding: '8px', textAlign: 'center' }}>PROJ</th>}
                      <th style={{ padding: '8px', textAlign: 'center' }}>EXAM</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>{showCumulative ? 'TOTAL (100) A' : 'TOTAL (100)'}</th>
                      {showCumulative && <th style={{ padding: '8px', textAlign: 'center', color: '#c084fc' }}>CUM B.F (100) B</th>}
                      {showCumulative && <th style={{ padding: '8px', textAlign: 'center', color: '#38bdf8' }}>TOTAL AVG (A+B)/2</th>}
                      <th style={{ padding: '8px', textAlign: 'center' }}>GRADE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {singleReview.subjects?.map((sub, i) => {
                      const test1 = sub.ca1 ?? sub.test1 ?? sub.ca1Score ?? 0;
                      const test2 = sub.ca2 ?? sub.test2 ?? sub.ca2Score ?? 0;
                      const proj = sub.project ?? sub.proj ?? sub.projectScore ?? 0;
                      const exam = sub.exam ?? sub.examScore ?? 0;
                      const finalScore = showCumulative ? (sub.averageScore || sub.totalScore) : sub.totalScore;

                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '8px', fontWeight: '600', color: '#fff' }}>{sub.subject}</td>
                          <td style={{ textAlign: 'center', padding: '8px', color: '#e2e8f0', fontWeight: '600' }}>{test1}</td>
                          <td style={{ textAlign: 'center', padding: '8px', color: '#e2e8f0', fontWeight: '600' }}>{test2}</td>
                          {!isHM && <td style={{ textAlign: 'center', padding: '8px', color: '#e2e8f0', fontWeight: '600' }}>{proj}</td>}
                          <td style={{ textAlign: 'center', padding: '8px', color: '#e2e8f0', fontWeight: '600' }}>{exam}</td>
                          <td style={{ textAlign: 'center', padding: '8px', fontWeight: 'bold', color: '#fff' }}>{sub.totalScore}%</td>
                          {showCumulative && <td style={{ textAlign: 'center', padding: '8px', color: '#c084fc', fontWeight: 'bold' }}>{sub.broughtForward || 0}%</td>}
                          {showCumulative && <td style={{ textAlign: 'center', padding: '8px', color: '#38bdf8', fontWeight: 'bold' }}>{sub.averageScore || sub.totalScore}%</td>}
                          <td style={{ textAlign: 'center', padding: '8px', fontWeight: 'bold', color: '#34d399' }}>
                            {getGrade(finalScore, isHM)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* THIRD TERM PROMOTION CONTROL BOX */}
            {term.toLowerCase().includes('third') && (
              <div style={{ backgroundColor: '#030712', padding: '14px', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.4)', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <GraduationCap size={16} /> THIRD-TERM ACADEMIC PROMOTION DECISION
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>DECISION</label>
                    <select value={promotionDecision} onChange={(e) => setPromotionDecision(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#0b1329', color: '#fff', fontSize: '12px', marginTop: '4px', outline: 'none' }}>
                      <option value="PROMOTED">PROMOTED</option>
                      <option value="REPEAT">REPEAT CLASS</option>
                      <option value="WITHDRAWN">ADVISED TO WITHDRAW</option>
                    </select>
                  </div>
                  {promotionDecision === 'PROMOTED' && (
                    <div>
                      <label style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>TARGET CLASS</label>
                      <input type="text" value={promotedToClass} onChange={(e) => setPromotedToClass(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#0b1329', color: '#fff', fontSize: '12px', marginTop: '4px', outline: 'none' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DOMAINS GRID */}
            <div className="exec-domains-grid" style={{ marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#030712', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#c084fc', textTransform: 'uppercase' }}>CHARACTER DEVELOPMENT</h5>
                {Object.entries(singleReview.review?.characterDevelopment || {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '4px 0', color: '#94a3b8' }}>
                    <span style={{ textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                    <strong style={{ color: '#34d399' }}>{v} - {RATING_LABELS[v] || 'Good'}</strong>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: '#030712', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#c084fc', textTransform: 'uppercase' }}>PRACTICAL SKILLS</h5>
                {Object.entries(singleReview.review?.practicalSkills || {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', margin: '4px 0', color: '#94a3b8' }}>
                    <span style={{ textTransform: 'capitalize' }}>{k}</span>
                    <strong style={{ color: '#34d399' }}>{v} - {RATING_LABELS[v] || 'Good'}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* CLASS TEACHER'S REMARK BLOCK */}
            <div style={{ backgroundColor: '#030712', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                CLASS TEACHER'S REMARK
              </span>
              <p style={{ margin: 0, fontSize: '12px', color: '#fff', fontStyle: 'italic', lineHeight: '1.4' }}>
                "{singleReview.review?.teacherRemark || 'No teacher remark recorded yet.'}"
              </p>
            </div>

            {/* EXECUTIVE COMMENT & ACTIONS */}
            <div style={{ backgroundColor: '#030712', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', textTransform: 'uppercase' }}>
                  {isHM ? "HEADMASTER'S COMMENT" : "PRINCIPAL'S COMMENT"}
                </span>
                <button onClick={handleApprove} style={{ padding: '4px 10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid #10b981', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Save Comment
                </button>
              </div>

              <textarea 
                value={principalRemark} 
                onChange={(e) => setPrincipalRemark(e.target.value)} 
                rows={3} 
                placeholder="Write your official comment about this student's performance..." 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#0b1329', color: '#fff', fontSize: '12px', resize: 'none', boxSizing: 'border-box', marginBottom: '16px', outline: 'none' }} 
              />

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => setShowRejectModal(true)} style={{ padding: '10px 16px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #ef4444', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                  Return to Teacher
                </button>
                
                <button onClick={handleApprove} style={{ flex: 1, padding: '10px 16px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Check size={16} /> Approve & Forward to Admin
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ backgroundColor: '#0b1329', padding: '40px', borderRadius: '12px', border: '1px solid #1e293b', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Select a student from the roster list on the left to inspect their complete report card.
          </div>
        )}

      </div>

      {/* REJECTION MODAL */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#0b1329', padding: '20px', borderRadius: '12px', width: '100%', maxWidth: '380px', border: '1px solid #1e293b' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#f87171' }}>Return Result to Class Teacher</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#94a3b8' }}>Specify reason for returning broadsheet:</p>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} placeholder="e.g. Please revise CA2 score..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#030712', color: '#fff', fontSize: '12px', marginBottom: '12px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejectModal(false)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #1e293b', color: '#fff', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleReject} style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Return Result</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExecutiveReviewDesk;