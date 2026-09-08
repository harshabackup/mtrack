from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.interest import ProposalInterest
from ..models.proposal import Proposal
from ..schemas.interest import InterestUpdate, InterestResponse, ContactRevealResponse
from ..core.permissions import require_vendor
from ..models.user import User

router = APIRouter(prefix="/api/v1/proposals", tags=["interest"])


def _ordered_pair(id_a: int, id_b: int):
    return (id_a, id_b) if id_a < id_b else (id_b, id_a)


def _get_scoped_proposals(db: Session, id_a: int, id_b: int, vendor_id):
    proposals = db.query(Proposal).filter(
        Proposal.id.in_([id_a, id_b]), Proposal.vendor_id == vendor_id
    ).all()
    if len(proposals) != 2:
        raise HTTPException(status_code=404, detail="One or both proposals not found or access denied")
    return proposals


def _to_response(record: ProposalInterest) -> dict:
    return {
        "id": record.id,
        "proposal_1_id": record.proposal_1_id,
        "proposal_2_id": record.proposal_2_id,
        "interest_1": record.interest_1,
        "interest_2": record.interest_2,
        "note_1": record.note_1,
        "note_2": record.note_2,
        "mutual": bool(record.interest_1 and record.interest_2),
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


@router.get("/{id_a}/{id_b}/interest", response_model=InterestResponse)
def get_interest(id_a: int, id_b: int, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    _get_scoped_proposals(db, id_a, id_b, current_user.vendor_id)
    p1, p2 = _ordered_pair(id_a, id_b)
    record = db.query(ProposalInterest).filter(
        ProposalInterest.proposal_1_id == p1, ProposalInterest.proposal_2_id == p2
    ).first()
    if not record:
        record = ProposalInterest(proposal_1_id=p1, proposal_2_id=p2)
        db.add(record)
        db.commit()
        db.refresh(record)
    return _to_response(record)


@router.put("/{id_a}/{id_b}/interest", response_model=InterestResponse)
def update_interest(
    id_a: int, id_b: int, payload: InterestUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(require_vendor)
):
    if payload.side not in (1, 2):
        raise HTTPException(status_code=400, detail="side must be 1 or 2")

    _get_scoped_proposals(db, id_a, id_b, current_user.vendor_id)
    p1, p2 = _ordered_pair(id_a, id_b)
    record = db.query(ProposalInterest).filter(
        ProposalInterest.proposal_1_id == p1, ProposalInterest.proposal_2_id == p2
    ).first()
    if not record:
        record = ProposalInterest(proposal_1_id=p1, proposal_2_id=p2)
        db.add(record)

    if payload.side == 1:
        record.interest_1 = payload.interested
        record.note_1 = payload.note
    else:
        record.interest_2 = payload.interested
        record.note_2 = payload.note

    db.commit()
    db.refresh(record)
    return _to_response(record)


@router.get("/{id_a}/{id_b}/contact", response_model=ContactRevealResponse)
def get_contact(id_a: int, id_b: int, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    proposals = _get_scoped_proposals(db, id_a, id_b, current_user.vendor_id)
    p1, p2 = _ordered_pair(id_a, id_b)
    record = db.query(ProposalInterest).filter(
        ProposalInterest.proposal_1_id == p1, ProposalInterest.proposal_2_id == p2
    ).first()
    mutual = bool(record and record.interest_1 and record.interest_2)

    if not mutual:
        return ContactRevealResponse(
            revealed=False,
            message="Contact details are hidden until both sides express interest."
        )

    # id_b is treated as "the other side" being revealed to the viewer of id_a.
    target = next(p for p in proposals if p.id == id_b)
    return ContactRevealResponse(
        revealed=True,
        father_number=target.father_number,
        mother_number=target.mother_number,
        personal_number=target.personal_number,
        instagram_id=target.instagram_id,
        house_address=target.house_address,
    )
