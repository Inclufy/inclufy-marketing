"""Stripe payment & subscription router."""
import os
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from supabase import Client

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["Payments"])

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Pricing plans – keep IDs in env vars so they can be changed per environment
PLANS = {
    "starter": {
        "name": "Starter",
        "price_monthly": 29,
        "price_yearly": 290,
        "features": [
            "Up to 1,000 contacts",
            "5 campaigns/month",
            "Basic AI content generation",
            "Email sending (SendGrid/Resend)",
            "Analytics dashboard",
        ],
        "stripe_price_monthly": os.getenv("STRIPE_PRICE_STARTER_MONTHLY"),
        "stripe_price_yearly": os.getenv("STRIPE_PRICE_STARTER_YEARLY"),
    },
    "professional": {
        "name": "Professional",
        "price_monthly": 79,
        "price_yearly": 790,
        "features": [
            "Up to 10,000 contacts",
            "Unlimited campaigns",
            "Advanced AI content + image generation",
            "Multi-channel campaigns",
            "Brand memory & compliance",
            "CSV import/export",
            "Priority support",
        ],
        "stripe_price_monthly": os.getenv("STRIPE_PRICE_PRO_MONTHLY"),
        "stripe_price_yearly": os.getenv("STRIPE_PRICE_PRO_YEARLY"),
    },
    "enterprise": {
        "name": "Enterprise",
        "price_monthly": 199,
        "price_yearly": 1990,
        "features": [
            "Unlimited contacts",
            "Unlimited campaigns",
            "Custom AI model training",
            "White-label options",
            "Dedicated account manager",
            "SSO & advanced security",
            "API access",
            "Custom integrations",
        ],
        "stripe_price_monthly": os.getenv("STRIPE_PRICE_ENTERPRISE_MONTHLY"),
        "stripe_price_yearly": os.getenv("STRIPE_PRICE_ENTERPRISE_YEARLY"),
    },
}


def _get_stripe():
    """Lazy import and configure stripe."""
    if not STRIPE_SECRET_KEY:
        return None
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
    return stripe


class CheckoutRequest(BaseModel):
    plan: str  # starter, professional, enterprise
    billing_cycle: str = "monthly"  # monthly or yearly


class CustomerPortalRequest(BaseModel):
    return_url: Optional[str] = None


# --- Public endpoints ---


@router.get("/plans")
def list_plans():
    """Return available pricing plans (no auth required for pricing page)."""
    plans = []
    for key, plan in PLANS.items():
        plans.append({
            "id": key,
            "name": plan["name"],
            "price_monthly": plan["price_monthly"],
            "price_yearly": plan["price_yearly"],
            "features": plan["features"],
        })
    return {"plans": plans}


# --- Authenticated endpoints ---


