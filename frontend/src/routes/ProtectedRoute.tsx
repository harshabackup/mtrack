import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export const VendorRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  const isVendor = user?.role === 'VENDOR';
  const isAdminWithVendorId = (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && user?.vendor_id;

  if (!user || (!isVendor && !isAdminWithVendorId)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const InvitedUserRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user || user.role !== 'INVITED_USER') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  return <Outlet />;
};
