
import hashlib
import json
import os
import re
import uuid
from datetime import timedelta
from pathlib import Path

import pymysql
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from werkzeug.security import generate_password_hash, check_password_hash
from PIL import Image

from config import Config

app = Flask(__name__)
app.config.from_object(Config)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]

if not app.config.get("SECRET_KEY") or not app.config.get("JWT_SECRET_KEY"):
    raise RuntimeError("SECRET_KEY and JWT_SECRET_KEY must be configured")

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:5174"]
    }
})
jwt = JWTManager(app)

STORAGE_DIR = Path(app.config["STORAGE_DIR"]).resolve()
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024


def get_db_connection():
    return pymysql.connect(
        host=app.config["MYSQL_HOST"],
        user=app.config["MYSQL_USER"],
        password=app.config["MYSQL_PASSWORD"],
        database=app.config["MYSQL_DATABASE"],
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=5,
        autocommit=False,
    )


def error_response(message, status):
    return jsonify({"error": message}), status


def current_user_record(cursor):
    user_id = int(get_jwt_identity())
    cursor.execute(
        """
        SELECT id, name, email, role, is_active, token_version
        FROM users WHERE id = %s
        """,
        (user_id,),
    )
    return cursor.fetchone()


def require_role(user, *roles):
    return bool(user and user["is_active"] and user["role"] in roles)


def audit(cursor, actor_id, document_id, action, outcome, details=None):
    """Append a hash-chained audit record in the caller's transaction."""
    cursor.execute(
        "SELECT last_hash FROM audit_chain_head WHERE id = 1 FOR UPDATE"
    )
    head = cursor.fetchone()
    if head is None:
        raise RuntimeError("Audit chain head is missing")

    previous_hash = head["last_hash"]
    payload = {
        "actor_id": actor_id,
        "document_id": document_id,
        "action": action,
        "outcome": outcome,
        "details": details or {},
        "previous_hash": previous_hash,
    }
    canonical = json.dumps(
        payload, sort_keys=True, separators=(",", ":"), default=str
    )
    entry_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    cursor.execute(
        """
        INSERT INTO audit_logs
        (actor_id, document_id, action, outcome, details,
         previous_hash, entry_hash)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            actor_id,
            document_id,
            action,
            outcome,
            json.dumps(details or {}),
            previous_hash,
            entry_hash,
        ),
    )
    cursor.execute(
        "UPDATE audit_chain_head SET last_hash = %s WHERE id = 1",
        (entry_hash,),
    )


def allowed_document(cursor, user, document_id, permission="read"):
    """Authorize using current database ownership and grants on every request."""
    cursor.execute("SELECT * FROM documents WHERE id = %s", (document_id,))
    document = cursor.fetchone()

    if not document or not user or not user["is_active"]:
        return None

    # The owner always has access to their own document.
    if document["owner_id"] == user["id"]:
        return document

    allowed_levels = (
        ("read", "edit") if permission == "read" else ("edit",)
    )
    placeholders = ", ".join(["%s"] * len(allowed_levels))

    # Individual user permission.
    cursor.execute(
        f"""
        SELECT 1
        FROM document_permissions
        WHERE document_id = %s
          AND user_id = %s
          AND permission IN ({placeholders})
        LIMIT 1
        """,
        (document_id, user["id"], *allowed_levels),
    )
    if cursor.fetchone():
        return document

    # Group permission: current membership is checked on every request.
    cursor.execute(
        f"""
        SELECT 1
        FROM group_document_permissions gp
        JOIN group_memberships gm
          ON gm.group_id = gp.group_id
        WHERE gp.document_id = %s
          AND gm.user_id = %s
          AND gp.permission IN ({placeholders})
        LIMIT 1
        """,
        (document_id, user["id"], *allowed_levels),
    )
    if cursor.fetchone():
        return document

    # Department permission: current membership is checked dynamically.
    cursor.execute(
        f"""
        SELECT 1
        FROM department_document_permissions dp
        JOIN department_memberships dm
          ON dm.department_id = dp.department_id
        WHERE dp.document_id = %s
          AND dm.user_id = %s
          AND dp.permission IN ({placeholders})
        LIMIT 1
        """,
        (document_id, user["id"], *allowed_levels),
    )
    return document if cursor.fetchone() else None


@app.get("/api/health")
def health():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return jsonify({"status": "ok", "database": "connected"})
    except pymysql.MySQLError:
        app.logger.exception("Health check failed")
        return error_response("Database unavailable", 503)
    finally:
        if connection:
            connection.close()


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response("JSON body required", 400)

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not all(isinstance(v, str) for v in (name, email, password)):
        return error_response("Name, email and password are required", 400)

    name, email = name.strip(), email.strip().lower()

    if not name or len(name) > 100:
        return error_response("Name must be 1–100 characters", 400)

    if not email or len(email) > 255 or not re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+", email
    ):
        return error_response("Valid email required", 400)

    if len(password) < 12 or len(password) > 128:
        return error_response("Password must be 12–128 characters", 400)

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (name, email, password_hash, role)
                VALUES (%s, %s, %s, 'viewer')
                """,
                (name, email, generate_password_hash(password)),
            )
            user_id = cursor.lastrowid

        connection.commit()
        return jsonify({
            "message": "Registration successful",
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "role": "viewer",
            },
        }), 201

    except pymysql.err.IntegrityError:
        if connection:
            connection.rollback()
        return error_response("Unable to register with these details", 409)

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Registration failed")
        return error_response("Registration failed", 500)

    finally:
        if connection:
            connection.close()


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response("JSON body required", 400)

    email, password = data.get("email"), data.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return error_response("Email and password are required", 400)

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, email, password_hash, role,
                       is_active, token_version
                FROM users WHERE email = %s
                """,
                (email.strip().lower(),),
            )
            user = cursor.fetchone()

        if (
            not user
            or not user["is_active"]
            or not check_password_hash(user["password_hash"], password)
        ):
            return error_response("Invalid email or password", 401)

        token = create_access_token(
            identity=str(user["id"]),
            additional_claims={"token_version": user["token_version"]},
        )
        return jsonify({
            "access_token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
            },
        })

    except pymysql.MySQLError:
        app.logger.exception("Login failed")
        return error_response("Login temporarily unavailable", 503)

    finally:
        if connection:
            connection.close()


@jwt.token_in_blocklist_loader
def token_revoked(_header, payload):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT token_version, is_active FROM users WHERE id = %s",
                (int(payload["sub"]),),
            )
            user = cursor.fetchone()

        return (
            not user
            or not user["is_active"]
            or user["token_version"] != payload.get("token_version")
        )

    except Exception:
        app.logger.exception("Token validation failed closed")
        return True

    finally:
        if connection:
            connection.close()


@jwt.revoked_token_loader
def revoked_response(_header, _payload):
    return error_response("Token is no longer valid", 401)


@app.get("/api/auth/me")
@jwt_required()
def me():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)

        if not user or not user["is_active"]:
            return error_response("User inactive or not found", 401)

        return jsonify({
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
            }
        })

    finally:
        if connection:
            connection.close()

@app.post("/api/auth/logout-all")
@jwt_required()
def logout_all():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE users SET token_version = token_version + 1 WHERE id=%s",
                (int(get_jwt_identity()),),
            )
        connection.commit()
        return jsonify({"message": "All sessions invalidated"})
    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        return error_response("Could not invalidate sessions", 503)
    finally:
        if connection:
            connection.close()


@app.get("/api/departments")
@jwt_required()
def list_departments():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            if not require_role(user, "admin"):
                return error_response("Admin access required", 403)

            cursor.execute(
                "SELECT id, name, created_at FROM departments ORDER BY name"
            )
            rows = cursor.fetchall()

        return jsonify({"departments": rows})
    finally:
        if connection:
            connection.close()


@app.post("/api/departments")
@jwt_required()
def create_department():
    data = request.get_json(silent=True) or {}
    name = data.get("name")

    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 100:
        return error_response("Department name required (max 100 characters)", 400)

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            if not require_role(user, "admin"):
                return error_response("Admin access required", 403)

            cursor.execute(
                "INSERT INTO departments (name) VALUES (%s)",
                (name.strip(),),
            )

        connection.commit()
        return jsonify({"message": "Department created"}), 201

    except pymysql.err.IntegrityError:
        if connection:
            connection.rollback()
        return error_response("Department already exists", 409)

    finally:
        if connection:
            connection.close()


@app.get("/api/department-members")
@jwt_required()
def list_department_members():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            actor = current_user_record(cursor)
            if not require_role(actor, "admin"):
                return error_response("Admin access required", 403)

            cursor.execute("""
                SELECT
                    dm.id,
                    dm.user_id,
                    u.name AS employee_name,
                    u.email,
                    dm.department_id,
                    d.name AS department_name,
                    dm.assigned_by,
                    dm.created_at
                FROM department_memberships dm
                JOIN users u ON u.id = dm.user_id
                JOIN departments d ON d.id = dm.department_id
                ORDER BY d.name, u.name
            """)
            members = cursor.fetchall()

        return jsonify({"members": members})
    finally:
        if connection:
            connection.close()


@app.post("/api/department-members")
@jwt_required()
def assign_department_member():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    department_id = data.get("department_id")

    if not isinstance(email, str) or not email.strip():
        return error_response("Employee email is required", 400)

    try:
        department_id = int(department_id)
        if department_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return error_response("Valid department_id is required", 400)

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            actor = current_user_record(cursor)
            if not require_role(actor, "admin"):
                return error_response("Admin access required", 403)

            cursor.execute(
                "SELECT id, is_active FROM users WHERE email = %s",
                (email.strip().lower(),),
            )
            employee = cursor.fetchone()

            cursor.execute(
                "SELECT id FROM departments WHERE id = %s",
                (department_id,),
            )
            department = cursor.fetchone()

            if not employee or not employee["is_active"]:
                return error_response("Active employee not found", 404)
            if not department:
                return error_response("Department not found", 404)

            cursor.execute("""
                INSERT INTO department_memberships
                    (user_id, department_id, assigned_by)
                VALUES (%s, %s, %s)
            """, (employee["id"], department_id, actor["id"]))

            audit(
                cursor,
                actor["id"],
                None,
                "department_member_assigned",
                "success",
                {
                    "user_id": employee["id"],
                    "department_id": department_id,
                },
            )

        connection.commit()
        return jsonify({"message": "Employee assigned to department"}), 201

    except pymysql.err.IntegrityError:
        if connection:
            connection.rollback()
        return error_response(
            "Employee is already assigned to this department", 409
        )

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Department assignment failed")
        return error_response("Could not assign employee", 500)

    finally:
        if connection:
            connection.close()


@app.delete("/api/department-members/<int:user_id>/<int:department_id>")
@jwt_required()
def remove_department_member(user_id, department_id):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            actor = current_user_record(cursor)
            if not require_role(actor, "admin"):
                return error_response("Admin access required", 403)

            cursor.execute("""
                DELETE FROM department_memberships
                WHERE user_id = %s AND department_id = %s
            """, (user_id, department_id))

            if cursor.rowcount == 0:
                return error_response("Department membership not found", 404)

            audit(
                cursor,
                actor["id"],
                None,
                "department_member_removed",
                "success",
                {
                    "user_id": user_id,
                    "department_id": department_id,
                },
            )

        connection.commit()
        return jsonify({"message": "Employee removed from department"})

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Department removal failed")
        return error_response("Could not remove employee", 500)

    finally:
        if connection:
            connection.close()


@app.get("/api/groups")
@jwt_required()
def list_groups():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            if not require_role(user, "admin", "owner"):
                return error_response("Owner or admin access required", 403)

            cursor.execute("""
                SELECT
                    g.id,
                    g.name,
                    g.description,
                    d.name AS department
                FROM access_groups g
                LEFT JOIN departments d ON d.id = g.department_id
                ORDER BY g.name
            """)
            groups = cursor.fetchall()

        return jsonify({"groups": groups})
    finally:
        if connection:
            connection.close()


@app.post("/api/groups")
@jwt_required()
def create_group():
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    description = data.get("description", "")
    department_id = data.get("department_id")

    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 100:
        return error_response("Group name required", 400)

    if not isinstance(description, str) or len(description) > 500:
        return error_response("Description must be at most 500 characters", 400)

    if department_id is not None:
        try:
            department_id = int(department_id)
            if department_id <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return error_response("Valid department_id required", 400)

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            if not require_role(user, "admin", "owner"):
                return error_response("Owner or admin access required", 403)

            cursor.execute("""
                INSERT INTO access_groups
                    (name, description, department_id, created_by)
                VALUES (%s, %s, %s, %s)
            """, (
                name.strip(),
                description,
                department_id,
                user["id"],
            ))
            group_id = cursor.lastrowid

        connection.commit()
        return jsonify({"id": group_id, "message": "Group created"}), 201

    except pymysql.err.IntegrityError:
        if connection:
            connection.rollback()
        return error_response("Group or department reference already exists", 409)

    finally:
        if connection:
            connection.close()


@app.post("/api/groups/<int:group_id>/members")
@jwt_required()
def add_group_member(group_id):
    data = request.get_json(silent=True) or {}
    email = data.get("email")

    if not isinstance(email, str) or not email.strip():
        return error_response("Employee email required", 400)

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            actor = current_user_record(cursor)
            if not require_role(actor, "admin"):
                return error_response("Admin access required", 403)

            cursor.execute(
                "SELECT id FROM access_groups WHERE id = %s",
                (group_id,),
            )
            group = cursor.fetchone()

            cursor.execute(
                "SELECT id, is_active FROM users WHERE email = %s",
                (email.strip().lower(),),
            )
            member = cursor.fetchone()

            if not group or not member or not member["is_active"]:
                return error_response("Group or active employee not found", 404)

            cursor.execute("""
                INSERT INTO group_memberships (group_id, user_id, added_by)
                VALUES (%s, %s, %s)
            """, (group_id, member["id"], actor["id"]))

            audit(
                cursor,
                actor["id"],
                None,
                "group_member_added",
                "success",
                {"group_id": group_id, "user_id": member["id"]},
            )

        connection.commit()
        return jsonify({"message": "Employee added to group"}), 201

    except pymysql.err.IntegrityError:
        if connection:
            connection.rollback()
        return error_response("Membership already exists or reference invalid", 409)

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Membership addition failed")
        return error_response("Could not add employee", 500)

    finally:
        if connection:
            connection.close()


@app.delete("/api/groups/<int:group_id>/members/<int:user_id>")
@jwt_required()
def remove_group_member(group_id, user_id):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            actor = current_user_record(cursor)
            if not require_role(actor, "admin"):
                return error_response("Admin access required", 403)

            cursor.execute(
                "DELETE FROM group_memberships WHERE group_id=%s AND user_id=%s",
                (group_id, user_id),
            )

            if cursor.rowcount == 0:
                return error_response("Membership not found", 404)

            audit(
                cursor,
                actor["id"],
                None,
                "group_member_removed",
                "success",
                {"group_id": group_id, "user_id": user_id},
            )

        connection.commit()
        return jsonify({
            "message": "Membership removed; group-based access revoked"
        })

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Membership removal failed")
        return error_response("Could not remove membership", 500)

    finally:
        if connection:
            connection.close()

@app.post("/api/documents")
@jwt_required()
def upload_document():
    connection = None
    stored_path = None

    try:
        user_id = int(get_jwt_identity())
        title = (request.form.get("title") or "").strip()
        category = (request.form.get("category") or "General").strip()
        description = (request.form.get("description") or "").strip()
        uploaded = request.files.get("file")

        if not title or len(title) > 255 or not uploaded or not uploaded.filename:
            return error_response("Title and file are required", 400)

        if len(category) > 100 or len(description) > 5000:
            return error_response("Category or description is too long", 400)

        ext = Path(uploaded.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            return error_response("Only PDF, PNG and JPEG files are allowed", 415)

        content = uploaded.read(MAX_FILE_SIZE + 1)
        if not content or len(content) > MAX_FILE_SIZE:
            return error_response("File must be between 1 byte and 10 MB", 413)

        valid = (
            (ext == ".pdf" and content.startswith(b"%PDF-"))
            or (ext == ".png" and content.startswith(b"\x89PNG\r\n\x1a\n"))
            or (ext in {".jpg", ".jpeg"} and content.startswith(b"\xff\xd8\xff"))
        )
        if not valid:
            return error_response("File content does not match its extension", 415)

        storage_key = uuid.uuid4().hex
        stored_path = STORAGE_DIR / storage_key

        with open(stored_path, "xb") as output:
            output.write(content)

        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            if not user or not user["is_active"]:
                return error_response("Inactive user", 401)

            cursor.execute(
                """
                INSERT INTO documents
                (owner_id, title, category, description, storage_key,
                 original_filename, mime_type, file_size)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    title,
                    category,
                    description,
                    storage_key,
                    Path(uploaded.filename).name[:255],
                    uploaded.mimetype or "application/octet-stream",
                    len(content),
                ),
            )
            document_id = cursor.lastrowid

            audit(
                cursor, user_id, document_id, "document_upload", "success",
                {"title": title, "size": len(content)},
            )

        connection.commit()
        return jsonify({
            "id": document_id,
            "message": "Document uploaded",
        }), 201

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        if stored_path and stored_path.exists():
            stored_path.unlink(missing_ok=True)
        app.logger.exception("Document upload failed")
        return error_response("Document upload failed", 500)

    finally:
        if connection:
            connection.close()


@app.get("/api/documents")
@jwt_required()
def list_documents():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            if not user or not user["is_active"]:
                return error_response("Inactive user", 401)

            cursor.execute(
                """
                SELECT DISTINCT
                    d.id, d.owner_id, d.title, d.category,
                    d.description, d.original_filename, d.mime_type,
                    d.file_size, d.created_at, d.updated_at,
                    u.name AS owner_name
                FROM documents d
                JOIN users u ON u.id = d.owner_id
                LEFT JOIN document_permissions p
                    ON p.document_id = d.id
                    AND p.user_id = %s
                LEFT JOIN group_document_permissions gp
                    ON gp.document_id = d.id
                LEFT JOIN group_memberships gm
                    ON gm.group_id = gp.group_id
                    AND gm.user_id = %s
                LEFT JOIN department_document_permissions dp
                    ON dp.document_id = d.id
                LEFT JOIN department_memberships dm
                    ON dm.department_id = dp.department_id
                    AND dm.user_id = %s
                WHERE d.owner_id = %s
                   OR p.permission IN ('read', 'edit')
                   OR (
                       gm.user_id IS NOT NULL
                       AND gp.permission IN ('read', 'edit')
                   )
                   OR (
                       dm.user_id IS NOT NULL
                       AND dp.permission IN ('read', 'edit')
                   )
                ORDER BY d.created_at DESC
                """,
                (user["id"], user["id"], user["id"], user["id"]),
            )
            documents = cursor.fetchall()

        return jsonify({"documents": documents})

    finally:
        if connection:
            connection.close()


@app.get("/api/documents/<int:document_id>")
@jwt_required()
def get_document(document_id):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            document = allowed_document(cursor, user, document_id, "read")

            if not document:
                audit(
                    cursor,
                    user["id"] if user else None,
                    document_id,
                    "document_view",
                    "denied",
                )
                connection.commit()
                return error_response("Document not found or access denied", 404)

            audit(cursor, user["id"], document_id, "document_view", "success")

            result = {
                key: document[key]
                for key in (
                    "id", "owner_id", "title", "category", "description",
                    "original_filename", "mime_type", "file_size",
                    "created_at", "updated_at",
                )
            }

        connection.commit()
        return jsonify({"document": result})

    finally:
        if connection:
            connection.close()


@app.get("/api/documents/<int:document_id>/download")
@jwt_required()
def download_document(document_id):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            document = allowed_document(cursor, user, document_id, "read")

            if not document:
                audit(
                    cursor,
                    user["id"] if user else None,
                    document_id,
                    "document_download",
                    "denied",
                )
                connection.commit()
                return error_response("Document not found or access denied", 404)

            file_path = (STORAGE_DIR / document["storage_key"]).resolve()
            if file_path.parent != STORAGE_DIR or not file_path.is_file():
                connection.commit()
                return error_response("Stored file not found", 404)

            audit(
                cursor, user["id"], document_id,
                "document_download", "success",
            )
            filename = Path(document["original_filename"]).name

        connection.commit()

        response = send_file(
            file_path,
            as_attachment=True,
            download_name=filename,
            mimetype="application/octet-stream",
            conditional=False,
        )
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    finally:
        if connection:
            connection.close()


@app.patch("/api/documents/<int:document_id>")
@jwt_required()
def edit_document(document_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response("JSON body required", 400)

    allowed_fields = {"title", "category", "description"}
    if not data or set(data) - allowed_fields:
        return error_response(
            "Only title, category and description can be edited", 400
        )

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            document = allowed_document(cursor, user, document_id, "edit")

            if not document:
                audit(
                    cursor,
                    user["id"] if user else None,
                    document_id,
                    "document_edit",
                    "denied",
                )
                connection.commit()
                return error_response(
                    "Document not found or edit access denied", 404
                )

            updates, values = [], []
            limits = {
                "title": 255,
                "category": 100,
                "description": 5000,
            }

            for key, value in data.items():
                if not isinstance(value, str) or len(value) > limits[key]:
                    return error_response(f"Invalid {key}", 400)

                if key == "title" and not value.strip():
                    return error_response("Title cannot be empty", 400)

                updates.append(f"{key} = %s")
                values.append(value.strip())

            values.append(document_id)

            cursor.execute(
                f"UPDATE documents SET {', '.join(updates)} WHERE id = %s",
                values,
            )

            audit(
                cursor, user["id"], document_id, "document_edit", "success",
                {"fields": sorted(data.keys())},
            )

        connection.commit()
        return jsonify({"message": "Document updated"})

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Document edit failed")
        return error_response("Could not update document", 500)

    finally:
        if connection:
            connection.close()


@app.delete("/api/documents/<int:document_id>")
@jwt_required()
def delete_document(document_id):
    connection = None
    storage_key = None

    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            cursor.execute(
                "SELECT * FROM documents WHERE id = %s",
                (document_id,),
            )
            document = cursor.fetchone()

            if (
                not document
                or not user
                or document["owner_id"] != user["id"]
            ):
                audit(
                    cursor,
                    user["id"] if user else None,
                    document_id,
                    "document_delete",
                    "denied",
                )
                connection.commit()
                return error_response("Document not found or delete denied", 404)

            storage_key = document["storage_key"]

            audit(
                cursor, user["id"], document_id, "document_delete", "success",
                {"title": document["title"]},
            )

            cursor.execute(
                "DELETE FROM group_document_permissions WHERE document_id=%s",
                (document_id,),
            )
            cursor.execute(
                "DELETE FROM department_document_permissions WHERE document_id=%s",
                (document_id,),
            )
            cursor.execute(
                "DELETE FROM document_permissions WHERE document_id=%s",
                (document_id,),
            )
            cursor.execute(
                "DELETE FROM documents WHERE id=%s",
                (document_id,),
            )

        connection.commit()
        (STORAGE_DIR / storage_key).unlink(missing_ok=True)
        return jsonify({"message": "Document deleted"})

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Document deletion failed")
        return error_response("Could not delete document", 500)

    finally:
        if connection:
            connection.close()

@app.put("/api/documents/<int:document_id>/permissions")
@jwt_required()
def grant_user_permission(document_id):
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    permission = data.get("permission")

    if not isinstance(email, str) or permission not in ("read", "edit"):
        return error_response("Email and read/edit permission are required", 400)

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)

            cursor.execute(
                "SELECT owner_id FROM documents WHERE id = %s",
                (document_id,),
            )
            document = cursor.fetchone()

            if not document or not user or document["owner_id"] != user["id"]:
                audit(
                    cursor, user["id"] if user else None, document_id,
                    "permission_grant", "denied",
                )
                connection.commit()
                return error_response("Only the document owner can share it", 403)

            cursor.execute(
                "SELECT id, is_active FROM users WHERE email = %s",
                (email.strip().lower(),),
            )
            target = cursor.fetchone()

            if not target or not target["is_active"] or target["id"] == user["id"]:
                return error_response("Active recipient not found", 404)

            cursor.execute(
                """
                INSERT INTO document_permissions
                    (document_id, user_id, permission, granted_by)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    permission = VALUES(permission),
                    granted_by = VALUES(granted_by)
                """,
                (document_id, target["id"], permission, user["id"]),
            )

            audit(
                cursor, user["id"], document_id, "permission_grant", "success",
                {"recipient_id": target["id"], "permission": permission},
            )

        connection.commit()
        return jsonify({"message": "Permission granted"})

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Permission grant failed")
        return error_response("Could not grant permission", 500)

    finally:
        if connection:
            connection.close()


