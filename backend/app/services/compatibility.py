import re
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from ..models.proposal import Proposal

# Category weights (sum to 100). Each factor is scored 0-100 independently; a factor
# with no data on either side is dropped and its weight redistributed across the rest,
# so an incomplete profile is scored on what's actually known rather than penalized.
DEFAULT_WEIGHTS = {
    "age": 10,
    "location": 8,
    "employment": 7,
    "community": 12,
    "education": 8,
    "income": 7,
    "diet": 6,
    "height": 5,
    "family_type": 5,
    "astrology": 17,
    "preferences": 15,
}

FIRE_RASIS = ["Mesha (Aries)", "Simha (Leo)", "Dhanu (Sagittarius)"]
EARTH_RASIS = ["Vrishabha (Taurus)", "Kanya (Virgo)", "Makara (Capricorn)"]
AIR_RASIS = ["Mithuna (Gemini)", "Tula (Libra)", "Kumbha (Aquarius)"]
WATER_RASIS = ["Karka (Cancer)", "Vrischika (Scorpio)", "Meena (Pisces)"]

EDUCATION_TIERS = [
    (0, ("10th", "sslc", "matriculation")),
    (1, ("12th", "puc", "hsc", "intermediate")),
    (2, ("diploma", "iti")),
    (3, ("bachelor", "b.tech", "btech", "b.e", "be ", "bsc", "b.sc", "ba ", "b.a", "bcom", "b.com", "bba")),
    (4, ("master", "m.tech", "mtech", "msc", "m.sc", "mba", "ma ", "m.a", "mcom", "m.com", "pg")),
    (5, ("phd", "doctorate", "ph.d")),
]


def _education_tier(text: Optional[str]) -> Optional[int]:
    if not text:
        return None
    t = text.lower()
    best = None
    for tier, keywords in EDUCATION_TIERS:
        if any(kw in t for kw in keywords):
            best = tier if best is None else max(best, tier)
    return best


def _parse_income_lpa(text: Optional[str]) -> Optional[float]:
    """Best-effort parse of a free-text salary/CTC string into lakhs-per-annum."""
    if not text:
        return None
    t = text.lower().replace(",", "").strip()
    match = re.search(r"([\d.]+)\s*(lpa|lakh|lakhs|l\b)", t)
    if match:
        return float(match.group(1))
    match = re.search(r"([\d.]+)\s*(cr|crore)", t)
    if match:
        return float(match.group(1)) * 100
    match = re.search(r"([\d.]+)", t)
    if match:
        value = float(match.group(1))
        return value / 100000 if value > 1000 else value  # treat raw rupee figures as such
    return None


def _parse_height_cm(text: Optional[str]) -> Optional[float]:
    if not text:
        return None
    t = text.strip().lower()
    match = re.search(r"(\d+)\s*cm", t)
    if match:
        return float(match.group(1))
    match = re.match(r"(\d+)\s*'\s*(\d+)?", t)  # 5'6 or 5' 6"
    if match:
        feet = int(match.group(1))
        inches = int(match.group(2)) if match.group(2) else 0
        return round((feet * 12 + inches) * 2.54, 1)
    match = re.search(r"(\d+(\.\d+)?)", t)
    if match:
        value = float(match.group(1))
        return value if value > 50 else None  # bare small numbers are ambiguous, skip
    return None


def _get_element(rasi: Optional[str]) -> Optional[str]:
    if not rasi:
        return None
    r = rasi.strip()
    if r in FIRE_RASIS: return "Fire"
    if r in EARTH_RASIS: return "Earth"
    if r in AIR_RASIS: return "Air"
    if r in WATER_RASIS: return "Water"
    return None


def _csv_set(value: Optional[str]) -> set:
    if not value:
        return set()
    return {v.strip().lower() for v in value.split(",") if v.strip()}


# ---------------------------------------------------------------------------
# Individual factor scorers. Each returns (score_0_100, explanation) or None
# when there isn't enough data on either side to judge the factor.
# ---------------------------------------------------------------------------

