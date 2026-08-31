from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", use_alter=True, name="fk_user_vendor"), nullable=True)
    
    email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    # Invitation fields
    invitation_token = Column(String, nullable=True, index=True)
    profile_completed = Column(Boolean, default=False)

    role = relationship("Role", back_populates="users")
    vendor = relationship("Vendor", back_populates="users", foreign_keys=[vendor_id])
