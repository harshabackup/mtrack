import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface PlanetData {
  longitude: number;
  sign: string;
  degree: number;
  nakshatra: string;
  nakshatra_lord: string;
  pada: number;
  house: number;
  is_retrograde: boolean;
}

interface ChartData {
  planets: Record<string, PlanetData>;
  ascendant: { longitude: number; sign: string; degree: number };
  houses: Array<{ number: number; sign: string; degree: number; sign_lord: string; planets_in_house: string[]; aspected_by: string[] }>;
  moon_sign: string;
  moon_nakshatra: string;
  moon_nakshatra_pada: number;
  lagna_sign: string;
  source?: string;
  birth_details?: { dob?: string; tob?: string; pob?: string };
}

interface BirthChartSectionProps {
  proposalId: number;
  dob?: string | null;
  tob?: string | null;
  pob?: string | null;
  preloadedData?: ChartData | null;
}

const planetOrder = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

const elementOf = (sign: string): string => {
  const fire = ['Aries', 'Leo', 'Sagittarius'];
  const earth = ['Taurus', 'Virgo', 'Capricorn'];
  const air = ['Gemini', 'Libra', 'Aquarius'];
  if (fire.includes(sign)) return 'fire';
  if (earth.includes(sign)) return 'earth';
  if (air.includes(sign)) return 'air';
  return 'water';
};

const elementColor: Record<string, string> = {
  fire: '#FF6B35',
  earth: '#2E7D32',
  air: '#1976D2',
  water: '#7B1FA2',
};

const BirthChartSection: React.FC<BirthChartSectionProps> = ({ proposalId, dob, tob, pob, preloadedData }) => {
  const [chart, setChart] = useState<ChartData | null>(null);

  React.useEffect(() => {
    if (preloadedData) {
      setChart(preloadedData);
    }
  }, [preloadedData]);

  if (!chart) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%', background: 'rgba(108, 99, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        </div>
        <h4 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Vedic Birth Chart</h4>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)' }}>
          Run the overall profile analysis from the dashboard overview to generate the birth chart.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h4 style={{ margin: 0, color: 'var(--accent-primary)' }}>
            Vedic Birth Chart {chart.source === 'fallback' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(simplified calculation)</span>}
          </h4>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span>Lagna: <strong style={{ color: 'var(--text-primary)' }}>{chart.lagna_sign}</strong></span>
            <span>Moon: <strong style={{ color: 'var(--text-primary)' }}>{chart.moon_sign} ({chart.moon_nakshatra} P{chart.moon_nakshatra_pada})</strong></span>
          </div>
          {chart.birth_details ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {chart.birth_details.dob}{chart.birth_details.tob ? ` • ${chart.birth_details.tob}` : ''}{chart.birth_details.pob ? ` • ${chart.birth_details.pob}` : ''}
            </div>
          ) : null}
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <table className="data-table" style={{ margin: 0, minWidth: '720px' }}>
            <thead>
              <tr>
                <th>Planet</th>
                <th>Sign</th>
                <th>Degree</th>
                <th>House</th>
                <th>Nakshatra</th>
                <th>Pada</th>
                <th>Nakshatra Lord</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {planetOrder.map(name => {
                const p = chart.planets[name];
                if (!p) return null;
                const color = elementColor[elementOf(p.sign)];
                return (
                  <tr key={name}>
                    <td style={{ fontWeight: 600 }}>{name}</td>
                    <td>
                      <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', color: '#fff', background: color, fontSize: '0.8rem' }}>
                        {p.sign}
                      </span>
                    </td>
                    <td>{p.degree}°</td>
                    <td>{p.house}</td>
                    <td>{p.nakshatra}</td>
                    <td>{p.pada}</td>
                    <td>{p.nakshatra_lord}</td>
                    <td>
                      {p.is_retrograde ? <span className="badge badge-danger">Retro</span> : <span className="badge badge-success">Direct</span>}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: 'var(--bg-hover)' }}>
                <td style={{ fontWeight: 600 }}>Ascendant</td>
                <td>{chart.ascendant.sign}</td>
                <td>{chart.ascendant.degree}°</td>
                <td>1</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h4 style={{ margin: '0 0 16px', color: 'var(--accent-primary)' }}>Bhava (House) Chart</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {chart.houses.map(h => (
            <div key={h.number} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', background: 'var(--bg-body)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem' }}>House {h.number}</strong>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(108,99,255,0.1)', color: 'var(--accent-primary)' }}>{h.sign} {h.degree}°</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lord: {h.sign_lord}</div>
              <div style={{ fontSize: '0.8rem', marginTop: '6px', color: h.planets_in_house.length ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                <strong>Planets:</strong> {h.planets_in_house.length ? h.planets_in_house.join(', ') : 'Empty'}
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px', color: h.aspected_by && h.aspected_by.length ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                <strong>Aspects:</strong> {h.aspected_by && h.aspected_by.length ? h.aspected_by.join(', ') : 'None'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BirthChartSection;