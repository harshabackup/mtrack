from sqlalchemy import create_engine, text
db_url = 'postgresql://postgres.fxptinoldvmuofabxguw:Slr%400137495@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
engine = create_engine(db_url)
with engine.connect() as conn:
    r1 = conn.execute(text("UPDATE proposal_photos SET photo_url = REPLACE(photo_url, 'http://localhost:8000', 'https://api.harsharoyal.in') WHERE photo_url LIKE 'http://localhost:8000%'"))
    r2 = conn.execute(text("UPDATE proposals SET pdf_url = REPLACE(pdf_url, 'http://localhost:8000', 'https://api.harsharoyal.in') WHERE pdf_url LIKE 'http://localhost:8000%'"))
    r3 = conn.execute(text("UPDATE proposal_medical_records SET record_url = REPLACE(record_url, 'http://localhost:8000', 'https://api.harsharoyal.in') WHERE record_url LIKE 'http://localhost:8000%'"))
    conn.commit()
    print(f'Fixed photos: {r1.rowcount}, pdfs: {r2.rowcount}, medical records: {r3.rowcount}')
    bad = conn.execute(text("SELECT COUNT(*) FROM proposal_photos WHERE photo_url LIKE 'http://localhost%'")).scalar()
    print(f'Remaining bad URLs: {bad}')
