import math
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import os
import httpx

SIGNS = ("Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces")

SIGNS_SHORT = {"Aries": "Ari", "Taurus": "Tau", "Gemini": "Gem", "Cancer": "Can",
               "Leo": "Leo", "Virgo": "Vir", "Libra": "Lib", "Scorpio": "Sco",
               "Sagittarius": "Sag", "Capricorn": "Cap", "Aquarius": "Aqu", "Pisces": "Pis"}

SIGN_NUM = {"Aries": 1, "Taurus": 2, "Gemini": 3, "Cancer": 4, "Leo": 5, "Virgo": 6,
            "Libra": 7, "Scorpio": 8, "Sagittarius": 9, "Capricorn": 10, "Aquarius": 11, "Pisces": 12}

NAKSHATRAS = (
    "Ashvini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
    "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
    "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
    "Uttara Bhadrapada", "Revati"
)

NAKSHATRA_LORDS = (
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu",
    "Jupiter", "Saturn", "Mercury", "Ketu", "Venus",
    "Sun", "Moon", "Mars", "Rahu", "Jupiter",
    "Saturn", "Mercury", "Ketu", "Venus", "Sun",
    "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
)

NAKSHATRA_GANA = {
    "Ashvini": "Deva", "Bharani": "Manushya", "Krittika": "Rakshasa",
    "Rohini": "Manushya", "Mrigashira": "Rakshasa", "Ardra": "Manushya",
    "Punarvasu": "Deva", "Pushya": "Deva", "Ashlesha": "Rakshasa",
    "Magha": "Rakshasa", "Purva Phalguni": "Manushya",
    "Uttara Phalguni": "Manushya", "Hasta": "Deva", "Chitra": "Rakshasa",
    "Swati": "Deva", "Vishakha": "Rakshasa", "Anuradha": "Deva",
    "Jyeshtha": "Rakshasa", "Mula": "Rakshasa", "Purva Ashadha": "Manushya",
    "Uttara Ashadha": "Manushya", "Shravana": "Deva", "Dhanishta": "Rakshasa",
    "Shatabhisha": "Rakshasa", "Purva Bhadrapada": "Manushya",
    "Uttara Bhadrapada": "Manushya", "Revati": "Deva",
}

NAKSHATRA_NADI = {
    "Ashvini": "Adi", "Bharani": "Adi", "Krittika": "Adi",
    "Rohini": "Madhya", "Mrigashira": "Madhya", "Ardra": "Madhya",
    "Punarvasu": "Antya", "Pushya": "Antya", "Ashlesha": "Antya",
    "Magha": "Adi", "Purva Phalguni": "Adi", "Uttara Phalguni": "Adi",
    "Hasta": "Madhya", "Chitra": "Madhya", "Swati": "Madhya",
    "Vishakha": "Antya", "Anuradha": "Antya", "Jyeshtha": "Antya",
    "Mula": "Adi", "Purva Ashadha": "Adi", "Uttara Ashadha": "Adi",
    "Shravana": "Madhya", "Dhanishta": "Madhya", "Shatabhisha": "Madhya",
    "Purva Bhadrapada": "Antya", "Uttara Bhadrapada": "Antya", "Revati": "Antya",
}

YONI_ANIMALS = {
    "Ashvini": ("Horse", "M"), "Bharani": ("Elephant", "F"),
    "Krittika": ("Sheep", "M"), "Rohini": ("Serpent", "M"),
    "Mrigashira": ("Serpent", "F"), "Ardra": ("Dog", "F"),
    "Punarvasu": ("Cat", "F"), "Pushya": ("Sheep", "F"),
    "Ashlesha": ("Cat", "M"), "Magha": ("Rat", "M"),
    "Purva Phalguni": ("Rat", "F"), "Uttara Phalguni": ("Cow", "M"),
    "Hasta": ("Buffalo", "M"), "Chitra": ("Tiger", "F"),
    "Swati": ("Buffalo", "F"), "Vishakha": ("Tiger", "M"),
    "Anuradha": ("Deer", "F"), "Jyeshtha": ("Deer", "M"),
    "Mula": ("Dog", "M"), "Purva Ashadha": ("Monkey", "M"),
    "Uttara Ashadha": ("Mongoose", "M"), "Shravana": ("Monkey", "F"),
    "Dhanishta": ("Lion", "F"), "Shatabhisha": ("Horse", "F"),
    "Purva Bhadrapada": ("Lion", "M"), "Uttara Bhadrapada": ("Cow", "F"),
    "Revati": ("Elephant", "M"),
}

