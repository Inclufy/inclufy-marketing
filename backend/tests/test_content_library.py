"""Tests for the content library router."""
from unittest.mock import MagicMock
from tests.conftest import FAKE_USER


# --- GET /api/content-library/ ---

def test_list_items_success(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "1", "title": "Email Draft", "content_type": "email"},
            {"id": "2", "title": "Social Post", "content_type": "social"},
        ]
    )
    response = client.get("/api/content-library/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_list_items_empty_when_no_org(client_no_org, mock_db):
    response = client_no_org.get("/api/content-library/")
    assert response.status_code == 200
    assert response.json() == []


def test_list_items_with_type_filter(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=[{"id": "1", "title": "Post", "content_type": "social"}]
    )
    response = client.get("/api/content-library/?content_type=social")
    assert response.status_code == 200


def test_list_items_with_search(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.ilike.return_value.order.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.get("/api/content-library/?search=hello")
    assert response.status_code == 200


# --- POST /api/content-library/ ---

def test_create_item_success(client, mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "new-1", "title": "My Email", "content_type": "email"}]
    )
    response = client.post("/api/content-library/", json={
        "title": "My Email",
        "content_type": "email",
        "content": {"subject": "Hello", "body": "<p>Test</p>"},
        "tags": ["campaign", "welcome"],
    })
    assert response.status_code == 200
    assert response.json()["title"] == "My Email"


def test_create_item_empty_title(client, mock_db):
    response = client.post("/api/content-library/", json={
        "title": "  ",
        "content_type": "email",
    })
    assert response.status_code == 422


def test_create_item_invalid_type(client, mock_db):
    response = client.post("/api/content-library/", json={
        "title": "Test",
        "content_type": "invalid_type",
    })
    assert response.status_code == 422


def test_create_item_no_org(client_no_org, mock_db):
    response = client_no_org.post("/api/content-library/", json={
        "title": "Test",
        "content_type": "email",
    })
    assert response.status_code == 403


# --- GET /api/content-library/stats ---

def test_stats_success(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[
            {"content_type": "email"},
            {"content_type": "email"},
            {"content_type": "social"},
        ]
    )
    response = client.get("/api/content-library/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert data["by_type"]["email"] == 2
    assert data["by_type"]["social"] == 1


def test_stats_no_org(client_no_org, mock_db):
    response = client_no_org.get("/api/content-library/stats")
    assert response.status_code == 200
    assert response.json()["total"] == 0


# --- DELETE /api/content-library/{id} ---

def test_delete_item_success(client, mock_db):
    mock_db.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()
    response = client.delete("/api/content-library/some-uuid")
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_delete_item_no_org(client_no_org, mock_db):
    response = client_no_org.delete("/api/content-library/some-uuid")
    assert response.status_code == 403
