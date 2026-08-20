import React, { useState } from 'react';

interface CompatibilityReportData {
  guna_scores: Record<string, number>;
  total_score: number;
  max_score: number;
  verdict: string;
  critical_doshas: string[];
  strengths: string[];
  concerns: string[];
  ai_recommendation: string;
}

interface AshtakootaData {
  scores: Record<string, number>;
  total: number;
  maximum: number;
  verdict: string;
  doshas: { nadi_dosha: boolean; bhakoot_dosha: boolean };
  details: Record<string, string>;
}

interface CompatibilitySectionProps {
  proposalId1: number;
  proposalId2: number;
  name1?: string;
  name2?: string;
  preloadedData?: any;
  isAnalyzing?: boolean;
}

const kootaMeta: Record<string, { label: string; max: number; desc: string }> = {
  varna: { label: 'Varna', max: 1, desc: 'Spiritual compatibility' },
  vashya: { label: 'Vashya', max: 2, desc: 'Mutual attraction & control' },
  tara: { label: 'Tara', max: 3, desc: 'Health & wellbeing' },
  yoni: { label: 'Yoni', max: 4, desc: 'Physical compatibility' },
  graha_maitri: { label: 'Graha Maitri', max: 5, desc: 'Mental compatibility' },
  gana: { label: 'Gana', max: 6, desc: 'Temperament' },
  bhakoot: { label: 'Bhakoot', max: 7, desc: 'Love & family harmony' },
  nadi: { label: 'Nadi', max: 8, desc: 'Progeny & health' },
};

const verdictColors: Record<string, string> = {
  'Excellent': '#34C759',
  'Good': '#30D158',
  'Average': '#FF9500',
  'Below Average': '#FF3B30',
  'Poor': '#FF3B30',
};

const CompatibilitySection: React.FC<CompatibilitySectionProps> = ({ preloadedData, isAnalyzing }) => {
  const [ashtakoota, setAshtakoota] = useState<AshtakootaData | null>(null);
  const [report, setReport] = useState<CompatibilityReportData | null>(null);

  React.useEffect(() => {
    if (preloadedData) {
      setAshtakoota(preloadedData.ashtakoota);
      setReport(preloadedData.compatibility);
    }
  }, [preloadedData]);

  if (isAnalyzing) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Computing Ashtakoota Guna Milan and generate compatibility report...</p>
      </div>
    );
  }

  if (!ashtakoota || !report) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(108, 99, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path></svg>
        </div>
        <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Astrology Compatibility</h4>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)' }}>
          Run the overall profile analysis from the dashboard overview to compute the 36-point Ashtakoota Guna Milan.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '32px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.08), rgba(108, 99, 255, 0.2))', border: '1px solid rgba(108, 99, 255, 0.3)' }}>
        <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>Ashtakoota Guna Milan</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '12px', margin: '12px 0' }}>
          <span style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1, color: verdictColors[report.verdict] || 'var(--accent-primary)' }}>{report.total_score}</span>
          <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)' }}>/ {report.max_score}</span>
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: verdictColors[report.verdict] || 'var(--accent-primary)' }}>{report.verdict}</div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h4 style={{ margin: '0 0 16px', color: 'var(--accent-primary)' }}>Koota Breakdown</h4>
        {Object.entries(kootaMeta).map(([key, meta]) => {
          const score = ashtakoota.scores[key] ?? 0;
          const pct = (score / meta.max) * 100;
          return (
            <div key={key} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{meta.label}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{meta.desc}</span>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{score} / {meta.max}</span>
              </div>
              <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: pct >= 70 ? 'linear-gradient(90deg, #34C759, #30D158)' : pct >= 40 ? 'linear-gradient(90deg, #FF9500, #FF9F0A)' : 'linear-gradient(90deg, #FF3B30, #FF453A)',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {(ashtakoota.doshas?.nadi_dosha || ashtakoota.doshas?.bhakoot_dosha) && (
        <div className="card" style={{ padding: '24px', border: '1px solid rgba(255, 59, 48, 0.3)' }}>
          <h4 style={{ margin: '0 0 12px', color: '#FF3B30', fontSize: '1rem' }}>Critical Doshas</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {ashtakoota.doshas.nadi_dosha && <span className="badge badge-danger">Nadi Dosha</span>}
            {ashtakoota.doshas.bhakoot_dosha && <span className="badge badge-danger">Bhakoot Dosha</span>}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ padding: '24px', border: '1px solid rgba(52, 199, 89, 0.3)' }}>
          <h4 style={{ margin: '0 0 12px', color: '#34C759', fontSize: '1rem' }}>Strengths</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.7 }}>
            {report.strengths.map((s, i) => <li key={i} style={{ color: 'var(--text-secondary)' }}>{s}</li>)}
          </ul>
        </div>
        <div className="card" style={{ padding: '24px', border: '1px solid rgba(255, 149, 0, 0.3)' }}>
          <h4 style={{ margin: '0 0 12px', color: '#FF9500', fontSize: '1rem' }}>Areas of Concern</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.7 }}>
            {report.concerns.map((s, i) => <li key={i} style={{ color: 'var(--text-secondary)' }}>{s}</li>)}
          </ul>
        </div>
      </div>

      {report.ai_recommendation && (
        <div className="card" style={{ padding: '24px', background: 'linear-gradient(to bottom right, rgba(108, 99, 255, 0.05), rgba(108, 99, 255, 0.12))', border: '1px solid rgba(108, 99, 255, 0.2)' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--accent-primary)', fontSize: '1rem' }}>AI Recommendation</h4>
          <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-primary)' }}>{report.ai_recommendation}</p>
        </div>
      )}
    </div>
  );
};

export default CompatibilitySection;