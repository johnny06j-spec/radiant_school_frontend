// src/components/teacher/AttendanceModule.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Save, ShieldAlert, Check } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const AttendanceModule = ({ profile }) => {
  const isPrimary = profile?.schoolSection === 'PRIMARY';
  const isCT = isPrimary ? true : Boolean(profile?.isClassTeacher);
  const ctClass = isPrimary ? (profile?.assignedClass || 'KG 1') : (profile?.classTeacherOf || '');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  useEffect(() => {
    if (!isCT || !ctClass) return;

    const fetchAttendance = async () => {
      setLoading(true);
      setFeedback({ type: '', msg: '' });
      try {
        const res = await axiosInstance.get(
          `/attendance/sheet?className=${encodeURIComponent(ctClass)}&date=${date}`
        );
        if (res.data.success) {
          setRoster(res.data.records || []);
        }
      } catch (err) {
        console.error('Attendance fetch error:', err);
        setFeedback({ type: 'error', msg: err.response?.data?.message || 'Could not load class register.' });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [date, ctClass, isCT]);

  const handleStatusChange = (index, status) => {
    const updated = [...roster];
    updated[index].status = status;
    setRoster(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback({ type: '', msg: '' });

    try {
      const res = await axiosInstance.post('/attendance/submit', {
        className: ctClass,
        date,
        records: roster
      });

      if (res.data.success) {
        setFeedback({ type: 'success', msg: `Attendance register for ${ctClass} saved successfully!` });
      }
    } catch (err) {
      console.error('Save attendance fault:', err);
      setFeedback({ type: 'error', msg: err.response?.data?.message || 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isCT) {
    return (
      <div className="bg-slate-800/90 p-8 rounded-2xl border border-red-900/40 text-center max-w-xl mx-auto my-8">
        <ShieldAlert size={44} className="text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Attendance Permission Restricted</h3>
        <p className="text-xs text-slate-400">
          Only official designated <strong>Class Teachers</strong> have permission to take daily attendance for a class.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700/80 shadow-xl space-y-6">
      {/* MODULE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
        <div>
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Daily Register</span>
          <h2 className="text-xl font-extrabold text-white">Attendance: <span className="text-blue-400">{ctClass}</span></h2>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-500"
          />

          <button
            onClick={handleSave}
            disabled={saving || loading || roster.length === 0}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Register'}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback.msg && (
        <div className={`p-4 rounded-xl text-xs font-bold border ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' 
            : 'bg-red-950/80 border-red-500/50 text-red-300'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* ROSTER SHEET TABLE */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">Loading class attendance roster...</div>
      ) : roster.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs">No active pupils registered under <strong>{ctClass}</strong>.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-[11px] font-bold uppercase">
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Pupil Name</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-xs">
              {roster.map((st, idx) => (
                <tr key={st.studentId} className="hover:bg-slate-700/30">
                  <td className="py-3 px-4 font-mono text-blue-400 font-bold">{st.admissionNo}</td>
                  <td className="py-3 px-4 font-semibold text-white">{st.name}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex flex-wrap justify-center gap-1.5">
                      {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((opt) => {
                        const active = st.status === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleStatusChange(idx, opt)}
                            className={`
                              px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all min-h-[36px]
                              ${active 
                                ? (opt === 'PRESENT' ? 'bg-emerald-600 text-white' :
                                   opt === 'ABSENT' ? 'bg-red-600 text-white' :
                                   opt === 'LATE' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white')
                                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-500'}
                            `}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceModule;