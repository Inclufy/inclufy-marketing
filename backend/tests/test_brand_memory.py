"""Tests for the brand memory router."""
from unittest.mock import MagicMock
from tests.conftest import FAKE_USER

VALID_UUID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"


# --- LIST BRAND KITS ---

def test_list_brand_kits_success(client, mock_db):
    # Router does: db.table("brand_kits").select("*").order(...).execute()
    mock_db.table.return_value.select.return_value.order.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "name": "Primary Kit"}]
    )
    response = client.get("/api/brand-memory/kits")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_list_brand_kits_empty(client, mock_db):
    mock_db.table.return_value.select.return_value.order.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.get("/api/brand-memory/kits")
    assert response.status_code == 200
    assert response.json() == []


# --- CREATE BRAND KIT ---

def test_create_brand_kit_success(client, mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "name": "Brand Kit", "primary_color": "#7C3AED"}]
    )
    response = client.post(
        "/api/brand-memory/kits",
        json={"name": "Brand Kit", "primary_color": "#7C3AED"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Brand Kit"


def test_create_brand_kit_empty_name_rejected(client):
    response = client.post(
        "/api/brand-memory/kits",
        json={"name": "   "},
    )
    assert response.status_code == 422


def test_create_brand_kit_invalid_color_rejected(client):
    response = client.post(
        "/api/brand-memory/kits",
        json={"name": "Test Kit", "primary_color": "red"},
    )
    assert response.status_code == 422


def test_create_brand_kit_defaults(client, mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "name": "Kit", "primary_color": "#7C3AED", "secondary_color": "#10B981"}]
    )
    response = client.post(
        "/api/brand-memory/kits",
        json={"name": "Kit"},
    )
    assert response.status_code == 201


# --- UPDATE BRAND KIT ---

def test_update_brand_kit_success(client, mock_db):
    # Router does: db.table("brand_kits").update(updates).eq("id", kit_id).execute()
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "name": "Updated Kit"}]
    )
    response = client.patch(
        f"/api/brand-memory/kits/{VALID_UUID}",
        json={"name": "Updated Kit"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Kit"


def test_update_brand_kit_not_found(client, mock_db):
    mock_db.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.patch(
        f"/api/brand-memory/kits/{VALID_UUID}",
        json={"name": "Ghost"},
    )
    assert response.status_code == 404


def test_update_brand_kit_invalid_uuid(client):
    response = client.patch(
        "/api/brand-memory/kits/bad-uuid",
        json={"name": "Test"},
    )
    assert response.status_code == 422


# --- DELETE BRAND KIT ---

def test_delete_brand_kit_success(client, mock_db):
    mock_db.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()
    response = client.delete(f"/api/brand-memory/kits/{VALID_UUID}")
    assert response.status_code == 204


def test_delete_brand_kit_invalid_uuid(client):
    response = client.delete("/api/brand-memory/kits/bad-uuid")
    assert response.status_code == 422
