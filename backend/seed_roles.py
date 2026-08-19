import sys
import os

# Add the app directory to sys.path if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.core.database import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.vendor import Vendor
from app.models.proposal import Proposal

def seed_roles():
    db = SessionLocal()
    roles = [
        {"name": "SUPER_ADMIN", "description": "System Administrator with full access"},
        {"name": "ADMIN", "description": "Vendor Administrator"},
        {"name": "VENDOR", "description": "Vendor Staff"}
    ]
    
    for role_data in roles:
        existing = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing:
            new_role = Role(name=role_data["name"], description=role_data["description"])
            db.add(new_role)
            print(f"Added role: {role_data['name']}")
        else:
            print(f"Role already exists: {role_data['name']}")
            
    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_roles()
