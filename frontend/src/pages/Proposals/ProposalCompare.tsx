import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import CompatibilitySection from '../../components/AI/CompatibilitySection';
import { resolveStorageUrl } from '../../utils/storageUrl';

const ContactReveal = ({ baseId, otherId }: { baseId: number; otherId: number }) => {
  const [interestState, setInterestState] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const loadInterest = async () => {
    try {
      const res = await api.get(`/api/v1/proposals/${baseId}/${otherId}/interest`);
      setInterestState(res.data);
      if (res.data.mutual) {
        const contactRes = await api.get(`/api/v1/proposals/${baseId}/${otherId}/contact`);
        setContact(contactRes.data);
      } else {
        setContact(null);
      }
    } catch (err) {
      console.error('Error loading interest state', err);
    }
  };

  useEffect(() => {
    loadInterest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseId, otherId]);

  if (!interestState) return null;

  const smallerId = Math.min(baseId, otherId);
  const baseSide = baseId === smallerId ? 1 : 2;
  const otherSide = otherId === smallerId ? 1 : 2;
  const baseInterested = baseSide === 1 ? interestState.interest_1 : interestState.interest_2;
  const otherInterested = otherSide === 1 ? interestState.interest_1 : interestState.interest_2;

  const toggleInterest = async (interested: boolean) => {
    setBusy(true);
    try {
      await api.put(`/api/v1/proposals/${baseId}/${otherId}/interest`, { side: baseSide, interested });
      await loadInterest();
    } catch (err) {
      console.error('Error updating interest', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: '16px', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', background: 'var(--bg-hover)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={interestState.mutual ? '#34C759' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {interestState.mutual ? <path d="M17 11V7a5 5 0 0 0-10 0v4M5 11h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9z"></path> : <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4"></path>}
        </svg>
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Contact Details</span>
      </div>

      {interestState.mutual && contact?.revealed ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {contact.personal_number && <span>Personal: {contact.personal_number}</span>}
          {contact.father_number && <span>Father: {contact.father_number}</span>}
          {contact.mother_number && <span>Mother: {contact.mother_number}</span>}
          {contact.instagram_id && <span>Instagram: {contact.instagram_id}</span>}
        </div>
      ) : (
        <>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Locked until both sides confirm interest.
          </p>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', marginBottom: '8px' }}>
            <span style={{ color: baseInterested ? '#34C759' : 'var(--text-muted)' }}>This side: {baseInterested ? 'Interested' : 'Pending'}</span>
            <span style={{ color: otherInterested ? '#34C759' : 'var(--text-muted)' }}>Other side: {otherInterested ? 'Interested' : 'Pending'}</span>
          </div>
          <button
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            disabled={busy || baseInterested}
            onClick={() => toggleInterest(true)}
          >
            {baseInterested ? 'Marked Interested' : 'Mark Interested'}
          </button>
        </>
      )}
    </div>
  );
};

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
                  <img src={resolveStorageUrl(base.photos[0].photo_url)} alt={base.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      <img src={resolveStorageUrl(other.photos[0].photo_url)} alt={other.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Why this match</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: scoreColor }}>{score}%</span>
                  </div>

                  {matchData?.factors && matchData.factors.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {matchData.factors.map((factor: any) => {
                        const factorColor = factor.score >= 70 ? '#34C759' : factor.score >= 40 ? '#FF9500' : '#FF3B30';
                        return (
                          <div key={factor.key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{factor.label}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{factor.weight_pct}% weight · {factor.score}%</span>
                            </div>
                            <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden', marginBottom: '4px' }}>
                              <div style={{ height: '100%', width: `${factor.score}%`, background: factorColor, borderRadius: '999px' }}></div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{factor.explanation}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {matchData?.breakdown.map((item: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={scoreColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <ContactReveal baseId={base.id} otherId={other.id} />

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
