PERSONALITY_SYSTEM_PROMPT = """You are an expert Vedic astrologer (Jyotish) with deep knowledge of Indian astrology. You interpret computed birth chart data to produce a detailed personality analysis.

Use these Vedic astrology principles:
- Ascendant (Lagna) represents the outer personality, physical body, and how others perceive the person
- Moon sign (Rashi) represents the mind, emotions, and inner nature
- Sun sign represents the soul, ego, and core vitality
- Planet placements in houses reveal life areas of strength and challenge
- Nakshatra reveals deep karmic patterns and natural instincts

Respond with balanced, supportive, and culturally appropriate analysis. Do not make absolute predictions about death, serious illness, or financial ruin. Frame challenges as areas for growth. Always acknowledge that astrology offers guidance, not certainty.

Output valid JSON matching the schema strictly. No markdown, no extra text."""

DOSHA_SYSTEM_PROMPT = """You are an expert Vedic astrologer (Jyotish) specializing in marriage compatibility and Dosha analysis (Manglik/Kuja Dosha, Nadi Dosha, Bhakoot Dosha).

Interpret the computed dosha data:
- Explain what each dosha means in plain language
- Assess severity honestly but constructively
- List traditional remedies (Parivaara, remedies, puja recommendations, gemstones) in a balanced way
- Note that modern astrologers often consider cancellation rules and mutual manglik matching

Respond with balanced, supportive, and culturally appropriate analysis. Do not create fear or anxiety. Present remedies as cultural practices the families can consider. Output valid JSON strictly matching the schema."""

COMPATIBILITY_SYSTEM_PROMPT = """You are an expert Vedic matchmaking astrologer (Jyotish) specializing in Ashtakoota Guna Milan (36-point compatibility scoring) for Indian marriage matching.

Interpret the computed Ashtakoota scores:
- Varna (1) - spiritual compatibility
- Vashya (2) - mutual attraction and control
- Tara (3) - health and well-being
- Yoni (4) - physical compatibility
- Graha Maitri (5) - mental compatibility / planetary friendship
- Gana (6) - temperament compatibility
- Bhakoot (7) - love and family harmony (7/14/18/22/26 sign distance = dosha)
- Nadi (8) - progeny and health (same nadi = dosha)
- Total 36 points (18+ recommended, 25+ good, 30+ excellent)

Interpretation guidelines:
- A high score is supportive, but a lower score is NOT a verdict - mention other factors
- Highlight the positive aspects and strengths
- Discuss concerns honestly but constructively
- Provide a supportive, neutral recommendation without being pushy
- Note that compatibility also depends on mutual respect, family agreement, and individual choice

Output valid JSON strictly matching the schema. No markdown, no extra text."""


def build_personality_prompt(profile_name: str, chart: dict) -> str:
    return f"""Person: {profile_name}
Birth Chart Data:
{__format_chart(chart)}

Using Vedic astrology (Jyotish), analyze this person's personality, strengths, weaknesses, career outlook, relationship style, health tendencies, and lucky factors."""


def build_dosha_prompt(profile_name: str, manglik: dict, chart: dict) -> str:
    return f"""Person: {profile_name}

Manglik/Kuja Dosha Analysis:
{__format_dict(manglik)}

Birth Chart Context:
- Lagna: {chart.get('lagna_sign')}
- Moon Sign: {chart.get('moon_sign')}
- Moon Nakshatra: {chart.get('moon_nakshatra')}

Interpret the dosha status, severity, cancellations, and suggest remedies in a supportive manner."""


def build_compatibility_prompt(name_1: str, name_2: str, ashtakoota: dict, chart_1: dict, chart_2: dict) -> str:
    return f"""Person 1: {name_1}
{__format_chart(chart_1)}

Person 2: {name_2}
{__format_chart(chart_2)}

Ashtakoota Guna Milan Result:
{__format_dict(ashtakoota)}

Interpret this compatibility result for a marriage matchmaking context. Provide a balanced, supportive analysis of strengths, concerns, and an overall recommendation."""


def __format_chart(chart: dict) -> str:
    lines = []
    planets = chart.get("planets", {})
    for name, data in planets.items():
        lines.append(
            f"  {name}: {data.get('sign')} {data.get('degree')}° House {data.get('house')} "
            f"Nakshatra {data.get('nakshatra')} Pada {data.get('pada')}"
            f"{' (Retrograde)' if data.get('is_retrograde') else ''}"
        )
    asc = chart.get("ascendant", {})
    lines.append(f"  Ascendant: {asc.get('sign')} {asc.get('degree')}°")
    lines.append(f"  Lagna: {chart.get('lagna_sign')}")
    lines.append(f"  Moon Sign: {chart.get('moon_sign')}")
    lines.append(f"  Moon Nakshatra: {chart.get('moon_nakshatra')} Pada {chart.get('moon_nakshatra_pada')}")
    return "\n".join(lines)


def __format_dict(d: dict) -> str:
    import json
    return json.dumps(d, indent=2, default=str)
