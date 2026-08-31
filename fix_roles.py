"""
Fix roles: simplify to just ADMIN and USER.
- hi@harsharoyal.in = ADMIN
- everyone else = USER
"""
from sqlalchemy import create_engine, text

db_url = "postgresql://postgres.fxptinoldvmuofabxguw:Slr%400137495@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

def run():
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("Current roles:")
        roles = conn.execute(text("SELECT id, name FROM roles")).fetchall()
        for r in roles:
            print(f"  {r}")

        # Check if ADMIN role exists
        admin_role = conn.execute(text("SELECT id FROM roles WHERE name='ADMIN'")).fetchone()
        user_role = conn.execute(text("SELECT id FROM roles WHERE name='USER'")).fetchone()

        # Create ADMIN role if not exists
        if not admin_role:
            conn.execute(text("INSERT INTO roles (name) VALUES ('ADMIN')"))
            conn.commit()
            admin_role = conn.execute(text("SELECT id FROM roles WHERE name='ADMIN'")).fetchone()
            print(f"Created ADMIN role: {admin_role}")
        else:
            print(f"ADMIN role exists: {admin_role}")

        # Create USER role if not exists
        if not user_role:
            conn.execute(text("INSERT INTO roles (name) VALUES ('USER')"))
            conn.commit()
            user_role = conn.execute(text("SELECT id FROM roles WHERE name='USER'")).fetchone()
            print(f"Created USER role: {user_role}")
        else:
            print(f"USER role exists: {user_role}")

        admin_id = admin_role[0]
        user_id = user_role[0]

        # Set hi@harsharoyal.in to ADMIN
        conn.execute(text("UPDATE users SET role_id = :role WHERE email = 'hi@harsharoyal.in'"), {"role": admin_id})
        conn.commit()
        print("Set hi@harsharoyal.in to ADMIN")

        # Set all other users to USER
        conn.execute(text("UPDATE users SET role_id = :role WHERE email != 'hi@harsharoyal.in'"), {"role": user_id})
        conn.commit()
        print("Set all other users to USER")

        # Verify
        print("\nFinal user list:")
        users = conn.execute(text("""
            SELECT u.email, r.name as role 
            FROM users u 
            LEFT JOIN roles r ON r.id = u.role_id
        """)).fetchall()
        for u in users:
            print(f"  {u}")

        print("\nDone! Roles simplified to ADMIN and USER.")

if __name__ == "__main__":
    run()
