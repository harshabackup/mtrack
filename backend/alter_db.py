import sqlite3

db_path = "sql_app.db"

def alter_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Try adding columns. Catch exceptions if they already exist.
    try:
        cursor.execute("ALTER TABLE proposals ADD COLUMN received_date DATETIME;")
        print("Added received_date column.")
    except sqlite3.OperationalError as e:
        print(f"Skipped received_date: {e}")

    try:
        cursor.execute("ALTER TABLE proposals ADD COLUMN referred_by VARCHAR;")
        print("Added referred_by column.")
    except sqlite3.OperationalError as e:
        print(f"Skipped referred_by: {e}")
        
    try:
        cursor.execute("ALTER TABLE proposals ADD COLUMN expectations VARCHAR;")
        print("Added expectations column.")
    except sqlite3.OperationalError as e:
        print(f"Skipped expectations: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    alter_db()
