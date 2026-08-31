import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const { login } = useAuth();

  if (!email) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/api/v1/auth/verify-otp', { email, otp });
      const { access_token, user_id, role, vendor_id } = response.data;

      const isProposalPortal = window.location.hostname === 'proposal.harsharoyal.in';
      const isAdminPortal = window.location.hostname === 'mtrack.harsharoyal.in';

      // Block ADMIN from proposal portal
      if (isProposalPortal && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
        localStorage.clear();
        setError('Admin accounts cannot access the proposal portal. Please use mtrack.harsharoyal.in');
        setLoading(false);
        return;
      }

      // Block non-ADMIN from admin portal
      if (isAdminPortal && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        localStorage.clear();
        setError('This portal is for administrators only. Please use proposal.harsharoyal.in');
        setLoading(false);
        return;
      }

      // Use AuthContext login
      login(access_token, { id: user_id, email, full_name: '', role, vendor_id });
      
      setSuccess('Verified successfully! Redirecting...');
      setTimeout(() => {
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/invited');
        }
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    setError('');
    setSuccess('');
    try {
      await api.post('/api/v1/auth/send-otp', { email });
      setSuccess('A new OTP has been sent to your email.');
      setTimeLeft(60);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <div className="card animate-in" style={{ width: '400px', maxWidth: '90%', padding: '40px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }} className="page-title">Verify Email</h2>
        <p style={{ textAlign: 'center', marginBottom: '32px', color: 'var(--text-secondary)' }}>
          Enter the 6-digit code sent to <br/><strong>{email}</strong>
        </p>
        
        {error && (
          <div style={{ 
            background: 'var(--danger-light)', border: '1px solid var(--danger)', color: 'var(--danger)', 
            padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '24px', textAlign: 'center', fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ 
            background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)', 
            padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '24px', textAlign: 'center', fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <input 
              type="text" 
              className="input-field" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              required 
              placeholder="123456"
              maxLength={6}
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '4px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginBottom: '16px' }} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
          
          <div style={{ textAlign: 'center', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              type="button" 
              onClick={handleResend} 
              style={{ background: 'none', border: 'none', color: timeLeft > 0 ? 'var(--text-muted)' : 'var(--primary)', fontWeight: 500, cursor: timeLeft > 0 ? 'not-allowed' : 'pointer' }}
              disabled={timeLeft > 0}
            >
              {timeLeft > 0 ? `Resend Code in ${timeLeft}s` : 'Resend Code'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/register')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}
            >
              Wrong email? Go back and register again
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
