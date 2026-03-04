# backend/dependencies.py
import logging
from fastapi import Header, HTTPException
from typing import Optional
from supabase import Client
from config.supabase import get_db

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    return get_db()

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.replace("Bearer ", "")

    try:
        db = get_db()
        user_response = db.auth.get_user(token)

        if not user_response or not user_response.user:
            logger.warning("get_user returned no user for provided token")
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user = user_response.user
        logger.info("Authenticated user: id=%s, email=%s", user.id, user.email)

        # Fetch organization membership
        organization_id = None
        role = "member"
        try:
            org_response = db.from_("organization_members") \
                .select("organization_id, role") \
                .eq("user_id", user.id) \
                .limit(1) \
                .execute()

            if org_response.data and len(org_response.data) > 0:
                organization_id = org_response.data[0]["organization_id"]
                role = org_response.data[0].get("role", "member")
                logger.info("User org membership: org=%s, role=%s", organization_id, role)
            else:
                logger.info("User has no organization membership")
        except Exception as org_err:
            logger.warning("Failed to fetch org membership: %s", org_err)
            # Continue without org data — superadmin bypass doesn't need it

        return {
            "id": user.id,
            "email": user.email,
            "organization_id": organization_id,
            "role": role,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Authentication failed: %s", e, exc_info=True)
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")