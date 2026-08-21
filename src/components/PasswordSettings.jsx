// src/components/PasswordSettings.jsx
import React, { useState } from "react";
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import API from "../api/axiosInstance";

const PasswordSettings = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [status, setStatus] = useState({ type: "", message: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    // Frontend validations
    if (passwords.newPassword !== passwords.confirmPassword) {
      setStatus({ type: "error", message: "Your new passwords do not match." });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setStatus({ type: "error", message: "New password must be at least 6 characters long." });
      return;
    }

    setIsUpdating(true);

    try {
      const response = await API.put("/auth/update-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      if (response.data?.success) {
        setStatus({ type: "success", message: "🔑 Password upgraded securely!" });
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      console.error("Password update error:", err);
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Failed to update security credentials."
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const styles = {
    card: { background: "#131c31", padding: "2rem", borderRadius: "12px", border: "1px solid #1e2942", maxWidth: "500px", color: "#fff", fontFamily: "system-ui, sans-serif" },
    banner: { display: "flex", gap: "12px", background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.15)", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" },
    inputWrapper: { position: "relative", display: "flex", alignItems: "center", marginBottom: "1.25rem" },
    inputField: { width: "100%", background: "#090f1d", border: "1px solid #1e2942", borderRadius: "6px", padding: "0.75rem 2.5rem 0.75rem 2.5rem", fontSize: "13px", color: "#fff", outline: "none" },
    iconLeft: { position: "absolute", left: "12px", color: "#475569" },
    iconRight: { position: "absolute", right: "12px", color: "#475569", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" },
    label: { fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#94a3b8", marginBottom: "0.5rem", display: "block" },
    btn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "0.75rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "13px", cursor: isUpdating ? "not-allowed" : "pointer" }
  };

  return (
    <div style={styles.card}>
      {/* 🛡️ Informative security prompt banner */}
      <div style={styles.banner}>
        <ShieldCheck size={20} style={{ color: "#3b82f6", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#3b82f6" }}>Security Check (Optional)</h4>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8", lineHeight: "1.4" }}>
            You are completely fine using your system-assigned temporary password. However, if you'd prefer a custom one, you can upgrade it below at any time.
          </p>
        </div>
      </div>

      {/* Dynamic Response Feedback Banners */}
      {status.message && (
        <div style={{
          marginBottom: "1.25rem", padding: "0.75rem 1rem", borderRadius: "6px", fontSize: "13px", fontWeight: "600",
          background: status.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          border: status.type === "success" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
          color: status.type === "success" ? "#10b981" : "#ef4444",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          {status.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {status.message}
        </div>
      )}

      <form onSubmit={handleUpdatePassword}>
        {/* Current Password Input */}
        <div>
          <label style={styles.label}>Current Password</label>
          <div style={styles.inputWrapper}>
            <Lock size={14} style={styles.iconLeft} />
            <input
              type={showCurrent ? "text" : "password"}
              name="currentPassword"
              required
              value={passwords.currentPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              style={styles.inputField}
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={styles.iconRight}>
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* New Password Input */}
        <div>
          <label style={styles.label}>New Custom Password</label>
          <div style={styles.inputWrapper}>
            <Lock size={14} style={styles.iconLeft} />
            <input
              type={showNew ? "text" : "password"}
              name="newPassword"
              required
              value={passwords.newPassword}
              onChange={handleInputChange}
              placeholder="Min. 6 characters"
              style={styles.inputField}
            />
            <button type="button" onClick={() => setShowNew(!showNew)} style={styles.iconRight}>
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password Input */}
        <div>
          <label style={styles.label}>Confirm New Password</label>
          <div style={styles.inputWrapper}>
            <Lock size={14} style={styles.iconLeft} />
            <input
              type={showNew ? "text" : "password"}
              name="confirmPassword"
              required
              value={passwords.confirmPassword}
              onChange={handleInputChange}
              placeholder="Retype new password"
              style={styles.inputField}
            />
          </div>
        </div>

        {/* Action Submit Button */}
        <button type="submit" disabled={isUpdating} style={styles.btn}>
          {isUpdating ? (
            <>
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              Updating Security Key...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
};

export default PasswordSettings;