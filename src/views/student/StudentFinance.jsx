// src/views/student/StudentFinance.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Calendar, Info, ChevronDown, ChevronUp, Lock, CheckCircle2, Download } from 'lucide-react';

const StudentFinance = ({ studentId }) => {
  const [profile, setProfile] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [customPayAmount, setCustomPayAmount] = useState("");
  const [downloadingRef, setDownloadingRef] = useState(null);
  
  // Verification states
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifiedPaidAmount, setVerifiedPaidAmount] = useState(0);

  // Accordions are open by default
  const [openAccordions, setOpenAccordions] = useState({
    "First Term": true,
    "Second Term": true,
    "Third Term": true
  });

  const token = localStorage.getItem('token');

  // 🟢 FETCH PROFILE & LEDGER FOR THE ACTIVE STUDENT ID
  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Targeted Student Profile (or fallback to /me)
      const profileEndpoint = studentId 
        ? `http://localhost:5000/api/students/profile/me?studentId=${studentId}`
        : 'http://localhost:5000/api/students/profile/me';

      const profRes = await fetch(profileEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const profData = await profRes.json();
      
      if (profData?.success && profData?.student) {
        const studentObj = profData.student;
        setProfile(studentObj);

        const activeStudentId = studentObj._id;
        const currentSession = studentObj.academicSession || "2026/2027";
        const currentTerm = studentObj.academicTerm || "First Term";

        // 2. Fetch Targeted Student Ledger Statement
        const ledgerRes = await fetch(
          `http://localhost:5000/api/finance/student-ledger/${activeStudentId}?term=${encodeURIComponent(currentTerm)}&session=${encodeURIComponent(currentSession)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        const ledgerJson = await ledgerRes.json();
        
        if (ledgerJson?.success && ledgerJson?.data) {
          setLedgerData(ledgerJson.data);

          // Auto-fill checkout input field with active total outstanding debt
          const totalDebt = ledgerJson.data.totalOutstanding || 0;
          setCustomPayAmount(totalDebt > 0 ? totalDebt.toString() : "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch student profile or ledger statement:", error);
    } finally {
      setLoading(false);
    }
  }, [studentId, token]);

  // 🟢 RE-RUN WHEN STUDENT ID OR PAYMENT VERIFICATION CHANGES
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const reference = queryParams.get('reference') || queryParams.get('trxref');

    if (reference) {
      const runPaymentVerification = async () => {
        setVerifying(true);
        try {
          const response = await fetch(`http://localhost:5000/api/finance/paystack/verify/${reference}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (data?.success) {
            setVerifiedPaidAmount(data.verifiedAmount || 0);
            setVerificationSuccess(true);
            
            setTimeout(() => {
              setVerificationSuccess(false);
              // Clean query parameters while maintaining studentId context
              const currentPath = window.location.pathname;
              const activeId = studentId || profile?._id;
              const cleanUrl = activeId ? `${currentPath}?studentId=${activeId}` : currentPath;
              
              window.history.replaceState({}, document.title, cleanUrl);
              fetchProfileData();
            }, 3500);
          } else {
            alert(data.message || "Payment verification failed.");
          }
        } catch (error) {
          console.error("Error verifying payment reference:", error);
          alert("Failed to confirm your payment with our servers.");
        } finally {
          setVerifying(false);
        }
      };

      runPaymentVerification();
    } else {
      fetchProfileData();
    }
  }, [fetchProfileData, token, studentId]);

  // DYNAMICALLY RENDER ALL UNPAID TERMS WITH CLEAN CONSOLIDATED ITEMS
  const outstandingGroups = useMemo(() => {
    if (!profile || !ledgerData) return [];

    const groupsMap = {};
    const academicSession = profile.academicSession || "2026/2027";
    const currentTermTitle = profile.academicTerm || "First Term";

    // 1. Map Historical / Previous Outstanding Debt (if applicable)
    if (ledgerData.previousOutstanding > 0) {
      const prevKey = "Previous Outstanding Debt";
      groupsMap[prevKey] = {
        id: prevKey,
        session: `${academicSession} Prior Balances`,
        term: prevKey,
        termColor: 'var(--accent-warning)',
        items: [{
          description: "Arrears / Uncleared Previous Terms Debt",
          type: "Arrears",
          amount: ledgerData.previousOutstanding
        }],
        groupTotal: ledgerData.previousOutstanding
      };
    }

    // 2. Map Active Target Term Clean Consolidated Fee Items
    if (ledgerData.items && ledgerData.items.length > 0) {
      groupsMap[currentTermTitle] = {
        id: currentTermTitle,
        session: `${academicSession} Academic Session`,
        term: currentTermTitle,
        termColor: 'var(--accent-success)',
        items: ledgerData.items.map(item => ({
          description: item.name,
          type: item.appliesTo === "All Students" ? "Structural" : "Other",
          amount: item.amount
        })),
        groupTotal: ledgerData.currentTermFee
      };
    }

    return Object.values(groupsMap);
  }, [profile, ledgerData]);

  // DYNAMIC PAYMENTS HISTORY LEDGER
  const pastPaymentsHistoryList = useMemo(() => {
    if (!ledgerData || !ledgerData.paymentHistory) return [];
    return ledgerData.paymentHistory;
  }, [ledgerData]);

  const toggleAccordion = (id) => {
    setOpenAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalOutstandingBalance = ledgerData?.totalOutstanding ?? profile?.financialSummary?.totalOutstanding ?? 0;

  const remainingBalanceAfterPayment = useMemo(() => {
    const entered = parseFloat(customPayAmount) || 0;
    return Math.max(0, totalOutstandingBalance - entered);
  }, [customPayAmount, totalOutstandingBalance]);

  const handleGatewayCheckout = async () => {
    const amountToPay = Number(customPayAmount || 0);

    if (amountToPay < 100) {
      alert("Minimum payment amount is ₦100.00.");
      return;
    }

    setPaying(true);
    try {
      const activeId = profile?._id || studentId;
      const callbackUrl = `${window.location.origin}${window.location.pathname}?studentId=${activeId}`;

      const response = await fetch('http://localhost:5000/api/finance/paystack/initialize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: activeId, // 🟢 Always sends active profile ID
          amount: amountToPay, 
          term: profile?.academicTerm || "First Term",
          session: profile?.academicSession || "2026/2027",
          paymentType: 'term_fees',
          callbackUrl // 🟢 Returns parent directly to this active student profile
        })
      });

      const data = await response.json();
      
      if (data?.success && data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert(data.message || "Failed to contact Paystack checkout gateway.");
      }
    } catch (error) {
      console.error("Payment submission failure:", error);
      alert("Failed to process checkout transaction.");
    } finally {
      setPaying(false);
    }
  };

  // 📥 RECEIPT DOWNLOAD INTERCEPTOR
  const handleDownloadReceipt = async (reference) => {
    setDownloadingRef(reference);
    try {
      const response = await fetch(`http://localhost:5000/api/finance/receipt/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Could not extract dynamic invoice PDF metadata.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${reference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("💥 Receipt engine processing failure:", error);
      alert("Failed to compile dynamic school document summary.");
    } finally {
      setDownloadingRef(null);
    }
  };

  if (verifying) {
    return (
      <div style={styles.loadingWrapper}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--accent-primary)' }} /> 
        <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>Securing payment validation receipt from Paystack...</span>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Please do not close this window or hit refresh.</p>
      </div>
    );
  }

  if (verificationSuccess) {
    return (
      <div style={styles.loadingWrapper}>
        <CheckCircle2 size={48} style={{ color: 'var(--accent-success)', marginBottom: '8px' }} />
        <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-primary)' }}>Payment Successful!</span>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0', textAlign: 'center' }}>
          ₦{verifiedPaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} has been securely reconciled.<br />
          Your updated balance sheet is loading now...
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <RefreshCw className="animate-spin" size={20} style={{ color: 'var(--accent-primary)' }} /> 
        <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>Syncing student real-time statement balances...</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      
      <header style={styles.headerRow}>
        <div>
          <span style={styles.breadcrumb}>FINANCE / PAYMENT</span>
          <h1 style={styles.pageTitle}>Make a Payment</h1>
          <p style={styles.pageSubtitle}>
            Reviewing outstanding fees for <strong style={{ color: 'var(--accent-primary)' }}>{profile?.firstName} {profile?.lastName}</strong> ({profile?.currentClass}).
          </p>
        </div>
        <div style={styles.activeSessionBadge}>
          <div style={styles.pulseDot} />
          <span>ACTIVE SESSION</span>
        </div>
      </header>

      {/* SECTION 1: OUTSTANDING FEES BREAKDOWN */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>OUTSTANDING FEES BREAKDOWN</h2>
        <p style={styles.cardSubtitle}>
          Below is the list of all outstanding fees for {profile?.firstName}. You are required to clear all debts.
        </p>

        <div style={styles.accordionContainer}>
          {outstandingGroups.length > 0 ? (
            outstandingGroups.map((group) => {
              const isOpen = openAccordions[group.id] !== false;
              return (
                <div key={group.id} style={styles.accordionBox}>
                  <button onClick={() => toggleAccordion(group.id)} style={styles.accordionHeader}>
                    <div style={styles.accordionHeaderLeft}>
                      <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{group.session}</span>
                    </div>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isOpen && (
                    <div style={styles.accordionContent}>
                      <span style={{ ...styles.termHeader, color: group.termColor }}>{group.term}</span>
                      <table style={styles.table}>
                        <thead>
                          <tr style={styles.tableHeaderRow}>
                            <th style={styles.th}>FEE DESCRIPTION</th>
                            <th style={styles.th}>FEE TYPE</th>
                            <th style={{ ...styles.th, textAlign: 'right' }}>AMOUNT (₦)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item, index) => (
                            <tr key={index} style={styles.tableBodyRow}>
                              <td style={styles.tdPrimary}>{item.description}</td>
                              <td style={{ ...styles.td, color: 'var(--text-muted)' }}>{item.type}</td>
                              <td style={{ ...styles.td, textAlign: 'right', color: 'var(--text-primary)', fontWeight: '700' }}>
                                ₦{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={styles.subtotalRow}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: group.termColor }}>
                          Outstanding Total ({group.term})
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: group.termColor }}>
                          ₦{group.groupTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700' }}>
              🎉 Zero outstanding dues for {profile?.firstName}. Accounts are completely clean!
            </div>
          )}
        </div>

        <div style={styles.highlightedTotalCard}>
          <span style={styles.totalLabel}>TOTAL OUTSTANDING BALANCE</span>
          <span style={styles.totalValue}>₦{totalOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </section>

      {/* SECTION 2: VERIFIED PAYMENT RECEIPT HISTORY LEDGER */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>VERIFIED SYSTEM RECEIPT LEDGER</h2>
        <p style={styles.cardSubtitle}>
          View chronological historical payment transactions and download custom school-branded receipts.
        </p>
        
        <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
          {pastPaymentsHistoryList.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>REFERENCE</th>
                  <th style={styles.th}>TERM CONTEXT</th>
                  <th style={styles.th}>AMOUNT PAID</th>
                  <th style={styles.th}>DATE CLEARANCE</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>DOCUMENT ACTION</th>
                </tr>
              </thead>
              <tbody>
                {pastPaymentsHistoryList.map((payment, index) => (
                  <tr key={index} style={styles.tableBodyRow}>
                    <td style={{ ...styles.td, color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>{payment.reference}</td>
                    <td style={styles.tdPrimary}>{payment.session} - {payment.term}</td>
                    <td style={{ ...styles.td, color: 'var(--accent-success)', fontWeight: '700' }}>
                      ₦{Number(payment.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.td, color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDownloadReceipt(payment.reference)}
                        disabled={downloadingRef === payment.reference}
                        style={{
                          ...styles.receiptActionBtn,
                          opacity: downloadingRef === payment.reference ? 0.5 : 1
                        }}
                      >
                        {downloadingRef === payment.reference ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <>
                            <Download size={12} />
                            <span>Download Receipt</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>
              No transactional history found in {profile?.firstName}'s ledger data maps.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: PAYMENT SUMMARY */}
      <section style={styles.card}>
        <h2 style={styles.cardTitle}>PAYMENT SUMMARY</h2>
        <p style={styles.cardSubtitle}>
          Enter the amount you want to pay now for {profile?.firstName}. Any payment will be applied to the oldest debt first.
        </p>

        <div style={styles.summaryContainer}>
          <div style={styles.summaryLine}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Outstanding Balance</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-danger)' }}>
              ₦{totalOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div style={styles.inputStack}>
            <label style={styles.inputLabel}>Amount Paying Today</label>
            <div style={styles.inputWrapper}>
              <span style={styles.currencySymbol}>₦</span>
              <input 
                type="number"
                value={customPayAmount}
                onChange={(e) => setCustomPayAmount(e.target.value)}
                placeholder="Enter amount"
                style={styles.amountInput}
              />
            </div>
            <span style={styles.inputHelperText}>Minimum amount: ₦100.00</span>
          </div>

          <div style={styles.remainingBalanceRow}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Remaining Balance After Payment</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-success)' }}>
              ₦{remainingBalanceAfterPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div style={styles.noteBox}>
          <Info size={16} style={styles.noteIcon} />
          <div style={styles.noteTextContainer}>
            <p style={styles.noteTitle}>
              Note: <span style={styles.noteBody}>Payments are automatically applied to clear the oldest outstanding fees first.</span>
            </p>
            <p style={styles.noteBodySub}>You cannot choose which fees to pay.</p>
          </div>
        </div>
      </section>

      {/* SUBMIT ACTIONS */}
      <div style={styles.buttonStack}>
        <button 
          onClick={handleGatewayCheckout} 
          disabled={paying || totalOutstandingBalance <= 0}
          style={{ 
            ...styles.paystackBtn, 
            opacity: (paying || totalOutstandingBalance <= 0) ? 0.6 : 1,
            cursor: (paying || totalOutstandingBalance <= 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {paying ? (
            <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              <Lock size={15} />
              <span>Proceed to Paystack for {profile?.firstName}</span>
            </>
          )}
        </button>
        <p style={styles.buttonHelperText}>
          <Lock size={12} style={{ color: 'var(--text-muted)' }} />
          <span>You will be redirected to Paystack to complete your payment securely.</span>
        </p>
      </div>

    </div>
  );
};

const styles = {
  container: { flex: 1, color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'system-ui, -apple-system, sans-serif', background: 'var(--bg-main)', minHeight: '100vh', padding: '1rem 0' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  breadcrumb: { fontSize: '11px', fontWeight: '800', tracking: '0.15em', color: 'var(--accent-primary)', textTransform: 'uppercase' },
  pageTitle: { margin: '4px 0 0 0', fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' },
  pageSubtitle: { margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' },
  activeSessionBadge: { display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 14px', borderRadius: '20px', color: 'var(--accent-success)', fontSize: '11px', fontWeight: '700' },
  pulseDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-success)' },
  card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', marginBottom: '1.5rem', boxShadow: 'var(--shadow-subtle)' },
  cardTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.5px' },
  cardSubtitle: { margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' },
  accordionContainer: { marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  accordionBox: { border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-main)' },
  accordionHeader: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-surface)', border: 'none', color: 'var(--accent-primary)', fontWeight: '700', fontSize: '13px', textAlign: 'left', cursor: 'pointer', outline: 'none' },
  accordionHeaderLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  accordionContent: { padding: '1.25rem', borderTop: '1px solid var(--border-color)' },
  termHeader: { fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeaderRow: { borderBottom: '1px solid var(--border-color)' },
  th: { paddingBottom: '0.5rem', fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', tracking: '0.5px' },
  tableBodyRow: { borderBottom: '1px solid var(--border-color)' },
  td: { padding: '0.85rem 0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', verticalAlign: 'middle' },
  tdPrimary: { padding: '0.85rem 0', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600', verticalAlign: 'middle' },
  subtotalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)' },
  highlightedTotalCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1.25rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' },
  totalLabel: { fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.1em' },
  totalValue: { fontSize: '22px', fontWeight: '900', color: 'var(--accent-danger)', letterSpacing: '-0.3px' },
  summaryContainer: { marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  summaryLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  inputStack: { display: 'flex', flexDirection: 'column', gap: '8px' },
  inputLabel: { fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  currencySymbol: { position: 'absolute', left: '1rem', fontSize: '15px', fontWeight: '700', color: 'var(--text-muted)' },
  amountInput: { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem 1rem 0.85rem 2.2rem', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' },
  inputHelperText: { fontSize: '11px', color: 'var(--text-muted)' },
  remainingBalanceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' },
  noteBox: { marginTop: '1.5rem', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.15)', borderRadius: '8px', padding: '1rem', display: 'flex', gap: '12px', alignItems: 'flex-start' },
  noteIcon: { color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' },
  noteTextContainer: { fontSize: '12px', lineHeight: '1.5' },
  noteTitle: { margin: 0, fontWeight: '700', color: 'var(--accent-primary)' },
  noteBody: { fontWeight: '500', color: 'var(--text-muted)' },
  noteBodySub: { margin: '2px 0 0 0', fontWeight: '500', color: 'var(--text-muted)' },
  buttonStack: { display: 'flex', flexDirection: 'column', gap: '10px' },
  paystackBtn: { width: '100%', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', padding: '1rem', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s ease', outline: 'none', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1)' },
  buttonHelperText: { margin: 0, textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  loadingWrapper: { minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-secondary)', fontFamily: 'sans-serif' },
  receiptActionBtn: { background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)', color: 'var(--accent-primary)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', outline: 'none', transition: 'all 0.15s ease' }
};

export default StudentFinance;