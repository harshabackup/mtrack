import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  vendor_id?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const user_id = localStorage.getItem('user_id');
    const vendor_id = localStorage.getItem('vendor_id');

    if (token && role) {
      // In a robust app, we'd fetch the exact user profile via /api/v1/auth/me here
      api.get('/api/v1/auth/me')
        .then(response => {
          setUser({
            id: response.data.id,
            email: response.data.email,
            full_name: response.data.full_name,
            role: role,
            vendor_id: response.data.vendor_id
          });
        })
        .catch((error) => {
          // Only log out if it's explicitly an auth error (401/403). 
          // Don't log out if the server is just sleeping (502/504) or on network timeout.
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('token');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('user_id', userData.id.toString());
    if (userData.vendor_id) {
      localStorage.setItem('vendor_id', userData.vendor_id.toString());
    }
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('vendor_id');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
