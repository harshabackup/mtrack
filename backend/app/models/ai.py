from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
from pgvector.sqlalchemy import Vector
import enum

class VerificationStatus(str, enum.Enum):
    SELF_REPORTED = "SELF_REPORTED"
    DOCUMENT_PROVIDED = "DOCUMENT_PROVIDED"
    USER_CONFIRMED = "USER_CONFIRMED"
    VERIFIED = "VERIFIED"
    CONFLICTING = "CONFLICTING"
    UNKNOWN = "UNKNOWN"

class PreferenceLevel(str, enum.Enum):
    MUST_HAVE = "MUST_HAVE"
    PREFERRED = "PREFERRED"
    FLEXIBLE = "FLEXIBLE"

class ProposalField(Base):
    __tablename__ = "proposal_fields"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String, index=True, nullable=False)
    field_value = Column(String, nullable=True)
    source_document_id = Column(Integer, ForeignKey("proposal_medical_records.id", ondelete="SET NULL"), nullable=True)
    source_text = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.UNKNOWN)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class FamilyPreference(Base):
    __tablename__ = "family_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String, nullable=False) 
    category = Column(String, nullable=False)
    requirement = Column(String, nullable=False)
    level = Column(SQLEnum(PreferenceLevel), default=PreferenceLevel.PREFERRED)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class SemanticEmbedding(Base):
    __tablename__ = "semantic_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), nullable=True)
    vendor_id = Column(String, nullable=False)
    source_type = Column(String, nullable=False) 
    content = Column(Text, nullable=False)
    embedding = Column(Vector(4096)) # Qwen text embeddings can be 4096 depending on model
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ProposalAnalysisRecord(Base):
    __tablename__ = "proposal_ai_analysis"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), unique=True, nullable=False)
    analysis_data = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ComputedBirthChart(Base):
    __tablename__ = "computed_birth_charts"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), unique=True, nullable=False)
    chart_data = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String, nullable=False, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Integer, default=1)  # 1 = active, 0 = ended
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    messages = relationship("ChatMessage", back_populates="session", order_by="ChatMessage.created_at")
    proposal = relationship("Proposal", lazy="joined")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False)  # 'user' or 'ai'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")

