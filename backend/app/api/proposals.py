from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.proposal import Proposal, ProposalPhoto, ProposalDiscussion, ProposalQuestion, ProposalFeedback, ProposalMedicalRecord, ProposalVersion
from ..schemas.proposal import (
    ProposalCreate, ProposalUpdate, ProposalResponse,
    ProposalDiscussionCreate, ProposalDiscussionUpdate, ProposalDiscussionResponse,
    ProposalQuestionCreate, ProposalQuestionUpdate, ProposalQuestionResponse,
    ProposalFeedbackCreate, ProposalFeedbackUpdate, ProposalFeedbackResponse,
    ProposalExpenseCreate, ProposalExpenseUpdate, ProposalExpenseResponse
)
from ..core.permissions import require_vendor, get_current_user
from ..models.user import User
from ..models.role import Role
import shutil
import os
import uuid
from ..services import ocr_service

router = APIRouter(prefix="/api/v1/proposals", tags=["proposals"])

@router.get("/", response_model=List[ProposalResponse])
def get_proposals(
    skip: int = 0, 
    limit: int = 100, 
    name: Optional[str] = None,
    city: Optional[str] = None,
    job_title: Optional[str] = None,
    status: Optional[str] = None,
    min_age: Optional[int] = None,
    max_age: Optional[int] = None,
    rasi: Optional[str] = None,
    nakshatra: Optional[str] = None,
    dosham: Optional[str] = None,
    is_working: Optional[bool] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_vendor)
):
    query = db.query(Proposal).filter(
        Proposal.vendor_id == current_user.vendor_id,
        Proposal.is_my_profile == False
    )
    if name:
        query = query.filter(Proposal.name.ilike(f"%{name}%"))
    if city:
        query = query.filter(Proposal.current_city.ilike(f"%{city}%"))
    if job_title:
        query = query.filter(Proposal.job_title.ilike(f"%{job_title}%"))
    if status:
        query = query.filter(Proposal.status == status)
    if min_age is not None:
        query = query.filter(Proposal.age >= min_age)
    if max_age is not None:
        query = query.filter(Proposal.age <= max_age)
    if rasi:
        query = query.filter(Proposal.rasi == rasi)
    if nakshatra:
        query = query.filter(Proposal.nakshatra == nakshatra)
    if dosham:
        query = query.filter(Proposal.dosham.ilike(f"%{dosham}%"))
    if is_working is not None:
        query = query.filter(Proposal.is_working == is_working)
        
    proposals = query.offset(skip).limit(limit).all()
    return proposals

