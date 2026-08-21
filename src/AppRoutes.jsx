// src/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import StudentProtectedRoute from './components/StudentProtectedRoute';

// 👨‍🏫 Import Teacher Dashboard & Protected Gate
import TeacherDashboard from './components/teacher/TeacherDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Stub components for student sub-navigation screens
const StudentProfile = () => <div className="text-white p-4">👤 Full Profile & Biodata Editor Component</div>;
const StudentResults = () => <div className="text-white p-4">📝 Academic Terminal Records Component</div>;
const StudentFees = () => <div className="text-white p-4">💳 Financial Ledger & Payment Gate Component</div>;

/**
 * 🧭 Central Application Routing Engine
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* 🔐 Public Gateway Route */}
      <Route path="/login" element={<Login />} />

      {/* 🛡️ Guarded Admin Workspace Branch */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* 👨‍🏫 Guarded Teacher / Principal / Headmaster Workspace Branch */}
      <Route 
        path="/teacher/*" 
        element={
          <ProtectedRoute allowedRoles={['teacher', 'principal', 'headmaster']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />

      {/* 🧑‍🎓 Guarded Student Dashboard Workspace Layout Tree */}
      <Route 
        path="/student" 
        element={
          <StudentProtectedRoute>
            <StudentDashboard />
          </StudentProtectedRoute>
        } 
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="fees" element={<StudentFees />} />
      </Route>

      {/* 🔀 Smart Dynamic Root Fallback Pivot */}
      <Route 
        path="/" 
        element={(() => {
          const token = localStorage.getItem('token');
          const userString = localStorage.getItem('user');
          
          if (!token || !userString) {
            return <Navigate to="/login" replace />;
          }

          try {
            const user = JSON.parse(userString);
            const role = (user.role || '').toLowerCase();

            if (role === 'admin') return <Navigate to="/admin" replace />;
            if (role === 'teacher' || role === 'principal' || role === 'headmaster') return <Navigate to="/teacher" replace />;
            if (role === 'student') return <Navigate to="/student" replace />;
          } catch (e) {
            console.error("Routing resolution structural profile parse error:", e);
          }
          
          return <Navigate to="/login" replace />;
        })()} 
      />

      {/* 🚫 Universal 404 Catch-All Wrapper Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;