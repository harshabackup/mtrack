import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  profile_completed: boolean;
  is_invited: boolean;
  is_active: boolean;
  invitation_token: string | null;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/v1/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setInviting(true);
    setMessage('');
    
    try {
      await api.post('/api/v1/auth/invite', { email: inviteEmail });
      setMessage('Invitation sent successfully!');
      setInviteEmail('');
      fetchUsers();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Failed to send invite.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Users Management</h2>
        
        <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="email" 
            placeholder="Invite user by email" 
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            required
          />
          <button type="submit" disabled={inviting} className="btn btn-primary" style={{ padding: '8px 16px' }}>
            {inviting ? 'Inviting...' : 'Invite User'}
          </button>
        </form>
      </div>

      {message && <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }}>{message}</div>}

      <div className="table-container" style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading users...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#475569' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#475569' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#475569' }}>Role</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#475569' }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px' }}>{u.full_name}</td>
                  <td style={{ padding: '12px 16px' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '999px', 
                      fontSize: '0.75rem', 
                      background: u.role === 'ADMIN' ? '#dbeafe' : '#f1f5f9',
                      color: u.role === 'ADMIN' ? '#1d4ed8' : '#475569'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.role === 'INVITED_USER' && (
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        background: u.profile_completed ? '#dcfce7' : '#fef3c7',
                        color: u.profile_completed ? '#166534' : '#92400e'
                      }}>
                        {u.profile_completed ? 'Completed' : 'Pending Invite'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.invitation_token && (
                      <button 
                        onClick={() => {
                          const url = `https://proposal.harsharoyal.in/accept-invite?token=${u.invitation_token}`;
                          navigator.clipboard.writeText(url);
                          alert('Copied to clipboard');
                        }}
                        style={{ fontSize: '0.8rem', padding: '4px 8px', cursor: 'pointer', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                      >
                        Copy Link
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Users;
