import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/login/Login';
import { Signup } from './components/Signup/Signup';
import EmailVerification from './components/EmailVerification/EmailVerification';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { Marketplace } from './pages/Marketplace/Marketplace';
import { Collaboration } from './pages/Collaboration/Collaboration';
import StartupDetails from './pages/StartupDetails/StartupDetails';
import CreateStartupProject from './pages/CreateStartup/CreateStartupProject';
import ApplyJob from './pages/ApplyJob/ApplyJob';
import ComingSoon from './components/comingsoon/Comingsoon';
import AccountSettings from './pages/AccountSettings/AccountSettings';
import AccountSettingsII from './pages/AccountSettings/AccountSettingsII';
import Message from './pages/message/Message';
import MessageDark from './pages/message/MessageDark';
import Dashboard from './pages/Dashboard/Dashboard';
import SearchStartups from './pages/Search/SearchStartups';
import PositionManagement from './pages/PositionManagement/PositionManagement';
import InvestorDashboard from './pages/InvestorDashboard/InvestorDashboard';
import PitchIdea from './pages/PitchIdea/PitchIdea';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute/RoleBasedRoute';

// Main App component with routing
function AppRoutes() {
  const { isAuthenticated, user, loading, getAuthStatus } = useAuth();
  
  // Debug: Log current auth status
  React.useEffect(() => {
    const status = getAuthStatus();
    console.log('🔐 Current Auth Status:', status);
  }, [isAuthenticated, user, getAuthStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} 
      />
      <Route 
        path="/verify-email" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <EmailVerification />} 
      />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Role-based routes */}
      <Route path="/marketplace" element={
        <ProtectedRoute>
          <Marketplace />
        </ProtectedRoute>
      } />
      
      <Route path="/collaboration" element={
        <ProtectedRoute>
          <Collaboration />
        </ProtectedRoute>
      } />

      <Route path="/startupdetail/:id" element={
        <ProtectedRoute>
          <StartupDetails />
        </ProtectedRoute>
      } />

      {/* Entrepreneur-only routes */}
      <Route path="/createstartup" element={
        <RoleBasedRoute allowedRoles={['entrepreneur']}>
          <CreateStartupProject />
        </RoleBasedRoute>
      } />
      
      <Route path="/pitch-idea" element={
        <RoleBasedRoute allowedRoles={['entrepreneur']}>
          <PitchIdea />
        </RoleBasedRoute>
      } />

      {/* Search routes - accessible to all authenticated users */}
      <Route path="/search" element={
        <ProtectedRoute>
          <SearchStartups />
        </ProtectedRoute>
      } />
      
      {/* Entrepreneur-only routes */}
      <Route path="/startups/:startupId/positions" element={
        <RoleBasedRoute allowedRoles={['entrepreneur']}>
          <PositionManagement />
        </RoleBasedRoute>
      } />
      
      {/* Investor-only routes */}
      <Route path="/investor-dashboard" element={
        <RoleBasedRoute allowedRoles={['investor']}>
          <InvestorDashboard />
        </RoleBasedRoute>
      } />

      {/* Student/Professional-only routes */}
      <Route path="/apply-for-collaboration/:startupId" element={
        <RoleBasedRoute allowedRoles={['student']}>
          <ApplyJob />
        </RoleBasedRoute>
      } />

      {/* General protected routes */}
      <Route path="/account" element={
        <ProtectedRoute>
          <AccountSettingsII />
        </ProtectedRoute>
      } />

      <Route path="/message" element={
        <ProtectedRoute>
          <MessageDark />
        </ProtectedRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
