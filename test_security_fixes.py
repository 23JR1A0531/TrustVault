
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
