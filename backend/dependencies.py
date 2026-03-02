# backend/dependencies.py
from fastapi import Header, HTTPException
from typing import Optional
from supabase import Client
from config.supabase import get_db

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
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user = user_response.user

        # Fetch organization membership
        org_response = db.from_("organization_members") \
            .select("organization_id, role") \
            .eq("user_id", user.id) \
            .limit(1) \
            .execute()

        organization_id = None
        if org_response.data and len(org_response.data) > 0:
            organization_id = org_response.data[0]["organization_id"]

        return {
            "id": user.id,
            "email": user.email,
            "organization_id": organization_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")