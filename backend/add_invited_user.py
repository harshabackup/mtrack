import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'sql_app.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Add INVITED_USER role
try:
    cursor.execute("INSERT INTO roles (name, description) VALUES ('INVITED_USER', 'User invited by admin to fill their proposal details')")
    print("Added INVITED_USER role.")
except sqlite3.IntegrityError:
    print("INVITED_USER role already exists.")

# 2. Add columns to users table
try:
    cursor.execute("ALTER TABLE users ADD COLUMN invitation_token VARCHAR")
    print("Added invitation_token to users.")
except sqlite3.OperationalError as e:
    print(f"invitation_token error: {e}")

try:
    cursor.execute("ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT 0")
    print("Added profile_completed to users.")
except sqlite3.OperationalError as e:
    print(f"profile_completed error: {e}")

# 3. Create ProposalVersion table
cursor.execute("""
CREATE TABLE IF NOT EXISTS proposal_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    data_snapshot JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
)
""")
print("Created proposal_versions table.")

conn.commit()
conn.close()
print("Done altering database.")
