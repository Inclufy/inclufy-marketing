from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase import Client
from datetime import datetime, timedelta
import logging

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard")
def dashboard_stats(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return {
                "campaigns": {"total": 0, "active": 0},
                "contacts": {"total": 0},
                "events": {"total": 0},
                "revenue": {"total": 0},
            }

        campaigns = db.table("campaigns").select("id, status").eq("organization_id", org_id).execute()
        contacts = db.table("contacts").select("id", count="exact").eq("organization_id", org_id).execute()

        campaign_list = campaigns.data or []
        return {
            "campaigns": {
                "total": len(campaign_list),
                "active": sum(1 for c in campaign_list if c.get("status") == "active"),
                "draft": sum(1 for c in campaign_list if c.get("status") == "draft"),
            },
            "contacts": {
                "total": contacts.count if hasattr(contacts, "count") and contacts.count else len(contacts.data or []),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get dashboard stats: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard statistics")


@router.get("/campaigns/{campaign_id}")
def campaign_analytics(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    try:
        org_id = current_user.get("organization_id")

        # Verify campaign belongs to org
        campaign = db.table("campaigns").select("id, name, status, type").eq("id", campaign_id).eq("organization_id", org_id).single().execute()

        # Get events for this campaign
        events = db.table("events").select("event_type").eq("campaign_id", campaign_id).execute()
        event_list = events.data or []

        sent = sum(1 for e in event_list if e.get("event_type") == "email_sent")
        opened = sum(1 for e in event_list if e.get("event_type") == "email_opened")
        clicked = sum(1 for e in event_list if e.get("event_type") == "email_clicked")

        return {
            "campaign": campaign.data,
            "metrics": {
                "sent": sent,
                "opened": opened,
                "clicked": clicked,
                "open_rate": round((opened / sent * 100), 1) if sent > 0 else 0,
                "click_rate": round((clicked / sent * 100), 1) if sent > 0 else 0,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get campaign analytics %s: %s", campaign_id, e)
        raise HTTPException(status_code=500, detail="Failed to retrieve campaign analytics")


@router.get("/events")
def list_events(
    event_type: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return []

        query = db.table("events").select("*").eq("organization_id", org_id)
        if event_type:
            query = query.eq("event_type", event_type)
        query = query.order("timestamp", desc=True).limit(limit)
        result = query.execute()
        return result.data or []
    except Exception as e:
        logger.error("Failed to list events: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve events")
