import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean; // Allows admin OR staff
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireStaff = false
}) => {
  const { user, loading, rolesLoading, isAdmin, canViewOrders } = useAuth();
  const location = useLocation();

  // Wait for both auth AND roles to load
  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If requireAdmin is set, only admins can access
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If requireStaff is set, both admin and staff can access
  if (requireStaff && !canViewOrders) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
