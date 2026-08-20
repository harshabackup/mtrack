from typing import List, Dict, Any
from ..models.proposal import Proposal

def calculate_compatibility(base: Proposal, others: List[Proposal]) -> List[Dict[str, Any]]:
    """
    Calculates a basic compatibility score between a base proposal and a list of other proposals.
    """
    results = []
    
    for other in others:
        if base.id == other.id:
            continue
            
        score = 0
        max_score = 100
        breakdown = []
        
        # 1. Age Difference
        if base.age and other.age:
            age_diff = abs(base.age - other.age)
            if age_diff <= 5:
                score += 30
                breakdown.append(f"Good age match ({age_diff} years diff)")
            elif age_diff <= 10:
                score += 15
                breakdown.append(f"Fair age match ({age_diff} years diff)")
            else:
                score += 5
                breakdown.append(f"Large age difference ({age_diff} years diff)")
        else:
            max_score -= 30
            
        # 2. Location (City)
        if base.current_city and other.current_city:
            if base.current_city.lower().strip() == other.current_city.lower().strip():
                score += 20
                breakdown.append("Same city")
            else:
                score += 10
                breakdown.append("Different cities")
        else:
            max_score -= 20
            
        # 3. Employment
        if base.is_working and other.is_working:
            score += 20
            breakdown.append("Both working professionals")
        elif not base.is_working and not other.is_working:
            score += 10
            breakdown.append("Neither working")
        else:
            max_score -= 20
            
        # 4. Rasi / Nakshatra 
        if base.rasi and other.rasi:
            score += 15
            
            # Simple element matching logic
            FIRE_RASIS = ["Mesha (Aries)", "Simha (Leo)", "Dhanu (Sagittarius)"]
            EARTH_RASIS = ["Vrishabha (Taurus)", "Kanya (Virgo)", "Makara (Capricorn)"]
            AIR_RASIS = ["Mithuna (Gemini)", "Tula (Libra)", "Kumbha (Aquarius)"]
            WATER_RASIS = ["Karka (Cancer)", "Vrischika (Scorpio)", "Meena (Pisces)"]
            
            base_rasi = base.rasi.strip()
            other_rasi = other.rasi.strip()
            
            # Helper to get element
            def get_element(r):
                if r in FIRE_RASIS: return "Fire"
                if r in EARTH_RASIS: return "Earth"
                if r in AIR_RASIS: return "Air"
                if r in WATER_RASIS: return "Water"
                return None
                
            base_elem = get_element(base_rasi)
            other_elem = get_element(other_rasi)
            
            if base_elem and other_elem:
                if base_elem == other_elem:
                    score += 10
                    max_score += 10
                    breakdown.append(f"Matching Astrological Elements ({base_elem})")
                elif (base_elem == "Fire" and other_elem == "Air") or (base_elem == "Air" and other_elem == "Fire"):
                    score += 8
                    max_score += 10
                    breakdown.append("Friendly Astrological Elements (Fire & Air)")
                elif (base_elem == "Earth" and other_elem == "Water") or (base_elem == "Water" and other_elem == "Earth"):
                    score += 8
                    max_score += 10
                    breakdown.append("Friendly Astrological Elements (Earth & Water)")
                else:
                    max_score += 10
                    breakdown.append(f"Astrology data present (Base: {base_rasi}, Match: {other_rasi})")
            else:
                breakdown.append(f"Astrology data present (Base: {base_rasi}, Match: {other_rasi})")
        else:
            max_score -= 15
            
        # 5. Caste / Religion
        if base.caste and other.caste:
            if base.caste.lower().strip() == other.caste.lower().strip():
                score += 15
                breakdown.append("Same community/caste")
            else:
                score += 5
                breakdown.append("Different community/caste")
        else:
            max_score -= 15

        final_score = int((score / max_score) * 100) if max_score > 0 else 0
        
        results.append({
            "proposal_id": other.id,
            "overall_score": final_score,
            "breakdown": breakdown
        })
        
    return results
