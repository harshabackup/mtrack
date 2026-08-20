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
    const userId = localStorage.getItem('user_id');
    const vendorId = localStorage.getItem('vendor_id');

    if (token && role && userId) {
      // Set user immediately so they don't get logged out on refresh or network error
      setUser({
        id: parseInt(userId),
        email: '',
        full_name: '',
        role: role,
        vendor_id: vendorId ? parseInt(vendorId) : undefined
      });

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
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user_id');
            localStorage.removeItem('vendor_id');
            setUser(null);
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
