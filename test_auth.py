
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))

import app as trustvault_app


def test_login_requires_json_body():
    client = trustvault_app.app.test_client()

    response = client.post("/api/auth/login")

    assert response.status_code == 400
    assert response.get_json()["error"] == "JSON body required"
def test_login_rejects_non_json_body():
    client = trustvault_app.app.test_client()

    response = client.post(
        "/api/auth/login",
        data="invalid body",
        content_type="text/plain",
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "JSON body required"

def test_login_rejects_invalid_credentials(monkeypatch):
    class FakeConnection:
        def cursor(self):
            return self

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def execute(self, query, params):
            pass

        def fetchone(self):
            return {
                "id": 999,
                "name": "Test User",
                "email": "wrong@example.com",
                "password_hash": "invalid-hash",
                "role": "viewer",
                "is_active": 1,
                "token_version": 0,
            }

        def close(self):
            pass

    monkeypatch.setattr(
        trustvault_app,
        "get_db_connection",
        lambda: FakeConnection(),
    )

    client = trustvault_app.app.test_client()
    response = client.post(
        "/api/auth/login",
        json={
            "email": "wrong@example.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid email or password"

def test_login_returns_access_token_for_valid_credentials(monkeypatch):
    from werkzeug.security import generate_password_hash

    class FakeConnection:
        def cursor(self):
            return self

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def execute(self, query, params):
            pass

        def fetchone(self):
            return {
                "id": 10,
                "name": "Test User",
                "email": "test@example.com",
                "password_hash": generate_password_hash("ValidPass123!"),
                "role": "viewer",
                "is_active": 1,
                "token_version": 0,
            }

        def close(self):
            pass

    monkeypatch.setattr(
        trustvault_app,
        "get_db_connection",
        lambda: FakeConnection(),
    )

    client = trustvault_app.app.test_client()
    response = client.post(
        "/api/auth/login",
        json={
            "email": "test@example.com",
            "password": "ValidPass123!",
        },
    )

    assert response.status_code == 200
    assert "access_token" in response.get_json()
    assert response.get_json()["user"]["email"] == "test@example.com"

def test_login_rejects_inactive_user(monkeypatch):
    from werkzeug.security import generate_password_hash

    class FakeConnection:
        def cursor(self):
            return self

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def execute(self, query, params):
            pass

        def fetchone(self):
            return {
                "id": 11,
                "name": "Inactive User",
                "email": "inactive@example.com",
                "password_hash": generate_password_hash("ValidPass123!"),
                "role": "viewer",
                "is_active": 0,
                "token_version": 0,
            }

        def close(self):
            pass

    monkeypatch.setattr(
        trustvault_app,
        "get_db_connection",
        lambda: FakeConnection(),
    )

    client = trustvault_app.app.test_client()
    response = client.post(
        "/api/auth/login",
        json={
            "email": "inactive@example.com",
            "password": "ValidPass123!",
        },
    )

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid email or password"

def test_document_access_denied_returns_404(monkeypatch):
    class FakeConnection:
        def cursor(self):
            return self

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def execute(self, query, params):
            pass

        def fetchone(self):
            return {
                "id": 2,
                "name": "Viewer",
                "email": "viewer@example.com",
                "role": "viewer",
                "is_active": 1,
                "token_version": 0,
            }

        def commit(self):
            pass

        def close(self):
            pass

    monkeypatch.setattr(
        trustvault_app,
        "get_db_connection",
        lambda: FakeConnection(),
    )
    monkeypatch.setattr(
        trustvault_app,
        "allowed_document",
        lambda cursor, user, document_id, permission="read": None,
    )
    monkeypatch.setattr(
        trustvault_app,
        "audit",
        lambda *args, **kwargs: None,
    )

    with trustvault_app.app.app_context():
        from flask_jwt_extended import create_access_token

        token = create_access_token(
            identity="2",
            additional_claims={"token_version": 0},
        )

    client = trustvault_app.app.test_client()
    response = client.get(
        "/api/documents/999",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
    assert response.get_json()["error"] == "Document not found or access denied"
