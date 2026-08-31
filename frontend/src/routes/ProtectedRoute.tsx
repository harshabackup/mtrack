import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Both ADMIN and USER can access vendor routes
export const VendorRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
};

// Only ADMIN can access admin routes
export const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to='/vendor/dashboard' replace />;
  }

  return <Outlet />;
};

// Any logged-in user
export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? <Outlet /> : <Navigate to='/login' replace />;
};

// Backward compat alias
export const InvitedUserRoute: React.FC = ProtectedRoute;
