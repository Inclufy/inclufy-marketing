"""Tests for the content generation router."""
from unittest.mock import MagicMock, patch, AsyncMock
from tests.conftest import FAKE_USER


# --- EMAIL GENERATION ---

def test_generate_email_missing_fields(client):
    response = client.post("/api/content/email", json={})
    assert response.status_code == 422


def test_generate_email_invalid_type(client):
    response = client.post(
        "/api/content/email",
        json={"type": "invalid", "product": "SaaS", "audience": "devs", "goal": "onboard"},
    )
    assert response.status_code == 422


def test_generate_email_valid_types(client, mock_db):
    """Test that all valid email types are accepted (even if OpenAI key is missing)."""
    for email_type in ["welcome", "promotional", "newsletter", "follow-up", "re-engagement"]:
        response = client.post(
            "/api/content/email",
            json={"type": email_type, "product": "App", "audience": "users", "goal": "convert"},
        )
        # Either 200 (if key exists) or 500 (if no API key) — but NOT 422
        assert response.status_code != 422, f"Type '{email_type}' should be valid"


# --- SOCIAL GENERATION ---

def test_generate_social_missing_fields(client):
    response = client.post("/api/content/social", json={})
    assert response.status_code == 422


def test_generate_social_invalid_platform(client):
    response = client.post(
        "/api/content/social",
        json={"topic": "AI", "platform": "tiktok"},
    )
    assert response.status_code == 422


def test_generate_social_valid_platforms(client, mock_db):
    """Test that all valid platforms are accepted."""
    for platform in ["twitter", "linkedin", "instagram", "facebook"]:
        response = client.post(
            "/api/content/social",
            json={"topic": "AI trends", "platform": platform},
        )
        assert response.status_code != 422, f"Platform '{platform}' should be valid"


# --- IMPROVE CONTENT ---

def test_improve_content_missing_fields(client):
    response = client.post("/api/content/improve", json={})
    assert response.status_code == 422


def test_improve_content_empty_content(client):
    response = client.post(
        "/api/content/improve",
        json={"content": "   ", "goal": "clarity"},
    )
    assert response.status_code == 422


def test_improve_content_invalid_goal(client):
    response = client.post(
        "/api/content/improve",
        json={"content": "Some text here", "goal": "invalid-goal"},
    )
    assert response.status_code == 422


def test_improve_content_valid_goals(client, mock_db):
    """Test that all valid goals are accepted."""
    for goal in ["clarity", "engagement", "conversion", "seo"]:
        response = client.post(
            "/api/content/improve",
            json={"content": "Test content to improve", "goal": goal},
        )
        assert response.status_code != 422, f"Goal '{goal}' should be valid"
