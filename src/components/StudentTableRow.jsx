// src/components/StudentTableRow.jsx
import React from "react";
import { Edit2, Trash2 } from "lucide-react";

const StudentTableRow = ({ student, isSelected, onSelect, onEdit, onDelete, styles }) => {
  const fallbackName = (student.name || `${student.firstName || ""} ${student.surname || ""}`).trim() || "Unknown Student";

  return (
    <tr 
      onClick={() => onSelect(student)}
      style={{ 
        background: isSelected ? "rgba(147, 51, 234, 0.08)" : "transparent", 
        cursor: "pointer", 
        transition: "background 0.2s" 
      }}
    >
      <td style={{ ...styles.td, fontFamily: "monospace", color: "#3b82f6", fontWeight: "600" }}>
        {student.admissionNo || "N/A"}
      </td>
      <td style={{ ...styles.td, fontWeight: "700", color: isSelected ? "#c084fc" : "#fff" }}>
        {fallbackName}
      </td>
      <td style={{ ...styles.td, color: "#94a3b8" }}>
        {student.assignedClass || student.currentClass || "N/A"}
      </td>
      <td style={styles.td}>
        <span style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "800" }}>
          {(student.status || "ACTIVE").toUpperCase()}
        </span>
      </td>
      <td style={{ ...styles.td, textAlign: "right", paddingRight: "1.25rem" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={() => onEdit(student)} style={{ ...styles.actionBtn, color: "#3b82f6" }} title="Modify Records">
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(student._id, fallbackName)} style={{ ...styles.actionBtn, color: "#ef4444" }} title="Purge Record">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StudentTableRow;