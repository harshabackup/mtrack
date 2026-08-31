import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.database import engine, Base
from .models import user, proposal, match, role, vendor, otp, audit_log, ai

from .api import auth, proposals, matching, ai, astrology

# Ensure storage directory exists
os.makedirs("storage", exist_ok=True)

# Create database tables (auto-creates if they don't exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Private Marriage Proposal Management Web App API")

cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,https://mapptracker.web.app,http://mtrack.harsharoyal.in,https://mtrack.harsharoyal.in,https://proposal.harsharoyal.in,http://proposal.harsharoyal.in")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/storage", StaticFiles(directory="storage"), name="storage")

app.include_router(auth.router)
app.include_router(proposals.router)
app.include_router(matching.router)
app.include_router(ai.router)
app.include_router(astrology.router)

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
