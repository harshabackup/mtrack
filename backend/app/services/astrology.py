import swisseph as swe
import logging
from datetime import datetime, timedelta
import re
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

RASIS = [
    "Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)",
    "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischika (Scorpio)",
    "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"
]

def parse_datetime_str(dob: str, tob: str) -> Optional[datetime]:
    try:
        # Standardize DOB
        dob_clean = re.sub(r'[^0-9\-]', '-', dob.strip())
        
        # Try to parse YYYY-MM-DD
        dt_part = None
        try:
            dt_part = datetime.strptime(dob_clean, "%Y-%m-%d")
        except ValueError:
            try:
                # DD-MM-YYYY
                dt_part = datetime.strptime(dob_clean, "%d-%m-%Y")
            except ValueError:
                pass
                
        if not dt_part:
            return None
            
        # Standardize TOB
        tob_clean = tob.strip().upper()
        time_part = None
        
        # Handle AM/PM
        if "AM" in tob_clean or "PM" in tob_clean:
            try:
                # 02:30 PM
                time_part = datetime.strptime(tob_clean.replace(" ", ""), "%I:%M%p").time()
            except ValueError:
                pass
        else:
            try:
                # 14:30
                time_part = datetime.strptime(tob_clean, "%H:%M").time()
            except ValueError:
                pass
                
        if time_part:
            return datetime.combine(dt_part.date(), time_part)
        return None
        
    except Exception as e:
        logger.error(f"Error parsing date/time for astrology: {str(e)}")
        return None

def calculate_nakshatra_and_rasi(dob_str: str, tob_str: str, time_zone_offset_hours: float = 5.5) -> Tuple[Optional[str], Optional[str]]:
    """
    Calculates the Nakshatra and Rasi from Date of Birth and Time of Birth.
    Defaults to IST (+5.5) for timezone offset.
    Returns (Rasi, Nakshatra)
    """
    if not dob_str or not tob_str:
        return None, None
        
    dt = parse_datetime_str(dob_str, tob_str)
    if not dt:
        return None, None
        
    # Convert local time to UTC based on offset
    dt_utc = dt - timedelta(hours=time_zone_offset_hours)
    
    # Calculate Julian Day in UT
    year, month, day = dt_utc.year, dt_utc.month, dt_utc.day
    hour = dt_utc.hour + (dt_utc.minute / 60.0) + (dt_utc.second / 3600.0)
    
    # Use swe.julday to get Julian date
    jd_ut = swe.julday(year, month, day, hour)
    
    # Calculate Moon's position (using Ayanamsa for Lahiri to get Sidereal Zodiac)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    
    # calc_ut returns (longitude, latitude, distance, speed in long, speed in lat, speed in dist)
    res, flag = swe.calc_ut(jd_ut, swe.MOON, swe.FLG_SIDEREAL)
    moon_longitude = res[0]
    
    # Calculate Rasi (30 degrees each)
    rasi_index = int(moon_longitude / 30.0)
    rasi = RASIS[rasi_index] if 0 <= rasi_index < len(RASIS) else None
    
    # Calculate Nakshatra (13 degrees 20 minutes each = 13.333333 degrees)
    nakshatra_index = int(moon_longitude / (360.0 / 27.0))
    nakshatra = NAKSHATRAS[nakshatra_index] if 0 <= nakshatra_index < len(NAKSHATRAS) else None
    
    return rasi, nakshatra
