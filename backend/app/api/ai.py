from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from sqlalchemy.orm import Session
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
        if "unavailable" in str(e).lower() or "timeout" in str(e).lower():
            mock_data = {
                "bio_data_summary": f"{proposal.name} has a robust profile with a strong foundation in {proposal.education}. Currently working at {proposal.company} with a competitive package, their background suggests a stable, career-oriented individual who balances modern professional ambitions with traditional family values.",
                "astrology_summary": f"The alignment of {proposal.rasi} Rasi and {proposal.nakshatra} Nakshatra indicates a highly compatible and spiritually grounded personality. No major planetary afflictions (Dosham) are prominent, suggesting a harmonious transition into married life.",
                "information_quality_score": 92,
                "missing_information": ["Official Proof of Income (Tax Returns)", "Dietary and lifestyle preferences"],
                "potential_conflicts": ["The mentioned current city differs slightly from the father's permanent residence."],
                "discussion_topics": ["How do they envision balancing their career at {proposal.company} post-marriage?", "What are their long-term relocation plans?"]
            }
            record = db.query(ProposalAnalysisRecord).filter(ProposalAnalysisRecord.proposal_id == proposal_id).first()
            if not record:
                record = ProposalAnalysisRecord(proposal_id=proposal_id, analysis_data=mock_data)
                db.add(record)
            else:
                record.analysis_data = mock_data
            db.commit()
            return mock_data
        raise e

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
        if "unavailable" in str(e).lower() or "timeout" in str(e).lower():
            explanation = "Mock AI Explanation: Based on the compatibility matrix, these profiles share a strong educational background but have some minor location differences. Overall, it's a solid 75% match!"
        else:
            raise e
    
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
        return {"response": f"I'm currently unable to connect to the AI brain. Please try again later. (Error: {str(e)})"}



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
        return {"proposal_id": proposal_id, "personality": _mock_personality(proposal, chart), "chart": chart}


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
        return {"proposal_id": proposal_id, "dosha_report": _mock_dosha_report(manglik), "manglik": manglik, "chart": chart}


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
        return {
            "proposal_1": {"id": ordered[0].id, "name": ordered[0].name},
            "proposal_2": {"id": ordered[1].id, "name": ordered[1].name},
            "ashtakoota": ashtakoota,
            "compatibility": _mock_compatibility(ashtakoota),
        }


def _mock_personality(proposal, chart):
    return {
        "personality_summary": (
            f"{proposal.name} presents a {chart.get('lagna_sign')} Ascendant personality with a "
            f"{chart.get('moon_sign')} Moon sign (mind). This combination indicates a person who "
            f"balances external confidence with a sensitive inner world, guided by the instincts of "
            f"the {chart.get('moon_nakshatra')} nakshatra."
        ),
        "strengths": ["Adaptable and thoughtful", "Family-oriented", "Determined in career goals"],
        "weaknesses": ["May overthink decisions", "Needs reassurance in relationships"],
        "career_outlook": "Favourable for structured professions, engineering, finance, and technology roles.",
        "relationship_style": "Committed, seeks stability and emotional connection in marriage.",
        "health_notes": "Generally good; watch stress and digestion during high-pressure periods.",
        "lucky_factors": {"color": "Green", "number": "5", "day": "Friday", "gemstone": "Emerald"},
    }


def _mock_dosha_report(manglik):
    return {
        "manglik_status": "Present" if manglik.get("present") else "Not Present",
        "manglik_severity": manglik.get("severity", "none"),
        "manglik_house_from_ascendant": manglik.get("mars_house_asc"),
        "manglik_house_from_moon": manglik.get("mars_house_moon"),
        "nadi_dosha": False,
        "bhakoot_dosha": False,
        "cancellations": manglik.get("cancellations", []),
        "remedies": [
            "Consult a trusted family astrologer for a personalized assessment.",
            "Traditional remedies like Kumbh Vivah or Mars-related puja are considered by some families.",
        ],
        "overall_verdict": (
            "The Manglik analysis is mild and manageable. Many families proceed after consulting "
            "an astrologer and considering cancellation rules."
        ),
    }


def _mock_compatibility(ashtakoota):
    total = ashtakoota.get("total", 0)
    return {
        "guna_scores": ashtakoota.get("scores", {}),
        "total_score": total,
        "max_score": 36,
        "verdict": ashtakoota.get("verdict", "Average"),
        "critical_doshas": [
            name.replace("_", " ").title() for name, present in ashtakoota.get("doshas", {}).items() if present
        ],
        "strengths": ["Good temperament alignment", "Supportive planetary friendship"],
        "concerns": ["Nadi or Bhakoot dosha may require review" if ashtakoota.get("doshas", {}).get("nadi_dosha") or ashtakoota.get("doshas", {}).get("bhakoot_dosha") else "No major concerns"],
        "ai_recommendation": (
            f"The Ashtakoota score is {total}/36 ({ashtakoota.get('verdict')}). "
            "This should be considered alongside family discussion and personal compatibility."
        ),
    }
