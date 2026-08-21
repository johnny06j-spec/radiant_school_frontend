// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  // 1. Unauthenticated check
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);
    const userRole = (user?.role || '').toLowerCase();

    // 2. Role permission check
    if (allowedRoles.length > 0 && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      if (userRole === 'admin') return <Navigate to="/admin" replace />;
      // 🟢 Added 'headmaster' to fallback redirects for faculty routes
      if (userRole === 'teacher' || userRole === 'principal' || userRole === 'headmaster') {
        return <Navigate to="/teacher" replace />;
      }
      if (userRole === 'student') return <Navigate to="/student" replace />;
      
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    console.error("ProtectedRoute authentication parse fault:", err);
    return <Navigate to="/login" replace />;
  }

  // 3. Render wrapped children component OR Outlet sub-tree
  return children ? children : <Outlet />;
};

export default ProtectedRoute;