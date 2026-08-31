import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Stats {
  total_proposals: number;
  total_users: number;
  pending_invites: number;
  proposals_by_status: Record<string, number>;
  recent_proposals: Array<{
    id: number;
    name: string;
    status: string;
    created_at: string;
    current_city: string;
  }>;
  recent_users: Array<{
    id: number;
    email: string;
    full_name: string;
    role: string;
  }>;
}

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  IN_PROGRESS: { bg: '#fef3c7', color: '#92400e', label: 'In Progress' },
  ACTIVE:      { bg: '#d1fae5', color: '#065f46', label: 'Active' },
  MATCHED:     { bg: '#dbeafe', color: '#1e40af', label: 'Matched' },
  CLOSED:      { bg: '#f3f4f6', color: '#374151', label: 'Closed' },
  REJECTED:    { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [proposalsRes, usersRes] = await Promise.all([
        api.get('/api/v1/proposals'),
        api.get('/api/v1/auth/users'),
      ]);

      const proposals: any[] = proposalsRes.data.proposals || proposalsRes.data || [];
      const users: any[] = usersRes.data || [];

      const byStatus: Record<string, number> = {};
      proposals.forEach((p: any) => {
        byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      });

      const pendingInvites = users.filter((u: any) => !u.profile_completed && u.invitation_token).length;

      setStats({
        total_proposals: proposals.length,
        total_users: users.length,
        pending_invites: pendingInvites,
        proposals_by_status: byStatus,
        recent_proposals: proposals.slice(0, 5),
        recent_users: users.slice(0, 5),
      });
    } catch (err) {
      setError('Failed to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '12px', color: '#6b7280' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: '24px', color: '#dc2626', background: '#fee2e2', borderRadius: '8px', margin: '24px' }}>{error}</div>;
  }

  const statCards = [
    {
      label: 'Total Proposals',
      value: stats?.total_proposals ?? 0,
      icon: '📋',
      color: '#3b82f6',
      bg: '#eff6ff',
    },
    {
      label: 'Total Users',
      value: stats?.total_users ?? 0,
      icon: '👥',
      color: '#10b981',
      bg: '#f0fdf4',
    },
    {
      label: 'Pending Invites',
      value: stats?.pending_invites ?? 0,
      icon: '✉️',
      color: '#f59e0b',
      bg: '#fffbeb',
    },
    {
      label: 'Active Proposals',
      value: stats?.proposals_by_status['ACTIVE'] ?? 0,
      icon: '✅',
      color: '#8b5cf6',
      bg: '#f5f3ff',
    },
  ];

  return (
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>Admin Dashboard</h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '14px' }}>Platform overview at a glance</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {statCards.map((card) => (
          <div key={card.label} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderLeft: `4px solid ${card.color}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{card.label}</span>
              <div style={{ background: card.bg, borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Status Breakdown + Recent Users */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Proposals by Status */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#111827' }}>Proposals by Status</h3>
          {Object.keys(statusColors).map((status) => {
            const count = stats?.proposals_by_status[status] ?? 0;
            const total = stats?.total_proposals || 1;
            const pct = Math.round((count / total) * 100);
            const s = statusColors[status];
            return (
              <div key={status} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{s.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{count}</span>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ background: s.color === '#92400e' ? '#f59e0b' : s.color, width: `${pct}%`, height: '100%', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Users */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>Recent Users</h3>
            <a href="/admin/users" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>View all →</a>
          </div>
          {stats?.recent_users.map((u) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: u.role === 'ADMIN' ? '#dbeafe' : '#f3f4f6',
                color: u.role === 'ADMIN' ? '#1e40af' : '#374151',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '14px', flexShrink: 0
              }}>
                {(u.full_name || u.email).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name || '—'}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                background: u.role === 'ADMIN' ? '#dbeafe' : '#f3f4f6',
                color: u.role === 'ADMIN' ? '#1e40af' : '#6b7280',
                fontWeight: 500
              }}>{u.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Proposals */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>Recent Proposals</h3>
          <a href="/vendor/proposals" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>View all →</a>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Name', 'City', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats?.recent_proposals.map((p) => {
              const s = statusColors[p.status] || { bg: '#f3f4f6', color: '#374151', label: p.status };
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{p.name}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>{p.current_city || '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600 }}>{s.label}</span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              );
            })}
            {!stats?.recent_proposals.length && (
              <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No proposals yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
