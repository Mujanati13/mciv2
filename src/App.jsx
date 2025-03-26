import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/login';
import SignupPage from './pages/regester';
import ClientProfile from './pages/interfaceClient';
import AdminLoginPage from './pages/loginAdmin';
import InterfaceEn from './pages/interfaceEn';
import InterfaceAd from './pages/interfaceAd';

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
        <Route
          path="/interface-cl"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <ClientProfile onLogin={handleLogin} />
            )
          }
        />
         <Route
          path="/interface-en"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <InterfaceEn onLogin={handleLogin} />
            )
          }
        />
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
      </Routes>
    </Router>
  );
};

export default App;