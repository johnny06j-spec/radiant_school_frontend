// src/components/StudentDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, BookOpen, CreditCard, FileText, 
  RefreshCw, ShieldAlert, LayoutDashboard, Settings, 
  Calendar, CheckCircle2, GraduationCap, ArrowUpRight,
  Menu
} from 'lucide-react';
import API from '../api/axiosInstance';
import InstitutionLogo from "../assets/Logo.jpg";
import { useTheme } from '../context/ThemeContext.jsx';

import StudentSidebar from './StudentSidebar.jsx';
import LinkStudentModal from './LinkStudentModal.jsx';

import MyBiodataSheet from "../views/MyBiodataSheet.jsx";
import AcademicRecords from "../views/AcademicRecords.jsx";
import StudentFinance from "../views/student/StudentFinance.jsx"; 
import Attendance from "../views/Attendance.jsx";
import SettingsView from "../views/Settings.jsx";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [activeStudentId, setActiveStudentId] = useState(null); // Explicit Active Student Tracker
  const [studentData, setStudentData] = useState(null);
  const [linkedSiblings, setLinkedSiblings] = useState([]);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async (targetStudentId = null) => {
    try {
      setLoading(true);
      const endpoint = targetStudentId 
        ? `/students/profile/me?studentId=${targetStudentId}` 
        : '/students/profile/me';

      const response = await API.get(endpoint);
      if (response.data?.success && response.data?.student) {
        const student = response.data.student;
        setStudentData(student);
        setActiveStudentId(student._id); // Sync active student ID in state

        // Preserve siblings list across profile switches
        if (student.linkedSiblings && Array.isArray(student.linkedSiblings)) {
          setLinkedSiblings(student.linkedSiblings);
        }

        const activeSession = student.academicSession || "2026/2027";
        const activeTerm = student.academicTerm || "First Term";

        const ledgerRes = await API.get(`/finance/student-ledger/${student._id}?term=${encodeURIComponent(activeTerm)}&session=${encodeURIComponent(activeSession)}`);
        if (ledgerRes.data?.success) {
          setLedgerData(ledgerRes.data.data);
        }
      }
    } catch (err) {
      console.error("Dashboard layout error:", err);
      setError(err.response?.data?.message || "Failed to load profile parameters.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);

    // Check if coming back from Paystack redirect with ?studentId=...
    const queryParams = new URLSearchParams(location.search);
    const redirectStudentId = queryParams.get('studentId');

    if (redirectStudentId) {
      setActiveStudentId(redirectStudentId);
      fetchDashboardData(redirectStudentId);
    } else {
      fetchDashboardData();
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [fetchDashboardData, location.search]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (isDrawerOpen) setIsDrawerOpen(false);
  };

  const handleSwitchSibling = async (siblingId) => {
    setActiveStudentId(siblingId);
    await fetchDashboardData(siblingId);
  };

  const handleSiblingLinked = (updatedSiblings) => {
    if (Array.isArray(updatedSiblings)) {
      setLinkedSiblings(updatedSiblings);
    }
    fetchDashboardData(activeStudentId || studentData?._id);
  };

  // 🟢 UNLINK SIBLING HANDLER
  const handleUnlinkSibling = async (siblingId) => {
    try {
      const response = await API.post('/students/unlink-sibling', { siblingId });
      if (response.data?.success) {
        const updatedList = response.data.linkedSiblings || [];
        setLinkedSiblings(updatedList);
        
        // Refresh active profile parameters if needed
        await fetchDashboardData(activeStudentId || studentData?._id);
      }
    } catch (err) {
      console.error("Error unlinking sibling:", err);
      alert(err.response?.data?.message || "Failed to unlink sibling account.");
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <RefreshCw size={28} style={styles.spinner} className="animate-spin" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorWrapper}>
        <ShieldAlert size={40} color="var(--accent-danger)" />
        <p style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{error}</p>
        <button onClick={handleSignOut} style={styles.errorBtn}>Return to Login</button>
      </div>
    );
  }

  const profile = {
    id: studentData?._id || activeStudentId || null, 
    firstName: studentData?.firstName || "Student",
    lastName: studentData?.lastName || "",
    admissionNo: studentData?.admissionNo || "N/A",
    currentClass: studentData?.currentClass || studentData?.assignedClass || "N/A",
    academicSession: studentData?.academicSession || "2026/2027",
    academicTerm: studentData?.academicTerm || "First Term",
    admissionSession: studentData?.intakeSession || studentData?.admissionSession || "2026/2027", 
    admissionTerm: studentData?.intakeTerm || studentData?.admissionTerm || "First Term",
    status: studentData?.status || "Active",
    enrollmentType: studentData?.enrollmentType || "Returning Student",
    gender: studentData?.gender || "N/A",
    dob: studentData?.dob && studentData.dob !== "N/A" ? new Date(studentData.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A",
    passportPhoto: studentData?.passportPhoto 
      ? (studentData.passportPhoto.startsWith('http') 
          ? studentData.passportPhoto 
          : `http://localhost:5000/${studentData.passportPhoto.replace(/^\//, '')}`)
      : null
  };

  const finance = {
    currentTermFee: ledgerData?.currentTermFee ?? studentData?.financialSummary?.currentTermFee ?? 0,
    totalPaid: ledgerData?.totalPaid ?? studentData?.financialSummary?.totalPaid ?? 0,
    previousOutstanding: ledgerData?.previousOutstanding ?? studentData?.financialSummary?.previousOutstanding ?? 0,
    totalOutstanding: ledgerData?.totalOutstanding ?? studentData?.financialSummary?.totalOutstanding ?? 0
  };

  const breakdownData = [];
  if (finance.previousOutstanding > 0) {
    breakdownData.push({
      term: "Arrears / Prior Term Debt",
      amount: finance.previousOutstanding,
      status: "Debt Outstanding"
    });
  }

  if (finance.currentTermFee > 0) {
    const currentTermOutstanding = ledgerData?.currentTermOutstanding ?? Math.max(0, finance.currentTermFee - finance.totalPaid);
    breakdownData.push({
      term: "Current Term Balance",
      amount: currentTermOutstanding,
      status: currentTermOutstanding > 0 ? "Unpaid" : "Cleared"
    });
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'biodata', label: 'Profile', icon: User },
    { id: 'academics', label: 'Academics', icon: BookOpen },
    { id: 'payments', label: 'Finance', icon: CreditCard },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div style={styles.dashboardContainer}>
      
      {/* SIDEBAR / DRAWER */}
      <StudentSidebar 
        profile={profile}
        navItems={navItems}
        activeTab={activeTab}
        onNavClick={handleNavClick}
        onSignOut={handleSignOut}
        isDark={isDark}
        toggleTheme={toggleTheme}
        isMobile={isMobile}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        linkedSiblings={linkedSiblings}
        onSwitchSibling={handleSwitchSibling}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
        onUnlinkSibling={handleUnlinkSibling}
      />

      {/* MOBILE TOP BAR */}
      {isMobile && (
        <header style={styles.mobileTopBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button onClick={() => setIsDrawerOpen(true)} style={styles.hamburgerBtn} aria-label="Open Navigation Menu">
              <Menu size={20} color="var(--text-primary)" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={styles.brandIconBox}>
                <GraduationCap size={15} color="var(--accent-primary)" />
              </div>
              <h2 style={styles.brandTitle}>STUDENT PORTAL</h2>
            </div>
          </div>
          <div style={styles.activeSessionBadge}>
            <div style={styles.pulseDot} />
            <span>ACTIVE</span>
          </div>
        </header>
      )}

      {/* MAIN CONTENT AREA */}
      <main style={{
        ...styles.mainContent,
        marginLeft: isMobile ? '0' : '260px',
        padding: isMobile ? '72px 12px 84px 12px' : '32px 40px'
      }}>
        
        {activeTab === 'overview' && (
          <div style={styles.viewContainer}>
            
            {/* Header Title */}
            <div style={styles.welcomeRow}>
              <div>
                <h1 style={{ ...styles.welcomeText, fontSize: isMobile ? '18px' : '24px' }}>
                  Welcome back, <span style={{ color: 'var(--accent-primary)' }}>{profile.firstName}!</span>
                </h1>
                <p style={styles.welcomeSubtitle}>Here's your academic and financial overview.</p>
              </div>
            </div>

            {/* PROFILE CARD */}
            <section style={{ ...styles.profileSummaryHeaderCard, padding: isMobile ? '14px' : '24px' }}>
              {isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-primary)', flexShrink: 0 }}>
                      {profile.passportPhoto ? (
                        <img src={profile.passportPhoto} alt="Passport" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={24} color="var(--text-muted)" style={{ margin: '10px auto' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {profile.firstName} {profile.lastName}
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '700' }}>
                        {profile.admissionNo} • <span style={{ color: 'var(--text-secondary)' }}>{profile.currentClass}</span>
                      </p>
                    </div>
                    <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                      {profile.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <span style={styles.inlineCardLabel}>Intake Session / Term</span>
                      <p style={styles.inlineCardValue}>{profile.admissionSession} ({profile.admissionTerm})</p>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <span style={styles.inlineCardLabel}>Current Term</span>
                      <p style={styles.inlineCardValue}>{profile.academicTerm}</p>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <span style={styles.inlineCardLabel}>Student Type</span>
                      <p style={styles.inlineCardValue}>{profile.enrollmentType}</p>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <span style={styles.inlineCardLabel}>Gender</span>
                      <p style={styles.inlineCardValue}>{profile.gender}</p>
                    </div>
                  </div>

                  <button onClick={() => setActiveTab('biodata')} style={{ ...styles.viewFullProfileButton, width: '100%', justifyContent: 'center' }}>
                    <User size={13} /> <span>View Full Biodata</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', width: '100%', gap: '32px', alignItems: 'center' }}>
                  <div style={styles.avatarFlexColumn}>
                    <div style={styles.avatarCircleBorder}>
                      <div style={styles.avatarFallbackGraphic}>
                        {profile.passportPhoto ? (
                          <img src={profile.passportPhoto} alt="Passport" style={styles.avatarImageRender} />
                        ) : (
                          <User size={40} color="var(--text-muted)" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ ...styles.profileMetadataColumnsGrid, gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div style={styles.metaDataGroupingStack}>
                      <div style={styles.metaItemLineRow}>
                        <FileText size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <span style={styles.inlineCardLabel}>Admission No.</span>
                          <p style={styles.inlineCardValue}>{profile.admissionNo}</p>
                        </div>
                      </div>
                      <div style={styles.metaItemLineRow}>
                        <Calendar size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <span style={styles.inlineCardLabel}>Date of Birth</span>
                          <p style={styles.inlineCardValue}>{profile.dob}</p>
                        </div>
                      </div>
                      <div style={styles.metaItemLineRow}>
                        <User size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <span style={styles.inlineCardLabel}>Gender</span>
                          <p style={styles.inlineCardValue}>{profile.gender}</p>
                        </div>
                      </div>
                    </div>

                    <div style={styles.metaDataGroupingStack}>
                      <div style={styles.metaItemLineRow}>
                        <Calendar size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <span style={styles.inlineCardLabel}>Intake Session / Term</span>
                          <p style={styles.inlineCardValue}>{profile.admissionSession} ({profile.admissionTerm})</p>
                        </div>
                      </div>
                      <div style={styles.metaItemLineRow}>
                        <Calendar size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <span style={styles.inlineCardLabel}>Current Academic Session</span>
                          <p style={styles.inlineCardValue}>{profile.academicSession}</p>
                        </div>
                      </div>
                      <div style={styles.metaItemLineRow}>
                        <Calendar size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <span style={styles.inlineCardLabel}>Current Academic Term</span>
                          <p style={styles.inlineCardValue}>{profile.academicTerm}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ ...styles.metaDataGroupingStack, borderRight: 'none' }}>
                      <div style={styles.metaItemLineRow}>
                        <GraduationCap size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <span style={styles.inlineCardLabel}>Current Class</span>
                          <p style={styles.inlineCardValue}>{profile.currentClass}</p>
                        </div>
                      </div>
                      <div style={styles.metaItemLineRow}>
                        <User size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <span style={styles.inlineCardLabel}>Student type</span>
                          <p style={styles.inlineCardValue}>{profile.enrollmentType}</p>
                        </div>
                      </div>
                      <div style={styles.metaItemLineRow}>
                        <CheckCircle2 size={14} color="var(--accent-success)" style={{ marginTop: '2px' }} />
                        <div>
                          <span style={styles.inlineCardLabel}>Status</span>
                          <p style={{ ...styles.inlineCardValue, color: 'var(--accent-success)' }}>{profile.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setActiveTab('biodata')} style={styles.viewFullProfileButton}>
                    <User size={14} /> <span>View Full Profile</span>
                  </button>
                </div>
              )}
            </section>

            {/* FINANCIAL SUMMARY CARDS GRID */}
            <div>
              <h2 style={styles.sectionHeaderTitle}>FINANCIAL SUMMARY</h2>
              <section style={{
                ...styles.financialCardsGridContainer,
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                gap: isMobile ? '8px' : '16px',
                marginTop: '8px'
              }}>
                <div style={{ ...styles.financeMetricCard, borderLeft: '3px solid var(--accent-primary)', padding: isMobile ? '10px' : '16px' }}>
                  <span style={{ ...styles.finLabelText, color: 'var(--accent-primary)', fontSize: isMobile ? '9px' : '11px' }}>CURRENT TERM FEE</span>
                  <p style={{ ...styles.finAmountNumericalDisplay, fontSize: isMobile ? '15px' : '22px' }}>₦{finance.currentTermFee.toLocaleString('en-NG', { minimumFractionDigits: 0 })}</p>
                </div>

                <div style={{ ...styles.financeMetricCard, borderLeft: '3px solid var(--accent-success)', padding: isMobile ? '10px' : '16px' }}>
                  <span style={{ ...styles.finLabelText, color: 'var(--accent-success)', fontSize: isMobile ? '9px' : '11px' }}>TOTAL PAID</span>
                  <p style={{ ...styles.finAmountNumericalDisplay, color: 'var(--accent-success)', fontSize: isMobile ? '15px' : '22px' }}>₦{finance.totalPaid.toLocaleString('en-NG', { minimumFractionDigits: 0 })}</p>
                </div>

                <div style={{ ...styles.financeMetricCard, borderLeft: '3px solid var(--accent-warning)', padding: isMobile ? '10px' : '16px' }}>
                  <span style={{ ...styles.finLabelText, color: 'var(--accent-warning)', fontSize: isMobile ? '9px' : '11px' }}>PREVIOUS OUTSTANDING</span>
                  <p style={{ ...styles.finAmountNumericalDisplay, color: 'var(--accent-warning)', fontSize: isMobile ? '15px' : '22px' }}>₦{finance.previousOutstanding.toLocaleString('en-NG', { minimumFractionDigits: 0 })}</p>
                </div>

                <div style={{ ...styles.financeMetricCard, borderLeft: '3px solid var(--accent-danger)', padding: isMobile ? '10px' : '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ ...styles.finLabelText, color: 'var(--accent-danger)', fontSize: isMobile ? '9px' : '11px' }}>TOTAL OUTSTANDING</span>
                    <p style={{ ...styles.finAmountNumericalDisplay, color: 'var(--accent-danger)', fontSize: isMobile ? '15px' : '22px' }}>₦{finance.totalOutstanding.toLocaleString('en-NG', { minimumFractionDigits: 0 })}</p>
                  </div>
                  {finance.totalOutstanding > 0 && (
                    <button onClick={() => setActiveTab('payments')} style={{ ...styles.paymentActionCardButton, marginTop: '6px', padding: '5px 6px', fontSize: '10px' }}>
                      <span>Pay Now</span> <ArrowUpRight size={11} />
                    </button>
                  )}
                </div>
              </section>
            </div>

            {/* LOWER BREAKDOWN & SHORTCUTS */}
            <section style={{
              ...styles.splitLayoutRowContainer,
              gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr',
              gap: '16px'
            }}>
              <div style={{ ...styles.innerSectionPanelCard, padding: isMobile ? '12px' : '20px' }}>
                <h3 style={styles.panelCardHeadingLabel}>OUTSTANDING BREAKDOWN</h3>
                <div style={styles.tableResponsiveFrame}>
                  <table style={styles.dataGridTableSheet}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeadingCell}>TERM</th>
                        <th style={styles.tableHeadingCell}>UNPAID</th>
                        <th style={styles.tableHeadingCell}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdownData.length > 0 ? (
                        breakdownData.map((row, index) => (
                          <tr key={index} style={styles.tableBodyRow}>
                            <td style={styles.tableBodyCell}>{row.term}</td>
                            <td style={{ ...styles.tableBodyCell, color: 'var(--accent-danger)', fontWeight: '600' }}>₦{row.amount.toLocaleString('en-NG')}</td>
                            <td style={styles.tableBodyCell}><span style={styles.inlineWarningStatusBadge}>{row.status}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr style={styles.tableBodyRow}>
                          <td colSpan="3" style={{ ...styles.tableBodyCell, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No pending financial liabilities discovered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ ...styles.innerSectionPanelCard, padding: isMobile ? '12px' : '20px' }}>
                <h3 style={styles.panelCardHeadingLabel}>QUICK NAVIGATION CHANNELS</h3>
                <div style={styles.shortcutsVerticalStackContainer}>
                  <button onClick={() => setActiveTab('academics')} style={styles.shortcutItemInteractiveCard}>
                    <div style={styles.shortcutFlexRowHeadingLeft}>
                      <div style={styles.shortcutIconContextFrame}><BookOpen size={14} color="var(--accent-primary)" /></div>
                      <span style={styles.shortcutTitleTextLabel}>Terminal Report Cards</span>
                    </div>
                    <ArrowUpRight size={14} color="var(--text-muted)" />
                  </button>

                  <button onClick={() => setActiveTab('payments')} style={styles.shortcutItemInteractiveCard}>
                    <div style={styles.shortcutFlexRowHeadingLeft}>
                      <div style={styles.shortcutIconContextFrame}><CreditCard size={14} color="var(--accent-success)" /></div>
                      <span style={styles.shortcutTitleTextLabel}>Fee Statement Ledger</span>
                    </div>
                    <ArrowUpRight size={14} color="var(--text-muted)" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 🟢 FIXED: Active student object passed cleanly to AcademicRecords */}
        {activeTab === 'biodata' && <MyBiodataSheet studentData={profile} InstitutionLogo={InstitutionLogo} isMobile={isMobile} styles={styles} />}
        {activeTab === 'academics' && <AcademicRecords activeStudent={studentData || profile} />}
        {activeTab === 'payments' && <StudentFinance studentId={activeStudentId || profile.id} />}
        {activeTab === 'attendance' && <Attendance studentData={profile} />}
        {activeTab === 'settings' && <SettingsView studentData={profile} />}
      </main>

      {/* LINK SIBLING MODAL */}
      <LinkStudentModal 
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSiblingLinked={handleSiblingLinked}
      />
    </div>
  );
};

const styles = {
  dashboardContainer: { display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, sans-serif', width: '100%', overflowX: 'hidden' },
  mobileTopBar: { height: '56px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, width: '100%', boxSizing: 'border-box' },
  hamburgerBtn: { background: 'transparent', border: 'none', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  brandIconBox: { width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandTitle: { margin: 0, fontSize: '12px', fontWeight: '800', letterSpacing: '0.4px', color: 'var(--text-primary)', whiteSpace: 'nowrap' },
  activeSessionBadge: { display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '3px 8px', borderRadius: '16px', color: 'var(--accent-success)', fontSize: '10px', fontWeight: '700', flexShrink: 0 },
  pulseDot: { width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-success)' },

  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, boxSizing: 'border-box' },
  viewContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  welcomeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcomeText: { margin: 0, fontWeight: '700', letterSpacing: '-0.3px', color: 'var(--text-primary)' },
  welcomeSubtitle: { margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '12px' },
  
  profileSummaryHeaderCard: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', width: '100%', boxSizing: 'border-box' },
  avatarFlexColumn: { display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarCircleBorder: { width: '90px', height: '90px', borderRadius: '50%', border: '2px solid var(--border-color)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarFallbackGraphic: { width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImageRender: { width: '100%', height: '100%', objectFit: 'cover' },
  profileMetadataColumnsGrid: { flex: 1, display: 'grid' },
  metaDataGroupingStack: { display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid var(--border-color)', paddingRight: '8px' },
  metaItemLineRow: { display: 'flex', gap: '10px' },
  inlineCardLabel: { fontSize: '9px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' },
  inlineCardValue: { fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', margin: '2px 0 0 0' },
  viewFullProfileButton: { display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  
  sectionHeaderTitle: { margin: 0, fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' },
  financialCardsGridContainer: { display: 'grid' },
  financeMetricCard: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' },
  finLabelText: { fontWeight: '700', letterSpacing: '0.3px' },
  finAmountNumericalDisplay: { margin: '4px 0 0 0', fontWeight: '700', color: 'var(--text-primary)' },
  paymentActionCardButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', background: 'var(--accent-danger)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' },

  splitLayoutRowContainer: { display: 'grid' },
  innerSectionPanelCard: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', boxSizing: 'border-box' },
  panelCardHeadingLabel: { margin: '0 0 12px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' },
  tableResponsiveFrame: { overflowX: 'auto' },
  dataGridTableSheet: { width: '100%', borderCollapse: 'collapse' },
  tableHeadingCell: { padding: '6px 8px', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' },
  tableBodyRow: { borderBottom: '1px solid var(--border-color)' },
  tableBodyCell: { padding: '10px 8px', fontSize: '11px', color: 'var(--text-secondary)' },
  inlineWarningStatusBadge: { background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' },
  
  shortcutsVerticalStackContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  shortcutItemInteractiveCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' },
  shortcutFlexRowHeadingLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  shortcutIconContextFrame: { width: '24px', height: '24px', borderRadius: '6px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  shortcutTitleTextLabel: { fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' },
  
  loadingWrapper: { minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  errorWrapper: { minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' },
  errorBtn: { background: 'var(--accent-primary)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  spinner: { color: 'var(--accent-primary)' }
};

export default StudentDashboard;