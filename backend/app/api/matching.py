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

@router.post("/auto/{proposal_1_id}/{proposal_2_id}", response_model=MatchResponse)
def auto_calculate_match(
    proposal_1_id: int, proposal_2_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Auto-calculates Ashtakoota (guna milan) matching from each proposal's dob/tob,
    then creates or updates the ProposalMatch record so it doesn't need manual entry."""
    from ..services.astrology_engine import (
        parse_dob_tob, calculate_birth_chart, calculate_ashtakoota, detect_manglik_dosha
    )

    p1 = db.query(Proposal).filter(Proposal.id == proposal_1_id).first()
    p2 = db.query(Proposal).filter(Proposal.id == proposal_2_id).first()
    if not p1 or not p2:
        raise HTTPException(status_code=404, detail="One or both proposals not found")
    if not p1.dob or not p2.dob:
        raise HTTPException(status_code=400, detail="Both profiles need a date of birth to auto-calculate matching")

    parsed_1 = parse_dob_tob(p1.dob, p1.tob or "")
    parsed_2 = parse_dob_tob(p2.dob, p2.tob or "")
    if not parsed_1 or not parsed_2:
        raise HTTPException(status_code=400, detail="Could not parse date/time of birth for one or both profiles")

    # Birthplace geocoding isn't wired up yet; default to a central India reference point.
    lat, lon, tz = 20.5937, 78.9629, 5.5
    y1, mo1, d1, h1, mi1, s1 = parsed_1
    y2, mo2, d2, h2, mi2, s2 = parsed_2
    chart1 = calculate_birth_chart(y1, mo1, d1, h1, mi1, s1, lat, lon, tz)
    chart2 = calculate_birth_chart(y2, mo2, d2, h2, mi2, s2, lat, lon, tz)

    ashtakoota = calculate_ashtakoota(chart1, chart2)
    manglik1 = detect_manglik_dosha(chart1)
    manglik2 = detect_manglik_dosha(chart2)
    scores = ashtakoota["scores"]

    notes = f"Auto-calculated. Verdict: {ashtakoota['verdict']}."
    if manglik1["present"] or manglik2["present"]:
        notes += f" Manglik — {p1.name}: {'Yes' if manglik1['present'] else 'No'} ({manglik1['severity']}), {p2.name}: {'Yes' if manglik2['present'] else 'No'} ({manglik2['severity']})."

    existing_match = db.query(ProposalMatch).filter(
        ((ProposalMatch.proposal_1_id == proposal_1_id) & (ProposalMatch.proposal_2_id == proposal_2_id)) |
        ((ProposalMatch.proposal_1_id == proposal_2_id) & (ProposalMatch.proposal_2_id == proposal_1_id))
    ).first()

    values = dict(
        guna_score=ashtakoota["total"], maximum_guna=float(ashtakoota["maximum"]),
        varna_score=scores.get("varna"), vashya_score=scores.get("vashya"),
        tara_score=scores.get("tara"), yoni_score=scores.get("yoni"),
        graha_maitri_score=scores.get("graha_maitri"), gana_score=scores.get("gana"),
        bhakoot_score=scores.get("bhakoot"), nadi_score=scores.get("nadi"),
        manglik_result=bool(manglik1["present"] or manglik2["present"]),
        nadi_result=ashtakoota["doshas"]["nadi_dosha"],
        bhakoot_result=ashtakoota["doshas"]["bhakoot_dosha"],
        matching_notes=notes,
    )

    if existing_match:
        for key, value in values.items():
            setattr(existing_match, key, value)
        db.commit()
        db.refresh(existing_match)
        return existing_match

    db_match = ProposalMatch(proposal_1_id=proposal_1_id, proposal_2_id=proposal_2_id, **values)
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
