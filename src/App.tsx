
import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AgentDashboard from './pages/AgentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/LoadingScreen';
import NotFound from './pages/NotFound';
import { AuthProvider } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import AdminListingsPage from "./pages/AdminListingsPage";
import AgentPublicProfile from "./pages/AgentPublicProfile";
import ListingDetail from "./pages/ListingDetail";
import AdminPendingSignupsPage from './pages/AdminPendingSignupsPage';

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Public Agent Profile Routes - These must come before protected routes */}
      <Route path="/:agentSlug" element={<AgentPublicProfile />} />
      <Route path="/:agentSlug/listing/:listingSlug" element={<ListingDetail />} />
      
      {/* Protected Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/pending-signups" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminPendingSignupsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/listings" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminListingsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/payments" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminPaymentsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Agent Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['agent']} requiredStatus={['approved']}>
            <AgentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/pending" 
        element={
          <ProtectedRoute allowedRoles={['agent']} requiredStatus={['pending_approval']}>
            <div className="min-h-screen bg-[var(--portal-bg)] flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gold-500 mb-4">Account Pending Approval</h1>
                <p className="text-[var(--portal-text-secondary)]">Your account is being reviewed by our admin team.</p>
              </div>
            </div>
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
