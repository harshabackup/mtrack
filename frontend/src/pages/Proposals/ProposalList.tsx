import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

interface Proposal {
  id: number;
  name: string;
  age: number | null;
  current_city: string | null;
  status: string;
  job_title: string | null;
  caste: string | null;
  photos: { id: number; photo_url: string }[];
}

const raasiOptions = ["Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischika (Scorpio)", "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"];
const nakshatraOptions = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

const ProposalList = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Filter States
  const [searchName, setSearchName] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchJob, setSearchJob] = useState('');
  const [status, setStatus] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [rasi, setRasi] = useState('');
  const [nakshatra, setNakshatra] = useState('');
  const [isWorking, setIsWorking] = useState('');

  const fetchProposals = async () => {
    setLoading(true);
    try {
      let min_age = undefined;
      let max_age = undefined;
      if (ageRange) {
        const parts = ageRange.split('-');
        if (parts.length === 2) {
          min_age = parseInt(parts[0]);
          max_age = parseInt(parts[1]);
        }
      }

      const response = await api.get('/api/v1/proposals', {
        params: {
          name: searchName || undefined,
          city: searchCity || undefined,
          job_title: searchJob || undefined,
          status: status || undefined,
          min_age,
          max_age,
          rasi: rasi || undefined,
          nakshatra: nakshatra || undefined,
          is_working: isWorking === 'true' ? true : isWorking === 'false' ? false : undefined
        }
      });
      setProposals(response.data);
    } catch (error) {
      console.error("Error fetching proposals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [status, ageRange, rasi, nakshatra, isWorking]); // Re-fetch when dropdowns change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProposals();
  };

  const clearFilters = () => {
    setSearchName('');
    setSearchCity('');
    setSearchJob('');
    setStatus('');
    setAgeRange('');
    setRasi('');
    setNakshatra('');
    setIsWorking('');
    setTimeout(fetchProposals, 0);
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'IN_PROGRESS': return '#FF9500'; // orange
      case 'CONTACTED': return '#007AFF'; // blue
      case 'SHORTLISTED': return '#5856D6'; // purple
      case 'PARENTS_MEET': return '#FF2D55'; // pink
      case 'FINALIZED': return '#34C759'; // green
      case 'REJECTED': return '#FF3B30'; // red
      default: return '#8E8E93';
    }
  };

  return (
    <div className="animate-in" style={{ paddingBottom: '60px' }}>
      
      {/* Dynamic Header */}
      <div style={{ 
        marginBottom: '16px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Proposals Directory</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Smart search and advanced filtering.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {selectedIds.length > 1 && (
            <button 
              className="btn btn-primary" 
              style={{ padding: '8px 16px', background: 'var(--accent-secondary)' }}
              onClick={() => window.location.href = `/vendor/proposals/compare?ids=${selectedIds.join(',')}`}
            >
              Compare {selectedIds.length} Profiles
            </button>
          )}
          <Link to="/vendor/proposals/add" className="btn btn-primary" style={{ padding: '8px 16px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Proposal
          </Link>
        </div>
      </div>

      {/* Sleek Command Bar (Filters) */}
      <div className="card" style={{ marginBottom: '24px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Top Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="topbar-search" style={{ flex: 1, position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search by name..." value={searchName} onChange={(e) => setSearchName(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 'var(--radius-pill)', border: '1px solid transparent', backgroundColor: 'var(--bg-hover)', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.3s' }} 
              onFocus={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-light), 0 4px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onBlur={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
            />
          </div>
          <div className="topbar-search" style={{ flex: 1, position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <input type="text" placeholder="Search by city..." value={searchCity} onChange={(e) => setSearchCity(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 'var(--radius-pill)', border: '1px solid transparent', backgroundColor: 'var(--bg-hover)', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.3s' }} 
              onFocus={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-light), 0 4px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onBlur={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
            />
          </div>
          <div className="topbar-search" style={{ flex: 1, position: 'relative' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            <input type="text" placeholder="Search by profession..." value={searchJob} onChange={(e) => setSearchJob(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 'var(--radius-pill)', border: '1px solid transparent', backgroundColor: 'var(--bg-hover)', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.3s' }} 
              onFocus={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-light), 0 4px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onBlur={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>Search</button>
        </form>

        {/* Bottom Filter Pills */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          <select style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', appearance: 'none' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Status: Any</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CONTACTED">Contacted</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="PARENTS_MEET">Parents Meet</option>
            <option value="FINALIZED">Finalized</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', appearance: 'none' }} value={ageRange} onChange={e => setAgeRange(e.target.value)}>
            <option value="">Age: Any</option>
            <option value="20-25">20 - 25 yrs</option>
            <option value="26-30">26 - 30 yrs</option>
            <option value="31-35">31 - 35 yrs</option>
            <option value="36-40">36 - 40 yrs</option>
            <option value="41-99">41+ yrs</option>
          </select>

          <select style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', appearance: 'none' }} value={rasi} onChange={e => setRasi(e.target.value)}>
            <option value="">Raasi: Any</option>
            {raasiOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', appearance: 'none' }} value={nakshatra} onChange={e => setNakshatra(e.target.value)}>
            <option value="">Nakshatra: Any</option>
            {nakshatraOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <select style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', appearance: 'none' }} value={isWorking} onChange={e => setIsWorking(e.target.value)}>
            <option value="">Employment: Any</option>
            <option value="true">Working</option>
            <option value="false">Not Working</option>
          </select>

          <button type="button" onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, padding: '8px 12px', marginLeft: 'auto' }}>
            Clear Filters
          </button>
        </div>
      </div>
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem' }}>No proposals found</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Try adjusting your filters or search terms.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="data-table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)' }}>
                <th style={{ padding: '14px 20px', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(proposals.map(p => p.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    checked={proposals.length > 0 && selectedIds.length === proposals.length}
                  />
                </th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Background</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'} onClick={() => { window.location.href = `/vendor/proposals/${p.id}` }}>
                  <td style={{ padding: '12px 20px' }} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(prev => [...prev, p.id]);
                        } else {
                          setSelectedIds(prev => prev.filter(id => id !== p.id));
                        }
                      }}
                    />
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', background: p.photos && p.photos.length > 0 ? '#000' : 'var(--bg-hover)', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.photos && p.photos.length > 0 ? (
                           <img src={p.photos[0].photo_url.startsWith('http') ? p.photos[0].photo_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}${p.photos[0].photo_url}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                           <div style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 800 }}>
                             {p.name.charAt(0)}
                           </div>
                        )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{p.name}</div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.age && <span><span style={{color: 'var(--text-muted)'}}>Age:</span> {p.age}</span>}
                      {p.age && p.current_city && <span style={{color: 'var(--border-color)'}}>|</span>}
                      {p.current_city && <span><span style={{color: 'var(--text-muted)'}}>City:</span> {p.current_city}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.job_title && <span>{p.job_title}</span>}
                      {p.job_title && p.caste && <span style={{color: 'var(--border-color)'}}>|</span>}
                      {p.caste && <span>{p.caste}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255, 107, 53, 0.05)',
                      border: `1px solid ${getStatusColor(p.status)}40`,
                      color: getStatusColor(p.status), 
                      padding: '4px 10px', 
                      borderRadius: 'var(--radius-pill)', 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      letterSpacing: '0.02em'
                    }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getStatusColor(p.status) }}></div>
                      {p.status.replace('_', ' ')}
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                    <Link to={`/vendor/proposals/${p.id}`} className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '0.8rem', fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>View Profile</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
};

export default ProposalList;
