from typing import Optional
from sqlalchemy.orm import Session
from ..ollama_provider import OllamaProvider
from ..schemas import ProposalExtraction
from ...models.ai import ProposalField, VerificationStatus
from ...models.proposal import Proposal
import logging

logger = logging.getLogger(__name__)

class ProposalExtractor:
    def __init__(self, provider=None):
        self.provider = provider or OllamaProvider()
        
    async def extract_from_text(self, text: str, source_id: Optional[int], proposal_id: int, db: Session):
        import os
        if os.getenv("AI_API_KEY"):
            from ..openai_provider import OpenAICompatibleProvider
            provider = OpenAICompatibleProvider()
        else:
            from ..ollama_provider import OllamaProvider
            provider = OllamaProvider()
            
        system_prompt = (
            "You are an expert at extracting structured information from marriage biodatas/proposals. "
            "Extract the following fields from the provided text. If a field is not explicitly present, "
            "set its value to null. Do NOT invent or infer missing information. "
            "Set a confidence score between 0.0 and 1.0. Set source to 'OCR' or 'Document'."
        )
        
        try:
            extraction = await self.provider.generate_structured(
                prompt=text,
                schema=ProposalExtraction,
                system_prompt=system_prompt
            )
            
            if db and proposal_id:
                self._save_to_db(extraction, proposal_id, source_id, db)
                
            return extraction
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            raise
            
    def _save_to_db(self, extraction: ProposalExtraction, proposal_id: int, source_id: int, db: Session):
        for field_name, field_data in extraction.model_dump().items():
            if field_data['value'] is not None:
                new_field = ProposalField(
                    proposal_id=proposal_id,
                    field_name=field_name,
                    field_value=str(field_data['value']),
                    source_document_id=source_id,
                    confidence=field_data['confidence'],
                    verification_status=VerificationStatus.DOCUMENT_PROVIDED
                )
                db.add(new_field)
        db.commit()
