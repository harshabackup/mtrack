from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.proposal import Proposal

# Category weights (must sum to 100). Exposed so an admin UI could later make this
# vendor-configurable without touching the scoring logic itself.
DEFAULT_WEIGHTS = {
    "age": 15,
    "location": 10,
    "employment": 10,
    "community": 15,
    "astrology": 25,
    "preferences": 25,
}

FIRE_RASIS = ["Mesha (Aries)", "Simha (Leo)", "Dhanu (Sagittarius)"]
EARTH_RASIS = ["Vrishabha (Taurus)", "Kanya (Virgo)", "Makara (Capricorn)"]
AIR_RASIS = ["Mithuna (Gemini)", "Tula (Libra)", "Kumbha (Aquarius)"]
WATER_RASIS = ["Karka (Cancer)", "Vrischika (Scorpio)", "Meena (Pisces)"]


def _get_element(rasi: Optional[str]) -> Optional[str]:
    if not rasi:
        return None
    r = rasi.strip()
    if r in FIRE_RASIS: return "Fire"
    if r in EARTH_RASIS: return "Earth"
    if r in AIR_RASIS: return "Air"
    if r in WATER_RASIS: return "Water"
    return None


def _score_age(base: Proposal, other: Proposal):
    if not (base.age and other.age):
        return None
    diff = abs(base.age - other.age)
    if diff <= 5:
        return 100, f"Good age match ({diff} year{'s' if diff != 1 else ''} apart)"
    if diff <= 10:
        return 55, f"Fair age match ({diff} years apart)"
    return 20, f"Large age difference ({diff} years apart)"


def _score_location(base: Proposal, other: Proposal):
    if not (base.current_city and other.current_city):
        return None
    if base.current_city.lower().strip() == other.current_city.lower().strip():
        return 100, "Same city"
    return 50, f"Different cities ({base.current_city} vs {other.current_city})"


def _score_employment(base: Proposal, other: Proposal):
    if base.is_working is None or other.is_working is None:
        return None
    if base.is_working and other.is_working:
        return 100, "Both are working professionals"
    if not base.is_working and not other.is_working:
        return 60, "Neither is currently working"
    return 40, "One is working, the other is not"


def _score_community(base: Proposal, other: Proposal):
    if not (base.caste and other.caste):
        return None
    same_caste = base.caste.lower().strip() == other.caste.lower().strip()
    same_religion = bool(base.religion and other.religion and base.religion.lower().strip() == other.religion.lower().strip())
    if same_caste:
        return 100, "Same community/caste"
    if same_religion:
        return 55, "Same religion, different caste"
    return 25, "Different community/caste"


def _score_astrology_ashtakoota(base: Proposal, other: Proposal):
    """Attempts a real Ashtakoota (guna milan) calculation from birth details; falls back to
    the coarse rasi-element heuristic when dob/tob/pob are incomplete."""
    if base.dob and other.dob:
        try:
            from .astrology_engine import (
                parse_dob_tob, calculate_birth_chart, calculate_ashtakoota, detect_manglik_dosha
            )
            parsed_base = parse_dob_tob(base.dob, base.tob or "")
            parsed_other = parse_dob_tob(other.dob, other.tob or "")
            if parsed_base and parsed_other:
                # Birthplace coordinates aren't geocoded yet; default to a central India
                # reference point (IST, 20.59N 78.97E) when pob can't be resolved.
                lat, lon, tz = 20.5937, 78.9629, 5.5
                y1, mo1, d1, h1, mi1, s1 = parsed_base
                y2, mo2, d2, h2, mi2, s2 = parsed_other
                chart1 = calculate_birth_chart(y1, mo1, d1, h1, mi1, s1, lat, lon, tz)
                chart2 = calculate_birth_chart(y2, mo2, d2, h2, mi2, s2, lat, lon, tz)
                ashtakoota = calculate_ashtakoota(chart1, chart2)
                manglik1 = detect_manglik_dosha(chart1)
                manglik2 = detect_manglik_dosha(chart2)
                pct = round((ashtakoota["total"] / ashtakoota["maximum"]) * 100)
                note = f"Guna Milan: {ashtakoota['total']}/{ashtakoota['maximum']} ({ashtakoota['verdict']})"
                if manglik1["present"] != manglik2["present"]:
                    note += " — Manglik dosha mismatch, needs review"
                elif manglik1["present"] and manglik2["present"]:
                    note += " — Both Manglik (compatible)"
                return pct, note, {
                    "ashtakoota": ashtakoota,
                    "manglik_1": manglik1,
                    "manglik_2": manglik2,
                }
        except Exception:
            pass  # fall through to the coarse heuristic below

    base_elem = _get_element(base.rasi)
    other_elem = _get_element(other.rasi)
    if not (base.rasi and other.rasi):
        return None
    if base_elem and other_elem:
        if base_elem == other_elem:
            return 90, f"Matching astrological elements ({base_elem})"
        if {base_elem, other_elem} == {"Fire", "Air"}:
            return 70, "Friendly astrological elements (Fire & Air)"
        if {base_elem, other_elem} == {"Earth", "Water"}:
            return 70, "Friendly astrological elements (Earth & Water)"
        return 45, f"Astrology data present (Rasi: {base.rasi} vs {other.rasi})"
    return 50, f"Astrology data present (Rasi: {base.rasi} vs {other.rasi})"


