// src/views/StudentDirectory.jsx
import React, { useEffect, useState, useCallback } from "react";
import { ChevronLeft } from "lucide-react";
import API from "../api/axiosInstance";
import html2pdf from "html2pdf.js";

// Import Refactored Sub-Components
import StudentSearchFilter from "../components/StudentSearchFilter";
import StudentTable from "../components/StudentTable";
import StudentPagination from "../components/StudentPagination";
import StudentProfilePanel from "../components/StudentProfilePanel";

const StudentDirectory = ({ setActiveTab, onEditStudent }) => {
  // --- Core State Management ---
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- Search & Server-Side Filtration States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [sessionFilter, setSessionFilter] = useState("All Sessions");

  // --- Server Pagination Metadata ---
  const [currentPage, setCurrentPage] = useState(1);
  const RECORDS_PER_PAGE = 20; 
  const [paginationMeta, setPaginationMeta] = useState({
    totalRecords: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false
  });

  const [availableClasses, setAvailableClasses] = useState(["All Classes"]);
  const [availableSessions, setAvailableSessions] = useState(["All Sessions"]);

  // --- Fetch Pipeline ---
  const fetchDirectory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: RECORDS_PER_PAGE,
        ...(searchTerm && { search: searchTerm }),
        ...(classFilter !== "All Classes" && { assignedClass: classFilter }),
        ...(sessionFilter !== "All Sessions" && { intakeSession: sessionFilter })
      });

      const response = await API.get(`/students?${params.toString()}`);
      
      if (response.data?.success) {
        const studentData = response.data.students || [];
        setStudents(studentData);
        
        const serverPagination = response.data.pagination;
        
        // 1. Dynamic Active Roster Profiles Count
        const totalRecords = serverPagination?.totalRecords 
          || response.data.totalRecords 
          || response.data.total 
          || response.data.count 
          || studentData.length 
          || 0;
        
        // 2. Standardized Pagination (Maximum 20 records per page)
        const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE) || 1;

        setPaginationMeta({
          totalRecords: totalRecords,
          totalPages: totalPages,
          hasPrevPage: currentPage > 1,
          hasNextPage: currentPage < totalPages
        });

        // Set up the preview panel defaults smoothly
        if (studentData.length > 0) {
          setSelectedStudent(prev => {
            const stillExists = studentData.find(s => s._id === prev?._id);
            return stillExists || studentData[0];
          });
        } else {
          setSelectedStudent(null);
        }
      }
    } catch (err) {
      console.error("Directory fetch error:", err);
      setError("Failed to stream student records from the database matrix.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, classFilter, sessionFilter]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  useEffect(() => {
    const fetchDropdownAggregates = async () => {
      try {
        const response = await API.get("/students?page=1&limit=1000");
        if (response.data?.success && response.data.students) {
          const allRecords = response.data.students;
          const classes = ["All Classes", ...new Set(allRecords.map(s => s.assignedClass || s.currentClass).filter(Boolean))];
          const sessions = ["All Sessions", ...new Set(allRecords.map(s => s.intakeSession || s.admittedSession || s.admissionSession).filter(Boolean))];
          setAvailableClasses(classes);
          setAvailableSessions(sessions);
        }
      } catch (err) {
        console.error("Dropdown aggregate failure:", err);
      }
    };
    fetchDropdownAggregates();
  }, []);

  const handleFilterSelection = (type, value) => {
    setCurrentPage(1);
    if (type === "class") setClassFilter(value);
    if (type === "session") setSessionFilter(value);
    if (type === "search") setSearchTerm(value);
  };

  // --- PDF & Print Shared Configurations ---
  const getPdfOptions = (fileNameString) => ({
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: fileNameString,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
  });

  const downloadBiodataPDF = () => {
    const element = document.getElementById("biodata-sheet");
    if (!element || !selectedStudent) return;
    const nameString = (selectedStudent.name || `${selectedStudent.firstName || ""} ${selectedStudent.surname || ""}`).trim();
    const fileNameString = `${nameString.replace(/\s+/g, "_")}_Biodata.pdf`;
    html2pdf().set(getPdfOptions(fileNameString)).from(element).save();
  }; 

  const printBiodataSheet = () => {
    const element = document.getElementById("biodata-sheet");
    if (!element || !selectedStudent) return;
    const nameString = (selectedStudent.name || `${selectedStudent.firstName || ""} ${selectedStudent.surname || ""}`).trim();
    const fileNameString = `${nameString.replace(/\s+/g, "_")}_Biodata.pdf`;
    
    html2pdf()
      .set(getPdfOptions(fileNameString))
      .from(element)
      .toPdf()
      .output('bloburl')
      .then((blobUrl) => {
        const printWindow = window.open(blobUrl, '_blank');
        if (printWindow) {
          printWindow.addEventListener('load', () => { printWindow.print(); });
        }
      })
      .catch((err) => console.error("Print generation error:", err));
  };

  const handleEditRedirect = (student) => {
    if (typeof onEditStudent === 'function') {
      onEditStudent(student._id);
    }
  };

  const handleDeleteClick = async (studentId, studentName) => {
    const confirmation = window.confirm(`Are you sure you want to delete records for ${studentName}?`);
    if (!confirmation) return;
    try {
      setLoading(true);
      const response = await API.delete(`/students/${studentId}`);
      if (response.data?.success) {
        alert("Student entry cleanly purged.");
        fetchDirectory(); 
      }
    } catch (err) {
      alert("Failed to remove entry target.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div 
        onClick={() => setActiveTab && setActiveTab('overview')} 
        style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-primary)", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginBottom: "0.5rem", width: "max-content" }}
      >
        <ChevronLeft size={16} /> <span>Back to Overview</span>
      </div>

      <div style={styles.topBar}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Student Registration Directory</h2>
          <p style={{ margin: "2px 0 0 0", color: "var(--text-muted)", fontSize: "13px", fontWeight: "500" }}>Live database lookup with active server pagination scales.</p>
        </div>
      </div>

      <StudentSearchFilter
        classFilter={classFilter}
        sessionFilter={sessionFilter}
        searchTerm={searchTerm}
        availableClasses={availableClasses}
        availableSessions={availableSessions}
        onFilterChange={handleFilterSelection}
        styles={styles}
      />

      {loading && students.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)", fontSize: "14px" }}>Loading operational record fields...</div>
      ) : error ? (
        <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "var(--accent-danger)", borderRadius: "6px", fontSize: "13px" }}>{error}</div>
      ) : (
        <div style={styles.workspaceGrid}>
          <div style={styles.leftPanel}>
            <div style={styles.panelHeader}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Roster Profiles</h4>
              <span style={{ background: "rgba(147, 51, 234, 0.12)", color: "#a855f7", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "20px", border: "1px solid rgba(147, 51, 234, 0.25)" }}>
                {paginationMeta.totalRecords} Records
              </span>
            </div>

            <StudentTable
              students={
                students.length > RECORDS_PER_PAGE
                  ? students.slice((currentPage - 1) * RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE)
                  : students
              }
              selectedStudent={selectedStudent}
              onSelectStudent={setSelectedStudent}
              onEditRedirect={handleEditRedirect}
              onDeleteClick={handleDeleteClick}
              styles={styles}
            />

            <StudentPagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              paginationMeta={paginationMeta}
              RECORDS_PER_PAGE={RECORDS_PER_PAGE}
              styles={styles}
            />
          </div>

          <div style={{ width: "100%" }}>
            <StudentProfilePanel
              selectedStudent={selectedStudent}
              downloadBiodataPDF={downloadBiodataPDF}
              printBiodataSheet={printBiodataSheet}
              styles={styles}
            />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .desktop-pages-array { display: none !important; }
          .mobile-page-indicator { display: inline !important; }
          .text-label-hide { display: none !important; }
        }
      `}</style>
    </div>
  );
};

// --- Dynamic Theme Styles Matrix ---
const styles = {
  container: { background: "var(--bg-main)", minHeight: "100vh", color: "var(--text-primary)", fontFamily: "system-ui, -apple-system, sans-serif", padding: "1rem 0" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  filterBar: { display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" },
  selectDropdown: { background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "6px", padding: "0.6rem 1rem", fontSize: "13px", outline: "none", cursor: "pointer", width: "180px" },
  searchWrapper: { position: "relative", display: "flex", alignItems: "center", flex: 1, minWidth: "250px" },
  searchInput: { width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "0.6rem 1rem 0.6rem 2.5rem", color: "var(--text-primary)", fontSize: "13px", outline: "none" },
  searchIcon: { position: "absolute", left: "12px", color: "var(--text-muted)" },
  workspaceGrid: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem", alignItems: "start" },
  leftPanel: { background: "var(--bg-surface)", borderRadius: "8px", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow-subtle)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-color)" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" },
  th: { background: "var(--bg-main)", color: "var(--text-muted)", padding: "0.85rem 1rem", fontWeight: "700", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)" },
  td: { padding: "0.85rem 1rem", borderBottom: "1px solid var(--border-color)", verticalAlign: "middle", color: "var(--text-primary)" },
  actionBtn: { background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", transition: "color 0.2s" },
  paginationRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", background: "var(--bg-main)", borderTop: "1px solid var(--border-color)", flexWrap: "wrap", gap: "1rem" },
  metaControlBlock: { display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" },
  rangeIndicator: { fontSize: "13px", color: "var(--text-muted)", fontWeight: "500" },
  navigationControls: { display: "flex", alignItems: "center", gap: "0.35rem" },
  navBtn: { background: "var(--bg-surface)", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "6px", padding: "0.45rem 0.65rem", fontSize: "13px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer", transition: "all 0.2s ease" },
  disabledNavBtn: { opacity: 0.35, cursor: "not-allowed" },
  pageBtn: { background: "transparent", border: "1px solid transparent", color: "var(--text-muted)", borderRadius: "6px", minWidth: "32px", height: "32px", fontSize: "13px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s ease" },
  activePageBtn: { background: "var(--accent-primary)", borderColor: "var(--accent-primary)", color: "#ffffff" },
  ellipsis: { color: "var(--text-muted)", padding: "0 0.25rem", fontSize: "13px" },
  desktopNumbersWrapper: { display: "flex", alignItems: "center", gap: "0.25rem" },
  mobileTrackerLabel: { display: "none", fontSize: "13px", color: "var(--text-muted)", padding: "0 0.5rem", fontWeight: "600" },
  rightWrapperCard: { background: "#ffffff", borderRadius: "8px", color: "#000000", padding: "1.5rem", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" },
  docHeaderButtons: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem", marginBottom: "1rem" },
  docTargetContainer: { background: "#ffffff", padding: "0.25rem" },
  docTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  logoBox: { width: "60px", height: "60px", display: "flex", alignItems: "center", justifyContent: "center" },
  photoBox: { width: "90px", height: "100px", border: "1px solid #cbd5e1", borderRadius: "4px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", color: "#94a3b8", overflow: "hidden", background: "#f8fafc" },
  sectionHeader: { background: "#0f172a", color: "#ffffff", padding: "4px 8px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", margin: "1.25rem 0 0.5rem 0" },
  dataGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: "6px", columnGap: "1.5rem", fontSize: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" },
  dataLabel: { color: "#64748b", fontWeight: "500" },
  dataValue: { fontWeight: "700", color: "#0f172a" }
};

export default StudentDirectory;