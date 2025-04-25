import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/login';
import SignupPage from './pages/regester';
import ClientProfile from './pages/interfaceClient';
import AdminLoginPage from './pages/loginAdmin';
import InterfaceEn from './pages/interfaceEn';
import InterfaceAd from './pages/interfaceAd';
// Import detail page components
import AppelDOffreDetail from './components/dynamicPages/ad-client';
import BonCommandeDetail from './components/dynamicPages/dbc';
// Ensure these components are properly imported
// import Dashboard from './pages/Dashboard';
// import Profile from './pages/Profile';
// import Settings from './pages/Settings';
import NotFound from '../src/notFound';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/loginAdmin"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AdminLoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/regester"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <SignupPage onLogin={handleLogin} />
            )
          }
        />

        {/* Client Interface Routes */}
        <Route
          path="/interface-cl/*"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Routes>
                <Route path="/" element={<ClientProfile onLogin={handleLogin} />} />
                <Route path="appeldoffre/:id" element={<AppelDOffreDetail />} />
                <Route path="boncommand/:id" element={<BonCommandeDetail />} />
              </Routes>
            )
          }
        />

        {/* ESN Interface Routes */}
        <Route
          path="/interface-en/*"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Routes>
                <Route path="/" element={<InterfaceEn onLogin={handleLogin} />} />
                <Route path="appeldoffre/:id" element={<AppelDOffreDetail />} />
                <Route path="boncommand/:id" element={<BonCommandeDetail />} />
              </Routes>
            )
          }
        />

        {/* Admin Interface Route */}
        <Route
          path="/interface-ad"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <InterfaceAd onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <Profile />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <Settings />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
        
        {/* 404 route - This should be the last route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;