import os
from sqlalchemy import create_engine, text

db_url = "postgresql://postgres.fxptinoldvmuofabxguw:Slr%400137495@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

def run():
    engine = create_engine(db_url)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT id, email, vendor_id, role_id FROM users WHERE email='hi@harsharoyal.in'")).fetchone()
        print(f"User: {res}")
        
if __name__ == "__main__":
    run()
