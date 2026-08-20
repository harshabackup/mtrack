import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import CompatibilitySection from '../../components/AI/CompatibilitySection';

const ProposalCompare = () => {
  const [searchParams] = useSearchParams();
  const ids = searchParams.get('ids');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!ids) {
      setLoading(false);
      return;
    }
    const fetchCompare = async () => {
      try {
        const response = await api.get(`/api/v1/proposals/compare?ids=${ids}`);
        setData(response.data);
        
        // Fetch AI Explanation asynchronously so it doesn't block UI load
        setLoadingAi(true);
        try {
          const aiRes = await api.get(`/api/v1/ai/proposals/compare-ai?ids=${ids}`);
          setAiExplanation(aiRes.data.ai_explanation);
        } catch (aiErr) {
          console.error("Error fetching AI comparison", aiErr);
          setAiExplanation("AI analysis unavailable at this time.");
        } finally {
          setLoadingAi(false);
        }
      } catch (error) {
        console.error("Error fetching comparison", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompare();
  }, [ids]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!data || !data.proposals || data.proposals.length < 2) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem' }}>Unable to compare</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Please select at least two valid proposals to compare.</p>
        <Link to="/vendor/proposals" className="btn btn-primary" style={{ marginTop: '16px' }}>Back to Directory</Link>
      </div>
    );
  }

  const { proposals, compatibility } = data;
  const base = proposals[0];
  const others = proposals.slice(1);

  return (
    <div className="animate-in" style={{ paddingBottom: '60px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Comparison Engine</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Comparing {proposals.length - 1} profiles against {base.name}</p>
        </div>
        <Link to="/vendor/proposals" className="btn btn-outline" style={{ padding: '8px 16px' }}>
          Back to Directory
        </Link>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '32px', background: 'var(--bg-hover)' }}>
        <h3 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          AI Matchmaker Summary
        </h3>
        {loadingAi ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            Analyzing compatibility factors...
          </div>
        ) : (
          <p style={{ margin: 0, lineHeight: 1.6 }}>{aiExplanation}</p>
        )}
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '24px', minWidth: 'min-content' }}>
          
          {/* Base Profile Column */}
          <div className="card" style={{ width: '350px', flexShrink: 0, border: '2px solid var(--accent-primary)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-primary)', color: 'white', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Base Profile
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '12px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-hover)', margin: '0 auto 12px auto', overflow: 'hidden' }}>
                {base.photos && base.photos.length > 0 ? (
                  <img src={base.photos[0].photo_url.startsWith('http') ? base.photos[0].photo_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}${base.photos[0].photo_url}`} alt={base.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{base.name.charAt(0)}</div>
                )}
              </div>
              <h3 style={{ margin: '0 0 4px 0' }}>{base.name}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{base.age ? `${base.age} yrs` : 'N/A'} • {base.current_city || 'N/A'}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Education & Career</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '4px' }}>{base.education || 'N/A'}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{base.job_title || 'N/A'}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{base.is_working ? 'Working' : 'Not Working'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Background</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '4px' }}>{base.caste || 'N/A'}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{base.mother_tongue || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Astrology</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '4px' }}>Rasi: {base.rasi || 'N/A'}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nakshatra: {base.nakshatra || 'N/A'}</div>
              </div>
            </div>
            
            <div style={{ marginTop: '24px' }}>
               <Link to={`/vendor/proposals/${base.id}`} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>View Full Profile</Link>
            </div>
          </div>

          {/* Compared Profiles */}
          {others.map((other: any) => {
            const matchData = compatibility.find((c: any) => c.proposal_id === other.id);
            const score = matchData ? matchData.overall_score : 0;
            const scoreColor = score >= 70 ? '#34C759' : score >= 40 ? '#FF9500' : '#FF3B30';

            return (
              <div key={other.id} className="card" style={{ width: '350px', flexShrink: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-hover)', margin: '0 auto 12px auto', overflow: 'hidden' }}>
                    {other.photos && other.photos.length > 0 ? (
                      <img src={other.photos[0].photo_url.startsWith('http') ? other.photos[0].photo_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}${other.photos[0].photo_url}`} alt={other.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--text-muted)' }}>{other.name.charAt(0)}</div>
                    )}
                  </div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{other.name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{other.age ? `${other.age} yrs` : 'N/A'} • {other.current_city || 'N/A'}</p>
                </div>

                {/* Compatibility Matrix Score */}
                <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px', border: `1px solid ${scoreColor}40` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Compatibility</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: scoreColor }}>{score}%</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {matchData?.breakdown.map((item: string, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={scoreColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Education & Career</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '4px' }}>{other.education || 'N/A'}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{other.job_title || 'N/A'}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{other.is_working ? 'Working' : 'Not Working'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Background</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '4px' }}>{other.caste || 'N/A'}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{other.mother_tongue || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Astrology</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500, marginTop: '4px' }}>Rasi: {other.rasi || 'N/A'}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nakshatra: {other.nakshatra || 'N/A'}</div>
                  </div>
                </div>
                
                <div style={{ marginTop: '24px' }}>
                   <Link to={`/vendor/proposals/${other.id}`} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>View Full Profile</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <CompatibilitySection
          proposalId1={base.id}
          proposalId2={others[0].id}
          name1={base.name}
          name2={others[0].name}
        />
      </div>
    </div>
  );
};

export default ProposalCompare;
