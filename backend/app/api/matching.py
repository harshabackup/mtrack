from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.match import ProposalMatch
from ..models.proposal import Proposal
from ..schemas.match import MatchCreate, MatchUpdate, MatchResponse
from .auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/matching", tags=["matching"])

@router.get("/{proposal_1_id}/{proposal_2_id}", response_model=MatchResponse)
def get_match(
    proposal_1_id: int, 
    proposal_2_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    match = db.query(ProposalMatch).filter(
        ((ProposalMatch.proposal_1_id == proposal_1_id) & (ProposalMatch.proposal_2_id == proposal_2_id)) |
        ((ProposalMatch.proposal_1_id == proposal_2_id) & (ProposalMatch.proposal_2_id == proposal_1_id))
    ).first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match

@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def create_match(match: MatchCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify proposals exist
    p1 = db.query(Proposal).filter(Proposal.id == match.proposal_1_id).first()
    p2 = db.query(Proposal).filter(Proposal.id == match.proposal_2_id).first()
    
    if not p1 or not p2:
        raise HTTPException(status_code=404, detail="One or both proposals not found")
        
    # Check if match already exists
    existing_match = db.query(ProposalMatch).filter(
        ((ProposalMatch.proposal_1_id == match.proposal_1_id) & (ProposalMatch.proposal_2_id == match.proposal_2_id)) |
        ((ProposalMatch.proposal_1_id == match.proposal_2_id) & (ProposalMatch.proposal_2_id == match.proposal_1_id))
    ).first()
    
    if existing_match:
        raise HTTPException(status_code=400, detail="Match already exists. Use PUT to update.")

    db_match = ProposalMatch(**match.model_dump())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

@router.put("/{match_id}", response_model=MatchResponse)
def update_match(match_id: int, match: MatchUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_match = db.query(ProposalMatch).filter(ProposalMatch.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    update_data = match.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_match, key, value)
        
    db.commit()
    db.refresh(db_match)
    return db_match
