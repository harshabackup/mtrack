import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const raasiOptions = ["Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischika (Scorpio)", "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"];
const nakshatraOptions = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    name: '',
    age: '',
    current_city: '',
    dob: '',
    tob: '',
    pob: '',
    height: '',
    weight: '',
    complexion: '',
    religion: 'Hindu',
    caste: '',
    sub_caste: '',
    gotram: '',
    rasi: '',
    nakshatra: '',
    paadam: '',
    dosham: '',
    education: '',
    college_details: '',
    is_working: 'no',
    company: '',
    job_title: '',
    work_location: '',
    salary_ctc: '',
    father_name: '',
    father_occupation: '',
    mother_name: '',
    mother_occupation: '',
    siblings_details: '',
    house_address: '',
    personal_number: '',
    father_number: '',
    mother_number: '',
    instagram_id: '',
    expectations: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.');
    }
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        token,
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        salary_ctc: formData.salary_ctc ? parseFloat(formData.salary_ctc) : undefined,
        height: formData.height || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
      };
      await api.post('/api/v1/auth/accept-invite', payload);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '48px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderRadius: '16px', background: '#fff' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
        <h2 style={{ color: '#166534', marginBottom: '16px' }}>Proposal Submitted!</h2>
        <p style={{ color: '#555' }}>Your proposal has been received and your account is active.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '24px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>Accept Invitation & Submit Proposal</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Fill out the form below to create your account and submit your profile.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" form="accept-invite-form" className="btn btn-primary" disabled={loading || !token}>
              {loading ? 'Submitting...' : 'Submit Profile'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <form id="accept-invite-form" onSubmit={handleSubmit} style={{ display: 'flex', gap: '32px', alignItems: 'start', position: 'relative' }}>
          
          {/* Sticky Sidebar Navigation */}
          <nav style={{ flex: '0 0 250px', position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h5 style={{ margin: '0 0 16px 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Navigation</h5>
            <a href="#section-account" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, background: 'var(--bg-hover)' }}>0. Account Setup</a>
            <a href="#section-personal" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>1. Personal Details</a>
            <a href="#section-astrology" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>2. Astrology</a>
            <a href="#section-career" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>3. Education & Career</a>
            <a href="#section-family" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>4. Family Details</a>
            <a href="#section-contact" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>5. Contact Information</a>
            <a href="#section-expectations" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>6. Expectations</a>
          </nav>

          {/* Main Form Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Section 0: Account Info */}
            <div id="section-account" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>0. Account Setup</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Your Full Name *</label>
                  <input type="text" className="input-field" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Your Phone Number *</label>
                  <input type="tel" className="input-field" name="phone" value={formData.phone} onChange={handleInputChange} required />
                </div>
              </div>
            </div>

            {/* Section 1: Personal Info */}
            <div id="section-personal" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>1. Profile Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label>Candidate Name *</label>
                  <input type="text" className="input-field" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                
                {/* Physical Traits */}
                <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                  <h5 style={{ margin: '0 0 16px 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Physical Traits</h5>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Age</label>
                  <input type="number" className="input-field" name="age" value={formData.age} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Height</label>
                  <input type="text" className="input-field" name="height" value={formData.height} onChange={handleInputChange} placeholder="e.g. 5' 8&quot;" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Weight</label>
                  <input type="text" className="input-field" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="e.g. 70 kg" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Complexion</label>
                  <input type="text" className="input-field" name="complexion" value={formData.complexion} onChange={handleInputChange} placeholder="e.g. Fair, Medium" />
                </div>

                {/* Birth & Location */}
                <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                  <h5 style={{ margin: '0 0 16px 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Birth Details & Location</h5>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Date of Birth</label>
                  <input type="date" className="input-field" name="dob" value={formData.dob} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Time of Birth</label>
                  <input type="time" className="input-field" name="tob" value={formData.tob} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Place of Birth</label>
                  <input type="text" className="input-field" name="pob" value={formData.pob} onChange={handleInputChange} placeholder="City, State" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Current City</label>
                  <input type="text" className="input-field" name="current_city" value={formData.current_city} onChange={handleInputChange} placeholder="City, State" />
                </div>
              </div>
            </div>

            {/* Section 2: Astrology */}
            <div id="section-astrology" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>2. Astrology & Background</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Religion</label>
                  <input type="text" className="input-field" name="religion" value={formData.religion} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Caste</label>
                  <input type="text" className="input-field" name="caste" value={formData.caste} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Sub Caste</label>
                  <input type="text" className="input-field" name="sub_caste" value={formData.sub_caste} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Gotram</label>
                  <input type="text" className="input-field" name="gotram" value={formData.gotram} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Raasi</label>
                  <select className="input-field" name="rasi" value={formData.rasi} onChange={handleInputChange}>
                    <option value="">Select Raasi</option>
                    {raasiOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Nakshatram</label>
                  <select className="input-field" name="nakshatra" value={formData.nakshatra} onChange={handleInputChange}>
                    <option value="">Select Nakshatra</option>
                    {nakshatraOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Paadam</label>
                  <select className="input-field" name="paadam" value={formData.paadam} onChange={handleInputChange}>
                    <option value="">Select Paadam</option>
                    <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Dosham</label>
                  <input type="text" className="input-field" name="dosham" value={formData.dosham} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* Section 3: Education & Career */}
            <div id="section-career" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>3. Education & Career</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Highest Education</label>
                    <input type="text" className="input-field" name="education" value={formData.education} onChange={handleInputChange} placeholder="e.g. B.Tech, MBA" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>College/University Details</label>
                    <input type="text" className="input-field" name="college_details" value={formData.college_details} onChange={handleInputChange} />
                  </div>
                </div>
                
                <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '20px' }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={formData.is_working === 'yes'} 
                        onChange={e => setFormData({...formData, is_working: e.target.checked ? 'yes' : 'no'})}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                      />
                      <span style={{ fontWeight: 600 }}>Currently Working</span>
                    </label>
                  </div>
                  
                  {formData.is_working === 'yes' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Company Name</label>
                        <input type="text" className="input-field" name="company" value={formData.company} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Job Title / Designation</label>
                        <input type="text" className="input-field" name="job_title" value={formData.job_title} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Work Location</label>
                        <input type="text" className="input-field" name="work_location" value={formData.work_location} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Salary (CTC) / Income</label>
                        <input type="text" className="input-field" name="salary_ctc" value={formData.salary_ctc} onChange={handleInputChange} placeholder="e.g. 12 LPA" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Family */}
            <div id="section-family" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>4. Family Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Father's Name</label>
                  <input type="text" className="input-field" name="father_name" value={formData.father_name} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Father's Occupation</label>
                  <input type="text" className="input-field" name="father_occupation" value={formData.father_occupation} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Mother's Name</label>
                  <input type="text" className="input-field" name="mother_name" value={formData.mother_name} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Mother's Occupation</label>
                  <input type="text" className="input-field" name="mother_occupation" value={formData.mother_occupation} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label>Siblings Details</label>
                  <textarea className="input-field" name="siblings_details" value={formData.siblings_details} onChange={handleInputChange} rows={3} placeholder="E.g., 1 elder brother (married), 1 younger sister"></textarea>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label>House Address / Native Place</label>
                  <textarea className="input-field" name="house_address" value={formData.house_address} onChange={handleInputChange} rows={3}></textarea>
                </div>
              </div>
            </div>

            {/* Section 5: Contact */}
            <div id="section-contact" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>5. Contact Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Personal Mobile</label>
                  <input type="tel" className="input-field" name="personal_number" value={formData.personal_number} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Father's Mobile</label>
                  <input type="tel" className="input-field" name="father_number" value={formData.father_number} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Mother's Mobile</label>
                  <input type="tel" className="input-field" name="mother_number" value={formData.mother_number} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label>Instagram ID (Optional)</label>
                  <input type="text" className="input-field" name="instagram_id" value={formData.instagram_id} onChange={handleInputChange} placeholder="@username" />
                </div>
              </div>
            </div>

            {/* Section 6: Expectations */}
            <div id="section-expectations" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>6. Partner Expectations</h4>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>What are you looking for in a partner?</label>
                <textarea className="input-field" name="expectations" value={formData.expectations} onChange={handleInputChange} rows={4} placeholder="Education, location, family background preferences..."></textarea>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvite;
