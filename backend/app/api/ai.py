from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from ..core.database import get_db
from ..core.permissions import require_vendor
from ..models.user import User
from ..models.proposal import Proposal, ProposalMedicalRecord
from ..ai.extraction.proposal_extractor import ProposalExtractor
import os
import asyncio

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

@router.get("/proposals/{proposal_id}/fields")
def get_proposal_fields(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    from ..models.ai import ProposalField
    fields = db.query(ProposalField).filter(ProposalField.proposal_id == proposal_id).all()
    return fields

@router.post("/proposals/{proposal_id}/extract")
async def extract_proposal_data(
    proposal_id: int, 
    document_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_vendor)
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.vendor_id == current_user.vendor_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    doc = None
    if document_id:
        doc = db.query(ProposalMedicalRecord).filter(ProposalMedicalRecord.id == document_id, ProposalMedicalRecord.proposal_id == proposal_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
    if doc:
        file_path = f"storage/{doc.file_url}" if not doc.file_url.startswith("storage") else doc.file_url
        if not os.path.exists(file_path):
            text = "Mock OCR text: Name: Harsha, Age: 28, Education: B.Tech"
        else:
            with open(file_path, "rb") as f:
                from ..services.ocr_service import perform_ocr
                text = perform_ocr(f.read())
        source_id = doc.id
    else:
        # Fallback to existing structured text
        text = f"Name: {proposal.name}, Age: {proposal.age}, City: {proposal.current_city}, Education: {proposal.education}, Company: {proposal.company}, Salary: {proposal.salary_ctc}"
        source_id = None
        
    extractor = ProposalExtractor()
    await extractor.extract_from_text(text, source_id=source_id, proposal_id=proposal.id, db=db)
    
    return {"message": "Extraction complete"}

@router.get("/proposals/{proposal_id}/analysis")
def get_proposal_analysis(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    from ..models.ai import ProposalAnalysisRecord
    record = db.query(ProposalAnalysisRecord).filter(ProposalAnalysisRecord.proposal_id == proposal_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return record.analysis_data

@router.post("/proposals/{proposal_id}/analyze")
async def analyze_proposal(
    proposal_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_vendor)
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.vendor_id == current_user.vendor_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    text = f"Name: {proposal.name}, Age: {proposal.age}, City: {proposal.current_city}, Education: {proposal.education}, Company: {proposal.company}, Salary: {proposal.salary_ctc}. Rasi: {proposal.rasi}, Nakshatra: {proposal.nakshatra}, Dosham: {proposal.dosham}. Father: {proposal.father_name}, Siblings: {proposal.siblings_details}."
    
    from ..ai.schemas import ProposalAnalysis
    import os
    
    if os.getenv("AI_API_KEY"):
        from ..ai.openai_provider import OpenAICompatibleProvider
        provider = OpenAICompatibleProvider()
    else:
        from ..ai.ollama_provider import OllamaProvider
        provider = OllamaProvider()
        
    from ..models.ai import ProposalAnalysisRecord
    
    system_prompt = "You are an expert matchmaking AI. Analyze the provided proposal data holistically. Generate a detailed bio summary, astrology summary, give an information quality score out of 100 based on completeness, list any missing crucial info (like salary, family details), identify any red flags or conflicts, and suggest a few discussion topics for the families to talk about."
    
    try:
        extraction = await provider.generate_structured(
            prompt=text,
            schema=ProposalAnalysis,
            system_prompt=system_prompt
        )
        
        # Save to DB
        record = db.query(ProposalAnalysisRecord).filter(ProposalAnalysisRecord.proposal_id == proposal_id).first()
        if not record:
            record = ProposalAnalysisRecord(proposal_id=proposal_id, analysis_data=extraction.model_dump())
            db.add(record)
        else:
            record.analysis_data = extraction.model_dump()
            
        db.commit()
        return record.analysis_data
        
    except Exception as e:
        import logging
        logging.error(f"AI generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI provider failed to generate analysis: {e}")

@router.get("/proposals/compare-ai")
async def ai_compare_proposals(
    ids: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    id_list = [int(i.strip()) for i in ids.split(",") if i.strip().isdigit()]
    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Must provide at least two IDs")
        
    from ..services.compatibility import calculate_compatibility
    from ..ai.ollama_provider import OllamaProvider
    
    proposals = db.query(Proposal).filter(Proposal.id.in_(id_list), Proposal.vendor_id == current_user.vendor_id).all()
    proposal_dict = {p.id: p for p in proposals}
    ordered = [proposal_dict[p] for p in id_list if p in proposal_dict]
    
    if len(ordered) < 2:
        raise HTTPException(status_code=404, detail="Proposals not found")
        
    matrix = calculate_compatibility(ordered[0], ordered[1:])
    
    import os
    if os.getenv("AI_API_KEY"):
        from ..ai.openai_provider import OpenAICompatibleProvider
        provider = OpenAICompatibleProvider()
    else:
        from ..ai.ollama_provider import OllamaProvider
        provider = OllamaProvider()
        
    prompt = f"Explain this matchmaking compatibility result in a supportive, neutral tone: {matrix}"
    try:
        explanation = await provider.generate(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI provider failed to explain comparison: {e}")
    
    return {
        "ai_explanation": explanation
    }

@router.post("/proposals/{proposal_id}/chat")
async def chat_with_proposal_ai(
    proposal_id: int,
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    from ..ai.schemas import AIChatRequest
    try:
        chat_request = AIChatRequest(**request)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid request format")
        
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id, Proposal.vendor_id == current_user.vendor_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    import os
    if os.getenv("AI_API_KEY"):
        from ..ai.openai_provider import OpenAICompatibleProvider
        provider = OpenAICompatibleProvider()
    else:
        from ..ai.ollama_provider import OllamaProvider
        provider = OllamaProvider()
        
    # Build context
    context = f"Proposal Profile Data:\nName: {proposal.name}, Age: {proposal.age}, City: {proposal.current_city}, Education: {proposal.education}, Company: {proposal.company}, Salary: {proposal.salary_ctc}. Rasi: {proposal.rasi}, Nakshatra: {proposal.nakshatra}, Dosham: {proposal.dosham}. Father: {proposal.father_name}, Siblings: {proposal.siblings_details}.\n\n"
    
    system_prompt = "You are a helpful matchmaking assistant. Answer the user's questions about the proposal profile provided in the context. Keep your answers concise, supportive, and strictly based on the provided profile details."
    
    # Format history
    history_str = ""
    for msg in chat_request.history[-5:]: # Keep last 5 messages for context
        prefix = "User: " if msg.role == "user" else "Assistant: "
        history_str += f"{prefix}{msg.content}\n"
        
    prompt = f"{context}Conversation History:\n{history_str}\nUser: {chat_request.message}\nAssistant:"
    
    try:
        response_text = await provider.generate(prompt, system_prompt=system_prompt)
        return {"response": response_text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI provider failed to respond: {e}")



def _get_provider():
    import os
    if os.getenv("AI_API_KEY"):
        from ..ai.openai_provider import OpenAICompatibleProvider
        return OpenAICompatibleProvider()
    from ..ai.ollama_provider import OllamaProvider
    return OllamaProvider()


def _compute_chart(db: Session, proposal: Proposal, current_user: User):
    from ..api.astrology import compute_chart_for_proposal
    return compute_chart_for_proposal(proposal)


def _find_proposal_or_404(proposal_id: int, current_user: User, db: Session) -> Proposal:
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id, Proposal.vendor_id == current_user.vendor_id
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal


@router.post("/proposals/{proposal_id}/personality")
async def proposal_personality(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    from ..ai.schemas import AstrologyPersonalityAnalysis
    from ..ai.astrology_prompts import PERSONALITY_SYSTEM_PROMPT, build_personality_prompt

    proposal = _find_proposal_or_404(proposal_id, current_user, db)
    chart = _compute_chart(db, proposal, current_user)
    provider = _get_provider()

    prompt = build_personality_prompt(proposal.name, chart)
    try:
        result = await provider.generate_structured(
            prompt=prompt,
            schema=AstrologyPersonalityAnalysis,
            system_prompt=PERSONALITY_SYSTEM_PROMPT,
        )
        return {"proposal_id": proposal_id, "personality": result.model_dump(), "chart": chart}
    except Exception as e:
        import logging
        logging.error(f"AI generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI provider failed to generate personality report: {e}")


@router.post("/proposals/{proposal_id}/dosha-report")
async def proposal_dosha_report(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    from ..ai.schemas import DoshaReport
    from ..ai.astrology_prompts import DOSHA_SYSTEM_PROMPT, build_dosha_prompt

    proposal = _find_proposal_or_404(proposal_id, current_user, db)
    chart = _compute_chart(db, proposal, current_user)

    from ..services.astrology_engine import detect_manglik_dosha
    manglik = detect_manglik_dosha(chart)

    provider = _get_provider()
    prompt = build_dosha_prompt(proposal.name, manglik, chart)
    try:
        result = await provider.generate_structured(
            prompt=prompt,
            schema=DoshaReport,
            system_prompt=DOSHA_SYSTEM_PROMPT,
        )
        return {"proposal_id": proposal_id, "dosha_report": result.model_dump(), "manglik": manglik, "chart": chart}
    except Exception as e:
        import logging
        logging.error(f"AI generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI provider failed to generate dosha report: {e}")


@router.post("/proposals/compare-astrology")
async def compare_astrology(
    ids: str = Query(..., description="Comma-separated proposal IDs"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor)
):
    from ..ai.schemas import CompatibilityReport
    from ..ai.astrology_prompts import COMPATIBILITY_SYSTEM_PROMPT, build_compatibility_prompt

    id_list = [int(i.strip()) for i in ids.split(",") if i.strip().isdigit()]
    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Must provide at least two proposal IDs")

    proposals = db.query(Proposal).filter(
        Proposal.id.in_(id_list), Proposal.vendor_id == current_user.vendor_id
    ).all()
    proposal_dict = {p.id: p for p in proposals}
    ordered = [proposal_dict[pid] for pid in id_list if pid in proposal_dict]
    if len(ordered) < 2:
        raise HTTPException(status_code=404, detail="Proposals not found")

    chart_1 = _compute_chart(db, ordered[0], current_user)
    chart_2 = _compute_chart(db, ordered[1], current_user)

    from ..services.astrology_engine import calculate_ashtakoota
    ashtakoota = calculate_ashtakoota(chart_1, chart_2)

    provider = _get_provider()
    prompt = build_compatibility_prompt(ordered[0].name, ordered[1].name, ashtakoota, chart_1, chart_2)
    try:
        result = await provider.generate_structured(
            prompt=prompt,
            schema=CompatibilityReport,
            system_prompt=COMPATIBILITY_SYSTEM_PROMPT,
        )
        return {
            "proposal_1": {"id": ordered[0].id, "name": ordered[0].name},
            "proposal_2": {"id": ordered[1].id, "name": ordered[1].name},
            "ashtakoota": ashtakoota,
            "compatibility": result.model_dump(),
        }
    except Exception as e:
        import logging
        logging.error(f"AI generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI provider failed to generate compatibility report: {e}")


# ──────────────────────────────────────────────────────────────
# GLOBAL CHAT  — sessions + messages (persisted to DB)
# ──────────────────────────────────────────────────────────────

@router.get("/proposals-list")
def proposals_list_for_chat(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    """Lightweight list of proposals (id + name) for the chat proposal selector."""
    proposals = db.query(Proposal.id, Proposal.name).filter(
        Proposal.vendor_id == current_user.vendor_id
    ).order_by(Proposal.name).all()
    return [{"id": p.id, "name": p.name} for p in proposals]


@router.get("/chat/sessions")
def list_chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    from ..models.ai import ChatSession
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.vendor_id == current_user.vendor_id)
        .order_by(ChatSession.started_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": s.id,
            "proposal_id": s.proposal_id,
            "proposal_name": s.proposal.name if s.proposal else None,
            "is_active": s.is_active,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            "message_count": len(s.messages),
        }
        for s in sessions
    ]


@router.post("/chat/sessions")
def create_chat_session(
    body: dict = {},
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    from ..models.ai import ChatSession
    # End any currently active sessions
    db.query(ChatSession).filter(
        ChatSession.vendor_id == current_user.vendor_id,
        ChatSession.is_active == 1,
    ).update({"is_active": 0, "ended_at": func.now()})

    session = ChatSession(
        vendor_id=current_user.vendor_id,
        proposal_id=body.get("proposal_id"),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {
        "id": session.id,
        "proposal_id": session.proposal_id,
        "proposal_name": session.proposal.name if session.proposal else None,
        "is_active": session.is_active,
        "started_at": session.started_at.isoformat() if session.started_at else None,
    }


@router.get("/chat/sessions/{session_id}")
def get_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    from ..models.ai import ChatSession
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.vendor_id == current_user.vendor_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": session.id,
        "proposal_id": session.proposal_id,
        "proposal_name": session.proposal.name if session.proposal else None,
        "is_active": session.is_active,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
        "messages": [
            {"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at.isoformat() if m.created_at else None}
            for m in session.messages
        ],
    }


@router.post("/chat/sessions/{session_id}/end")
def end_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    from ..models.ai import ChatSession
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.vendor_id == current_user.vendor_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.is_active = 0
    session.ended_at = func.now()
    db.commit()
    return {"message": "Session ended"}


@router.post("/chat/sessions/{session_id}/messages")
async def send_chat_message(
    session_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    from ..models.ai import ChatSession, ChatMessage

    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.vendor_id == current_user.vendor_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_message = body.get("message", "").strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Save user message
    user_msg = ChatMessage(session_id=session.id, role="user", content=user_message)
    db.add(user_msg)
    db.commit()

    # Build context from proposal (if any)
    context = ""
    if session.proposal_id:
        proposal = db.query(Proposal).filter(Proposal.id == session.proposal_id).first()
        if proposal:
            context = (
                f"Proposal Profile Data:\n"
                f"Name: {proposal.name}, Age: {proposal.age}, "
                f"City: {proposal.current_city}, Education: {proposal.education}, "
                f"Company: {proposal.company}, Salary: {proposal.salary_ctc}. "
                f"Rasi: {proposal.rasi}, Nakshatra: {proposal.nakshatra}, Dosham: {proposal.dosham}. "
                f"Father: {proposal.father_name}, Siblings: {proposal.siblings_details}.\n\n"
            )

    # Load recent history from DB
    recent_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(12)
        .all()
    )
    recent_messages.reverse()

    history_str = ""
    for msg in recent_messages[:-1]:  # exclude the message we just inserted
        prefix = "User: " if msg.role == "user" else "Assistant: "
        history_str += f"{prefix}{msg.content}\n"

    system_prompt = (
        "You are a helpful matchmaking assistant. "
        "Answer the user's questions about the proposal profile provided in the context. "
        "If no proposal is selected, answer general matchmaking questions. "
        "Keep your answers concise, supportive, and helpful."
    )

    prompt = f"{context}Conversation History:\n{history_str}\nUser: {user_message}\nAssistant:"

    provider = _get_provider()
    try:
        response_text = await provider.generate(prompt, system_prompt=system_prompt)
        ai_content = response_text.strip()
    except Exception as e:
        ai_content = f"I'm sorry, I encountered an error: {str(e)}"

    # Save AI response
    ai_msg = ChatMessage(session_id=session.id, role="ai", content=ai_content)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return {
        "user_message": {"id": user_msg.id, "role": "user", "content": user_message, "created_at": user_msg.created_at.isoformat() if user_msg.created_at else None},
        "ai_message": {"id": ai_msg.id, "role": "ai", "content": ai_content, "created_at": ai_msg.created_at.isoformat() if ai_msg.created_at else None},
    }
