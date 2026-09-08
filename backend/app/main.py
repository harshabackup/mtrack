import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from jose import jwt, JWTError
from .core.database import engine, Base, SessionLocal
from .core.security import SECRET_KEY, ALGORITHM
from .models import user, proposal, match, role, vendor, otp, audit_log, ai, interest
from .models.user import User

from .api import auth, proposals, matching, ai, astrology, interest as interest_api

# Ensure storage directory exists
os.makedirs("storage", exist_ok=True)

# Create database tables (auto-creates if they don't exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Private Marriage Proposal Management Web App API")

cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,https://mapptracker.web.app,http://mtrack.harsharoyal.in,https://mtrack.harsharoyal.in,https://proposal.harsharoyal.in,http://proposal.harsharoyal.in")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

# Force append required origins in case the Render dashboard env var overrides the defaults
required_origins = [
    "https://proposal.harsharoyal.in",
    "http://proposal.harsharoyal.in",
    "https://mtrack.harsharoyal.in",
    "http://mtrack.harsharoyal.in",
    "https://mapptracker.web.app"
]
for req_origin in required_origins:
    if req_origin not in cors_origins:
        cors_origins.append(req_origin)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_STORAGE_ROOT = os.path.abspath("storage")

@app.get("/storage/{file_path:path}")
def serve_storage_file(file_path: str, token: str = Query(...)):
    """
    Serves uploaded proposal photos / PDFs / medical records.
    Requires a valid JWT (as a query param, since <img>/<a> tags can't send
    Authorization headers) and restricts access to files under the caller's
    own vendor_id, mirroring the API-level vendor isolation.
    """
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = SessionLocal()
    try:
        requesting_user = db.query(User).filter(User.email == email).first()
    finally:
        db.close()
    if not requesting_user or not requesting_user.is_active:
        raise credentials_exception

    # Resolve and confirm the path stays within the storage root
    full_path = os.path.abspath(os.path.join(_STORAGE_ROOT, file_path))
    if os.path.commonpath([_STORAGE_ROOT, full_path]) != _STORAGE_ROOT:
        raise HTTPException(status_code=400, detail="Invalid file path")

    # Files are stored under "<vendor_id>/<proposal_id>/<filename>"
    vendor_segment = file_path.split("/")[0]
    if not requesting_user.vendor_id or vendor_segment != str(requesting_user.vendor_id):
        raise HTTPException(status_code=403, detail="Not authorized to access this file")

    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(full_path)

app.include_router(auth.router)
app.include_router(proposals.router)
app.include_router(matching.router)
app.include_router(ai.router)
app.include_router(astrology.router)
app.include_router(interest_api.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the MAPP API"}

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    # Placeholder for dashboard stats
    return {
        "total": 48,
        "new": 7,
        "reviewing": 9,
        "shortlisted": 12,
        "contacted": 0,
        "discussion": 0,
        "final": 0,
        "rejected": 0
    }
