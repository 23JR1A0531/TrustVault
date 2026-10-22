import sys
from pathlib import Path

from werkzeug.security import generate_password_hash

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from app import app, get_db_connection

ADMIN_NAME = "Yamuna Karri"
ADMIN_EMAIL = "yamuna1654@gmail.com"
ADMIN_PASSWORD = "Yamuna@12345"

# Create or update the admin account in MySQL.
connection = get_db_connection()

try:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id FROM users WHERE email = %s
            """,
            (ADMIN_EMAIL,),
        )
        existing = cursor.fetchone()

        password_hash = generate_password_hash(ADMIN_PASSWORD)

        if existing:
            cursor.execute(
                """
                UPDATE users
                SET name = %s,
                    password_hash = %s,
                    role = 'admin',
                    is_active = 1,
                    approval_status = 'approved',
                    token_version = token_version + 1
                WHERE email = %s
                """,
                (ADMIN_NAME, password_hash, ADMIN_EMAIL),
            )
            print("Existing account updated as admin.")
        else:
            cursor.execute(
                """
                INSERT INTO users
                    (name, email, password_hash, role, is_active)
                VALUES (%s, %s, %s, 'admin', 1)
                """,
                (ADMIN_NAME, ADMIN_EMAIL, password_hash),
            )
            print("Admin account created.")

    connection.commit()

except Exception:
    connection.rollback()
    raise

finally:
    connection.close()

print("\nAdmin credentials:")
print("Email:    yamuna1654@gmail.com")
print("Password: Yamuna@12345")
print("\nNow log in through the TrustVault login page.")