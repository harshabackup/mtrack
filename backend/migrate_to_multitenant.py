import sys
import os

# Add backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import bcrypt as _bcrypt
if not hasattr(_bcrypt, '__about__'):
    class _About:
        __version__ = getattr(_bcrypt, '__version__', '4.0.0')
    _bcrypt.__about__ = _About()

from app.core.database import SessionLocal
from app.models.role import Role
from app.models.vendor import Vendor
from app.models.user import User
from app.models.proposal import Proposal
from app.core.security import get_password_hash

def migrate():
    db = SessionLocal()
    try:
        # 1. Create Roles
        roles = ["SUPER_ADMIN", "ADMIN", "VENDOR"]
        role_map = {}
        for r in roles:
            role = db.query(Role).filter(Role.name == r).first()
            if not role:
                role = Role(name=r, description=f"{r} role")
                db.add(role)
                db.flush()
            role_map[r] = role
            
        print("Roles verified/created.")

        # 2. Create Default Vendor
        default_vendor = db.query(Vendor).filter(Vendor.vendor_name == "Legacy MAPP Vendor").first()
        if not default_vendor:
            default_vendor = Vendor(
                vendor_name="Legacy MAPP Vendor",
                email="admin@mapp.com",
                phone="0000000000"
            )
            db.add(default_vendor)
            db.flush()
            print("Default Vendor created.")
        
        # 3. Create Default Admin User
        admin_email = "admin@mapp.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            import bcrypt as pure_bcrypt
            salt = pure_bcrypt.gensalt()
            hashed_pwd = pure_bcrypt.hashpw(b"admin123", salt).decode("utf-8")
            
            admin_user = User(
                email=admin_email,
                full_name="System Administrator",
                password_hash=hashed_pwd,
                role_id=role_map["ADMIN"].id,
                vendor_id=default_vendor.id,
                email_verified=True,
                is_active=True
            )
            db.add(admin_user)
            db.flush()
            
            # Update vendor owner
            default_vendor.owner_user_id = admin_user.id
            print("Default Admin User created.")
            
        # 4. Migrate Existing Proposals
        proposals = db.query(Proposal).filter(Proposal.vendor_id == None).all()
        count = 0
        for p in proposals:
            p.vendor_id = default_vendor.id
            p.created_by = admin_user.id
            count += 1
            
        db.commit()
        print(f"Migration complete. {count} proposals assigned to Legacy MAPP Vendor.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
