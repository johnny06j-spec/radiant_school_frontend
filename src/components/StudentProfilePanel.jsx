// src/components/StudentProfilePanel.jsx
import React from "react";
import { User, Download, Printer } from "lucide-react";
import InstitutionLogo from "../assets/Logo.jpg";

const StudentProfilePanel = ({ selectedStudent, downloadBiodataPDF, printBiodataSheet, styles }) => {
  if (!selectedStudent) {
    return (
      <div style={{ background: "#131c31", borderRadius: "8px", border: "1px solid #1e2942", padding: "3rem", textAlign: "center", color: "#64748b" }}>
        Select a student to display full structural matrix records sheet.
      </div>
    );
  }

  // Safe Name Resolution
  const resolvedName = selectedStudent.name || 
    `${selectedStudent.firstName || ""} ${selectedStudent.surname || ""}`.trim() || 
    "Active Student";

  // Intake Timeline Context Resolution
  const intakeSession = selectedStudent.intakeSession || selectedStudent.admittedSession || selectedStudent.admissionSession || "N/A";
  const intakeTerm = selectedStudent.intakeTerm || selectedStudent.admittedTerm || selectedStudent.admissionTerm || "First Term";

  return (
    <div style={styles.rightWrapperCard}>
      <div style={styles.docHeaderButtons}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", fontWeight: "600" }}>
          <User size={14} /> Student Biodata Preview
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={downloadBiodataPDF} style={{ display: "flex", alignItems: "center", gap: "4px", border: "1px solid #cbd5e1", background: "#fff", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
            <Download size={12} /> Download PDF
          </button>
          <button onClick={printBiodataSheet} style={{ display: "flex", alignItems: "center", gap: "4px", border: "none", background: "#10b981", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", color: "#fff", cursor: "pointer" }}>
            <Printer size={12} /> Print Biodata
          </button>
        </div>
      </div>

      <div id="biodata-sheet" style={styles.docTargetContainer}>
        <div style={styles.docTitleRow}>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <div style={styles.logoBox}>
              <img src={InstitutionLogo} alt="Institution Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>RADIANT INTELLECTUALS' COLLEGE</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#64748b", fontWeight: "500" }}>Off Old Ikare Road Owo, Nigeria.</p>
              <p style={{ margin: "1px 0 0 0", fontSize: "10px", color: "#64748b" }}>Email: admin@radiantcollege.com</p>
            </div>
          </div>
          
          <div style={styles.photoBox}>
            {selectedStudent.passportPhoto ? (
              <img 
                src={selectedStudent.passportPhoto} 
                alt="Passport" 
                crossOrigin="anonymous" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />
            ) : (
              <span>NO PHOTO</span>
            )}
          </div>
        </div>

        <div style={{ border: "1px solid #000", padding: "4px", textAlign: "center", fontSize: "11px", fontWeight: "800", color: "#000", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>
          STUDENT BIODATA SHEET
        </div>

        <div style={styles.sectionHeader}>A. Personal Information</div>
        <div style={styles.dataGrid}>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Admission No:</span>
            <span style={{ ...styles.dataValue, color: "#2563eb", fontFamily: "monospace" }}>{selectedStudent.admissionNo || "N/A"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Full Name:</span>
            <span style={styles.dataValue}>{resolvedName}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Date of Birth:</span>
            <span style={styles.dataValue}>{selectedStudent.dob || selectedStudent.dateOfBirth || "Not Specified"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Gender:</span>
            <span style={styles.dataValue}>{selectedStudent.gender || "Not Specified"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Blood / Genotype:</span>
            <span style={{ ...styles.dataValue, color: "#ef4444" }}>
              {selectedStudent.bloodGroup || "N/A"} / {selectedStudent.genotype || "N/A"}
            </span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Home Town:</span>
            <span style={styles.dataValue}>{selectedStudent.homeTown || selectedStudent.placeOfBirth || "N/A"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Nationality:</span>
            <span style={styles.dataValue}>Nigerian</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>State of Origin:</span>
            <span style={styles.dataValue}>{selectedStudent.stateOfOrigin || "Not Specified"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>L.G.A:</span>
            <span style={styles.dataValue}>{selectedStudent.lga || "Not Specified"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Religion:</span>
            <span style={styles.dataValue}>{selectedStudent.religion || "Not Specified"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Phone Number:</span>
            <span style={styles.dataValue}>{selectedStudent.phone || "N/A"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Email Address:</span>
            <span style={{ ...styles.dataValue, fontSize: "11px" }}>{selectedStudent.email || "N/A"}</span>
          </div>
        </div>
        
        <div style={{ padding: "6px 0", fontSize: "11px" }}>
          <span style={styles.dataLabel}>Residential Address: </span>
          <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedStudent.address || "N/A"}</span>
        </div>

        <div style={styles.sectionHeader}>B. Academic Information</div>
        <div style={styles.dataGrid}>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Current Class:</span>
            <span style={{ ...styles.dataValue, color: "#10b981" }}>{selectedStudent.assignedClass || selectedStudent.currentClass || "N/A"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Status Flag:</span>
            <span style={{ ...styles.dataValue, color: "#10b981" }}>{selectedStudent.status || "Active"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Intake Session:</span>
            <span style={styles.dataValue}>{intakeSession}</span>
          </div>
          {/* 🟢 NEW INTAKE TERM FIELD DISPLAY */}
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Intake Term:</span>
            <span style={{ ...styles.dataValue, color: "#2563eb" }}>{intakeTerm}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Date of Admission:</span>
            <span style={styles.dataValue}>
              {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toISOString().split('T')[0] : "N/A"}
            </span>
          </div>
        </div>

        <div style={styles.sectionHeader}>C. Parent / Guardian Information</div>
        <div style={styles.dataGrid}>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Father's Name:</span>
            <span style={styles.dataValue}>{selectedStudent.fatherName || "N/A"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Father's Phone:</span>
            <span style={styles.dataValue}>{selectedStudent.fatherPhone || "N/A"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Mother's Name:</span>
            <span style={styles.dataValue}>{selectedStudent.motherName || "N/A"}</span>
          </div>
          <div style={{ display: "contents" }}>
            <span style={styles.dataLabel}>Mother's Phone:</span>
            <span style={styles.dataValue}>{selectedStudent.motherPhone || "N/A"}</span>
          </div>
        </div>
        <div style={{ padding: "6px 0", fontSize: "11px" }}>
          <span style={styles.dataLabel}>Guardian Address: </span>
          <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedStudent.guardianAddress || "N/A"}</span>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePanel;