"""Tests for the contacts router."""
from unittest.mock import MagicMock

VALID_UUID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


# --- LIST ---

def test_list_contacts_success(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "email": "john@example.com"}]
    )
    response = client.get("/api/contacts/")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_list_contacts_empty_when_no_org(client_no_org, mock_db):
    response = client_no_org.get("/api/contacts/")
    assert response.status_code == 200
    assert response.json() == []


def test_list_contacts_with_search(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.or_.return_value.order.return_value.range.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.get("/api/contacts/?search=john")
    assert response.status_code == 200


# --- CREATE ---

def test_create_contact_success(client, mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "email": "new@example.com", "first_name": "Jane"}]
    )
    response = client.post(
        "/api/contacts/",
        json={"email": "new@example.com", "first_name": "Jane"},
    )
    assert response.status_code == 201
    assert response.json()["email"] == "new@example.com"


def test_create_contact_invalid_email(client):
    response = client.post(
        "/api/contacts/",
        json={"email": "not-an-email"},
    )
    assert response.status_code == 422


def test_create_contact_no_org_returns_403(client_no_org, mock_db):
    response = client_no_org.post(
        "/api/contacts/",
        json={"email": "test@test.com"},
    )
    assert response.status_code == 403


# --- GET by ID ---

def test_get_contact_success(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"id": VALID_UUID, "email": "john@example.com"}
    )
    response = client.get(f"/api/contacts/{VALID_UUID}")
    assert response.status_code == 200


def test_get_contact_invalid_uuid(client):
    response = client.get("/api/contacts/not-valid")
    assert response.status_code == 422


# --- PATCH ---

def test_update_contact_success(client, mock_db):
    mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": VALID_UUID, "first_name": "Updated"}]
    )
    response = client.patch(
        f"/api/contacts/{VALID_UUID}",
        json={"first_name": "Updated"},
    )
    assert response.status_code == 200


def test_update_contact_not_found(client, mock_db):
    mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.patch(
        f"/api/contacts/{VALID_UUID}",
        json={"first_name": "Ghost"},
    )
    assert response.status_code == 404


# --- DELETE ---

def test_delete_contact_success(client, mock_db):
    mock_db.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()
    response = client.delete(f"/api/contacts/{VALID_UUID}")
    assert response.status_code == 204


def test_delete_contact_invalid_uuid(client):
    response = client.delete("/api/contacts/bad-uuid")
    assert response.status_code == 422


# --- STATS ---

def test_contact_stats_success(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "1", "email": "a@b.com", "email_consent": True},
            {"id": "2", "email": None, "email_consent": False},
            {"id": "3", "email": "c@d.com", "email_consent": True},
        ]
    )
    response = client.get("/api/contacts/stats/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert data["with_email"] == 2
    assert data["with_consent"] == 2


def test_contact_stats_no_org(client_no_org, mock_db):
    response = client_no_org.get("/api/contacts/stats/overview")
    assert response.status_code == 200
    assert response.json()["total"] == 0
