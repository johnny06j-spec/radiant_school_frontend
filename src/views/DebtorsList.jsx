// src/views/DebtorsList.jsx
import React, { useState, useEffect } from "react";
import { useFinanceAdmin } from "../hooks/useFinanceAdmin";
import { Search, Download, RotateCcw } from "lucide-react";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

const DebtorsList = () => {
  const { isLoading, debtors, summaryMetrics, fetchDebtorsList, fetchSummaryMetrics, downloadDebtorsPdf } = useFinanceAdmin();
  const [classFilter, setClassFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  
  // Academic Session and Term context management state parameters
  const [sessionFilter, setSessionFilter] = useState("2026/2027");
  const [termFilter, setTermFilter] = useState("First Term");
  
  // Pagination State Configuration Matrix
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sync with available hook fetch methods on component mount & filter updates
  useEffect(() => {
    const filters = {
      session: sessionFilter,
      term: termFilter,
      ...(classFilter !== "All" && { assignedClass: classFilter })
    };
    
    fetchDebtorsList(filters);
    fetchSummaryMetrics(filters); // Keep matching stats cards synchronized
    setCurrentPage(1); // Reset page balance on filter structural shifts
  }, [classFilter, sessionFilter, termFilter, fetchDebtorsList, fetchSummaryMetrics]);

  const styles = {
    container: { padding: "1rem 0", backgroundColor: "var(--bg-main)", color: "var(--text-primary)", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" },
    actionButtons: { display: "flex", gap: "0.75rem" },
    metricsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" },
    metricCard: { background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-subtle)" },
    filterBar: { display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center", flexWrap: "wrap" },
    input: { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "0.65rem 1rem", borderRadius: "6px", fontSize: "13px", outline: "none" },
    btnPrimary: { background: "var(--accent-primary)", border: "none", color: "#ffffff", padding: "0.65rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" },
    btnReset: { background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-muted)", padding: "0.65rem 1rem", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" },
    tableCard: { background: "var(--bg-surface)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "1.5rem", boxShadow: "var(--shadow-subtle)", overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" },
    th: { background: "var(--bg-main)", padding: "1rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)", fontWeight: "700", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" },
    td: { padding: "1rem", borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)" },
    paginationRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", flexWrap: "wrap", gap: "1rem" },
    pageBtn: { background: "var(--bg-surface)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "0.4rem 0.75rem", borderRadius: "4px", margin: "0 0.2rem", cursor: "pointer", fontSize: "12px" },
    activePageBtn: { background: "var(--accent-primary)", border: "1px solid var(--accent-primary)", color: "#ffffff", padding: "0.4rem 0.75rem", borderRadius: "4px", margin: "0 0.2rem", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }
  };

  const classes = ["All", "KG 1", "KG 2", "KG 3", "JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"];
  const sessions = ["2025/2026", "2026/2027", "2027/2028", "2028/2029"];
  const terms = ["First Term", "Second Term", "Third Term"];

  const handleResetControls = () => {
    setSearchTerm("");
    setClassFilter("All");
    setSessionFilter("2026/2027");
    setTermFilter("First Term");
    setCurrentPage(1);
  };

  // Filter local search items by name matching or admission strings safely
  const filteredDebtors = (debtors || []).filter(d => 
    (d.studentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.admissionNo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Math Slices
  const totalResults = filteredDebtors.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDebtors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;

  const handleDownloadPDF = async () => {
    if (!sessionFilter || sessionFilter === "All" || sessionFilter === "") {
      alert("Please select a specific Academic Session before executing PDF assembly.");
      return;
    }

    if (!termFilter || termFilter === "All" || termFilter === "") {
      alert("Please select a specific Academic Term before executing PDF assembly.");
      return;
    }

    if (filteredDebtors.length === 0) {
      alert(`No debtor records found for ${sessionFilter} - ${termFilter} (${classFilter === "All" ? "All Classes" : classFilter}). PDF generation canceled.`);
      return;
    }

    try {
      setIsExporting(true);
      
      const data = await downloadDebtorsPdf({ session: sessionFilter, term: termFilter, assignedClass: classFilter });
      if (!data || !data.success || !data.reportData || data.reportData.length === 0) {
        alert("Failed to gather printable structural matrix parameters or no records matched filters on the database.");
        return;
      }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      // Document Brand Header
      doc.setFillColor(30, 41, 59); 
      doc.rect(0, 0, 210, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("RADIANT SCHOOLS ACADEMIC LEDGER", 14, 18);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Financial Session Arrears Overview: ${data.academicSession || sessionFilter} | ${data.academicTerm || termFilter}`, 14, 26);
      doc.text(`Compiled Date Matrix Statement: ${data.generatedAtDate || new Date().toLocaleDateString()}`, 14, 32);

      let currentYPosition = 50;

      data.reportData.forEach((stream) => {
        if (classFilter !== "All" && stream.className !== classFilter) {
          return;
        }

        if (currentYPosition > 250) {
          doc.addPage();
          currentYPosition = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(51, 65, 85);
        doc.text(`Class Group: ${stream.className}`, 14, currentYPosition);
        currentYPosition += 4;

        const tableRows = stream.students.map((student, idx) => [
          idx + 1,
          student.studentName,
          student.admissionNo,
          `N ${student.previousOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          `N ${student.currentOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          `N ${student.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
          startY: currentYPosition,
          head: [["S/N", "Student Name", "Admission No", "Previous Balance", "Current Term Fee", "Total Arrears"]],
          body: tableRows,
          theme: "striped",
          headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: "bold" },
          styles: { fontSize: 9, cellPadding: 3 },
          foot: [[
            "", "Subtotals Summary", "", 
            `N ${stream.subtotalPrevious.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
            `N ${stream.subtotalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
            `N ${stream.subtotalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          ]],
          footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" }
        });

        currentYPosition = doc.lastAutoTable.finalY + 12;
      });

      if (currentYPosition > 230) {
        doc.addPage();
        currentYPosition = 20;
      }

      doc.setFillColor(15, 23, 42); 
      doc.rect(14, currentYPosition, 182, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("TOTAL OUTSTANDING HISTORICAL BALANCES:", 20, currentYPosition + 10);
      doc.text(`N ${data.grandTotals.grandTotalPrevious.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 140, currentYPosition + 10);

      doc.text("TOTAL CURRENT TERM UNPAID RECEIVABLES:", 20, currentYPosition + 17);
      doc.text(`N ${data.grandTotals.grandTotalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 140, currentYPosition + 17);

      doc.save(`Radiant_Debtors_Summary_Report_${sessionFilter.replace('/', '_')}.pdf`);
    } catch (pdfGenerationError) {
      console.error("💥 Local PDF rendering engine context failure:", pdfGenerationError);
      alert("Failed to generate PDF document layout parameters.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>Debtors List</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>This list shows all students who have outstanding fees. Download the PDF to get a complete compilation.</p>
        </div>
        <div style={styles.actionButtons}>
          <button 
            onClick={handleDownloadPDF} 
            disabled={isExporting || !debtors || debtors.length === 0} 
            style={{ ...styles.btnPrimary, opacity: (isExporting || !debtors || debtors.length === 0) ? 0.6 : 1 }}
          >
            <Download size={14} /> {isExporting ? "Compiling PDF..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Synchronized Metrics Aggregator Cards */}
      <div style={styles.metricsRow}>
        <div style={styles.metricCard}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Debtors</span>
          <h2 style={{ color: "var(--text-primary)", margin: "0.5rem 0 0 0", fontSize: "22px", fontWeight: "800" }}>{(summaryMetrics?.totalDebtorsCount || debtors?.length || 0)} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Students</span></h2>
        </div>
        <div style={styles.metricCard}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Previous Outstanding</span>
          <h2 style={{ color: "#d97706", margin: "0.5rem 0 0 0", fontSize: "22px", fontWeight: "800" }}>₦{(summaryMetrics?.totalPreviousOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        </div>
        <div style={styles.metricCard}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Current Outstanding</span>
          <h2 style={{ color: "var(--accent-danger)", margin: "0.5rem 0 0 0", fontSize: "22px", fontWeight: "800" }}>₦{(summaryMetrics?.totalCurrentOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        </div>
        <div style={styles.metricCard}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Outstanding (All)</span>
          <h2 style={{ color: "#a855f7", margin: "0.5rem 0 0 0", fontSize: "22px", fontWeight: "800" }}>₦{(summaryMetrics?.totalOutstandingAll || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        </div>
        <div style={styles.metricCard}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Classes</span>
          <h2 style={{ color: "var(--accent-primary)", margin: "0.5rem 0 0 0", fontSize: "22px", fontWeight: "800" }}>{(summaryMetrics?.classesWithDebtorsCount || 0)} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>With Debtors</span></h2>
        </div>
      </div>

      {/* Filtering Control Row Component */}
      <div style={styles.filterBar}>
        <div style={{ position: "relative", flex: 2, minWidth: "240px" }}>
          <input 
            type="text" 
            placeholder="Search by name or admission no..." 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            style={{ ...styles.input, width: "100%", paddingLeft: "2.5rem", boxSizing: "border-box" }}
          />
          <Search size={14} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        </div>

        {/* Academic Session filter drop menu */}
        <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} style={styles.input}>
          {sessions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Academic Term filter drop menu */}
        <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} style={styles.input}>
          {terms.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={styles.input}>
          {classes.map(cls => <option key={cls} value={cls}>{cls === "All" ? "All Classes" : cls}</option>)}
        </select>

        <button onClick={handleResetControls} style={styles.btnReset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Main Table Content View */}
      <div style={styles.tableCard}>
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Syncing global financial datasets...</div>
        ) : (
          <>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>S/N</th>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Admission No.</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Previous Outstanding (₦)</th>
                  <th style={styles.th}>Current Outstanding (₦)</th>
                  <th style={styles.th}>Total Outstanding (₦)</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ ...styles.td, textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>
                      🎉 No matching records contain outstanding fee debt rows for the chosen filters.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((debtor, index) => (
                    <tr key={debtor._id || index}>
                      <td style={styles.td}>{indexOfFirstItem + index + 1}</td>
                      <td style={{ ...styles.td, fontWeight: "600" }}>{debtor.studentName}</td>
                      <td style={{ ...styles.td, color: "var(--accent-primary)", fontWeight: "600" }}>{debtor.admissionNo}</td>
                      <td style={styles.td}>{debtor.class || debtor.currentClass}</td>
                      <td style={styles.td}>{(debtor.previousOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={styles.td}>{(debtor.currentOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ ...styles.td, color: "var(--accent-danger)", fontWeight: "700" }}>{(debtor.totalOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={styles.paginationRow}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Showing {totalResults === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalResults)} of {totalResults} results
              </span>
              <div style={{ display: "flex", alignItems: "center" }}>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                  style={{ ...styles.input, padding: "0.25rem 0.5rem", marginRight: "1rem", fontSize: "12px" }}
                >
                  {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size} per page</option>)}
                </select>
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)} 
                  style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.4 : 1 }}
                >
                  &lt;
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentPage(idx + 1)} 
                    style={currentPage === idx + 1 ? styles.activePageBtn : styles.pageBtn}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => prev + 1)} 
                  style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.4 : 1 }}
                >
                  &gt;
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DebtorsList;