def _score_age(base: Proposal, other: Proposal):
    if not (base.age and other.age):
        return None
    diff = abs(base.age - other.age)
    if diff <= 3:
        return 100, f"Very close in age ({diff} year{'s' if diff != 1 else ''} apart)"
    if diff <= 5:
        return 85, f"Good age match ({diff} years apart)"
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


def _score_education(base: Proposal, other: Proposal):
    t1, t2 = _education_tier(base.education), _education_tier(other.education)
    if t1 is None or t2 is None:
        return None
    diff = abs(t1 - t2)
    if diff == 0:
        return 100, "Comparable education level"
    if diff == 1:
        return 75, "Similar education level (one tier apart)"
    if diff == 2:
        return 45, "Somewhat different education level"
    return 20, "Significantly different education level"


def _score_income(base: Proposal, other: Proposal):
    i1, i2 = _parse_income_lpa(base.salary_ctc), _parse_income_lpa(other.salary_ctc)
    if i1 is None or i2 is None:
        return None
    if i1 == 0 and i2 == 0:
        return 60, "Income data not meaningfully comparable"
    ratio = min(i1, i2) / max(i1, i2) if max(i1, i2) > 0 else 1
    pct = round(40 + ratio * 60)  # ratio 1.0 -> 100, ratio 0 -> 40
    return pct, f"Income levels {'closely matched' if ratio > 0.7 else 'differ notably'} (~{i1:g} vs ~{i2:g} LPA)"


def _score_diet(base: Proposal, other: Proposal):
    if not (base.diet and other.diet):
        return None
    d1, d2 = base.diet.strip().lower(), other.diet.strip().lower()
    if d1 == d2:
        return 100, f"Same dietary preference ({base.diet})"
    compatible_pairs = {frozenset({"eggetarian", "vegetarian"}), frozenset({"eggetarian", "non-vegetarian"})}
    if frozenset({d1, d2}) in compatible_pairs:
        return 65, f"Compatible diets ({base.diet} & {other.diet})"
    return 35, f"Different dietary preferences ({base.diet} vs {other.diet})"


def _score_height(base: Proposal, other: Proposal):
    h1, h2 = _parse_height_cm(base.height), _parse_height_cm(other.height)
    if h1 is None or h2 is None:
        return None
    diff = abs(h1 - h2)
    if diff <= 10:
        return 100, f"Comfortable height difference ({diff:.0f} cm)"
    if diff <= 20:
        return 65, f"Moderate height difference ({diff:.0f} cm)"
    return 35, f"Large height difference ({diff:.0f} cm)"


def _score_family_type(base: Proposal, other: Proposal):
    if not (base.family_type and other.family_type):
        return None
    if base.family_type.strip().lower() == other.family_type.strip().lower():
        return 100, f"Same family background ({base.family_type})"
    return 60, f"Different family background ({base.family_type} vs {other.family_type})"


