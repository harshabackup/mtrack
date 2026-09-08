from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class InterestUpdate(BaseModel):
    side: int  # 1 or 2 - which proposal (in ascending id order) is expressing interest
    interested: bool
    note: Optional[str] = None

class InterestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    proposal_1_id: int
    proposal_2_id: int
    interest_1: bool
    interest_2: bool
    note_1: Optional[str] = None
    note_2: Optional[str] = None
    mutual: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class ContactRevealResponse(BaseModel):
    revealed: bool
    father_number: Optional[str] = None
    mother_number: Optional[str] = None
    personal_number: Optional[str] = None
    instagram_id: Optional[str] = None
    house_address: Optional[str] = None
    message: Optional[str] = None
