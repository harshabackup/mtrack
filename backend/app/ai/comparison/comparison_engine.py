from sqlalchemy.orm import Session
from ...models.proposal import Proposal
from ...models.ai import FamilyPreference, PreferenceLevel

class ComparisonEngine:
    def __init__(self, db: Session):
        self.db = db
        
    def compare(self, base_proposal: Proposal, match_proposal: Proposal, vendor_id: str):
        # Fetch family preferences
        preferences = self.db.query(FamilyPreference).filter(FamilyPreference.vendor_id == vendor_id).all()
        
        must_haves_met = 0
        must_haves_failed = 0
        preferred_met = 0
        flexible_met = 0
        
        common_points = []
        differences = []
        missing_info = []
        
        # Example deterministic checks
        if base_proposal.current_city and match_proposal.current_city:
            if base_proposal.current_city.lower() == match_proposal.current_city.lower():
                common_points.append(f"Both located in {base_proposal.current_city}")
            else:
                differences.append(f"Location mismatch: {base_proposal.current_city} vs {match_proposal.current_city}")
        else:
            missing_info.append("Location missing for one or both profiles")
            
        # This can be expanded to check against actual preferences
        for pref in preferences:
            # mock logic
            if pref.category == "Location":
                if match_proposal.current_city and match_proposal.current_city.lower() == pref.requirement.lower():
                    if pref.level == PreferenceLevel.MUST_HAVE: must_haves_met += 1
                    if pref.level == PreferenceLevel.PREFERRED: preferred_met += 1
                else:
                    if pref.level == PreferenceLevel.MUST_HAVE: must_haves_failed += 1
                    
        return {
            "preference_alignment": (must_haves_met * 2) + preferred_met - (must_haves_failed * 5),
            "common_points": common_points,
            "differences": differences,
            "missing_information": missing_info,
            "discussion_topics": ["Career plans", "Relocation timing"] if must_haves_failed > 0 else []
        }