def _score_astrology_ashtakoota(base: Proposal, other: Proposal):
    """Real Ashtakoota (guna milan) calculation using geocoded birth details when dob/tob
    are present; falls back to the coarse rasi-element heuristic otherwise."""
    if base.dob and other.dob:
        try:
            from .astrology_engine import (
                parse_dob_tob, calculate_birth_chart, calculate_ashtakoota, detect_manglik_dosha
            )
            from .geocoding import resolve_birthplace

            parsed_base = parse_dob_tob(base.dob, base.tob or "")
            parsed_other = parse_dob_tob(other.dob, other.tob or "")
            if parsed_base and parsed_other:
                lat1, lon1, tz1 = resolve_birthplace(base.pob, base.current_city)
                lat2, lon2, tz2 = resolve_birthplace(other.pob, other.current_city)
                y1, mo1, d1, h1, mi1, s1 = parsed_base
                y2, mo2, d2, h2, mi2, s2 = parsed_other
                chart1 = calculate_birth_chart(y1, mo1, d1, h1, mi1, s1, lat1, lon1, tz1)
                chart2 = calculate_birth_chart(y2, mo2, d2, h2, mi2, s2, lat2, lon2, tz2)
                ashtakoota = calculate_ashtakoota(chart1, chart2)
                manglik1 = detect_manglik_dosha(chart1)
                manglik2 = detect_manglik_dosha(chart2)
                pct = round((ashtakoota["total"] / ashtakoota["maximum"]) * 100)
                note = f"Guna Milan: {ashtakoota['total']}/{ashtakoota['maximum']} ({ashtakoota['verdict']})"
                manglik_mismatch = manglik1["present"] != manglik2["present"]
                if manglik_mismatch:
                    note += " — Manglik dosha mismatch, needs review"
                elif manglik1["present"] and manglik2["present"]:
                    note += " — Both Manglik (compatible)"
                return pct, note, {
                    "ashtakoota": ashtakoota,
                    "manglik_1": manglik1,
                    "manglik_2": manglik2,
                    "manglik_mismatch": manglik_mismatch,
                    "nadi_dosha": ashtakoota["doshas"]["nadi_dosha"],
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


# ---------------------------------------------------------------------------
# Preference matching (mutual, per-profile) + deal-breaker vetoes
# ---------------------------------------------------------------------------

def _check_preference_against(pref, candidate: Proposal) -> Tuple[int, int, List[str], List[str]]:
    """Checks `candidate` against one side's ProposalPreference. Returns
    (checks_passed, checks_total, satisfied_notes, violated_notes)."""
    passed, total = 0, 0
    satisfied, violated = [], []
    if pref is None:
        return passed, total, satisfied, violated

    if pref.min_age is not None or pref.max_age is not None:
        total += 1
        if candidate.age is not None and \
           (pref.min_age is None or candidate.age >= pref.min_age) and \
           (pref.max_age is None or candidate.age <= pref.max_age):
            passed += 1
            satisfied.append("age within desired range")
        else:
            violated.append(f"age outside desired range ({pref.min_age or '-'}-{pref.max_age or '-'})")

    if pref.preferred_cities:
        total += 1
        cities = _csv_set(pref.preferred_cities)
        if candidate.current_city and candidate.current_city.strip().lower() in cities:
            passed += 1
            satisfied.append("city matches preference")
        else:
            violated.append(f"city not in preferred list ({pref.preferred_cities})")

    if pref.preferred_religions:
        total += 1
        religions = _csv_set(pref.preferred_religions)
        if candidate.religion and candidate.religion.strip().lower() in religions:
            passed += 1
            satisfied.append("religion matches preference")
        else:
            violated.append(f"religion not in preferred list ({pref.preferred_religions})")

    if pref.preferred_castes:
        total += 1
        castes = _csv_set(pref.preferred_castes)
        if candidate.caste and candidate.caste.strip().lower() in castes:
            passed += 1
            satisfied.append("caste matches preference")
        else:
            violated.append(f"caste not in preferred list ({pref.preferred_castes})")

    if pref.preferred_diets:
        total += 1
        diets = _csv_set(pref.preferred_diets)
        if candidate.diet and candidate.diet.strip().lower() in diets:
            passed += 1
            satisfied.append("diet matches preference")
        else:
            violated.append(f"diet not in preferred list ({pref.preferred_diets})")

    if pref.preferred_education_levels:
        total += 1
        levels = _csv_set(pref.preferred_education_levels)
        cand_tier = _education_tier(candidate.education)
        if cand_tier is not None and any(_education_tier(lvl) == cand_tier for lvl in levels):
            passed += 1
            satisfied.append("education matches preference")
        else:
            violated.append("education does not match preferred levels")

    if pref.preferred_family_types:
        total += 1
        types = _csv_set(pref.preferred_family_types)
        if candidate.family_type and candidate.family_type.strip().lower() in types:
            passed += 1
            satisfied.append("family type matches preference")
        else:
            violated.append(f"family type not in preferred list ({pref.preferred_family_types})")

    if pref.min_income_lpa is not None:
        total += 1
        cand_income = _parse_income_lpa(candidate.salary_ctc)
        if cand_income is not None and cand_income >= pref.min_income_lpa:
            passed += 1
            satisfied.append("income meets minimum")
        else:
            violated.append(f"income below minimum ({pref.min_income_lpa} LPA)")

    if pref.must_be_working is not None:
        total += 1
        if candidate.is_working == pref.must_be_working:
            passed += 1
            satisfied.append("employment status matches preference")
        else:
            violated.append("employment status doesn't match preference")

    if pref.min_height_cm is not None or pref.max_height_cm is not None:
        total += 1
        cand_height = _parse_height_cm(candidate.height)
        if cand_height is not None and \
           (pref.min_height_cm is None or cand_height >= pref.min_height_cm) and \
           (pref.max_height_cm is None or cand_height <= pref.max_height_cm):
            passed += 1
            satisfied.append("height within desired range")
        else:
            violated.append("height outside desired range")

    return passed, total, satisfied, violated


def _evaluate_deal_breakers(pref, candidate: Proposal) -> List[str]:
    """Evaluates the explicit `deal_breakers` JSON list stored on a preference record
    against `candidate`. Each entry: {"field": "...", "op": "eq|neq|max|min|in", "value": ...}."""
    if pref is None or not pref.deal_breakers:
        return []

    violations = []
    field_getters = {
        "age": lambda c: c.age,
        "current_city": lambda c: c.current_city,
        "religion": lambda c: c.religion,
        "caste": lambda c: c.caste,
        "diet": lambda c: c.diet,
        "family_type": lambda c: c.family_type,
        "is_working": lambda c: c.is_working,
        "marital_status": lambda c: c.marital_status,
        "education": lambda c: c.education,
        "income_lpa": lambda c: _parse_income_lpa(c.salary_ctc),
        "height_cm": lambda c: _parse_height_cm(c.height),
    }

    for rule in pref.deal_breakers:
        field, op, value = rule.get("field"), rule.get("op", "eq"), rule.get("value")
        getter = field_getters.get(field)
        if not getter:
            continue
        actual = getter(candidate)
        if actual is None:
            continue  # can't evaluate without data; don't veto on missing info

        ok = True
        try:
            if op == "eq":
                ok = str(actual).strip().lower() == str(value).strip().lower()
            elif op == "neq":
                ok = str(actual).strip().lower() != str(value).strip().lower()
            elif op == "max":
                ok = float(actual) <= float(value)
            elif op == "min":
                ok = float(actual) >= float(value)
            elif op == "in":
                options = {str(v).strip().lower() for v in (value if isinstance(value, list) else [value])}
                ok = str(actual).strip().lower() in options
        except (TypeError, ValueError):
            ok = True  # malformed rule/data - don't veto on a bad comparison

        if not ok:
            violations.append(f"Deal-breaker failed: {field} ({actual}) does not satisfy {op} {value}")

    return violations


def _score_preferences(base: Proposal, other: Proposal, db: Optional[Session], vendor_id: Optional[str]):
    """Mutual preference score: checks `other` against `base`'s stated ProposalPreference
    and vice versa, plus the vendor's general FamilyPreference list. Also collects any
    deal-breaker veto reasons found on either side."""
    veto_reasons: List[str] = []
    total_passed, total_checks = 0, 0
    notes: List[str] = []

    base_pref = getattr(base, "preference", None)
    other_pref = getattr(other, "preference", None)

    for pref, candidate, label in ((base_pref, other, "their"), (other_pref, base, "your side's")):
        passed, checks, satisfied, violated = _check_preference_against(pref, candidate)
        total_passed += passed
        total_checks += checks
        if violated:
            notes.append(f"Doesn't meet {label} preferences: {', '.join(violated)}")
        veto_reasons.extend(_evaluate_deal_breakers(pref, candidate))

    # Fold in the vendor-wide FamilyPreference list (applies to "other" only - it
    # represents the vendor's general intake criteria, not a specific profile's ask).
    if db is not None and vendor_id is not None:
        from ..models.ai import FamilyPreference, PreferenceLevel
        vendor_prefs = db.query(FamilyPreference).filter(FamilyPreference.vendor_id == str(vendor_id)).all()
        field_map = {
            "location": other.current_city, "city": other.current_city,
            "religion": other.religion, "caste": other.caste, "community": other.caste,
            "education": other.education, "job": other.job_title, "occupation": other.job_title,
        }
        for vp in vendor_prefs:
            field_value = field_map.get(vp.category.strip().lower())
            total_checks += 1
            if field_value and field_value.strip().lower() == vp.requirement.strip().lower():
                total_passed += 1
            elif vp.level == PreferenceLevel.MUST_HAVE:
                veto_reasons.append(f"Deal-breaker failed: vendor requires {vp.category} = {vp.requirement}")

    if total_checks == 0:
        return None, veto_reasons

    pct = round((total_passed / total_checks) * 100)
    note = "; ".join(notes) if notes else f"Meets {total_passed}/{total_checks} stated preferences"
    return (pct, note), veto_reasons


FACTOR_SCORERS = {
    "age": _score_age,
    "location": _score_location,
    "employment": _score_employment,
    "community": _score_community,
    "education": _score_education,
    "income": _score_income,
    "diet": _score_diet,
    "height": _score_height,
    "family_type": _score_family_type,
}

VETO_SCORE_CAP = 15  # overall score is capped at this when a hard deal-breaker fails


def calculate_compatibility(
    base: Proposal,
    others: List[Proposal],
    db: Optional[Session] = None,
    vendor_id: Optional[str] = None,
    weights: Optional[Dict[str, int]] = None,
) -> List[Dict[str, Any]]:
    """Computes a weighted, explainable compatibility score (0-100) for `base` against
    each of `others`.

    Combines demographic factors (age/location/employment/community/education/income/
    diet/height/family type), real Ashtakoota (guna milan) astrology matching when birth
    details are available, and a two-way mutual preference check (each profile's own
    ProposalPreference plus the vendor's general FamilyPreference list). A hard
    deal-breaker on either side caps the score and is surfaced separately so it can't be
    silently averaged away by otherwise-strong factors.
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
            factors.append({"key": key, "label": key.replace("_", " ").capitalize(), "score": pct, "explanation": note})

        astro_outcome = _score_astrology_ashtakoota(base, other)
        if astro_outcome is not None:
            pct, note = astro_outcome[0], astro_outcome[1]
            factor = {"key": "astrology", "label": "Astrology (Guna Milan)", "score": pct, "explanation": note}
            if len(astro_outcome) > 2:
                factor["details"] = astro_outcome[2]
            factors.append(factor)

        pref_outcome, veto_reasons = _score_preferences(base, other, db, vendor_id)
        if pref_outcome is not None:
            pct, note = pref_outcome
            factors.append({"key": "preferences", "label": "Mutual Preferences", "score": pct, "explanation": note})

        active_weight = sum(weights.get(f["key"], 0) for f in factors)
        if active_weight == 0:
            overall_score = 0
        else:
            weighted_sum = sum(f["score"] * weights.get(f["key"], 0) for f in factors)
            overall_score = round(weighted_sum / active_weight)

        for f in factors:
            f["weight_pct"] = round((weights.get(f["key"], 0) / active_weight) * 100) if active_weight else 0
            f["contribution"] = round(f["score"] * weights.get(f["key"], 0) / active_weight) if active_weight else 0

        vetoed = len(veto_reasons) > 0
        if vetoed:
            overall_score = min(overall_score, VETO_SCORE_CAP)

        results.append({
            "proposal_id": other.id,
            "overall_score": overall_score,
            "breakdown": [f["explanation"] for f in factors] + veto_reasons,
            "factors": factors,
            "vetoed": vetoed,
            "veto_reasons": veto_reasons,
        })

    return results
