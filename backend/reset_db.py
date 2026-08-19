import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from sqlalchemy import MetaData
from app.core.database import engine
import subprocess

def reset_database():
    print("=========================================")
    print("🔥 WARNING: RESETTING THE DATABASE 🔥")
    print("This will completely wipe all data in your Supabase Postgres database!")
    print("=========================================")
    
    confirmation = input("Type 'yes' to confirm and continue: ")
    if confirmation.lower() != 'yes':
        print("Aborting database reset.")
        return

    try:
        print("\n1. Dropping all existing tables...")
        # Reflect all tables from the database and drop them
        meta = MetaData()
        meta.reflect(bind=engine)
        meta.drop_all(bind=engine)
        print("✅ Tables dropped successfully.")

        print("\n2. Running Alembic migrations to recreate tables...")
        subprocess.run(["alembic", "upgrade", "head"], check=True)
        print("✅ Migrations completed successfully.")
        
        print("\n3. Seeding default roles (Admin, Vendor, User)...")
        subprocess.run([sys.executable, "seed_roles.py"], check=True)
        print("✅ Roles seeded successfully.")
        
        print("\n🎉 Database has been completely reset and is ready to use!")
    except Exception as e:
        print(f"\n❌ Error resetting database: {e}")

if __name__ == "__main__":
    reset_database()
