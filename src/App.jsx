// src/App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import './App.css';

/**
 * 🚀 Root Application Component Wrapper
 * Simply mounts the BrowserRouter configuration shell and delegates
 * all routing sub-trees directly down to the central AppRoutes file.
 */
function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;