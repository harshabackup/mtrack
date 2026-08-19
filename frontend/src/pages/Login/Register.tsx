import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    vendor_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      await api.post('/api/v1/auth/register', {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        vendor_name: formData.vendor_name
      });
      
      // Navigate to OTP verify
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-app)', padding: '24px' }}>
      <div className="card animate-in" style={{ width: '500px', maxWidth: '100%', padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="MAPP Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }} className="page-title">Create Account</h2>
        <p style={{ textAlign: 'center', marginBottom: '32px', color: 'var(--text-secondary)' }}>Sign up to manage proposals</p>
        
        {error && (
          <div style={{ 
            background: 'var(--danger-light)', border: '1px solid var(--danger)', color: 'var(--danger)', 
            padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '24px', textAlign: 'center', fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Account / Family Name</label>
            <input type="text" className="input-field" name="vendor_name" value={formData.vendor_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="input-field" name="full_name" value={formData.full_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="input-field" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label>Phone Number</label>
            <input type="text" className="input-field" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginBottom: '16px' }} disabled={loading}>
            {loading ? 'Registering...' : 'Register Account'}
          </button>
          
          <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
