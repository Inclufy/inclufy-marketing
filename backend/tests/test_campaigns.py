"""Tests for the campaigns router."""
from unittest.mock import MagicMock
from tests.conftest import FAKE_USER

VALID_UUID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


# --- LIST ---

def test_list_campaigns_success(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "name": "Test Campaign"}]
    )
    response = client.get("/api/campaigns/")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_list_campaigns_empty_when_no_org(client_no_org, mock_db):
    response = client_no_org.get("/api/campaigns/")
    assert response.status_code == 200
    assert response.json() == []


def test_list_campaigns_with_status_filter(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.get("/api/campaigns/?status=active")
    assert response.status_code == 200


# --- CREATE ---

def test_create_campaign_success(client, mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "name": "New Campaign", "type": "email", "status": "draft"}]
    )
    response = client.post(
        "/api/campaigns/",
        json={"name": "New Campaign", "type": "email"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "New Campaign"


def test_create_campaign_empty_name_rejected(client):
    response = client.post(
        "/api/campaigns/",
        json={"name": "   ", "type": "email"},
    )
    assert response.status_code == 422


def test_create_campaign_invalid_type_rejected(client):
    response = client.post(
        "/api/campaigns/",
        json={"name": "Campaign", "type": "invalid"},
    )
    assert response.status_code == 422


def test_create_campaign_missing_fields(client):
    response = client.post("/api/campaigns/", json={})
    assert response.status_code == 422


def test_create_campaign_no_org_returns_403(client_no_org, mock_db):
    response = client_no_org.post(
        "/api/campaigns/",
        json={"name": "Test", "type": "email"},
    )
    assert response.status_code == 403


# --- GET by ID ---

def test_get_campaign_success(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"id": VALID_UUID, "name": "Campaign"}
    )
    response = client.get(f"/api/campaigns/{VALID_UUID}")
    assert response.status_code == 200
    assert response.json()["id"] == VALID_UUID


def test_get_campaign_invalid_uuid(client):
    response = client.get("/api/campaigns/not-a-uuid")
    assert response.status_code == 422


# --- PATCH ---

def test_update_campaign_success(client, mock_db):
    mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "name": "Updated"}]
    )
    response = client.patch(
        f"/api/campaigns/{VALID_UUID}",
        json={"name": "Updated"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated"


def test_update_campaign_not_found(client, mock_db):
    mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.patch(
        f"/api/campaigns/{VALID_UUID}",
        json={"name": "Updated"},
    )
    assert response.status_code == 404


def test_update_campaign_invalid_uuid(client):
    response = client.patch(
        "/api/campaigns/bad-id",
        json={"name": "Updated"},
    )
    assert response.status_code == 422


# --- DELETE ---

def test_delete_campaign_success(client, mock_db):
    mock_db.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()
    response = client.delete(f"/api/campaigns/{VALID_UUID}")
    assert response.status_code == 204


def test_delete_campaign_invalid_uuid(client):
    response = client.delete("/api/campaigns/bad-uuid")
    assert response.status_code == 422
