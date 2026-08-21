// src/views/FormSections.jsx
import React from "react";
import { Upload, X } from "lucide-react";

export const PersonalInfoSection = ({ 
  formData, 
  handleChange, 
  imagePreview, 
  handleFileChange, 
  handleRemoveImage, 
  styles,
  academicSessionsRange = [] 
}) => (
  <div style={styles.formCard}>
    <h3 style={styles.sectionHeader}>1. Personal Information</h3>
    <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "1.5rem" }}>
      <div style={{ width: "160px", display: "flex", flexDirection: "column", alignItems: "center", padding: "1.25rem 1rem", background: "#090f1d", border: "1px dashed #223150", borderRadius: "8px", textAlign: "center" }}>
        <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "1rem" }}>Passport</span>
        {imagePreview ? (
          <div style={{ width: "100px", height: "100px", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
            <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button type="button" onClick={handleRemoveImage} style={{ position: "absolute", top: "4px", right: "4px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer" }}><X size={12} /></button>
          </div>
        ) : (
          <label style={{ width: "100px", height: "100px", background: "#131c31", border: "1px solid #1e2942", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", color: "#475569", cursor: "pointer" }}>
            <Upload size={20} />
            <span style={{ fontSize: "9px", fontWeight: "700" }}>Upload</span>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </label>
        )}
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
        <div><label style={styles.inputLabel}>Surname *</label><input type="text" name="surname" required value={formData.surname} onChange={handleChange} style={styles.textInput} /></div>
        <div><label style={styles.inputLabel}>First Name *</label><input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} style={styles.textInput} /></div>
        <div><label style={styles.inputLabel}>Other Name</label><input type="text" name="otherName" value={formData.otherName} onChange={handleChange} style={styles.textInput} /></div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
      <div>
        <label style={styles.inputLabel}>Assigned Class *</label>
        <select name="assignedClass" value={formData.assignedClass} onChange={handleChange} style={styles.textInput}>
          <option value="KG 1">KG 1</option>
          <option value="KG 2">KG 2</option>
          <option value="NURSERY 1">NURSERY 1</option>
          <option value="NURSERY 2">NURSERY 2</option>
          <optgroup label="BASICS SCHOOL">
            <option value="BASIC 1">BASIC 1</option>
            <option value="BASIC 2">BASIC 2</option>
            <option value="BASIC 3">BASIC 3</option>
            <option value="BASIC 4">BASIC 4</option>
            <option value="BASIC 5">BASIC 5</option>
          </optgroup>
          <optgroup label="JUNIOR SECONDARY SCHOOL">
            <option value="JSS 1">JSS 1</option>
            <option value="JSS 2">JSS 2</option>
            <option value="JSS 3">JSS 3</option>
          </optgroup>
          <optgroup label="SENIOR SECONDARY SCHOOL">
            <option value="SSS 1">SSS 1</option>
            <option value="SSS 2">SSS 2</option>
            <option value="SSS 3">SSS 3</option>
          </optgroup>
        </select>
      </div>

      <div>
        <label style={styles.inputLabel}>Intake Session *</label>
        <select name="admittedSession" value={formData.admittedSession || formData.intakeSession} onChange={handleChange} style={styles.textInput}>
          {academicSessionsRange.length > 0 ? (
            academicSessionsRange.map((session) => (
              <option key={session} value={session}>{session}</option>
            ))
          ) : (
            <>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
            </>
          )}
        </select>
      </div>

      {/* 🟢 NEW INTAKE TERM FIELD */}
      <div>
        <label style={styles.inputLabel}>Intake Term *</label>
        <select name="intakeTerm" value={formData.intakeTerm || formData.admittedTerm || "First Term"} onChange={handleChange} style={styles.textInput}>
          <option value="First Term">First Term</option>
          <option value="Second Term">Second Term</option>
          <option value="Third Term">Third Term</option>
        </select>
      </div>

      <div>
        <label style={styles.inputLabel}>Gender *</label>
        <select name="gender" value={formData.gender} onChange={handleChange} required style={styles.textInput}>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div>
        <label style={styles.inputLabel}>Status *</label>
        <select name="status" value={formData.status} onChange={handleChange} style={styles.textInput}>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div><label style={styles.inputLabel}>Date of Birth *</label><input type="date" name="dob" required value={formData.dob} onChange={handleChange} style={styles.textInput} /></div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
      <div>
        <label style={styles.inputLabel}>Religion *</label>
        <select name="religion" value={formData.religion} onChange={handleChange} required style={styles.textInput}>
          <option value="">Select</option>
          <option value="Christianity">Christianity</option>
          <option value="Islam">Islam</option>
          <option value="Traditional">Traditional</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label style={styles.inputLabel}>Blood / Genotype</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} style={{ ...styles.textInput, padding: "0.75rem 0.4rem" }}>
            <option value="">Blood</option>
            <option value="A+">A+</option>
            <option value="O+">O+</option>
            <option value="AB+">AB+</option>
            <option value="O-">O-</option>
          </select>
          <select name="genotype" value={formData.genotype} onChange={handleChange} style={{ ...styles.textInput, padding: "0.75rem 0.4rem" }}>
            <option value="">Geno</option>
            <option value="AA">AA</option>
            <option value="AS">AS</option>
            <option value="SS">SS</option>
          </select>
        </div>
      </div>
      <div><label style={styles.inputLabel}>State of Origin</label><input type="text" name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleChange} style={styles.textInput} /></div>
      <div><label style={styles.inputLabel}>L.G.A</label><input type="text" name="lga" value={formData.lga} onChange={handleChange} style={styles.textInput} /></div>
      <div><label style={styles.inputLabel}>Home Town</label><input type="text" name="homeTown" value={formData.homeTown} onChange={handleChange} style={styles.textInput} /></div>
    </div>

    <div style={styles.gridRow}>
      <div style={{ gridColumn: "span 2" }}><label style={styles.inputLabel}>Email Address *</label><input type="email" name="email" required value={formData.email} onChange={handleChange} style={styles.textInput} /></div>
      <div style={{ gridColumn: "span 2" }}><label style={styles.inputLabel}>Phone Number</label><input type="text" name="phone" value={formData.phone} onChange={handleChange} style={styles.textInput} /></div>
    </div>
    <div><label style={styles.inputLabel}>Residential Home Address *</label><input type="text" name="address" required value={formData.address} onChange={handleChange} style={styles.textInput} /></div>
  </div>
);

export const GuardiansSection = ({ formData, handleChange, styles }) => (
  <div style={styles.formCard}>
    <h3 style={styles.sectionHeader}>2. Parent / Guardian Information</h3>
    <div style={styles.gridRow}>
      <div><label style={styles.inputLabel}>Father's Full Name</label><input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} style={styles.textInput} /></div>
      <div><label style={styles.inputLabel}>Father's Phone Number</label><input type="text" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} style={styles.textInput} /></div>
    </div>
    <div style={styles.gridRow}>
      <div><label style={styles.inputLabel}>Mother's Full Name</label><input type="text" name="motherName" value={formData.motherName} onChange={handleChange} style={styles.textInput} /></div>
      <div><label style={styles.inputLabel}>Mother's Phone Number</label><input type="text" name="motherPhone" value={formData.motherPhone} onChange={handleChange} style={styles.textInput} /></div>
    </div>
    <div><label style={styles.inputLabel}>Guardian Contact Address</label><input type="text" name="guardianAddress" value={formData.guardianAddress} onChange={handleChange} style={styles.textInput} /></div>
  </div>
);