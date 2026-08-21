// src/components/StudentTable.jsx
import React from "react";
import StudentTableRow from "./StudentTableRow";

const StudentTable = ({ students, selectedStudent, onSelectStudent, onEditRedirect, onDeleteClick, styles }) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Reg Number</th>
            <th style={styles.th}>Full Name</th>
            <th style={styles.th}>Enrolled Course</th>
            <th style={styles.th}>Status</th>
            <th style={{ ...styles.th, textAlign: "right", paddingRight: "1.25rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ ...styles.td, textAlign: "center", color: "#64748b", padding: "3rem 1rem" }}>
                No matching student profiles located.
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <StudentTableRow
                key={student._id}
                student={student}
                isSelected={selectedStudent?._id === student._id}
                onSelect={onSelectStudent}
                onEdit={onEditRedirect}
                onDelete={onDeleteClick}
                styles={styles}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;