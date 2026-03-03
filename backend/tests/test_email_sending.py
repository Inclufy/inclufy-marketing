"""Tests for the email sending router."""
import os
from unittest.mock import MagicMock, patch, AsyncMock
from tests.conftest import FAKE_USER

VALID_CAMPAIGN_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"


# --- GET /api/email/provider ---

def test_provider_no_keys(client, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", None)
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", None)
    response = client.get("/api/email/provider")
    assert response.status_code == 200
    data = response.json()
    assert data["configured"] is False
    assert data["provider"] is None


def test_provider_sendgrid(client, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key-123")
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", None)
    response = client.get("/api/email/provider")
    assert response.status_code == 200
    data = response.json()
    assert data["configured"] is True
    assert data["provider"] == "sendgrid"


def test_provider_resend(client, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", None)
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", "re-key-456")
    response = client.get("/api/email/provider")
    assert response.status_code == 200
    data = response.json()
    assert data["configured"] is True
    assert data["provider"] == "resend"


def test_provider_sendgrid_takes_priority(client, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key")
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", "re-key")
    response = client.get("/api/email/provider")
    data = response.json()
    assert data["provider"] == "sendgrid"


# --- POST /api/email/send ---

def test_send_no_provider_configured(client, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", None)
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", None)
    response = client.post("/api/email/send", json={
        "to": ["user@example.com"],
        "subject": "Test",
        "html_body": "<p>Hello</p>",
    })
    assert response.status_code == 503
    assert "No email provider" in response.json()["detail"]


def test_send_validation_empty_to(client, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key")
    response = client.post("/api/email/send", json={
        "to": [],
        "subject": "Test",
        "html_body": "<p>Hello</p>",
    })
    assert response.status_code == 422


def test_send_validation_invalid_email(client, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key")
    response = client.post("/api/email/send", json={
        "to": ["not-an-email"],
        "subject": "Test",
        "html_body": "<p>Hello</p>",
    })
    assert response.status_code == 422


def test_send_validation_empty_subject(client, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key")
    response = client.post("/api/email/send", json={
        "to": ["user@example.com"],
        "subject": "   ",
        "html_body": "<p>Hello</p>",
    })
    assert response.status_code == 422


@patch("routers.email_sending._send_via_sendgrid", new_callable=AsyncMock)
def test_send_via_sendgrid_success(mock_send, client, mock_db, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key")
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", None)
    mock_send.return_value = {"provider": "sendgrid", "status_code": 202}

    # Mock event logging
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock()

    response = client.post("/api/email/send", json={
        "to": ["user@example.com"],
        "subject": "Test Email",
        "html_body": "<p>Hello World</p>",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["recipients"] == 1
    assert data["provider"] == "sendgrid"
    mock_send.assert_called_once()


@patch("routers.email_sending._send_via_resend", new_callable=AsyncMock)
def test_send_via_resend_success(mock_send, client, mock_db, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", None)
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", "re-key")
    mock_send.return_value = {"provider": "resend", "id": "msg-123"}

    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock()

    response = client.post("/api/email/send", json={
        "to": ["a@test.com", "b@test.com"],
        "subject": "Multi Send",
        "html_body": "<p>Hi</p>",
        "reply_to": "reply@test.com",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["recipients"] == 2
    assert data["provider"] == "resend"


@patch("routers.email_sending._send_via_sendgrid", new_callable=AsyncMock)
def test_send_failure_returns_500(mock_send, client, mock_db, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key")
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", None)
    mock_send.side_effect = Exception("SendGrid error 403: Forbidden")

    response = client.post("/api/email/send", json={
        "to": ["user@example.com"],
        "subject": "Test",
        "html_body": "<p>Hello</p>",
    })
    assert response.status_code == 500
    assert "Failed to send email" in response.json()["detail"]


# --- POST /api/email/send-campaign ---

def test_send_campaign_no_provider(client, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", None)
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", None)
    response = client.post("/api/email/send-campaign", json={
        "campaign_id": VALID_CAMPAIGN_ID,
        "subject": "Campaign",
        "html_body": "<p>Body</p>",
    })
    assert response.status_code == 503


def test_send_campaign_no_org(client_no_org, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key")
    response = client_no_org.post("/api/email/send-campaign", json={
        "campaign_id": VALID_CAMPAIGN_ID,
        "subject": "Campaign",
        "html_body": "<p>Body</p>",
    })
    assert response.status_code == 403
    assert "No organization" in response.json()["detail"]


@patch("routers.email_sending._send_via_sendgrid", new_callable=AsyncMock)
def test_send_campaign_no_contacts(mock_send, client, mock_db, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key")
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", None)

    # No contacts found
    mock_db.table.return_value.select.return_value.eq.return_value.not_.is_.return_value.execute.return_value = MagicMock(data=[])

    response = client.post("/api/email/send-campaign", json={
        "campaign_id": VALID_CAMPAIGN_ID,
        "subject": "Campaign",
        "html_body": "<p>Body</p>",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["sent"] == 0
    assert "No contacts" in data.get("message", "")


@patch("routers.email_sending._send_via_sendgrid", new_callable=AsyncMock)
def test_send_campaign_success(mock_send, client, mock_db, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key")
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", None)
    mock_send.return_value = {"provider": "sendgrid", "status_code": 202}

    # Contacts query - using the Supabase chaining pattern
    contacts_result = MagicMock(data=[
        {"email": "a@test.com"},
        {"email": "b@test.com"},
        {"email": "c@test.com"},
    ])
    mock_db.table.return_value.select.return_value.eq.return_value.not_.is_.return_value.execute.return_value = contacts_result

    # Event insert + campaign update
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock()
    mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()

    response = client.post("/api/email/send-campaign", json={
        "campaign_id": VALID_CAMPAIGN_ID,
        "subject": "Big Campaign",
        "html_body": "<h1>Welcome!</h1>",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["sent"] == 3
    assert data["failed"] == 0
    assert data["total_contacts"] == 3


@patch("routers.email_sending._send_via_sendgrid", new_callable=AsyncMock)
def test_send_campaign_partial_failure(mock_send, client, mock_db, monkeypatch):
    monkeypatch.setattr("routers.email_sending.SENDGRID_API_KEY", "sg-key")
    monkeypatch.setattr("routers.email_sending.RESEND_API_KEY", None)
    mock_send.side_effect = Exception("Rate limited")

    contacts_result = MagicMock(data=[
        {"email": "a@test.com"},
        {"email": "b@test.com"},
    ])
    mock_db.table.return_value.select.return_value.eq.return_value.not_.is_.return_value.execute.return_value = contacts_result
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock()
    mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock()

    response = client.post("/api/email/send-campaign", json={
        "campaign_id": VALID_CAMPAIGN_ID,
        "subject": "Fail Campaign",
        "html_body": "<p>Body</p>",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["failed"] == 2
    assert len(data["errors"]) > 0