@router.get("/compare")
def compare_proposals(
    ids: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    id_list = [int(i.strip()) for i in ids.split(",") if i.strip().isdigit()]
    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Must provide at least two proposal IDs to compare")
        
    proposals = db.query(Proposal).filter(Proposal.id.in_(id_list), Proposal.vendor_id == current_user.vendor_id).all()
    
    if len(proposals) != len(id_list):
        raise HTTPException(status_code=404, detail="One or more proposals not found or access denied")
        
    proposal_dict = {p.id: p for p in proposals}
    ordered_proposals = [proposal_dict[pid] for pid in id_list]
    
    base_proposal = ordered_proposals[0]
    
    from ..services.compatibility import calculate_compatibility
    compatibility_matrix = calculate_compatibility(base_proposal, ordered_proposals[1:])
    
    serialized_proposals = [ProposalResponse.model_validate(p).model_dump() for p in ordered_proposals]
    
    return {
        "proposals": serialized_proposals,
        "compatibility": compatibility_matrix
    }

@router.get("/me", response_model=ProposalResponse)
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    proposal = db.query(Proposal).filter(
        Proposal.created_by == current_user.id,
        Proposal.is_my_profile == True,
        Proposal.vendor_id == current_user.vendor_id
    ).first()
    
    if not proposal:
        proposal = Proposal(
            name=current_user.full_name,
            created_by=current_user.id,
            vendor_id=current_user.vendor_id,
            is_my_profile=True,
            status="IN_PROGRESS"
        )
        db.add(proposal)
        db.commit()
        db.refresh(proposal)
        
    return proposal

@router.post("/", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
def create_proposal(proposal: ProposalCreate, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    proposal_data = proposal.model_dump(exclude_unset=True)
    if proposal_data.get('created_at') is None:
        proposal_data.pop('created_at', None)
        
    photo_urls = proposal_data.pop('photo_urls', [])
        
    proposal_data['vendor_id'] = current_user.vendor_id
    proposal_data['created_by'] = current_user.id
    
    # Auto-calculate Rasi and Nakshatra if missing but DOB and TOB are present
    if proposal_data.get('dob') and proposal_data.get('tob'):
        if not proposal_data.get('rasi') or not proposal_data.get('nakshatra'):
            from ..services.astrology import calculate_nakshatra_and_rasi
            rasi, nakshatra = calculate_nakshatra_and_rasi(proposal_data['dob'], proposal_data['tob'])
            if rasi and not proposal_data.get('rasi'):
                proposal_data['rasi'] = rasi
            if nakshatra and not proposal_data.get('nakshatra'):
                proposal_data['nakshatra'] = nakshatra
    
    db_proposal = Proposal(**proposal_data)
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    
    for url in photo_urls:
        new_photo = ProposalPhoto(proposal_id=db_proposal.id, photo_url=url)
        db.add(new_photo)
        
    if photo_urls:
        db.commit()
        db.refresh(db_proposal)
        
    return db_proposal

def get_vendor_proposal_or_404(proposal_id: int, vendor_id: int, db: Session, current_user: User):
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    
    query = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.vendor_id == vendor_id)
    if role and role.name == "INVITED_USER":
        query = query.filter(Proposal.created_by == current_user.id)
        
    db_proposal = query.first()
    
    if not db_proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return db_proposal

@router.get("/{proposal_id}", response_model=ProposalResponse)
def get_proposal(proposal_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    return get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db, current_user)

@router.put("/{proposal_id}", response_model=ProposalResponse)
def update_proposal(proposal_id: int, proposal: ProposalUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db, current_user)
    
    update_data = proposal.model_dump(exclude_unset=True)
    photo_urls = update_data.pop('photo_urls', None)
    
    # Auto-calculate Rasi and Nakshatra if missing but DOB and TOB are present
    final_dob = update_data.get('dob', db_proposal.dob)
    final_tob = update_data.get('tob', db_proposal.tob)
    final_rasi = update_data.get('rasi', db_proposal.rasi)
    final_nakshatra = update_data.get('nakshatra', db_proposal.nakshatra)
    
    if final_dob and final_tob and (not final_rasi or not final_nakshatra):
        from ..services.astrology import calculate_nakshatra_and_rasi
        rasi, nakshatra = calculate_nakshatra_and_rasi(final_dob, final_tob)
        if rasi and not final_rasi:
            update_data['rasi'] = rasi
        if nakshatra and not final_nakshatra:
            update_data['nakshatra'] = nakshatra
            
    for key, value in update_data.items():
        setattr(db_proposal, key, value)
        
    if photo_urls is not None:
        for url in photo_urls:
            new_photo = ProposalPhoto(proposal_id=db_proposal.id, photo_url=url)
            db.add(new_photo)
            
    # Versioning
    import json
    snapshot = {
        "name": db_proposal.name,
        "age": db_proposal.age,
        "current_city": db_proposal.current_city,
        "dob": db_proposal.dob,
        "tob": db_proposal.tob,
        "pob": db_proposal.pob,
        "height": db_proposal.height,
        "weight": db_proposal.weight,
        "complexion": db_proposal.complexion,
        "education": db_proposal.education,
        "is_working": db_proposal.is_working,
        "company": db_proposal.company,
        "job_title": db_proposal.job_title,
        "salary_ctc": db_proposal.salary_ctc,
    }
    
    last_version = db.query(ProposalVersion).filter(ProposalVersion.proposal_id == db_proposal.id).order_by(ProposalVersion.version_number.desc()).first()
    new_version_num = last_version.version_number + 1 if last_version else 1
    
    new_version = ProposalVersion(
        proposal_id=db_proposal.id,
        version_number=new_version_num,
        data_snapshot=snapshot
    )
    db.add(new_version)
            
    db.commit()
    db.refresh(db_proposal)
    return db_proposal

@router.delete("/{proposal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proposal(proposal_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db, current_user)
    
    db.delete(db_proposal)
    db.commit()
    return None

@router.post("/{proposal_id}/upload")
async def upload_file(
    proposal_id: int,
    file_type: str, # "photo" or "pdf"
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db, current_user)
        
    if file_type not in ["photo", "pdf", "medical_record"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Must be 'photo', 'pdf', or 'medical_record'")
        
    file_bytes = await file.read()
    filename = f"{current_user.vendor_id}/{proposal_id}/{uuid.uuid4().hex[:8]}_{file.filename}"
    
    from ..core.storage import upload_file_to_supabase
    url = upload_file_to_supabase(file_bytes, filename, file.content_type or "application/octet-stream")
        
    # Update DB
    if file_type == "photo":
        new_photo = ProposalPhoto(proposal_id=proposal_id, photo_url=url)
        db.add(new_photo)
    elif file_type == "medical_record":
        new_record = ProposalMedicalRecord(proposal_id=proposal_id, record_url=url, record_name=file.filename)
        db.add(new_record)
    else:
        db_proposal.pdf_url = url
        
    db.commit()
    return {"filename": filename, "url": url}

@router.delete("/{proposal_id}/file/{file_type}")
def delete_file(
    proposal_id: int,
    file_type: str, # "pdf"
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db, current_user)
    
    if file_type == "pdf":
        if db_proposal.pdf_url:
            filename = db_proposal.pdf_url.split("/")[-1]
            path = f"{current_user.vendor_id}/{proposal_id}/{filename}"
            from ..core.storage import delete_file_from_supabase
            delete_file_from_supabase(path)
            
            db_proposal.pdf_url = None
            db.commit()
            return {"message": "PDF deleted successfully"}
        return {"message": "No PDF found"}
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")

@router.delete("/{proposal_id}/photo/{photo_id}")
def delete_photo(
    proposal_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db, current_user)
    photo = db.query(ProposalPhoto).filter(ProposalPhoto.id == photo_id, ProposalPhoto.proposal_id == proposal_id).first()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    filename = photo.photo_url.split("/")[-1]
    path = f"{current_user.vendor_id}/{proposal_id}/{filename}"
    from ..core.storage import delete_file_from_supabase
    delete_file_from_supabase(path)
    
    db.delete(photo)
    db.commit()
    return {"message": "Photo deleted successfully"}

@router.delete("/{proposal_id}/medical-records/{record_id}")
def delete_medical_record(
    proposal_id: int,
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
    record = db.query(ProposalMedicalRecord).filter(ProposalMedicalRecord.id == record_id, ProposalMedicalRecord.proposal_id == proposal_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
        
    filename = record.record_url.split("/")[-1]
    path = f"{current_user.vendor_id}/{proposal_id}/{filename}"
    from ..core.storage import delete_file_from_supabase
    delete_file_from_supabase(path)
    
    db.delete(record)
    db.commit()
    return {"message": "Medical record deleted successfully"}


@router.post("/ocr/extract")
def extract_ocr_from_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    temp_dir = os.path.join("storage", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(temp_dir, temp_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        mime_type = file.content_type or 'image/jpeg'
        parsed_data = ocr_service.process_file_for_ocr(file_path, mime_type)
        return parsed_data
        
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/{proposal_id}/ocr")
def trigger_ocr(
    proposal_id: int,
    file_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
        
    url = None
    mime_type = 'image/jpeg'
    if file_type == "photo":
        if db_proposal.photos and len(db_proposal.photos) > 0:
            url = db_proposal.photos[0].photo_url
    elif file_type == "pdf":
        url = db_proposal.pdf_url
        mime_type = 'application/pdf'
        
    if not url:
        raise HTTPException(status_code=400, detail=f"No {file_type} uploaded")
        
    file_path = url.lstrip('/')
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    parsed_data = ocr_service.process_file_for_ocr(file_path, mime_type)
    return parsed_data

@router.post("/{proposal_id}/discussions", response_model=ProposalDiscussionResponse)
def add_discussion(
    proposal_id: int,
    discussion: ProposalDiscussionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
        
    new_disc = ProposalDiscussion(
        proposal_id=proposal_id,
        status_stage=discussion.status_stage,
        note=discussion.note,
        **( {"created_at": discussion.created_at} if discussion.created_at else {} )
    )
    db.add(new_disc)
    db_proposal.status = discussion.status_stage
    db.commit()
    db.refresh(new_disc)
    return new_disc

@router.post("/{proposal_id}/questions", response_model=ProposalQuestionResponse)
def add_question(
    proposal_id: int,
    question: ProposalQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
        
    new_q = ProposalQuestion(
        proposal_id=proposal_id,
        asked_by=question.asked_by,
        question_text=question.question_text,
        expectations=question.expectations,
        **( {"created_at": question.created_at} if question.created_at else {} )
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q

@router.post("/{proposal_id}/feedbacks", response_model=ProposalFeedbackResponse)
def add_feedback(
    proposal_id: int,
    feedback: ProposalFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
        
    new_f = ProposalFeedback(
        proposal_id=proposal_id,
        feedback_from=feedback.feedback_from,
        message=feedback.message,
        **( {"created_at": feedback.created_at} if feedback.created_at else {} )
    )
    db.add(new_f)
    db.commit()
    db.refresh(new_f)
    return new_f

@router.put("/{proposal_id}/discussions/{discussion_id}", response_model=ProposalDiscussionResponse)
def update_discussion(
    proposal_id: int,
    discussion_id: int,
    discussion_update: ProposalDiscussionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
    db_discussion = db.query(ProposalDiscussion).filter(ProposalDiscussion.id == discussion_id, ProposalDiscussion.proposal_id == proposal_id).first()
    if not db_discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
        
    update_data = discussion_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_discussion, key, value)
        
    if discussion_update.status_stage:
        db_proposal.status = discussion_update.status_stage
        
    db.commit()
    db.refresh(db_discussion)
    return db_discussion

@router.delete("/{proposal_id}/discussions/{discussion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discussion(
    proposal_id: int,
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
    db_discussion = db.query(ProposalDiscussion).filter(ProposalDiscussion.id == discussion_id, ProposalDiscussion.proposal_id == proposal_id).first()
    if not db_discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
        
    db.delete(db_discussion)
    db.commit()
    return None

@router.put("/{proposal_id}/questions/{question_id}", response_model=ProposalQuestionResponse)
def update_question(
    proposal_id: int,
    question_id: int,
    question_update: ProposalQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
    db_question = db.query(ProposalQuestion).filter(ProposalQuestion.id == question_id, ProposalQuestion.proposal_id == proposal_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    update_data = question_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_question, key, value)
        
    db.commit()
    db.refresh(db_question)
    return db_question

@router.delete("/{proposal_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    proposal_id: int,
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
    db_question = db.query(ProposalQuestion).filter(ProposalQuestion.id == question_id, ProposalQuestion.proposal_id == proposal_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    db.delete(db_question)
    db.commit()
    return None

@router.put("/{proposal_id}/feedbacks/{feedback_id}", response_model=ProposalFeedbackResponse)
def update_feedback(
    proposal_id: int,
    feedback_id: int,
    feedback_update: ProposalFeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
    db_feedback = db.query(ProposalFeedback).filter(ProposalFeedback.id == feedback_id, ProposalFeedback.proposal_id == proposal_id).first()
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    update_data = feedback_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_feedback, key, value)
        
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@router.delete("/{proposal_id}/feedbacks/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(
    proposal_id: int,
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
    db_feedback = db.query(ProposalFeedback).filter(ProposalFeedback.id == feedback_id, ProposalFeedback.proposal_id == proposal_id).first()
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
        
    db.delete(db_feedback)
    db.commit()
    return None

@router.post("/{proposal_id}/expenses", response_model=ProposalExpenseResponse)
def add_expense(
    proposal_id: int,
    expense: ProposalExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    from ..models.proposal import ProposalExpense
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
    
    new_expense = ProposalExpense(
        proposal_id=proposal_id,
        category=expense.category,
        description=expense.description,
        amount=expense.amount,
        paid_by=expense.paid_by,
        date=expense.date
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.put("/{proposal_id}/expenses/{expense_id}", response_model=ProposalExpenseResponse)
def update_expense(
    proposal_id: int,
    expense_id: int,
    expense_update: ProposalExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    from ..models.proposal import ProposalExpense
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
    db_expense = db.query(ProposalExpense).filter(ProposalExpense.id == expense_id, ProposalExpense.proposal_id == proposal_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    update_data = expense_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_expense, key, value)
        
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{proposal_id}/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    proposal_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    from ..models.proposal import ProposalExpense
    db_proposal = get_vendor_proposal_or_404(proposal_id, current_user.vendor_id, db)
    db_expense = db.query(ProposalExpense).filter(ProposalExpense.id == expense_id, ProposalExpense.proposal_id == proposal_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
        
    db.delete(db_expense)
    db.commit()
    return None
