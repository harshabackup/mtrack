import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import BirthChartSection from './BirthChartSection';
import PersonalitySection from './PersonalitySection';
import DoshaReportSection from './DoshaReportSection';
import CompatibilitySection from './CompatibilitySection';

interface IntelligenceDashboardProps {
  proposalId: number;
  proposal?: any;
  compareTarget?: { id: number; name?: string } | null;
}

type Tab = 'overview' | 'birth_chart' | 'personality' | 'dosha' | 'compat';

const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({ proposalId, proposal, compareTarget }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  
  // Lifted states
  const [personalityData, setPersonalityData] = useState<any>(null);
  const [doshaData, setDoshaData] = useState<any>(null);
  const [compatData, setCompatData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);

  const fetchAnalysis = async () => {
    try {
      const response = await api.get(`/api/v1/ai/proposals/${proposalId}/analysis`);
      setAnalysis(response.data);
      // Try to fetch chart data if possible silently
      api.get(`/api/v1/astrology/chart/${proposalId}`).then(res => setChartData(res.data.chart)).catch(() => {});
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch AI analysis:', error);
      }
    }
  };

  useEffect(() => {
    fetchAnalysis();
    setActiveTab('overview');
  }, [proposalId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      // Re-run all analyses in parallel
      const reqs: Promise<any>[] = [
        api.post(`/api/v1/ai/proposals/${proposalId}/analyze`).then(async () => {
           const a = await api.get(`/api/v1/ai/proposals/${proposalId}/analysis`);
           setAnalysis(a.data);
        }),
        api.post(`/api/v1/ai/proposals/${proposalId}/personality`).then(res => setPersonalityData(res.data.personality)),
        api.post(`/api/v1/ai/proposals/${proposalId}/dosha-report`).then(res => setDoshaData(res.data)),
        api.post(`/api/v1/astrology/calculate-chart`, { proposal_id: proposalId }).then(res => setChartData(res.data.chart))
      ];

      if (compareTarget) {
        reqs.push(
           api.post(`/api/v1/ai/proposals/compare-astrology?ids=${proposalId},${compareTarget.id}`)
              .then(res => setCompatData(res.data))
        );
      }

      await Promise.all(reqs);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || error.message || "Unknown error";
      alert("Failed to complete AI analysis: " + msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const tabs: Array<{ key: Tab; label: string; icon?: React.ReactNode }> = [
    { key: 'overview', label: 'Profile Analysis', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> },
    { key: 'birth_chart', label: 'Birth Chart', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> },
    { key: 'personality', label: 'Personality', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> },
    { key: 'dosha', label: 'Dosha Report', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> },
  ];

  if (compareTarget) {
    tabs.push({ key: 'compat', label: `Compatibility`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> });
  }

  return (
    <div className="card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '16px 24px', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #6C63FF 100%)', borderRadius: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(108, 99, 255, 0.4)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Deep AI Intelligence
          </h3>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
            Vedic Astrology • Kundali • Personality • Compatibility
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {compareTarget && (
            <button
              className="btn"
              onClick={() => setActiveTab('compat')}
              style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)' }}
            >
              Compare with {compareTarget.name ? compareTarget.name : 'Proposal #' + compareTarget.id}
            </button>
          )}
          <button
            className="btn"
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }}
          >
            {analyzing ? 'Analyzing Profile...' : (analysis ? 'Re-Run Profile Analysis' : 'Generate AI Insights')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0 24px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '999px',
              border: activeTab === tab.key ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              background: activeTab === tab.key ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ display: activeTab === 'birth_chart' ? 'block' : 'none' }}>
          <BirthChartSection
            proposalId={proposalId}
            dob={proposal?.dob}
            tob={proposal?.tob}
            pob={proposal?.pob}
            preloadedData={chartData}
          />
        </div>

        <div style={{ display: activeTab === 'personality' ? 'block' : 'none' }}>
          <PersonalitySection proposalId={proposalId} preloadedData={personalityData} isAnalyzing={analyzing} />
        </div>

        <div style={{ display: activeTab === 'dosha' ? 'block' : 'none' }}>
          <DoshaReportSection proposalId={proposalId} preloadedData={doshaData} isAnalyzing={analyzing} />
        </div>

        {compareTarget && (
          <div style={{ display: activeTab === 'compat' ? 'block' : 'none' }}>
            <CompatibilitySection
              proposalId1={proposalId}
              proposalId2={compareTarget.id}
              name1={proposal?.name}
              name2={compareTarget.name}
              preloadedData={compatData}
              isAnalyzing={analyzing}
            />
          </div>
        )}

        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {analysis ? (
              <>
                <div style={{ background: 'linear-gradient(to bottom right, var(--bg-card), var(--bg-hover))', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s ease' }} className="hover-lift">
                  <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    Bio Data Summary
                  </h4>
                  <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-primary)' }}>{analysis.bio_data_summary}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  <div style={{ background: 'linear-gradient(to bottom right, rgba(108, 99, 255, 0.05), rgba(108, 99, 255, 0.15))', padding: '24px', borderRadius: '16px', border: '1px solid rgba(108, 99, 255, 0.2)', transition: 'transform 0.2s ease' }} className="hover-lift">
                    <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#6C63FF', fontSize: '1.1rem' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
                      Astrology Summary
                    </h4>
                    <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-primary)' }}>{analysis.astrology_summary}</p>
                  </div>

                  <div style={{ background: 'linear-gradient(to bottom right, var(--bg-card), var(--bg-hover))', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success-color, #34C759)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                      Information Quality
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1, height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ width: `${analysis.information_quality_score}%`, height: '100%', background: analysis.information_quality_score > 75 ? 'linear-gradient(90deg, #34C759, #30D158)' : analysis.information_quality_score > 50 ? 'linear-gradient(90deg, #FF9500, #FF9F0A)' : 'linear-gradient(90deg, #FF3B30, #FF453A)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '1.5rem', color: analysis.information_quality_score > 75 ? '#34C759' : analysis.information_quality_score > 50 ? '#FF9500' : '#FF3B30' }}>{analysis.information_quality_score}%</span>
                    </div>
                    <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Score based on completeness of bio data and background details.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  <div style={{ background: 'linear-gradient(to bottom right, var(--bg-card), var(--bg-hover))', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      Missing Information
                    </h4>
                    {analysis.missing_information?.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                        {analysis.missing_information.map((item: string, i: number) => <li key={i} style={{ marginBottom: '6px' }}>{item}</li>)}
                      </ul>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>None found.</span>
                    )}
                  </div>

                  <div style={{ background: 'linear-gradient(to bottom right, rgba(255, 59, 48, 0.05), rgba(255, 59, 48, 0.1))', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 59, 48, 0.2)' }}>
                    <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-color, #FF3B30)', fontSize: '1.1rem' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      Potential Conflicts & Red Flags
                    </h4>
                    {analysis.potential_conflicts?.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--danger-color, #FF3B30)' }}>
                        {analysis.potential_conflicts.map((item: string, i: number) => <li key={i} style={{ marginBottom: '6px' }}>{item}</li>)}
                      </ul>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>None detected.</span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(to bottom right, var(--bg-card), var(--bg-hover))', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s ease' }} className="hover-lift">
                  <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Suggested Discussion Topics
                  </h4>
                  {analysis.discussion_topics?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '24px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {analysis.discussion_topics.map((item: string, i: number) => (
                        <li key={i} style={{ marginBottom: '12px' }}>
                          <span style={{ fontWeight: 500 }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>No topics generated.</span>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'linear-gradient(to bottom right, var(--bg-card), var(--bg-hover))', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 24px auto', borderRadius: '50%', background: 'rgba(108, 99, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>No AI insights generated yet.</h4>
                <p style={{ margin: '0', fontSize: '1rem' }}>Click "Generate AI Insights" above to analyze this proposal's entire profile.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceDashboard;