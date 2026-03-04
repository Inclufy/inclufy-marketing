# backend/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase import Client
import os
import logging

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/ping")
def admin_ping():
    """Health check — verifies admin router is loaded (no auth required)."""
    return {"ok": True, "version": "2.0", "superadmins": list(SUPERADMIN_EMAILS)}


# Hardcoded superadmin emails — always have full access regardless of role
# Stored lowercase for case-insensitive comparison
SUPERADMIN_EMAILS = {"sami@inclufy.com", "s_loukile@hotmail.com", "s.loukile@eprocure.eu"}


def _is_superadmin(email: str) -> bool:
    """Check if email is a superadmin (case-insensitive)."""
    return email.lower().strip() in SUPERADMIN_EMAILS


def _require_admin(current_user: dict):
    """Raise 403 if user is not owner, admin, or superadmin."""
    email = (current_user.get("email") or "").lower().strip()
    role = current_user.get("role", "member")
    is_super = _is_superadmin(email)
    logger.info(
        "Admin check: email=%r, role=%r, is_superadmin=%s, user_keys=%s",
        email, role, is_super, list(current_user.keys()),
    )
    if is_super:
        return  # superadmin bypass
    if role not in ("owner", "admin"):
        logger.warning("Admin access denied for email=%r role=%r", email, role)
        raise HTTPException(status_code=403, detail="Admin access required")


def _safe_query(fn):
    """Run a query and return empty result on table-not-found errors."""
    try:
        return fn()
    except Exception as e:
        err_str = str(e)
        if "does not exist" in err_str or "42P01" in err_str or "42703" in err_str:
            return None
        raise


# ─── Organization Members ──────────────────────────────────────────────


@router.get("/whoami")
def whoami(current_user: dict = Depends(get_current_user)):
    """Debug: show current user info (remove in production)."""
    email = (current_user.get("email") or "").lower().strip()
    logger.info("Whoami called: email=%r, full_user=%s", email, current_user)
    return {
        "email": email,
        "role": current_user.get("role"),
        "organization_id": current_user.get("organization_id"),
        "is_superadmin": _is_superadmin(email),
        "user_id": current_user.get("id"),
    }


@router.get("/members")
def list_members(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """List all members in the current organization + superadmins."""
    _require_admin(current_user)
    org_id = current_user.get("organization_id")

    members = []

    if org_id:
        result = _safe_query(
            lambda: db.table("organization_members")
            .select("user_id, role, permissions, joined_at")
            .eq("organization_id", org_id)
            .execute()
        )
        members = (result.data if result else []) or []

        # Enrich with email from users table (best effort)
        for member in members:
            member["id"] = member.get("user_id", "")
            try:
                user_id = member.get("user_id")
                if user_id:
                    user_res = _safe_query(
                        lambda uid=user_id: db.table("users")
                        .select("email, full_name")
                        .eq("id", uid)
                        .single()
                        .execute()
                    )
                    if user_res and user_res.data:
                        member["email"] = user_res.data.get("email", "")
                        member["full_name"] = user_res.data.get("full_name", "")
                    else:
                        member["email"] = ""
                        member["full_name"] = ""
            except Exception:
                member["email"] = ""
                member["full_name"] = ""

    # Always include the current user if they are a superadmin and not already in the list
    current_email = (current_user.get("email") or "").lower().strip()
    current_user_id = str(current_user.get("id", ""))
    already_listed = any(m.get("user_id") == current_user_id or m.get("id") == current_user_id for m in members)

    if not already_listed:
        members.insert(0, {
            "id": current_user_id,
            "user_id": current_user_id,
            "role": "superadmin" if _is_superadmin(current_email) else current_user.get("role", "member"),
            "email": current_email,
            "full_name": current_email.split("@")[0].replace(".", " ").title(),
            "joined_at": None,
        })

    return members


class UpdateMemberRole(BaseModel):
    role: str  # owner, admin, member, viewer


@router.patch("/members/{user_id}/role")
def update_member_role(
    user_id: str,
    data: UpdateMemberRole,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update a member's role (owner/admin only). Uses user_id as identifier."""
    _require_admin(current_user)
    org_id = current_user.get("organization_id")

    if data.role not in ("owner", "admin", "member", "viewer"):
        raise HTTPException(status_code=400, detail="Invalid role")

    try:
        result = db.table("organization_members") \
            .update({"role": data.role}) \
            .eq("user_id", user_id) \
            .eq("organization_id", org_id) \
            .execute()
        return {"success": True, "updated": result.data}
    except Exception as e:
        logger.error("Failed to update member role: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update role")


@router.delete("/members/{user_id}")
def remove_member(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Remove a member from the organization (owner/admin only). Uses user_id."""
    _require_admin(current_user)
    org_id = current_user.get("organization_id")

    # Prevent removing yourself
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    try:
        db.table("organization_members") \
            .delete() \
            .eq("user_id", user_id) \
            .eq("organization_id", org_id) \
            .execute()
        return {"success": True}
    except Exception as e:
        logger.error("Failed to remove member: %s", e)
        raise HTTPException(status_code=500, detail="Failed to remove member")


# ─── Organization Settings ─────────────────────────────────────────────


@router.get("/organization")
def get_organization(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Get current organization details."""
    _require_admin(current_user)
    org_id = current_user.get("organization_id")
    if not org_id:
        # Return a placeholder for superadmins without an org
        return {"id": None, "name": "No Organization", "slug": "-", "created_at": None}

    try:
        result = db.table("organizations") \
            .select("*") \
            .eq("id", org_id) \
            .single() \
            .execute()
        return result.data
    except Exception as e:
        logger.error("Failed to get organization: %s", e)
        return {"id": org_id, "name": "Unknown", "slug": "-", "created_at": None}


class UpdateOrganization(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None


@router.patch("/organization")
def update_organization(
    data: UpdateOrganization,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update organization settings (owner/admin only)."""
    _require_admin(current_user)
    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=404, detail="No organization found")

    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        result = db.table("organizations") \
            .update(update_data) \
            .eq("id", org_id) \
            .execute()
        return {"success": True, "updated": result.data}
    except Exception as e:
        logger.error("Failed to update organization: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update organization")


# ─── API Keys / System Config ──────────────────────────────────────────


@router.get("/config")
def get_system_config(
    current_user: dict = Depends(get_current_user),
):
    """Get system configuration status (owner/admin only). Never exposes actual keys."""
    _require_admin(current_user)

    def _mask(key: str) -> dict:
        val = os.getenv(key, "")
        return {
            "configured": bool(val),
            "masked": f"{val[:8]}...{val[-4:]}" if len(val) > 12 else ("***" if val else ""),
        }

    return {
        "openai": _mask("OPENAI_API_KEY"),
        "supabase_url": _mask("SUPABASE_URL"),
        "supabase_key": _mask("SUPABASE_ANON_KEY"),
        "stripe": _mask("STRIPE_SECRET_KEY"),
        "email_api": _mask("EMAIL_API_KEY"),
        "anthropic": _mask("ANTHROPIC_API_KEY"),
        "allowed_origins": os.getenv("ALLOWED_ORIGINS", "not set"),
    }


# ─── Invite / Create User ─────────────────────────────────────────────


class InviteUser(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: str = "member"  # owner, admin, member, viewer
    password: Optional[str] = None  # if provided, creates with password


@router.post("/invite")
def invite_user(
    data: InviteUser,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Create/invite a new user and add to organization."""
    _require_admin(current_user)

    if data.role not in ("owner", "admin", "member", "viewer"):
        raise HTTPException(status_code=400, detail="Ongeldige rol")

    email = data.email.lower().strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Ongeldig e-mailadres")

    # Generate a random password if not provided
    import secrets
    password = data.password or secrets.token_urlsafe(16)

    try:
        # Create user via Supabase Auth Admin API
        # Note: This requires the service role key for admin.create_user
        # With anon key, we use signUp instead
        sign_up_result = db.auth.sign_up({
            "email": email,
            "password": password,
        })

        if not sign_up_result or not sign_up_result.user:
            raise HTTPException(status_code=400, detail="Kon gebruiker niet aanmaken")

        new_user_id = sign_up_result.user.id
        logger.info("Created new user: id=%s, email=%s", new_user_id, email)

        # Get or create organization for the current admin
        org_id = current_user.get("organization_id")

        if not org_id:
            # Create a default organization
            try:
                org_result = db.table("organizations").insert({
                    "name": "Inclufy Marketing",
                    "slug": f"org-{secrets.token_hex(4)}",
                }).execute()
                if org_result.data and len(org_result.data) > 0:
                    org_id = org_result.data[0]["id"]
                    logger.info("Created organization: %s", org_id)

                    # Also add the current admin to the org as owner
                    db.table("organization_members").insert({
                        "organization_id": org_id,
                        "user_id": str(current_user["id"]),
                        "role": "owner",
                    }).execute()
            except Exception as org_err:
                logger.error("Failed to create organization: %s", org_err)

        # Add new user to organization
        if org_id:
            try:
                db.table("organization_members").insert({
                    "organization_id": org_id,
                    "user_id": str(new_user_id),
                    "role": data.role,
                }).execute()
                logger.info("Added user %s to org %s with role %s", new_user_id, org_id, data.role)
            except Exception as mem_err:
                logger.error("Failed to add member to org: %s", mem_err)

        return {
            "success": True,
            "user_id": str(new_user_id),
            "email": email,
            "role": data.role,
            "temporary_password": password if not data.password else None,
            "message": f"Gebruiker {email} aangemaakt met rol {data.role}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to invite user: %s", e, exc_info=True)
        error_msg = str(e)
        if "already been registered" in error_msg or "already exists" in error_msg:
            raise HTTPException(status_code=400, detail=f"E-mailadres {email} is al geregistreerd")
        raise HTTPException(status_code=500, detail=f"Gebruiker aanmaken mislukt: {error_msg}")


# ─── Platform Stats (overview for admins) ──────────────────────────────


@router.get("/stats")
def platform_stats(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Platform-wide stats for the organization."""
    _require_admin(current_user)
    org_id = current_user.get("organization_id")

    def _count(table: str) -> int:
        try:
            q = db.table(table).select("*", count="exact")
            if org_id:
                q = q.eq("organization_id", org_id)
            res = q.limit(0).execute()
            return res.count if hasattr(res, "count") and res.count else 0
        except Exception:
            return 0

    return {
        "campaigns": _count("campaigns"),
        "contacts": _count("contacts"),
        "members": _count("organization_members"),
        "content": _count("content_library"),
    }
