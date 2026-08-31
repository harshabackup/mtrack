import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    name: '',
    age: '',
    current_city: '',
    dob: '',
    tob: '',
    pob: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.');
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/accept-invite', {
        token,
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : undefined
      });
      
      const { access_token, user_id, role, vendor_id } = response.data;
      
      // Manually set auth tokens
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify({ id: user_id, role, vendor_id }));
      
      // Hard reload or use context login if it takes string token
      window.location.href = '/invited/proposals/add';
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to accept invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error && !token) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Accept Invitation</h2>
      <p style={{ textAlign: 'center', marginBottom: '24px', color: '#666' }}>Please complete your profile details to proceed.</p>
      
      {error && <div style={{ color: 'red', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Full Name (Yours)</label>
          <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Phone Number</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        
        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #eee' }} />
        <h4 style={{ margin: '0' }}>Proposal Basic Details</h4>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Candidate Name</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Age</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Current City</label>
            <input type="text" name="current_city" value={formData.current_city} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Date of Birth (YYYY-MM-DD)</label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Time of Birth (HH:MM)</label>
            <input type="time" name="tob" value={formData.tob} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Place of Birth</label>
          <input type="text" name="pob" value={formData.pob} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        
        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '16px', fontSize: '16px' }}>
          {loading ? 'Submitting...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );
};

export default AcceptInvite;
