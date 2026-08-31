import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// mtrack is admin-only. Any non-admin gets sent to login.
export const VendorRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user || user.role !== 'ADMIN') {
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

// Backward compat alias (proposal site uses InvitedUserRoute)
export const InvitedUserRoute: React.FC = ProtectedRoute;
