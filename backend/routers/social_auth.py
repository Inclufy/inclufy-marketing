"""Social media OAuth integration router."""
import os
import logging
from urllib.parse import urlencode
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from supabase import Client

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/social-auth", tags=["Social Auth"])

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
META_APP_ID = os.getenv("META_APP_ID")
META_APP_SECRET = os.getenv("META_APP_SECRET")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

SUPPORTED_PLATFORMS = {"linkedin", "facebook", "instagram"}

# LinkedIn OAuth scopes
LINKEDIN_SCOPES = "openid profile email w_member_social"

# Facebook/Instagram OAuth scopes
META_SCOPES = "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish"


def _get_redirect_uri(platform: str) -> str:
    return f"{BACKEND_URL}/api/social-auth/callback/{platform}"


# ─── Endpoint 1: Get OAuth Authorization URL ──────────────────────────


@router.get("/connect/{platform}")
async def get_connect_url(
    platform: str,
    current_user: dict = Depends(get_current_user),
):
    """Return the OAuth authorization URL for the given platform."""
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported platform: {platform}. Must be one of: {', '.join(SUPPORTED_PLATFORMS)}",
        )

    redirect_uri = _get_redirect_uri(platform)
    user_id = current_user.get("id", "")
    org_id = current_user.get("organization_id", "")
    state = f"{user_id}:{org_id}"

    if platform == "linkedin":
        if not LINKEDIN_CLIENT_ID:
            raise HTTPException(status_code=503, detail="LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID.")
        params = {
            "response_type": "code",
            "client_id": LINKEDIN_CLIENT_ID,
            "redirect_uri": redirect_uri,
            "scope": LINKEDIN_SCOPES,
            "state": state,
        }
        authorization_url = f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"

    elif platform in ("facebook", "instagram"):
        if not META_APP_ID:
            raise HTTPException(status_code=503, detail="Meta OAuth is not configured. Set META_APP_ID.")
        params = {
            "client_id": META_APP_ID,
            "redirect_uri": redirect_uri,
            "scope": META_SCOPES,
            "response_type": "code",
            "state": state,
        }
        authorization_url = f"https://www.facebook.com/v18.0/dialog/oauth?{urlencode(params)}"

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    return {"authorization_url": authorization_url}


# ─── Endpoint 2: OAuth Callback ───────────────────────────────────────


