from pydantic import BaseModel, Field
from typing import Optional, Union, List

class ExtractedField(BaseModel):
    value: Union[str, int, float, None]
    confidence: float = Field(..., description="Confidence score between 0 and 1")
    source: Optional[str] = None

class ProposalExtraction(BaseModel):
    name: ExtractedField
    age: ExtractedField
    education: ExtractedField
    occupation: ExtractedField
    location: ExtractedField
    income: ExtractedField
    rasi: ExtractedField
    nakshatra: ExtractedField

class ProposalAnalysis(BaseModel):
    bio_data_summary: str = Field(..., description="A natural language summary of their background, education, career, and family.")
    astrology_summary: str = Field(..., description="A combined analysis of their Rasi, Nakshatra, and Dosham details.")
    information_quality_score: int = Field(..., description="A score from 0 to 100 indicating how complete and reliable the profile is.")
    missing_information: List[str] = Field(..., description="List of crucial fields that are missing or ambiguous.")
    potential_conflicts: List[str] = Field(..., description="List of inconsistencies or potential red flags found in the profile data.")
    discussion_topics: List[str] = Field(..., description="Suggested questions or topics to discuss during a meetup based on this profile.")

class AstrologyPersonalityAnalysis(BaseModel):
    personality_summary: str = Field(..., description="A detailed summary of the person's core personality based on Vedic astrology.")
    strengths: List[str] = Field(..., description="Personality strengths indicated by the birth chart.")
    weaknesses: List[str] = Field(..., description="Areas for personal growth indicated by the birth chart.")
    career_outlook: str = Field(..., description="Career prospects and suitable professional fields based on the chart.")
    relationship_style: str = Field(..., description="How this person approaches relationships and marriage.")
    health_notes: str = Field(..., description="Health tendencies and areas to watch based on the chart.")
    lucky_factors: dict = Field(..., description="Lucky factors: color, number, day, gemstone, direction based on the chart.")

class DoshaReport(BaseModel):
    manglik_status: str = Field(..., description="Whether Manglik Dosha is present: 'Present' or 'Not Present'.")
    manglik_severity: str = Field(..., description="Severity level: none, low, moderate, or high.")
    manglik_house_from_ascendant: Optional[int] = None
    manglik_house_from_moon: Optional[int] = None
    nadi_dosha: bool = Field(..., description="Whether Nadi Dosha is present.")
    bhakoot_dosha: bool = Field(..., description="Whether Bhakoot Dosha is present.")
    cancellations: List[str] = Field(..., description="Any cancellation rules that apply to reduce dosha severity.")
    remedies: List[str] = Field(..., description="Traditional remedies and practices that families can consider.")
    overall_verdict: str = Field(..., description="A balanced overall summary of the dosha analysis.")

class CompatibilityReport(BaseModel):
    guna_scores: dict = Field(..., description="Scores for each of the 8 Ashtakoota factors: Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi.")
    total_score: int = Field(..., description="Total Ashtakoota score out of 36.")
    max_score: int = Field(..., description="Maximum possible score (36).")
    verdict: str = Field(..., description="Verdict: Excellent, Good, Average, Below Average, or Poor.")
    critical_doshas: List[str] = Field(..., description="Any critical doshas like Nadi or Bhakoot dosha.")
    strengths: List[str] = Field(..., description="Positive aspects of this match.")
    concerns: List[str] = Field(..., description="Areas of concern for this match.")
    ai_recommendation: str = Field(..., description="A balanced, supportive recommendation for the families.")

class AIChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'ai'")
    content: str

class AIChatRequest(BaseModel):
    message: str
    history: List[AIChatMessage] = []