@app.delete("/api/documents/<int:document_id>/permissions/<int:target_user_id>")
@jwt_required()
def revoke_user_permission(document_id, target_user_id):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)

            cursor.execute(
                "SELECT owner_id FROM documents WHERE id = %s",
                (document_id,),
            )
            document = cursor.fetchone()

            if not document or not user or document["owner_id"] != user["id"]:
                audit(
                    cursor, user["id"] if user else None, document_id,
                    "permission_revoke", "denied",
                )
                connection.commit()
                return error_response("Only the owner can revoke access", 403)

            cursor.execute(
                """
                DELETE FROM document_permissions
                WHERE document_id = %s AND user_id = %s
                """,
                (document_id, target_user_id),
            )

            if cursor.rowcount == 0:
                return error_response("Permission not found", 404)

            audit(
                cursor, user["id"], document_id, "permission_revoke", "success",
                {"recipient_id": target_user_id},
            )

        connection.commit()
        return jsonify({"message": "Permission revoked"})

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Permission revoke failed")
        return error_response("Could not revoke permission", 500)

    finally:
        if connection:
            connection.close()


@app.put("/api/documents/<int:document_id>/group-permissions")
@jwt_required()
def grant_group_permission(document_id):
    data = request.get_json(silent=True) or {}
    group_id = data.get("group_id")
    permission = data.get("permission")

    if (
        not isinstance(group_id, int)
        or isinstance(group_id, bool)
        or permission not in ("read", "edit")
    ):
        return error_response("group_id and read/edit permission required", 400)

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)

            cursor.execute(
                "SELECT owner_id FROM documents WHERE id = %s",
                (document_id,),
            )
            document = cursor.fetchone()

            cursor.execute(
                "SELECT id FROM access_groups WHERE id = %s",
                (group_id,),
            )
            group = cursor.fetchone()

            if not document or not group or not user or document["owner_id"] != user["id"]:
                audit(
                    cursor, user["id"] if user else None, document_id,
                    "group_permission_grant", "denied", {"group_id": group_id},
                )
                connection.commit()
                return error_response("Owner and valid group required", 403)

            cursor.execute(
                """
                INSERT INTO group_document_permissions
                    (group_id, document_id, permission, granted_by)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    permission = VALUES(permission),
                    granted_by = VALUES(granted_by)
                """,
                (group_id, document_id, permission, user["id"]),
            )

            cursor.execute(
                """
                INSERT INTO group_permission_audit
                    (group_id, document_id, action, actor_id)
                VALUES (%s, %s, 'grant', %s)
                """,
                (group_id, document_id, user["id"]),
            )

            audit(
                cursor, user["id"], document_id, "group_permission_grant", "success",
                {"group_id": group_id, "permission": permission},
            )

        connection.commit()
        return jsonify({"message": "Group permission granted"})

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Group permission grant failed")
        return error_response("Could not grant group permission", 500)

    finally:
        if connection:
            connection.close()


@app.delete("/api/documents/<int:document_id>/group-permissions/<int:group_id>")
@jwt_required()
def revoke_group_permission(document_id, group_id):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)

            cursor.execute(
                "SELECT owner_id FROM documents WHERE id = %s",
                (document_id,),
            )
            document = cursor.fetchone()

            if not document or not user or document["owner_id"] != user["id"]:
                audit(
                    cursor, user["id"] if user else None, document_id,
                    "group_permission_revoke", "denied", {"group_id": group_id},
                )
                connection.commit()
                return error_response("Only the owner can revoke group access", 403)

            cursor.execute(
                """
                DELETE FROM group_document_permissions
                WHERE document_id = %s AND group_id = %s
                """,
                (document_id, group_id),
            )

            if cursor.rowcount == 0:
                return error_response("Group permission not found", 404)

            cursor.execute(
                """
                INSERT INTO group_permission_audit
                    (group_id, document_id, action, actor_id)
                VALUES (%s, %s, 'revoke', %s)
                """,
                (group_id, document_id, user["id"]),
            )

            audit(
                cursor, user["id"], document_id, "group_permission_revoke", "success",
                {"group_id": group_id},
            )

        connection.commit()
        return jsonify({"message": "Group permission revoked"})

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Group permission revoke failed")
        return error_response("Could not revoke group permission", 500)

    finally:
        if connection:
            connection.close()


