// src/components/setClassFees/ActiveStructuresLog.jsx
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const ActiveStructuresLog = ({
  activeStructures,
  activeFilterCampus,
  fetching,
  onEditStructure,
  onToggleStatus,
  onDeleteStructure
}) => {
  // 🟢 STRICT CAMPUS FILTERING (Prevents Great Campus from seeing Emerald Campus records)
  const filteredActiveStructures = activeStructures.filter((struct) => {
    const campusName = struct.campus || 'Emerald Campus';
    if (!activeFilterCampus || activeFilterCampus === 'All Campuses') return true;
    return campusName.toLowerCase() === activeFilterCampus.toLowerCase();
  });

  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <span
          style={{
            width: '24px',
            height: '24px',
            background: '#9333ea',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '900',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          2
        </span>
        <h3
          style={{
            textTransform: 'uppercase',
            fontSize: '12px',
            fontWeight: '900',
            color: 'var(--text-primary)',
            margin: 0,
            letterSpacing: '0.5px',
          }}
        >
          Active Fee Structures Log ({activeFilterCampus || 'All Campuses'})
        </h3>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-color)',
                fontSize: '11px',
                fontWeight: '900',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <th style={{ paddingBottom: '0.75rem' }}>Campus</th>
              <th style={{ paddingBottom: '0.75rem' }}>Class</th>
              <th style={{ paddingBottom: '0.75rem' }}>Term</th>
              <th style={{ paddingBottom: '0.75rem' }}>Session</th>
              <th style={{ paddingBottom: '0.75rem' }}>Total Amount</th>
              <th style={{ paddingBottom: '0.75rem' }}>Status</th>
              <th style={{ paddingBottom: '0.75rem', textAlign: 'center', width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredActiveStructures.map((structure) => {
              const totalAmt = Number(structure.totalAmount) || 0;
              const campusDisplay = structure.campus || 'Emerald Campus';
              return (
                <tr key={structure._id} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                  <td style={{ padding: '1rem 0' }}>
                    <span
                      style={{
                        backgroundColor:
                          campusDisplay === 'Great Campus' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: campusDisplay === 'Great Campus' ? '#c084fc' : '#60a5fa',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '800',
                        border:
                          campusDisplay === 'Great Campus'
                            ? '1px solid rgba(168, 85, 247, 0.3)'
                            : '1px solid rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      {campusDisplay}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0', fontSize: '13px', fontWeight: '900', color: 'var(--text-primary)' }}>
                    {structure.className}
                  </td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-muted)', fontWeight: '700' }}>
                    {structure.term}
                  </td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-muted)', fontWeight: '700' }}>
                    {structure.session}
                  </td>
                  <td style={{ padding: '1rem 0', fontWeight: '900', color: 'var(--accent-success)' }}>
                    ₦{totalAmt.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    <button
                      onClick={() => onToggleStatus(structure._id, structure.status)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        color: structure.status === 'Active' ? 'var(--accent-success)' : 'var(--accent-danger)',
                        fontSize: '10px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {structure.status || 'Active'}
                    </button>
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => onEditStructure(structure)}
                        style={{
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--accent-primary)',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                        }}
                        title="Edit Workspace Layout"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteStructure(structure._id)}
                        style={{
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--accent-danger)',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                        }}
                        title="Delete Configuration Block"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!fetching && filteredActiveStructures.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    padding: '3rem 0',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                  }}
                >
                  No system fee parameters saved on server for {activeFilterCampus}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ActiveStructuresLog;