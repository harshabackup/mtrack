import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import CityAutocomplete from '../../components/CityAutocomplete';

const raasiOptions = ["Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischika (Scorpio)", "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"];
const nakshatraOptions = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

const EditProposal = ({ proposalId, isProfileMode }: { proposalId?: string, isProfileMode?: boolean }) => {
  const params = useParams<{ id: string }>();
  const id = proposalId || params.id;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '', age: '', current_city: '', dob: '', tob: '', pob: '',
    height: '', weight: '', complexion: '',
    religion: 'Hindu', caste: '', sub_caste: '', gotram: '',
    rasi: '', nakshatra: '', paadam: '', dosham: '',
    education: '', college_details: '',
    is_working: 'no', company: '', job_title: '', work_location: '', salary_ctc: '',
    father_name: '', father_occupation: '', mother_name: '', mother_occupation: '', siblings_details: '',
    house_address: '', personal_number: '', father_number: '', mother_number: '', instagram_id: '', status: ''
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photosToUpload, setPhotosToUpload] = useState<File[]>([]);
  const [pdfToUpload, setPdfToUpload] = useState<File | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await api.get(`/api/v1/proposals/${id}`);
        const data = response.data;
        
        let formattedTob = data.tob;
        if (formattedTob && formattedTob.length > 5) {
            formattedTob = formattedTob.substring(0,5);
        }

        setFormData({
          name: data.name || '',
          age: data.age ? String(data.age) : '',
          current_city: data.current_city || '',
          dob: data.dob || '',
          tob: formattedTob || '',
          pob: data.pob || '',
          height: data.height || '',
          weight: data.weight || '',
          complexion: data.complexion || '',
          religion: data.religion || 'Hindu',
          caste: data.caste || '',
          sub_caste: data.sub_caste || '',
          gotram: data.gotram || '',
          rasi: data.rasi || '',
          nakshatra: data.nakshatra || '',
          paadam: data.paadam || '',
          dosham: data.dosham || '',
          education: data.education || '',
          college_details: data.college_details || '',
          is_working: data.is_working ? 'yes' : 'no',
          company: data.company || '',
          job_title: data.job_title || '',
          work_location: data.work_location || '',
          salary_ctc: data.salary_ctc || '',
          father_name: data.father_name || '',
          father_occupation: data.father_occupation || '',
          mother_name: data.mother_name || '',
          mother_occupation: data.mother_occupation || '',
          siblings_details: data.siblings_details || '',
          house_address: data.house_address || '',
          personal_number: data.personal_number || '',
          father_number: data.father_number || '',
          mother_number: data.mother_number || '',
          instagram_id: data.instagram_id || '',
          status: data.status || 'IN_PROGRESS'
        });
      } catch (error) {
        console.error("Error fetching proposal", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotosToUpload(prev => [...prev, ...Array.from(e.target.files!)]);
      showNotification(`${e.target.files.length} photo(s) selected`, 'success');
    }
    e.target.value = ''; // Reset to allow selecting the same file again
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPdfToUpload(e.target.files[0]);
      showNotification('PDF selected', 'success');
    }
    e.target.value = ''; // Reset to allow selecting the same file again
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      if (file.type.startsWith('image/')) {
        setPhotosToUpload(prev => [...prev, file]);
        showNotification("Image pasted and added to Profile Photos", "success");
      } else if (file.type === 'application/pdf') {
        setPdfToUpload(file);
        showNotification("PDF pasted and attached", "success");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Upload files to Supabase Storage first
      const photoUrls: string[] = [];
      let finalPdfUrl: string | null = null;
      
      const { supabase } = await import('../../supabaseClient');
      
      if (photosToUpload.length > 0) {
        showNotification("Uploading photos to Supabase...", "success");
        for (const file of photosToUpload) {
          const filePath = `${id}/photos/${file.name}`;
          const { error } = await supabase.storage.from('mtrack').upload(filePath, file, { upsert: true });
          if (error) throw error;
          const { data } = supabase.storage.from('mtrack').getPublicUrl(filePath);
          photoUrls.push(data.publicUrl);
        }
      }
      
      if (pdfToUpload) {
        showNotification("Uploading PDF to Supabase...", "success");
        const filePath = `${id}/pdf/${pdfToUpload.name}`;
        const { error } = await supabase.storage.from('mtrack').upload(filePath, pdfToUpload, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('mtrack').getPublicUrl(filePath);
        finalPdfUrl = data.publicUrl;
      }

      // 2. Update Proposal with URLs included
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        is_working: formData.is_working === 'yes',
        dob: formData.dob || null,
        tob: formData.tob || null,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
        pdf_url: finalPdfUrl || (formData as any).pdf_url // keep old if not updated
      };

      await api.put(`/api/v1/proposals/${id}`, payload);

      showNotification("Profile saved successfully!", "success");
      if (!isProfileMode) {
        setTimeout(() => navigate(`/vendor/proposals/${id}`), 1000);
      }
    } catch (error) {
      console.error("Error updating proposal", error);
      setIsSubmitting(false);
      showNotification("Failed to update proposal", "error");
    }
  };

  if (loading) return <div className="animate-in" style={{ padding: '40px', textAlign: 'center' }}><p>Loading...</p></div>;

  return (
    <div className="animate-in" onPaste={handlePaste}>
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">{isProfileMode ? "My Profile" : "Edit Proposal"}</h2>
          <p style={{ marginTop: '8px', marginBottom: 0 }}>
            {isProfileMode ? "Update your personal details and bio data" : `Update details for ${formData.name}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isProfileMode && (
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
              Cancel
            </button>
          )}
          <button type="submit" form="edit-proposal-form" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px' }}>
        <form id="edit-proposal-form" onSubmit={handleSubmit} style={{ display: 'flex', gap: '32px', alignItems: 'start', position: 'relative' }}>
          
          {/* Sticky Sidebar Navigation */}
          <nav style={{ flex: '0 0 250px', position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h5 style={{ margin: '0 0 16px 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Navigation</h5>
            {!isProfileMode && (
              <a href="#section-pipeline" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, background: 'var(--bg-hover)' }}>Pipeline Status</a>
            )}
            <a href="#section-personal" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>1. Personal Details</a>
            <a href="#section-astrology" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>2. Astrology</a>
            <a href="#section-career" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>3. Education & Career</a>
            <a href="#section-family" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>4. Family Details</a>
            <a href="#section-contact" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>5. Contact Info</a>
          </nav>

          {/* Main Form Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Pipeline Status */}
            {!isProfileMode && (
              <div id="section-pipeline" className="card" style={{ scrollMarginTop: '24px', background: 'var(--accent-light)', border: '1px solid var(--accent-primary)' }}>
                <h4 style={{ color: 'var(--accent-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  Pipeline Status
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Update where this proposal is currently at in your pipeline.</p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select className="input-field" name="status" value={formData.status} onChange={handleInputChange} style={{ fontWeight: 600 }}>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="PARENTS_MEET">Parents Meet</option>
                    <option value="FINALIZED">Finalized</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            )}

            {/* Section 1: Personal Info */}
            <div id="section-personal" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>1. Personal Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Basic Info */}
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label>Full Name *</label>
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
                  <label>Complexion / Type</label>
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
                  <CityAutocomplete name="pob" value={formData.pob} onChange={handleInputChange as any} placeholder="Search city of birth..." />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Current City / Living In</label>
                  <CityAutocomplete name="current_city" value={formData.current_city} onChange={handleInputChange as any} placeholder="Search current city..." />
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
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Highest Education</label>
                  <input type="text" className="input-field" name="education" value={formData.education} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>College Details</label>
                  <input type="text" className="input-field" name="college_details" value={formData.college_details} onChange={handleInputChange} />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Working Status</label>
                  <select className="input-field" name="is_working" value={formData.is_working} onChange={handleInputChange}>
                    <option value="yes">Working</option>
                    <option value="no">Not Working</option>
                  </select>
                </div>
                
                {formData.is_working === 'yes' && (
                  <>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Job Title / Profession</label>
                      <input type="text" className="input-field" name="job_title" value={formData.job_title} onChange={handleInputChange} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Company Name</label>
                      <input type="text" className="input-field" name="company" value={formData.company} onChange={handleInputChange} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Work Location (City/Country)</label>
                      <input type="text" className="input-field" name="work_location" value={formData.work_location} onChange={handleInputChange} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Annual Income (CTC)</label>
                      <input type="text" className="input-field" name="salary_ctc" value={formData.salary_ctc} onChange={handleInputChange} placeholder="e.g. 15 LPA" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 4: Family Details */}
            <div id="section-family" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>4. Family Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Siblings Details</label>
                  <textarea className="input-field" name="siblings_details" value={formData.siblings_details} onChange={handleInputChange} placeholder="e.g. 1 elder brother (married), 1 younger sister" style={{ minHeight: '80px' }}></textarea>
                </div>
                
                {/* Split Contact Info */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Father's Phone Number</label>
                  <input type="text" className="input-field" name="father_number" value={formData.father_number} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Mother's Phone Number</label>
                  <input type="text" className="input-field" name="mother_number" value={formData.mother_number} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* Section 5: Contact Info */}
            <div id="section-contact" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>5. Contact Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label>Permanent / House Address</label>
                  <textarea className="input-field" name="house_address" value={formData.house_address} onChange={handleInputChange} style={{ minHeight: '60px' }}></textarea>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Personal Phone Number (Girl/Boy)</label>
                  <input type="text" className="input-field" name="personal_number" value={formData.personal_number} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Instagram ID</label>
                  <input type="text" className="input-field" name="instagram_id" value={formData.instagram_id} onChange={handleInputChange} placeholder="@username" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '32px' }}>
              {/* Photos Dropzone */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '32px 24px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--border-color)', cursor: 'pointer', transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-body)'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-body)';
                  if (e.dataTransfer.files) {
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                    setPhotosToUpload(prev => [...prev, ...files]);
                  }
                }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <h5 style={{ margin: '0 0 8px', fontSize: '1rem', color: 'var(--text-primary)' }}>Add More Photos</h5>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Click to upload</span> or drag and drop<br/>
                    (You can also press <strong>Ctrl+V</strong> anywhere)
                  </p>
                  <input type="file" multiple accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                </label>

                {photosToUpload.length > 0 && (
                  <div style={{ marginTop: '16px', background: 'var(--bg-hover)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: '0 0 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      {photosToUpload.length} new photo(s) selected
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {photosToUpload.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                          <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={(e) => { e.preventDefault(); setPhotosToUpload(prev => prev.filter((_, i) => i !== idx)); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--danger)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}>&times;</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PDF Dropzone */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '32px 24px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--border-color)', cursor: 'pointer', transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-body)'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-body)';
                  if (e.dataTransfer.files) {
                    const file = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf');
                    if (file) setPdfToUpload(file);
                  }
                }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <h5 style={{ margin: '0 0 8px', fontSize: '1rem', color: 'var(--text-primary)' }}>Update Biodata PDF</h5>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Click to upload</span> or drag and drop<br/>
                    (You can also press <strong>Ctrl+V</strong> anywhere)
                  </p>
                  <input type="file" accept="application/pdf" onChange={handlePdfSelect} style={{ display: 'none' }} />
                </label>

                {pdfToUpload && (
                  <div style={{ marginTop: '16px', background: 'var(--bg-hover)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', background: 'var(--accent-light)', borderRadius: '6px', color: 'var(--accent-primary)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pdfToUpload.name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--success)' }}>Ready to upload</p>
                      </div>
                    </div>
                    <button type="button" onClick={(e) => { e.preventDefault(); setPdfToUpload(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} onMouseOver={e => e.currentTarget.style.color = 'var(--danger)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="animate-in" style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          background: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {notification.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          )}
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default EditProposal;
