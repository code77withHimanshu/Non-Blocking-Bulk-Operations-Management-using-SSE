/**
 * Telecom Network Management Application
 * Root component with routing and task context
 */

import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import { TaskProgressPanel } from './components/task/TaskProgressPanel';
import { NetworkList } from './features/networks/NetworkList';
import { NetworkDetails } from './features/networks/NetworkDetails';
import Monitoring from './features/monitoring/Monitoring';
import Alerts from './features/alerts/Alerts';
import Settings from './features/settings/Settings';
import './App.css';

function App() {
  return (
    <TaskProvider>
      <div className="app">
        <header className="app-header">
          <div className="app-header-content">
            <div className="app-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#3b82f6" />
                <path
                  d="M8 16h4m4 0h4m4 0h4M12 10v12M20 10v12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>NetOps</span>
            </div>
            <nav className="app-nav">
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>Networks</NavLink>
              <NavLink to="/monitoring" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Monitoring</NavLink>
              <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Alerts</NavLink>
              <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Settings</NavLink>
            </nav>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<NetworkList />} />
            <Route path="/networks/:id" element={<NetworkDetails />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <TaskProgressPanel />
      </div>
    </TaskProvider>
  );
}

export default App;
