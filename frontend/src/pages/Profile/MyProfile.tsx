import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import EditProposal from '../Proposals/EditProposal';

const MyProfile: React.FC = () => {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/v1/proposals/me');
        setProfileId(String(response.data.id));
      } catch (err: any) {
        console.error("Failed to fetch profile", err);
        setError("Failed to load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="layout-content fade-in">
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading your profile...
        </div>
      </div>
    );
  }

  if (error || !profileId) {
    return (
      <div className="layout-content fade-in">
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--danger-color, #FF3B30)' }}>
          {error || "Could not find profile."}
        </div>
      </div>
    );
  }

  return (
    <div className="layout-content fade-in">
      <EditProposal proposalId={profileId} isProfileMode={true} />
    </div>
  );
};

export default MyProfile;