def _score_preferences(other: Proposal, db: Optional[Session], vendor_id: Optional[str]):
    """Scores `other` against the vendor's stored family preferences (weighted by MUST_HAVE
    / PREFERRED / FLEXIBLE)."""
    if db is None or vendor_id is None:
        return None
    from ..models.ai import FamilyPreference, PreferenceLevel

    preferences = db.query(FamilyPreference).filter(FamilyPreference.vendor_id == str(vendor_id)).all()
    if not preferences:
        return None

    level_weight = {PreferenceLevel.MUST_HAVE: 3, PreferenceLevel.PREFERRED: 2, PreferenceLevel.FLEXIBLE: 1}
    field_map = {
        "location": other.current_city, "city": other.current_city,
        "religion": other.religion, "caste": other.caste, "community": other.caste,
        "education": other.education, "job": other.job_title, "occupation": other.job_title,
    }

    total_weight, earned_weight, matched, missed = 0, 0, [], []
    for pref in preferences:
        weight = level_weight.get(pref.level, 1)
        field_value = field_map.get(pref.category.strip().lower())
        total_weight += weight
        if field_value and field_value.strip().lower() == pref.requirement.strip().lower():
            earned_weight += weight
            matched.append(f"{pref.category}: {pref.requirement}")
        elif pref.level == PreferenceLevel.MUST_HAVE:
            missed.append(f"{pref.category}: {pref.requirement}")

    if total_weight == 0:
        return None
    pct = round((earned_weight / total_weight) * 100)
    if missed:
        note = f"Missed must-have preferences: {', '.join(missed)}"
    elif matched:
        note = f"Meets family preferences: {', '.join(matched)}"
    else:
        note = "No preference matches found"
    return pct, note


FACTOR_SCORERS = {
    "age": _score_age,
    "location": _score_location,
    "employment": _score_employment,
    "community": _score_community,
}


def calculate_compatibility(
    base: Proposal,
    others: List[Proposal],
    db: Optional[Session] = None,
    vendor_id: Optional[str] = None,
    weights: Optional[Dict[str, int]] = None,
) -> List[Dict[str, Any]]:
    """Computes a weighted compatibility score (0-100) for `base` against each of `others`.

    Combines simple demographic factors, real Ashtakoota (guna milan) astrology matching
    when birth details are available, and alignment against the vendor's stored family
    preferences. Each factor contributes to the overall score proportional to its weight,
    and factors with no data are excluded (their weight is redistributed across the rest)
    so missing fields don't unfairly tank a score.
    """
    weights = weights or DEFAULT_WEIGHTS
    results = []

    for other in others:
        if base.id == other.id:
            continue

        factors = []

        for key, scorer in FACTOR_SCORERS.items():
            outcome = scorer(base, other)
            if outcome is None:
                continue
            pct, note = outcome
            factors.append({"key": key, "label": key.capitalize(), "score": pct, "explanation": note})

        astro_outcome = _score_astrology_ashtakoota(base, other)
        if astro_outcome is not None:
            pct, note = astro_outcome[0], astro_outcome[1]
            factor = {"key": "astrology", "label": "Astrology (Guna Milan)", "score": pct, "explanation": note}
            if len(astro_outcome) > 2:
                factor["details"] = astro_outcome[2]
            factors.append(factor)

        pref_outcome = _score_preferences(other, db, vendor_id)
        if pref_outcome is not None:
            pct, note = pref_outcome
            factors.append({"key": "preferences", "label": "Family Preferences", "score": pct, "explanation": note})

        active_weight = sum(weights.get(f["key"], 0) for f in factors)
        if active_weight == 0:
            overall_score = 0
        else:
            weighted_sum = sum(f["score"] * weights.get(f["key"], 0) for f in factors)
            overall_score = round(weighted_sum / active_weight)

        for f in factors:
            f["weight_pct"] = round((weights.get(f["key"], 0) / active_weight) * 100) if active_weight else 0
            f["contribution"] = round(f["score"] * weights.get(f["key"], 0) / active_weight) if active_weight else 0

        results.append({
            "proposal_id": other.id,
            "overall_score": overall_score,
            "breakdown": [f["explanation"] for f in factors],
            "factors": factors,
        })

    return results
