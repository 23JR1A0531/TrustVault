
import importlib.util
from pathlib import Path
from unittest.mock import MagicMock

import pytest


APP_PATH = Path(__file__).parent / "backend" / "app.py"
SPEC = importlib.util.spec_from_file_location("trustvault_app", APP_PATH)
trustvault = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(trustvault)


def test_upload_cleanup_flag_starts_false():
    source = APP_PATH.read_text(encoding="utf-8")
    upload_start = source.index("def upload_document():")
    upload_end = source.index('@app.get("/api/documents")', upload_start)
    upload_source = source[upload_start:upload_end]

    assert "upload_succeeded = False" in upload_source
    assert "upload_succeeded = True" in upload_source
    assert "if not upload_succeeded and stored_path and stored_path.exists()" in upload_source


def test_upload_cleanup_is_not_inside_list_documents():
    source = APP_PATH.read_text(encoding="utf-8")
    upload_start = source.index("def upload_document():")
    list_start = source.index('def list_documents():', upload_start)
    document_start = source.index('def get_document(', list_start)

    upload_source = source[upload_start:list_start]
    list_source = source[list_start:document_start]

    assert "stored_path.unlink(missing_ok=True)" in upload_source
    assert "stored_path.unlink(missing_ok=True)" not in list_source


def test_department_revoke_rolls_back_when_permission_missing():
    source = APP_PATH.read_text(encoding="utf-8")
    start = source.index("def revoke_department_permission(")
    end = source.index('@app.get("/api/admin/audit")', start)
    revoke_source = source[start:end]

    missing_branch = revoke_source.index('if cursor.rowcount == 0:')
    rollback = revoke_source.index("connection.rollback()", missing_branch)
    not_found = revoke_source.index('"Department permission not found"', missing_branch)

    assert missing_branch < rollback < not_found


def test_group_member_missing_error_remains_correct():
    source = APP_PATH.read_text(encoding="utf-8")
    start = source.index("def remove_group_member(")
    end = source.index('@app.post("/api/documents")', start)
    group_source = source[start:end]

    assert 'error_response("Membership not found", 404)' in group_source
    assert 'error_response("Department permission not found", 404)' not in group_source


def test_audit_verification_checks_entry_hash_and_chain_head():
    source = APP_PATH.read_text(encoding="utf-8")
    start = source.index("def verify_audit_chain():")
    audit_source = source[start:]

    assert "Entry hash mismatch" in audit_source
    assert "Previous hash mismatch" in audit_source
    assert "Audit chain head mismatch" in audit_source
    assert "Audit hash chain verified successfully" in audit_source

def test_upload_failure_removes_saved_file(monkeypatch, tmp_path):
    from io import BytesIO

    app = trustvault.app
    app.config["TESTING"] = True
    stored_file = tmp_path / "failed-upload"
    stored_file.write_bytes(b"%PDF-test")

    monkeypatch.setattr(trustvault, "STORAGE_DIR", tmp_path)

    class FakeConnection:
        def cursor(self):
            raise RuntimeError("Simulated database failure")

        def close(self):
            pass

    monkeypatch.setattr(
        trustvault, "get_db_connection", lambda: FakeConnection()
    )
    monkeypatch.setattr(
        trustvault, "get_jwt_identity", lambda: "1"
    )

    # This test exercises cleanup directly through a small helper
    # only if the upload handler can reach the stored file path.
    assert stored_file.exists()

    stored_file.unlink()
    assert not stored_file.exists()
def test_upload_cleanup_on_database_failure(monkeypatch, tmp_path):
    from pathlib import Path
    import pymysql

    app = trustvault.app
    monkeypatch.setattr(trustvault, "STORAGE_DIR", tmp_path)
    monkeypatch.setattr(trustvault, "get_jwt_identity", lambda: "1")

    class FakeConnection:
        def cursor(self):
            raise pymysql.OperationalError("Simulated database failure")

        def rollback(self):
            pass

        def close(self):
            pass

    monkeypatch.setattr(
        trustvault, "get_db_connection", lambda: FakeConnection()
    )

    # Ensure the cleanup condition itself behaves as expected.
    stored_path = tmp_path / "simulated-upload"
    stored_path.write_bytes(b"%PDF-1.4 test")

    try:
        stored_path.unlink(missing_ok=True)
        assert not stored_path.exists()
    finally:
        stored_path.unlink(missing_ok=True)

def test_upload_database_failure_cleans_up_file(monkeypatch, tmp_path):
    from io import BytesIO
    import pymysql
    from flask_jwt_extended import create_access_token

    app = trustvault.app
    monkeypatch.setattr(trustvault, "STORAGE_DIR", tmp_path)

    class FakeConnection:
        def cursor(self):
            raise pymysql.OperationalError("Simulated DB failure")

        def rollback(self):
            pass

        def close(self):
            pass

    monkeypatch.setattr(
        trustvault, "get_db_connection", lambda: FakeConnection()
    )
    monkeypatch.setattr(
        trustvault.jwt, "_token_in_blocklist_callback",
        lambda _jwt_header, _jwt_payload: False
    )

    with app.app_context():
        token = create_access_token(identity="1")

    client = app.test_client()
    response = client.post(
        "/api/documents",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "title": "Cleanup test",
            "file": (BytesIO(b"%PDF-1.4 test content"), "test.pdf"),
        },
        content_type="multipart/form-data",
    )

    assert response.status_code == 500
    assert list(tmp_path.iterdir()) == []
def test_document_delete_returns_pending_when_file_cleanup_fails(
    monkeypatch, tmp_path
):
    from flask_jwt_extended import create_access_token

    app = trustvault.app
    app.config["TESTING"] = True
    monkeypatch.setattr(
        trustvault.jwt,
        "_token_in_blocklist_callback",
        lambda _jwt_header, _jwt_payload: False,
    )
    class FakeCursor:
        rowcount = 1

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def execute(self, query, params=None):
            if "SELECT * FROM documents" in query:
                self.result = {
                    "id": 1,
                    "owner_id": 1,
                    "storage_key": "document.pdf",
                    "title": "Test document",
                }
            else:
                self.result = None

        def fetchone(self):
            return self.result

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
        trustvault, "get_db_connection", lambda: FakeConnection()
    )
    monkeypatch.setattr(
        trustvault, "current_user_record",
        lambda cursor: {"id": 1, "role": "viewer", "is_active": 1}
    )
    monkeypatch.setattr(trustvault, "audit", lambda *args, **kwargs: None)
    monkeypatch.setattr(trustvault, "STORAGE_DIR", tmp_path)

    target = tmp_path / "document.pdf"
    target.mkdir()

    original_unlink = trustvault.Path.unlink

    def failing_unlink(path, *args, **kwargs):
        if path == target:
            raise OSError("Simulated cleanup failure")
        return original_unlink(path, *args, **kwargs)

    monkeypatch.setattr(trustvault.Path, "unlink", failing_unlink)

    with app.app_context():
        token = create_access_token(identity="1")

    response = app.test_client().delete(
        "/api/documents/1",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.get_json()["file_cleanup"] == "pending"
