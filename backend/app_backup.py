
import os
import pymysql

from datetime import timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config

app = Flask(__name__)
app.config.from_object(Config)

app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]

if not app.config.get("SECRET_KEY") or not app.config.get("JWT_SECRET_KEY"):
    raise RuntimeError("SECRET_KEY and JWT_SECRET_KEY must be configured in .env")

CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}})
jwt = JWTManager(app)


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


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


@app.get("/api/health")
def health_check():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return jsonify({"status": "ok", "database": "connected"}), 200
    except pymysql.MySQLError:
        app.logger.exception("Database health check failed")
        return error_response("Database unavailable", 503)
    finally:
        if connection:
            connection.close()


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response("A JSON request body is required", 400)

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not all(isinstance(value, str) for value in (name, email, password)):
        return error_response("Name, email and password are required", 400)

    name = name.strip()
    email = email.strip().lower()

    if not name or len(name) > 100:
        return error_response("Name must be between 1 and 100 characters", 400)

    if not email or len(email) > 255 or "@" not in email:
        return error_response("A valid email is required", 400)

    if len(password) < 12 or len(password) > 128:
        return error_response("Password must be 12–128 characters", 400)

    connection = None
    try:
        password_hash = generate_password_hash(password)
        connection = get_db_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (name, email, password_hash, role)
                VALUES (%s, %s, %s, 'viewer')
                """,
                (name, email, password_hash),
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
        app.logger.exception("Registration database error")
        return error_response("Registration failed", 500)
    finally:
        if connection:
            connection.close()


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return error_response("A JSON request body is required", 400)

    email = data.get("email")
    password = data.get("password")

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
                FROM users
                WHERE email = %s
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
            additional_claims={
                "token_version": user["token_version"],
                "role": user["role"],
            },
        )

        return jsonify({
            "access_token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
            },
        }), 200

    except pymysql.MySQLError:
        app.logger.exception("Login database error")
        return error_response("Login temporarily unavailable", 503)
    finally:
        if connection:
            connection.close()


@jwt.token_in_blocklist_loader
def check_token_revocation(jwt_header, jwt_payload):
    connection = None
    try:
        user_id = int(jwt_payload["sub"])
        token_version = jwt_payload.get("token_version")
        connection = get_db_connection()

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT token_version, is_active FROM users WHERE id = %s",
                (user_id,),
            )
            user = cursor.fetchone()

        return (
            not user
            or not user["is_active"]
            or user["token_version"] != token_version
        )
    except (pymysql.MySQLError, ValueError, TypeError, KeyError):
        # Fail closed: if revocation status cannot be checked, reject token.
        app.logger.exception("Could not validate token status")
        return True
    finally:
        if connection:
            connection.close()


@jwt.revoked_token_loader
def revoked_token_response(jwt_header, jwt_payload):
    return error_response("Token is no longer valid", 401)


@app.get("/api/auth/me")
@jwt_required()
def current_user():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name, email, role
                FROM users
                WHERE id = %s AND is_active = TRUE
                """,
                (int(get_jwt_identity()),),
            )
            user = cursor.fetchone()

        if not user:
            return error_response("User not found or inactive", 401)

        return jsonify({"user": user}), 200
    except pymysql.MySQLError:
        app.logger.exception("Current-user database error")
        return error_response("Service temporarily unavailable", 503)
    finally:
        if connection:
            connection.close()


@app.post("/api/auth/logout-all")
@jwt_required()
def logout_all():
    """Invalidate all previously issued tokens for the current user."""
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE users
                SET token_version = token_version + 1
                WHERE id = %s
                """,
                (int(get_jwt_identity()),),
            )
        connection.commit()
        return jsonify({"message": "All sessions have been invalidated"}), 200
    except pymysql.MySQLError:
        if connection:
            connection.rollback()
        app.logger.exception("Token revocation database error")
        return error_response("Could not invalidate sessions", 503)
    finally:
        if connection:
            connection.close()


@app.errorhandler(413)
def file_too_large(_error):
    return error_response("Request is too large", 413)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
