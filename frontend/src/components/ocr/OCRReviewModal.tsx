import React, { useState, useEffect } from 'react';

interface OCRData {
  name?: string;
  dob?: string;
  time?: string;
  place?: string;
  rasi?: string;
  nakshatra?: string;
  dosham?: string;
  raw_text?: string;
}

interface OCRReviewModalProps {
  show: boolean;
  data: OCRData | null;
  onClose: () => void;
  onSave: (data: OCRData) => void;
}

const OCRReviewModal: React.FC<OCRReviewModalProps> = ({ show, data, onClose, onSave }) => {
  const [formData, setFormData] = useState<OCRData>({});

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Review Extracted Data</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body row">
            <div className="col-md-7">
              <h6>Detected Information</h6>
              <div className="mb-2">
                <label className="form-label small">Name</label>
                <input type="text" className="form-control" name="name" value={formData.name || ''} onChange={handleChange} />
              </div>
              <div className="row mb-2">
                <div className="col">
                  <label className="form-label small">Date of Birth</label>
                  <input type="text" className="form-control" name="dob" value={formData.dob || ''} onChange={handleChange} />
                </div>
                <div className="col">
                  <label className="form-label small">Time of Birth</label>
                  <input type="text" className="form-control" name="time" value={formData.time || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label small">Place of Birth</label>
                <input type="text" className="form-control" name="place" value={formData.place || ''} onChange={handleChange} />
              </div>
              
              <h6 className="mt-4">Astrology</h6>
              <div className="row mb-2">
                <div className="col">
                  <label className="form-label small">Rasi</label>
                  <input type="text" className="form-control" name="rasi" value={formData.rasi || ''} onChange={handleChange} />
                </div>
                <div className="col">
                  <label className="form-label small">Nakshatra</label>
                  <input type="text" className="form-control" name="nakshatra" value={formData.nakshatra || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label small">Dosham</label>
                <input type="text" className="form-control" name="dosham" value={formData.dosham || ''} onChange={handleChange} />
              </div>
            </div>
            
            <div className="col-md-5">
              <h6>Raw OCR Text (Reference)</h6>
              <textarea 
                className="form-control" 
                rows={15} 
                readOnly 
                value={formData.raw_text || 'No text extracted.'}
                style={{ fontSize: '0.8rem', backgroundColor: '#f8f9fa' }}
              />
            </div>
          </div>
          <div className="modal-footer d-flex justify-content-between">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Discard</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>Save Details</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRReviewModal;
