// src/components/StudentPagination.jsx
import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const StudentPagination = ({ currentPage, setCurrentPage, paginationMeta, RECORDS_PER_PAGE, styles }) => {
  const totalPages = paginationMeta.totalPages || 1;
  const startRange = (currentPage - 1) * RECORDS_PER_PAGE + 1;
  const endRange = Math.min(currentPage * RECORDS_PER_PAGE, paginationMeta.totalRecords);

  const renderPaginationNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 5 && Math.abs(currentPage - i) > 2 && i !== 1 && i !== totalPages) {
        if (i === 2 || i === totalPages - 1) {
          pages.push(<span key={`ellipsis-${i}`} style={styles.ellipsis}>...</span>);
        }
        continue;
      }
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          style={{
            ...styles.pageBtn,
            ...(currentPage === i ? styles.activePageBtn : {})
          }}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div style={styles.paginationRow}>
      <div style={styles.metaControlBlock}>
        <span style={styles.rangeIndicator}>
          Showing {paginationMeta.totalRecords === 0 ? 0 : `${startRange}–${endRange}`} of {paginationMeta.totalRecords} students
        </span>
      </div>

      <div style={styles.navigationControls}>
        {/* First Page Button */}
        <button 
          disabled={!paginationMeta.hasPrevPage} 
          onClick={() => setCurrentPage(1)} 
          style={{ ...styles.navBtn, ...(!paginationMeta.hasPrevPage ? styles.disabledNavBtn : {}) }} 
          title="First Page"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Previous Page Button */}
        <button 
          disabled={!paginationMeta.hasPrevPage} 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
          style={{ ...styles.navBtn, ...(!paginationMeta.hasPrevPage ? styles.disabledNavBtn : {}) }}
        >
          <ChevronLeft size={14} /> <span className="text-label-hide">Previous</span>
        </button>

        {/* Numeric Array Container */}
        <div className="desktop-pages-array" style={styles.desktopNumbersWrapper}>
          {renderPaginationNumbers()}
        </div>

        <span className="mobile-page-indicator" style={styles.mobileTrackerLabel}>
          Page {currentPage} of {totalPages}
        </span>

        {/* Next Page Button */}
        <button 
          disabled={!paginationMeta.hasNextPage} 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
          style={{ ...styles.navBtn, ...(!paginationMeta.hasNextPage ? styles.disabledNavBtn : {}) }}
        >
          <span className="text-label-hide">Next</span> <ChevronRight size={14} />
        </button>

        {/* Last Page Button */}
        <button 
          disabled={!paginationMeta.hasNextPage} 
          onClick={() => setCurrentPage(totalPages)} 
          style={{ ...styles.navBtn, ...(!paginationMeta.hasNextPage ? styles.disabledNavBtn : {}) }} 
          title="Last Page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default StudentPagination;