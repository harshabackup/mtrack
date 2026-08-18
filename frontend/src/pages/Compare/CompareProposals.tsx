import React, { useState, useEffect } from 'react';
import api from '../../services/api';

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
        </div>
      </div>

      {selectedP1 !== 0 && selectedP2 !== 0 && selectedP1 === selectedP2 && (
        <div style={{ padding: '16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
          Please select two different proposals to compare.
        </div>
      )}

      {selectedP1 !== 0 && selectedP2 !== 0 && selectedP1 !== selectedP2 && !loadingMatch && (
        <div className="card">
          <h4 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Astrological Compatibility Score</h4>
          
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
