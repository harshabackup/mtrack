import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';
import CityAutocomplete from '../../components/CityAutocomplete';
import api from '../../services/api';

const raasiOptions = ["Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)", "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischika (Scorpio)", "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"];
const nakshatraOptions = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashirsha", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

const AddProposal = () => {
  const navigate = useNavigate();
  
  // States
  const [formData, setFormData] = useState({
    name: '', age: '', current_city: '', dob: '', tob: '', pob: '',
    height: '', weight: '', complexion: '',
    religion: 'Hindu', caste: '', sub_caste: '', gotram: '',
    rasi: '', nakshatra: '', paadam: '', dosham: '',
    education: '', college_details: '',
    is_working: 'no', company: '', job_title: '', work_location: '', salary_ctc: '',
    father_name: '', father_occupation: '', mother_name: '', mother_occupation: '', siblings_details: '',
    house_address: '', personal_number: '', father_number: '', mother_number: '', instagram_id: '',
    created_at: '', received_date: '', referred_by: '', expectations: ''
  });

  const [photosToUpload, setPhotosToUpload] = useState<File[]>([]);
  const [pdfToUpload, setPdfToUpload] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  
  // Dirty state and drafting
  const [isDirty, setIsDirty] = useState(false);
  
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Dragging state
  const [popupPos, setPopupPos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 420 : 800, y: typeof window !== 'undefined' ? window.innerHeight - 350 : 500 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - popupPos.x, y: e.clientY - popupPos.y };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDragging.current) {
        setPopupPos({ 
          x: moveEvent.clientX - dragStart.current.x, 
          y: moveEvent.clientY - dragStart.current.y 
        });
      }
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('proposal_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        setIsDirty(true);
        showNotification("Loaded your saved draft.", "success");
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setIsDirty(true);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotosToUpload(prev => [...prev, ...newFiles]);
      showNotification(`${newFiles.length} photo(s) selected`, 'success');
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

  const extractFromFile = async (file: File) => {
    setIsExtracting(true);
    const formDataPayload = new FormData();
    formDataPayload.append("file", file);

    try {
      const response = await api.post('/api/v1/proposals/ocr/extract', formDataPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response.data;
      
      setFormData(prev => ({
        ...prev,
        name: data.name || data.Name || prev.name,
        age: data.age || data.Age ? String(data.age || data.Age) : prev.age,
        current_city: data.city || data.City || prev.current_city,
        rasi: data.rasi || data.Rasi || prev.rasi,
        nakshatra: data.nakshatra || data.Nakshatra || prev.nakshatra,
        dosham: data.dosham || data.Dosham || prev.dosham,
        dob: data.dob || prev.dob,
        tob: data.time || prev.tob,
        pob: data.place || prev.pob,
        caste: data.caste || data.Caste || prev.caste,
        gotram: data.gotram || data.Gotram || prev.gotram,
        education: data.education || data.Education || prev.education,
        job_title: data.job_title || data.JobTitle || prev.job_title,
        company: data.company || data.Company || prev.company,
        salary_ctc: data.salary_ctc || data.Salary || prev.salary_ctc,
      }));
      if (data.raw_text) {
        setExtractedText(data.raw_text);
        setShowRawText(true);
      }
      showNotification("Information extracted successfully! Check the fields below.", "success");
    } catch (error) {
      console.error("Error extracting details", error);
      showNotification("Failed to extract information from the file.", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSmartExtract = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    extractFromFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      extractFromFile(file);
      
      // Also attach it to the proposal files!
      if (file.type.startsWith('image/')) {
        setPhotosToUpload(prev => [...prev, file]);
        showNotification("Image pasted and added to Profile Photos", "success");
      } else if (file.type === 'application/pdf') {
        setPdfToUpload(file);
        showNotification("PDF pasted and attached", "success");
      }
    }
  };

  const clearIndexedDBFiles = async () => {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('MappDraftsDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = db.transaction('draft_files', 'readwrite');
      const store = tx.objectStore('draft_files');
      store.clear();
    } catch (e) {
      console.error("Failed to clear DB", e);
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
      
      // We need a unique ID for the folder since we don't have proposal ID yet
      const tempId = Date.now().toString();
      
      if (photosToUpload.length > 0) {
        showNotification("Uploading photos to Supabase...", "success");
        for (const file of photosToUpload) {
          const filePath = `${tempId}/photos/${file.name}`;
          const { error } = await supabase.storage.from('mtrack').upload(filePath, file);
          if (error) throw error;
          const { data } = supabase.storage.from('mtrack').getPublicUrl(filePath);
          photoUrls.push(data.publicUrl);
        }
      }
      
      if (pdfToUpload) {
        showNotification("Uploading PDF to Supabase...", "success");
        const filePath = `${tempId}/pdf/${pdfToUpload.name}`;
        const { error } = await supabase.storage.from('mtrack').upload(filePath, pdfToUpload);
        if (error) throw error;
        const { data } = supabase.storage.from('mtrack').getPublicUrl(filePath);
        finalPdfUrl = data.publicUrl;
      }

      // 2. Create Proposal with URLs included
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        is_working: formData.is_working === 'yes',
        dob: formData.dob || null,
        tob: formData.tob || null, 
        created_at: formData.created_at ? new Date(formData.created_at).toISOString() : null,
        received_date: formData.received_date ? new Date(formData.received_date).toISOString() : null,
        photo_urls: photoUrls,
        pdf_url: finalPdfUrl
      };

      const response = await api.post('/api/v1/proposals', payload);
      
      // Clear drafts on successful submit
      await clearIndexedDBFiles();
      localStorage.removeItem('proposal_draft');
      setIsDirty(false);
      
      const newProposalId = response.data.id;
      
      showNotification("Proposal created successfully!", "success");
      setTimeout(() => navigate(`/vendor/proposals/${newProposalId}`), 1000);
    } catch (error) {
      console.error("Error submitting proposal", error);
      setIsSubmitting(false);
      showNotification("Failed to create proposal", "error");
    }
  };

  // Block navigation if dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  const saveDraft = async () => {
    localStorage.setItem('proposal_draft', JSON.stringify(formData));
    
    // Save files to IndexedDB
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('MappDraftsDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = db.transaction('draft_files', 'readwrite');
      const store = tx.objectStore('draft_files');
      if (photosToUpload.length > 0) store.put(photosToUpload, 'photos');
      else store.delete('photos');
      
      if (pdfToUpload) store.put(pdfToUpload, 'pdf');
      else store.delete('pdf');
    } catch (e) {
      console.error("Failed to save files to DB", e);
    }

    setIsDirty(false);
    showNotification("Draft saved successfully.", "success");
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const discardDraft = () => {
    localStorage.removeItem('proposal_draft');
    clearIndexedDBFiles();
    setIsDirty(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const publishFromModal = () => {
    // We need to trigger the form submit but we are outside the form
    // Let's create a fake event
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    if (blocker.state === "blocked") {
      // blocker will proceed after submit via navigate()
    }
  };

  return (
    <>
      <div className="animate-in" onPaste={handlePaste}>
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">Create New Proposal</h2>
          <p style={{ marginTop: '8px', marginBottom: 0 }}>Add a new prospect to your marriage proposal database.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" form="add-proposal-form" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving & Uploading...' : 'Save Proposal'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px' }}>
        {/* Smart Extraction Section */}
        <div className="card" style={{ background: 'var(--accent-light)', border: '1px dashed var(--accent-primary)', marginBottom: '32px' }}>
          <h4 style={{ color: 'var(--accent-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Smart Biodata Extraction
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Upload a biodata photo or PDF to instantly extract and pre-fill the form below. <strong>You can also paste (Ctrl+V) an image anywhere on this page!</strong></p>
          <input type="file" accept="image/*,.pdf" onChange={handleSmartExtract} disabled={isExtracting} style={{ display: 'block', width: '100%' }} />
          {isExtracting && <span style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', display: 'block', marginTop: '8px' }}>Extracting information... Please wait.</span>}
        </div>

        <form id="add-proposal-form" onSubmit={handleSubmit} style={{ display: 'flex', gap: '32px', alignItems: 'start', position: 'relative' }}>
          
          {/* Sticky Sidebar Navigation */}
          <nav style={{ flex: '0 0 250px', position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h5 style={{ margin: '0 0 16px 0', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Navigation</h5>
            <a href="#section-personal" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, background: 'var(--bg-hover)' }}>1. Personal Details</a>
            <a href="#section-astrology" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>2. Astrology</a>
            <a href="#section-career" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>3. Education & Career</a>
            <a href="#section-family" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>4. Family Details</a>
            <a href="#section-contact" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>5. Contact & Files</a>
            <a href="#section-source" style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>6. Source & Expectations</a>
          </nav>

          {/* Main Form Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Section 1: Personal Info */}
            <div id="section-personal" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>1. Personal Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0, paddingBottom: '16px', borderBottom: '1px dashed var(--border-color)' }}>
              <label style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Date Logged in System (Optional - Defaults to Now)</label>
              <CustomDateTimePicker value={formData.created_at} onChange={val => setFormData({...formData, created_at: val})} />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>This is just when you add it to the app.</p>
            </div>
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

            {/* Section 5: Contact & Attachments */}
            <div id="section-contact" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>5. Contact Info & Attachments</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
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

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
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
                <h5 style={{ margin: '0 0 8px', fontSize: '1rem', color: 'var(--text-primary)' }}>Profile Photos</h5>
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
                    {photosToUpload.length} photo(s) selected
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
                <h5 style={{ margin: '0 0 8px', fontSize: '1rem', color: 'var(--text-primary)' }}>Biodata PDF</h5>
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

            {/* Section 6: Source & Expectations */}
            <div id="section-source" className="card" style={{ scrollMarginTop: '24px' }}>
              <h4 style={{ margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>6. Proposal Source & Expectations</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Date Received</label>
                  <CustomDateTimePicker value={formData.received_date} onChange={val => setFormData({...formData, received_date: val})} />
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>When did you actually get this proposal?</p>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Referred By / Who brought this proposal?</label>
                  <input type="text" className="input-field" name="referred_by" value={formData.referred_by} onChange={handleInputChange} placeholder="e.g. Uncle Ramesh, Mutual Friend, Bharat Matrimony" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label>Expectations</label>
                  <textarea className="input-field" name="expectations" value={formData.expectations} onChange={handleInputChange} placeholder="e.g. They are looking for a working partner in Bangalore." style={{ minHeight: '100px' }}></textarea>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      </div>

      {/* Floating Raw Text Popup */}
      {extractedText && showRawText && (
        <div className="card animate-in" style={{ position: 'fixed', left: `${popupPos.x}px`, top: `${popupPos.y}px`, width: '380px', height: '350px', minWidth: '300px', minHeight: '200px', zIndex: 9999, padding: '0', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid var(--accent-primary)', resize: 'both', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Draggable Header */}
          <div 
            onMouseDown={handleMouseDown}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--accent-light)', cursor: 'grab', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}
          >
            <h4 style={{ margin: 0, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Raw Extracted Text
            </h4>
            <button type="button" onClick={() => setShowRawText(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>&times;</button>
          </div>
          
          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0 }}>Drag this panel anywhere. Copy any missed details from here.</p>
            <textarea 
              className="input-field" 
              readOnly 
              value={extractedText} 
              style={{ width: '100%', flex: 1, resize: 'none', background: 'var(--bg-body)', fontSize: '0.8rem', fontFamily: 'monospace', padding: '12px', margin: 0 }} 
            />
          </div>
        </div>
      )}

      {extractedText && !showRawText && (
        <button 
          onClick={() => setShowRawText(true)}
          style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, padding: '12px 20px', borderRadius: '30px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-md)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Show Extracted Text
        </button>
      )}

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

      {/* Navigation Blocker Modal */}
      {blocker.state === "blocked" && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 999999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-in" style={{ width: '400px', background: 'var(--bg-body)', padding: '24px', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Unsaved Changes</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)' }}>You are trying to leave with unsaved changes. What would you like to do?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={publishFromModal} style={{ padding: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>Publish Proposal</button>
              <button onClick={saveDraft} style={{ padding: '12px', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>Save as Draft</button>
              <button onClick={discardDraft} style={{ padding: '12px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>Discard & Leave</button>
              <button onClick={() => blocker.reset()} style={{ padding: '12px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', marginTop: '8px' }}>Cancel (Stay here)</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default AddProposal;
