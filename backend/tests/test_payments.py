"""Tests for the payments router."""
from unittest.mock import MagicMock, patch
from tests.conftest import FAKE_USER


# --- GET /api/payments/plans ---

def test_list_plans_returns_all_plans(client):
    response = client.get("/api/payments/plans")
    assert response.status_code == 200
    data = response.json()
    assert "plans" in data
    assert len(data["plans"]) == 3
    plan_ids = [p["id"] for p in data["plans"]]
    assert "starter" in plan_ids
    assert "professional" in plan_ids
    assert "enterprise" in plan_ids


def test_list_plans_has_required_fields(client):
    response = client.get("/api/payments/plans")
    plans = response.json()["plans"]
    for plan in plans:
        assert "name" in plan
        assert "price_monthly" in plan
        assert "price_yearly" in plan
        assert "features" in plan
        assert isinstance(plan["features"], list)
        assert len(plan["features"]) > 0


# --- GET /api/payments/status ---

def test_subscription_status_no_org(client_no_org):
    response = client_no_org.get("/api/payments/status")
    assert response.status_code == 200
    data = response.json()
    assert data["subscribed"] is False
    assert data["status"] == "no_organization"


def test_subscription_status_no_stripe_customer(client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"stripe_customer_id": None}
    )
    response = client.get("/api/payments/status")
    assert response.status_code == 200
    data = response.json()
    assert data["subscribed"] is False
    assert data["status"] == "free"


def test_subscription_status_stripe_not_configured(client, mock_db, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", None)
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"stripe_customer_id": "cus_12345"}
    )
    response = client.get("/api/payments/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "stripe_not_configured"


@patch("routers.payments._get_stripe")
def test_subscription_status_active(mock_get_stripe, client, mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"stripe_customer_id": "cus_12345"}
    )

    mock_stripe = MagicMock()
    mock_sub = MagicMock()
    mock_sub.metadata = {"plan": "professional"}
    mock_sub.status = "active"
    mock_sub.current_period_end = 1700000000
    mock_sub.cancel_at_period_end = False
    mock_stripe.Subscription.list.return_value = MagicMock(data=[mock_sub])
    mock_get_stripe.return_value = mock_stripe

    response = client.get("/api/payments/status")
    assert response.status_code == 200
    data = response.json()
    assert data["subscribed"] is True
    assert data["plan"] == "professional"
    assert data["status"] == "active"


# --- POST /api/payments/create-checkout ---

def test_create_checkout_no_stripe(client, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", None)
    response = client.post("/api/payments/create-checkout", json={
        "plan": "starter",
        "billing_cycle": "monthly",
    })
    assert response.status_code == 503
    assert "Stripe is not configured" in response.json()["detail"]


def test_create_checkout_unknown_plan(client, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", "sk_test_123")
    response = client.post("/api/payments/create-checkout", json={
        "plan": "nonexistent",
        "billing_cycle": "monthly",
    })
    assert response.status_code == 400
    assert "Unknown plan" in response.json()["detail"]


def test_create_checkout_no_stripe_price_id(client, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", "sk_test_123")
    # Ensure the plan's stripe_price is None (default when env var not set)
    response = client.post("/api/payments/create-checkout", json={
        "plan": "starter",
        "billing_cycle": "monthly",
    })
    assert response.status_code == 400
    assert "Stripe price not configured" in response.json()["detail"]


@patch("routers.payments._get_stripe")
def test_create_checkout_success(mock_get_stripe, client, mock_db, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", "sk_test_123")
    monkeypatch.setattr("routers.payments.PLANS", {
        "starter": {
            "name": "Starter",
            "price_monthly": 29,
            "price_yearly": 290,
            "features": ["Feature 1"],
            "stripe_price_monthly": "price_starter_monthly",
            "stripe_price_yearly": "price_starter_yearly",
        },
        "professional": {
            "name": "Professional",
            "price_monthly": 79,
            "price_yearly": 790,
            "features": ["Feature 1"],
            "stripe_price_monthly": "price_pro_monthly",
            "stripe_price_yearly": "price_pro_yearly",
        },
        "enterprise": {
            "name": "Enterprise",
            "price_monthly": 199,
            "price_yearly": 1990,
            "features": ["Feature 1"],
            "stripe_price_monthly": "price_ent_monthly",
            "stripe_price_yearly": "price_ent_yearly",
        },
    })

    # No existing stripe customer
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"stripe_customer_id": None}
    )

    mock_stripe = MagicMock()
    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/session/test123"
    mock_session.id = "cs_test_123"
    mock_stripe.checkout.Session.create.return_value = mock_session
    mock_get_stripe.return_value = mock_stripe

    response = client.post("/api/payments/create-checkout", json={
        "plan": "starter",
        "billing_cycle": "monthly",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["checkout_url"] == "https://checkout.stripe.com/session/test123"
    assert data["session_id"] == "cs_test_123"


# --- POST /api/payments/customer-portal ---

def test_customer_portal_no_stripe(client, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", None)
    response = client.post("/api/payments/customer-portal", json={})
    assert response.status_code == 503


def test_customer_portal_no_org(client_no_org, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", "sk_test_123")
    response = client_no_org.post("/api/payments/customer-portal", json={})
    assert response.status_code == 403


def test_customer_portal_no_subscription(client, mock_db, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", "sk_test_123")
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"stripe_customer_id": None}
    )
    response = client.post("/api/payments/customer-portal", json={})
    assert response.status_code == 400
    assert "No active subscription" in response.json()["detail"]


@patch("routers.payments._get_stripe")
def test_customer_portal_success(mock_get_stripe, client, mock_db, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", "sk_test_123")
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"stripe_customer_id": "cus_12345"}
    )

    mock_stripe = MagicMock()
    mock_portal = MagicMock()
    mock_portal.url = "https://billing.stripe.com/portal/test123"
    mock_stripe.billing_portal.Session.create.return_value = mock_portal
    mock_get_stripe.return_value = mock_stripe

    response = client.post("/api/payments/customer-portal", json={})
    assert response.status_code == 200
    data = response.json()
    assert data["portal_url"] == "https://billing.stripe.com/portal/test123"


# --- POST /api/payments/webhook ---

def test_webhook_no_stripe(client, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", None)
    response = client.post("/api/payments/webhook", content=b"test")
    assert response.status_code == 503


def test_webhook_no_signature(client, monkeypatch):
    monkeypatch.setattr("routers.payments.STRIPE_SECRET_KEY", "sk_test_123")
    response = client.post(
        "/api/payments/webhook",
        content=b"test",
    )
    assert response.status_code == 400
    assert "Missing stripe-signature" in response.json()["detail"]
