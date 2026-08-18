import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import OCRReviewModal from '../../components/ocr/OCRReviewModal';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';

interface ProposalPhoto {
  id: number;
  photo_url: string;
}

interface ProposalQuestion {
  id: number;
  asked_by: string;
  question_text: string;
  expectations: string | null;
  created_at: string;
}

interface ProposalDiscussion {
  id: number;
  status_stage: string;
  note: string;
  created_at: string;
}

interface ProposalFeedback {
  id: number;
  feedback_from: string;
  message: string;
  created_at: string;
}

interface Proposal {
  id: number;
  name: string;
  age: number | null;
  current_city: string | null;
  status: string;
  
  dob: string | null;
  tob: string | null;
  pob: string | null;
  height: string | null;
  weight: string | null;
  complexion: string | null;
  
  religion: string | null;
  caste: string | null;
  sub_caste: string | null;
  gotram: string | null;
  rasi: string | null;
  nakshatra: string | null;
  paadam: string | null;
  dosham: string | null;
  
  education: string | null;
  college_details: string | null;
  is_working: boolean;
  company: string | null;
  job_title: string | null;
  work_location: string | null;
  salary_ctc: string | null;
  
  father_name: string | null;
  father_occupation: string | null;
  mother_name: string | null;
  mother_occupation: string | null;
  siblings_details: string | null;
  house_address: string | null;
  
  father_number: string | null;
  mother_number: string | null;
  personal_number: string | null;
  instagram_id: string | null;
  
  photos: ProposalPhoto[];
  discussions: ProposalDiscussion[];
  questions: ProposalQuestion[];
  feedbacks: ProposalFeedback[];
  pdf_url: string | null;
  created_at: string;
  received_date: string | null;
  referred_by: string | null;
  expectations: string | null;
}

const timeAgo = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const remainingHours = diffInHours % 24;
  if (diffInDays === 1) {
    return remainingHours > 0 ? `1 day, ${remainingHours}h ago` : `1 day ago`;
  }
  return remainingHours > 0 ? `${diffInDays} days, ${remainingHours}h ago` : `${diffInDays} days ago`;
};

const DetailRow = ({ label, value }: { label: string, value: any }) => (
  <div style={{ marginBottom: '16px' }}>
    <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</p>
    <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value || '-'}</p>
  </div>
);

const ProposalDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  
  // OCR State
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrData, setOcrData] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  
  // Copy Modal State
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyText, setCopyText] = useState("");
  
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'questions' | 'feedback'>('overview');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await api.get(`/api/v1/proposals/${id}`);
        setProposal(response.data);
      } catch (error) {
        console.error("Error fetching proposal details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this proposal entirely?")) {
      try {
        await api.delete(`/api/v1/proposals/${id}`);
        navigate('/vendor/proposals');
      } catch (error) {
        console.error("Error deleting proposal", error);
      }
    }
  };

  const handleCopy = () => {
    if (!proposal) return;
    
    const sections = [];
    
    // Source & Expectations
    sections.push(`*SOURCE & EXPECTATIONS*
Received Date: ${proposal.received_date ? new Date(proposal.received_date).toLocaleDateString() : 'Not specified'}
Referred By: ${proposal.referred_by || 'Not specified'}
Expectations: ${proposal.expectations || 'Not specified'}`);

    // Personal
    sections.push(`*PERSONAL DETAILS*
Name: ${proposal.name}
Age: ${proposal.age ? `${proposal.age} yrs` : 'Not specified'}
Date of Birth: ${proposal.dob || 'Not specified'}
Time of Birth: ${proposal.tob || 'Not specified'}
Place of Birth: ${proposal.pob || 'Not specified'}
Height: ${proposal.height || 'Not specified'}
Weight: ${proposal.weight || 'Not specified'}
Complexion: ${proposal.complexion || 'Not specified'}
Current City: ${proposal.current_city || 'Not specified'}`);

    // Astrology
    sections.push(`*ASTROLOGY & BACKGROUND*
Religion: ${proposal.religion || 'Not specified'}
Caste: ${proposal.caste || 'Not specified'}
Sub-Caste: ${proposal.sub_caste || 'Not specified'}
Gotram: ${proposal.gotram || 'Not specified'}
Rasi: ${proposal.rasi || 'Not specified'}
Nakshatra: ${proposal.nakshatra || 'Not specified'}
Paadam: ${proposal.paadam || 'Not specified'}
Dosham: ${proposal.dosham || 'Not specified'}`);

    // Education & Career
    sections.push(`*EDUCATION & CAREER*
Education: ${proposal.education || 'Not specified'}
College: ${proposal.college_details || 'Not specified'}
Working: ${proposal.is_working ? 'Yes' : 'No'}
Company: ${proposal.company || 'Not specified'}
Job Title: ${proposal.job_title || 'Not specified'}
Work Location: ${proposal.work_location || 'Not specified'}
Income/CTC: ${proposal.salary_ctc || 'Not specified'}`);

    // Family
    sections.push(`*FAMILY DETAILS*
Father's Name: ${proposal.father_name || 'Not specified'}
Father's Occupation: ${proposal.father_occupation || 'Not specified'}
Mother's Name: ${proposal.mother_name || 'Not specified'}
Mother's Occupation: ${proposal.mother_occupation || 'Not specified'}
Siblings: ${proposal.siblings_details || 'Not specified'}
House Address: ${proposal.house_address || 'Not specified'}`);

    // Contact
    sections.push(`*CONTACT INFO*
Father's No: ${proposal.father_number || 'Not specified'}
Mother's No: ${proposal.mother_number || 'Not specified'}
Personal No: ${proposal.personal_number || 'Not specified'}
Instagram: ${proposal.instagram_id || 'Not specified'}`);

    setCopyText(sections.join('\n\n'));
    setShowCopyModal(true);
  };
  
  const copyFullText = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      alert("Full details copied to clipboard!");
      setShowCopyModal(false);
    }).catch(err => {
      console.error("Failed to copy details", err);
      alert("Failed to copy details");
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'pdf') => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      if (type === 'photo') {
        const files = Array.from(e.target.files);
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          await api.post(`/api/v1/proposals/${id}/upload?file_type=photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      } else {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        await api.post(`/api/v1/proposals/${id}/upload?file_type=pdf`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Refresh proposal to get new photos/pdf
      const response = await api.get(`/api/v1/proposals/${id}`);
      setProposal(response.data);
    } catch (error) {
      console.error("Error uploading file", error);
      alert("Failed to upload file");
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (window.confirm(`Are you sure you want to remove this photo?`)) {
      try {
        await api.delete(`/api/v1/proposals/${id}/photo/${photoId}`);
        setProposal(prev => prev ? {
          ...prev,
          photos: prev.photos.filter(p => p.id !== photoId)
        } : null);
      } catch (error) {
        console.error("Error deleting photo", error);
        alert("Failed to delete photo");
      }
    }
  };

  const handleDeletePdf = async () => {
    if (window.confirm(`Are you sure you want to remove the uploaded PDF?`)) {
      try {
        await api.delete(`/api/v1/proposals/${id}/file/pdf`);
        setProposal(prev => prev ? { ...prev, pdf_url: null } : null);
      } catch (error) {
        console.error("Error deleting PDF", error);
        alert("Failed to delete PDF");
      }
    }
  };

  const handleTriggerOCR = async (type: 'photo' | 'pdf') => {
    setOcrLoading(true);
    try {
      const response = await api.post(`/api/v1/proposals/${id}/ocr?file_type=${type}`);
      setOcrData(response.data);
      setShowOCRModal(true);
    } catch (error) {
      console.error("Error triggering OCR", error);
      alert("Failed to extract data via OCR");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSaveOCR = async (data: any) => {
    try {
      const { raw_text, ...saveData } = data;
      const updatedProposal = { ...proposal, ...saveData };
      await api.put(`/api/v1/proposals/${id}`, updatedProposal);
      setProposal(updatedProposal as Proposal);
      setShowOCRModal(false);
    } catch (error) {
      console.error("Error saving OCR data", error);
      alert("Failed to save OCR data");
    }
  };

  const [newDiscussionNote, setNewDiscussionNote] = useState('');
  const [newDiscussionStage, setNewDiscussionStage] = useState('DISCUSSION');
  const [newDiscussionDate, setNewDiscussionDate] = useState('');
  const [isSubmittingDiscussion, setIsSubmittingDiscussion] = useState(false);

  const [newQuestionAskedBy, setNewQuestionAskedBy] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionExpectations, setNewQuestionExpectations] = useState('');
  const [newQuestionDate, setNewQuestionDate] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  const [newFeedbackFrom, setNewFeedbackFrom] = useState('');
  const [newFeedbackMessage, setNewFeedbackMessage] = useState('');
  const [newFeedbackDate, setNewFeedbackDate] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleAddDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionNote.trim()) return;

    setIsSubmittingDiscussion(true);
    try {
      const payload: any = {
        status_stage: newDiscussionStage,
        note: newDiscussionNote
      };
      if (newDiscussionDate) {
        payload.created_at = new Date(newDiscussionDate).toISOString();
      }
      await api.post(`/api/v1/proposals/${id}/discussions`, payload);
      // Refresh proposal
      const response = await api.get(`/api/v1/proposals/${id}`);
      setProposal(response.data);
      setNewDiscussionNote('');
      setNewDiscussionDate('');
    } catch (error) {
      console.error("Error adding discussion", error);
      alert("Failed to add discussion note");
    } finally {
      setIsSubmittingDiscussion(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionAskedBy.trim() || !newQuestionText.trim()) return;

    setIsSubmittingQuestion(true);
    try {
      const payload: any = {
        asked_by: newQuestionAskedBy,
        question_text: newQuestionText,
        expectations: newQuestionExpectations
      };
      if (newQuestionDate) {
        payload.created_at = new Date(newQuestionDate).toISOString();
      }
      await api.post(`/api/v1/proposals/${id}/questions`, payload);
      // Refresh proposal
      const response = await api.get(`/api/v1/proposals/${id}`);
      setProposal(response.data);
      setNewQuestionAskedBy('');
      setNewQuestionText('');
      setNewQuestionExpectations('');
      setNewQuestionDate('');
    } catch (error) {
      console.error("Error adding question", error);
      alert("Failed to add question");
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackFrom.trim() || !newFeedbackMessage.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      const payload: any = {
        feedback_from: newFeedbackFrom,
        message: newFeedbackMessage
      };
      if (newFeedbackDate) {
        payload.created_at = new Date(newFeedbackDate).toISOString();
      }
      await api.post(`/api/v1/proposals/${id}/feedbacks`, payload);
      // Refresh proposal
      const response = await api.get(`/api/v1/proposals/${id}`);
      setProposal(response.data);
      setNewFeedbackFrom('');
      setNewFeedbackMessage('');
      setNewFeedbackDate('');
    } catch (error) {
      console.error("Error adding feedback", error);
      alert("Failed to log feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updatedProposal = { ...proposal, status: newStatus };
      await api.put(`/api/v1/proposals/${id}`, updatedProposal);
      setProposal(updatedProposal as Proposal);
    } catch (error) {
      console.error("Error updating status", error);
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="animate-in" style={{ padding: '40px', textAlign: 'center' }}><p>Loading...</p></div>;
  if (!proposal) return <div className="animate-in" style={{ padding: '40px', textAlign: 'center' }}><p>Proposal not found.</p></div>;

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

  return (
    <>
      <div className="animate-in" style={{ paddingBottom: '60px' }}>
        <div style={{ marginBottom: '16px' }}>
          <button 
            onClick={() => navigate('/vendor/proposals')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '8px 12px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Proposals
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', background: 'var(--bg-body)', padding: '32px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{proposal.name}</h2>
              <button 
                onClick={handleCopy}
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                title="Copy Details"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div className={`badge badge-${proposal.status === 'IN_PROGRESS' ? 'success' : proposal.status === 'REJECTED' ? 'danger' : 'secondary'}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '0', position: 'relative' }}>
                <select 
                  value={proposal.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '6px 28px 6px 12px', border: 'none', outline: 'none', cursor: 'pointer', appearance: 'none', background: 'transparent', color: 'inherit', fontWeight: 600, width: '100%', fontFamily: 'inherit' }}
                >
                  <option value="IN_PROGRESS" style={{color: 'black'}}>IN PROGRESS</option>
                  <option value="SHORTLISTED" style={{color: 'black'}}>SHORTLISTED</option>
                  <option value="DISCUSSION" style={{color: 'black'}}>DISCUSSION</option>
                  <option value="PARENTS_MEET" style={{color: 'black'}}>PARENTS MEET</option>
                  <option value="FINALIZED" style={{color: 'black'}}>FINALIZED</option>
                  <option value="REJECTED" style={{color: 'black'}}>REJECTED</option>
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: '10px', pointerEvents: 'none' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{proposal.age ? `${proposal.age} years old` : 'Age not specified'}</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{proposal.current_city || 'Location not specified'}</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{proposal.education || 'Education not specified'}</span>
              
              {proposal.created_at && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Added {timeAgo(proposal.created_at)}</span>
                </>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="btn btn-outline" 
              style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => {
                setActiveTab('activity');
                setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              Add Discussion
            </button>
            <button 
              className="btn btn-primary" 
              style={{ padding: '10px 24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => navigate(`/vendor/proposals/${id}/edit`)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edit Details
            </button>
            <div style={{ width: '1px', height: '32px', background: 'var(--border-color)', margin: '0 4px' }}></div>
            <button 
              onClick={handleDelete}
              style={{ background: 'rgba(255, 59, 48, 0.1)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#FF3B30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              title="Delete Proposal"
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('overview')} 
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'overview' ? '2px solid var(--accent-primary)' : '2px solid transparent', padding: '8px 16px', cursor: 'pointer', fontWeight: activeTab === 'overview' ? 600 : 400, color: activeTab === 'overview' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
        >Overview</button>
        <button 
          onClick={() => setActiveTab('activity')}
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'activity' ? '2px solid var(--accent-primary)' : '2px solid transparent', padding: '8px 16px', cursor: 'pointer', fontWeight: activeTab === 'activity' ? 600 : 400, color: activeTab === 'activity' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
        >Log New Activity</button>
        <button 
          onClick={() => setActiveTab('questions')}
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'questions' ? '2px solid var(--accent-primary)' : '2px solid transparent', padding: '8px 16px', cursor: 'pointer', fontWeight: activeTab === 'questions' ? 600 : 400, color: activeTab === 'questions' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
        >Log New Question</button>
        <button 
          onClick={() => setActiveTab('feedback')}
          style={{ background: 'none', border: 'none', borderBottom: activeTab === 'feedback' ? '2px solid var(--accent-primary)' : '2px solid transparent', padding: '8px 16px', cursor: 'pointer', fontWeight: activeTab === 'feedback' ? 600 : 400, color: activeTab === 'feedback' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
        >Log Feedback</button>
      </div>

      {activeTab === 'overview' && (
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Left Column: Huge Details */}
        <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-primary)' }}>
            <h4 style={{ marginBottom: '24px', color: 'var(--accent-primary)' }}>Proposal Source & Expectations</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <DetailRow label="Date Received" value={proposal.received_date ? new Date(proposal.received_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', hour12: true }) : '-'} />
              <DetailRow label="Referred By / Brought By" value={proposal.referred_by} />
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailRow label="Expectations" value={proposal.expectations} />
              </div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '24px', color: 'var(--accent-primary)' }}>Personal Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <DetailRow label="Name" value={proposal.name} />
              <DetailRow label="Date of Birth" value={proposal.dob} />
              <DetailRow label="Time of Birth" value={proposal.tob} />
              <DetailRow label="Place of Birth" value={proposal.pob} />
              <DetailRow label="Age" value={proposal.age} />
              <DetailRow label="Current City" value={proposal.current_city} />
              <DetailRow label="Height" value={proposal.height} />
              <DetailRow label="Weight" value={proposal.weight} />
              <DetailRow label="Complexion" value={proposal.complexion} />
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '24px', color: 'var(--accent-primary)' }}>Astrology & Background</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <DetailRow label="Religion" value={proposal.religion} />
              <DetailRow label="Caste" value={proposal.caste} />
              <DetailRow label="Sub Caste" value={proposal.sub_caste} />
              <DetailRow label="Gotram" value={proposal.gotram} />
              <DetailRow label="Raasi" value={proposal.rasi} />
              <DetailRow label="Nakshatram" value={proposal.nakshatra} />
              <DetailRow label="Paadam" value={proposal.paadam} />
              <DetailRow label="Dosham" value={proposal.dosham} />
            </div>
          </div>
          
          <div className="card">
            <h4 style={{ marginBottom: '24px', color: 'var(--accent-primary)' }}>Education & Career</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <DetailRow label="Highest Education" value={proposal.education} />
              <DetailRow label="College Details" value={proposal.college_details} />
              <DetailRow label="Working Status" value={proposal.is_working ? "Yes" : "No"} />
              {proposal.is_working && (
                <>
                  <DetailRow label="Company" value={proposal.company} />
                  <DetailRow label="Job Title / Role" value={proposal.job_title} />
                  <DetailRow label="Work Location" value={proposal.work_location} />
                  <DetailRow label="Salary / CTC" value={proposal.salary_ctc} />
                </>
              )}
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '24px', color: 'var(--accent-primary)' }}>Family Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <DetailRow label="Father's Name & Occ." value={proposal.father_name ? `${proposal.father_name} (${proposal.father_occupation || 'N/A'})` : '-'} />
              <DetailRow label="Mother's Name & Occ." value={proposal.mother_name ? `${proposal.mother_name} (${proposal.mother_occupation || 'N/A'})` : '-'} />
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailRow label="Siblings Details" value={proposal.siblings_details} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <DetailRow label="House Address" value={proposal.house_address} />
              </div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '24px', color: 'var(--accent-primary)' }}>Contact Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <DetailRow label="Personal Phone" value={proposal.personal_number} />
              <DetailRow label="Instagram ID" value={proposal.instagram_id} />
              <DetailRow label="Father's Phone" value={proposal.father_number} />
              <DetailRow label="Mother's Phone" value={proposal.mother_number} />
            </div>
          </div>

        </div>

        {/* Right Column: Files & Actions */}
        <div style={{ flex: '1 1 35%', minWidth: '320px' }}>
          <div className="card">
            <h4 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Photo Gallery</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {proposal.photos && proposal.photos.length > 0 ? (
                proposal.photos.map(photo => (
                  <div key={photo.id} style={{ position: 'relative' }}>
                    <img 
                      src={`${backendUrl}${photo.photo_url}`} 
                      alt="Proposal" 
                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} 
                    />
                    <button 
                      onClick={() => handleDeletePhoto(photo.id)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      &times;
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>No photos uploaded.</p>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
              <label className="btn btn-outline" style={{ display: 'block', textAlign: 'center' }}>
                Upload More Photos <input type="file" multiple hidden accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
              </label>
              {proposal.photos.length > 0 && (
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => handleTriggerOCR('photo')} disabled={ocrLoading}>
                  {ocrLoading ? 'Extracting from Photo...' : 'Smart Extract from Primary Photo'}
                </button>
              )}
            </div>

            <h4 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Biodata Document</h4>
            
            <div>
              {proposal.pdf_url ? (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <a href={`${backendUrl}${proposal.pdf_url}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1 }}>View PDF</a>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleTriggerOCR('pdf')} disabled={ocrLoading}>
                      {ocrLoading ? 'Extracting...' : 'Smart Extract'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label className="btn btn-outline" style={{ flex: 1, textAlign: 'center', margin: 0 }}>
                      Replace <input type="file" hidden accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdf')} />
                    </label>
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeletePdf}>Remove</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.875rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>No PDF uploaded.</p>
                  <label className="btn btn-outline" style={{ display: 'inline-block' }}>
                    Upload PDF <input type="file" hidden accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdf')} />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

          {activeTab === 'activity' && (
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          Activity & Pipeline History
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--bg-body)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{ marginBottom: '16px' }}>Log New Activity</h4>
              <form onSubmit={handleAddDiscussion}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Date & Time (Optional)</label>
                  <CustomDateTimePicker 
                    value={newDiscussionDate}
                    onChange={(val) => setNewDiscussionDate(val)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Update Stage To:</label>
                  <select className="input-field" value={newDiscussionStage} onChange={(e) => setNewDiscussionStage(e.target.value)}>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="PARENTS_MEET">Parents Meet</option>
                    <option value="FINALIZED">Finalized</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Detailed Discussion Notes</label>
                  <textarea 
                    className="input-field" 
                    style={{ minHeight: '150px', resize: 'vertical' }}
                    placeholder="Record all details here:&#10;- Who did you speak to?&#10;- What conditions were discussed?&#10;- What are the next steps?"
                    value={newDiscussionNote}
                    onChange={(e) => setNewDiscussionNote(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingDiscussion} style={{ width: '100%', padding: '12px' }}>
                  {isSubmittingDiscussion ? 'Logging Activity...' : 'Log Activity & Update Stage'}
                </button>
              </form>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h4 style={{ marginBottom: '16px' }}>Activity Timeline</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '8px' }}>
              {proposal.discussions && proposal.discussions.length > 0 ? (
                proposal.discussions.map(disc => (
                  <div key={disc.id} style={{ display: 'flex', gap: '20px', borderLeft: '2px solid var(--border-color)', paddingLeft: '24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-9px', top: '0', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent-primary)', border: '3px solid white' }}></div>
                    <div style={{ background: 'var(--bg-body)', padding: '16px', borderRadius: 'var(--radius-md)', width: '100%', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className={`badge badge-${disc.status_stage === 'FINALIZED' ? 'success' : disc.status_stage === 'REJECTED' ? 'danger' : 'secondary'}`} style={{ fontSize: '0.875rem' }}>
                          Moved to: {disc.status_stage}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          {new Date(disc.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })} ({timeAgo(disc.created_at)})
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{disc.note}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No discussion history yet.</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Use the form on the left to start logging activities and tracking progress.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'questions' && (
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Questions & Expectations
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--bg-body)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{ marginBottom: '16px' }}>Log New Question</h4>
              <form onSubmit={handleAddQuestion}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Date & Time (Optional)</label>
                  <CustomDateTimePicker 
                    value={newQuestionDate}
                    onChange={(val) => setNewQuestionDate(val)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Who Asked?</label>
                  <input 
                    type="text"
                    className="input-field" 
                    placeholder="e.g. Groom's Father, Bride's Mother"
                    value={newQuestionAskedBy}
                    onChange={(e) => setNewQuestionAskedBy(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Question / Query</label>
                  <textarea 
                    className="input-field" 
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="What was the question?"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Expectations (Optional)</label>
                  <textarea 
                    className="input-field" 
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="What is their expectation regarding this topic?"
                    value={newQuestionExpectations}
                    onChange={(e) => setNewQuestionExpectations(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingQuestion} style={{ width: '100%', padding: '12px' }}>
                  {isSubmittingQuestion ? 'Logging...' : 'Log Question'}
                </button>
              </form>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h4 style={{ marginBottom: '16px' }}>Logged Questions & Expectations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '8px' }}>
              {proposal.questions && proposal.questions.length > 0 ? (
                proposal.questions.map(q => (
                  <div key={q.id} style={{ display: 'flex', gap: '20px', borderLeft: '2px solid var(--border-color)', paddingLeft: '24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-9px', top: '0', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent-primary)', border: '3px solid white' }}></div>
                    <div style={{ background: 'var(--bg-body)', padding: '16px', borderRadius: 'var(--radius-md)', width: '100%', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          Asked by: <span style={{ color: 'var(--accent-primary)' }}>{q.asked_by}</span>
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          {new Date(q.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })} ({timeAgo(q.created_at)})
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Question</span>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{q.question_text}</p>
                      </div>

                      {q.expectations && (
                        <div style={{ background: 'rgba(255, 143, 0, 0.05)', padding: '12px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-primary)' }}>
                          <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: '4px', fontWeight: '600' }}>Expectations</span>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{q.expectations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No questions logged yet.</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Use the form on the left to start tracking questions and expectations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'feedback' && (
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          Feedback History
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--bg-body)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{ marginBottom: '16px' }}>Log Feedback</h4>
              <form onSubmit={handleAddFeedback}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Date & Time (Optional)</label>
                  <CustomDateTimePicker 
                    value={newFeedbackDate}
                    onChange={(val) => setNewFeedbackDate(val)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Feedback From (Whose side?)</label>
                  <input 
                    type="text"
                    className="input-field" 
                    placeholder="e.g. Groom's Parents, Bride's Brother"
                    value={newFeedbackFrom}
                    onChange={(e) => setNewFeedbackFrom(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600 }}>Feedback Message</label>
                  <textarea 
                    className="input-field" 
                    style={{ minHeight: '120px', resize: 'vertical' }}
                    placeholder="What did they say? (e.g. They liked the profile but need time to think, or they want more photos.)"
                    value={newFeedbackMessage}
                    onChange={(e) => setNewFeedbackMessage(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingFeedback} style={{ width: '100%', padding: '12px' }}>
                  {isSubmittingFeedback ? 'Logging...' : 'Log Feedback'}
                </button>
              </form>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h4 style={{ marginBottom: '16px' }}>Logged Feedbacks</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '8px' }}>
              {proposal.feedbacks && proposal.feedbacks.length > 0 ? (
                proposal.feedbacks.map(f => (
                  <div key={f.id} style={{ display: 'flex', gap: '20px', borderLeft: '2px solid var(--border-color)', paddingLeft: '24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-9px', top: '0', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent-primary)', border: '3px solid white' }}></div>
                    <div style={{ background: 'var(--bg-body)', padding: '16px', borderRadius: 'var(--radius-md)', width: '100%', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          From: <span style={{ color: 'var(--accent-primary)' }}>{f.feedback_from}</span>
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          {new Date(f.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })} ({timeAgo(f.created_at)})
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: '4px' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Message</span>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{f.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No feedbacks logged yet.</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Use the form on the left to start tracking feedback from both sides.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
      </div>

      <OCRReviewModal  
        show={showOCRModal} 
        data={ocrData} 
        onClose={() => setShowOCRModal(false)} 
        onSave={handleSaveOCR} 
      />

      {/* Copy Modal */}
      {showCopyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-in" style={{ width: '90%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Copy Proposal Details</h3>
              <button onClick={() => setShowCopyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>You can edit or copy specific parts of the text below, or copy everything at once.</p>
            
            <textarea 
              value={copyText}
              onChange={(e) => setCopyText(e.target.value)}
              style={{ width: '100%', height: '200px', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical', marginBottom: '24px' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button className="btn btn-outline" onClick={() => setShowCopyModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={copyFullText}>Copy Fully</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProposalDetails;
