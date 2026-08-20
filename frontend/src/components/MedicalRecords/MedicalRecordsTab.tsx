import React, { useState } from 'react';
import api from '../../services/api';

interface MedicalRecord {
  id: number;
  record_url: string;
  record_name: string | null;
  created_at: string;
}

interface MedicalRecordsTabProps {
  proposalId: number;
  records: MedicalRecord[];
  onUpdate: () => void;
}

const MedicalRecordsTab: React.FC<MedicalRecordsTabProps> = ({ proposalId, records, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      await api.post(`/api/v1/proposals/${proposalId}/upload?file_type=medical_record`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      onUpdate(); // refresh proposal details
    } catch (error) {
      console.error('Failed to upload medical record', error);
      alert('Failed to upload medical record.');
    } finally {
      setUploading(false);
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) return;
    
    try {
      await api.delete(`/api/v1/proposals/${proposalId}/medical-records/${recordId}`);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete medical record', error);
      alert('Failed to delete medical record.');
    }
  };

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0 }}>Medical Records</h3>
        <div>
          <input
            type="file"
            id="medical-upload"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            disabled={uploading}
            accept=".pdf,.png,.jpg,.jpeg"
          />
          <label htmlFor="medical-upload" className="btn btn-primary" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? 'Uploading...' : 'Upload Record'}
          </label>
        </div>
      </div>

      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No medical records uploaded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {records.map(record => (
            <div key={record.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={record.record_name || 'Medical Record'}>
                    {record.record_name || 'Medical Record'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={record.record_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto' }} title="View">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </a>
                <button className="btn btn-danger" style={{ padding: '6px', minWidth: 'auto' }} onClick={() => handleDelete(record.id)} title="Delete">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsTab;
