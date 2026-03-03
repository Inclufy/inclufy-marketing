"""Tests for the marketing setup router."""
from unittest.mock import MagicMock
from tests.conftest import FAKE_USER

VALID_UUID = "ffffffff-ffff-ffff-ffff-ffffffffffff"


# --- CREATE SETUP ---

def test_create_setup_success(client, mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID}]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID}]
    )
    response = client.post(
        "/api/marketing-setup/",
        json={
            "blueprint_id": VALID_UUID,
            "company_name": "Acme Inc",
            "industry": "Technology",
            "website_url": "https://acme.com",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "setup_id" in data


def test_create_setup_with_founders(client, mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID}]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID}]
    )
    response = client.post(
        "/api/marketing-setup/",
        json={
            "blueprint_id": VALID_UUID,
            "company_name": "Startup",
            "industry": "SaaS",
            "website_url": "https://startup.io",
            "founders": [
                {"name": "John Doe", "role": "CEO"},
                {"name": "Jane Doe", "role": "CTO", "bio": "Tech expert"},
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data_saved"]["founders"] == 2


def test_create_setup_with_goals(client, mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID}]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID}]
    )
    response = client.post(
        "/api/marketing-setup/",
        json={
            "blueprint_id": VALID_UUID,
            "company_name": "GoalCo",
            "industry": "Marketing",
            "website_url": "https://goalco.com",
            "goals": [
                {
                    "title": "Increase Revenue",
                    "current": 10000,
                    "target": 50000,
                    "timeline": "6 months",
                    "kpi": "MRR",
                },
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data_saved"]["goals"] == 1


def test_create_setup_missing_required_fields(client):
    response = client.post("/api/marketing-setup/", json={})
    assert response.status_code == 422


def test_create_setup_missing_company_name(client):
    response = client.post(
        "/api/marketing-setup/",
        json={"blueprint_id": VALID_UUID, "industry": "Tech", "website_url": "https://x.com"},
    )
    assert response.status_code == 422


def test_create_setup_without_org_still_works(client_no_org, mock_db):
    # marketing_setup router doesn't check org_id, scopes by user_id instead
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID}]
    )
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID}]
    )
    response = client_no_org.post(
        "/api/marketing-setup/",
        json={
            "blueprint_id": VALID_UUID,
            "company_name": "Test",
            "industry": "Tech",
            "website_url": "https://test.com",
        },
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


# --- GET BY BLUEPRINT ---

def test_get_setup_by_blueprint_exists(client, mock_db):
    # Router uses .single() which returns a single object, not array
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"id": VALID_UUID, "setup_completed": True}
    )
    response = client.get(f"/api/marketing-setup/by-blueprint/{VALID_UUID}")
    assert response.status_code == 200
    data = response.json()
    assert data["exists"] is True
    assert data["setup_id"] == VALID_UUID


def test_get_setup_by_blueprint_not_exists(client, mock_db):
    # When blueprint not found, .single() raises exception → caught → returns {"exists": False}
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.side_effect = Exception("not found")
    response = client.get(f"/api/marketing-setup/by-blueprint/{VALID_UUID}")
    assert response.status_code == 200
    data = response.json()
    assert data["exists"] is False
