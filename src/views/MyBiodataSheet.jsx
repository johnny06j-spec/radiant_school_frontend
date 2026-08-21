// src/views/MyBiodataSheet.jsx
import React from 'react';
import { User, Mail, Phone, MapPin, Calendar, ShieldCheck, Heart, GraduationCap, Globe } from 'lucide-react';

const MyBiodataSheet = ({ studentData, isMobile, styles }) => {
  if (!studentData) {
    return (
      <div style={localStyles.emptyState}>
        <User size={32} color="#64748b" />
        <p>No biodata details found for this profile record.</p>
      </div>
    );
  }

  // Safe Name Resolution
  const fullName = studentData.name || 
    `${studentData.surname || studentData.lastName || ''} ${studentData.firstName || ''} ${studentData.otherName || ''}`.trim() || 
    "Active Student";

  // Intake Context Resolution
  const intakeSession = studentData.intakeSession || studentData.admissionSession || studentData.admittedSession || "N/A";
  const intakeTerm = studentData.intakeTerm || studentData.admissionTerm || studentData.admittedTerm || "First Term";

  const infoGroups = [
    {
      title: "PERSONAL INFORMATION",
      items: [
        { label: "Full Name", value: fullName, icon: User },
        { label: "Admission Number", value: studentData.admissionNo || "N/A", icon: ShieldCheck, highlight: "#2563eb" },
        { label: "Gender / Sex", value: studentData.gender || "Not Specified", icon: User },
        { label: "Date of Birth", value: studentData.dob || "Not Specified", icon: Calendar },
        { label: "Email Address", value: studentData.email || "N/A", icon: Mail },
        { label: "Phone Number", value: studentData.phone || "N/A", icon: Phone }
      ]
    },
    {
      title: "ACADEMIC TIMELINE",
      items: [
        { label: "Current Class", value: studentData.currentClass || studentData.assignedClass || "N/A", icon: GraduationCap, highlight: "#10b981" },
        { label: "Intake Session", value: intakeSession, icon: Calendar },
        { label: "Intake Term", value: intakeTerm, icon: Calendar, highlight: "#2563eb" },
        { label: "Current Active Session", value: studentData.academicSession || "N/A", icon: Calendar },
        { label: "Current Active Term", value: studentData.academicTerm || "N/A", icon: Calendar },
        { label: "Enrollment Type", value: studentData.enrollmentType || "N/A", icon: User }
      ]
    },
    {
      title: "ORIGIN & DEMOGRAPHICS",
      items: [
        { label: "Religion", value: studentData.religion || "Not Specified", icon: Globe },
        { label: "State of Origin", value: studentData.stateOfOrigin || "Not Specified", icon: MapPin },
        { label: "Local Government Area", value: studentData.lga || "Not Specified", icon: MapPin },
        { label: "Home Town / Place of Birth", value: studentData.homeTown || studentData.placeOfBirth || "N/A", icon: MapPin },
        { label: "Blood / Genotype", value: `${studentData.bloodGroup || 'N/A'} / ${studentData.genotype || 'N/A'}`, icon: Heart, highlight: "#ef4444" },
        { label: "Residential Address", value: studentData.address || "N/A", icon: MapPin }
      ]
    },
    {
      title: "GUARDIAN & EMERGENCY CONTACTS",
      items: [
        { label: "Father's Name", value: studentData.fatherName || "N/A", icon: User },
        { label: "Father's Phone", value: studentData.fatherPhone || "N/A", icon: Phone },
        { label: "Mother's Name", value: studentData.motherName || "N/A", icon: User },
        { label: "Mother's Phone", value: studentData.motherPhone || "N/A", icon: Phone },
        { label: "Guardian Residential Address", value: studentData.guardianAddress || studentData.address || "N/A", icon: MapPin }
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={styles.sectionDividerRow}>
        <h2 style={styles.sectionHeaderTitle}>STUDENT BIODATA ARCHIVE</h2>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '20px' 
      }}>
        {infoGroups.map((group, gIdx) => (
          <div key={gIdx} style={styles.innerSectionPanelCard}>
            <h3 style={{ ...styles.panelCardHeadingLabel, color: '#2563eb', marginBottom: '16px' }}>{group.title}</h3>
            <div style={localStyles.listContainer}>
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <div key={iIdx} style={localStyles.biodataItemRow}>
                    <Icon size={16} color="#475569" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={styles.inlineCardLabel}>{item.label}</span>
                      <p style={{ 
                        ...styles.inlineCardValue, 
                        fontSize: '13px', 
                        marginTop: '2px',
                        color: item.highlight || '#cbd5e1',
                        wordBreak: 'break-word'
                      }}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const localStyles = {
  listContainer: { display: 'flex', flexDirection: 'column', gap: '14px' },
  biodataItemRow: { display: 'flex', alignItems: 'flex-start', gap: '12px', borderBottom: '1px solid rgba(31, 41, 55, 0.4)', paddingBottom: '10px' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }
};

export default MyBiodataSheet;