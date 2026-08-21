// src/views/PaymentsDesk.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, AlertTriangle, FileText, Loader2, SlidersHorizontal } from 'lucide-react';
import AdjustmentModal from '../components/admin/AdjustmentModal';

const PaymentsDesk = () => {
  // --- CORE SEARCH & ROUTING STATE ---
  const [searchBy, setSearchBy] = useState('Admission Number');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetClass, setTargetClass] = useState('All');
  
  // Dynamic Active Settings
  const [activeSession, setActiveSession] = useState('2026/2027');
  const [activeTerm, setActiveTerm] = useState('First Term');

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // --- ADMINISTRATIVE ADJUSTMENT MODAL STATE ---
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [selectedStudentForAdjustment, setSelectedStudentForAdjustment] = useState(null);
  
  // --- FINANCIAL STATS STACKS (DRIVEN BY BACKEND) ---
  const [globalMetrics, setGlobalMetrics] = useState({ grossExpectedRevenue: 0, totalNetCollected: 0, totalSystemArrears: 0 });
  const [itemizedFees, setItemizedFees] = useState([]);
  const [studentLedgerData, setStudentLedgerData] = useState({
    currentTermFee: 0,
    totalPaid: 0,
    previousOutstanding: 0,
    totalOutstanding: 0
  });
  
  // --- TRANSACTION CONSOLE STATE ---
  const [fetching, setFetching] = useState(false);

  // 🔄 Global Refresh Engine - Calls endpoint without hardcoded query params so backend falls back to active SystemConfig
  const fetchGlobalMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/finance/dashboard-summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setGlobalMetrics(result.data);
      }
    } catch (err) {
      console.error("Failed to sync global financial data framework:", err);
    }
  };

  // 📂 Live Calculation Sheet Pull
  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setFilteredStudents([]);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/finance/student-ledger/${student._id}?term=${encodeURIComponent(activeTerm)}&session=${encodeURIComponent(activeSession)}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const result = await response.json();
      
      if (result.success && result.data) {
        setItemizedFees(result.data.items || []);
        setStudentLedgerData({
          currentTermFee: result.data.currentTermFee || 0,
          totalPaid: result.data.totalPaid || 0,
          previousOutstanding: result.data.previousOutstanding || 0,
          totalOutstanding: result.data.totalOutstanding || 0
        });
      }
    } catch (err) {
      console.error("Error context matching individual profile ledger:", err);
      setItemizedFees([]);
    }
  };

  // 🔄 Master Interface Recalculation Chain Trigger
  const triggerMasterDataRefresh = useCallback(async () => {
    await fetchGlobalMetrics();
    if (selectedStudent) {
      await handleSelectStudent(selectedStudent);
    }
  }, [selectedStudent, activeTerm, activeSession]);

  // 🚀 Initial Sync Layout Loop
  useEffect(() => {
    const fetchInitialDirectory = async () => {
      setFetching(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch Active System Configuration first
const configRes = await fetch('http://localhost:5000/api/system/config', { headers }).catch(() => null);
        if (configRes && configRes.ok) {
          const configData = await configRes.json();
          if (configData.data) {
            if (configData.data.currentSession) setActiveSession(configData.data.currentSession);
            if (configData.data.currentTerm) setActiveTerm(configData.data.currentTerm);
          }
        }

        // 2. Fetch Metrics
        await fetchGlobalMetrics();

        // 3. Fetch Directory
        const studentsResponse = await fetch('http://localhost:5000/api/finance/directory', { headers });
        const studentsData = await studentsResponse.json();
        
        if (studentsData.success) {
          const rawList = studentsData.data || studentsData.students || [];
          const normalized = rawList.map(s => ({
            ...s,
            name: s.name || `${s.firstName || ''} ${s.surname || ''}`.trim() || 'Active Student'
          }));
          setStudents(normalized);
        }
      } catch (err) {
        console.error("Baseline initialization routine fail:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchInitialDirectory();
  }, []);

  // 🔍 Interactive Filter Processing Matrix
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const matches = students.filter(s => {
      const fieldToSearch = searchBy === 'Admission Number' ? s.admissionNo : s.name;
      const matchesClass = targetClass === 'All' || s.assignedClass === targetClass || s.currentClass === targetClass;
      return fieldToSearch?.toLowerCase().includes(query) && matchesClass;
    });
    setFilteredStudents(matches);
  }, [searchQuery, searchBy, targetClass, students]);

  // 🎛️ Open Financial Override Trigger
  const handleOpenAdjustment = (e, student) => {
    e.stopPropagation();
    setSelectedStudentForAdjustment(student);
    setIsAdjustmentOpen(true);
  };

  // 🧮 Live Client State View Projections
  const totalBill = studentLedgerData.currentTermFee + studentLedgerData.previousOutstanding;
  const totalPaid = studentLedgerData.totalPaid;
  const outstandingBalance = studentLedgerData.totalOutstanding;
  const progressPercent = totalBill > 0 ? Math.min(Math.round((totalPaid / totalBill) * 100), 100) : 0;

  return (
    <div style={{ flex: 1, color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'system-ui, -apple-system, sans-serif', background: 'var(--bg-main)', minHeight: '100vh', padding: '1rem 0', boxSizing: 'border-box' }}>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-loader { animation: spin 1s linear infinite; }
      `}</style>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>FINANCE COMMAND PORTAL</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>Review student billing profiles, manage term adjustments, and monitor collection progress ({activeSession} - {activeTerm})</p>
        </div>
        {fetching && <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}><Loader2 size={16} className="spin-loader" /> Syncing directory...</div>}
      </header>

      {/* 📊 DYNAMIC GLOBAL TILES OVERVIEW TRACKS */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-subtle)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fees Expected Revenue</p>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: '800', color: 'var(--accent-primary)' }}>₦{globalMetrics.grossExpectedRevenue?.toLocaleString() || '0'}</h3>
          </div>
          <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '0.75rem', borderRadius: '8px', color: 'var(--accent-primary)' }}><FileText size={22} /></div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-subtle)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total fees collected</p>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: '800', color: 'var(--accent-success)' }}>₦{globalMetrics.totalNetCollected?.toLocaleString() || '0'}</h3>
          </div>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '8px', color: 'var(--accent-success)' }}><Users size={22} /></div>
        </div>
        
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-subtle)' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total fees outstanding</p>
            <h3 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: '800', color: 'var(--accent-danger)' }}>₦{globalMetrics.totalSystemArrears?.toLocaleString() || '0'}</h3>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', color: 'var(--accent-danger)' }}><AlertTriangle size={22} /></div>
        </div>
      </section>

      {/* 🔍 SEARCH AND DIRECTORY FILTER ENGINE */}
      <section style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem', boxShadow: 'var(--shadow-subtle)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder={`Search student by ${searchBy}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }} />
          </div>
          <select value={searchBy} onChange={(e) => setSearchBy(e.target.value)} style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', outline: 'none', fontSize: '13px', cursor: 'pointer' }}>
            <option value="Admission Number">Admission Number</option>
            <option value="Student Name">Student Name</option>
          </select>
          <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)} style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', outline: 'none', fontSize: '13px', cursor: 'pointer' }}>
            <option value="All">All Classes</option>
            <option value="KG 1">KG 1</option>
            <option value="KG 2">KG 2</option>
            <option value="Basic 1">Basic 1</option>
            <option value="Basic 2">Basic 2</option>
            <option value="Basic 3">Basic 3</option>
            <option value="Basic 4">Basic 4</option>
            <option value="Basic 5">Basic 5</option>
            <option value="JSS 1">JSS 1</option>
            <option value="JSS 2">JSS 2</option>
            <option value="JSS 3">JSS 3</option>
            <option value="SSS 1">SSS 1</option>
            <option value="SSS 2">SSS 2</option>
            <option value="SSS 3">SSS 3</option>
          </select>
        </div>

        {filteredStudents.length > 0 && (
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '0.5rem', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
            {filteredStudents.map((student) => (
              <div key={student._id} onClick={() => handleSelectStudent(student)} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s' }}>
                <div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '700', marginRight: '8px' }}>{student.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{student.admissionNo} • {student.assignedClass || student.currentClass || student.className}</span>
                </div>
                <button 
                  onClick={(e) => handleOpenAdjustment(e, student)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', outline: 'none' }}
                >
                  <SlidersHorizontal size={12} />
                  <span>Adjust Fee</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WORKING MATRIX GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedStudent ? (
            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.5px' }}>Account Summary</h3>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700' }}>{selectedStudent.name}</p>
                </div>
                <button 
                  onClick={(e) => handleOpenAdjustment(e, selectedStudent)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#d97706', border: 'none', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', outline: 'none' }}
                >
                  <SlidersHorizontal size={12} />
                  <span>Apply Adjustment</span>
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>CURRENT TERM FEE</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>₦{studentLedgerData.currentTermFee.toLocaleString()}</p>
                </div>
                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>PREVIOUS DEBTS</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '900', color: '#d97706' }}>₦{studentLedgerData.previousOutstanding.toLocaleString()}</p>
                </div>
              </div>

              <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--accent-danger)', borderTop: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>OUTSTANDING BALANCE DUE</span>
                <p style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '900', color: 'var(--accent-danger)' }}>₦{outstandingBalance.toLocaleString()}</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', marginBottom: '0.5rem' }}>
                  <span>COLLECTION DEPTH PROGRESS</span>
                  <span style={{ color: 'var(--accent-success)' }}>{progressPercent}%</span>
                </div>
                <div style={{ width: '100%', background: 'var(--bg-main)', height: '6px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: `${progressPercent}%`, background: 'var(--accent-success)', height: '100%', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '12px', fontWeight: '600' }}>
              Select a valid student directory file row mapping above to invoke dynamic matrix calculations.
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedStudent && (
            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-subtle)' }}>
              <h3 style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>Itemized Current Target Fee Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {itemizedFees.map((fee, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{fee.name}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '900' }}>₦{fee.amount?.toLocaleString()}</span>
                  </div>
                ))}
                {itemizedFees.length === 0 && (
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontStyle: 'italic' }}>No active layout rules configured for this term session.</p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontWeight: '900' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Cumulative Total Bill</span>
                  <span style={{ color: '#a855f7' }}>₦{totalBill.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 🧾 MOUNTED ADMINISTRATIVE ADJUSTMENTS ACTION BOX CONTROLS */}
      <AdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        student={selectedStudentForAdjustment}
        onAdjustmentApplied={triggerMasterDataRefresh}
      />

    </div>
  );
};

export default PaymentsDesk;