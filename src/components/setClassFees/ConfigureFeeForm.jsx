// src/components/setClassFees/ConfigureFeeForm.jsx
import React from 'react';
import { Trash2, Plus, Save, Loader2, Lock, Building2 } from 'lucide-react';

const ConfigureFeeForm = ({
  targetCampus,
  setTargetCampus,
  selectedClass,
  setSelectedClass,
  selectedTerm,
  selectedSession,
  structureItems,
  onNameChange,
  onAmountChange,
  onAppliesToChange,
  onCheckboxToggle,
  onRemoveRow,
  onAddRow,
  onSave,
  loading
}) => {
  const totalFeesCalculated = structureItems
    .filter((item) => item.checked)
    .reduce((sum, current) => sum + (Number(current.amount) || 0), 0);

  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        marginBottom: '2rem',
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
          1
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
          Configure Class Fee Structure
        </h3>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {/* 🏫 CAMPUS SELECTOR */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: '900',
              color: '#3b82f6',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              letterSpacing: '0.5px',
            }}
          >
            <Building2 size={12} /> Target Campus *
          </label>
          <select
            value={targetCampus}
            onChange={(e) => setTargetCampus(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: '700',
              padding: '0.6rem',
              borderRadius: '8px',
              border: '1px solid #3b82f6',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <option value="Emerald Campus">Emerald Campus</option>
            <option value="Great Campus">Great Campus</option>
          </select>
        </div>

        {/* CLASS SELECTOR */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '10px',
              fontWeight: '900',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              letterSpacing: '0.5px',
            }}
          >
            Class *
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: '700',
              padding: '0.6rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            <option value="Select Class">Select Class</option>
            <option value="KG 1">KG 1</option>
            <option value="KG 2">KG 2</option>
            <option value="NURSERY 1">NURSERY 1</option>
            <option value="NURSERY 2">NURSERY 2</option>
            <option value="BASIC 1">BASIC 1</option>
            <option value="BASIC 2">BASIC 2</option>
            <option value="BASIC 3">BASIC 3</option>
            <option value="BASIC 4">BASIC 4</option>
            <option value="BASIC 5">BASIC 5</option>
            <option value="JSS 1">JSS 1</option>
            <option value="JSS 2">JSS 2</option>
            <option value="JSS 3">JSS 3</option>
            <option value="SSS 1">SSS 1</option>
            <option value="SSS 2">SSS 2</option>
            <option value="SSS 3">SSS 3</option>
          </select>
        </div>

        {/* SYSTEM LOCKED TERM */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: '900',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              letterSpacing: '0.5px',
            }}
          >
            Term * <span style={{ color: '#d97706', fontSize: '9px', textTransform: 'none' }}>(System Locked)</span>
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              borderRadius: '8px',
              padding: '0 0.75rem',
            }}
          >
            <Lock size={12} style={{ color: '#d97706', marginRight: '6px' }} />
            <input
              type="text"
              value={selectedTerm || 'Loading...'}
              disabled
              style={{
                width: '100%',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                padding: '0.6rem 0',
                border: 'none',
                outline: 'none',
                cursor: 'not-allowed',
              }}
            />
          </div>
        </div>

        {/* SYSTEM LOCKED SESSION */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: '900',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
              letterSpacing: '0.5px',
            }}
          >
            Session * <span style={{ color: '#d97706', fontSize: '9px', textTransform: 'none' }}>(System Locked)</span>
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-input)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              borderRadius: '8px',
              padding: '0 0.75rem',
            }}
          >
            <Lock size={12} style={{ color: '#d97706', marginRight: '6px' }} />
            <input
              type="text"
              value={selectedSession || 'Loading...'}
              disabled
              style={{
                width: '100%',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                padding: '0.6rem 0',
                border: 'none',
                outline: 'none',
                cursor: 'not-allowed',
              }}
            />
          </div>
        </div>
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
              <th style={{ paddingBottom: '0.75rem', width: '40px', textAlign: 'center' }}>#</th>
              <th style={{ paddingBottom: '0.75rem', paddingLeft: '1rem' }}>Fee Item Name</th>
              <th style={{ paddingBottom: '0.75rem', width: '220px' }}>Applies To Target</th>
              <th style={{ paddingBottom: '0.75rem', width: '180px' }}>Amount (₦)</th>
              <th style={{ paddingBottom: '0.75rem', width: '60px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {structureItems.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                <td style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onCheckboxToggle(item.id)}
                    style={{ width: '15px', height: '15px', accentColor: '#9333ea', cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '1rem', paddingLeft: '1rem' }}>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => onNameChange(item.id, e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: '700',
                      width: '100%',
                      outline: 'none',
                    }}
                    placeholder="Enter Item Name (e.g., Tuition)..."
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <select
                    value={item.appliesTo}
                    onChange={(e) => onAppliesToChange(item.id, e.target.value)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="All Students">All Students</option>
                    <option value="New Students">New Students</option>
                    <option value="Returning Students">Returning Students</option>
                  </select>
                </td>
                <td style={{ padding: '1rem' }}>
                  <input
                    type="number"
                    value={item.amount === 0 ? '' : item.amount}
                    onChange={(e) => onAmountChange(item.id, e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: '700',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="0"
                  />
                </td>
                <td style={{ textAlign: 'center', padding: '1rem' }}>
                  <button
                    onClick={() => onRemoveRow(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-danger)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {structureItems.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    padding: '3rem 0',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontWeight: '700',
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                  }}
                >
                  No structural entries loaded for {targetCampus} - {selectedClass} ({selectedSession} / {selectedTerm}). Click below to add fee items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <button
          onClick={onAddRow}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: '11px',
            fontWeight: '900',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <Plus size={14} /> Add Fee Item Row
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>
              Calculated Stack Total
            </p>
            <p style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-success)', margin: '4px 0 0 0' }}>
              ₦{totalFeesCalculated.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onSave}
            disabled={loading}
            style={{
              background: '#9333ea',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '900',
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Commit Structure Updates
          </button>
        </div>
      </div>
    </section>
  );
};

export default ConfigureFeeForm;