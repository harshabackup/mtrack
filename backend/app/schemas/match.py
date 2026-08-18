from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MatchBase(BaseModel):
    proposal_1_id: int
    proposal_2_id: int
    guna_score: Optional[float] = None
    maximum_guna: float = 36.0

    varna_score: Optional[float] = None
    vashya_score: Optional[float] = None
    tara_score: Optional[float] = None
    yoni_score: Optional[float] = None
    graha_maitri_score: Optional[float] = None
    gana_score: Optional[float] = None
    bhakoot_score: Optional[float] = None
    nadi_score: Optional[float] = None

    manglik_result: Optional[bool] = None
    nadi_result: Optional[bool] = None
    bhakoot_result: Optional[bool] = None
    matching_notes: Optional[str] = None

class MatchCreate(MatchBase):
    pass

class MatchUpdate(BaseModel):
    guna_score: Optional[float] = None
    maximum_guna: Optional[float] = None

    varna_score: Optional[float] = None
    vashya_score: Optional[float] = None
    tara_score: Optional[float] = None
    yoni_score: Optional[float] = None
    graha_maitri_score: Optional[float] = None
    gana_score: Optional[float] = None
    bhakoot_score: Optional[float] = None
    nadi_score: Optional[float] = None

    manglik_result: Optional[bool] = None
    nadi_result: Optional[bool] = None
    bhakoot_result: Optional[bool] = None
    matching_notes: Optional[str] = None

class MatchResponse(MatchBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
