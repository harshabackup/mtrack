import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Proposal {
  id: number;
  name: string;
  status: string;
  created_at: string;
  age?: number;
  current_city?: string;
}

interface UserItem {
  id: number;
  email: string;
  full_name: string;
  role: string;
  profile_completed?: boolean;
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  IN_PROGRESS:  { bg: 'rgba(255, 149, 0, 0.1)', color: '#FF9500', label: 'In Progress' },
  CONTACTED:    { bg: 'rgba(0, 122, 255, 0.1)', color: '#007AFF', label: 'Contacted' },
  SHORTLISTED:  { bg: 'rgba(88, 86, 214, 0.1)', color: '#5856D6', label: 'Shortlisted' },
  PARENTS_MEET: { bg: 'rgba(255, 45, 85, 0.1)', color: '#FF2D55', label: 'Parents Meet' },
  FINALIZED:    { bg: 'rgba(52, 199, 89, 0.1)', color: '#34C759', label: 'Finalized' },
  REJECTED:     { bg: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', label: 'Rejected' },
};

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pendingInvites, setPendingInvites] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises: Promise<any>[] = [api.get('/api/v1/proposals')];
        if (isAdmin) {
          promises.push(api.get('/api/v1/auth/users'));
        }

        const results = await Promise.all(promises);
        const proposalsData = results[0]?.data;
        const fetchedProposals: Proposal[] = Array.isArray(proposalsData) 
          ? proposalsData 
          : proposalsData?.proposals || [];
        setProposals(fetchedProposals);

        if (isAdmin && results[1]?.data) {
          const userList: UserItem[] = results[1].data;
          setUsers(userList);
          const pending = userList.filter((u: any) => !u.profile_completed && u.invitation_token).length;
          setPendingInvites(pending);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const total = proposals.length;
  const inProgressCount = proposals.filter(p => p.status === 'IN_PROGRESS').length;
  const contactedCount = proposals.filter(p => p.status === 'CONTACTED').length;
  const shortlisted = proposals.filter(p => p.status === 'SHORTLISTED').length;
  const parentsMeetCount = proposals.filter(p => p.status === 'PARENTS_MEET').length;
  const finalized = proposals.filter(p => p.status === 'FINALIZED').length;
  const rejectedCount = proposals.filter(p => p.status === 'REJECTED').length;

  if (loading) {
    return (
      <div className="animate-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  const recentProposals = [...proposals]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentUsers = [...users].slice(0, 5);

  const greeting = new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening";
  const displayName = user?.full_name?.trim() || (user?.email ? user.email.split('@')[0] : 'User');

  return (
    <div className="animate-in" style={{ paddingBottom: '60px' }}>
      
      {/* Dynamic Header */}
      <div style={{ 
        marginBottom: '32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(120deg, rgba(255, 107, 53, 0.06) 0%, rgba(255, 255, 255, 0) 100%)',
        padding: '24px 32px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(255, 107, 53, 0.12)'
      }}>
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            {greeting}, {displayName}.
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {isAdmin 
              ? 'Here is your platform and proposal overview at a glance.' 
              : "Here is what's happening in your pipeline today."}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isAdmin && (
            <button 
              className="btn btn-outline" 
              onClick={() => navigate('/admin/users')}
              style={{ padding: '10px 18px', fontSize: '0.875rem' }}
            >
              Manage Users
            </button>
          )}
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/vendor/proposals/add')} 
            style={{ boxShadow: '0 8px 16px rgba(255, 107, 53, 0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Proposal
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: isAdmin ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        {/* Total Proposals */}
        <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.05) 0%, rgba(255,107,53,0.1) 100%)', border: '1px solid rgba(255,107,53,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h5 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Proposals</h5>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <h3 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{total}</h3>
        </div>

        {isAdmin ? (
          <>
            {/* Total Users */}
            <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0.1) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h5 style={{ margin: 0, color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>Total Users</h5>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                </div>
              </div>
              <h3 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: '#10b981' }}>{users.length}</h3>
            </div>

            {/* Pending Invites */}
            <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(245,158,11,0.1) 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h5 style={{ margin: 0, color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>Pending Invites</h5>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
              </div>
              <h3 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: '#f59e0b' }}>{pendingInvites}</h3>
            </div>

            {/* In Progress Proposals */}
            <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(52,199,89,0.05) 0%, rgba(52,199,89,0.1) 100%)', border: '1px solid rgba(52,199,89,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h5 style={{ margin: 0, color: '#34C759', fontSize: '0.85rem', fontWeight: 600 }}>In Progress</h5>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(52,199,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34C759' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
              </div>
              <h3 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: '#34C759' }}>{inProgressCount}</h3>
            </div>
          </>
        ) : (
          <>
            {/* In Progress */}
            <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(52,199,89,0.05) 0%, rgba(52,199,89,0.1) 100%)', border: '1px solid rgba(52,199,89,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h5 style={{ margin: 0, color: '#34C759', fontSize: '0.85rem', fontWeight: 600 }}>In Progress</h5>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(52,199,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34C759' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
              </div>
              <h3 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: '#34C759' }}>{inProgressCount}</h3>
            </div>

            {/* Shortlisted */}
            <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(88,86,214,0.05) 0%, rgba(88,86,214,0.1) 100%)', border: '1px solid rgba(88,86,214,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h5 style={{ margin: 0, color: '#5856D6', fontSize: '0.85rem', fontWeight: 600 }}>Shortlisted</h5>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(88,86,214,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5856D6' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
              </div>
              <h3 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: '#5856D6' }}>{shortlisted}</h3>
            </div>

            {/* Finalized */}
            <div className="card kpi-card" style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.05) 0%, rgba(0,122,255,0.1) 100%)', border: '1px solid rgba(0,122,255,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h5 style={{ margin: 0, color: '#007AFF', fontSize: '0.85rem', fontWeight: 600 }}>Finalized</h5>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,122,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
              </div>
              <h3 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: '#007AFF' }}>{finalized}</h3>
            </div>
          </>
        )}
      </div>

      {/* Main Grid: Recently Added Proposals + Pipeline Overview Donut */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '32px' }}>
        
        {/* Recently Added Proposals */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recently Added Proposals</h3>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: 'var(--radius-pill)' }} onClick={() => navigate('/vendor/proposals')}>
              View All →
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentProposals.length > 0 ? (
              recentProposals.map((p, i) => {
                const s = statusColors[p.status] || { bg: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)', label: p.status.replace('_', ' ') };
                return (
                  <div 
                    key={p.id} 
                    onClick={() => navigate(`/vendor/proposals/${p.id}`)} 
                    style={{ 
                      padding: '16px 24px', 
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '50%', 
                        background: 'var(--accent-bg)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '1.1rem', 
                        fontWeight: 700, 
                        color: 'var(--accent-primary)' 
                      }}>
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 3px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          {p.current_city || 'Unknown Location'} • Added {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: 'var(--radius-pill)', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: s.bg,
                        color: s.color
                      }}>
                        {s.label}
                      </span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No proposals found.</div>
            )}
          </div>
        </div>

        {/* Pipeline Overview Donut Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px' }}>
          <h3 style={{ margin: '0 0 24px', fontSize: '1.15rem', fontWeight: 700, alignSelf: 'flex-start', color: 'var(--text-primary)' }}>Pipeline Overview</h3>
          
          <div style={{ position: 'relative', width: '180px', height: '180px', marginBottom: '24px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', overflow: 'visible' }}>
              {total > 0 ? (
                <>
                  <circle cx="18" cy="18" r="16" fill="none" stroke="var(--bg-hover)" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#FF9500" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(inProgressCount/total)*100} 100`} strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#007AFF" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(contactedCount/total)*100} 100`} strokeDashoffset={`-${(inProgressCount/total)*100}`} />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#5856D6" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(shortlisted/total)*100} 100`} strokeDashoffset={`-${((inProgressCount+contactedCount)/total)*100}`} />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#FF2D55" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(parentsMeetCount/total)*100} 100`} strokeDashoffset={`-${((inProgressCount+contactedCount+shortlisted)/total)*100}`} />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#34C759" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(finalized/total)*100} 100`} strokeDashoffset={`-${((inProgressCount+contactedCount+shortlisted+parentsMeetCount)/total)*100}`} />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(rejectedCount/total)*100} 100`} strokeDashoffset={`-${((inProgressCount+contactedCount+shortlisted+parentsMeetCount+finalized)/total)*100}`} />
                </>
              ) : (
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border-color)" strokeWidth="4" strokeLinecap="round" />
              )}
            </svg>
            <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
            </div>
          </div>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'In Progress', count: inProgressCount, color: '#FF9500' },
              { label: 'Contacted', count: contactedCount, color: '#007AFF' },
              { label: 'Shortlisted', count: shortlisted, color: '#5856D6' },
              { label: 'Parents Meet', count: parentsMeetCount, color: '#FF2D55' },
              { label: 'Finalized', count: finalized, color: '#34C759' },
              { label: 'Rejected', count: rejectedCount, color: '#FF3B30' }
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-hover)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stat.color }}></div>
                  <span style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{stat.label}</span>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Section: Recent Users & User Management Link */}
      {isAdmin && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Platform Users</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>{users.length} total users registered</p>
            </div>
            <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: 'var(--radius-pill)' }} onClick={() => navigate('/admin/users')}>
              Manage All Users →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentUsers.length > 0 ? (
              recentUsers.map((u, i) => (
                <div 
                  key={u.id}
                  style={{ 
                    padding: '14px 24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderBottom: i !== recentUsers.length - 1 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: u.role === 'ADMIN' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-hover)',
                      color: u.role === 'ADMIN' ? '#2563eb' : 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '13px', flexShrink: 0
                    }}>
                      {(u.full_name || u.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {u.full_name || '—'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {u.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                      background: u.role === 'ADMIN' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-hover)',
                      color: u.role === 'ADMIN' ? '#2563eb' : 'var(--text-secondary)',
                      fontWeight: 600
                    }}>
                      {u.role}
                    </span>
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-pill)',
                      background: u.profile_completed ? 'rgba(52, 199, 89, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: u.profile_completed ? '#15803d' : '#b45309',
                      fontWeight: 600
                    }}>
                      {u.profile_completed ? 'Active' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
