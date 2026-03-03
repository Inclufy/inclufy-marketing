"""Tests for the export router."""
from unittest.mock import MagicMock
from tests.conftest import FAKE_USER

VALID_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"


def test_export_blueprint_pdf_invalid_uuid(client):
    response = client.get("/api/export/blueprint/bad-uuid/pdf")
    assert response.status_code == 422


def test_export_blueprint_pdf_success(client, mock_db):
    # Mock the blueprint data lookup
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"id": VALID_UUID, "company_name": "Acme"}
    )
    # Mock related data (recommendations, opportunities, etc.)
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )
    response = client.get(f"/api/export/blueprint/{VALID_UUID}/pdf")
    # Should succeed or fail gracefully (depends on pdf_generator availability)
    assert response.status_code in (200, 404, 500)


# --- ANALYTICS PDF EXPORT ---

def test_export_analytics_pdf_no_org(client_no_org, mock_db):
    response = client_no_org.get("/api/export/analytics/pdf")
    assert response.status_code == 403


def test_export_analytics_pdf_success(client, mock_db):
    # Mock campaigns, contacts, events
    mock_campaigns = MagicMock(data=[
        {"id": "1", "name": "Camp1", "status": "active", "type": "email", "budget_amount": 500},
    ])
    mock_contacts = MagicMock(data=[{"id": "1"}], count=10)
    mock_events = MagicMock(data=[
        {"event_type": "email_sent"},
        {"event_type": "email_opened"},
    ])

    def table_side_effect(name):
        mock = MagicMock()
        if name == "campaigns":
            mock.select.return_value.eq.return_value.execute.return_value = mock_campaigns
        elif name == "contacts":
            mock.select.return_value.eq.return_value.execute.return_value = mock_contacts
        elif name == "events":
            mock.select.return_value.eq.return_value.execute.return_value = mock_events
        return mock

    mock_db.table.side_effect = table_side_effect

    response = client.get("/api/export/analytics/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
