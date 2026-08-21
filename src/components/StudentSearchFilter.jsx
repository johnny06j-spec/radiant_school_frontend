// src/components/StudentSearchFilter.jsx
import React from "react";
import { Search } from "lucide-react";

const StudentSearchFilter = ({ 
  classFilter, 
  sessionFilter, 
  searchTerm, 
  availableClasses, 
  availableSessions, 
  onFilterChange,
  styles 
}) => {
  return (
    <div style={styles.filterBar}>
      <select 
        value={classFilter} 
        onChange={(e) => onFilterChange("class", e.target.value)} 
        style={styles.selectDropdown}
      >
        {availableClasses.map((cls, idx) => (
          <option key={idx} value={cls}>{cls}</option>
        ))}
      </select>

      <select 
        value={sessionFilter} 
        onChange={(e) => onFilterChange("session", e.target.value)} 
        style={styles.selectDropdown}
      >
        {availableSessions.map((session, idx) => (
          <option key={idx} value={session}>{session}</option>
        ))}
      </select>

      <div style={styles.searchWrapper}>
        <Search size={16} style={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search by name, admission no..."
          value={searchTerm}
          onChange={(e) => onFilterChange("search", e.target.value)}
          style={styles.searchInput}
        />
      </div>
    </div>
  );
};

export default StudentSearchFilter;