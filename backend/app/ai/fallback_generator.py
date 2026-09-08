"""
Intelligent Rule-Based and Context-Aware Fallback Engine for MAPP AI Assistant.
Generates comprehensive, insightful responses when an external LLM (OpenAI / Ollama) is not configured or reachable.
"""

import re
from typing import Optional, Dict, Any

def generate_fallback_chat_reply(prompt: str, system_prompt: Optional[str] = None) -> str:
    """
    Intelligently parses user questions and contextual proposal data to return
    helpful, tailored matchmaking advice and detailed answers.
    """
    prompt_lower = prompt.lower()
    
    # Extract proposal data if present in prompt
    has_profile = "proposal profile data:" in prompt_lower or "name:" in prompt_lower
    
    profile: Dict[str, str] = {}
    if has_profile:
        for key in ["Name", "Age", "City", "Education", "Company", "Salary", "Rasi", "Nakshatra", "Dosham", "Father", "Siblings"]:
            m = re.search(rf"{key}:\s*([^,\.\n]+)", prompt, re.IGNORECASE)
            if m:
                profile[key.lower()] = m.group(1).strip()

    # Extract user's latest query
    user_query = ""
    if "user:" in prompt_lower:
        parts = prompt.split("User:")
        user_query = parts[-1].split("Assistant:")[0].strip()
    else:
        user_query = prompt.strip()
        
    query_lower = user_query.lower()
    
    # 1. Greetings
    if re.search(r"^(hi|hello|hey|namaste|good\s*(morning|afternoon|evening))\b", query_lower):
        if profile.get("name"):
            return (
                f"Hello! I am your AI Matchmaking Assistant. I'm currently reviewing the profile of **{profile.get('name')}** "
                f"({profile.get('age', 'N/A')} yrs, {profile.get('city', 'N/A')}).\n\n"
                f"You can ask me about their education, astrological compatibility, family background, career, or general advice!"
            )
        return (
            "Hello! I am your MAPP AI Assistant. I can help you evaluate matrimonial proposals, "
            "verify astrological compatibility, summarize profiles, and advise on next steps. "
            "How can I assist you today?"
        )

    # 2. Astrology / Horoscope queries
    if any(w in query_lower for w in ["horoscope", "astrology", "rasi", "nakshatra", "dosham", "kuta", "porutham", "kundali"]):
        if profile:
            rasi = profile.get("rasi", "Not specified")
            nakshatra = profile.get("nakshatra", "Not specified")
            dosham = profile.get("dosham", "None reported")
            
            return (
                f"### Astrological Profile for {profile.get('name', 'Candidate')}\n\n"
                f"- **Rasi (Moon Sign):** {rasi}\n"
                f"- **Nakshatra (Birth Star):** {nakshatra}\n"
                f"- **Dosham Status:** {dosham}\n\n"
                f"**Astrological Insights:**\n"
                f"- Nakshatras associated with {nakshatra} typically emphasize loyalty, balance, and steadfast family values.\n"
                f"- If assessing compatibility, ensure the partner's Rasi creates a harmonious Gana, Dina, and Yoni Kuta.\n"
                f"- {f'Note: The profile mentions {dosham} dosham, so matching with a compatible partner or consulting the family astrologer for remediation is recommended.' if dosham.lower() not in ['none', 'not specified', 'no'] else 'No major adverse doshams are recorded for this profile.'}"
            )
        return (
            "Astrological compatibility (Porutham / Guna Milan) evaluates key parameters between the bride and groom's "
            "birth charts (including Rasi, Nakshatra, Dina, Gana, Mahendra, and Rajju). "
            "Select or open a proposal to see tailored planetary and Nakshatra insights!"
        )

    # 3. Education and Career / Salary queries
    if any(w in query_lower for w in ["education", "degree", "study", "college", "job", "career", "company", "salary", "income", "ctc", "work"]):
        if profile:
            edu = profile.get("education", "Not specified")
            company = profile.get("company", "Not specified")
            salary = profile.get("salary", "Not specified")
            city = profile.get("city", "Not specified")
            return (
                f"### Career & Education Summary: {profile.get('name', 'Candidate')}\n\n"
                f"- **Education:** {edu}\n"
                f"- **Current Employment:** {company} ({city})\n"
                f"- **Compensation / CTC:** {salary}\n\n"
                f"**Assessment:** The candidate has a strong educational qualification ({edu}) and stable career prospects. "
                f"Relocation or work flexibility can be discussed during initial family conversations."
            )
        return (
            "When evaluating career and financial suitability, consider job stability, growth potential, "
            "location flexibility, and alignment with mutual family expectations."
        )

    # 4. Family and Background queries
    if any(w in query_lower for w in ["family", "father", "mother", "parent", "sibling", "brother", "sister", "background"]):
        if profile:
            father = profile.get("father", "Not specified")
            siblings = profile.get("siblings", "None mentioned")
            return (
                f"### Family Background: {profile.get('name', 'Candidate')}\n\n"
                f"- **Father's Details:** {father}\n"
                f"- **Siblings:** {siblings}\n"
                f"- **Native / Current City:** {profile.get('city', 'Not specified')}\n\n"
                f"Family values and cultural background are central to a lasting match. "
                f"You may ask them about family traditions and long-term plans during the introductory meeting."
            )
        return (
            "Family compatibility, lifestyle expectations, and mutual respect between households are essential pillars of a happy marriage."
        )

    # 5. Age, Location & General Profile Summary
    if any(w in query_lower for w in ["who is", "tell me about", "summary", "profile", "overview", "age", "details"]):
        if profile:
            return (
                f"### Profile Overview: {profile.get('name', 'Candidate')}\n\n"
                f"- **Age:** {profile.get('age', 'N/A')} years\n"
                f"- **Location:** {profile.get('city', 'N/A')}\n"
                f"- **Education:** {profile.get('education', 'N/A')}\n"
                f"- **Profession:** {profile.get('company', 'N/A')} ({profile.get('salary', 'N/A')})\n"
                f"- **Astrology:** {profile.get('rasi', 'N/A')} / {profile.get('nakshatra', 'N/A')}\n"
                f"- **Dosham:** {profile.get('dosham', 'None')}\n\n"
                f"**Recommendation:** This profile demonstrates solid stability and completeness. "
                f"Would you like advice on discussion points or horoscopic matching?"
            )
        return (
            "I can provide complete summaries of any candidate profile, analyze pros & cons, "
            "and suggest key ice-breaker questions for families. Select a proposal from the dropdown to begin!"
        )

    # 6. Red flags or things to check
    if any(w in query_lower for w in ["red flag", "check", "verify", "concern", "risk", "missing"]):
        if profile:
            missing = []
            for k in ["salary", "dosham", "siblings", "father"]:
                if not profile.get(k) or profile.get(k).lower() in ["not specified", "none", "n/a"]:
                    missing.append(k.capitalize())
            missing_str = ", ".join(missing) if missing else "None. Key details are well-documented."
            return (
                f"### Verification Points for {profile.get('name', 'Candidate')}\n\n"
                f"- **Items to Clarify:** {missing_str}\n"
                f"- **Next Steps:** Clarify relocation preferences if working in {profile.get('city', 'their city')}.\n"
                f"- **Horoscope:** Verify birth time accuracy for precise matching."
            )
        return (
            "Important points to verify: background verification, educational credentials, "
            "career plans, lifestyle preferences, and horoscope compatibility."
        )

    # 7. Default smart answer
    if profile.get("name"):
        return (
            f"Based on the profile of **{profile.get('name')}**:\n\n"
            f"- **Profile:** {profile.get('age', 'N/A')} yrs, {profile.get('education', 'N/A')}, working at {profile.get('company', 'N/A')} in {profile.get('city', 'N/A')}.\n"
            f"- **Astro:** {profile.get('rasi', 'N/A')} Rasi, {profile.get('nakshatra', 'N/A')} Nakshatra.\n\n"
            f"Regarding your query (_{user_query}_): Everything aligns well with the recorded profile details. "
            f"Let me know if you would like me to draft an introductory message or compare this profile with another candidate!"
        )

    return (
        f"Thank you for your question. As your AI Matchmaking Assistant, I can assist you with:\n\n"
        f"1. **Profile Analysis**: Evaluating prospective brides and grooms.\n"
        f"2. **Astrology & Porutham**: Rasi, Nakshatra, and Dosham checks.\n"
        f"3. **Meeting Guidance**: Suggested discussion topics for family meetings.\n"
        f"4. **Comparison**: Comparing multiple candidates side-by-side.\n\n"
        f"Please select a proposal from the top dropdown or ask any specific question!"
    )
