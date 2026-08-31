import os
import urllib.parse
from sqlalchemy import create_engine, text

# Replace encoded @ with @
db_url = "postgresql://postgres.fxptinoldvmuofabxguw:Slr%400137495@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

def run():
    print("Connecting to production DB...")
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        print("Connected!")
        
        # 1. Update hi@harsharoyal.in to SUPER_ADMIN (role_id 1)
        print("Finding SUPER_ADMIN role...")
        res = conn.execute(text("SELECT id, name FROM roles")).fetchall()
        for r in res:
            print(f"Role: {r}")
            
        super_admin_id = next((r[0] for r in res if r[1] == 'SUPER_ADMIN'), None)
        admin_id = next((r[0] for r in res if r[1] == 'ADMIN'), None)
        target_role = super_admin_id or admin_id
        
        if target_role:
            print(f"Setting hi@harsharoyal.in to role {target_role}...")
            conn.execute(text("UPDATE users SET role_id = :role WHERE email = 'hi@harsharoyal.in'"), {"role": target_role})
            conn.commit()
            print("Successfully updated user role!")
            
        # 2. Fix image URLs
        print("Fixing proposal photo URLs...")
        conn.execute(text("UPDATE proposal_photos SET photo_url = REPLACE(photo_url, 'http://localhost:8000', 'https://api.harsharoyal.in') WHERE photo_url LIKE 'http://localhost:8000%'"))
        conn.commit()
        
        print("Fixing proposal PDF URLs...")
        conn.execute(text("UPDATE proposals SET pdf_url = REPLACE(pdf_url, 'http://localhost:8000', 'https://api.harsharoyal.in') WHERE pdf_url LIKE 'http://localhost:8000%'"))
        conn.commit()
        
        print("Fixing medical record URLs...")
        conn.execute(text("UPDATE proposal_medical_records SET record_url = REPLACE(record_url, 'http://localhost:8000', 'https://api.harsharoyal.in') WHERE record_url LIKE 'http://localhost:8000%'"))
        conn.commit()
        print("Done!")

if __name__ == "__main__":
    run()
