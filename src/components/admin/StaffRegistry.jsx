// src/components/admin/StaffRegistry.jsx
import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Plus, X, Award, Edit3, RotateCcw, Crown, Shield } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const StaffRegistry = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 📘 Class listings matching structural levels
  const PRIMARY_CLASSES = [
    'KG 1', 'KG 2', 'Nursery 1', 'Nursery 2', 
    'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5'
  ];

  const SECONDARY_CLASSES = [
    'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'
  ];

  // 📝 Official Curriculum Subjects Map
  const getSubjectsForClass = (className) => {
    if (!className) return ['General'];

    const cleanClass = className.trim().toUpperCase();

    // 1. Pre-Primary (KG 1, KG 2, Nursery 1, Nursery 2)
    if (cleanClass.includes('KG') || cleanClass.includes('NURSERY')) {
      return [
        'English',
        'Mathematics',
        'Basic Science',
        'Number Work',
        'Mental Work',
        'Health Education (Health Habits)',
        'CRS (Christian Religious Studies)',
        'Creative Art',
        'Music',
        'Poem',
        'Handwriting'
      ];
    }

    // 2. Primary / Basic Classes (Basic 1 - Basic 5)
    if (cleanClass.includes('BASIC')) {
      return [
        'English',
        'Mathematics',
        'C.C.A (Cultural & Creative Arts)',
        'History',
        'P.V.E (Physical & Vocational Education)',
        'CRS (Christian Religious Studies)',
        'Social & Citizenship Studies',
        'Security Education',
        'Basic Science',
        'Physical & Health Education',
        'Digital Literacy',
        'Verbal Reasoning',
        'Quantitative Reasoning'
      ];
    }

    // 3. Junior Secondary (JSS 1 - JSS 3)
    if (cleanClass.includes('JSS')) {
      return [
        'English Language',
        'Mathematics',
        'Intermediate Science',
        'Social & Citizenship Studies',
        'Intermediate Basic Science',
        'Physical & Health Education (P.H.E)',
        'Digital Technologies',
        'Business Studies',
        'Nigerian History',
        'Christian Religious Studies (C.R.S)',
        'Creative Art',
        'Yoruba'
      ];
    }

    // 4. Senior Secondary (SSS 1 - SSS 3) - Unified Sciences & Arts Catalog
    if (cleanClass.includes('SSS')) {
      return [
        'English Language',
        'Mathematics',
        'Biology',
        'Chemistry',
        'Physics',
        'Economics',
        'Animal Husbandry',
        'Civic Education',
        'Government',
        'Literature',
        'Christian Religious Studies (C.R.S)',
        'Yoruba',
        'History'
      ];
    }

    return ['General Subject'];
  };

  const initialFormState = {
    surname: '',
    firstName: '',
    email: '',
    phone: '',
    role: 'teacher', // Options: 'teacher', 'headmaster', 'principal'
    schoolSection: 'PRIMARY', 
    assignedClass: 'KG 1', 
    department: 'General',
    isClassTeacher: false,
    classTeacherOf: 'JSS 1',
    status: 'Active'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [subjectAllocations, setSubjectAllocations] = useState([
    { className: 'JSS 1', subjectName: 'English Language' }
  ]);

  // Check if current form is configuring an Executive (Headmaster / Principal / Admin dept)
  const isExecutiveRole = formData.role === 'headmaster' || formData.role === 'principal' || formData.department === 'Executive Administration';

  // 🟢 FETCH ALL TEACHERS FROM DEDICATED ROUTE (/teachers)
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/teachers');
      const teacherData = response.data.staff || response.data || [];
      setTeachers(Array.isArray(teacherData) ? teacherData : []);
    } catch (err) {
      console.error('Fetch staff error:', err);
      setError('Could not update roster indices from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'role') {
      const isPrimaryRole = value === 'headmaster';
      const isSecondaryRole = value === 'principal';
      const isExec = isPrimaryRole || isSecondaryRole;
      
      const targetSection = isPrimaryRole ? 'PRIMARY' : (isSecondaryRole ? 'SECONDARY' : formData.schoolSection);
      const defaultClass = targetSection === 'PRIMARY' ? 'KG 1' : 'JSS 1';

      setFormData(prev => ({
        ...prev,
        role: value,
        schoolSection: targetSection,
        department: isExec ? 'Executive Administration' : (targetSection === 'PRIMARY' ? 'General' : 'Sciences'),
        assignedClass: defaultClass,
        isClassTeacher: false,
        classTeacherOf: ''
      }));
    } else if (name === 'department' && value === 'Executive Administration') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        isClassTeacher: false,
        classTeacherOf: ''
      }));
    } else if (name === 'schoolSection') {
      const defaultClass = value === 'PRIMARY' ? 'KG 1' : 'JSS 1';
      setFormData(prev => ({
        ...prev,
        [name]: value,
        department: value === 'PRIMARY' ? 'General' : 'Sciences',
        assignedClass: defaultClass,
        isClassTeacher: value === 'PRIMARY',
        classTeacherOf: value === 'PRIMARY' ? defaultClass : 'JSS 1'
      }));
      
      setSubjectAllocations([{ 
        className: defaultClass, 
        subjectName: getSubjectsForClass(defaultClass)[0] 
      }]);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddAllocationRow = () => {
    const baselineClass = formData.schoolSection === 'PRIMARY' ? 'KG 1' : 'JSS 1';
    setSubjectAllocations([
      ...subjectAllocations, 
      { className: baselineClass, subjectName: getSubjectsForClass(baselineClass)[0] }
    ]);
  };

  const handleRemoveAllocationRow = (index) => {
    if (subjectAllocations.length === 1) return; 
    setSubjectAllocations(subjectAllocations.filter((_, i) => i !== index));
  };

  const handleAllocationChange = (index, field, value) => {
    const updated = [...subjectAllocations];
    updated[index][field] = value;

    if (field === 'className') {
      updated[index]['subjectName'] = getSubjectsForClass(value)[0];
    }

    setSubjectAllocations(updated);
  };

  // 🟢 PRE-POPULATE FORM FOR EDITING
  const handleEditClick = (teacher) => {
    setEditingTeacherId(teacher._id);
    setGeneratedCreds(null);
    setError('');
    setSuccess('');

    let sur = teacher.surname || '';
    let first = teacher.firstName || '';
    if (!sur && !first && teacher.name) {
      const parts = teacher.name.trim().split(' ');
      sur = parts[0] || '';
      first = parts.slice(1).join(' ') || '';
    }

    const section = teacher.schoolSection || 'PRIMARY';

    setFormData({
      surname: sur,
      firstName: first,
      email: teacher.email || '',
      phone: teacher.phone || '',
      role: teacher.role || 'teacher',
      schoolSection: section,
      assignedClass: teacher.assignedClass || 'KG 1',
      department: teacher.department || (section === 'PRIMARY' ? 'General' : 'Sciences'),
      isClassTeacher: teacher.role === 'teacher' ? (section === 'PRIMARY' ? true : Boolean(teacher.isClassTeacher)) : false,
      classTeacherOf: teacher.classTeacherOf || '',
      status: teacher.status || 'Active'
    });

    if (section === 'PRIMARY') {
      setSubjectAllocations([{ className: teacher.assignedClass || 'KG 1', subjectName: 'CLASS TEACHER' }]);
    } else if (Array.isArray(teacher.subjectAllocations) && teacher.subjectAllocations.length > 0) {
      setSubjectAllocations(teacher.subjectAllocations);
    } else {
      setSubjectAllocations([{ className: 'JSS 1', subjectName: 'English Language' }]);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTeacherId(null);
    setFormData(initialFormState);
    setSubjectAllocations([{ className: 'KG 1', subjectName: 'CLASS TEACHER' }]);
    setError('');
    setSuccess('');
  };

  // 🟢 REGISTER OR UPDATE STAFF (POST or PUT /teachers)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGeneratedCreds(null);

    const isPrimary = formData.schoolSection === 'PRIMARY';

    const completePayload = {
      ...formData,
      isClassTeacher: isExecutiveRole ? false : (isPrimary ? true : formData.isClassTeacher),
      classTeacherOf: isExecutiveRole ? '' : (isPrimary ? formData.assignedClass : (formData.isClassTeacher ? formData.classTeacherOf : '')),
      subjectAllocations: isExecutiveRole ? [] : (isPrimary ? [{ className: formData.assignedClass, subjectName: 'CLASS TEACHER' }] : subjectAllocations)
    };

    try {
      if (editingTeacherId) {
        // UPDATE MODE
        const response = await axiosInstance.put(`/teachers/${editingTeacherId}`, completePayload);
        if (response.data.success) {
          setSuccess('Staff profile updated successfully.');
          handleCancelEdit();
          fetchTeachers();
        }
      } else {
        // CREATE MODE
        const response = await axiosInstance.post('/teachers', completePayload);
        
        if (response.data.success) {
          setSuccess('Staff account provisioned successfully.');
          
          setGeneratedCreds({
            name: `${formData.surname} ${formData.firstName}`,
            username: response.data.credentials.username,
            password: response.data.credentials.temporaryPassword,
            role: formData.role.toUpperCase(),
            schoolSection: formData.schoolSection,
            isExecutive: isExecutiveRole,
            isClassTeacher: completePayload.isClassTeacher,
            classTeacherOf: completePayload.classTeacherOf,
            allocationDisplay: isExecutiveRole
              ? 'Section Executive Oversight'
              : (isPrimary ? formData.assignedClass : `${subjectAllocations.length} Subject Slots Linked`)
          });

          setFormData(initialFormState);
          setSubjectAllocations([{ className: 'JSS 1', subjectName: 'English Language' }]);
          fetchTeachers();
        }
      }
    } catch (err) {
      setSuccess('');
      setError(err.response?.data?.message || 'Profile save validation fault.');
    }
  };

  // 🟢 DELETE STAFF REQUEST
  const handleDelete = async (id) => {
    if (!window.confirm('Purge staff record permanently?')) return;
    try {
      await axiosInstance.delete(`/teachers/${id}`);
      setSuccess('Profile record purged successfully.');
      if (editingTeacherId === id) handleCancelEdit();
      fetchTeachers();
    } catch (err) {
      setError('Deletion command dropped by database engine.');
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchStr = `${t.surname || ''} ${t.firstName || ''} ${t.name || ''} ${t.username || ''} ${t.role || ''} ${t.schoolSection || ''} ${t.classTeacherOf || ''}`.toLowerCase();
    return matchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: '1rem 0', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <h2 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>Staff & Faculty Registry</h2>
      <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>Enroll instructors, Headmasters, and Principals, manage credentials, and assign class governance permissions.</p>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600' }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', fontWeight: '600' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* CREDENTIALS OUTPUT BOX */}
      {generatedCreds && (
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '12px', fontWeight: 'bold', fontSize: '13px' }}>
            <ShieldCheck size={18} /> AUTOMATIC PORTAL LOGIN PROVISIONED
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Send these details to <strong style={{ color: 'var(--text-primary)' }}>{generatedCreds.name}</strong>. Role configured as <strong style={{ color: 'var(--accent-primary)' }}>{generatedCreds.role}</strong> ({generatedCreds.schoolSection}).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>PORTAL USERNAME</span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 'bold' }}>{generatedCreds.username}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>PORTAL PASSWORD</span>
              <span style={{ fontSize: '13px', color: 'var(--accent-success)', fontFamily: 'monospace', fontWeight: 'bold' }}>{generatedCreds.password}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>ALLOCATION TRACK</span>
              <span style={{ fontSize: '13px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{generatedCreds.allocationDisplay}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>ROLE LEVEL</span>
              <span style={{ fontSize: '13px', color: generatedCreds.isExecutive ? 'var(--accent-success)' : 'var(--text-primary)', fontWeight: 'bold' }}>
                {generatedCreds.isExecutive ? 'Full Executive Sign-Off Desk' : (generatedCreds.isClassTeacher ? `Class Teacher (${generatedCreds.classTeacherOf})` : 'Subject Instructor')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* RESPONSIVE LAYOUT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ENROLLMENT / EDIT FORM CONTROLS */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: editingTeacherId ? 'var(--accent-primary)' : 'var(--accent-success)', fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px' }}>
              {editingTeacherId ? <Edit3 size={16} /> : <UserPlus size={16} />} 
              {editingTeacherId ? 'EDIT STAFF PROFILE' : 'ENROLL NEW STAFF / EXECUTIVE'}
            </div>
            {editingTeacherId && (
              <button type="button" onClick={handleCancelEdit} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--accent-danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RotateCcw size={12} /> Cancel Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* GOVERNANCE ROLE SELECTOR */}
            <div>
              <label style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Crown size={12} /> SYSTEM GOVERNANCE ROLE
              </label>
              <select name="role" value={formData.role} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }}>
                <option value="teacher">Subject / Class Teacher</option>
                <option value="headmaster">Headmaster (Primary Executive)</option>
                <option value="principal">Principal (Secondary Executive)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>SURNAME</label>
                <input type="text" name="surname" value={formData.surname} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>FIRST NAME</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>EMAIL ADDRESS</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>PHONE NUMBER</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>SCHOOL SECTION</label>
                <select name="schoolSection" value={formData.schoolSection} onChange={handleInputChange} disabled={formData.role !== 'teacher'} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="PRIMARY">PRIMARY & EARLY YEARS</option>
                  <option value="SECONDARY">SECONDARY SCHOOL</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>DEPARTMENT / SECTOR</label>
                {formData.schoolSection === 'PRIMARY' ? (
                  <select name="department" value={formData.department} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="General">General Classroom</option>
                    <option value="Nursery">Early Years Nursery</option>
                    <option value="Executive Administration">Executive Administration</option>
                  </select>
                ) : (
                  <select name="department" value={formData.department} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', marginTop: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="Sciences">Sciences Domain</option>
                    <option value="Arts & Humanities">Arts & Humanities</option>
                    <option value="Commercial">Commercial Block</option>
                    <option value="Executive Administration">Executive Administration</option>
                  </select>
                )}
              </div>
            </div>

            {/* CONDITIONAL VIEW: EXECUTIVE vs TEACHER ALLOCATIONS */}
            {isExecutiveRole ? (
              <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.25)', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', textTransform: 'uppercase' }}>
                  <Shield size={16} /> EXECUTIVE OVERALL GOVERNANCE UNLOCKED
                </span>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  This user has section-wide executive sign-off authority. They oversee all classroom results, write official remarks, and manage Third-Term promotions across all students in <strong style={{ color: 'var(--text-primary)' }}>{formData.schoolSection}</strong>.
                </p>
              </div>
            ) : (
              <>
                {/* CLASS TEACHER PERMISSION SECTION */}
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', textTransform: 'uppercase' }}>
                    <Award size={14} /> CLASS TEACHER ATTENDANCE ROLE
                  </span>

                  {formData.schoolSection === 'PRIMARY' ? (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                      Primary instructors are automatically designated as the official <strong style={{ color: 'var(--text-primary)' }}>Class Teacher</strong> for their assigned classroom hub.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          name="isClassTeacher" 
                          checked={formData.isClassTeacher} 
                          onChange={handleInputChange} 
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        Assign as Official Class Teacher
                      </label>

                      {formData.isClassTeacher && (
                        <div>
                          <label style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase' }}>MANAGED ATTENDANCE CLASS</label>
                          <select 
                            name="classTeacherOf" 
                            value={formData.classTeacherOf} 
                            onChange={handleInputChange} 
                            style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '12px', marginTop: '2px', outline: 'none', boxSizing: 'border-box' }}
                          >
                            {SECONDARY_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SUBJECT ALLOCATION WORKSPACE */}
                <div style={{ marginTop: '2px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  {formData.schoolSection === 'PRIMARY' ? (
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 'bold', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>CLASSROOM BLOCKS ASSIGNMENT</label>
                      <select name="assignedClass" value={formData.assignedClass} onChange={handleInputChange} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}>
                        {PRIMARY_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase' }}>SUBJECT SPECIALIST ALLOCATIONS</label>
                        <button type="button" onClick={handleAddAllocationRow} style={{ backgroundColor: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.3)', color: '#a78bfa', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                          <Plus size={10} /> Add Slot
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                        {subjectAllocations.map((alloc, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <select value={alloc.className} onChange={(e) => handleAllocationChange(idx, 'className', e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '6px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '12px', outline: 'none' }}>
                              {SECONDARY_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                            </select>
                            
                            <select value={alloc.subjectName} onChange={(e) => handleAllocationChange(idx, 'subjectName', e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '6px', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '12px', outline: 'none' }}>
                              {getSubjectsForClass(alloc.className).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>

                            <button type="button" onClick={() => handleRemoveAllocationRow(idx)} disabled={subjectAllocations.length === 1} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', opacity: subjectAllocations.length === 1 ? 0.3 : 1 }}>
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button type="submit" style={{ marginTop: '8px', padding: '10px', backgroundColor: editingTeacherId ? 'var(--accent-primary)' : 'var(--accent-success)', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {editingTeacherId ? <Edit3 size={16} /> : <UserPlus size={16} />} 
              {editingTeacherId ? 'Save Profile Changes' : 'Initialize Staff / Executive Account'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE ROSTER DIRECTORY GRID */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search roster by name, username, role, section..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px' }}>Username</th>
                  <th style={{ padding: '10px' }}>Name & Role</th>
                  <th style={{ padding: '10px' }}>Section</th>
                  <th style={{ padding: '10px' }}>Assigned Allocation</th>
                  <th style={{ padding: '10px' }}>Class Teacher</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => {
                  const isExec = t.role === 'headmaster' || t.role === 'principal' || t.department === 'Executive Administration';
                  const isPrimary = t.schoolSection === 'PRIMARY';
                  const isCT = isExec ? false : (isPrimary ? true : Boolean(t.isClassTeacher));
                  const ctClass = isExec ? 'Executive' : (isPrimary ? (t.assignedClass || 'KG 1') : (t.classTeacherOf || 'N/A'));
                  const isBeingEdited = editingTeacherId === t._id;
                  const roleTitle = t.role === 'headmaster' ? 'Headmaster' : (t.role === 'principal' ? 'Principal' : 'Teacher');

                  return (
                    <tr key={t._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '13px', backgroundColor: isBeingEdited ? 'rgba(37, 99, 235, 0.08)' : 'transparent' }}>
                      <td style={{ padding: '12px 10px', color: 'var(--accent-primary)', fontWeight: 'bold', fontFamily: 'monospace' }}>{t.username}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{t.name || `${t.surname} ${t.firstName}`}</div>
                        <span style={{ fontSize: '10px', color: isExec ? 'var(--accent-success)' : 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {roleTitle}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: isPrimary ? 'var(--accent-primary)' : '#a78bfa' }}>
                          {t.schoolSection || 'PRIMARY'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {isExec ? (
                          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid rgba(16, 185, 129, 0.25)', fontWeight: 'bold' }}>
                            Executive Desk
                          </span>
                        ) : isPrimary ? (
                          <span style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid rgba(37, 99, 235, 0.25)' }}>
                            {t.assignedClass || 'KG 1'} Full Hub
                          </span>
                        ) : (
                          <span style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid rgba(124, 58, 237, 0.25)' }}>
                            {t.subjectAllocations?.length || 0} Subject Slots
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {isExec ? (
                          <span style={{ color: 'var(--accent-success)', fontSize: '11px', fontWeight: 'bold' }}>Executive</span>
                        ) : isCT ? (
                          <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid rgba(168, 85, 247, 0.25)', fontWeight: 'bold' }}>
                            {ctClass}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                          <button 
                            type="button" 
                            onClick={() => handleEditClick(t)} 
                            style={{ backgroundColor: 'transparent', color: 'var(--accent-primary)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDelete(t._id)} 
                            style={{ backgroundColor: 'transparent', color: 'var(--accent-danger)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                          >
                            <Trash2 size={14} /> Purge
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredTeachers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No staff members found on roster.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffRegistry;