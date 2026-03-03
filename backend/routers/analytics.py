from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from supabase import Client
from datetime import datetime, timedelta
from collections import Counter
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


@router.get("/overview")
def analytics_overview(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Comprehensive analytics overview with chart-ready data."""
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return _empty_overview()

        # Fetch all data in parallel-ish
        campaigns_res = db.table("campaigns").select("id, name, status, type, budget_amount, created_at").eq("organization_id", org_id).execute()
        contacts_res = db.table("contacts").select("id, created_at, tags").eq("organization_id", org_id).execute()
        events_res = db.table("events").select("event_type, timestamp, campaign_id").eq("organization_id", org_id).order("timestamp", desc=True).limit(500).execute()

        campaigns = campaigns_res.data or []
        contacts = contacts_res.data or []
        events = events_res.data or []

        # Content library stats
        try:
            content_res = db.table("content_library").select("id, content_type, created_at").eq("organization_id", org_id).execute()
            content_items = content_res.data or []
        except Exception:
            content_items = []

        # --- Campaign breakdown ---
        status_counts = Counter(c.get("status", "unknown") for c in campaigns)
        type_counts = Counter(c.get("type", "other") for c in campaigns)
        total_budget = sum(c.get("budget_amount") or 0 for c in campaigns)

        # --- Email metrics from events ---
        event_types = Counter(e.get("event_type", "") for e in events)
        sent = event_types.get("email_sent", 0)
        opened = event_types.get("email_opened", 0)
        clicked = event_types.get("email_clicked", 0)

        # --- Time-series: campaigns created per month (last 6 months) ---
        campaign_timeline = _monthly_counts(campaigns, "created_at", 6)
        contact_timeline = _monthly_counts(contacts, "created_at", 6)
        content_timeline = _monthly_counts(content_items, "created_at", 6)

        # --- Content type breakdown ---
        content_type_counts = Counter(ci.get("content_type", "other") for ci in content_items)

        return {
            "campaigns": {
                "total": len(campaigns),
                "by_status": dict(status_counts),
                "by_type": dict(type_counts),
                "total_budget": total_budget,
                "timeline": campaign_timeline,
            },
            "contacts": {
                "total": len(contacts),
                "timeline": contact_timeline,
            },
            "emails": {
                "sent": sent,
                "opened": opened,
                "clicked": clicked,
                "open_rate": round(opened / sent * 100, 1) if sent > 0 else 0,
                "click_rate": round(clicked / sent * 100, 1) if sent > 0 else 0,
            },
            "content": {
                "total": len(content_items),
                "by_type": dict(content_type_counts),
                "timeline": content_timeline,
            },
            "events": {
                "total": len(events),
                "by_type": dict(event_types),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get analytics overview: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve analytics overview")


def _empty_overview():
    return {
        "campaigns": {"total": 0, "by_status": {}, "by_type": {}, "total_budget": 0, "timeline": []},
        "contacts": {"total": 0, "timeline": []},
        "emails": {"sent": 0, "opened": 0, "clicked": 0, "open_rate": 0, "click_rate": 0},
        "content": {"total": 0, "by_type": {}, "timeline": []},
        "events": {"total": 0, "by_type": {}},
    }


def _monthly_counts(items: list, date_field: str, months: int) -> list:
    """Count items per month for the last N months."""
    now = datetime.utcnow()
    buckets = []
    for i in range(months - 1, -1, -1):
        d = now - timedelta(days=i * 30)
        buckets.append({"month": d.strftime("%b"), "year": d.year, "count": 0})

    for item in items:
        raw = item.get(date_field)
        if not raw:
            continue
        try:
            dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            month_label = dt.strftime("%b")
            for b in buckets:
                if b["month"] == month_label and b["year"] == dt.year:
                    b["count"] += 1
                    break
        except (ValueError, TypeError):
            continue

    return [{"month": b["month"], "count": b["count"]} for b in buckets]


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
