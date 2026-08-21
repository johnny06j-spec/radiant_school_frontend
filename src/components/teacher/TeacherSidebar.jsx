// src/components/teacher/TeacherSidebar.jsx
import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  FileSpreadsheet, 
  CheckCircle2, 
  LogOut, 
  X, 
  Award,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

const TeacherSidebar = ({ activeTab, setActiveTab, mobileOpen, setMobileOpen, profile, onLogout }) => {
  // Check if profile is an Executive Role
  const isExecutive = profile?.role === 'headmaster' || profile?.role === 'principal' || profile?.department === 'Executive Administration';
  const roleTitle = profile?.role === 'headmaster' ? 'Headmaster' : (profile?.role === 'principal' ? 'Principal' : 'Teacher');

  // Teacher Class Teacher checks
  const isPrimary = profile?.schoolSection === 'PRIMARY';
  const isCT = isExecutive ? false : (isPrimary ? true : Boolean(profile?.isClassTeacher));
  const ctClass = isPrimary ? (profile?.assignedClass || 'KG 1') : (profile?.classTeacherOf || '');

  // Dynamic Navigation Items based on Executive vs Instructor Roles
  const navItems = isExecutive
    ? [
        { id: 'OVERVIEW', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'READY_RESULTS', label: 'Result Sign-Off Desk', icon: ShieldCheck }
      ]
    : [
        { id: 'OVERVIEW', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'RESULT_ENTRY', label: 'Result Entry', icon: FileSpreadsheet },
        { id: 'ATTENDANCE', label: 'Attendance Register', icon: CalendarCheck, isRestricted: !isCT },
        { id: 'READY_RESULTS', label: 'Ready Results', icon: CheckCircle2, isRestricted: !isCT }
      ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 40
          }}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        width: '260px',
        backgroundColor: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        transition: 'transform 0.3s ease-in-out',
        transform: mobileOpen || (window.innerWidth >= 1024) ? 'translateX(0)' : 'translateX(-100%)'
      }}>
        {/* BRAND HEADER */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isExecutive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(37, 99, 235, 0.15)', border: `1px solid ${isExecutive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isExecutive ? '#34d399' : '#60a5fa' }}>
                <GraduationCap size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' }}>RADIANT ERP</h2>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: isExecutive ? '#34d399' : '#94a3b8' }}>
                  {isExecutive ? `${roleTitle} Workspace` : 'Faculty Workspace'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setMobileOpen(false)} 
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* EXECUTIVE BADGE */}
          {isExecutive ? (
            <div style={{ margin: '16px 16px 8px 16px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(6, 78, 59, 0.4)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(4, 120, 87, 0.6)', color: '#6ee7b7' }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Section Executive</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>Full Oversight Desk</span>
              </div>
            </div>
          ) : isCT && (
            /* CLASS TEACHER BADGE */
            <div style={{ margin: '16px 16px 8px 16px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(58, 7, 100, 0.4)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(88, 28, 135, 0.6)', color: '#d8b4fe' }}>
                <Award size={18} />
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Class Teacher</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{ctClass}</span>
              </div>
            </div>
          )}

          {/* NAVIGATION LINKS */}
          <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    gap: '12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: isActive ? (isExecutive ? '#059669' : '#2563eb') : 'transparent',
                    color: isActive ? '#fff' : '#94a3b8',
                    border: 'none',
                    boxShadow: isActive ? `0 10px 15px -3px ${isExecutive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(37, 99, 235, 0.3)'}` : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} style={{ color: isActive ? '#fff' : '#64748b' }} />
                    <span>{item.label}</span>
                  </div>

                  {item.isRestricted && (
                    <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#64748b', fontFamily: 'monospace' }}>
                      Class Only
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* FOOTER USER PROFILE & EXIT */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e293b', backgroundColor: '#020617' }}>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.name || `${profile?.firstName} ${profile?.surname}`}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.username || profile?.email}
            </p>
          </div>

          <button
            onClick={onLogout}
            style={{
              width: '100%',
              minHeight: '40px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(69, 10, 10, 0.6)',
              border: '1px solid rgba(153, 27, 27, 0.5)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px'
            }}
          >
            <LogOut size={16} />
            <span>Exit Portal</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default TeacherSidebar;