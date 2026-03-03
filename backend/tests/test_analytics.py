"""Tests for the analytics router."""
from unittest.mock import MagicMock
from tests.conftest import FAKE_USER

VALID_UUID = "dddddddd-dddd-dddd-dddd-dddddddddddd"


# --- DASHBOARD ---

def test_dashboard_returns_stats(client, mock_db):
    # campaigns query
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "1", "status": "active"},
            {"id": "2", "status": "draft"},
            {"id": "3", "status": "active"},
        ]
    )
    response = client.get("/api/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "campaigns" in data
    assert "contacts" in data


def test_dashboard_empty_when_no_org(client_no_org, mock_db):
    response = client_no_org.get("/api/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["campaigns"]["total"] == 0
    assert data["contacts"]["total"] == 0


# --- CAMPAIGN ANALYTICS ---

def test_campaign_analytics_success(client, mock_db):
    # Campaign lookup
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"id": VALID_UUID, "name": "Test", "status": "active", "type": "email"}
    )
    # Events lookup
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[
            {"event_type": "sent"},
            {"event_type": "sent"},
            {"event_type": "opened"},
            {"event_type": "clicked"},
        ]
    )
    response = client.get(f"/api/analytics/campaigns/{VALID_UUID}")
    assert response.status_code == 200
    data = response.json()
    assert "campaign" in data
    assert "metrics" in data
    assert "sent" in data["metrics"]
    assert "open_rate" in data["metrics"]


def test_campaign_analytics_bad_id_returns_500(client, mock_db):
    # analytics router uses plain str for campaign_id, no UUID validation
    # so an invalid ID causes a DB error (500), not a validation error (422)
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.side_effect = Exception("invalid input syntax")
    response = client.get("/api/analytics/campaigns/bad-uuid")
    assert response.status_code == 500


# --- EVENTS ---

def test_list_events_success(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[{"id": "1", "event_type": "sent", "timestamp": "2024-01-01"}]
    )
    response = client.get("/api/analytics/events")
    assert response.status_code == 200
    assert len(response.json()) >= 0


def test_list_events_with_type_filter(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.get("/api/analytics/events?event_type=opened")
    assert response.status_code == 200


def test_list_events_empty_when_no_org(client_no_org, mock_db):
    response = client_no_org.get("/api/analytics/events")
    assert response.status_code == 200
    assert response.json() == []


# --- OVERVIEW ---

def test_overview_returns_all_sections(client, mock_db):
    # All table queries return data
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "1", "status": "active", "type": "email", "budget_amount": 500, "created_at": "2026-03-01T10:00:00Z", "name": "Test"},
        ]
    )
    mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[
            {"event_type": "email_sent", "timestamp": "2026-03-01T10:00:00Z", "campaign_id": "1"},
            {"event_type": "email_opened", "timestamp": "2026-03-01T11:00:00Z", "campaign_id": "1"},
        ]
    )
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "campaigns" in data
    assert "contacts" in data
    assert "emails" in data
    assert "content" in data
    assert "events" in data
    assert "timeline" in data["campaigns"]
    assert "by_status" in data["campaigns"]
    assert "by_type" in data["campaigns"]


def test_overview_empty_when_no_org(client_no_org, mock_db):
    response = client_no_org.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["campaigns"]["total"] == 0
    assert data["contacts"]["total"] == 0
    assert data["emails"]["sent"] == 0
    assert data["content"]["total"] == 0
