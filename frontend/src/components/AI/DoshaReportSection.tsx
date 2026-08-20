import React, { useState } from 'react';
import api from '../../services/api';

interface DoshaData {
  manglik_status: string;
  manglik_severity: string;
  manglik_house_from_ascendant?: number;
  manglik_house_from_moon?: number;
  nadi_dosha: boolean;
  bhakoot_dosha: boolean;
  cancellations: string[];
  remedies: string[];
  overall_verdict: string;
}

interface DoshaReportSectionProps {
  proposalId: number;
  preloadedData?: { dosha_report: DoshaData } | DoshaData | null;
  isAnalyzing?: boolean;
}

const severityColor = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'high': return '#FF3B30';
    case 'moderate': return '#FF9500';
    case 'low': return '#FFCC00';
    case 'none': return '#34C759';
    default: return 'var(--text-secondary)';
  }
};

const DoshaReportSection: React.FC<DoshaReportSectionProps> = ({ proposalId, preloadedData, isAnalyzing }) => {
  const [data, setData] = useState<DoshaData | null>(null);

  React.useEffect(() => {
    if (preloadedData) {
      // Handle both { dosha_report: ... } and direct DoshaData objects
      if ('dosha_report' in preloadedData) {
        setData(preloadedData.dosha_report);
      } else {
        setData(preloadedData as DoshaData);
      }
    }
  }, [preloadedData]);

  if (isAnalyzing) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Analyzing doshas (Manglik, Nadi, Bhakoot)...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(255, 59, 48, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--danger-color, #FF3B30)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Astrological Dosha Report</h4>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)' }}>
          Run the overall profile analysis from the dashboard overview to view the dosha report.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '24px', border: `1px solid ${severityColor(data.manglik_severity)}55`, textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Manglik / Kuja Dosha</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: severityColor(data.manglik_severity), margin: '8px 0' }}>{data.manglik_status}</div>
          <div style={{ fontSize: '0.85rem' }}>
            Severity: <strong style={{ color: severityColor(data.manglik_severity) }}>{data.manglik_severity}</strong>
          </div>
          {data.manglik_house_from_ascendant != null && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Mars from Lagna: House {data.manglik_house_from_ascendant}
              {data.manglik_house_from_moon != null && <> • Mars from Moon: House {data.manglik_house_from_moon}</>}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '24px', textAlign: 'center', border: `1px solid ${data.nadi_dosha ? '#FF3B30' : '#34C759'}55` }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Nadi Dosha</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: data.nadi_dosha ? '#FF3B30' : '#34C759', margin: '8px 0' }}>
            {data.nadi_dosha ? 'Present' : 'Not Present'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {data.nadi_dosha ? 'Related to progeny and health - may require review' : 'No Nadi concern'}
          </div>
        </div>

        <div className="card" style={{ padding: '24px', textAlign: 'center', border: `1px solid ${data.bhakoot_dosha ? '#FF3B30' : '#34C759'}55` }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Bhakoot Dosha</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: data.bhakoot_dosha ? '#FF3B30' : '#34C759', margin: '8px 0' }}>
            {data.bhakoot_dosha ? 'Present' : 'Not Present'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {data.bhakoot_dosha ? 'May affect harmony - traditionally reviewed' : 'No Bhakoot concern'}
          </div>
        </div>
      </div>

      {data.cancellations.length > 0 && (
        <div className="card" style={{ padding: '24px', border: '1px solid rgba(52, 199, 89, 0.3)' }}>
          <h4 style={{ margin: '0 0 12px', color: '#34C759', fontSize: '1rem' }}>Cancellations Applied</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.7 }}>
            {data.cancellations.map((c, i) => <li key={i} style={{ color: 'var(--text-secondary)' }}>{c}</li>)}
          </ul>
        </div>
      )}

      <div className="card" style={{ padding: '24px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: 'var(--text-primary)' }}>Traditional Remedies to Consider</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
          {data.remedies.map((r, i) => <li key={i} style={{ color: 'var(--text-secondary)' }}>{r}</li>)}
        </ul>
      </div>

      {data.overall_verdict && (
        <div className="card" style={{ padding: '24px', background: 'linear-gradient(to bottom right, rgba(108, 99, 255, 0.05), rgba(108, 99, 255, 0.12))', border: '1px solid rgba(108, 99, 255, 0.2)' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--accent-primary)', fontSize: '1rem' }}>Overall Verdict</h4>
          <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-primary)' }}>{data.overall_verdict}</p>
        </div>
      )}
    </div>
  );
};

export default DoshaReportSection;