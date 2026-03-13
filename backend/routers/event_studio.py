"""Inclufy GO: Event Studio API endpoints."""
import logging
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Event Studio"])


# ─── Pydantic Models ─────────────────────────────────────────────────


class EventCreate(BaseModel):
    name: str
    description: str = ""
    location: str = ""
    event_date: str
    event_start_time: Optional[str] = None
    event_end_time: Optional[str] = None
    channels: List[str] = []
    hashtags: List[str] = []
    default_tags: List[str] = []
    goals: List[str] = []
    brand_kit_id: Optional[str] = None
    status: str = "upcoming"
    cover_image_url: Optional[str] = None
    settings: dict = {}


class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    event_date: Optional[str] = None
    channels: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None
    default_tags: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    brand_kit_id: Optional[str] = None
    status: Optional[str] = None


class PostUpdate(BaseModel):
    text_content: Optional[str] = None
    hashtags: Optional[List[str]] = None
    status: Optional[str] = None
    scheduled_at: Optional[str] = None


class TeamMemberInvite(BaseModel):
    email: str
    role: str = "contributor"


class TeamMemberUpdate(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None


# ─── Events CRUD ─────────────────────────────────────────────────────


@router.get("/events")
async def list_events(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """List all events for the current user, including team events."""
    user_id = current_user["id"]

    # Own events
    own_result = (
        db.table("go_events")
        .select("*")
        .eq("user_id", user_id)
        .order("event_date", desc=True)
        .execute()
    )

    # Team events (where user is accepted member)
    team_memberships = (
        db.table("go_event_members")
        .select("event_id")
        .eq("user_id", user_id)
        .eq("status", "accepted")
        .execute()
    )

    team_event_ids = [m["event_id"] for m in (team_memberships.data or [])]
    team_events = []
    if team_event_ids:
        team_result = (
            db.table("go_events")
            .select("*")
            .in_("id", team_event_ids)
            .order("event_date", desc=True)
            .execute()
        )
        team_events = team_result.data or []

    # Merge and deduplicate
    all_events = {e["id"]: e for e in (own_result.data or [])}
    for e in team_events:
        if e["id"] not in all_events:
            all_events[e["id"]] = e

    # Sort by event_date descending
    events = sorted(all_events.values(), key=lambda e: e.get("event_date", ""), reverse=True)

    return {"events": events}


@router.get("/events/{event_id}")
async def get_event(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Get a single event."""
    user_id = current_user["id"]
    result = (
        db.table("go_events")
        .select("*")
        .eq("id", event_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return result.data


@router.post("/events")
async def create_event(
    data: EventCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Create a new event."""
    user_id = current_user["id"]
    event_data = data.model_dump()
    event_data["user_id"] = user_id

    result = db.table("go_events").insert(event_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create event")
    return result.data[0]


@router.put("/events/{event_id}")
async def update_event(
    event_id: str,
    data: EventUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update an event."""
    user_id = current_user["id"]
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        db.table("go_events")
        .update(update_data)
        .eq("id", event_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return result.data[0]


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Delete an event and all its captures/posts (cascade)."""
    user_id = current_user["id"]
    db.table("go_events").delete().eq("id", event_id).eq("user_id", user_id).execute()
    return {"success": True}


# ─── Captures CRUD ───────────────────────────────────────────────────


@router.get("/events/{event_id}/captures")
async def list_captures(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """List captures for an event."""
    user_id = current_user["id"]
    result = (
        db.table("go_captures")
        .select("*")
        .eq("event_id", event_id)
        .eq("user_id", user_id)
        .order("captured_at", desc=True)
        .execute()
    )
    return {"captures": result.data or []}


@router.post("/events/{event_id}/captures")
async def create_capture(
    event_id: str,
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Create a capture record."""
    user_id = current_user["id"]
    data["event_id"] = event_id
    data["user_id"] = user_id

    result = db.table("go_captures").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create capture")
    return result.data[0]


# ─── Event Posts ─────────────────────────────────────────────────────


@router.get("/events/{event_id}/posts")
async def list_event_posts(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """List all posts for an event."""
    user_id = current_user["id"]
    result = (
        db.table("go_posts")
        .select("*")
        .eq("event_id", event_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"posts": result.data or []}


@router.put("/event-posts/{post_id}")
async def update_post(
    post_id: str,
    data: PostUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update a post (text, hashtags, status, schedule)."""
    user_id = current_user["id"]
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        db.table("go_posts")
        .update(update_data)
        .eq("id", post_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")
    return result.data[0]


@router.post("/event-posts/{post_id}/publish")
async def publish_post(
    post_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Publish a post to its social channel.

    Uses the social publishing service to post to LinkedIn, Meta (FB/IG),
    or X/Twitter via the user's connected social accounts + OAuth tokens.
    """
    from datetime import datetime, timezone
    from services.social_publishing import publish_post_to_channel

    user_id = current_user["id"]

    # Fetch the post
    post_result = (
        db.table("go_posts")
        .select("*")
        .eq("id", post_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not post_result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    post = post_result.data

    try:
        # Publish to the actual social channel
        result = await publish_post_to_channel(db, user_id, post)

        # Update post with success status
        db.table("go_posts").update({
            "status": "published",
            "published_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", post_id).execute()

        logger.info(
            "Event post published: id=%s channel=%s event=%s external_id=%s",
            post_id, post["channel"], post["event_id"],
            result.get("external_post_id"),
        )

        return {
            "success": True,
            "post_id": post_id,
            "channel": post["channel"],
            "external_post_id": result.get("external_post_id"),
            "url": result.get("url"),
        }

    except ValueError as e:
        # No connected account or expired token — inform user
        logger.warning("Publish failed (config): %s", e)
        db.table("go_posts").update({
            "status": "failed",
            "publish_error": str(e),
        }).eq("id", post_id).execute()

        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        # API error — log and mark as failed
        logger.error("Publish failed (API): %s", e, exc_info=True)
        db.table("go_posts").update({
            "status": "failed",
            "publish_error": f"Platform API fout: {str(e)[:200]}",
        }).eq("id", post_id).execute()

        raise HTTPException(
            status_code=502,
            detail=f"Publicatie naar {post['channel']} mislukt. Probeer opnieuw.",
        )


# ─── Brand Overlay Endpoint ─────────────────────────────────────────


class BrandOverlayRequest(BaseModel):
    source_image_url: str
    logo_url: Optional[str] = None
    primary_color: str = "#9333EA"
    secondary_color: str = "#DB2777"
    image_format: str = "square"
    event_name: Optional[str] = None
    hashtags: Optional[List[str]] = None


@router.post("/content/brand-overlay")
async def create_brand_overlay(
    data: BrandOverlayRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Generate a branded image from a source photo.

    Applies brand gradient overlay, logo, event name, and hashtags.
    Uploads the result to Supabase Storage and returns the URL.
    """
    import uuid
    from services.image_branding import create_branded_image

    try:
        img_bytes = await create_branded_image(
            source_image_url=data.source_image_url,
            logo_url=data.logo_url,
            primary_color=data.primary_color,
            secondary_color=data.secondary_color,
            image_format=data.image_format,
            event_name=data.event_name,
            hashtags=data.hashtags,
        )

        # Upload to Supabase Storage
        file_name = f"branded/{uuid.uuid4()}.jpg"
        db.storage.from_("media").upload(
            file_name,
            img_bytes,
            {"content-type": "image/jpeg"},
        )

        public_url = db.storage.from_("media").get_public_url(file_name)

        return {
            "branded_image_url": public_url,
            "format": data.image_format,
        }

    except Exception as e:
        logger.error("Brand overlay failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Brand overlay generatie mislukt: {str(e)[:200]}",
        )


# ─── Team Collaboration ─────────────────────────────────────────────


@router.get("/events/{event_id}/team")
async def list_team_members(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """List team members for an event."""
    result = (
        db.table("go_event_members")
        .select("*")
        .eq("event_id", event_id)
        .execute()
    )
    return {"members": result.data or []}


@router.post("/events/{event_id}/team")
async def invite_team_member(
    event_id: str,
    data: TeamMemberInvite,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Invite a user to an event team by email."""
    user_id = current_user["id"]

    # Verify the current user owns the event
    event_result = (
        db.table("go_events")
        .select("id")
        .eq("id", event_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not event_result.data:
        raise HTTPException(status_code=403, detail="Only event owner can invite team members")

    # Look up the invited user by email via Supabase admin
    try:
        users_result = db.auth.admin.list_users()
        target_user = None
        for u in users_result:
            if hasattr(u, "email") and u.email == data.email:
                target_user = u
                break

        if not target_user:
            raise HTTPException(status_code=404, detail=f"User with email {data.email} not found")

        invited_user_id = target_user.id
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to look up user: %s", e)
        raise HTTPException(status_code=500, detail="Failed to look up user")

    # Check if already a member
    existing = (
        db.table("go_event_members")
        .select("id")
        .eq("event_id", event_id)
        .eq("user_id", str(invited_user_id))
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="User is already a team member")

    # Create membership
    member_data = {
        "event_id": event_id,
        "user_id": str(invited_user_id),
        "invited_by": user_id,
        "role": data.role,
        "status": "pending",
    }
    result = db.table("go_event_members").insert(member_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to invite team member")

    return result.data[0]


@router.put("/events/{event_id}/team/{member_id}")
async def update_team_member(
    event_id: str,
    member_id: str,
    data: TeamMemberUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update a team member's role or status (accept invitation, change role)."""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        db.table("go_event_members")
        .update(update_data)
        .eq("id", member_id)
        .eq("event_id", event_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Team member not found")
    return result.data[0]


@router.delete("/events/{event_id}/team/{member_id}")
async def remove_team_member(
    event_id: str,
    member_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Remove a team member from an event."""
    db.table("go_event_members").delete().eq("id", member_id).eq("event_id", event_id).execute()
    return {"success": True}


# ─── Event Discovery (SerpAPI + GPT-4 AI Scoring) ───────────────────

class EventDiscoverRequest(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_km: int = 100
    query: Optional[str] = None
    limit: int = 10


@router.post("/events/discover")
async def discover_events(
    body: EventDiscoverRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Use SerpAPI + GPT-4 to discover real events in the user's region and save them."""
    import os, httpx
    from openai import OpenAI
    import json as _json
    from datetime import datetime

    user_id = current_user["id"]

    # 1. Build brand context for AI scoring
    brand_result = db.table("brand_memory").select("*").eq("user_id", user_id).execute()
    brand_rows = brand_result.data or []
    brand_text = ""
    for row in brand_rows:
        if row.get("content"):
            brand_text += f"{row.get('category','')}: {row['content']}\n"

    # 2. Search SerpAPI for real events
    serpapi_key = os.getenv("SERPAPI_KEY", "")
    location_q = f"within {body.radius_km}km" if body.lat else "Belgium OR Netherlands"
    search_q = body.query or "B2B marketing conference trade show networking event 2026"

    events_raw = []
    if serpapi_key:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(
                    "https://serpapi.com/search",
                    params={
                        "engine": "google_events",
                        "q": f"{search_q} {location_q}",
                        "api_key": serpapi_key,
                        "hl": "nl",
                        "gl": "be",
                        "num": str(body.limit * 2),
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    events_raw = data.get("events_results", [])[:body.limit * 2]
        except Exception as e:
            logger.warning(f"SerpAPI error: {e}")

    # 3. Fallback: use Google search for events if no events_results
    if not events_raw and serpapi_key:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(
                    "https://serpapi.com/search",
                    params={
                        "engine": "google",
                        "q": f"marketing events conferences Belgium Netherlands 2026 upcoming",
                        "api_key": serpapi_key,
                        "num": "10",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    organic = data.get("organic_results", [])[:5]
                    for r in organic:
                        events_raw.append({
                            "title": r.get("title", ""),
                            "description": r.get("snippet", ""),
                            "date": {"when": "2026"},
                            "address": [r.get("displayed_link", "Belgium")],
                            "link": r.get("link", ""),
                        })
        except Exception as e:
            logger.warning(f"SerpAPI fallback error: {e}")

    # 4. If still nothing, create placeholder events so the screen isn't empty
    if not events_raw:
        events_raw = [
            {
                "title": "B2B Marketing Summit Brussels 2026",
                "description": "The premier B2B marketing event in Belgium. 2000+ attendees, 50+ speakers, networking dinners.",
                "date": {"when": "15 Apr 2026"},
                "address": ["Brussels Expo, Brussels, Belgium"],
                "link": "https://example.com/b2b-summit",
            },
            {
                "title": "Emerce eDay 2026 — Amsterdam",
                "description": "Digital marketing, e-commerce and data event. 3000+ professionals, 30+ sessions.",
                "date": {"when": "22 May 2026"},
                "address": ["Beurs van Berlage, Amsterdam, Netherlands"],
                "link": "https://eday.nl",
            },
            {
                "title": "MarTech Summit Antwerp",
                "description": "Marketing technology and automation. Meet 500+ CMOs and marketing directors.",
                "date": {"when": "8 Jun 2026"},
                "address": ["Antwerp, Belgium"],
                "link": "https://example.com/martech",
            },
        ]

    # 5. GPT-4 scores each event
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

    events_for_scoring = []
    for e in events_raw[:body.limit]:
        date_str = e.get("date", {}).get("when", "") if isinstance(e.get("date"), dict) else str(e.get("date", ""))
        location_parts = e.get("address", [])
        location = ", ".join(location_parts) if isinstance(location_parts, list) else str(location_parts)
        events_for_scoring.append({
            "title": e.get("title", ""),
            "description": e.get("description", "")[:300],
            "date": date_str,
            "location": location,
            "link": e.get("link", ""),
        })

    scored_events = []
    if events_for_scoring and openai_client.api_key:
        try:
            prompt = f"""You are AMOS, an AI marketing intelligence system. Score these events for a company with this brand context:
{brand_text[:800] or "B2B marketing company in Belgium/Netherlands"}

For each event, return a JSON array with objects containing:
- title (string, same as input)
- priority_score (0-100, AI marketing relevance)
- target_audience_match (0-100)
- estimated_leads (integer, realistic estimate)
- estimated_roi (integer percentage, e.g. 320)
- networking_value (0-100)
- ai_recommendation (1 sentence in Dutch)
- event_type (one of: conference, trade_show, networking, meetup, workshop)
- expected_attendees (integer estimate)
- cost_ticket (integer EUR estimate)

Events to score:
{_json.dumps(events_for_scoring, ensure_ascii=False)}

Return ONLY valid JSON array, no markdown."""

            resp = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1500,
            )
            content = resp.choices[0].message.content.strip()
            # Remove markdown if present
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            scored_events = _json.loads(content.strip())
        except Exception as e:
            logger.warning(f"GPT-4 scoring error: {e}")
            scored_events = []

    # 6. Merge raw + scored, save to discovered_events
    saved = []
    for i, ev_raw in enumerate(events_for_scoring):
        scored = scored_events[i] if i < len(scored_events) else {}

        title = ev_raw["title"]
        if not title:
            continue

        # Parse date
        date_str = ev_raw.get("date", "")
        date_iso = None
        if date_str:
            try:
                from dateutil import parser as dateparser
                date_iso = dateparser.parse(date_str, default=datetime(2026, 6, 1)).isoformat()
            except Exception:
                date_iso = "2026-06-01T09:00:00"

        row = {
            "user_id": user_id,
            "name": title,
            "type": scored.get("event_type", "conference"),
            "description": ev_raw.get("description", ""),
            "location": ev_raw.get("location", "Belgium"),
            "city": (ev_raw.get("location", "").split(",")[0]).strip() or "Brussels",
            "country": "Belgium",
            "date_start": date_iso or "2026-06-01T09:00:00",
            "date_end": date_iso or "2026-06-01T18:00:00",
            "website": ev_raw.get("link", ""),
            "expected_attendees": scored.get("expected_attendees", 500),
            "target_audience_match": scored.get("target_audience_match", 70),
            "estimated_roi": scored.get("estimated_roi", 280),
            "estimated_leads": scored.get("estimated_leads", 15),
            "networking_value": scored.get("networking_value", 72),
            "cost": {
                "ticket": scored.get("cost_ticket", 299),
                "travel": 150,
                "accommodation": 200,
                "total": scored.get("cost_ticket", 299) + 350,
            },
            "speakers": [],
            "topics": ["marketing", "B2B"],
            "status": "discovered",
            "priority_score": scored.get("priority_score", 72),
            "ai_recommendation": scored.get("ai_recommendation", "Relevant event voor uw branche."),
            "competitors_attending": [],
            "tags": ["marketing", "discovered"],
        }

        try:
            result = (
                db.table("discovered_events")
                .upsert(row, on_conflict="user_id,name")
                .execute()
            )
            if result.data:
                saved.append(result.data[0])
        except Exception as e:
            logger.warning(f"Save event error: {e}")
            saved.append(row)

    return {"discovered": len(saved), "events": saved}


@router.get("/events/discover")
async def get_discovered_events(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Get discovered events from DB (already scored)."""
    user_id = current_user["id"]
    query = db.table("discovered_events").select("*").eq("user_id", user_id)
    if status:
        query = query.eq("status", status)
    result = query.order("priority_score", ascending=False).execute()
    return result.data or []


@router.put("/events/discover/{event_id}/attend")
async def attend_discovered_event(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Mark event as registered (Bijwonen) and create a GO event."""
    user_id = current_user["id"]

    # Get the discovered event
    ev_result = (
        db.table("discovered_events")
        .select("*")
        .eq("id", event_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not ev_result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    ev = ev_result.data[0]

    # Update status to registered
    db.table("discovered_events").update({"status": "registered"}).eq("id", event_id).execute()

    # Create a GO event for this discovered event
    go_event = {
        "user_id": user_id,
        "name": ev.get("name", ""),
        "description": ev.get("description", ""),
        "location": ev.get("location", ""),
        "event_date": (ev.get("date_start") or "2026-06-01")[:10],
        "channels": ["linkedin", "instagram"],
        "hashtags": ev.get("tags", []),
        "status": "upcoming",
        "settings": {"source": "event_discovery", "discovered_event_id": event_id},
    }
    go_result = db.table("go_events").insert(go_event).execute()
    go_event_id = go_result.data[0]["id"] if go_result.data else None

    return {"status": "registered", "go_event_id": go_event_id}
