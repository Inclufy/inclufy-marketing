"""Tests for AI Co-pilot router."""
from unittest.mock import MagicMock, patch
import pytest


def test_copilot_health(client):
    r = client.get("/api/copilot/health")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert "openai_configured" in data


def test_copilot_chat_missing_api_key(client):
    """Chat should fail gracefully when OpenAI key is missing."""
    with patch("routers.copilot.OPENAI_API_KEY", ""):
        r = client.post("/api/copilot/chat", json={
            "messages": [{"role": "user", "content": "Hallo"}],
        })
        assert r.status_code == 503
        assert "niet geconfigureerd" in r.json()["detail"]


def test_copilot_chat_success(client):
    """Chat should return response when OpenAI works."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Hallo! Hoe kan ik helpen?"
    mock_response.usage = MagicMock()
    mock_response.usage.total_tokens = 42

    with patch("routers.copilot.OPENAI_API_KEY", "test-key"):
        with patch("openai.OpenAI") as mock_openai:
            mock_openai.return_value.chat.completions.create.return_value = mock_response

            r = client.post("/api/copilot/chat", json={
                "messages": [{"role": "user", "content": "Hallo"}],
                "model": "gpt-4o-mini",
            })
            assert r.status_code == 200
            data = r.json()
            assert data["response"] == "Hallo! Hoe kan ik helpen?"
            assert data["tokens_used"] == 42


def test_copilot_chat_with_system_prompt(client):
    """Chat should accept a custom system prompt."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "Custom response"
    mock_response.usage = MagicMock()
    mock_response.usage.total_tokens = 10

    with patch("routers.copilot.OPENAI_API_KEY", "test-key"):
        with patch("openai.OpenAI") as mock_openai:
            mock_openai.return_value.chat.completions.create.return_value = mock_response

            r = client.post("/api/copilot/chat", json={
                "messages": [{"role": "user", "content": "Test"}],
                "system_prompt": "Je bent een SEO expert",
            })
            assert r.status_code == 200


def test_copilot_chat_api_error(client):
    """Chat should handle OpenAI errors gracefully."""
    with patch("routers.copilot.OPENAI_API_KEY", "test-key"):
        with patch("openai.OpenAI") as mock_openai:
            mock_openai.return_value.chat.completions.create.side_effect = Exception("Rate limit exceeded")

            r = client.post("/api/copilot/chat", json={
                "messages": [{"role": "user", "content": "Test"}],
            })
            assert r.status_code == 500
            assert "AI fout" in r.json()["detail"]


def test_copilot_chat_auth_error(client):
    """Chat should return 503 on auth-related errors."""
    with patch("routers.copilot.OPENAI_API_KEY", "test-key"):
        with patch("openai.OpenAI") as mock_openai:
            mock_openai.return_value.chat.completions.create.side_effect = Exception("Invalid api_key provided")

            r = client.post("/api/copilot/chat", json={
                "messages": [{"role": "user", "content": "Test"}],
            })
            assert r.status_code == 503
            assert "ongeldig" in r.json()["detail"]