@app.put("/api/documents/<int:document_id>/department-permissions")
@jwt_required()
def grant_department_permission(document_id):
    data = request.get_json(silent=True) or {}
    department_id = data.get("department_id")
    permission = data.get("permission")

    if (
        not isinstance(department_id, int)
        or isinstance(department_id, bool)
        or department_id <= 0
        or permission not in ("read", "edit")
    ):
        return error_response(
            "Valid department_id and read/edit permission required", 400
        )

    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)

            cursor.execute(
                "SELECT owner_id FROM documents WHERE id = %s",
                (document_id,),
            )
            document = cursor.fetchone()

            cursor.execute(
                "SELECT id FROM departments WHERE id = %s",
                (department_id,),
            )
            department = cursor.fetchone()

            if not document or not user or document["owner_id"] != user["id"]:
                audit(
                    cursor, user["id"] if user else None, document_id,
                    "department_permission_grant", "denied",
                    {"department_id": department_id},
                )
                connection.commit()
                return error_response("Only the document owner can share it", 403)

            if not department:
                return error_response("Department not found", 404)

            cursor.execute(
                """
                INSERT INTO department_document_permissions
                    (department_id, document_id, permission, granted_by)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    permission = VALUES(permission),
                    granted_by = VALUES(granted_by)
                """,
                (department_id, document_id, permission, user["id"]),
            )

            audit(
                cursor, user["id"], document_id,
                "department_permission_grant", "success",
                {"department_id": department_id, "permission": permission},
            )

        connection.commit()
        return jsonify({"message": "Department permission granted"})

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Department permission grant failed")
        return error_response("Could not grant department permission", 500)

    finally:
        if connection:
            connection.close()


@app.delete("/api/documents/<int:document_id>/department-permissions/<int:department_id>")
@jwt_required()
def revoke_department_permission(document_id, department_id):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)

            cursor.execute(
                "SELECT owner_id FROM documents WHERE id = %s",
                (document_id,),
            )
            document = cursor.fetchone()

            if not document or not user or document["owner_id"] != user["id"]:
                audit(
                    cursor, user["id"] if user else None, document_id,
                    "department_permission_revoke", "denied",
                    {"department_id": department_id},
                )
                connection.commit()
                return error_response("Only the owner can revoke department access", 403)

            cursor.execute(
                """
                DELETE FROM department_document_permissions
                WHERE document_id = %s AND department_id = %s
                """,
                (document_id, department_id),
            )

            if cursor.rowcount == 0:
                return error_response("Department permission not found", 404)

            audit(
                cursor, user["id"], document_id,
                "department_permission_revoke", "success",
                {"department_id": department_id},
            )

        connection.commit()
        return jsonify({"message": "Department permission revoked"})

    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Department permission revoke failed")
        return error_response("Could not revoke department permission", 500)

    finally:
        if connection:
            connection.close()


@app.get("/api/admin/audit")
@jwt_required()
def audit_logs():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            user = current_user_record(cursor)
            if not require_role(user, "admin"):
                return error_response("Admin access required", 403)

            cursor.execute(
                """
                SELECT id, actor_id, document_id, action, outcome,
                       details, previous_hash, entry_hash, created_at
                FROM audit_logs
                ORDER BY id DESC
                LIMIT 500
                """
            )
            logs = cursor.fetchall()

        return jsonify({"logs": logs})

    finally:
        if connection:
            connection.close()


@app.errorhandler(413)
def request_too_large(_error):
    return error_response("Request too large (maximum 10 MB)", 413)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
