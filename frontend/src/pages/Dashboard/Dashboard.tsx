import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Proposal {
  id: number;
  name: string;
  status: string;
  created_at: string;
  age?: number;
  current_city?: string;
}

const Dashboard = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
    fetchProposals();
  }, []);

  const total = proposals.length;
  const inProgressCount = proposals.filter(p => p.status === 'IN_PROGRESS').length;
  const shortlisted = proposals.filter(p => p.status === 'SHORTLISTED').length;
  const inDiscussion = proposals.filter(p => ['DISCUSSION', 'PARENTS_MEET'].includes(p.status)).length;
  const finalized = proposals.filter(p => p.status === 'FINALIZED').length;

  if (loading) {
    return <div className="animate-in" style={{ padding: '40px', textAlign: 'center' }}><p>Loading Dashboard...</p></div>;
  }

  const recentProposals = [...proposals].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const greeting = new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="animate-in" style={{ paddingBottom: '60px' }}>
      
      {/* Dynamic Header */}
      <div style={{ 
        marginBottom: '40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(120deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
        padding: '24px 32px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(255, 107, 53, 0.1)'
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{greeting}, User.</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem' }}>Here is what's happening in your pipeline today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/vendor/proposals/add')} style={{ boxShadow: '0 8px 16px rgba(255, 107, 53, 0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Proposal
        </button>
      </div>
      
      {/* Modern KPI Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        
        {/* Total */}
        <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.05) 0%, rgba(255,107,53,0.1) 100%)', border: '1px solid rgba(255,107,53,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h5 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600 }}>Total Proposals</h5>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{total}</h3>
        </div>
        
        {/* Active Proposals */}
        <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(52,199,89,0.05) 0%, rgba(52,199,89,0.1) 100%)', border: '1px solid rgba(52,199,89,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h5 style={{ margin: 0, color: '#34C759', fontSize: '0.875rem', fontWeight: 600 }}>In Progress</h5>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(52,199,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34C759' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
          </div>
          <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#34C759' }}>{inProgressCount}</h3>
        </div>
        
        {/* In Discussion */}
        <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(255,149,0,0.05) 0%, rgba(255,149,0,0.1) 100%)', border: '1px solid rgba(255,149,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h5 style={{ margin: 0, color: '#FF9500', fontSize: '0.875rem', fontWeight: 600 }}>In Discussion</h5>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,149,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF9500' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
          </div>
          <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#FF9500' }}>{inDiscussion}</h3>
        </div>
        
        {/* Shortlisted */}
        <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(88,86,214,0.05) 0%, rgba(88,86,214,0.1) 100%)', border: '1px solid rgba(88,86,214,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h5 style={{ margin: 0, color: '#5856D6', fontSize: '0.875rem', fontWeight: 600 }}>Shortlisted</h5>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(88,86,214,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5856D6' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </div>
          </div>
          <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#5856D6' }}>{shortlisted}</h3>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        
        {/* Modern Sleek List */}
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Recently Added</h3>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.875rem', borderRadius: 'var(--radius-pill)' }} onClick={() => navigate('/vendor/proposals')}>View All</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentProposals.length > 0 ? (
              recentProposals.map((p, i) => (
                <div key={p.id} onClick={() => navigate(`/vendor/proposals/${p.id}`)} style={{ 
                  padding: '20px 24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderBottom: i !== recentProposals.length - 1 ? '1px solid var(--border-color)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>{p.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{p.current_city || 'Unknown Location'} • Added {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: 'var(--radius-pill)', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      backgroundColor: p.status === 'IN_PROGRESS' ? 'rgba(52,199,89,0.1)' : p.status === 'REJECTED' ? 'rgba(255,59,48,0.1)' : 'rgba(255,107,53,0.1)',
                      color: p.status === 'IN_PROGRESS' ? '#34C759' : p.status === 'REJECTED' ? '#FF3B30' : 'var(--accent-primary)'
                    }}>
                      {p.status.replace('_', ' ')}
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No proposals found.</div>
            )}
          </div>
        </div>

        {/* Smooth Donut Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, marginBottom: '32px', alignSelf: 'flex-start' }}>Pipeline Overview</h3>
          
          <div style={{ position: 'relative', width: '200px', height: '200px', marginBottom: '40px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', overflow: 'visible' }}>
              {total > 0 ? (
                <>
                  <circle cx="18" cy="18" r="16" fill="none" stroke="var(--bg-hover)" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#34C759" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(inProgressCount/total)*100} 100`} strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#5856D6" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(shortlisted/total)*100} 100`} strokeDashoffset={`-${(inProgressCount/total)*100}`} />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#FF9500" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(inDiscussion/total)*100} 100`} strokeDashoffset={`-${((inProgressCount+shortlisted)/total)*100}`} />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#007AFF" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(finalized/total)*100} 100`} strokeDashoffset={`-${((inProgressCount+shortlisted+inDiscussion)/total)*100}`} />
                </>
              ) : (
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border-color)" strokeWidth="4" strokeLinecap="round" />
              )}
            </svg>
            <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
            </div>
          </div>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'In Progress', count: inProgressCount, color: '#34C759' },
              { label: 'Shortlisted', count: shortlisted, color: '#5856D6' },
              { label: 'In Discussion', count: inDiscussion, color: '#FF9500' },
              { label: 'Finalized', count: finalized, color: '#007AFF' }
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-hover)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: stat.color }}></div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{stat.label}</span>
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
