// src/components/StudentProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * 🛡️ Student Protected Route Gatekeeper
 * Ensures only authenticated users with the role of 'student' can access the student dashboard space.
 */
const StudentProtectedRoute = ({ children }) => {
  // 1. Retrieve authentication attributes from storage
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  let user = null;
  try {
    user = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error("Failed to parse user session context structure:", error);
  }

  // 2. If no session parameters exist, redirect directly to public portal login gate
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Strict Role Gate enforcement: Redirect to root if the logged-in user is not a student
  if (user.role !== 'student') {
    console.warn(`Unauthorized access attempt. Role '${user.role}' rejected from Student Workspace.`);
    return <Navigate to="/" replace />;
  }

  // 4. Session verified successfully -> Render nested layout nodes safely
  return children;
};

export default StudentProtectedRoute;