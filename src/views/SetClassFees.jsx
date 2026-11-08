// src/views/SetClassFees.jsx
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import API from '../api/axiosInstance';
import ConfigureFeeForm from '../components/setClassFees/ConfigureFeeForm.jsx';
import ActiveStructuresLog from '../components/setClassFees/ActiveStructuresLog.jsx';

const SetClassFees = ({ defaultCampus = 'Emerald Campus' }) => {
  const [activeFilterCampus, setActiveFilterCampus] = useState(defaultCampus);
  const [targetCampus, setTargetCampus] = useState(
    defaultCampus && defaultCampus !== 'All Campuses' ? defaultCampus : 'Great Campus'
  );

  const [selectedClass, setSelectedClass] = useState('JSS 1');
  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedSession, setSelectedSession] = useState('');

  const [structureItems, setStructureItems] = useState([]);
  const [activeStructures, setActiveStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Sync active global filter with target campus
  useEffect(() => {
    if (defaultCampus && defaultCampus !== 'All Campuses') {
      setActiveFilterCampus(defaultCampus);
      setTargetCampus(defaultCampus);
    }
  }, [defaultCampus]);

  const fetchSystemSettings = async () => {
    try {
      const { data } = await API.get('/system/config');
      const configData = data?.data || data?.config || data;

      if (configData?.currentSession) setSelectedSession(configData.currentSession);
      if (configData?.currentTerm) setSelectedTerm(configData.currentTerm);
    } catch (error) {
      console.warn('⚠️ System settings fetch failed:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setFetching(true);
      const { data } = await API.get('/finance/structures?campus=All%20Campuses');
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
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [activeFilterCampus]);

  // Sync workspace view when class, target campus, or system-locked term/session adjusts
  useEffect(() => {
    if (!selectedSession || !selectedTerm) return;

    const matchingStructure = activeStructures.find(
      (structure) =>
        structure.className === selectedClass &&
        structure.term === selectedTerm &&
        structure.session === selectedSession &&
        (structure.campus || 'Emerald Campus') === targetCampus
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
  }, [selectedClass, selectedTerm, selectedSession, targetCampus, activeStructures]);

  // Dynamic Row Handlers
  const handleNameChange = (id, val) => {
    setStructureItems((prev) => prev.map((item) => (item.id === id ? { ...item, name: val } : item)));
  };

  const handleAmountChange = (id, val) => {
    const numVal = val === '' ? 0 : Number(val);
    setStructureItems((prev) => prev.map((item) => (item.id === id ? { ...item, amount: numVal } : item)));
  };

  const handleAppliesToChange = (id, val) => {
    setStructureItems((prev) => prev.map((item) => (item.id === id ? { ...item, appliesTo: val } : item)));
  };

  const handleCheckboxToggle = (id) => {
    setStructureItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const handleRemoveRow = (id) => {
    setStructureItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddRow = () => {
    const newId =
      structureItems.length > 0
        ? Math.max(...structureItems.map((o) => (String(o.id).match(/^\d+$/) ? Number(o.id) : 0))) + 1
        : 1;
    setStructureItems([
      ...structureItems,
      { id: newId, checked: true, name: '', appliesTo: 'All Students', amount: 0 },
    ]);
  };

  const handleEditStructure = (structure) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedClass(structure.className);
    if (structure.campus) {
      setTargetCampus(structure.campus);
      setActiveFilterCampus(structure.campus);
    }
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
        campus: targetCampus, // 🟢 Strictly isolated target campus
        items: structureItems.map((item) => ({
          name: item.name.trim(),
          amount: Number(item.amount) || 0,
          checked: !!item.checked,
          appliesTo: item.appliesTo,
        })),
      };

      const { data } = await API.post('/finance/structure', payload);

      if (data?.success) {
        alert(`Fee structure for ${selectedClass} - ${targetCampus} (${selectedSession} / ${selectedTerm}) saved successfully!`);
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
      const { data } = await API.patch(`/finance/structure/${id}/status`, { status: nextStatus });
      if (data?.success) fetchDashboardData();
    } catch (error) {
      console.error('Status state modification fault:', error);
    }
  };

  const handleDeleteStructure = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee structure? This will wipe corresponding student invoices.')) {
      try {
        const { data } = await API.delete(`/finance/structure/${id}`);
        if (data?.success) {
          alert('Fee structure deleted successfully!');
          fetchDashboardData();
        } else {
          alert(`Error response rejection: ${data?.message}`);
        }
      } catch (error) {
        console.error('Deletion system transaction failure:', error);
        alert('Failed to delete fee structure safely.');
      }
    }
  };

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
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>
            FEE STRUCTURE CONFIGURATION
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Create and manage campus-specific fee items and class fee structures
          </p>
        </div>
      </header>

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
          <strong>Electronic Rule Desk:</strong> Cash transactions are locked out on this engine portal. All structural components scale directly to direct banking systems.
        </span>
      </div>

      <ConfigureFeeForm
        targetCampus={targetCampus}
        setTargetCampus={(campus) => {
          setTargetCampus(campus);
          setActiveFilterCampus(campus);
        }}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedTerm={selectedTerm}
        selectedSession={selectedSession}
        structureItems={structureItems}
        onNameChange={handleNameChange}
        onAmountChange={handleAmountChange}
        onAppliesToChange={handleAppliesToChange}
        onCheckboxToggle={handleCheckboxToggle}
        onRemoveRow={handleRemoveRow}
        onAddRow={handleAddRow}
        onSave={handleSaveStructure}
        loading={loading}
      />

      <ActiveStructuresLog
        activeStructures={activeStructures}
        activeFilterCampus={activeFilterCampus}
        fetching={fetching}
        onEditStructure={handleEditStructure}
        onToggleStatus={handleToggleStatus}
        onDeleteStructure={handleDeleteStructure}
      />
    </div>
  );
};

export default SetClassFees;