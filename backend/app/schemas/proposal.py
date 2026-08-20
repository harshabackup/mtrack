from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date, time

class ProposalPhotoBase(BaseModel):
    photo_url: str

class ProposalPhotoResponse(ProposalPhotoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int

class ProposalMedicalRecordBase(BaseModel):
    record_url: str
    record_name: Optional[str] = None

class ProposalMedicalRecordCreate(ProposalMedicalRecordBase):
    pass

class ProposalMedicalRecordResponse(ProposalMedicalRecordBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    proposal_id: int
    created_at: datetime

class ProposalDiscussionBase(BaseModel):
    status_stage: str
    note: str

class ProposalDiscussionCreate(ProposalDiscussionBase):
    created_at: Optional[datetime] = None

class ProposalDiscussionUpdate(BaseModel):
    status_stage: Optional[str] = None
    note: Optional[str] = None

class ProposalDiscussionResponse(ProposalDiscussionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    proposal_id: int
    created_at: datetime

class ProposalQuestionBase(BaseModel):
    asked_by: str
    question_text: str
    expectations: Optional[str] = None

class ProposalQuestionCreate(ProposalQuestionBase):
    created_at: Optional[datetime] = None

class ProposalQuestionUpdate(BaseModel):
    asked_by: Optional[str] = None
    question_text: Optional[str] = None
    expectations: Optional[str] = None

class ProposalQuestionResponse(ProposalQuestionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    proposal_id: int
    created_at: datetime

class ProposalFeedbackBase(BaseModel):
    feedback_from: str
    message: str

class ProposalFeedbackCreate(ProposalFeedbackBase):
    created_at: Optional[datetime] = None

class ProposalFeedbackUpdate(BaseModel):
    feedback_from: Optional[str] = None
    message: Optional[str] = None

class ProposalFeedbackResponse(ProposalFeedbackBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    proposal_id: int
    created_at: datetime

class ProposalExpenseBase(BaseModel):
    category: str
    description: str
    amount: float
    paid_by: Optional[str] = None
    date: datetime

class ProposalExpenseCreate(ProposalExpenseBase):
    pass

class ProposalExpenseUpdate(BaseModel):
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    paid_by: Optional[str] = None
    date: Optional[datetime] = None

class ProposalExpenseResponse(ProposalExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    proposal_id: int
    created_at: datetime

class ProposalBase(BaseModel):
    name: str
    age: Optional[int] = None
    current_city: Optional[str] = None
    status: Optional[str] = "IN_PROGRESS"
    rejection_reason: Optional[str] = None
    reopen_reason: Optional[str] = None
    
    # Personal Info Expansion
    dob: Optional[str] = None
    tob: Optional[str] = None
    pob: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    complexion: Optional[str] = None
    
    # Astrology Background Fields
    religion: Optional[str] = None
    caste: Optional[str] = None
    sub_caste: Optional[str] = None
    gotram: Optional[str] = None
    rasi: Optional[str] = None
    nakshatra: Optional[str] = None
    paadam: Optional[str] = None
    dosham: Optional[str] = None
    
    # Education & Career
    education: Optional[str] = None
    college_details: Optional[str] = None
    is_working: Optional[bool] = False
    company: Optional[str] = None
    job_title: Optional[str] = None
    work_location: Optional[str] = None
    salary_ctc: Optional[str] = None
    
    # Family Details
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_occupation: Optional[str] = None
    siblings_details: Optional[str] = None
    
    # Contact & Address
    house_address: Optional[str] = None
    father_number: Optional[str] = None
    mother_number: Optional[str] = None
    personal_number: Optional[str] = None
    instagram_id: Optional[str] = None
    
    # File Uploads
    pdf_url: Optional[str] = None

    # Proposal Source & Expectations
    received_date: Optional[datetime] = None
    referred_by: Optional[str] = None
    expectations: Optional[str] = None

class ProposalCreate(ProposalBase):
    created_at: Optional[datetime] = None
    photo_urls: Optional[List[str]] = []

class ProposalUpdate(ProposalBase):
    name: Optional[str] = None
    photo_urls: Optional[List[str]] = None
    
class ProposalResponse(ProposalBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    photos: List[ProposalPhotoResponse] = []
    medical_records: List[ProposalMedicalRecordResponse] = []
    discussions: List[ProposalDiscussionResponse] = []
    questions: List[ProposalQuestionResponse] = []
    feedbacks: List[ProposalFeedbackResponse] = []
    expenses: List[ProposalExpenseResponse] = []
