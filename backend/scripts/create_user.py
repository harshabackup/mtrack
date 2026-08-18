import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.models.user import User
from app.core.security import get_password_hash
from app.core.database import Base

def create_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    email = "admin@example.com"
    
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"User {email} already exists.")
        return

    password = "password123"
    hashed_password = get_password_hash(password)
    
    new_user = User(email=email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print(f"User created successfully!")
    print(f"Email: {email}")
    print(f"Password: {password}")

if __name__ == "__main__":
    create_admin()
