"""Tests for the growth blueprint router."""
from unittest.mock import MagicMock, patch
from tests.conftest import FAKE_USER

VALID_UUID = "cccccccc-cccc-cccc-cccc-cccccccccccc"


# --- STATS ---

def test_stats_returns_defaults(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    response = client.get("/api/growth-blueprint/stats")
    assert response.status_code == 200
    data = response.json()
    assert "scans_this_month" in data
    assert "avg_score" in data
    assert "setups_completed" in data
    assert "opportunities" in data


def test_stats_counts_blueprints(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "1", "overall_score": 80, "setup_completed": True},
            {"id": "2", "overall_score": 60, "setup_completed": False},
        ]
    )
    response = client.get("/api/growth-blueprint/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["scans_this_month"] == 2


# --- LIST ---

def test_list_blueprints_success(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "company_name": "Test Co"}]
    )
    response = client.get("/api/growth-blueprint/")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_list_blueprints_empty(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.get("/api/growth-blueprint/")
    assert response.status_code == 200
    assert response.json() == []


# --- CREATE ---

def test_create_blueprint_success(client, mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "company_name": "Acme", "status": "scanning"}]
    )
    response = client.post(
        "/api/growth-blueprint/",
        json={"company_name": "Acme", "website_url": "https://acme.com"},
    )
    assert response.status_code == 201
    assert response.json()["company_name"] == "Acme"


def test_create_blueprint_empty_name_rejected(client):
    response = client.post(
        "/api/growth-blueprint/",
        json={"company_name": "   "},
    )
    assert response.status_code == 422


def test_create_blueprint_missing_name(client):
    response = client.post(
        "/api/growth-blueprint/",
        json={},
    )
    assert response.status_code == 422


# --- GET by ID ---

def test_get_blueprint_success(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"id": VALID_UUID, "company_name": "Test"}
    )
    # Mock related tables (status_quo, vision, recommendations, etc.)
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.get(f"/api/growth-blueprint/{VALID_UUID}")
    assert response.status_code == 200


def test_get_blueprint_invalid_uuid(client):
    response = client.get("/api/growth-blueprint/not-a-uuid")
    assert response.status_code == 422


# --- PATCH ---

def test_update_blueprint_success(client, mock_db):
    mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID}]
    )
    response = client.patch(
        f"/api/growth-blueprint/{VALID_UUID}?setup_completed=true"
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_update_blueprint_invalid_uuid(client):
    response = client.patch("/api/growth-blueprint/bad-id")
    assert response.status_code == 422
