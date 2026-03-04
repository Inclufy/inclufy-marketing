"""Tests for admin router — organization management, members, config."""
from unittest.mock import MagicMock, patch
from tests.conftest import FAKE_USER, FAKE_USER_NO_ORG
import pytest


# ─── Helper: superadmin user ────────────────────────────────────────────
SUPERADMIN_USER = {
    "id": "44444444-4444-4444-4444-444444444444",
    "email": "sami@inclufy.com",
    "role": "owner",
    "organization_id": "22222222-2222-2222-2222-222222222222",
}

NORMAL_USER = {
    "id": "55555555-5555-5555-5555-555555555555",
    "email": "user@example.com",
    "role": "member",
    "organization_id": "22222222-2222-2222-2222-222222222222",
}


@pytest.fixture
def admin_client(mock_db):
    from main import app
    from dependencies import get_current_user, get_supabase_client
    app.dependency_overrides[get_current_user] = lambda: SUPERADMIN_USER
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    from fastapi.testclient import TestClient
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def member_client(mock_db):
    from main import app
    from dependencies import get_current_user, get_supabase_client
    app.dependency_overrides[get_current_user] = lambda: NORMAL_USER
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    from fastapi.testclient import TestClient
    yield TestClient(app)
    app.dependency_overrides.clear()


# ─── Ping ────────────────────────────────────────────────────────────────

def test_admin_ping(admin_client):
    r = admin_client.get("/api/admin/ping")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert "superadmins" in data


# ─── Whoami ──────────────────────────────────────────────────────────────

def test_whoami_superadmin(admin_client):
    r = admin_client.get("/api/admin/whoami")
    assert r.status_code == 200
    data = r.json()
    assert data["is_superadmin"] is True
    assert data["email"] == "sami@inclufy.com"


# ─── Members ─────────────────────────────────────────────────────────────

def test_list_members_as_superadmin(admin_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = [
        {"user_id": "u1", "role": "admin", "permissions": None, "joined_at": None}
    ]
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_result

    # Mock user enrichment
    user_result = MagicMock()
    user_result.data = {"email": "member@test.com", "full_name": "Test Member"}
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = user_result

    r = admin_client.get("/api/admin/members")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_list_members_denied_for_member(member_client):
    r = member_client.get("/api/admin/members")
    assert r.status_code == 403


def test_update_member_role(admin_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = [{"role": "admin"}]
    mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = mock_result

    r = admin_client.patch("/api/admin/members/u1/role", json={"role": "admin"})
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_update_member_role_invalid(admin_client):
    r = admin_client.patch("/api/admin/members/u1/role", json={"role": "hacker"})
    assert r.status_code == 400


def test_remove_member(admin_client, mock_db):
    mock_db.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()

    r = admin_client.delete("/api/admin/members/other-user-id")
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_remove_self_denied(admin_client):
    r = admin_client.delete(f"/api/admin/members/{SUPERADMIN_USER['id']}")
    assert r.status_code == 400


# ─── Organization ────────────────────────────────────────────────────────

def test_get_organization(admin_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = {"id": "org1", "name": "Test Org", "slug": "test-org", "created_at": None}
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_result

    r = admin_client.get("/api/admin/organization")
    assert r.status_code == 200


def test_update_organization(admin_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = [{"name": "New Name"}]
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

    r = admin_client.patch("/api/admin/organization", json={"name": "New Name"})
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_update_organization_empty(admin_client):
    r = admin_client.patch("/api/admin/organization", json={})
    assert r.status_code == 400


# ─── Config ──────────────────────────────────────────────────────────────

def test_get_system_config(admin_client):
    r = admin_client.get("/api/admin/config")
    assert r.status_code == 200
    data = r.json()
    assert "openai" in data
    assert "stripe" in data
    assert "configured" in data["openai"]


def test_config_denied_for_member(member_client):
    r = member_client.get("/api/admin/config")
    assert r.status_code == 403


# ─── Stats ───────────────────────────────────────────────────────────────

def test_platform_stats(admin_client, mock_db):
    mock_result = MagicMock()
    mock_result.count = 5
    mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = mock_result

    r = admin_client.get("/api/admin/stats")
    assert r.status_code == 200
    data = r.json()
    assert "campaigns" in data
    assert "contacts" in data


# ─── Invite ──────────────────────────────────────────────────────────────

def test_invite_invalid_email(admin_client):
    r = admin_client.post("/api/admin/invite", json={"email": "notanemail", "role": "member"})
    assert r.status_code == 400


def test_invite_invalid_role(admin_client):
    r = admin_client.post("/api/admin/invite", json={"email": "test@test.com", "role": "hacker"})
    assert r.status_code == 400
