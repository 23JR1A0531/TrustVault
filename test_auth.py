
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

def test_authorized_user_can_view_document(monkeypatch):
    from datetime import datetime

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

    document = {
        "id": 10,
        "owner_id": 1,
        "title": "Authorized Test Document",
        "category": "Testing",
        "description": "Authorization test",
        "original_filename": "test.pdf",
        "mime_type": "application/pdf",
        "file_size": 100,
        "created_at": datetime(2026, 1, 1),
        "updated_at": datetime(2026, 1, 1),
    }

    monkeypatch.setattr(
        trustvault_app,
        "get_db_connection",
        lambda: FakeConnection(),
    )
    monkeypatch.setattr(
        trustvault_app,
        "allowed_document",
        lambda cursor, user, document_id, permission="read": document,
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
        "/api/documents/10",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    result = response.get_json()["document"]
    assert result["title"] == "Authorized Test Document"
    assert result["owner_id"] == 1

def test_document_download_denied_returns_404(monkeypatch):
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
        "/api/documents/999/download",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404
    assert response.get_json()["error"] == "Document not found or access denied"

import pytest


@pytest.mark.parametrize(
    ("endpoint", "method"),
    [
        ("/api/admin/audit", "get"),
        ("/api/admin/audit/verify", "get"),
    ],
)
def test_viewer_cannot_access_admin_audit_routes(
    monkeypatch, endpoint, method
):
    from flask_jwt_extended import create_access_token

    class FakeCursor:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def execute(self, query, params=None):
            pass

        def fetchone(self):
            return {
                "id": 10,
                "name": "Test Viewer",
                "email": "viewer@example.com",
                "role": "viewer",
                "is_active": 1,
                "token_version": 0,
            }

    class FakeConnection:
        def cursor(self):
            return FakeCursor()

        def close(self):
            pass

    monkeypatch.setattr(
        trustvault_app,
        "get_db_connection",
        lambda: FakeConnection(),
    )

    app = trustvault_app.app
    monkeypatch.setattr(
        trustvault_app.jwt,
        "_token_in_blocklist_callback",
        lambda _jwt_header, _jwt_payload: False,
    )
    with app.app_context():
        token = create_access_token(identity="10")

    response = getattr(app.test_client(), method)(
        endpoint,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
    assert response.get_json()["error"] == "Admin access required"

@pytest.mark.parametrize(
    ("endpoint", "method"),
    [
        ("/api/admin/audit", "get"),
        ("/api/admin/audit/verify", "get"),
    ],
)
def test_admin_can_access_admin_audit_routes(
    monkeypatch, endpoint, method
):
    from flask_jwt_extended import create_access_token

    class FakeCursor:
        def __init__(self):
            self.query = ""

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def execute(self, query, params=None):
            self.query = query

        def fetchone(self):
            if "FROM users" in self.query:
                return {
                    "id": 1,
                    "name": "Test Admin",
                    "email": "admin@example.com",
                    "role": "admin",
                    "is_active": 1,
                    "token_version": 0,
                }
            if "audit_chain_head" in self.query:
                return {"last_hash": None}
            return None

        def fetchall(self):
            return []

    class FakeConnection:
        def cursor(self):
            return FakeCursor()

        def close(self):
            pass

    monkeypatch.setattr(
        trustvault_app,
        "get_db_connection",
        lambda: FakeConnection(),
    )
    monkeypatch.setattr(
        trustvault_app.jwt,
        "_token_in_blocklist_callback",
        lambda _jwt_header, _jwt_payload: False,
    )

    app = trustvault_app.app
    with app.app_context():
        token = create_access_token(identity="1")

    response = getattr(app.test_client(), method)(
        endpoint,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    if endpoint.endswith("/verify"):
        assert response.get_json()["valid"] is True
        assert response.get_json()["checked_entries"] == 0
    else:
        assert response.get_json()["logs"] == []

@pytest.mark.parametrize(
    ("endpoint", "method", "payload"),
    [
        ("/api/documents/1/permissions", "put",
         {"email": "recipient@example.com", "permission": "read"}),
        ("/api/documents/1/permissions/2", "delete", None),
    ],
)
def test_non_owner_cannot_change_document_permissions(
    monkeypatch, endpoint, method, payload
):
    from flask_jwt_extended import create_access_token

    class FakeCursor:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def execute(self, query, params=None):
            pass

        def fetchone(self):
            # Current user is ID 10; document belongs to ID 1.
            if "SELECT owner_id FROM documents" in getattr(self, "query", ""):
                return {"owner_id": 1}
            return None

    class FakeConnection:
        def cursor(self):
            cursor = FakeCursor()
            original_execute = cursor.execute

            def execute(query, params=None):
                cursor.query = query
                return original_execute(query, params)

            cursor.execute = execute
            def commit():
                pass
            def rollback():
                pass
            def close():
                pass
            self.commit = commit
            self.rollback = rollback
            self.close = close
            return cursor

    monkeypatch.setattr(
        trustvault_app,
        "get_db_connection",
        lambda: FakeConnection(),
    )
    monkeypatch.setattr(
        trustvault_app,
        "current_user_record",
        lambda cursor: {
            "id": 10, "role": "viewer", "is_active": 1
        },
    )
    monkeypatch.setattr(
        trustvault_app, "audit", lambda *args, **kwargs: None
    )
    monkeypatch.setattr(
        trustvault_app.jwt,
        "_token_in_blocklist_callback",
        lambda _jwt_header, _jwt_payload: False,
    )

    app = trustvault_app.app
    with app.app_context():
        token = create_access_token(identity="10")

    client = app.test_client()
    response = getattr(client, method)(
        endpoint,
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403

@pytest.mark.parametrize(
    ("endpoint", "method", "payload"),
    [
        ("/api/documents/1/group-permissions", "put",
         {"group_id": 2, "permission": "read"}),
        ("/api/documents/1/group-permissions/2", "delete", None),
        ("/api/documents/1/department-permissions", "put",
         {"department_id": 2, "permission": "read"}),
        ("/api/documents/1/department-permissions/2", "delete", None),
    ],
)
def test_non_owner_cannot_change_group_or_department_permissions(
    monkeypatch, endpoint, method, payload
):
    from flask_jwt_extended import create_access_token

    class FakeCursor:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def execute(self, query, params=None):
            self.query = query

        def fetchone(self):
            if "SELECT owner_id FROM documents" in self.query:
                return {"owner_id": 1}
            if "SELECT id FROM access_groups" in self.query:
                return {"id": 2}
            if "SELECT id FROM departments" in self.query:
                return {"id": 2}
            return None

    class FakeConnection:
        def cursor(self):
            return FakeCursor()

        def commit(self):
            pass

        def rollback(self):
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
        "current_user_record",
        lambda cursor: {
            "id": 10, "role": "viewer", "is_active": 1
        },
    )
    monkeypatch.setattr(
        trustvault_app, "audit", lambda *args, **kwargs: None
    )
    monkeypatch.setattr(
        trustvault_app.jwt,
        "_token_in_blocklist_callback",
        lambda _jwt_header, _jwt_payload: False,
    )

    app = trustvault_app.app
    with app.app_context():
        token = create_access_token(identity="10")

    response = getattr(app.test_client(), method)(
        endpoint,
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403

@pytest.mark.parametrize(
    ("endpoint", "method", "payload"),
    [
        ("/api/documents/1/group-permissions", "put",
         {"group_id": 2, "permission": "read"}),
        ("/api/documents/1/group-permissions/2", "delete", None),
        ("/api/documents/1/department-permissions", "put",
         {"department_id": 2, "permission": "read"}),
        ("/api/documents/1/department-permissions/2", "delete", None),
    ],
)
def test_owner_can_change_group_and_department_permissions(
    monkeypatch, endpoint, method, payload
):
    from flask_jwt_extended import create_access_token

    class FakeCursor:
        rowcount = 1

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def execute(self, query, params=None):
            self.query = query

        def fetchone(self):
            if "SELECT owner_id FROM documents" in self.query:
                return {"owner_id": 1}
            if "SELECT id FROM access_groups" in self.query:
                return {"id": 2}
            if "SELECT id FROM departments" in self.query:
                return {"id": 2}
            return None

    class FakeConnection:
        def cursor(self):
            return FakeCursor()

        def commit(self):
            pass

        def rollback(self):
            pass

        def close(self):
            pass

    monkeypatch.setattr(
        trustvault_app, "get_db_connection", lambda: FakeConnection()
    )
    monkeypatch.setattr(
        trustvault_app,
        "current_user_record",
        lambda cursor: {
            "id": 1, "role": "admin", "is_active": 1
        },
    )
    monkeypatch.setattr(
        trustvault_app, "audit", lambda *args, **kwargs: None
    )
    monkeypatch.setattr(
        trustvault_app.jwt,
        "_token_in_blocklist_callback",
        lambda _jwt_header, _jwt_payload: False,
    )

    app = trustvault_app.app
    with app.app_context():
        token = create_access_token(identity="1")

    response = getattr(app.test_client(), method)(
        endpoint,
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.get_json()
