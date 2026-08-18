import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications State
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyNewProposals, setNotifyNewProposals] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/auth/me');
      const data = response.data;
      
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setEmail(data.email || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');
      
      setNotifyEmail(data.notify_email ?? true);
      setNotifyNewProposals(data.notify_new_proposals ?? true);
      setNotifyMarketing(data.notify_marketing ?? false);
    } catch (error) {
      console.error('Failed to fetch user data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await api.put('/api/v1/auth/me/profile', {
        first_name: firstName,
        last_name: lastName,
        bio,
        avatar_url: avatarUrl
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile', error);
      alert('Failed to update profile.');
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (!currentPassword) {
      alert('Current password is required.');
      return;
    }

    try {
      await api.put('/api/v1/auth/me/security', {
        current_password: currentPassword,
        new_password: newPassword
      });
      alert('Password updated successfully! Please log in again.');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Error updating password', error);
      alert('Failed to update password. Please check your current password.');
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await api.put('/api/v1/auth/me/notifications', {
        notify_email: notifyEmail,
        notify_new_proposals: notifyNewProposals,
        notify_marketing: notifyMarketing
      });
      alert('Notification preferences saved!');
    } catch (error) {
      console.error('Error updating notifications', error);
      alert('Failed to save notification preferences.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
      try {
        await api.delete('/api/v1/auth/me');
        alert("Account deleted.");
        localStorage.removeItem('token');
        navigate('/login');
      } catch (error) {
        console.error('Error deleting account', error);
        alert('Failed to delete account.');
      }
    }
  };

  if (loading) {
    return <div className="animate-in" style={{ padding: '40px', textAlign: 'center' }}><p>Loading settings...</p></div>;
  }

  return (
    <div className="animate-in" style={{ paddingBottom: '60px' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <h2 className="page-title">Account Settings</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your account settings and preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Settings Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button 
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline'}`}
            style={{ textAlign: 'left', justifyContent: 'flex-start', border: activeTab === 'profile' ? 'none' : '1px solid transparent', padding: '12px 16px' }}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Public Profile
          </button>
          
          <button 
            className={`btn ${activeTab === 'account' ? 'btn-primary' : 'btn-outline'}`}
            style={{ textAlign: 'left', justifyContent: 'flex-start', border: activeTab === 'account' ? 'none' : '1px solid transparent', padding: '12px 16px' }}
            onClick={() => setActiveTab('account')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Account Settings
          </button>
          
          <button 
            className={`btn ${activeTab === 'notifications' ? 'btn-primary' : 'btn-outline'}`}
            style={{ textAlign: 'left', justifyContent: 'flex-start', border: activeTab === 'notifications' ? 'none' : '1px solid transparent', padding: '12px 16px' }}
            onClick={() => setActiveTab('notifications')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            Notifications
          </button>
        </div>

        {/* Settings Content Area */}
        <div>
          {activeTab === 'profile' && (
            <div className="card animate-in">
              <h3 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>Public Profile</h3>
              
              <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
                <img src={avatarUrl || "https://i.pravatar.cc/150?img=11"} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <button className="btn btn-outline" style={{ marginBottom: '8px' }} onClick={() => {
                    const url = window.prompt("Enter new avatar URL:");
                    if (url) setAvatarUrl(url);
                  }}>Change Avatar URL</button>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Email Address</label>
                  <input type="email" className="input-field" value={email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                  <small style={{ color: 'var(--text-muted)' }}>Email cannot be changed.</small>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Bio</label>
                  <textarea className="input-field" style={{ minHeight: '100px' }} value={bio} onChange={e => setBio(e.target.value)} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSaveProfile}>Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="card animate-in">
              <h3 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>Account Security</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" className="input-field" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" className="input-field" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button className="btn btn-primary" onClick={handleUpdatePassword}>Update Password</button>
              </div>

              <h4 style={{ marginTop: '48px', marginBottom: '16px', color: '#FF3B30' }}>Danger Zone</h4>
              <div style={{ border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>Delete Account</h5>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <button className="btn" style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: 'none' }} onClick={handleDeleteAccount}>Delete Account</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card animate-in">
              <h3 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>Notification Preferences</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>Email Notifications</h5>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Receive emails about your account activity.</p>
                  </div>
                  <input type="checkbox" checked={notifyEmail} onChange={e => setNotifyEmail(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>New Proposals</h5>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Get notified when a new proposal is added to your pipeline.</p>
                  </div>
                  <input type="checkbox" checked={notifyNewProposals} onChange={e => setNotifyNewProposals(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>Marketing & Updates</h5>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Receive emails about new features and product updates.</p>
                  </div>
                  <input type="checkbox" checked={notifyMarketing} onChange={e => setNotifyMarketing(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                <button className="btn btn-primary" onClick={handleSaveNotifications}>Save Preferences</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
