// src/views/StudentRegistry.jsx
import React from "react";
import { ArrowLeft, UserPlus, Loader2, CheckCircle2, Copy, Check } from "lucide-react";
import { useStudentForm } from "../hooks/useStudentForm";
import { PersonalInfoSection, GuardiansSection } from "./FormSections";

const StudentRegistry = ({ setActiveTab, studentId }) => {
  const {
    isEditMode,
    isLoadingProfile,
    isSaving,
    successMsg,
    errorMsg,
    imagePreview,
    generatedCreds,
    copiedField,
    formData,
    setCopiedField,
    handleBackToDirectory: hookBackToDirectory,
    handleChange,
    handleFileChange,
    setSelectedFile,
    setImagePreview,
    handleSubmit
  } = useStudentForm(setActiveTab, studentId);

  const styles = {
    container: { 
      minHeight: "100vh", 
      backgroundColor: "var(--bg-main)", 
      color: "var(--text-primary)", 
      padding: "1rem 0", 
      fontFamily: "system-ui, -apple-system, sans-serif" 
    },
    formCard: { 
      background: "var(--bg-surface)", 
      padding: "2rem", 
      borderRadius: "12px", 
      border: "1px solid var(--border-color)", 
      marginBottom: "2rem",
      boxShadow: "var(--shadow-subtle)"
    },
    sectionHeader: { 
      fontSize: "13px", 
      fontWeight: "700", 
      color: "var(--accent-primary)", 
      borderBottom: "1px solid var(--border-color)", 
      paddingBottom: "0.75rem", 
      marginBottom: "1.5rem", 
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    inputLabel: { 
      fontSize: "11px", 
      fontWeight: "700", 
      textTransform: "uppercase", 
      color: "var(--text-muted)", 
      marginBottom: "0.5rem", 
      display: "block",
      letterSpacing: "0.5px"
    },
    textInput: { 
      width: "100%", 
      background: "var(--bg-input)", 
      border: "1px solid var(--border-color)", 
      borderRadius: "6px", 
      padding: "0.75rem 0.85rem", 
      fontSize: "13px", 
      color: "var(--text-primary)", 
      outline: "none", 
      boxSizing: "border-box" 
    },
    gridRow: { 
      display: "grid", 
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
      gap: "1.25rem", 
      marginBottom: "1.25rem" 
    }
  };

  const academicSessionsRange = Array.from({ length: 20 }, (_, index) => {
    const startYear = 2010 + index;
    const endYear = startYear + 1;
    return `${startYear}/${endYear}`;
  });

  const handleBackToDirectory = () => {
    if (typeof hookBackToDirectory === "function") {
      hookBackToDirectory();
    } else if (typeof setActiveTab === "function") {
      setActiveTab("directory");
    } else {
      console.error("setActiveTab execution context wrapper state is missing inside form registry view.");
    }
  };

  const handleCopyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(""), 2000);
  };

  if (isLoadingProfile) {
    return (
      <div style={{ ...styles.container, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={36} style={{ animation: "spin 1s linear infinite", color: "var(--accent-primary)", marginBottom: "1rem" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Streaming record profile fields...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: "1200px", margin: "0 auto 2rem auto" }}>
        <button 
          type="button" 
          onClick={handleBackToDirectory} 
          style={{ background: "none", border: "none", color: "var(--accent-primary)", fontSize: "13px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>
        <h2 style={{ fontSize: "26px", fontWeight: "800", color: "var(--text-primary)", margin: "0.75rem 0 0 0", letterSpacing: "-0.5px" }}>
          {isEditMode ? "Modify Student Profile Metrics" : "New Student Enrollment"}
        </h2>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {successMsg && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "var(--accent-success)", borderRadius: "8px", fontSize: "13px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "var(--accent-danger)", borderRadius: "8px", fontSize: "13px" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <PersonalInfoSection 
            formData={{
              ...formData,
              intakeTerm: formData.intakeTerm || formData.admittedTerm || "First Term",
              admittedSession: formData.admittedSession || formData.intakeSession || "2026/2027"
            }} 
            handleChange={handleChange} 
            imagePreview={imagePreview} 
            handleFileChange={handleFileChange} 
            handleRemoveImage={() => { setSelectedFile(null); setImagePreview(null); }} 
            styles={styles}
            academicSessionsRange={academicSessionsRange}
          />

          <GuardiansSection formData={formData} handleChange={handleChange} styles={styles} />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button 
              type="submit" 
              disabled={isSaving} 
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0.85rem 1.75rem", background: isEditMode ? "var(--accent-primary)" : "var(--accent-success)", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: isSaving ? "not-allowed" : "pointer" }}
            >
              {isSaving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <UserPlus size={16} />}
              {isEditMode ? "Commit Mutation Edits" : "Save Student Record"}
            </button>
          </div>
        </form>
      </div>

      {generatedCreds && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.75rem", width: "100%", maxWidth: "420px", textAlign: "center", boxShadow: "var(--shadow-main)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>Account Created Safely!</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", margin: "1.5rem 0", textAlign: "left" }}>
              <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", padding: "0.85rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Username</span>
                  <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: "700" }}>{generatedCreds.username}</span>
                </div>
                <button type="button" onClick={() => handleCopyToClipboard(generatedCreds.username, "user")} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                  {copiedField === "user" ? <Check size={16} style={{ color: "var(--accent-success)" }} /> : <Copy size={16} />}
                </button>
              </div>
              <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", padding: "0.85rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>Password</span>
                  <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: "700" }}>{generatedCreds.temporaryPassword}</span>
                </div>
                <button type="button" onClick={() => handleCopyToClipboard(generatedCreds.temporaryPassword, "pass")} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                  {copiedField === "pass" ? <Check size={16} style={{ color: "var(--accent-success)" }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <button type="button" onClick={handleBackToDirectory} style={{ width: "100%", padding: "0.75rem", background: "var(--accent-primary)", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
              Done, Open Directory Table
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StudentRegistry;