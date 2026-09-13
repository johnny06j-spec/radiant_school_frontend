// src/components/teacher/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Menu, Building2 } from 'lucide-react';

import TeacherSidebar from './TeacherSidebar';
import TeacherOverview from './TeacherOverview';
import TeacherAttendanceDesk from './TeacherAttendanceDesk';
import ResultEntryModule from './ResultEntryModule';
import ReadyResultsModule from './ReadyResultsModule';

const TeacherDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);

    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (err) {
        console.error("Failed parsing stored user profile:", err);
      }
    }
    setLoading(false);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '13px' }}>
        Resolving Faculty Workspace Layout...
      </div>
    );
  }

  const isExecutive = profile?.role === 'headmaster' || profile?.role === 'principal' || profile?.department === 'Executive Administration';
  const roleTitle = profile?.role === 'headmaster' ? 'Headmaster' : (profile?.role === 'principal' ? 'Principal' : 'Teacher');
  const activeCampus = profile?.campus || 'Emerald Campus';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', width: '100%' }}>
      
      {/* 1. SIDEBAR */}
      <TeacherSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        profile={profile}
        isExecutive={isExecutive}
        onLogout={handleLogout}
      />

      {/* 2. MAIN CONTENT WRAPPER */}
      <div style={{ 
        flex: 1, 
        paddingLeft: isMobile ? '0px' : '260px', 
        display: 'flex', 
        flexDirection: 'column', 
        minWidth: 0, 
        minHeight: '100vh' 
      }}>
        
        {/* MOBILE TOPBAR */}
        {isMobile && (
          <header style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 300, 
            backgroundColor: 'rgba(15, 23, 42, 0.95)', 
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid #1e293b', 
            padding: '12px 16px', 
            display: 'flex', 
            alignItems: 'center', 
            justify: 'space-between' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setMobileOpen(true)}
                style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Menu size={20} />
              </button>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>RADIANT ERP</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                {activeCampus}
              </span>
            </div>
          </header>
        )}

        {/* WORKSPACE PAGE CONTAINER */}
        <main style={{ flex: 1, padding: isMobile ? '16px' : '24px', maxWidth: '1280px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          
          {/* DESKTOP PAGE TITLE */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#fff' }}>
                  Welcome back, {profile?.firstName ? `${profile.firstName} ${profile.surname || ''}` : profile?.name || 'Faculty Member'}
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  {isExecutive ? `${roleTitle} Executive Sign-Off Portal` : 'Faculty Reference ID:'} <span style={{ color: '#fff', fontFamily: 'monospace' }}>{profile?.username || profile?.email || 'N/A'}</span>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '6px 14px', borderRadius: '50px', fontSize: '12px', fontWeight: 'bold' }}>
                <Building2 size={15} /> <span>{activeCampus}</span>
              </div>
            </div>
          )}

          {/* DYNAMIC TAB SWITCH */}
          {activeTab === 'OVERVIEW' && (
            <TeacherOverview profile={profile} isExecutive={isExecutive} onSelectTab={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'RESULT_ENTRY' && !isExecutive && (
            <ResultEntryModule profile={profile} campus={activeCampus} />
          )}

          {activeTab === 'ATTENDANCE' && !isExecutive && (
            <TeacherAttendanceDesk profile={profile} campus={activeCampus} />
          )}

          {activeTab === 'READY_RESULTS' && (
            <ReadyResultsModule profile={profile} isExecutive={isExecutive} campus={activeCampus} />
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;