from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    vendor_name: str

class OTPRequest(BaseModel):
    email: EmailStr

class LoginRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    vendor_id: Optional[int]

class InviteRequest(BaseModel):
    email: EmailStr

class AcceptInviteRequest(BaseModel):
    token: str
    full_name: str
    phone: Optional[str] = None
    
    # Proposal Fields
    name: str 
    age: Optional[int] = None
    current_city: Optional[str] = None
    dob: Optional[str] = None
    tob: Optional[str] = None
    pob: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[float] = None
    complexion: Optional[str] = None
    
    religion: Optional[str] = None
    caste: Optional[str] = None
    sub_caste: Optional[str] = None
    gotram: Optional[str] = None
    rasi: Optional[str] = None
    nakshatra: Optional[str] = None
    paadam: Optional[str] = None
    dosham: Optional[str] = None
    
    education: Optional[str] = None
    college_details: Optional[str] = None
    is_working: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    work_location: Optional[str] = None
    salary_ctc: Optional[float] = None
    
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_occupation: Optional[str] = None
    siblings_details: Optional[str] = None
    house_address: Optional[str] = None
    
    personal_number: Optional[str] = None
    father_number: Optional[str] = None
    mother_number: Optional[str] = None
    instagram_id: Optional[str] = None
    expectations: Optional[str] = None
