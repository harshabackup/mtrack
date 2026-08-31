import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  profile_completed: boolean;
  invitation_token: string | null;
  is_active: boolean;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/v1/auth/users');
      setUsers(response.data);
    } catch (error) {
      showMsg('Failed to fetch users.', 'error');
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
    try {
      await api.post('/api/v1/auth/invite', { email: inviteEmail });
      showMsg(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail('');
      fetchUsers();
    } catch (err: any) {
      showMsg(err.response?.data?.detail || 'Failed to send invite.', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    try {
      await api.put(`/api/v1/auth/users/${editingUser.id}/role`, { role: editRole });
      showMsg(`Role updated to ${editRole}`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      showMsg(err.response?.data?.detail || 'Failed to update role.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/api/v1/auth/users/${confirmDelete.id}`);
      showMsg(`User ${confirmDelete.email} deleted.`);
      setConfirmDelete(null);
      fetchUsers();
    } catch (err: any) {
      showMsg(err.response?.data?.detail || 'Failed to delete user.', 'error');
    }
  };

  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' };
  const btnStyle = (color: string): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
    fontSize: '12px', fontWeight: 600, background: color, color: 'white'
  });

  return (
    <div style={{ padding: '28px', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#111827' }}>Users Management</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>{users.length} total users</p>
        </div>

        <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="email"
            placeholder="Invite by email..."
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            style={{ ...inputStyle, width: '240px' }}
            required
          />
          <button type="submit" disabled={inviting} style={{ ...btnStyle('#3b82f6'), padding: '8px 16px' }}>
            {inviting ? 'Sending...' : '✉️ Invite User'}
          </button>
        </form>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px', borderRadius: '8px',
          background: message.type === 'success' ? '#f0fdf4' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#dc2626',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          fontSize: '14px'
        }}>
          {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading users...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                {['User', 'Email', 'Role', 'Status', 'Invite Link', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {/* Avatar + Name */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: u.role === 'ADMIN' ? '#dbeafe' : '#f3f4f6',
                        color: u.role === 'ADMIN' ? '#1e40af' : '#374151',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '13px', flexShrink: 0
                      }}>
                        {(u.full_name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{u.full_name || '—'}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{u.email}</td>

                  {/* Role badge */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                      background: u.role === 'ADMIN' ? '#dbeafe' : '#f3f4f6',
                      color: u.role === 'ADMIN' ? '#1e40af' : '#475569'
                    }}>{u.role}</span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                      background: u.profile_completed ? '#d1fae5' : '#fef3c7',
                      color: u.profile_completed ? '#065f46' : '#92400e'
                    }}>{u.profile_completed ? 'Active' : 'Pending'}</span>
                  </td>

                  {/* Copy invite link */}
                  <td style={{ padding: '14px 16px' }}>
                    {u.invitation_token ? (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://proposal.harsharoyal.in/accept-invite?token=${u.invitation_token}`);
                          showMsg('Invite link copied!');
                        }}
                        style={{ ...btnStyle('#6b7280'), fontSize: '11px' }}
                      >
                        Copy Link
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#d1d5db' }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px' }}>
                    {u.role !== 'ADMIN' ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => { setEditingUser(u); setEditRole(u.role); }}
                          style={btnStyle('#10b981')}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          style={btnStyle('#ef4444')}
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>Cannot modify</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700 }}>Edit User</h3>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '13px' }}>{editingUser.email}</p>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>Role</label>
            <select
              value={editRole}
              onChange={e => setEditRole(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: '20px' }}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingUser(null)} style={{ ...btnStyle('#9ca3af'), padding: '8px 16px' }}>Cancel</button>
              <button onClick={handleEditSave} style={{ ...btnStyle('#3b82f6'), padding: '8px 16px' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, textAlign: 'center' }}>Delete User?</h3>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '14px', textAlign: 'center' }}>
              This will permanently delete <strong>{confirmDelete.email}</strong>. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ ...btnStyle('#9ca3af'), padding: '10px 20px' }}>Cancel</button>
              <button onClick={handleDelete} style={{ ...btnStyle('#ef4444'), padding: '10px 20px' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