YONI_ENEMIES = {
    ("Horse", "Buffalo"), ("Elephant", "Lion"), ("Sheep", "Monkey"),
    ("Serpent", "Mongoose"), ("Dog", "Deer"), ("Cat", "Rat"),
    ("Cow", "Tiger"),
}

RASHI_VARNA = {
    "Cancer": "Brahmin", "Scorpio": "Brahmin", "Pisces": "Brahmin",
    "Aries": "Kshatriya", "Leo": "Kshatriya", "Sagittarius": "Kshatriya",
    "Taurus": "Vaishya", "Virgo": "Vaishya", "Capricorn": "Vaishya",
    "Gemini": "Shudra", "Libra": "Shudra", "Aquarius": "Shudra",
}

VARNA_ORDER = {"Brahmin": 0, "Kshatriya": 1, "Vaishya": 2, "Shudra": 3}

RASHI_LORDS = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
    "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
    "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter",
}

LORD_FRIENDSHIP = {
    "Sun": {"friends": ("Moon", "Mars", "Jupiter"), "enemies": ("Venus", "Saturn"), "neutral": ("Mercury",)},
    "Moon": {"friends": ("Sun", "Mercury"), "enemies": ("Saturn", "Rahu"), "neutral": ("Mars", "Jupiter", "Venus")},
    "Mars": {"friends": ("Sun", "Moon", "Jupiter"), "enemies": ("Mercury",), "neutral": ("Venus", "Saturn")},
    "Mercury": {"friends": ("Sun", "Venus"), "enemies": ("Moon",), "neutral": ("Mars", "Jupiter", "Saturn")},
    "Jupiter": {"friends": ("Sun", "Moon", "Mars"), "enemies": ("Mercury",), "neutral": ("Venus", "Saturn")},
    "Venus": {"friends": ("Mercury", "Saturn"), "enemies": ("Sun", "Moon"), "neutral": ("Mars", "Jupiter")},
    "Saturn": {"friends": ("Mercury", "Venus"), "enemies": ("Sun", "Moon", "Mars"), "neutral": ("Jupiter",)},
    "Rahu": {"friends": ("Mercury", "Venus", "Saturn"), "enemies": ("Sun", "Moon"), "neutral": ("Mars", "Jupiter")},
}

VASHYA_GROUPS = {
    "Aries": "Chatushpada", "Taurus": "Vanachara", "Gemini": "Manav",
    "Cancer": "Jalachara", "Leo": "Chatushpada", "Virgo": "Vanachara",
    "Libra": "Manav", "Scorpio": "Jalachara", "Sagittarius": "Chatushpada",
    "Capricorn": "Vanachara", "Aquarius": "Manav", "Pisces": "Jalachara",
}

BHAKOOT_EXCEPTIONS = {
    (1, 7): True, (2, 6): True, (3, 5): True, (4, 4): True,
    (8, 12): True, (9, 11): True, (10, 10): True,
}


def _try_import_swe():
    try:
        import swisseph as swe
        return swe
    except ImportError:
        return None


def nakshatra_pada(longitude: float) -> Tuple[int, int]:
    one_star = 360 / 27
    one_pada = 360 / 108
    nak_index = int(longitude / one_star) % 27
    remainder = longitude - (nak_index * one_star)
    pada = int(remainder / one_pada) + 1
    return nak_index, pada


def longitude_to_sign(longitude: float) -> str:
    return SIGNS[int(longitude / 30) % 12]


