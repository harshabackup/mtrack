import React, { useState } from 'react';

interface PersonalityData {
  personality_summary: string;
  strengths: string[];
  weaknesses: string[];
  career_outlook: string;
  relationship_style: string;
  health_notes: string;
  lucky_factors: Record<string, string>;
}

interface PersonalitySectionProps {
  proposalId: number;
  preloadedData?: PersonalityData | null;
  isAnalyzing?: boolean;
}

const PersonalitySection: React.FC<PersonalitySectionProps> = ({ preloadedData, isAnalyzing }) => {
  const [data, setData] = useState<PersonalityData | null>(null);

  React.useEffect(() => {
    if (preloadedData) {
      setData(preloadedData);
    }
  }, [preloadedData]);

  if (isAnalyzing && !data) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Generating personality analysis...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(108, 99, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Astrology-based Personality Insight</h4>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)' }}>
          Run the overall profile analysis from the dashboard overview to view personality insights.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ gridColumn: '1 / -1', padding: '24px', background: 'linear-gradient(to bottom right, rgba(108, 99, 255, 0.05), rgba(108, 99, 255, 0.15))', border: '1px solid rgba(108, 99, 255, 0.25)' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--accent-primary)' }}>Personality Summary</h4>
          <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-primary)' }}>{data.personality_summary}</p>
        </div>

        <div className="card" style={{ padding: '24px', border: '1px solid rgba(46, 125, 50, 0.3)' }}>
          <h4 style={{ margin: '0 0 16px', color: '#2E7D32', fontSize: '1rem' }}>Strengths</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.7 }}>
            {data.strengths.map((s, i) => <li key={i} style={{ color: 'var(--text-secondary)' }}>{s}</li>)}
          </ul>
        </div>

        <div className="card" style={{ padding: '24px', border: '1px solid rgba(255, 149, 0, 0.3)' }}>
          <h4 style={{ margin: '0 0 16px', color: '#FF9500', fontSize: '1rem' }}>Areas for Growth</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.7 }}>
            {data.weaknesses.map((s, i) => <li key={i} style={{ color: 'var(--text-secondary)' }}>{s}</li>)}
          </ul>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--text-primary)' }}>Career Outlook</h4>
          <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{data.career_outlook}</p>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--text-primary)' }}>Relationship Style</h4>
          <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{data.relationship_style}</p>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--text-primary)' }}>Health Notes</h4>
          <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{data.health_notes}</p>
        </div>

        {data.lucky_factors && Object.keys(data.lucky_factors).length > 0 && (
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--text-primary)' }}>Lucky Factors</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
              {Object.entries(data.lucky_factors).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-body)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalitySection;