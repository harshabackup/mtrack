import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const routeAfterLogin = (role: string, email: string, isPasswordLogin: boolean) => {
    const isProposalPortal = window.location.hostname === 'proposal.harsharoyal.in';
    const isAdminPortal = window.location.hostname === 'mtrack.harsharoyal.in';

    if (isProposalPortal && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
      localStorage.clear();
      setError('Admin accounts cannot access the proposal portal. Please use mtrack.harsharoyal.in');
      return false;
    }
    if (isAdminPortal && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      localStorage.clear();
      setError('This portal is for administrators only. Please use proposal.harsharoyal.in');
      return false;
    }
    return true;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/api/v1/auth/login-password', { email, password });
      const { access_token, user_id, role, vendor_id } = response.data;

      if (!routeAfterLogin(role, email, true)) {
        setIsSubmitting(false);
        return;
      }

      login(access_token, { id: user_id, email, full_name: '', role, vendor_id });
      navigate(role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/invited');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Incorrect email or password');
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    if (usePassword) {
      return handlePasswordLogin(e);
    }
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/api/v1/auth/login', { email });
      navigate('/verify-otp', { state: { email } });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 401 && detail === 'User not found') {
        setError("This email isn't registered. Please check your email address, or contact your admin if you haven't been invited yet.");
      } else {
        setError(detail || 'Something went wrong. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <div className="card animate-in" style={{ width: '400px', maxWidth: '90%', padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="MAPP Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }} className="page-title">Welcome Back</h2>
        <p style={{ textAlign: 'center', marginBottom: '32px', color: 'var(--text-secondary)' }}>Sign in to your account</p>
        
        {error && (
          <div style={{ 
            background: 'var(--danger-light)', 
            border: '1px solid var(--danger)', 
            color: 'var(--danger)', 
            padding: '12px', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '24px',
            textAlign: 'center',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: usePassword ? '20px' : '32px' }}>
            <label>Email Address</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@mapp.com"
              disabled={isSubmitting}
            />
          </div>

          {usePassword && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Password</label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => { setUsePassword(!usePassword); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', cursor: 'pointer', padding: 0 }}
            >
              {usePassword ? 'Use email code instead' : 'Sign in with password instead'}
            </button>
          </div>

          <button
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Signing In...
              </>
            ) : (
              usePassword ? 'Sign In' : 'Send Code'
            )}
          </button>
          
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          
          <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Please contact support if you need an account.
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