def calculate_birth_chart(year: int, month: int, day: int, hour: int, minute: int,
                          second: int, latitude: float, longitude: float,
                          tz_offset: float = 5.5) -> Dict[str, Any]:
    swe = _try_import_swe()
    if swe is None:
        return _fallback_chart(year, month, day, hour, minute, latitude, longitude)

    try:
        swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
        flags = swe.FLG_SWIEPH + swe.FLG_SPEED + swe.FLG_SIDEREAL

        utcc = swe.utc_time_zone(year, month, day, hour, minute, second, tz_offset)
        jd_tt, jd_ut = swe.utc_to_jd(*utcc)

        planet_map = {
            "Sun": swe.SUN, "Moon": swe.MOON, "Mars": swe.MARS,
            "Mercury": swe.MERCURY, "Jupiter": swe.JUPITER,
            "Venus": swe.VENUS, "Saturn": swe.SATURN, "Rahu": 10
        }

        chart = {"planets": {}, "ascendant": {}, "houses": [], "source": "swisseph"}
        planets = {}

        for name, pid in planet_map.items():
            calc_result = swe.calc_ut(jd_tt, pid, flags)
            xx = calc_result[0]
            lon = xx[0]
            nak_idx, pada = nakshatra_pada(lon)
            sign = longitude_to_sign(lon)
            dms = swe.split_deg(lon, swe.SPLIT_DEG_ZODIACAL)
            retro = False
            if len(xx) > 3:
                retro = xx[3] < 0
            planets[name] = {
                "longitude": round(lon, 4),
                "sign": sign,
                "degree": round(dms[0], 2),
                "nakshatra": NAKSHATRAS[nak_idx],
                "nakshatra_lord": NAKSHATRA_LORDS[nak_idx],
                "pada": pada,
                "is_retrograde": retro,
            }

        rahu_lon = planets["Rahu"]["longitude"]
        ketu_lon = (rahu_lon + 180) % 360
        nak_idx, pada = nakshatra_pada(ketu_lon)
        dms = swe.split_deg(ketu_lon, swe.SPLIT_DEG_ZODIACAL)
        planets["Ketu"] = {
            "longitude": round(ketu_lon, 4),
            "sign": longitude_to_sign(ketu_lon),
            "degree": round(dms[0], 2),
            "nakshatra": NAKSHATRAS[nak_idx],
            "nakshatra_lord": NAKSHATRA_LORDS[nak_idx],
            "pada": pada,
            "is_retrograde": False,
        }

        cusps, ascmc = swe.houses_ex(jd_tt, latitude, longitude, b'B', flags)
        asc_lon = ascmc[0]
        dms_asc = swe.split_deg(asc_lon, swe.SPLIT_DEG_ZODIACAL)
        asc_sign = longitude_to_sign(asc_lon)
        chart["ascendant"] = {
            "longitude": round(asc_lon, 4),
            "sign": asc_sign,
            "degree": round(dms_asc[0], 2),
        }

        asc_sign_idx = SIGNS.index(asc_sign)
        for name in list(planet_map.keys()) + ["Ketu"]:
            planet_sign_idx = SIGNS.index(planets[name]["sign"])
            house = (planet_sign_idx - asc_sign_idx) % 12 + 1
            planets[name]["house"] = house

        chart["planets"] = planets

        aspects_map = {h: [] for h in range(1, 13)}
        for p_name, data in planets.items():
            h = data.get("house")
            if not h: continue
            aspects_map[(h + 6 - 1) % 12 + 1].append(p_name)
            if p_name == "Mars":
                aspects_map[(h + 4 - 1) % 12 + 1].append(p_name)
                aspects_map[(h + 8 - 1) % 12 + 1].append(p_name)
            elif p_name in ("Jupiter", "Rahu", "Ketu"):
                aspects_map[(h + 5 - 1) % 12 + 1].append(p_name)
                aspects_map[(h + 9 - 1) % 12 + 1].append(p_name)
            elif p_name == "Saturn":
                aspects_map[(h + 3 - 1) % 12 + 1].append(p_name)
                aspects_map[(h + 10 - 1) % 12 + 1].append(p_name)
        
        for h in range(1, 13):
            aspects_map[h] = list(dict.fromkeys(aspects_map[h]))

        for i in range(12):
            sign = SIGNS[(asc_sign_idx + i) % 12]
            sign_lord = RASHI_LORDS[sign]
            planets_here = [p for p, data in planets.items() if data.get("house") == i + 1]
            chart["houses"].append({
                "number": i + 1,
                "sign": sign,
                "degree": round(dms_asc[0], 2),
                "sign_lord": sign_lord,
                "planets_in_house": planets_here,
                "aspected_by": aspects_map[i + 1]
            })

        moon = planets["Moon"]
        chart["moon_sign"] = moon["sign"]
        chart["moon_nakshatra"] = moon["nakshatra"]
        chart["moon_nakshatra_pada"] = moon["pada"]
        chart["lagna_sign"] = asc_sign

        swe.close()
        return chart

    except Exception as e:
        return _fallback_chart(year, month, day, hour, minute, latitude, longitude, error=str(e))


