// src/components/teacher/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

import TeacherSidebar from './TeacherSidebar';
import TeacherOverview from './TeacherOverview';
import AttendanceModule from './AttendanceModule';
import ResultEntryModule from './ResultEntryModule';
import ReadyResultsModule from './ReadyResultsModule';

const TeacherDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setProfile(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#f8fafc', fontFamily: 'sans-serif', display: 'flex' }}>
      
      {/* 1. SIDEBAR (DYNAMICALLY ADAPTS FOR TEACHERS VS EXECUTIVES) */}
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
      <div style={{ flex: 1, paddingLeft: window.innerWidth >= 1024 ? '260px' : '0px', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
        
        {/* MOBILE TOPBAR */}
        <header style={{ display: window.innerWidth >= 1024 ? 'none' : 'flex', position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid #1e293b', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setMobileOpen(true)}
              style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#1e293b', color: '#fff', border: 'none', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Menu size={22} />
            </button>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>RADIANT ERP</span>
          </div>

          <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '9999px', backgroundColor: isExecutive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 58, 138, 0.6)', color: isExecutive ? '#34d399' : '#93c5fd', border: `1px solid ${isExecutive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}` }}>
            {profile?.schoolSection} • {roleTitle.toUpperCase()}
          </span>
        </header>

        {/* WORKSPACE PAGE CONTENT CONTAINER */}
        <main style={{ flex: 1, padding: '24px', maxWidth: '1280px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          
          {/* DESKTOP PAGE TITLE */}
          <div style={{ display: window.innerWidth >= 1024 ? 'flex' : 'none', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#fff' }}>
                Welcome back, {profile?.firstName ? `${profile.firstName} ${profile.surname}` : profile?.name}
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                {isExecutive ? `${roleTitle} Executive Sign-Off Portal` : 'Faculty Reference ID:'} <span style={{ color: '#fff', fontFamily: 'monospace' }}>{profile?.username || profile?.email}</span>
              </p>
            </div>
          </div>

          {/* DYNAMIC TAB COMPONENT SWITCH */}
          {activeTab === 'OVERVIEW' && (
            <TeacherOverview profile={profile} isExecutive={isExecutive} onSelectTab={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'RESULT_ENTRY' && !isExecutive && (
            <ResultEntryModule profile={profile} />
          )}

          {activeTab === 'ATTENDANCE' && !isExecutive && (
            <AttendanceModule profile={profile} />
          )}

          {activeTab === 'READY_RESULTS' && (
            <ReadyResultsModule profile={profile} isExecutive={isExecutive} />
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;