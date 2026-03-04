"""Tests for tenant admin router — superadmin-only platform management."""
from unittest.mock import MagicMock
import pytest


# ─── Helper: superadmin user ────────────────────────────────────────────
SUPERADMIN_USER = {
    "id": "44444444-4444-4444-4444-444444444444",
    "email": "sami@inclufy.com",
    "role": "owner",
    "organization_id": "22222222-2222-2222-2222-222222222222",
}

NON_SUPERADMIN_USER = {
    "id": "55555555-5555-5555-5555-555555555555",
    "email": "regular@example.com",
    "role": "admin",
    "organization_id": "22222222-2222-2222-2222-222222222222",
}


@pytest.fixture
def sa_client(mock_db):
    from main import app
    from dependencies import get_current_user, get_supabase_client
    app.dependency_overrides[get_current_user] = lambda: SUPERADMIN_USER
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    from fastapi.testclient import TestClient
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def regular_client(mock_db):
    from main import app
    from dependencies import get_current_user, get_supabase_client
    app.dependency_overrides[get_current_user] = lambda: NON_SUPERADMIN_USER
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    from fastapi.testclient import TestClient
    yield TestClient(app)
    app.dependency_overrides.clear()


# ─── Access Control ──────────────────────────────────────────────────────

def test_non_superadmin_denied_dashboard(regular_client):
    r = regular_client.get("/api/tenant-admin/dashboard/stats")
    assert r.status_code == 403


def test_non_superadmin_denied_users(regular_client):
    r = regular_client.get("/api/tenant-admin/users")
    assert r.status_code == 403


def test_non_superadmin_denied_organizations(regular_client):
    r = regular_client.get("/api/tenant-admin/organizations")
    assert r.status_code == 403


# ─── Dashboard Stats ────────────────────────────────────────────────────

def test_dashboard_stats(sa_client, mock_db):
    mock_count = MagicMock()
    mock_count.count = 10
    mock_db.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_count

    # Mock subscriptions query
    mock_subs = MagicMock()
    mock_subs.data = [
        {"amount": 49, "interval": "month", "status": "active"},
        {"amount": 399, "interval": "year", "status": "active"},
    ]
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_subs

    r = sa_client.get("/api/tenant-admin/dashboard/stats")
    assert r.status_code == 200
    data = r.json()
    assert "total_users" in data
    assert "mrr" in data
    assert "arr" in data
    assert "organizations" in data


# ─── Recent Users ────────────────────────────────────────────────────────

def test_recent_users(sa_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = [
        {"id": "u1", "email": "user@test.com", "full_name": "Test", "created_at": "2025-01-01"}
    ]
    mock_db.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_result

    # Mock org enrichment
    mock_org = MagicMock()
    mock_org.data = [{"organization_id": "org1", "role": "member", "organizations": {"name": "Test Org"}}]
    mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = mock_org

    r = sa_client.get("/api/tenant-admin/dashboard/recent-users?limit=5")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ─── Activity ────────────────────────────────────────────────────────────

def test_recent_activity(sa_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = [
        {"id": "c1", "name": "Test Campaign", "status": "active", "created_at": "2025-01-01"}
    ]
    mock_db.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_result

    r = sa_client.get("/api/tenant-admin/dashboard/activity")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ─── Users CRUD ──────────────────────────────────────────────────────────

def test_list_all_users(sa_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = [{"id": "u1", "email": "user@test.com"}]
    mock_result.count = 1
    mock_db.table.return_value.select.return_value.order.return_value.range.return_value.execute.return_value = mock_result

    # Mock org enrichment
    mock_org = MagicMock()
    mock_org.data = [{"organization_id": "org1", "role": "member", "organizations": {"name": "Test"}}]
    mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = mock_org

    r = sa_client.get("/api/tenant-admin/users")
    assert r.status_code == 200
    data = r.json()
    assert "users" in data
    assert "total" in data


def test_create_user_invalid_email(sa_client):
    r = sa_client.post("/api/tenant-admin/users", json={"email": "bad", "role": "member"})
    assert r.status_code == 400


def test_delete_user_self_denied(sa_client):
    r = sa_client.delete(f"/api/tenant-admin/users/{SUPERADMIN_USER['id']}")
    assert r.status_code == 400


# ─── Organizations CRUD ─────────────────────────────────────────────────

def test_list_organizations(sa_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = [{"id": "org1", "name": "Test Org", "slug": "test-org", "created_at": None}]
    mock_db.table.return_value.select.return_value.order.return_value.execute.return_value = mock_result

    # Mock member count
    mock_count = MagicMock()
    mock_count.count = 3
    mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = mock_count

    r = sa_client.get("/api/tenant-admin/organizations")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_organization(sa_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = [{"id": "new-org", "name": "New Org", "slug": "new-org"}]
    mock_db.table.return_value.insert.return_value.execute.return_value = mock_result

    r = sa_client.post("/api/tenant-admin/organizations", json={"name": "New Org"})
    assert r.status_code == 200
    assert r.json()["success"] is True


# ─── Subscriptions ───────────────────────────────────────────────────────

def test_list_subscriptions(sa_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = []
    mock_db.table.return_value.select.return_value.order.return_value.execute.return_value = mock_result

    r = sa_client.get("/api/tenant-admin/subscriptions")
    assert r.status_code == 200


# ─── Integrations ────────────────────────────────────────────────────────

def test_list_integrations(sa_client):
    r = sa_client.get("/api/tenant-admin/integrations")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert any(i["id"] == "openai" for i in data)
    assert any(i["id"] == "stripe" for i in data)


# ─── Settings ────────────────────────────────────────────────────────────

def test_get_system_settings(sa_client, mock_db):
    # Mock system_settings table (may not exist)
    mock_db.table.return_value.select.return_value.execute.side_effect = Exception("42P01")

    r = sa_client.get("/api/tenant-admin/settings")
    assert r.status_code == 200
    data = r.json()
    assert "general" in data
    assert "security" in data
    assert "features" in data


# ─── Demo Requests ───────────────────────────────────────────────────────

def test_list_demo_requests(sa_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = []
    mock_db.table.return_value.select.return_value.order.return_value.execute.return_value = mock_result

    r = sa_client.get("/api/tenant-admin/demo-requests")
    assert r.status_code == 200


# ─── Registrations ───────────────────────────────────────────────────────

def test_list_registrations(sa_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = []
    mock_db.table.return_value.select.return_value.order.return_value.execute.return_value = mock_result

    r = sa_client.get("/api/tenant-admin/registrations")
    assert r.status_code == 200


# ─── Invoices ────────────────────────────────────────────────────────────

def test_list_invoices(sa_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = []
    mock_db.table.return_value.select.return_value.order.return_value.execute.return_value = mock_result

    r = sa_client.get("/api/tenant-admin/invoices")
    assert r.status_code == 200


# ─── Trainings ───────────────────────────────────────────────────────────

def test_list_trainings(sa_client, mock_db):
    mock_result = MagicMock()
    mock_result.data = []
    mock_db.table.return_value.select.return_value.order.return_value.execute.return_value = mock_result

    r = sa_client.get("/api/tenant-admin/trainings")
    assert r.status_code == 200
