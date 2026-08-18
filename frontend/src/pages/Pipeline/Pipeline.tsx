import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface Proposal {
  id: number;
  name: string;
  status: string;
  age?: number;
  current_city?: string;
  job_title?: string;
  photos?: { id: number; photo_url: string }[];
}

const COLUMNS = [
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#FF9500' },
  { id: 'CONTACTED', title: 'Contacted', color: '#007AFF' },
  { id: 'SHORTLISTED', title: 'Shortlisted', color: '#5856D6' },
  { id: 'PARENTS_MEET', title: 'Parents Meet', color: '#FF2D55' },
  { id: 'FINALIZED', title: 'Finalized', color: '#34C759' },
  { id: 'REJECTED', title: 'Rejected', color: '#FF3B30' }
];

const Pipeline = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchProposals = async () => {
    try {
      const response = await api.get('/api/v1/proposals');
      setProposals(response.data);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleDragStart = (e: React.DragEvent, proposalId: number) => {
    e.dataTransfer.setData('proposalId', proposalId.toString());
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const proposalIdStr = e.dataTransfer.getData('proposalId');
    if (!proposalIdStr) return;
    const proposalId = parseInt(proposalIdStr);

    // Optimistic UI update
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: targetStatus } : p));

    try {
      // Backend update
      await api.put(`/api/v1/proposals/${proposalId}`, { status: targetStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert if failed
      fetchProposals();
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Pipeline...</div>;

  return (
    <div className="animate-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '24px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 className="page-title">Pipeline Board</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Drag and drop proposals to update their status.</p>
        </div>
        <div>
          <input 
            type="text" 
            placeholder="Search proposals..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '10px 16px', 
              borderRadius: 'var(--radius-pill)', 
              border: '1px solid var(--border-color)', 
              outline: 'none',
              width: '250px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flex: 1, paddingBottom: '8px' }}>
        {COLUMNS.map(col => {
          const colProposals = proposals.filter(p => p.status === col.id && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
          return (
            <div 
              key={col.id} 
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{ 
                flex: 1,
                minWidth: 0,
                background: dragOverCol === col.id ? 'var(--bg-hover)' : 'var(--bg-card)', 
                borderRadius: 'var(--radius-lg)', 
                border: `2px dashed ${dragOverCol === col.id ? col.color : 'transparent'}`,
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                boxShadow: dragOverCol === col.id ? 'none' : 'var(--shadow-sm)',
                transition: 'all 0.2s'
              }}
            >
              {/* Column Header */}
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }}></div>
                  {col.title}
                </h4>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'var(--border-color)', padding: '2px 8px', borderRadius: '10px' }}>
                  {colProposals.length}
                </span>
              </div>

              {/* Cards Container */}
              <div style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {colProposals.map(p => (
                  <div 
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onClick={() => navigate(`/vendor/proposals/${p.id}`)}
                    style={{ 
                      background: 'var(--bg-body)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: '16px',
                      cursor: 'grab',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      position: 'relative',
                    }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.transform = 'translateY(-2px)'; 
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)'; 
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.transform = 'translateY(0)'; 
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; 
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                        background: 'linear-gradient(135deg, #FF9A70 0%, #FF6B35 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '1rem'
                      }}>
                        {p.photos && p.photos.length > 0 ? (
                           <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}${p.photos[0].photo_url}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                           p.name.charAt(0)
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'normal' }}>
                          {p.name}
                        </h5>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                          {p.age && <span>{p.age} yrs</span>}
                          {p.age && p.current_city && <span>•</span>}
                          {p.current_city && <span>{p.current_city}</span>}
                        </div>
                      </div>
                    </div>
                    
                    {p.job_title && (
                      <div style={{ display: 'inline-block', background: 'var(--accent-light)', color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                        {p.job_title}
                      </div>
                    )}
                  </div>
                ))}
                
                {col.id === 'IN_PROGRESS' && (
                  <button onClick={() => navigate('/vendor/proposals/add')} style={{ background: 'transparent', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    + Add New Proposal
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default Pipeline;
