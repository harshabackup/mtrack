from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.database import get_db
from ..core.permissions import require_admin
from ..models.user import User
from ..models.vendor import Vendor
from ..models.proposal import Proposal

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    total_users = db.query(User).count()
    total_vendors = db.query(Vendor).count()
    total_proposals = db.query(Proposal).count()
    
    return {
        "total_users": total_users,
        "total_vendors": total_vendors,
        "total_proposals": total_proposals
    }

@router.get("/users")
def list_users(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "vendor_id": u.vendor_id, "is_active": u.is_active} for u in users]

@router.get("/vendors")
def list_vendors(db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    vendors = db.query(Vendor).all()
    return [{"id": v.id, "name": v.vendor_name, "status": v.status} for v in vendors]
