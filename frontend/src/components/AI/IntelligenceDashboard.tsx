import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import BirthChartSection from './BirthChartSection';
import CompatibilitySection from './CompatibilitySection';

interface IntelligenceDashboardProps {
  proposalId: number;
  proposal?: any;
  compareTarget?: { id: number; name?: string } | null;
}

type Tab = 'birth_chart' | 'compat';

const IntelligenceDashboard: React.FC<IntelligenceDashboardProps> = ({ proposalId, proposal, compareTarget }) => {
  const [activeTab, setActiveTab] = useState<Tab>('birth_chart');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  
  // Lifted states
  const [compatData, setCompatData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [navamsaData, setNavamsaData] = useState<any>(null);
  const [dashaData, setDashaData] = useState<any>(null);

  const fetchAnalysis = async () => {
    try {
      const response = await api.get(`/api/v1/ai/proposals/${proposalId}/analysis`);
      setAnalysis(response.data);
      // Try to fetch chart data if possible silently
      api.get(`/api/v1/astrology/chart/${proposalId}`).then(res => setChartData(res.data.chart)).catch(() => {});
      api.get(`/api/v1/astrology/navamsa/${proposalId}`).then(res => setNavamsaData(res.data.navamsa)).catch(() => {});
      api.get(`/api/v1/astrology/dasha/${proposalId}`).then(res => setDashaData(res.data.dasha)).catch(() => {});
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch AI analysis:', error);
      }
    }
  };

  useEffect(() => {
    fetchAnalysis();
    setActiveTab('birth_chart');
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
        api.post(`/api/v1/astrology/calculate-chart`, { proposal_id: proposalId }).then(res => setChartData(res.data.chart)),
        api.get(`/api/v1/astrology/navamsa/${proposalId}`).then(res => setNavamsaData(res.data.navamsa)),
        api.get(`/api/v1/astrology/dasha/${proposalId}`).then(res => setDashaData(res.data.dasha))
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
    { key: 'birth_chart', label: 'Birth Chart', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> },
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
            {analyzing ? 'Calculating Chart...' : 'Calculate Birth Chart'}
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
            navamsaData={navamsaData}
            dashaData={dashaData}
          />
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
      </div>
    </div>
  );
};

export default IntelligenceDashboard;