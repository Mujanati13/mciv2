import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/login';
import LoginClientPage from './pages/loginClient';
import LoginESNPage from './pages/loginESN';
import LoginConsultantPage from './pages/loginConsultant';
import UnifiedLoginPage from './pages/unifiedLogin';
import SignupPage from './pages/regester';
import ClientProfile from './pages/interfaceClient';
import AdminLoginPage from './pages/loginAdmin';
import InterfaceEn from './pages/interfaceEn';
import InterfaceAd from './pages/interfaceAd';
import InterfaceConsultant from './pages/interfaceConsultant';
import InterfaceCommercial from './pages/interfaceCommercial';
// Import detail page components
import AppelDOffreDetail from './components/dynamicPages/ad-client';
import BonCommandeDetail from './components/dynamicPages/dbc';
// Import consultant components
import { ConsultantProjects } from './components/consultant-interface/consultant-projects';
// Ensure these components are properly imported
// import Dashboard from './pages/Dashboard';
// import Profile from './pages/Profile';
// import Settings from './pages/Settings';
import NotFound from '../src/notFound';
import MonthlyActivityReport from './components/consultant-interface/MonthlyActivityReport';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        {/* Original login page as landing page - redirects to selection of login types */}
        <Route
          path="/"
          element={<Navigate to="/unified-login" replace />}
        />

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
        
        {/* New dedicated login pages for Client and ESN */}
        <Route
          path="/loginClient"
          element={
            isAuthenticated ? (
              <Navigate to="/interface-cl" replace />
            ) : (
              <LoginClientPage onLogin={handleLogin} />
            )
          }
        />
        
        <Route
          path="/loginESN"
          element={
            isAuthenticated ? (
              <Navigate to="/interface-en" replace />
            ) : (
              <LoginESNPage onLogin={handleLogin} />
            )
          }
        />
        
        <Route
          path="/loginConsultant"
          element={
            isAuthenticated ? (
              <Navigate to="/interface-consultant" replace />
            ) : (
              <LoginConsultantPage onLogin={handleLogin} />
            )
          }
        />
        
        <Route
          path="/unified-login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <UnifiedLoginPage onLogin={handleLogin} />
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
        <Route path="/interface-cl/*" element={<ClientProfile onLogin={handleLogin} />}>
          <Route path="appeldoffre/:id" element={<AppelDOffreDetail />} />
          <Route path="boncommand/:id" element={<BonCommandeDetail />} />
        </Route>

        {/* ESN Interface Routes */}
        <Route path="/interface-en/*" element={<InterfaceEn onLogin={handleLogin} />}>
          <Route path="appeldoffre/:id" element={<AppelDOffreDetail />} />
          <Route path="boncommand/:id" element={<BonCommandeDetail />} />
        </Route>

        {/* Consultant Interface Routes */}
        <Route path="/interface-consultant" element={<InterfaceConsultant onLogin={handleLogin} />} />
        <Route path="/interface-consultant/projects" element={<ConsultantProjects />} />
        <Route path="/interface-consultant/cra-monthly" element={<MonthlyActivityReport />} />

        {/* Commercial Interface Routes */}
        <Route path="/interface-commercial" element={<InterfaceCommercial onLogin={handleLogin} />} />
        <Route path="/interface-commercial/:section" element={<InterfaceCommercial onLogin={handleLogin} />} />
        {/* Make sure commercial users don't access consultant routes */}
        <Route path="/interface-commercial/projects" element={<Navigate to="/interface-commercial" replace />} />

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