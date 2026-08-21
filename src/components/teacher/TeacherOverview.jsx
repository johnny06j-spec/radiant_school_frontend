// src/components/teacher/TeacherOverview.jsx
import React from 'react';
import { BookOpen, Users, Award } from 'lucide-react';

const TeacherOverview = ({ profile, summary, onSelectTab }) => {
  const isPrimary = profile?.schoolSection === 'PRIMARY';
  const isCT = isPrimary ? true : Boolean(profile?.isClassTeacher);
  const ctClass = isPrimary ? (profile?.assignedClass || 'KG 1') : (profile?.classTeacherOf || 'N/A');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* STATS CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#60a5fa', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>Assigned Track</span>
            <BookOpen size={20} />
          </div>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#fff' }}>{profile?.schoolSection || 'PRIMARY'}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{profile?.department || 'General'} Department</p>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#c084fc', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>Subject Allocations</span>
            <Users size={20} />
          </div>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#d8b4fe' }}>
            {isPrimary ? (profile?.assignedClass || 'KG 1') : `${profile?.subjectAllocations?.length || 0} Subject Slots`}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{isPrimary ? 'Classroom Hub Master' : 'Secondary Subject Specialist'}</p>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#34d399', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>Class Teacher Permission</span>
            <Award size={20} />
          </div>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#34d399' }}>{isCT ? ctClass : 'Subject Only'}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{isCT ? 'Authorized for Daily Register' : 'Attendance Managed by Class Teacher'}</p>
        </div>
      </div>

      {/* QUICK WORKSPACE ACTION CARDS */}
      <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>Quick Portal Operations</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          
          <button 
            onClick={() => onSelectTab('RESULT_ENTRY')}
            style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#60a5fa', display: 'block', marginBottom: '4px' }}>➔ Go to Score Sheet</span>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>Result Entry</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Enter Test 1, Test 2, and Exam scores for assigned classes.</p>
          </button>

          <button 
            onClick={() => onSelectTab('ATTENDANCE')}
            style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#c084fc', display: 'block', marginBottom: '4px' }}>➔ Open Register</span>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>Attendance Register</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Mark Present, Absent, Late, or Excused status for pupils.</p>
          </button>

          <button 
            onClick={() => onSelectTab('READY_RESULTS')}
            style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', display: 'block', marginBottom: '4px' }}>➔ Review Broadsheet</span>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>Ready Results</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Review completed class results and forward to Headmistress/Principal.</p>
          </button>

        </div>
      </div>
    </div>
  );
};

export default TeacherOverview;