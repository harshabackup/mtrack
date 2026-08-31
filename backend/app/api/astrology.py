from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.permissions import require_vendor
from ..models.user import User
from ..models.proposal import Proposal
from ..models.ai import ComputedBirthChart
from ..services import astrology_engine
from ..services.city_coordinates import get_lat_lon

router = APIRouter(prefix="/api/v1/astrology", tags=["astrology"])


class ProposalPayload(BaseModel):
    proposal_id: int


class CompatibilityPayload(BaseModel):
    proposal_1_id: int
    proposal_2_id: int


def get_proposal_or_404(proposal_id: int, vendor_id: int, db: Session) -> Proposal:
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id, Proposal.vendor_id == vendor_id
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal


def compute_chart_for_proposal(proposal: Proposal) -> dict:
    if not proposal.dob:
        raise HTTPException(status_code=400, detail="Date of birth (dob) is required")

    parsed = astrology_engine.parse_dob_tob(proposal.dob, proposal.tob)
    if not parsed:
        raise HTTPException(status_code=400, detail="Could not parse date of birth or time of birth")

    lat, lon, _tz = None, None, None
    coords = get_lat_lon(proposal.pob)
    if coords:
        lat, lon, _tz = coords
    elif proposal.pob:
        lat, lon = 17.3850, 78.4867

    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Birth place is required (pob)")

    year, month, day, hour, minute, second = parsed
    chart = astrology_engine.calculate_birth_chart(
        year, month, day, hour, minute, second, lat, lon
    )
    chart["birth_details"] = {
        "dob": proposal.dob,
        "tob": proposal.tob,
        "pob": proposal.pob,
    }
    return chart


def save_or_update_chart(db: Session, proposal_id: int, chart: dict) -> ComputedBirthChart:
    record = db.query(ComputedBirthChart).filter(ComputedBirthChart.proposal_id == proposal_id).first()
    if record:
        record.chart_data = chart
    else:
        record = ComputedBirthChart(proposal_id=proposal_id, chart_data=chart)
        db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/calculate-chart")
def calculate_chart(payload: ProposalPayload, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    proposal = get_proposal_or_404(payload.proposal_id, current_user.vendor_id, db)
    chart = compute_chart_for_proposal(proposal)
    record = save_or_update_chart(db, proposal.id, chart)
    return {"proposal_id": proposal.id, "chart": record.chart_data}


@router.get("/chart/{proposal_id}")
def get_chart(proposal_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    proposal = get_proposal_or_404(proposal_id, current_user.vendor_id, db)
    record = db.query(ComputedBirthChart).filter(ComputedBirthChart.proposal_id == proposal_id).first()
    if record:
        return {"proposal_id": proposal_id, "chart": record.chart_data}
    raise HTTPException(status_code=404, detail="Birth chart not computed yet. Use /calculate-chart first.")


@router.post("/manglik-check")
def manglik_check(payload: ProposalPayload, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    proposal = get_proposal_or_404(payload.proposal_id, current_user.vendor_id, db)
    chart = compute_chart_for_proposal(proposal)
    manglik = astrology_engine.detect_manglik_dosha(chart)
    return {"proposal_id": proposal.id, "manglik": manglik}


@router.post("/compatibility")
def compatibility(payload: CompatibilityPayload, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    p1 = get_proposal_or_404(payload.proposal_1_id, current_user.vendor_id, db)
    p2 = get_proposal_or_404(payload.proposal_2_id, current_user.vendor_id, db)

    chart_1 = compute_chart_for_proposal(p1)
    chart_2 = compute_chart_for_proposal(p2)

    result = astrology_engine.calculate_ashtakoota(chart_1, chart_2)
    return {
        "proposal_1": {"id": p1.id, "name": p1.name},
        "proposal_2": {"id": p2.id, "name": p2.name},
        "ashtakoota": result,
    }

@router.get("/navamsa/{proposal_id}")
async def get_navamsa(proposal_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    proposal = get_proposal_or_404(proposal_id, current_user.vendor_id, db)
    
    # Get the D1 chart (calculated locally or from cache)
    chart = compute_chart_for_proposal(proposal)
    
    # Calculate D9 mathematically from D1
    result = astrology_engine.calculate_d9_chart(chart)
    return {"proposal_id": proposal_id, "navamsa": result}

@router.get("/dasha/{proposal_id}")
async def get_dasha(proposal_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    proposal = get_proposal_or_404(proposal_id, current_user.vendor_id, db)
    if not proposal.dob:
        raise HTTPException(status_code=400, detail="Date of birth is required")
        
    parsed = astrology_engine.parse_dob_tob(proposal.dob, proposal.tob)
    if not parsed:
        raise HTTPException(status_code=400, detail="Invalid date or time of birth")
        
    year, month, day, _h, _m, _s = parsed
    
    # Get D1 chart to find exact moon longitude
    chart = compute_chart_for_proposal(proposal)
    moon_lon = chart.get("planets", {}).get("Moon", {}).get("longitude", 0)
    
    # Calculate Vimshottari mathematically based on Moon
    result = astrology_engine.calculate_vimshottari_dasha(moon_lon, year, month, day)
    return {"proposal_id": proposal_id, "dasha": result}
