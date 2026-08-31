import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const raasiOptions = ["Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischika (Scorpio)", "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"];
const nakshatraOptions = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    // Account details
    full_name: '',
    phone: '',
    // Proposal details - same as AddProposal
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      setError(err.response?.data?.detail || 'Failed to accept invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '48px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderRadius: '16px', background: '#fff' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
        <h2 style={{ color: '#166534', marginBottom: '16px' }}>Proposal Submitted!</h2>
        <p style={{ color: '#555' }}>Your proposal has been received. You'll be contacted soon.</p>
      </div>
    );
  }

  if (error && !token) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: '#374151' };
  const sectionStyle: React.CSSProperties = { background: '#f9fafb', borderRadius: '10px', padding: '20px', marginBottom: '24px' };
  const sectionTitle: React.CSSProperties = { fontSize: '15px', fontWeight: 600, color: '#1f2937', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' };

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', padding: '0 16px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>Submit Your Proposal</h1>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>Please fill in all the details below</p>
      </div>

      {error && <div style={{ color: '#dc2626', background: '#fee2e2', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* Account Section */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>👤 Your Account Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Your Full Name *</label>
              <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Your Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Basic Details */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>📋 Basic Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Candidate Name *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Current City</label>
              <input type="text" name="current_city" value={formData.current_city} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Time of Birth</label>
              <input type="time" name="tob" value={formData.tob} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Place of Birth</label>
              <input type="text" name="pob" value={formData.pob} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Physical */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>🏃 Physical Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Height (e.g. 5'8")</label>
              <input type="text" name="height" value={formData.height} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Weight (kg)</label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Complexion</label>
              <input type="text" name="complexion" value={formData.complexion} onChange={handleChange} style={inputStyle} placeholder="Fair, Wheatish, etc." />
            </div>
          </div>
        </div>

        {/* Religion & Astrology */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>🕉️ Religion & Astrology</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Religion</label>
              <input type="text" name="religion" value={formData.religion} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Caste</label>
              <input type="text" name="caste" value={formData.caste} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sub Caste</label>
              <input type="text" name="sub_caste" value={formData.sub_caste} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Gotram</label>
              <input type="text" name="gotram" value={formData.gotram} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Raasi</label>
              <select name="rasi" value={formData.rasi} onChange={handleChange} style={inputStyle}>
                <option value="">Select Raasi</option>
                {raasiOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nakshatra</label>
              <select name="nakshatra" value={formData.nakshatra} onChange={handleChange} style={inputStyle}>
                <option value="">Select Nakshatra</option>
                {nakshatraOptions.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Paadam</label>
              <input type="text" name="paadam" value={formData.paadam} onChange={handleChange} style={inputStyle} placeholder="1, 2, 3, or 4" />
            </div>
            <div>
              <label style={labelStyle}>Dosham</label>
              <input type="text" name="dosham" value={formData.dosham} onChange={handleChange} style={inputStyle} placeholder="Chevvai, Sarpa, None, etc." />
            </div>
          </div>
        </div>

        {/* Education */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>🎓 Education</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Highest Education</label>
              <input type="text" name="education" value={formData.education} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>College / Institution</label>
              <input type="text" name="college_details" value={formData.college_details} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Employment */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>💼 Employment</div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Currently Working?</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="is_working" value="yes" checked={formData.is_working === 'yes'} onChange={handleChange} /> Yes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="is_working" value="no" checked={formData.is_working === 'no'} onChange={handleChange} /> No
              </label>
            </div>
          </div>
          {formData.is_working === 'yes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Company</label>
                <input type="text" name="company" value={formData.company} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Job Title</label>
                <input type="text" name="job_title" value={formData.job_title} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Work Location</label>
                <input type="text" name="work_location" value={formData.work_location} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Salary / CTC (LPA)</label>
                <input type="number" name="salary_ctc" value={formData.salary_ctc} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          )}
        </div>

        {/* Family */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>👨‍👩‍👧 Family Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Father's Name</label>
              <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Father's Occupation</label>
              <input type="text" name="father_occupation" value={formData.father_occupation} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mother's Name</label>
              <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mother's Occupation</label>
              <input type="text" name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Siblings Details</label>
              <textarea name="siblings_details" value={formData.siblings_details} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="e.g. 1 brother (married), 1 sister (studying)" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>📞 Contact Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Candidate's Number</label>
              <input type="text" name="personal_number" value={formData.personal_number} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Father's Number</label>
              <input type="text" name="father_number" value={formData.father_number} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mother's Number</label>
              <input type="text" name="mother_number" value={formData.mother_number} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Instagram ID</label>
              <input type="text" name="instagram_id" value={formData.instagram_id} onChange={handleChange} style={inputStyle} placeholder="@username" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Home Address</label>
              <textarea name="house_address" value={formData.house_address} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Expectations */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>💭 Expectations</div>
          <textarea name="expectations" value={formData.expectations} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Partner expectations, preferences, etc." />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '14px', backgroundColor: loading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 600 }}
        >
          {loading ? 'Submitting...' : '✅ Submit Proposal'}
        </button>
      </form>
    </div>
  );
};

export default AcceptInvite;
