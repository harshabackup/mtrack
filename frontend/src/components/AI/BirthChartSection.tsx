import React, { useState } from 'react';
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

const BirthChartSection: React.FC<BirthChartSectionProps> = ({ preloadedData }) => {
  const [chart, setChart] = useState<ChartData | null>(null);

  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (preloadedData) {
      setChart(preloadedData);
    }
  }, [preloadedData]);

  const handleCopy = () => {
    if (!chart) return;
    
    let text = `Vedic Birth Chart\n`;
    if (chart.birth_details) {
      text += `DOB: ${chart.birth_details.dob || 'N/A'}, TOB: ${chart.birth_details.tob || 'N/A'}, POB: ${chart.birth_details.pob || 'N/A'}\n`;
    }
    text += `Lagna: ${chart.lagna_sign} | Moon: ${chart.moon_sign} (${chart.moon_nakshatra} P${chart.moon_nakshatra_pada})\n\n`;
    
    text += `Planetary Positions:\n`;
    text += `Planet\tSign\tDegree\tNakshatra\tHouse\tStatus\n`;
    
    planetOrder.forEach(pName => {
      const p = chart.planets[pName];
      if (p) {
        text += `${pName}\t${p.sign}\t${p.degree.toFixed(2)}°\t${p.nakshatra} (P${p.pada})\tH${p.house}\t${p.is_retrograde ? 'Retro' : 'Direct'}\n`;
      }
    });
    
    text += `\nBhava (House) Chart:\n`;
    text += `House\tSign\tDegree\tSign Lord\tPlanets In House\tAspected By\n`;
    chart.houses.forEach(h => {
      text += `H${h.number}\t${h.sign}\t${h.degree.toFixed(2)}°\t${h.sign_lord}\t${h.planets_in_house.length > 0 ? h.planets_in_house.join(', ') : 'None'}\t${h.aspected_by.length > 0 ? h.aspected_by.join(', ') : 'None'}\n`;
    });
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h4 style={{ margin: 0, color: 'var(--accent-primary)' }}>
              Vedic Birth Chart {chart.source === 'fallback' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(simplified calculation)</span>}
            </h4>
            <button 
              onClick={handleCopy}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px', borderRadius: '6px',
                background: copied ? 'var(--success-bg, #e8f5e9)' : 'var(--bg-secondary)',
                color: copied ? 'var(--success, #2e7d32)' : 'var(--text-secondary)',
                border: '1px solid', borderColor: copied ? 'var(--success-border, #c8e6c9)' : 'var(--border)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span>Lagna: <strong style={{ color: 'var(--text-primary)' }}>{chart.lagna_sign}</strong></span>
            <span>Moon: <strong style={{ color: 'var(--text-primary)' }}>{chart.moon_sign} ({chart.moon_nakshatra} P{chart.moon_nakshatra_pada})</strong></span>
          </div>
          {chart.birth_details ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '100%' }}>
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