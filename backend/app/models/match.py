from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class ProposalMatch(Base):
    __tablename__ = "proposal_matches"

    id = Column(Integer, primary_key=True, index=True)
    proposal_1_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False)
    proposal_2_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False)

    guna_score = Column(Float, nullable=True)
    maximum_guna = Column(Float, default=36.0)

    varna_score = Column(Float, nullable=True)
    vashya_score = Column(Float, nullable=True)
    tara_score = Column(Float, nullable=True)
    yoni_score = Column(Float, nullable=True)
    graha_maitri_score = Column(Float, nullable=True)
    gana_score = Column(Float, nullable=True)
    bhakoot_score = Column(Float, nullable=True)
    nadi_score = Column(Float, nullable=True)

    manglik_result = Column(Boolean, nullable=True)
    nadi_result = Column(Boolean, nullable=True)
    bhakoot_result = Column(Boolean, nullable=True)

    matching_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships can be added here if needed