@router.get("/callback/{platform}")
async def oauth_callback(
    platform: str,
    code: str = Query(...),
    state: str = Query(""),
    db: Client = Depends(get_supabase_client),
):
    """Handle OAuth callback: exchange code for tokens, store in DB, redirect to frontend."""
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    # Parse state to recover user_id and organization_id
    parts = state.split(":", 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    user_id, organization_id = parts

    redirect_uri = _get_redirect_uri(platform)

    try:
        if platform == "linkedin":
            token_data = await _exchange_linkedin_code(code, redirect_uri)
            profile = await _get_linkedin_profile(token_data["access_token"])
        elif platform in ("facebook", "instagram"):
            token_data = await _exchange_meta_code(code, redirect_uri)
            profile = await _get_meta_profile(token_data["access_token"])
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("OAuth token exchange failed for %s: %s", platform, e, exc_info=True)
        return RedirectResponse(
            url=f"{FRONTEND_URL}/app/settings?social=error&platform={platform}&reason=token_exchange_failed"
        )

    # Upsert social account
    try:
        account_data = {
            "user_id": user_id,
            "organization_id": organization_id,
            "platform": platform,
            "platform_account_id": profile["id"],
            "account_name": profile.get("name", ""),
            "profile_image_url": profile.get("picture", ""),
            "status": "active",
        }

        # Check if account already exists
        existing = (
            db.table("social_accounts")
            .select("id")
            .eq("organization_id", organization_id)
            .eq("platform", platform)
            .eq("platform_account_id", profile["id"])
            .execute()
        )

        if existing.data and len(existing.data) > 0:
            social_account_id = existing.data[0]["id"]
            db.table("social_accounts").update({
                "account_name": profile.get("name", ""),
                "profile_image_url": profile.get("picture", ""),
                "status": "active",
            }).eq("id", social_account_id).execute()
        else:
            result = db.table("social_accounts").insert(account_data).execute()
            social_account_id = result.data[0]["id"]

        # Upsert oauth token
        token_record = {
            "social_account_id": social_account_id,
            "platform": platform,
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token"),
            "expires_at": token_data.get("expires_at"),
            "scope": token_data.get("scope"),
            "token_type": token_data.get("token_type", "Bearer"),
        }

        existing_token = (
            db.table("oauth_tokens")
            .select("id")
            .eq("social_account_id", social_account_id)
            .execute()
        )

        if existing_token.data and len(existing_token.data) > 0:
            db.table("oauth_tokens").update(token_record).eq(
                "social_account_id", social_account_id
            ).execute()
        else:
            db.table("oauth_tokens").insert(token_record).execute()

        logger.info(
            "Social account connected: platform=%s account=%s org=%s",
            platform, profile.get("name"), organization_id,
        )

    except Exception as e:
        logger.error("Failed to store social account: %s", e, exc_info=True)
        return RedirectResponse(
            url=f"{FRONTEND_URL}/app/settings?social=error&platform={platform}&reason=db_error"
        )

    return RedirectResponse(
        url=f"{FRONTEND_URL}/app/settings?social=connected&platform={platform}"
    )


# ─── Endpoint 3: List Connected Accounts ──────────────────────────────


@router.get("/accounts")
async def list_accounts(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """List connected social accounts for the current user's organization."""
    org_id = current_user.get("organization_id")
    if not org_id:
        return {"accounts": []}

    try:
        result = (
            db.table("social_accounts")
            .select("id, platform, platform_account_id, account_name, profile_image_url, status, connected_at")
            .eq("organization_id", org_id)
            .order("created_at", desc=True)
            .execute()
        )
        return {"accounts": result.data or []}
    except Exception as e:
        logger.error("Failed to list social accounts: %s", e)
        raise HTTPException(status_code=500, detail="Failed to list social accounts")


# ─── Endpoint 4: Disconnect Social Account ────────────────────────────


@router.delete("/accounts/{account_id}")
async def disconnect_account(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Disconnect a social account (delete from DB)."""
    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization found")

    try:
        # Verify the account belongs to the user's org
        existing = (
            db.table("social_accounts")
            .select("id")
            .eq("id", account_id)
            .eq("organization_id", org_id)
            .execute()
        )

        if not existing.data or len(existing.data) == 0:
            raise HTTPException(status_code=404, detail="Social account not found")

        # Delete cascades to oauth_tokens
        db.table("social_accounts").delete().eq("id", account_id).execute()

        logger.info("Social account disconnected: id=%s org=%s", account_id, org_id)
        return {"success": True, "message": "Social account disconnected"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to disconnect social account: %s", e)
        raise HTTPException(status_code=500, detail="Failed to disconnect social account")


# ─── Endpoint 5: Force Refresh OAuth Token ────────────────────────────


@router.post("/refresh/{account_id}")
async def refresh_token(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Force refresh the OAuth token for a social account."""
    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization found")

    try:
        # Fetch account + token
        account = (
            db.table("social_accounts")
            .select("id, platform")
            .eq("id", account_id)
            .eq("organization_id", org_id)
            .single()
            .execute()
        )

        if not account.data:
            raise HTTPException(status_code=404, detail="Social account not found")

        platform = account.data["platform"]

        token_result = (
            db.table("oauth_tokens")
            .select("id, refresh_token, access_token")
            .eq("social_account_id", account_id)
            .single()
            .execute()
        )

        if not token_result.data:
            raise HTTPException(status_code=404, detail="No token found for this account")

        refresh_tok = token_result.data.get("refresh_token")
        if not refresh_tok:
            raise HTTPException(
                status_code=400,
                detail="No refresh token available. Re-connect the account instead.",
            )

        # Refresh the token
        if platform == "linkedin":
            new_token_data = await _refresh_linkedin_token(refresh_tok)
        elif platform in ("facebook", "instagram"):
            new_token_data = await _refresh_meta_token(token_result.data["access_token"])
        else:
            raise HTTPException(status_code=400, detail=f"Token refresh not supported for {platform}")

        # Update in DB
        db.table("oauth_tokens").update({
            "access_token": new_token_data["access_token"],
            "refresh_token": new_token_data.get("refresh_token", refresh_tok),
            "expires_at": new_token_data.get("expires_at"),
        }).eq("social_account_id", account_id).execute()

        logger.info("Token refreshed: account=%s platform=%s", account_id, platform)
        return {"success": True, "message": "Token refreshed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to refresh token: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to refresh token")


# ─── Helper Functions: Token Exchange ──────────────────────────────────


async def _exchange_linkedin_code(code: str, redirect_uri: str) -> dict:
    """Exchange LinkedIn authorization code for access token."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    if response.status_code != 200:
        logger.error("LinkedIn token exchange failed: %s %s", response.status_code, response.text)
        raise HTTPException(status_code=502, detail="LinkedIn token exchange failed")

    data = response.json()
    result = {
        "access_token": data["access_token"],
        "token_type": data.get("token_type", "Bearer"),
        "scope": data.get("scope"),
    }
    if "expires_in" in data:
        from datetime import datetime, timedelta, timezone
        result["expires_at"] = (
            datetime.now(timezone.utc) + timedelta(seconds=data["expires_in"])
        ).isoformat()
    if "refresh_token" in data:
        result["refresh_token"] = data["refresh_token"]
    return result


async def _exchange_meta_code(code: str, redirect_uri: str) -> dict:
    """Exchange Facebook/Instagram authorization code for access token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )

    if response.status_code != 200:
        logger.error("Meta token exchange failed: %s %s", response.status_code, response.text)
        raise HTTPException(status_code=502, detail="Meta token exchange failed")

    data = response.json()
    result = {
        "access_token": data["access_token"],
        "token_type": data.get("token_type", "Bearer"),
    }
    if "expires_in" in data:
        from datetime import datetime, timedelta, timezone
        result["expires_at"] = (
            datetime.now(timezone.utc) + timedelta(seconds=data["expires_in"])
        ).isoformat()
    return result


# ─── Helper Functions: Profile Fetching ────────────────────────────────


async def _get_linkedin_profile(access_token: str) -> dict:
    """Fetch LinkedIn user profile (name, picture)."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if response.status_code != 200:
        logger.error("LinkedIn profile fetch failed: %s", response.text)
        raise HTTPException(status_code=502, detail="Failed to fetch LinkedIn profile")

    data = response.json()
    return {
        "id": data.get("sub", ""),
        "name": data.get("name", ""),
        "picture": data.get("picture", ""),
    }


async def _get_meta_profile(access_token: str) -> dict:
    """Fetch Facebook/Instagram user profile (name, picture)."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://graph.facebook.com/v18.0/me",
            params={
                "fields": "id,name,picture.type(large)",
                "access_token": access_token,
            },
        )

    if response.status_code != 200:
        logger.error("Meta profile fetch failed: %s", response.text)
        raise HTTPException(status_code=502, detail="Failed to fetch Meta profile")

    data = response.json()
    picture_url = ""
    if "picture" in data and "data" in data["picture"]:
        picture_url = data["picture"]["data"].get("url", "")

    return {
        "id": data.get("id", ""),
        "name": data.get("name", ""),
        "picture": picture_url,
    }


# ─── Helper Functions: Token Refresh ───────────────────────────────────


async def _refresh_linkedin_token(refresh_token: str) -> dict:
    """Refresh a LinkedIn OAuth token."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    if response.status_code != 200:
        logger.error("LinkedIn token refresh failed: %s %s", response.status_code, response.text)
        raise HTTPException(status_code=502, detail="LinkedIn token refresh failed")

    data = response.json()
    result = {
        "access_token": data["access_token"],
    }
    if "expires_in" in data:
        from datetime import datetime, timedelta, timezone
        result["expires_at"] = (
            datetime.now(timezone.utc) + timedelta(seconds=data["expires_in"])
        ).isoformat()
    if "refresh_token" in data:
        result["refresh_token"] = data["refresh_token"]
    return result


async def _refresh_meta_token(current_access_token: str) -> dict:
    """Exchange a short-lived Meta token for a long-lived one."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "fb_exchange_token": current_access_token,
            },
        )

    if response.status_code != 200:
        logger.error("Meta token refresh failed: %s %s", response.status_code, response.text)
        raise HTTPException(status_code=502, detail="Meta token refresh failed")

    data = response.json()
    result = {
        "access_token": data["access_token"],
    }
    if "expires_in" in data:
        from datetime import datetime, timedelta, timezone
        result["expires_at"] = (
            datetime.now(timezone.utc) + timedelta(seconds=data["expires_in"])
        ).isoformat()
    return result
