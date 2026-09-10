import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface PreferenceData {
  id?: number;
  min_age: number | '';
  max_age: number | '';
  preferred_cities: string;
  preferred_religions: string;
  preferred_castes: string;
  preferred_diets: string;
  preferred_education_levels: string;
  preferred_family_types: string;
  min_income_lpa: number | '';
  must_be_working: boolean | null;
  notes: string;
  deal_breaker_diet: boolean;
  deal_breaker_religion: boolean;
  deal_breaker_min_income: boolean;
}

const initialPreference: PreferenceData = {
  min_age: '', max_age: '', preferred_cities: '', preferred_religions: '', preferred_castes: '',
  preferred_diets: '', preferred_education_levels: '', preferred_family_types: '', min_income_lpa: '',
  must_be_working: null, notes: '', deal_breaker_diet: false, deal_breaker_religion: false, deal_breaker_min_income: false,
};

const PreferenceEditor = ({ proposalId, proposalName }: { proposalId: number; proposalName: string }) => {
  const [pref, setPref] = useState<PreferenceData>(initialPreference);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/proposals/${proposalId}/preference`);
        const d = res.data;
        const dealBreakers: any[] = d.deal_breakers || [];
        setPref({
          id: d.id,
          min_age: d.min_age ?? '', max_age: d.max_age ?? '',
          preferred_cities: d.preferred_cities || '', preferred_religions: d.preferred_religions || '',
          preferred_castes: d.preferred_castes || '', preferred_diets: d.preferred_diets || '',
          preferred_education_levels: d.preferred_education_levels || '', preferred_family_types: d.preferred_family_types || '',
          min_income_lpa: d.min_income_lpa ?? '', must_be_working: d.must_be_working ?? null,
          notes: d.notes || '',
          deal_breaker_diet: dealBreakers.some(r => r.field === 'diet'),
          deal_breaker_religion: dealBreakers.some(r => r.field === 'religion'),
          deal_breaker_min_income: dealBreakers.some(r => r.field === 'income_lpa'),
        });
      } catch (err) {
        console.error('Error loading preference', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [proposalId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    let finalValue: any = value;
    if (type === 'checkbox') finalValue = checked;
    else if (name === 'min_age' || name === 'max_age' || name === 'min_income_lpa') finalValue = value === '' ? '' : Number(value);
    else if (name === 'must_be_working') finalValue = value === '' ? null : value === 'true';
    setPref(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dealBreakers: any[] = [];
      if (pref.deal_breaker_diet && pref.preferred_diets) {
        const diets = pref.preferred_diets.split(',').map(d => d.trim()).filter(Boolean);
        dealBreakers.push({ field: 'diet', op: 'in', value: diets });
      }
      if (pref.deal_breaker_religion && pref.preferred_religions) {
        const religions = pref.preferred_religions.split(',').map(d => d.trim()).filter(Boolean);
        dealBreakers.push({ field: 'religion', op: 'in', value: religions });
      }
      if (pref.deal_breaker_min_income && pref.min_income_lpa !== '') {
        dealBreakers.push({ field: 'income_lpa', op: 'min', value: pref.min_income_lpa });
      }

      const payload = {
        min_age: pref.min_age === '' ? null : pref.min_age,
        max_age: pref.max_age === '' ? null : pref.max_age,
        preferred_cities: pref.preferred_cities || null,
        preferred_religions: pref.preferred_religions || null,
        preferred_castes: pref.preferred_castes || null,
        preferred_diets: pref.preferred_diets || null,
        preferred_education_levels: pref.preferred_education_levels || null,
        preferred_family_types: pref.preferred_family_types || null,
        min_income_lpa: pref.min_income_lpa === '' ? null : pref.min_income_lpa,
        must_be_working: pref.must_be_working,
        notes: pref.notes || null,
        deal_breakers: dealBreakers,
      };
      await api.put(`/api/v1/proposals/${proposalId}/preference`, payload);
      alert(`Preferences saved for ${proposalName}`);
    } catch (err) {
      console.error('Error saving preference', err);
      alert('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="card" style={{ marginTop: '16px', background: 'var(--bg-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <strong style={{ fontSize: '0.875rem' }}>Partner Preferences ({proposalName})</strong>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{expanded ? 'Collapse' : 'Edit'}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem' }}>Min Age</label>
              <input type="number" className="input-field" name="min_age" value={pref.min_age} onChange={handleChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem' }}>Max Age</label>
              <input type="number" className="input-field" name="max_age" value={pref.max_age} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem' }}>Preferred Cities (comma-separated)</label>
            <input className="input-field" name="preferred_cities" value={pref.preferred_cities} onChange={handleChange} placeholder="Chennai, Coimbatore" />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem' }}>Preferred Religions</label>
              <input className="input-field" name="preferred_religions" value={pref.preferred_religions} onChange={handleChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem' }}>Preferred Castes</label>
              <input className="input-field" name="preferred_castes" value={pref.preferred_castes} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem' }}>Preferred Diets</label>
              <input className="input-field" name="preferred_diets" value={pref.preferred_diets} onChange={handleChange} placeholder="Vegetarian" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem' }}>Preferred Family Types</label>
              <input className="input-field" name="preferred_family_types" value={pref.preferred_family_types} onChange={handleChange} placeholder="Nuclear" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem' }}>Min Income (LPA)</label>
              <input type="number" className="input-field" name="min_income_lpa" value={pref.min_income_lpa} onChange={handleChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.7rem' }}>Must Be Working</label>
              <select className="input-field" name="must_be_working" value={pref.must_be_working === null ? '' : String(pref.must_be_working)} onChange={handleChange}>
                <option value="">Doesn't matter</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '10px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Deal-breakers (hard veto if unmet)</label>
            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <input type="checkbox" name="deal_breaker_diet" checked={pref.deal_breaker_diet} onChange={handleChange} /> Diet must match preferred list
            </label>
            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <input type="checkbox" name="deal_breaker_religion" checked={pref.deal_breaker_religion} onChange={handleChange} /> Religion must match preferred list
            </label>
            <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input type="checkbox" name="deal_breaker_min_income" checked={pref.deal_breaker_min_income} onChange={handleChange} /> Income must meet minimum
            </label>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem' }}>Notes</label>
            <textarea className="input-field" style={{ minHeight: '60px' }} name="notes" value={pref.notes} onChange={handleChange} />
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      )}
    </div>
  );
};

interface Proposal {
  id: number;
  name: string;
  age: number | null;
  current_city: string | null;
  rasi: string | null;
  nakshatra: string | null;
  dosham: string | null;
}

interface MatchData {
  id?: number;
  proposal_1_id: number;
  proposal_2_id: number;
  guna_score: number | '';
  maximum_guna: number;
  varna_score: number | '';
  vashya_score: number | '';
  tara_score: number | '';
  yoni_score: number | '';
  graha_maitri_score: number | '';
  gana_score: number | '';
  bhakoot_score: number | '';
  nadi_score: number | '';
  manglik_result: boolean | null;
  matching_notes: string;
}

const initialMatchData: MatchData = {
  proposal_1_id: 0,
  proposal_2_id: 0,
  guna_score: '',
  maximum_guna: 36,
  varna_score: '',
  vashya_score: '',
  tara_score: '',
  yoni_score: '',
  graha_maitri_score: '',
  gana_score: '',
  bhakoot_score: '',
  nadi_score: '',
  manglik_result: null,
  matching_notes: ''
}

const CompareProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedP1, setSelectedP1] = useState<number>(0);
  const [selectedP2, setSelectedP2] = useState<number>(0);
  
  const [matchData, setMatchData] = useState<MatchData>(initialMatchData);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [autoCalculating, setAutoCalculating] = useState(false);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await api.get('/api/v1/proposals');
        setProposals(response.data);
      } catch (error) {
        console.error("Error fetching proposals", error);
      }
    };
    fetchProposals();
  }, []);

  useEffect(() => {
    if (selectedP1 && selectedP2 && selectedP1 !== selectedP2) {
      fetchMatchData(selectedP1, selectedP2);
    } else {
      setMatchData(initialMatchData);
    }
  }, [selectedP1, selectedP2]);

  const fetchMatchData = async (p1: number, p2: number) => {
    setLoadingMatch(true);
    try {
      const response = await api.get(`/api/matching/${p1}/${p2}`);
      setMatchData(response.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setMatchData({
          ...initialMatchData,
          proposal_1_id: p1,
          proposal_2_id: p2
        });
      } else {
        console.error("Error fetching match data", error);
      }
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleMatchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    let finalValue: any = value;
    
    if (type === 'number') {
      finalValue = value === '' ? '' : parseFloat(value);
    } else if (name === 'manglik_result') {
      finalValue = value === 'true' ? true : (value === 'false' ? false : null);
    }
    
    setMatchData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSaveMatch = async () => {
    try {
      const dataToSave = { ...matchData };
      Object.keys(dataToSave).forEach(key => {
        if ((dataToSave as any)[key] === '') (dataToSave as any)[key] = null;
      });

      if (matchData.id) {
        await api.put(`/api/matching/${matchData.id}`, dataToSave);
        alert("Match updated successfully!");
      } else {
        const response = await api.post('/api/matching', dataToSave);
        setMatchData(response.data);
        alert("Match created successfully!");
      }
    } catch (error) {
      console.error("Error saving match", error);
      alert("Failed to save match data.");
    }
  };

  const handleAutoCalculate = async () => {
    setAutoCalculating(true);
    try {
      const response = await api.post(`/api/matching/auto/${selectedP1}/${selectedP2}`);
      setMatchData(response.data);
      alert("Kundli matching auto-calculated from birth details!");
    } catch (error: any) {
      console.error("Error auto-calculating match", error);
      alert(error?.response?.data?.detail || "Could not auto-calculate. Make sure both profiles have a date of birth.");
    } finally {
      setAutoCalculating(false);
    }
  };

  const p1Details = proposals.find(p => p.id === selectedP1);
  const p2Details = proposals.find(p => p.id === selectedP2);

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2 className="page-title">Compare Proposals</h2>
      </div>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div style={{ flex: '1 1 45%' }}>
          <div className="form-group">
            <label>Select Proposal 1</label>
            <select className="input-field" style={{ height: '40px', backgroundColor: 'var(--bg-surface)' }} value={selectedP1} onChange={(e) => setSelectedP1(Number(e.target.value))}>
              <option value={0}>-- Select Proposal --</option>
              {proposals.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.rasi ? `(${p.rasi})` : ''}</option>
              ))}
            </select>
          </div>
          {p1Details && (
            <div className="card" style={{ marginTop: '16px', background: 'var(--bg-subtle)' }}>
              <p style={{ margin: '0 0 8px' }}><strong>Age:</strong> {p1Details.age || '-'}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Rasi:</strong> {p1Details.rasi || '-'}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Nakshatra:</strong> {p1Details.nakshatra || '-'}</p>
              <p style={{ margin: 0 }}><strong>Dosham:</strong> {p1Details.dosham || '-'}</p>
            </div>
          )}
          {p1Details && <PreferenceEditor proposalId={p1Details.id} proposalName={p1Details.name} />}
        </div>
        
        <div style={{ flex: '1 1 45%' }}>
          <div className="form-group">
            <label>Select Proposal 2</label>
            <select className="input-field" style={{ height: '40px', backgroundColor: 'var(--bg-surface)' }} value={selectedP2} onChange={(e) => setSelectedP2(Number(e.target.value))}>
              <option value={0}>-- Select Proposal --</option>
              {proposals.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.rasi ? `(${p.rasi})` : ''}</option>
              ))}
            </select>
          </div>
          {p2Details && (
            <div className="card" style={{ marginTop: '16px', background: 'var(--bg-subtle)' }}>
              <p style={{ margin: '0 0 8px' }}><strong>Age:</strong> {p2Details.age || '-'}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Rasi:</strong> {p2Details.rasi || '-'}</p>
              <p style={{ margin: '0 0 8px' }}><strong>Nakshatra:</strong> {p2Details.nakshatra || '-'}</p>
              <p style={{ margin: 0 }}><strong>Dosham:</strong> {p2Details.dosham || '-'}</p>
            </div>
          )}
          {p2Details && <PreferenceEditor proposalId={p2Details.id} proposalName={p2Details.name} />}
        </div>
      </div>

      {selectedP1 !== 0 && selectedP2 !== 0 && selectedP1 === selectedP2 && (
        <div style={{ padding: '16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
          Please select two different proposals to compare.
        </div>
      )}

      {selectedP1 !== 0 && selectedP2 !== 0 && selectedP1 !== selectedP2 && !loadingMatch && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h4 style={{ margin: 0 }}>Astrological Compatibility Score</h4>
            <button className="btn btn-outline" onClick={handleAutoCalculate} disabled={autoCalculating}>
              {autoCalculating ? 'Calculating…' : 'Auto-Calculate from Birth Details'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 45%', marginBottom: 0 }}>
              <label style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Total Guna Milan Score</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input type="number" step="0.5" className="input-field" style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} name="guna_score" value={matchData.guna_score} onChange={handleMatchChange} placeholder="e.g. 28" />
                <div style={{ background: 'var(--bg-subtle)', padding: '10px 16px', border: '1px solid var(--border-color)', borderLeft: 'none', borderTopRightRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
                  / 36
                </div>
              </div>
            </div>
            <div className="form-group" style={{ flex: '1 1 45%', marginBottom: 0 }}>
              <label style={{ fontWeight: 600 }}>Manglik Compatibility</label>
              <select className="input-field" style={{ height: '40px', backgroundColor: 'var(--bg-surface)' }} name="manglik_result" value={matchData.manglik_result === null ? '' : String(matchData.manglik_result)} onChange={handleMatchChange}>
                <option value="">Unknown</option>
                <option value="true">Compatible</option>
                <option value="false">Not Compatible</option>
              </select>
            </div>
          </div>

          <h5 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Ashtakoota Breakdown (Optional)</h5>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Varna (1)</label>
              <input type="number" step="0.5" max="1" className="input-field" name="varna_score" value={matchData.varna_score} onChange={handleMatchChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Vashya (2)</label>
              <input type="number" step="0.5" max="2" className="input-field" name="vashya_score" value={matchData.vashya_score} onChange={handleMatchChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Tara (3)</label>
              <input type="number" step="0.5" max="3" className="input-field" name="tara_score" value={matchData.tara_score} onChange={handleMatchChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Yoni (4)</label>
              <input type="number" step="0.5" max="4" className="input-field" name="yoni_score" value={matchData.yoni_score} onChange={handleMatchChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Graha Maitri (5)</label>
              <input type="number" step="0.5" max="5" className="input-field" name="graha_maitri_score" value={matchData.graha_maitri_score} onChange={handleMatchChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Gana (6)</label>
              <input type="number" step="0.5" max="6" className="input-field" name="gana_score" value={matchData.gana_score} onChange={handleMatchChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Bhakoot (7)</label>
              <input type="number" step="0.5" max="7" className="input-field" name="bhakoot_score" value={matchData.bhakoot_score} onChange={handleMatchChange} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Nadi (8)</label>
              <input type="number" step="0.5" max="8" className="input-field" name="nadi_score" value={matchData.nadi_score} onChange={handleMatchChange} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label>Notes</label>
            <textarea className="input-field" style={{ minHeight: '100px', resize: 'vertical' }} name="matching_notes" value={matchData.matching_notes || ''} onChange={handleMatchChange} placeholder="Any specific warnings or advice from astrologer..."></textarea>
          </div>

          <div>
            <button className="btn btn-primary" onClick={handleSaveMatch}>{matchData.id ? 'Update Match Data' : 'Save Match Data'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareProposals;