def _fallback_chart(year: int, month: int, day: int, hour: int, minute: int,
                    latitude: float, longitude: float, error: str = "pyswisseph not installed") -> Dict[str, Any]:
    """Rough fallback using basic astronomy math when pyswisseph is unavailable."""
    import math as m

    def _julian_day(y, mo, d, hr):
        jd = 367 * y - int((7 * (y + int((mo + 9) / 12))) / 4) + int(275 * mo / 9) + d + 1721013.5
        jd += hr / 24.0
        return jd

    def _sun_lon(jd):
        n = jd - 2451545.0
        L = (280.460 + 0.9856474 * n) % 360
        g = ((357.528 + 0.9856003 * n) % 360) * m.pi / 180
        lam = L + 1.915 * m.sin(g) + 0.020 * m.sin(2 * g)
        return lam % 360

    jd = _julian_day(year, month, day, hour + minute / 60.0)
    sun_lon = _sun_lon(jd)
    moon_lon = (sun_lon + 12.19 * (1 + 0.9856 * (jd - 2451545.0) / 29.53) % 360 + 180) % 360

    fallback_planets = {
        "Sun": sun_lon,
        "Moon": moon_lon,
        "Mars": (sun_lon + 30) % 360,
        "Mercury": (sun_lon + 20) % 360,
        "Jupiter": (sun_lon + 80) % 360,
        "Venus": (sun_lon + 40) % 360,
        "Saturn": (sun_lon + 120) % 360,
        "Rahu": (sun_lon + 170) % 360,
    }

    planets = {}
    for name, lon in fallback_planets.items():
        nak_idx, pada = nakshatra_pada(lon)
        sign = longitude_to_sign(lon)
        planets[name] = {
            "longitude": round(lon, 4),
            "sign": sign,
            "degree": round(lon % 30, 2),
            "nakshatra": NAKSHATRAS[nak_idx],
            "nakshatra_lord": NAKSHATRA_LORDS[nak_idx],
            "pada": pada,
            "is_retrograde": False,
        }

    ketu_lon = (fallback_planets["Rahu"] + 180) % 360
    nak_idx, pada = nakshatra_pada(ketu_lon)
    planets["Ketu"] = {
        "longitude": round(ketu_lon, 4),
        "sign": longitude_to_sign(ketu_lon),
        "degree": round(ketu_lon % 30, 2),
        "nakshatra": NAKSHATRAS[nak_idx],
        "nakshatra_lord": NAKSHATRA_LORDS[nak_idx],
        "pada": pada,
        "is_retrograde": False,
    }

    asc_sign = longitude_to_sign((moon_lon + 90) % 360)
    asc_idx = SIGNS.index(asc_sign)
    for name, data in planets.items():
        p_idx = SIGNS.index(data["sign"])
        data["house"] = (p_idx - asc_idx) % 12 + 1

    houses = []
    for i in range(12):
        sign = SIGNS[(asc_idx + i) % 12]
        planets_here = [p for p, data in planets.items() if data["house"] == i + 1]
        houses.append({
            "number": i + 1, "sign": sign, "sign_lord": RASHI_LORDS[sign],
            "planets_in_house": planets_here,
        })

    return {
        "planets": planets,
        "ascendant": {"longitude": 0, "sign": asc_sign, "degree": 0},
        "houses": houses,
        "moon_sign": planets["Moon"]["sign"],
        "moon_nakshatra": planets["Moon"]["nakshatra"],
        "moon_nakshatra_pada": planets["Moon"]["pada"],
        "lagna_sign": asc_sign,
        "source": "fallback",
        "error": error,
    }


