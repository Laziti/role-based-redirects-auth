
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: Array<'super_admin' | 'agent'>;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user role doesn't have permission, redirect to appropriate dashboard
  if (userRole && !allowedRoles.includes(userRole)) {
    // Redirect super_admin to admin dashboard
    if (userRole === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    // Redirect agent to agent dashboard
    if (userRole === 'agent') {
      return <Navigate to="/agent" replace />;
    }
    // Fallback to login page
    return <Navigate to="/auth" replace />;
  }

  // If authenticated and has permission, render children
  return <>{children}</>;
};

export default ProtectedRoute;
