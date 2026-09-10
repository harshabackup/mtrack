"""Lightweight offline geocoding for astrology birth-chart calculations.

Avoids depending on an external geocoding API/key: resolves a city name (from a
proposal's `pob` or `current_city`) to lat/long/timezone using a static lookup table
of major Indian cities (plus a handful of common overseas hubs for NRI profiles).
Falls back to a central-India reference point when the city can't be resolved.
"""
from typing import Optional, Tuple

# (latitude, longitude, IST-relative tz offset in hours)
CITY_COORDINATES = {
    "chennai": (13.0827, 80.2707, 5.5),
    "madras": (13.0827, 80.2707, 5.5),
    "coimbatore": (11.0168, 76.9558, 5.5),
    "madurai": (9.9252, 78.1198, 5.5),
    "trichy": (10.7905, 78.7047, 5.5),
    "tiruchirappalli": (10.7905, 78.7047, 5.5),
    "salem": (11.6643, 78.1460, 5.5),
    "tirunelveli": (8.7139, 77.7567, 5.5),
    "vellore": (12.9165, 79.1325, 5.5),
    "erode": (11.3410, 77.7172, 5.5),
    "bangalore": (12.9716, 77.5946, 5.5),
    "bengaluru": (12.9716, 77.5946, 5.5),
    "mysore": (12.2958, 76.6394, 5.5),
    "mangalore": (12.9141, 74.8560, 5.5),
    "hubli": (15.3647, 75.1240, 5.5),
    "hyderabad": (17.3850, 78.4867, 5.5),
    "secunderabad": (17.4399, 78.4983, 5.5),
    "vijayawada": (16.5062, 80.6480, 5.5),
    "visakhapatnam": (17.6868, 83.2185, 5.5),
    "vizag": (17.6868, 83.2185, 5.5),
    "guntur": (16.3067, 80.4365, 5.5),
    "tirupati": (13.6288, 79.4192, 5.5),
    "kochi": (9.9312, 76.2673, 5.5),
    "cochin": (9.9312, 76.2673, 5.5),
    "thiruvananthapuram": (8.5241, 76.9366, 5.5),
    "trivandrum": (8.5241, 76.9366, 5.5),
    "kozhikode": (11.2588, 75.7804, 5.5),
    "calicut": (11.2588, 75.7804, 5.5),
    "thrissur": (10.5276, 76.2144, 5.5),
    "mumbai": (19.0760, 72.8777, 5.5),
    "bombay": (19.0760, 72.8777, 5.5),
    "pune": (18.5204, 73.8567, 5.5),
    "nagpur": (21.1458, 79.0882, 5.5),
    "nashik": (19.9975, 73.7898, 5.5),
    "delhi": (28.7041, 77.1025, 5.5),
    "new delhi": (28.6139, 77.2090, 5.5),
    "gurgaon": (28.4595, 77.0266, 5.5),
    "gurugram": (28.4595, 77.0266, 5.5),
    "noida": (28.5355, 77.3910, 5.5),
    "kolkata": (22.5726, 88.3639, 5.5),
    "calcutta": (22.5726, 88.3639, 5.5),
    "ahmedabad": (23.0225, 72.5714, 5.5),
    "surat": (21.1702, 72.8311, 5.5),
    "vadodara": (22.3072, 73.1812, 5.5),
    "jaipur": (26.9124, 75.7873, 5.5),
    "lucknow": (26.8467, 80.9462, 5.5),
    "kanpur": (26.4499, 80.3319, 5.5),
    "varanasi": (25.3176, 82.9739, 5.5),
    "bhopal": (23.2599, 77.4126, 5.5),
    "indore": (22.7196, 75.8577, 5.5),
    "chandigarh": (30.7333, 76.7794, 5.5),
    "patna": (25.5941, 85.1376, 5.5),
    "ranchi": (23.3441, 85.3096, 5.5),
    "bhubaneswar": (20.2961, 85.8245, 5.5),
    "guwahati": (26.1445, 91.7362, 5.5),
    "raipur": (21.2514, 81.6296, 5.5),
    "dubai": (25.2048, 55.2708, 4.0),
    "abu dhabi": (24.4539, 54.3773, 4.0),
    "singapore": (1.3521, 103.8198, 8.0),
    "london": (51.5074, -0.1278, 0.0),
    "new york": (40.7128, -74.0060, -5.0),
    "toronto": (43.6532, -79.3832, -5.0),
    "sydney": (-33.8688, 151.2093, 10.0),
}

DEFAULT_COORDINATES = (20.5937, 78.9629, 5.5)  # geographic centre of India


def resolve_city(city_name: Optional[str]) -> Tuple[float, float, float]:
    if not city_name:
        return DEFAULT_COORDINATES
    key = city_name.strip().lower()
    if key in CITY_COORDINATES:
        return CITY_COORDINATES[key]
    # Try matching the first comma-separated segment (e.g. "Chennai, Tamil Nadu")
    first_segment = key.split(",")[0].strip()
    if first_segment in CITY_COORDINATES:
        return CITY_COORDINATES[first_segment]
    # Try substring match against known cities (handles "Near Chennai" etc.)
    for known_city, coords in CITY_COORDINATES.items():
        if known_city in key:
            return coords
    return DEFAULT_COORDINATES


def resolve_birthplace(pob: Optional[str], fallback_city: Optional[str] = None) -> Tuple[float, float, float]:
    """Resolves a proposal's place of birth, falling back to their current city."""
    if pob:
        coords = resolve_city(pob)
        if coords != DEFAULT_COORDINATES:
            return coords
    return resolve_city(fallback_city)