@router.get("/status")
def get_subscription_status(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Get current subscription status for the user's organization."""
    org_id = current_user.get("organization_id")
    if not org_id:
        return {"subscribed": False, "plan": None, "status": "no_organization"}

    try:
        result = db.table("organizations").select(
            "stripe_customer_id"
        ).eq("id", org_id).single().execute()
        org = result.data
    except Exception:
        return {"subscribed": False, "plan": None, "status": "error"}

    if not org or not org.get("stripe_customer_id"):
        return {"subscribed": False, "plan": None, "status": "free"}

    stripe = _get_stripe()
    if not stripe:
        return {"subscribed": False, "plan": None, "status": "stripe_not_configured"}

    try:
        subscriptions = stripe.Subscription.list(
            customer=org["stripe_customer_id"],
            status="active",
            limit=1,
        )
        if subscriptions.data:
            sub = subscriptions.data[0]
            return {
                "subscribed": True,
                "plan": sub.metadata.get("plan", "unknown"),
                "status": sub.status,
                "current_period_end": sub.current_period_end,
                "cancel_at_period_end": sub.cancel_at_period_end,
            }
    except Exception as e:
        logger.error("Failed to fetch subscription: %s", e)

    return {"subscribed": False, "plan": None, "status": "free"}


@router.post("/create-checkout")
def create_checkout_session(
    data: CheckoutRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Create a Stripe Checkout Session for subscription."""
    stripe = _get_stripe()
    if not stripe:
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured. Set STRIPE_SECRET_KEY.",
        )

    plan = PLANS.get(data.plan)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {data.plan}")

    price_key = f"stripe_price_{data.billing_cycle}"
    stripe_price_id = plan.get(price_key)
    if not stripe_price_id:
        raise HTTPException(
            status_code=400,
            detail=f"Stripe price not configured for {data.plan} ({data.billing_cycle})",
        )

    org_id = current_user.get("organization_id")
    user_email = current_user.get("email", "")

    # Get or create Stripe customer
    customer_id = None
    if org_id:
        try:
            result = db.table("organizations").select(
                "stripe_customer_id"
            ).eq("id", org_id).single().execute()
            customer_id = (result.data or {}).get("stripe_customer_id")
        except Exception:
            pass

    try:
        session_params = {
            "mode": "subscription",
            "line_items": [{"price": stripe_price_id, "quantity": 1}],
            "success_url": f"{FRONTEND_URL}/app?checkout=success",
            "cancel_url": f"{FRONTEND_URL}/pricing?checkout=cancelled",
            "metadata": {
                "plan": data.plan,
                "billing_cycle": data.billing_cycle,
                "organization_id": org_id or "",
                "user_id": current_user.get("id", ""),
            },
            "subscription_data": {
                "metadata": {
                    "plan": data.plan,
                    "organization_id": org_id or "",
                },
            },
        }

        if customer_id:
            session_params["customer"] = customer_id
        else:
            session_params["customer_email"] = user_email

        session = stripe.checkout.Session.create(**session_params)

        return {"checkout_url": session.url, "session_id": session.id}

    except Exception as e:
        logger.error("Checkout session creation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/customer-portal")
def create_customer_portal(
    data: CustomerPortalRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Create a Stripe Customer Portal session for managing subscription."""
    stripe = _get_stripe()
    if not stripe:
        raise HTTPException(status_code=503, detail="Stripe is not configured.")

    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization found")

    try:
        result = db.table("organizations").select(
            "stripe_customer_id"
        ).eq("id", org_id).single().execute()
        customer_id = (result.data or {}).get("stripe_customer_id")
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch organization")

    if not customer_id:
        raise HTTPException(
            status_code=400,
            detail="No active subscription. Please subscribe first.",
        )

    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=data.return_url or f"{FRONTEND_URL}/app",
        )
        return {"portal_url": session.url}
    except Exception as e:
        logger.error("Portal session creation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create portal session")


# --- Webhook (no auth – verified via Stripe signature) ---


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    stripe = _get_stripe()
    if not stripe:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")

    event_type = event["type"]
    data_object = event["data"]["object"]

    logger.info("Stripe webhook: %s", event_type)

    # Get DB client directly for webhook (no user auth)
    from config.supabase import get_db
    db = get_db()

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(db, data_object)
    elif event_type == "customer.subscription.updated":
        _handle_subscription_updated(db, data_object)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(db, data_object)

    return {"received": True}


def _handle_checkout_completed(db, session):
    """Handle successful checkout – link Stripe customer to organization."""
    org_id = session.get("metadata", {}).get("organization_id")
    customer_id = session.get("customer")

    if org_id and customer_id:
        try:
            db.table("organizations").update(
                {"stripe_customer_id": customer_id}
            ).eq("id", org_id).execute()
            logger.info("Linked Stripe customer %s to org %s", customer_id, org_id)
        except Exception as e:
            logger.error("Failed to update org with Stripe customer: %s", e)


def _handle_subscription_updated(db, subscription):
    """Handle subscription updates (upgrade/downgrade/renewal)."""
    org_id = subscription.get("metadata", {}).get("organization_id")
    status = subscription.get("status")
    plan = subscription.get("metadata", {}).get("plan")

    if org_id:
        logger.info(
            "Subscription updated for org %s: plan=%s status=%s",
            org_id, plan, status,
        )


def _handle_subscription_deleted(db, subscription):
    """Handle subscription cancellation."""
    org_id = subscription.get("metadata", {}).get("organization_id")

    if org_id:
        logger.info("Subscription cancelled for org %s", org_id)
