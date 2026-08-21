// src/components/StudentSidebar.jsx
import React, { useState } from 'react';
import { 
  GraduationCap, LogOut, Moon, Sun, User, X, ChevronDown, Check, Plus, Loader2, Unlink
} from 'lucide-react';

const StudentSidebar = ({ 
  profile, 
  navItems, 
  activeTab, 
  onNavClick, 
  onSignOut, 
  isDark, 
  toggleTheme, 
  isMobile, 
  isDrawerOpen, 
  setIsDrawerOpen,
  linkedSiblings = [],
  onSwitchSibling,
  onOpenLinkModal,
  onUnlinkSibling
}) => {
  const [showChildrenList, setShowChildrenList] = useState(true);
  const [switchingId, setSwitchingId] = useState(null);
  const [unlinkingId, setUnlinkingId] = useState(null);

  const handleSwitch = async (siblingId) => {
    if (siblingId === profile.id || siblingId === profile._id) return;
    setSwitchingId(siblingId);
    await onSwitchSibling(siblingId);
    setSwitchingId(null);
  };

  const handleUnlink = async (e, siblingId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onUnlinkSibling) {
      alert("Unlink handler is not connected in dashboard props.");
      return;
    }

    setUnlinkingId(siblingId);
    try {
      await onUnlinkSibling(siblingId);
    } catch (err) {
      console.error("Failed to unlink sibling:", err);
    } finally {
      setUnlinkingId(null);
    }
  };

  const formatPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    return `http://localhost:5000/${photoPath.replace(/^\//, '')}`;
  };

  const safeSiblings = Array.isArray(linkedSiblings) ? linkedSiblings : [];
  
  const allChildren = [
    { 
      id: profile.id || profile._id, 
      name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Student', 
      class: profile.currentClass, 
      photo: formatPhotoUrl(profile.passportPhoto),
      active: true 
    },
    ...safeSiblings.map(s => {
      const resolvedName = s.name 
        ? s.name 
        : `${s.firstName || ''} ${s.surname || s.lastName || ''}`.trim();

      return {
        id: s._id || s.id,
        name: resolvedName || 'Sibling Student',
        class: s.currentClass || s.assignedClass || 'N/A',
        photo: formatPhotoUrl(s.passportPhoto),
        active: false
      };
    })
  ];

  const SidebarContent = () => (
    <>
      {/* 👤 TOP ACTIVE STUDENT CARD */}
      <div style={styles.topStudentCard}>
        <div style={styles.topAvatarWrapper}>
          {profile.passportPhoto ? (
            <img src={formatPhotoUrl(profile.passportPhoto)} alt="Passport" style={styles.topAvatarImg} />
          ) : (
            <User size={22} color="var(--text-muted)" />
          )}
          <div style={styles.onlineStatusBadge} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={styles.topStudentName}>{profile.firstName} {profile.lastName}</h3>
          <p style={styles.topStudentSub}>{profile.admissionNo} • {profile.currentClass}</p>
          <div style={styles.activePillBadge}>
            <span style={styles.activeDot} />
            <span>Active Student</span>
          </div>
        </div>
      </div>

      <div style={styles.divider} />

      {/* 🎓 PORTAL BRAND HEADER */}
      <div style={styles.sidebarBrand}>
        <div style={styles.brandIconBox}>
          <GraduationCap size={16} color="var(--accent-primary)" />
        </div>
        <div>
          <h2 style={styles.brandTitle}>STUDENT PORTAL</h2>
          <p style={styles.brandSubtitle}>Radiant College</p>
        </div>
      </div>

      {/* 👨‍👩‍👧 MULTI-CHILD SWITCHER ACCORDION */}
      <div style={{ marginTop: '16px', marginBottom: '8px' }}>
        <button 
          onClick={() => setShowChildrenList(!showChildrenList)} 
          style={styles.switchStudentDropdownBtn}
        >
          <span style={styles.switchStudentLabel}>SWITCH STUDENT ({allChildren.length})</span>
          <ChevronDown size={14} color="var(--text-muted)" style={{ transform: showChildrenList ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showChildrenList && (
          <div style={styles.childrenListContainer}>
            {allChildren.map(child => (
              <div 
                key={child.id} 
                style={{ 
                  ...styles.childCard, 
                  borderColor: child.active ? 'var(--accent-primary)' : 'var(--border-color)',
                  backgroundColor: child.active ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-main)',
                  opacity: (switchingId === child.id || unlinkingId === child.id) ? 0.6 : 1,
                }}
              >
                {/* 🟢 Switch Click Area */}
                <div 
                  onClick={() => handleSwitch(child.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, cursor: child.active ? 'default' : 'pointer' }}
                >
                  <div style={{ 
                    ...styles.childAvatarCircle, 
                    borderColor: child.active ? 'var(--accent-primary)' : 'var(--border-color)' 
                  }}>
                    {child.photo ? (
                      <img src={child.photo} alt={child.name} style={styles.childAvatarImg} />
                    ) : (
                      <User size={14} color="var(--text-secondary)" />
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ 
                      ...styles.childName, 
                      color: child.active ? 'var(--accent-primary)' : 'var(--text-primary)' 
                    }}>
                      {child.name}
                    </p>
                    <p style={styles.childClass}>{child.class}</p>
                  </div>
                </div>

                {/* 🟢 Independent Unlink Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {child.active ? (
                    <Check size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  ) : switchingId === child.id ? (
                    <Loader2 size={13} className="animate-spin" color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleUnlink(e, child.id)}
                      disabled={unlinkingId === child.id}
                      title="Unlink Student"
                      style={styles.unlinkActionBtn}
                    >
                      {unlinkingId === child.id ? (
                        <Loader2 size={12} className="animate-spin" color="var(--accent-danger)" />
                      ) : (
                        <Unlink size={12} color="var(--accent-danger)" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button onClick={onOpenLinkModal} style={styles.addChildBtn}>
              <Plus size={13} color="var(--accent-primary)" />
              <span>Link Another Student</span>
            </button>
          </div>
        )}
      </div>

      <nav style={styles.navMenu}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onNavClick(item.id)} 
              style={{ ...styles.navLink, ...(isActive ? styles.activeNavLink : {}) }}
            >
              <Icon size={16} color={isActive ? '#ffffff' : 'var(--text-secondary)'} /> 
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dark / Light Theme Toggle */}
      <div style={styles.themeToggleRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDark ? <Moon size={16} color="var(--text-primary)" /> : <Sun size={16} color="#d97706" />}
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>
        <label style={styles.switchLabel}>
          <input type="checkbox" checked={isDark} onChange={toggleTheme} style={{ display: 'none' }} />
          <span style={{ ...styles.switchSlider, backgroundColor: isDark ? 'var(--accent-primary)' : '#cbd5e1' }}>
            <span style={{ ...styles.switchKnob, transform: isDark ? 'translateX(16px)' : 'translateX(2px)' }} />
          </span>
        </label>
      </div>

      <button onClick={onSignOut} style={styles.sidebarSignOut}>
        <LogOut size={16} /> <span>Sign Out Session</span>
      </button>
    </>
  );

  if (!isMobile) {
    return (
      <aside style={styles.sidebar}>
        <SidebarContent />
      </aside>
    );
  }

  if (!isDrawerOpen) return null;

  return (
    <div style={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
      <div style={styles.drawerContainer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.drawerHeader}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>NAVIGATION MENU</h3>
          <button onClick={() => setIsDrawerOpen(false)} style={styles.drawerCloseBtn}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        <div style={styles.divider} />
        <SidebarContent />
      </div>
    </div>
  );
};

const styles = {
  sidebar: { width: '260px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '20px 14px', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100, boxSizing: 'border-box', overflowY: 'auto' },
  topStudentCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0 8px 0' },
  topAvatarWrapper: { position: 'relative', width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--accent-primary)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--bg-main)' },
  topAvatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  onlineStatusBadge: { position: 'absolute', bottom: '0px', right: '0px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid var(--bg-surface)' },
  topStudentName: { margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  topStudentSub: { margin: '2px 0 0 0', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' },
  activePillBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', padding: '2px 6px', borderRadius: '12px', fontSize: '9px', fontWeight: '800', marginTop: '4px' },
  activeDot: { width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-success)' },
  divider: { height: '1px', backgroundColor: 'var(--border-color)', margin: '12px 0' },
  sidebarBrand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandIconBox: { width: '26px', height: '26px', borderRadius: '6px', backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandTitle: { margin: 0, fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px', color: 'var(--text-primary)', whiteSpace: 'nowrap' },
  brandSubtitle: { margin: 0, fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500' },
  navMenu: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, marginTop: '8px', overflowY: 'auto' },
  navLink: { display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', textAlign: 'left', cursor: 'pointer', width: '100%' },
  activeNavLink: { background: 'var(--accent-primary)', color: '#ffffff' },
  sidebarSignOut: { display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', color: 'var(--accent-danger)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textAlign: 'left', cursor: 'pointer', marginTop: 'auto', width: '100%' },
  switchStudentDropdownBtn: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer' },
  switchStudentLabel: { fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '0.5px' },
  childrenListContainer: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' },
  childCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', transition: 'all 0.2s' },
  childAvatarCircle: { width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', flexShrink: 0 },
  childAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  childName: { margin: 0, fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  childClass: { margin: '1px 0 0 0', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500' },
  unlinkActionBtn: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', outline: 'none' },
  addChildBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px dashed var(--border-color)', padding: '8px 10px', borderRadius: '8px', color: 'var(--accent-primary)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', width: '100%', justifyContent: 'center' },
  drawerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3, 7, 18, 0.75)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex' },
  drawerContainer: { width: '270px', height: '100%', maxHeight: '100vh', backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '16px', boxShadow: 'var(--shadow-main)', boxSizing: 'border-box' },
  drawerHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  drawerCloseBtn: { background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', flexShrink: 0 },
  themeToggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', marginTop: 'auto' },
  switchLabel: { position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' },
  switchSlider: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '20px', transition: '0.2s', display: 'flex', alignItems: 'center' },
  switchKnob: { position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ffffff', transition: 'transform 0.2s' }
};

export default StudentSidebar;