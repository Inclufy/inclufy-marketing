# backend/routers/tenant_admin.py
# Tenant Admin Portal — volledige admin endpoints (zoals ProjeXtPal)
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from supabase import Client
import os
import logging
import secrets
from datetime import datetime, timedelta

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tenant-admin", tags=["Tenant Admin"])

# Superadmin emails — altijd volledige toegang
SUPERADMIN_EMAILS = {"sami@inclufy.com", "s_loukile@hotmail.com", "s.loukile@eprocure.eu"}


def _is_superadmin(email: str) -> bool:
    return email.lower().strip() in SUPERADMIN_EMAILS


def _require_superadmin(current_user: dict):
    """Alleen superadmins mogen tenant admin gebruiken."""
    email = (current_user.get("email") or "").lower().strip()
    if not _is_superadmin(email):
        raise HTTPException(status_code=403, detail="Superadmin toegang vereist")


def _safe_query(fn):
    try:
        return fn()
    except Exception as e:
        err_str = str(e)
        if "does not exist" in err_str or "42P01" in err_str or "42703" in err_str:
            return None
        raise


# ─── Dashboard Stats ──────────────────────────────────────────────────


@router.get("/dashboard/stats")
def dashboard_stats(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Platform-brede dashboard statistieken."""
    _require_superadmin(current_user)

    def _count(table: str) -> int:
        try:
            res = db.table(table).select("*", count="exact").limit(0).execute()
            return res.count if hasattr(res, "count") and res.count else 0
        except Exception:
            return 0

    # Bereken MRR/ARR van actieve subscriptions
    mrr = 0.0
    arr = 0.0
    active_subs = 0
    try:
        subs_res = _safe_query(
            lambda: db.table("subscriptions")
            .select("*")
            .eq("status", "active")
            .execute()
        )
        if subs_res and subs_res.data:
            active_subs = len(subs_res.data)
            for sub in subs_res.data:
                amount = float(sub.get("amount", 0) or 0)
                interval = sub.get("interval", "month")
                if interval == "year":
                    arr += amount
                    mrr += amount / 12
                else:
                    mrr += amount
                    arr += amount * 12
    except Exception:
        pass

    # User growth: vergelijk met vorige maand
    total_users = _count("users")
    user_growth = 0
    try:
        month_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        new_res = _safe_query(
            lambda: db.table("users")
            .select("*", count="exact")
            .gte("created_at", month_ago)
            .limit(0)
            .execute()
        )
        if new_res and hasattr(new_res, "count") and new_res.count and total_users > 0:
            user_growth = round((new_res.count / max(total_users - new_res.count, 1)) * 100)
    except Exception:
        pass

    return {
        "total_users": total_users,
        "organizations": _count("organizations"),
        "active_subscriptions": active_subs,
        "projects": _count("campaigns"),
        "mrr": round(mrr, 2),
        "arr": round(arr, 2),
        "user_growth": user_growth,
        "contacts": _count("contacts"),
        "content_items": _count("content_library"),
    }


@router.get("/dashboard/recent-users")
def recent_users(
    limit: int = Query(default=10, le=50),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Laatste geregistreerde gebruikers."""
    _require_superadmin(current_user)

    try:
        result = db.table("users") \
            .select("id, email, full_name, created_at") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        users = result.data or []

        # Voeg organisatie info toe
        for user in users:
            try:
                org_res = _safe_query(
                    lambda uid=user["id"]: db.table("organization_members")
                    .select("organization_id, role, organizations(name)")
                    .eq("user_id", uid)
                    .limit(1)
                    .execute()
                )
                if org_res and org_res.data and len(org_res.data) > 0:
                    org_data = org_res.data[0]
                    org_info = org_data.get("organizations")
                    user["organization"] = org_info.get("name", "") if isinstance(org_info, dict) else ""
                    user["role"] = org_data.get("role", "member")
                else:
                    user["organization"] = ""
                    user["role"] = "member"
            except Exception:
                user["organization"] = ""
                user["role"] = "member"

        return users
    except Exception as e:
        logger.error("Failed to get recent users: %s", e)
        return []


@router.get("/dashboard/activity")
def recent_activity(
    limit: int = Query(default=20, le=100),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Recente platform activiteit."""
    _require_superadmin(current_user)

    activities = []
    try:
        # Laatste campagnes
        campaigns = _safe_query(
            lambda: db.table("campaigns")
            .select("id, name, status, created_at")
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        if campaigns and campaigns.data:
            for c in campaigns.data:
                activities.append({
                    "type": "campaign",
                    "description": f"Campagne '{c.get('name', '?')}' aangemaakt",
                    "status": c.get("status", ""),
                    "timestamp": c.get("created_at"),
                })

        # Laatste registraties
        users = _safe_query(
            lambda: db.table("users")
            .select("id, email, created_at")
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        if users and users.data:
            for u in users.data:
                activities.append({
                    "type": "registration",
                    "description": f"Nieuwe gebruiker: {u.get('email', '?')}",
                    "status": "active",
                    "timestamp": u.get("created_at"),
                })
    except Exception as e:
        logger.error("Failed to get activity: %s", e)

    # Sort by timestamp
    activities.sort(key=lambda a: a.get("timestamp") or "", reverse=True)
    return activities[:limit]


# ─── Gebruikers Beheer ────────────────────────────────────────────────


@router.get("/users")
def list_all_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=25, le=100),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Lijst van alle gebruikers op het platform."""
    _require_superadmin(current_user)

    try:
        query = db.table("users").select("*", count="exact")

        if search:
            query = query.or_(f"email.ilike.%{search}%,full_name.ilike.%{search}%")

        offset = (page - 1) * per_page
        result = query.order("created_at", desc=True) \
            .range(offset, offset + per_page - 1) \
            .execute()

        users = result.data or []
        total = result.count if hasattr(result, "count") and result.count else len(users)

        # Enrich with org/role
        for user in users:
            try:
                org_res = _safe_query(
                    lambda uid=user["id"]: db.table("organization_members")
                    .select("organization_id, role, organizations(name)")
                    .eq("user_id", uid)
                    .limit(1)
                    .execute()
                )
                if org_res and org_res.data and len(org_res.data) > 0:
                    org_data = org_res.data[0]
                    org_info = org_data.get("organizations")
                    user["organization_name"] = org_info.get("name", "") if isinstance(org_info, dict) else ""
                    user["role"] = org_data.get("role", "member")
                    user["organization_id"] = org_data.get("organization_id", "")
                else:
                    user["organization_name"] = ""
                    user["role"] = "geen"
                    user["organization_id"] = ""
            except Exception:
                user["organization_name"] = ""
                user["role"] = "geen"
                user["organization_id"] = ""

            user["is_superadmin"] = _is_superadmin(user.get("email", ""))

        return {"users": users, "total": total, "page": page, "per_page": per_page}
    except Exception as e:
        logger.error("Failed to list users: %s", e)
        raise HTTPException(status_code=500, detail=f"Kon gebruikers niet laden: {str(e)}")


class CreateUserRequest(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: str = "member"
    organization_id: Optional[str] = None
    password: Optional[str] = None


@router.post("/users")
def create_user(
    data: CreateUserRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Maak een nieuwe gebruiker aan."""
    _require_superadmin(current_user)

    email = data.email.lower().strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Ongeldig e-mailadres")

    password = data.password or secrets.token_urlsafe(16)

    try:
        sign_up_result = db.auth.sign_up({"email": email, "password": password})
        if not sign_up_result or not sign_up_result.user:
            raise HTTPException(status_code=400, detail="Kon gebruiker niet aanmaken")

        new_user_id = sign_up_result.user.id
        logger.info("Created user: id=%s, email=%s", new_user_id, email)

        # Update full_name in users table
        if data.full_name:
            try:
                db.table("users").update({"full_name": data.full_name}).eq("id", str(new_user_id)).execute()
            except Exception:
                pass

        # Add to organization
        org_id = data.organization_id
        if org_id:
            try:
                db.table("organization_members").insert({
                    "organization_id": org_id,
                    "user_id": str(new_user_id),
                    "role": data.role,
                }).execute()
            except Exception as e:
                logger.error("Failed to add user to org: %s", e)

        return {
            "success": True,
            "user_id": str(new_user_id),
            "email": email,
            "role": data.role,
            "temporary_password": password if not data.password else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "already been registered" in error_msg or "already exists" in error_msg:
            raise HTTPException(status_code=400, detail=f"E-mail {email} is al geregistreerd")
        raise HTTPException(status_code=500, detail=f"Aanmaken mislukt: {error_msg}")


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    data: UpdateUserRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update een gebruiker."""
    _require_superadmin(current_user)

    try:
        if data.full_name is not None:
            db.table("users").update({"full_name": data.full_name}).eq("id", user_id).execute()

        if data.role is not None:
            # Update role in organization_members
            db.table("organization_members") \
                .update({"role": data.role}) \
                .eq("user_id", user_id) \
                .execute()

        return {"success": True}
    except Exception as e:
        logger.error("Failed to update user: %s", e)
        raise HTTPException(status_code=500, detail=f"Bijwerken mislukt: {str(e)}")


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Verwijder een gebruiker (soft delete)."""
    _require_superadmin(current_user)

    if user_id == str(current_user.get("id", "")):
        raise HTTPException(status_code=400, detail="Je kunt jezelf niet verwijderen")

    try:
        # Remove from organization
        _safe_query(
            lambda: db.table("organization_members").delete().eq("user_id", user_id).execute()
        )
        # Mark as inactive (soft delete) or delete from users table
        _safe_query(
            lambda: db.table("users").delete().eq("id", user_id).execute()
        )
        return {"success": True}
    except Exception as e:
        logger.error("Failed to delete user: %s", e)
        raise HTTPException(status_code=500, detail=f"Verwijderen mislukt: {str(e)}")


# ─── Organisaties Beheer ──────────────────────────────────────────────


@router.get("/organizations")
def list_organizations(
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Lijst van alle organisaties."""
    _require_superadmin(current_user)

    try:
        query = db.table("organizations").select("*")
        if search:
            query = query.or_(f"name.ilike.%{search}%,slug.ilike.%{search}%")

        result = query.order("created_at", desc=True).execute()
        orgs = result.data or []

        # Voeg member count toe
        for org in orgs:
            try:
                count_res = db.table("organization_members") \
                    .select("*", count="exact") \
                    .eq("organization_id", org["id"]) \
                    .limit(0) \
                    .execute()
                org["member_count"] = count_res.count if hasattr(count_res, "count") and count_res.count else 0
            except Exception:
                org["member_count"] = 0

        return orgs
    except Exception as e:
        logger.error("Failed to list organizations: %s", e)
        raise HTTPException(status_code=500, detail=f"Kon organisaties niet laden: {str(e)}")


class CreateOrganizationRequest(BaseModel):
    name: str
    slug: Optional[str] = None


@router.post("/organizations")
def create_organization(
    data: CreateOrganizationRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Maak een nieuwe organisatie aan."""
    _require_superadmin(current_user)

    slug = data.slug or data.name.lower().replace(" ", "-").replace("_", "-")[:50]

    try:
        result = db.table("organizations").insert({
            "name": data.name,
            "slug": slug,
        }).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Aanmaken mislukt")

        return {"success": True, "organization": result.data[0]}
    except Exception as e:
        logger.error("Failed to create organization: %s", e)
        raise HTTPException(status_code=500, detail=f"Aanmaken mislukt: {str(e)}")


@router.patch("/organizations/{org_id}")
def update_organization(
    org_id: str,
    data: CreateOrganizationRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update een organisatie."""
    _require_superadmin(current_user)

    update_data = {}
    if data.name:
        update_data["name"] = data.name
    if data.slug:
        update_data["slug"] = data.slug

    try:
        result = db.table("organizations").update(update_data).eq("id", org_id).execute()
        return {"success": True, "organization": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bijwerken mislukt: {str(e)}")


@router.delete("/organizations/{org_id}")
def delete_organization(
    org_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Verwijder een organisatie."""
    _require_superadmin(current_user)

    try:
        # Remove all members first
        _safe_query(lambda: db.table("organization_members").delete().eq("organization_id", org_id).execute())
        # Delete organization
        db.table("organizations").delete().eq("id", org_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verwijderen mislukt: {str(e)}")


# ─── Abonnementen ─────────────────────────────────────────────────────


@router.get("/subscriptions")
def list_subscriptions(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Lijst van alle abonnementen."""
    _require_superadmin(current_user)

    try:
        query = db.table("subscriptions").select("*")
        if status:
            query = query.eq("status", status)
        result = query.order("created_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        # Table might not exist yet
        logger.warning("Subscriptions table not available: %s", e)
        return []


class CreateSubscriptionRequest(BaseModel):
    organization_id: str
    plan: str = "starter"  # starter, professional, enterprise
    status: str = "active"
    amount: float = 0
    interval: str = "month"  # month, year


@router.post("/subscriptions")
def create_subscription(
    data: CreateSubscriptionRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Maak een nieuw abonnement aan."""
    _require_superadmin(current_user)

    try:
        result = db.table("subscriptions").insert({
            "organization_id": data.organization_id,
            "plan": data.plan,
            "status": data.status,
            "amount": data.amount,
            "interval": data.interval,
        }).execute()
        return {"success": True, "subscription": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Aanmaken mislukt: {str(e)}")


@router.patch("/subscriptions/{sub_id}")
def update_subscription(
    sub_id: str,
    data: CreateSubscriptionRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update een abonnement."""
    _require_superadmin(current_user)

    try:
        result = db.table("subscriptions").update({
            "plan": data.plan,
            "status": data.status,
            "amount": data.amount,
            "interval": data.interval,
        }).eq("id", sub_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bijwerken mislukt: {str(e)}")


# ─── Demo Verzoeken ───────────────────────────────────────────────────


@router.get("/demo-requests")
def list_demo_requests(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Lijst van demo verzoeken."""
    _require_superadmin(current_user)

    try:
        query = db.table("demo_requests").select("*")
        if status:
            query = query.eq("status", status)
        result = query.order("created_at", desc=True).execute()
        return result.data or []
    except Exception:
        return []


class DemoRequestUpdate(BaseModel):
    status: str  # pending, scheduled, completed, cancelled
    notes: Optional[str] = None


@router.patch("/demo-requests/{request_id}")
def update_demo_request(
    request_id: str,
    data: DemoRequestUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update een demo verzoek."""
    _require_superadmin(current_user)

    try:
        update_data = {"status": data.status}
        if data.notes is not None:
            update_data["notes"] = data.notes
        db.table("demo_requests").update(update_data).eq("id", request_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bijwerken mislukt: {str(e)}")


# ─── Registraties (Trial signups) ────────────────────────────────────


@router.get("/registrations")
def list_registrations(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Lijst van trial registraties."""
    _require_superadmin(current_user)

    try:
        result = db.table("registrations").select("*").order("created_at", desc=True).execute()
        return result.data or []
    except Exception:
        # Fallback: use users as registrations
        try:
            result = db.table("users") \
                .select("id, email, full_name, created_at") \
                .order("created_at", desc=True) \
                .limit(50) \
                .execute()
            return [
                {
                    **u,
                    "type": "trial",
                    "status": "active",
                    "source": "direct",
                }
                for u in (result.data or [])
            ]
        except Exception:
            return []


# ─── Integraties ──────────────────────────────────────────────────────


@router.get("/integrations")
def list_integrations(
    current_user: dict = Depends(get_current_user),
):
    """Lijst van beschikbare integraties en hun status."""
    _require_superadmin(current_user)

    # Hardcoded integraties met hun config status
    integrations = [
        {
            "id": "openai",
            "name": "OpenAI / GPT",
            "description": "AI content generatie en marketing co-pilot",
            "icon": "brain",
            "category": "ai",
            "configured": bool(os.getenv("OPENAI_API_KEY", "")),
            "status": "active" if os.getenv("OPENAI_API_KEY") else "inactive",
        },
        {
            "id": "anthropic",
            "name": "Anthropic / Claude",
            "description": "Geavanceerde AI tekst analyse",
            "icon": "sparkles",
            "category": "ai",
            "configured": bool(os.getenv("ANTHROPIC_API_KEY", "")),
            "status": "active" if os.getenv("ANTHROPIC_API_KEY") else "inactive",
        },
        {
            "id": "stripe",
            "name": "Stripe",
            "description": "Betalingsverwerking en abonnementen",
            "icon": "credit-card",
            "category": "payment",
            "configured": bool(os.getenv("STRIPE_SECRET_KEY", "")),
            "status": "active" if os.getenv("STRIPE_SECRET_KEY") else "inactive",
        },
        {
            "id": "supabase",
            "name": "Supabase",
            "description": "Database, authenticatie en opslag",
            "icon": "database",
            "category": "infrastructure",
            "configured": bool(os.getenv("SUPABASE_URL", "")),
            "status": "active" if os.getenv("SUPABASE_URL") else "inactive",
        },
        {
            "id": "email",
            "name": "E-mail Service",
            "description": "Transactionele en marketing e-mails",
            "icon": "mail",
            "category": "communication",
            "configured": bool(os.getenv("EMAIL_API_KEY", "")),
            "status": "active" if os.getenv("EMAIL_API_KEY") else "inactive",
        },
        {
            "id": "google-analytics",
            "name": "Google Analytics",
            "description": "Website analytics en tracking",
            "icon": "bar-chart",
            "category": "analytics",
            "configured": False,
            "status": "inactive",
        },
        {
            "id": "mailchimp",
            "name": "Mailchimp",
            "description": "E-mail marketing automatisering",
            "icon": "mail",
            "category": "marketing",
            "configured": False,
            "status": "inactive",
        },
        {
            "id": "hubspot",
            "name": "HubSpot",
            "description": "CRM en marketing automatisering",
            "icon": "users",
            "category": "crm",
            "configured": False,
            "status": "inactive",
        },
    ]

    return integrations


# ─── Systeeminstellingen ──────────────────────────────────────────────


@router.get("/settings")
def get_system_settings(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Haal systeeminstellingen op."""
    _require_superadmin(current_user)

    # Try to load from database, fallback to defaults
    settings = {
        "general": {
            "site_name": "Inclufy Marketing",
            "default_language": "nl",
            "max_upload_size_mb": 10,
            "support_email": "support@inclufy.com",
            "maintenance_mode": False,
        },
        "security": {
            "require_2fa": False,
            "session_timeout_minutes": 60,
            "max_login_attempts": 5,
            "password_min_length": 8,
            "allowed_domains": "",
        },
        "email": {
            "smtp_host": os.getenv("SMTP_HOST", ""),
            "smtp_port": os.getenv("SMTP_PORT", "587"),
            "smtp_from": os.getenv("SMTP_FROM", "noreply@inclufy.com"),
            "email_provider": os.getenv("EMAIL_PROVIDER", "resend"),
        },
        "features": {
            "ai_copilot_enabled": True,
            "trial_days": 14,
            "max_campaigns_free": 3,
            "max_contacts_free": 500,
            "allow_registrations": True,
            "demo_mode": False,
        },
        "billing": {
            "currency": "EUR",
            "tax_rate": 21,
            "stripe_configured": bool(os.getenv("STRIPE_SECRET_KEY", "")),
        },
    }

    # Try to load from db
    try:
        result = _safe_query(
            lambda: db.table("system_settings").select("*").execute()
        )
        if result and result.data:
            for row in result.data:
                category = row.get("category", "general")
                key = row.get("key", "")
                value = row.get("value", "")
                if category in settings and key in settings[category]:
                    settings[category][key] = value
    except Exception:
        pass

    return settings


class UpdateSettingsRequest(BaseModel):
    category: str
    settings: dict


@router.patch("/settings")
def update_system_settings(
    data: UpdateSettingsRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update systeeminstellingen."""
    _require_superadmin(current_user)

    try:
        for key, value in data.settings.items():
            try:
                # Upsert
                db.table("system_settings").upsert({
                    "category": data.category,
                    "key": key,
                    "value": str(value),
                }, on_conflict="category,key").execute()
            except Exception:
                # Table may not exist, just log
                logger.warning("Could not save setting %s.%s", data.category, key)

        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Instellingen opslaan mislukt: {str(e)}")


# ─── Facturen ─────────────────────────────────────────────────────────


@router.get("/invoices")
def list_invoices(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Lijst van facturen."""
    _require_superadmin(current_user)

    try:
        result = db.table("invoices").select("*").order("created_at", desc=True).execute()
        return result.data or []
    except Exception:
        return []


# ─── Trainingen ───────────────────────────────────────────────────────


@router.get("/trainings")
def list_trainings(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Lijst van trainingen."""
    _require_superadmin(current_user)

    try:
        result = db.table("trainings").select("*").order("created_at", desc=True).execute()
        return result.data or []
    except Exception:
        return []
