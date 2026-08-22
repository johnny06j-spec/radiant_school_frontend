// src/views/SetClassFees.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Save, Loader2, AlertCircle, Lock } from 'lucide-react';
import API from '../api/axiosInstance';

const SetClassFees = () => {
  // --- STATE PARAMETERS ---
  const [selectedClass, setSelectedClass] = useState('JSS 1');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('');

  const [structureItems, setStructureItems] = useState([]);
  const [activeStructures, setActiveStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 🟢 1. FETCH ACTIVE SYSTEM CONFIGURATION
  const fetchSystemSettings = async () => {
    try {
      const { data } = await API.get('/system/config');
      const configData = data?.data || data?.config || data;

      if (configData?.currentSession) {
        setSelectedSession(configData.currentSession);
      }
      if (configData?.currentTerm) {
        setSelectedTerm(configData.currentTerm);
      }
    } catch (error) {
      console.warn('⚠️ System settings fetch failed:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data } = await API.get('/finance/structures');
      if (data?.success) {
        setActiveStructures(data.data || []);
      }
    } catch (error) {
      console.error('Failed to sync structural repository arrays:', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
    fetchDashboardData();
  }, []);

  // Sync workspace view when class or system-locked term/session adjusts
  useEffect(() => {
    if (!selectedSession || !selectedTerm) return;

    const matchingStructure = activeStructures.find(
      (structure) =>
        structure.className === selectedClass &&
        structure.term === selectedTerm &&
        structure.session === selectedSession
    );

    if (matchingStructure) {
      const loadedRows = (matchingStructure.items || []).map((item, index) => ({
        id: item._id || index + 1,
        checked: item.checked ?? true,
        name: item.name || '',
        appliesTo: item.appliesTo || 'All Students',
        amount: Number(item.amount) || 0,
      }));
      setStructureItems(loadedRows);
    } else {
      setStructureItems([]);
    }
  }, [selectedClass, selectedTerm, selectedSession, activeStructures]);

  // --- INTERACTIVE MATRIX CONTROL HANDLERS ---
  const handleNameChange = (id, val) => {
    setStructureItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: val } : item))
    );
  };

  const handleAmountChange = (id, val) => {
    const numVal = val === '' ? 0 : Number(val);
    setStructureItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: numVal } : item))
    );
  };

  const handleAppliesToChange = (id, val) => {
    setStructureItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, appliesTo: val } : item))
    );
  };

  const handleCheckboxToggle = (id) => {
    setStructureItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleRemoveRow = (id) => {
    setStructureItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddNewRowItem = () => {
    const newId =
      structureItems.length > 0
        ? Math.max(
            ...structureItems.map((o) =>
              String(o.id).match(/^\d+$/) ? Number(o.id) : 0
            )
          ) + 1
        : 1;
    setStructureItems([
      ...structureItems,
      {
        id: newId,
        checked: true,
        name: '',
        appliesTo: 'All Students',
        amount: 0,
      },
    ]);
  };

  const handleEditStructure = (structure) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedClass(structure.className);
  };

  const handleSaveStructure = async () => {
    if (!selectedClass || selectedClass === 'Select Class') {
      alert('Please select a valid school class branch level.');
      return;
    }

    const invalidItems = structureItems.some((item) => !item.name.trim());
    if (invalidItems) {
      alert('Please make sure all fee items added have a valid description name.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        className: selectedClass,
        term: selectedTerm,
        session: selectedSession,
        items: structureItems.map((item) => ({
          name: item.name.trim(),
          amount: Number(item.amount) || 0,
          checked: !!item.checked,
          appliesTo: item.appliesTo,
        })),
      };

      const { data } = await API.post('/finance/structure', payload);

      if (data?.success) {
        alert(
          `Fee structure for ${selectedClass} (${selectedSession} - ${selectedTerm}) saved successfully!`
        );
        await fetchDashboardData();
      } else {
        alert(data?.message || 'Failed to submit structure rules safely.');
      }
    } catch (error) {
      console.error('Failed to commit fee structural matrix:', error);
      alert(error.response?.data?.message || 'Structure network communication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const { data } = await API.patch(`/finance/structure/${id}/status`, {
        status: nextStatus,
      });
      if (data?.success) fetchDashboardData();
    } catch (error) {
      console.error('Status state modification fault:', error);
    }
  };

  const handleDeleteStructure = async (id) => {
    if (
      window.confirm(
        'Are you absolutely sure you want to completely delete this fee structure? This will wipe out all corresponding student invoices.'
      )
    ) {
      try {
        const { data } = await API.delete(`/finance/structure/${id}`);
        if (data?.success) {
          alert('Fee structure dropped successfully!');
          fetchDashboardData();
        } else {
          alert(`Error response rejection: ${data?.message}`);
        }
      } catch (error) {
        console.error('Deletion system transaction failure:', error);
        alert('Failed to drop fee tracking layouts safely.');
      }
    }
  };

  const totalFeesCalculated = structureItems
    .filter((item) => item.checked)
    .reduce((sum, current) => sum + (Number(current.amount) || 0), 0);

  return (
    <div
      style={{
        flex: 1,
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'var(--bg-main)',
        minHeight: '100vh',
        padding: '1rem 0',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header Row */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
              margin: 0,
            }}
          >
            FEE STRUCTURE CONFIGURATION
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Create and manage fee items and class fee structures
          </p>
        </div>
      </header>

      {/* Cash Warning Banner */}
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          padding: '1rem',
          borderRadius: '8px',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom: '2rem',
          color: 'var(--accent-danger)',
        }}
      >
        <AlertCircle size={20} />
        <span>
          <strong>Electronic Rule Desk:</strong> Cash transactions are locked out on this
          engine portal. All structural components scale directly to direct banking
          systems.
        </span>
      </div>

      {/* 🛠️ CONFIGURATION SHEET */}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
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

          {/* 🔒 SYSTEM LOCKED TERM INPUT */}
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
              Term *{' '}
              <span style={{ color: '#d97706', fontSize: '9px', textTransform: 'none' }}>
                (System Locked)
              </span>
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

          {/* 🔒 SYSTEM LOCKED SESSION INPUT */}
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
              Session *{' '}
              <span style={{ color: '#d97706', fontSize: '9px', textTransform: 'none' }}>
                (System Locked)
              </span>
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
                <th style={{ paddingBottom: '0.75rem', width: '40px', textAlign: 'center' }}>
                  #
                </th>
                <th style={{ paddingBottom: '0.75rem', paddingLeft: '1rem' }}>
                  Fee Item Name
                </th>
                <th style={{ paddingBottom: '0.75rem', width: '220px' }}>
                  Applies To Target
                </th>
                <th style={{ paddingBottom: '0.75rem', width: '180px' }}>Amount (₦)</th>
                <th
                  style={{
                    paddingBottom: '0.75rem',
                    width: '60px',
                    textAlign: 'center',
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {structureItems.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    verticalAlign: 'middle',
                  }}
                >
                  <td style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxToggle(item.id)}
                      style={{
                        width: '15px',
                        height: '15px',
                        accentColor: '#9333ea',
                        cursor: 'pointer',
                      }}
                    />
                  </td>
                  <td style={{ padding: '1rem', paddingLeft: '1rem' }}>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleNameChange(item.id, e.target.value)}
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
                      onChange={(e) => handleAppliesToChange(item.id, e.target.value)}
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
                      onChange={(e) => handleAmountChange(item.id, e.target.value)}
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
                      onClick={() => handleRemoveRow(item.id)}
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
                    No structural entries loaded for {selectedSession} ({selectedTerm}).
                    Click down below to begin appending lines.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <button
            onClick={handleAddNewRowItem}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: '900',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  margin: 0,
                  letterSpacing: '0.5px',
                }}
              >
                Calculated Stack Total
              </p>
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: '900',
                  color: 'var(--accent-success)',
                  margin: '4px 0 0 0',
                }}
              >
                ₦{totalFeesCalculated.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleSaveStructure}
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
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}{' '}
              Commit Structure Updates
            </button>
          </div>
        </div>
      </section>

      {/* 📋 ACTIVE STRUCTURES LIST LOG */}
      <section
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
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
            Active Fee Structures Log
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
                <th style={{ paddingBottom: '0.75rem' }}>Class</th>
                <th style={{ paddingBottom: '0.75rem' }}>Term</th>
                <th style={{ paddingBottom: '0.75rem' }}>Session</th>
                <th style={{ paddingBottom: '0.75rem' }}>Total Amount</th>
                <th style={{ paddingBottom: '0.75rem' }}>Status</th>
                <th
                  style={{
                    paddingBottom: '0.75rem',
                    textAlign: 'center',
                    width: '120px',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {activeStructures.map((structure) => {
                const totalAmt = Number(structure.totalAmount) || 0;
                return (
                  <tr
                    key={structure._id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      verticalAlign: 'middle',
                    }}
                  >
                    <td
                      style={{
                        padding: '1rem 0',
                        fontSize: '13px',
                        fontWeight: '900',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {structure.className}
                    </td>
                    <td
                      style={{
                        padding: '1rem 0',
                        color: 'var(--text-muted)',
                        fontWeight: '700',
                      }}
                    >
                      {structure.term}
                    </td>
                    <td
                      style={{
                        padding: '1rem 0',
                        color: 'var(--text-muted)',
                        fontWeight: '700',
                      }}
                    >
                      {structure.session}
                    </td>
                    <td
                      style={{
                        padding: '1rem 0',
                        fontWeight: '900',
                        color: 'var(--accent-success)',
                      }}
                    >
                      ₦{totalAmt.toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem 0' }}>
                      <button
                        onClick={() =>
                          handleToggleStatus(structure._id, structure.status)
                        }
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color:
                            structure.status === 'Active'
                              ? 'var(--accent-success)'
                              : 'var(--accent-danger)',
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <button
                          onClick={() => handleEditStructure(structure)}
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
                          onClick={() => handleDeleteStructure(structure._id)}
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
              {!fetching && activeStructures.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      padding: '3rem 0',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontWeight: '600',
                    }}
                  >
                    No system fee parameters saved on server.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SetClassFees;