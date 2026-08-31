from sqlalchemy import Column, Integer, String, DateTime, Boolean, Date, Time, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON

class ProposalPhoto(Base):
    __tablename__ = "proposal_photos"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), index=True)
    photo_url = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    proposal = relationship("Proposal", back_populates="photos")


class ProposalMedicalRecord(Base):
    __tablename__ = "proposal_medical_records"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), index=True)
    record_url = Column(String, nullable=False)
    record_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    proposal = relationship("Proposal", back_populates="medical_records")


class ProposalDiscussion(Base):
    __tablename__ = "proposal_discussions"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), index=True)
    status_stage = Column(String, nullable=False) # e.g. DISCUSSION, PARENTS_MEET
    note = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    proposal = relationship("Proposal", back_populates="discussions")


class ProposalQuestion(Base):
    __tablename__ = "proposal_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), index=True)
    asked_by = Column(String, nullable=False) # e.g. Groom's Father
    question_text = Column(String, nullable=False)
    expectations = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    proposal = relationship("Proposal", back_populates="questions")


class ProposalFeedback(Base):
    __tablename__ = "proposal_feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), index=True)
    feedback_from = Column(String, nullable=False) # e.g. Groom's Side
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    proposal = relationship("Proposal", back_populates="feedbacks")


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True) # Will be false after migration
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    name = Column(String, index=True)
    age = Column(Integer, nullable=True)
    current_city = Column(String, nullable=True)
    status = Column(String, default="IN_PROGRESS") # IN_PROGRESS, SHORTLISTED, DISCUSSION, PARENTS_MEET, FINALIZED, REJECTED
    rejection_reason = Column(String, nullable=True)
    reopen_reason = Column(String, nullable=True)    
    vendor = relationship("Vendor", back_populates="proposals")
    
    # Personal Info Expansion
    dob = Column(String, nullable=True)
    tob = Column(String, nullable=True)
    pob = Column(String, nullable=True)
    height = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    complexion = Column(String, nullable=True)
    
    # Astrology & Background Fields
    religion = Column(String, nullable=True)
    caste = Column(String, nullable=True)
    sub_caste = Column(String, nullable=True)
    gotram = Column(String, nullable=True)
    rasi = Column(String, nullable=True)
    nakshatra = Column(String, nullable=True)
    paadam = Column(String, nullable=True)
    dosham = Column(String, nullable=True)
    
    # Education & Career
    education = Column(String, nullable=True)
    college_details = Column(String, nullable=True)
    is_working = Column(Boolean, default=False)
    company = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    work_location = Column(String, nullable=True)
    salary_ctc = Column(String, nullable=True)
    
    # Family Details
    father_name = Column(String, nullable=True)
    father_occupation = Column(String, nullable=True)
    mother_name = Column(String, nullable=True)
    mother_occupation = Column(String, nullable=True)
    siblings_details = Column(String, nullable=True)
    
    # Contact & Address
    house_address = Column(String, nullable=True)
    father_number = Column(String, nullable=True)
    mother_number = Column(String, nullable=True)
    personal_number = Column(String, nullable=True)
    instagram_id = Column(String, nullable=True)
    
    # Relationships
    photos = relationship("ProposalPhoto", back_populates="proposal", cascade="all, delete-orphan")
    medical_records = relationship("ProposalMedicalRecord", back_populates="proposal", cascade="all, delete-orphan", order_by="ProposalMedicalRecord.created_at.desc()")
    discussions = relationship("ProposalDiscussion", back_populates="proposal", cascade="all, delete-orphan", order_by="ProposalDiscussion.created_at.desc()")
    questions = relationship("ProposalQuestion", back_populates="proposal", cascade="all, delete-orphan", order_by="ProposalQuestion.created_at.desc()")
    feedbacks = relationship("ProposalFeedback", back_populates="proposal", cascade="all, delete-orphan", order_by="ProposalFeedback.created_at.desc()")
    expenses = relationship("ProposalExpense", back_populates="proposal", cascade="all, delete-orphan", order_by="ProposalExpense.date.desc()")
    
    pdf_url = Column(String, nullable=True)
    # Proposal Source & Expectations
    received_date = Column(DateTime, nullable=True)
    referred_by = Column(String, nullable=True)
    expectations = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    is_my_profile = Column(Boolean, default=False)

class ProposalExpense(Base):
    __tablename__ = "proposal_expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), index=True)
    category = Column(String, nullable=False) # e.g. Engagement, Katnam, Food
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    paid_by = Column(String, nullable=True) # e.g. Groom's Side, Bride's Side, Shared
    date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    proposal = relationship("Proposal", back_populates="expenses")

class ProposalVersion(Base):
    __tablename__ = "proposal_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), index=True)
    version_number = Column(Integer, nullable=False)
    data_snapshot = Column(JSON().with_variant(JSONB, 'postgresql'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    proposal = relationship("Proposal")
