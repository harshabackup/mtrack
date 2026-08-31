import sqlite3

def run():
    conn = sqlite3.connect('sql_app.db')
    c = conn.cursor()
    
    # 1. Print all roles
    print("--- ROLES ---")
    roles = c.execute("SELECT id, name FROM roles").fetchall()
    for r in roles:
        print(f"ID: {r[0]}, Name: {r[1]}")
        
    # 2. Find SUPER_ADMIN role ID
    super_admin_id = next((r[0] for r in roles if r[1] == 'SUPER_ADMIN'), None)
    admin_id = next((r[0] for r in roles if r[1] == 'ADMIN'), None)
    
    target_role_id = super_admin_id or admin_id
    
    if not target_role_id:
        print("ERROR: Neither SUPER_ADMIN nor ADMIN role exists!")
        return
        
    print(f"\n--- Target Role ID for Admin: {target_role_id} ---")
        
    # 3. Check hi@harsharoyal.in
    user = c.execute("SELECT id, email, role_id FROM users WHERE email='hi@harsharoyal.in'").fetchone()
    if user:
        print(f"\nUser Found: ID={user[0]}, Email={user[1]}, Current Role_ID={user[2]}")
        
        # 4. Update if necessary
        if user[2] != target_role_id:
            print(f"Updating user {user[1]} to role {target_role_id}...")
            c.execute("UPDATE users SET role_id=? WHERE id=?", (target_role_id, user[0]))
            conn.commit()
            print("Update successful!")
        else:
            print("User is already an Admin!")
    else:
        print("\nERROR: User hi@harsharoyal.in NOT FOUND in the database!")
        
    conn.close()

if __name__ == "__main__":
    run()
