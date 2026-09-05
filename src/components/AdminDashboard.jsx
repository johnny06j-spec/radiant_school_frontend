// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  FolderOpen, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  Settings, 
  FileText, 
  LogOut,
  Activity,
  ArrowRight,
  Coins,
  Moon,
  Sun,
  Menu,
  X,
  Send
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import axiosInstance from '../api/axiosInstance';

import StudentRegistry from '../views/StudentRegistry'; 
import StudentDirectory from '../views/StudentDirectory';
import SetClassFees from '../views/SetClassFees';
import DebtorsList from '../views/DebtorsList';
import PaymentsDesk from '../views/PaymentsDesk'; 
import SystemSettings from '../pages/SystemSettings'; 
import ReceiptVerifier from '../views/ReceiptVerifier';
import StaffRegistry from './admin/StaffRegistry';
import AdminReleaseDesk from './admin/AdminReleaseDesk';

const AdminDashboard = () => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview'); 
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Statistics State Engine
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeTeachers: 0,
    databaseLink: '127.0.0.1'
  });
  const [loading, setLoading] = useState(true);

  // Route Guard & Viewport Resize Engine
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      window.location.href = '/';
      return;
    }

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Live Database Metrics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await axiosInstance.get('/auth/dashboard-stats');
        if (response.data?.success && response.data?.stats) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error("💥 Failed retrieving operational statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const menuItems = [
    { id: 'overview', name: 'System Overview', icon: LayoutDashboard },
    { id: 'enroll', name: 'Enroll New Student', icon: UserPlus },
    { id: 'directory', name: 'Student Directory', icon: FolderOpen },
    { id: 'teachers', name: 'Staff & Teacher Registry', icon: Users },
    { id: 'payments', name: 'Payments Desk', icon: CreditCard },
    { id: 'debtors', name: 'Debtors List', icon: AlertTriangle },
    { id: 'fees', name: 'Set Class Fees', icon: Coins },
    { id: 'ledger', name: 'Ledger Sign-Off Desk', icon: FileText },
    { id: 'release-results', name: 'Publish / Release Results', icon: Send },
    { id: 'settings', name: 'System Settings', icon: Settings }
  ];

  const getSidebarItemStyle = (tabId) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    background: activeTab === tabId ? 'var(--accent-primary)' : 'transparent',
    color: activeTab === tabId ? '#ffffff' : 'var(--text-secondary)',
    borderRadius: '8px',
    marginBottom: '0.35rem',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 📱 MOBILE TOP HEADER BAR WITH HAMBURGER ICON */}
      {isMobile && (
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 1100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            >
              {mobileDrawerOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 style={{ fontSize: '14px', color: '#ec4899', margin: 0, fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>RADIANT ADMIN</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={toggleTheme} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '50%', padding: '6px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {isDark ? <Sun size={16} color="#d97706" /> : <Moon size={16} />}
            </button>
          </div>
        </header>
      )}

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* 🖥️ DESKTOP SIDEBAR PANEL (FIXED VIEWPORT LOCK) */}
        {!isMobile && (
          <div style={{ 
            width: '260px', 
            background: 'var(--bg-surface)', 
            padding: '1.75rem 1.25rem', 
            borderRight: '1px solid var(--border-color)', 
            display: 'flex', 
            flexDirection: 'column', 
            justify: 'space-between', 
            height: '100vh', 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            bottom: 0,
            zIndex: 100,
            boxSizing: 'border-box',
            overflowY: 'auto'
          }}>
            <div>
              <h2 style={{ fontSize: '13px', color: '#ec4899', marginBottom: '1.5rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', paddingLeft: '0.5rem' }}>RADIANT ADMIN</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <li key={item.id} onClick={() => { setActiveTab(item.id); setEditingStudentId(null); }} style={getSidebarItemStyle(item.id)}>
                      <IconComponent size={17} strokeWidth={2} />
                      {item.name}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              {/* 🌙 / ☀️ THEME TOGGLE SWITCH ROW */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.5rem', marginBottom: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isDark ? <Moon size={16} color="var(--text-primary)" /> : <Sun size={16} color="#d97706" />}
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isDark} onChange={toggleTheme} style={{ display: 'none' }} />
                  <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '20px', backgroundColor: isDark ? 'var(--accent-primary)' : '#cbd5e1', transition: '0.2s', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ffffff', transition: 'transform 0.2s', transform: isDark ? 'translateX(18px)' : 'translateX(2px)' }} />
                  </span>
                </label>
              </div>

              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', background: 'transparent', color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}>
                <LogOut size={16} strokeWidth={2} />
                Sign Out Session
              </button>
            </div>
          </div>
        )}

        {/* 📱 MOBILE SLIDE-OUT NAVIGATION DRAWER & BACKDROP */}
        {isMobile && mobileDrawerOpen && (
          <>
            <div 
              onClick={() => setMobileDrawerOpen(false)}
              style={{
                position: 'fixed',
                top: '57px',
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(3px)',
                zIndex: 1040,
                transition: 'opacity 0.2s ease'
              }}
            />

            <div style={{
              position: 'fixed',
              top: '57px',
              left: 0,
              bottom: 0,
              width: '280px',
              maxWidth: '80vw',
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-color)',
              zIndex: 1050,
              padding: '1.25rem 1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
            }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <li 
                      key={item.id} 
                      onClick={() => { 
                        setActiveTab(item.id); 
                        setEditingStudentId(null); 
                        setMobileDrawerOpen(false); 
                      }} 
                      style={getSidebarItemStyle(item.id)}
                    >
                      <IconComponent size={18} strokeWidth={2} />
                      {item.name}
                    </li>
                  );
                })}
              </ul>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', background: 'transparent', color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  <LogOut size={16} strokeWidth={2} />
                  Sign Out Session
                </button>
              </div>
            </div>
          </>
        )}

        {/* DYNAMIC CONTENT CANVAS FRAME */}
        <div style={{ 
          flex: 1, 
          marginLeft: isMobile ? 0 : '260px', 
          padding: isMobile ? '1.25rem 1rem 2rem 1rem' : '2.5rem 3.5rem', 
          boxSizing: 'border-box', 
          overflowY: 'auto', 
          width: isMobile ? '100%' : 'calc(100% - 260px)' 
        }}>
          
          {/* 1. SYSTEM OVERVIEW VIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>System Overview</h1>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px', fontWeight: '500' }}>Welcome back to your administration command platform.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.5rem 1rem', borderRadius: '50px', color: 'var(--accent-success)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-success)' }}></span>
                  Database Active
                </div>
              </header>

              {/* Dashboard Metric Grid Blocks */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-subtle)' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total Registered Students</p>
                    <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: 'var(--accent-primary)' }}>
                      {loading ? '...' : stats.totalStudents}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '0.75rem', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                    <Users size={22} />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-subtle)' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Active Faculty Teachers</p>
                    <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#ec4899' }}>
                      {loading ? '...' : stats.activeTeachers}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '0.75rem', borderRadius: '8px', color: '#ec4899' }}>
                    <FileText size={22} />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-subtle)' }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Database Link Status</p>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--accent-success)', fontFamily: 'monospace' }}>
                      {stats.databaseLink}
                    </h3>
                  </div>
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '8px', color: 'var(--accent-success)' }}>
                    <Activity size={22} />
                  </div>
                </div>
              </div>

              {/* Quick Action Navigation Cards Section */}
              <div style={{ background: 'var(--bg-surface)', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-subtle)' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '0.3px' }}>Quick Administration Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  
                  <div onClick={() => setActiveTab('enroll')} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ color: 'var(--accent-primary)' }}><UserPlus size={20} /></div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)' }}>Register New Profiles</h4>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Instantly generate verifiable system access keys for newcomers.</p>
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--accent-primary)' }} />
                  </div>

                  <div onClick={() => setActiveTab('directory')} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ color: 'var(--text-secondary)' }}><FolderOpen size={20} /></div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Access Student Directory</h4>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>View, sort, track, or handle records across your student bodies.</p>
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>

                </div>
              </div>
            </>
          )}

          {/* 2. ENROLL NEW STUDENT VIEW TAB */}
          {activeTab === 'enroll' && (
            <StudentRegistry 
              setActiveTab={setActiveTab} 
              studentId={null} 
            />
          )}

          {/* 3. LIVE STUDENT DIRECTORY DATA STREAM LAYER */}
          {activeTab === 'directory' && (
            <StudentDirectory 
              setActiveTab={setActiveTab} 
              onEditStudent={(id) => {
                setEditingStudentId(id);
                setActiveTab('edit-student');
              }}
            />
          )}

          {/* 4. INLINE EDIT STUDENT VIEW PANEL */}
          {activeTab === 'edit-student' && (
            <StudentRegistry 
              setActiveTab={setActiveTab} 
              studentId={editingStudentId} 
            />
          )}

          {/* 5. STAFF & TEACHER REGISTRY TAB */}
          {activeTab === 'teachers' && (
            <StaffRegistry />
          )}

          {/* 6. SET CLASS FEES SCHEDULE MATRIX */}
          {activeTab === 'fees' && (
            <SetClassFees />
          )}

          {/* 7. SYSTEM DEBTORS TRACKING LEDGER */}
          {activeTab === 'debtors' && (
            <DebtorsList />
          )}

          {/* 8. LIVE PAYMENTS DESK WORKSPACE TRANSACTION CONSOLE */}
          {activeTab === 'payments' && (
            <PaymentsDesk />
          )}

          {/* 9. SYSTEM SETTINGS DYNAMIC MANAGER PANEL */}
          {activeTab === 'settings' && (
            <SystemSettings />
          )}

          {/* 10. LEDGER SIGN-OFF & RECEIPT VERIFICATION DESK */}
          {activeTab === 'ledger' && (
            <ReceiptVerifier />
          )}

          {/* 11. PUBLISH & RELEASE RESULTS DESK */}
          {activeTab === 'release-results' && (
            <AdminReleaseDesk />
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;