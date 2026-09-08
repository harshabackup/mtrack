from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.sql import func
from ..core.database import Base

class ProposalInterest(Base):
    """Tracks double opt-in interest between two proposals before contact details are revealed."""
    __tablename__ = "proposal_interests"
    __table_args__ = (
        UniqueConstraint("proposal_1_id", "proposal_2_id", name="uq_proposal_interest_pair"),
    )

    id = Column(Integer, primary_key=True, index=True)
    # proposal_1_id is always the smaller id; proposal_2_id the larger, so a pair has one row.
    proposal_1_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False, index=True)
    proposal_2_id = Column(Integer, ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False, index=True)

    interest_1 = Column(Boolean, default=False, nullable=False)
    interest_2 = Column(Boolean, default=False, nullable=False)
    note_1 = Column(Text, nullable=True)
    note_2 = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
