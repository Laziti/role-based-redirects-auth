import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminPendingSignupsPage from "./pages/AdminPendingSignupsPage";
import AdminListingsPage from "./pages/AdminListingsPage";
import AgentDashboard from "./pages/AgentDashboard";
import PendingApproval from "./pages/PendingApproval";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingScreen from "./components/LoadingScreen";
import AgentPublicProfile from "./pages/AgentPublicProfile";
import ListingDetail from "./pages/ListingDetail";

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
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
        path="/agent" 
        element={
          <ProtectedRoute 
            allowedRoles={['agent']}
            requiredStatus={['approved']}
          >
            <AgentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/pending" 
        element={
          <ProtectedRoute 
            allowedRoles={['agent']}
            requiredStatus={['pending_approval']}
          >
            <PendingApproval />
          </ProtectedRoute>
        } 
      />
      {/* Public Agent Profile Routes */}
      <Route path="/:agentSlug" element={<AgentPublicProfile />} />
      <Route path="/:agentSlug/listing/:listingId/:listingSlug" element={<ListingDetail />} />
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