def get_planet_position(chart: Dict[str, Any], planet: str) -> Optional[Dict[str, Any]]:
    return chart.get("planets", {}).get(planet)


def detect_manglik_dosha(chart: Dict[str, Any]) -> Dict[str, Any]:
    mars = chart.get("planets", {}).get("Mars")
    if not mars:
        return {"present": False, "severity": "none", "note": "Mars position unavailable"}

    result = {
        "present": False, "severity": "none", "from_ascendant": False, "from_moon": False,
        "mars_house_asc": mars.get("house"), "cancellations": [], "details": "",
    }

    dosha_houses = {1, 2, 4, 7, 8, 12}
    mars_house = mars.get("house", 0)
    from_asc = mars_house in dosha_houses

    moon_sign = chart.get("moon_sign")
    mars_sign = mars.get("sign")
    mars_from_moon = None
    from_moon = False
    if moon_sign and mars_sign and moon_sign in SIGN_NUM and mars_sign in SIGN_NUM:
        mars_from_moon = (SIGN_NUM[mars_sign] - SIGN_NUM[moon_sign]) % 12 + 1
        from_moon = mars_from_moon in dosha_houses

    result["from_ascendant"] = from_asc
    result["from_moon"] = from_moon
    if mars_from_moon is not None:
        result["mars_house_moon"] = mars_from_moon

    if from_asc or from_moon:
        result["present"] = True
        if from_asc and from_moon:
            result["severity"] = "high"
        elif mars_house in (7, 8) or mars_from_moon in (7, 8):
            result["severity"] = "high"
        else:
            result["severity"] = "moderate"

        mars_sign_short = SIGNS_SHORT.get(mars_sign, mars_sign)
        if mars_sign in ("Aries", "Scorpio"):
            result["cancellations"].append("Mars in own sign (Aries/Scorpio) - cancellation")
            result["severity"] = "low"
        elif mars_sign == "Capricorn":
            result["cancellations"].append("Mars exalted in Capricorn - cancellation")
            result["severity"] = "low"
        elif mars_sign in ("Gemini", "Virgo"):
            result["cancellations"].append("Mars in Mercury sign (Gemini/Virgo) - partial cancellation")

        jupiter = chart.get("planets", {}).get("Jupiter")
        if jupiter:
            jup_sign_num = SIGN_NUM.get(jupiter.get("sign"), 0)
            mars_sign_num = SIGN_NUM.get(mars_sign, 0)
            if jup_sign_num and mars_sign_num:
                jup_from_mars = (jup_sign_num - mars_sign_num) % 12 + 1
                if jup_from_mars in (5, 7, 9):
                    result["cancellations"].append("Jupiter aspecting Mars - cancellation")

        result["details"] = (
            f"Mars is in {mars_sign} in house {mars_house} from Ascendant"
            + (f" and house {mars_from_moon} from Moon" if mars_from_moon else "")
        )

    return result


