"""Shared test fixtures for backend API tests."""
import sys
import os
import pytest
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient

# Add the backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock the config.supabase module before importing anything that uses it
mock_supabase_client = MagicMock()
mock_supabase_module = MagicMock()
mock_supabase_module.get_db = MagicMock(return_value=mock_supabase_client)
sys.modules["config"] = MagicMock()
sys.modules["config.supabase"] = mock_supabase_module

# Set required env vars
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")

from main import app
from dependencies import get_current_user, get_supabase_client


# --- Fixtures ---

FAKE_USER = {
    "id": "11111111-1111-1111-1111-111111111111",
    "email": "test@inclufy.com",
    "organization_id": "22222222-2222-2222-2222-222222222222",
}

FAKE_USER_NO_ORG = {
    "id": "33333333-3333-3333-3333-333333333333",
    "email": "noorg@inclufy.com",
    "organization_id": None,
}


@pytest.fixture
def mock_db():
    """Return a fresh mock Supabase client."""
    db = MagicMock()
    return db


@pytest.fixture
def client(mock_db):
    """TestClient with dependency overrides for auth and DB."""
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def client_no_org(mock_db):
    """TestClient with a user that has no organization."""
    app.dependency_overrides[get_current_user] = lambda: FAKE_USER_NO_ORG
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def client_unauthed(mock_db):
    """TestClient without auth override (tests 401 handling)."""
    app.dependency_overrides[get_supabase_client] = lambda: mock_db
    # Don't override get_current_user – it will require a real token
    yield TestClient(app)
    app.dependency_overrides.clear()
