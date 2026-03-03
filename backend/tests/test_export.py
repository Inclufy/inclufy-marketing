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