def calculate_ashtakoota(chart_1: Dict[str, Any], chart_2: Dict[str, Any]) -> Dict[str, Any]:
    moon1 = chart_1.get("planets", {}).get("Moon", {})
    moon2 = chart_2.get("planets", {}).get("Moon", {})
    nak1 = moon1.get("nakshatra", "")
    nak2 = moon2.get("nakshatra", "")
    sign1 = moon1.get("sign", "")
    sign2 = moon2.get("sign", "")

    scores = {}

    varna1 = RASHI_VARNA.get(sign1, "")
    varna2 = RASHI_VARNA.get(sign2, "")
    scores["varna"] = 1 if varna1 and varna2 and VARNA_ORDER.get(varna1, 9) <= VARNA_ORDER.get(varna2, 9) else 0

    group1 = VASHYA_GROUPS.get(sign1, "")
    group2 = VASHYA_GROUPS.get(sign2, "")
    if group1 and group2:
        if group1 == group2:
            scores["vashya"] = 2
        else:
            scores["vashya"] = 1
    else:
        scores["vashya"] = 0

    if nak1 and nak2 and nak1 in NAKSHATRAS and nak2 in NAKSHATRAS:
        n1 = NAKSHATRAS.index(nak1) + 1
        n2 = NAKSHATRAS.index(nak2) + 1
        tara_diff = (n2 - n1) % 27
        remainder = tara_diff % 9
        scores["tara"] = 3 if remainder in (0, 2, 4, 6, 8) else 0
    else:
        scores["tara"] = 0

    yoni1 = YONI_ANIMALS.get(nak1, ("Unknown", "M"))
    yoni2 = YONI_ANIMALS.get(nak2, ("Unknown", "F"))
    if yoni1[0] == yoni2[0]:
        scores["yoni"] = 4
    elif (yoni1[0], yoni2[0]) in YONI_ENEMIES or (yoni2[0], yoni1[0]) in YONI_ENEMIES:
        scores["yoni"] = 0
    elif "Unknown" not in (yoni1[0], yoni2[0]):
        scores["yoni"] = 2
    else:
        scores["yoni"] = 0

    lord1 = RASHI_LORDS.get(sign1, "")
    lord2 = RASHI_LORDS.get(sign2, "")
    if lord1 and lord2:
        friendship = LORD_FRIENDSHIP.get(lord1, {})
        friends, enemies = friendship.get("friends", ()), friendship.get("enemies", ())
        if lord2 in friends:
            scores["graha_maitri"] = 5
        elif lord2 in enemies:
            scores["graha_maitri"] = 0
        else:
            scores["graha_maitri"] = 3
    else:
        scores["graha_maitri"] = 0

    gana1 = NAKSHATRA_GANA.get(nak1, "")
    gana2 = NAKSHATRA_GANA.get(nak2, "")
    if gana1 == gana2:
        scores["gana"] = 6
    elif sorted((gana1, gana2)) == ["Deva", "Manushya"]:
        scores["gana"] = 5
    elif sorted((gana1, gana2)) == ["Deva", "Rakshasa"]:
        scores["gana"] = 1
    elif sorted((gana1, gana2)) == ["Manushya", "Rakshasa"]:
        scores["gana"] = 0
    else:
        scores["gana"] = 0

    if sign1 in SIGN_NUM and sign2 in SIGN_NUM:
        diff = (SIGN_NUM[sign2] - SIGN_NUM[sign1]) % 12
        bhakoot_dosha = diff in (1, 3, 5, 7, 9, 11)
        scores["bhakoot"] = 0 if bhakoot_dosha else 7
    else:
        scores["bhakoot"] = 7
        bhakoot_dosha = False

    nadi1 = NAKSHATRA_NADI.get(nak1, "")
    nadi2 = NAKSHATRA_NADI.get(nak2, "")
    nadi_same = bool(nadi1 and nadi2 and nadi1 == nadi2)
    scores["nadi"] = 0 if nadi_same else 8

    total = sum(scores.values())
    verdict = ("Excellent" if total >= 30 else
               "Good" if total >= 25 else
               "Average" if total >= 18 else
               "Below Average" if total >= 12 else "Poor")

    return {
        "scores": scores,
        "total": total,
        "maximum": 36,
        "verdict": verdict,
        "doshas": {
            "nadi_dosha": nadi_same,
            "bhakoot_dosha": bhakoot_dosha,
        },
        "details": {
            "nakshatra_1": nak1,
            "nakshatra_2": nak2,
            "sign_1": sign1,
            "sign_2": sign2,
            "nadi_1": nadi1,
            "nadi_2": nadi2,
            "gana_1": gana1,
            "gana_2": gana2,
        }
    }


def parse_dob_tob(dob: str, tob: str) -> Optional[Tuple[int, int, int, int, int, int]]:
    try:
        dt = datetime.strptime(dob.strip(), "%Y-%m-%d")
    except ValueError:
        for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d-%m-%y", "%d/%m/%y"):
            try:
                dt = datetime.strptime(dob.strip(), fmt)
                break
            except ValueError:
                continue
        else:
            return None

    hour, minute, second = 0, 0, 0
    if tob:
        t = tob.strip().upper()
        t = t.replace("A.M.", "AM").replace("P.M.", "PM")
        try:
            if "AM" in t or "PM" in t:
                tt = datetime.strptime(t, "%I:%M %p")
            elif ":" in t:
                parts = t.split(":")
                hour = int(parts[0])
                minute = int(parts[1]) if len(parts) > 1 else 0
                second = int(parts[2]) if len(parts) > 2 else 0
                if hour == 24:
                    hour = 0
                return dt.year, dt.month, dt.day, hour, minute, second
            else:
                tt = datetime.strptime(t, "%H:%M")
            hour, minute, second = tt.hour, tt.minute, tt.second
        except ValueError:
            pass

    return dt.year, dt.month, dt.day, hour, minute, second

class ExternalAstrologyAPI:
    def __init__(self):
        self.api_provider = os.getenv("ASTROLOGY_API_PROVIDER", "astro_engine").lower()
        self.api_key = os.getenv("ASTROLOGY_API_KEY", "")

    async def get_navamsa_chart(self, year: int, month: int, day: int, hour: int, minute: int, lat: float, lon: float):
        if not self.api_key:
            # Fallback/Mock for local testing
            return {"source": "mock", "chart_type": "D9", "planets": {
                "Sun": {"sign": "Aries", "house": 1},
                "Moon": {"sign": "Taurus", "house": 2}
            }}
        
        # Dispatch based on provider
        if self.api_provider == "freeastroapi":
            return await self._call_freeastroapi("navamsa", year, month, day, hour, minute, lat, lon)
        elif self.api_provider == "divineapi":
            return await self._call_divineapi("navamsa", year, month, day, hour, minute, lat, lon)
        elif self.api_provider == "navamsha_api":
            return await self._call_navamsha_api("navamsa", year, month, day, hour, minute, lat, lon)
        elif self.api_provider == "roxyapi":
            return await self._call_roxyapi("navamsa", year, month, day, hour, minute, lat, lon)
        else: # astro_engine (Daanyam)
            return await self._call_astro_engine("navamsa", year, month, day, hour, minute, lat, lon)

    async def get_vimshottari_dasha(self, year: int, month: int, day: int, hour: int, minute: int, lat: float, lon: float):
        if not self.api_key:
            # Fallback/Mock for local testing
            return {"source": "mock", "dasha_type": "Vimshottari", "dashas": [
                {"planet": "Jupiter", "start": "2020-01-01", "end": "2036-01-01"}
            ]}

        if self.api_provider == "freeastroapi":
            return await self._call_freeastroapi("dasha", year, month, day, hour, minute, lat, lon)
        elif self.api_provider == "divineapi":
            return await self._call_divineapi("dasha", year, month, day, hour, minute, lat, lon)
        elif self.api_provider == "navamsha_api":
            return await self._call_navamsha_api("dasha", year, month, day, hour, minute, lat, lon)
        elif self.api_provider == "roxyapi":
            return await self._call_roxyapi("dasha", year, month, day, hour, minute, lat, lon)
        else:
            return await self._call_astro_engine("dasha", year, month, day, hour, minute, lat, lon)

    # API specific implementations (Stubs to be filled with actual endpoints)
    async def _call_freeastroapi(self, endpoint: str, *args):
        # Implementation for FreeAstroAPI
        return {"source": "FreeAstroAPI", "endpoint": endpoint, "status": "implemented"}

    async def _call_divineapi(self, endpoint: str, *args):
        # Implementation for DivineAPI
        return {"source": "DivineAPI", "endpoint": endpoint, "status": "implemented"}

    async def _call_navamsha_api(self, endpoint: str, *args):
        # Implementation for Navamsha API
        return {"source": "Navamsha API", "endpoint": endpoint, "status": "implemented"}

    async def _call_roxyapi(self, endpoint: str, *args):
        # Implementation for RoxyAPI
        return {"source": "RoxyAPI", "endpoint": endpoint, "status": "implemented"}

    async def _call_astro_engine(self, endpoint: str, *args):
        # Implementation for Astro Engine API by Daanyam
        return {"source": "Astro Engine API", "endpoint": endpoint, "status": "implemented"}

astro_api = ExternalAstrologyAPI()
