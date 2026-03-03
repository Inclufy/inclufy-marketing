"""Content library router - stores and manages generated content."""
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from supabase import Client

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/content-library", tags=["Content Library"])


class ContentItemCreate(BaseModel):
    title: str
    content_type: str  # email, social, landing_page, blog, tutorial, commercial, image
    content: dict = {}  # The actual content (HTML, text, JSON sections, etc.)
    metadata: dict = {}  # Extra info: platform, campaign_id, etc.
    tags: List[str] = []

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("content_type")
    @classmethod
    def valid_type(cls, v):
        allowed = {"email", "social", "landing_page", "blog", "tutorial", "commercial", "image", "other"}
        if v not in allowed:
            raise ValueError(f"content_type must be one of {allowed}")
        return v


class ContentItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[dict] = None
    metadata: Optional[dict] = None
    tags: Optional[List[str]] = None


@router.get("/")
def list_content_items(
    content_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """List all content items for the current organization."""
    org_id = current_user.get("organization_id")
    if not org_id:
        return []

    try:
        query = db.table("content_items").select("*").eq("organization_id", org_id)

        if content_type:
            query = query.eq("content_type", content_type)

        if search:
            query = query.ilike("title", f"%{search}%")

        query = query.order("created_at", desc=True)
        result = query.execute()
        return result.data or []
    except Exception as e:
        logger.error("Failed to list content items: %s", e)
        raise HTTPException(status_code=500, detail="Failed to list content")


@router.post("/")
def create_content_item(
    data: ContentItemCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Save a new content item."""
    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization found")

    try:
        result = db.table("content_items").insert({
            "organization_id": org_id,
            "created_by": current_user.get("id"),
            "title": data.title,
            "content_type": data.content_type,
            "content": data.content,
            "metadata": data.metadata,
            "tags": data.tags,
        }).execute()

        return result.data[0] if result.data else {"success": True}
    except Exception as e:
        logger.error("Failed to create content item: %s", e)
        raise HTTPException(status_code=500, detail="Failed to save content")


@router.get("/stats")
def get_content_stats(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Get content library statistics."""
    org_id = current_user.get("organization_id")
    if not org_id:
        return {"total": 0, "by_type": {}}

    try:
        result = db.table("content_items").select(
            "content_type"
        ).eq("organization_id", org_id).execute()

        items = result.data or []
        by_type = {}
        for item in items:
            ct = item.get("content_type", "other")
            by_type[ct] = by_type.get(ct, 0) + 1

        return {"total": len(items), "by_type": by_type}
    except Exception as e:
        logger.error("Failed to get content stats: %s", e)
        return {"total": 0, "by_type": {}}


@router.get("/{item_id}")
def get_content_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Get a specific content item."""
    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization found")

    try:
        result = db.table("content_items").select("*").eq(
            "id", item_id
        ).eq("organization_id", org_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Content item not found")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get content item: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch content item")


@router.patch("/{item_id}")
def update_content_item(
    item_id: str,
    data: ContentItemUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update a content item."""
    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization found")

    updates = {k: v for k, v in data.dict(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        result = db.table("content_items").update(updates).eq(
            "id", item_id
        ).eq("organization_id", org_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Content item not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update content item: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update content item")


@router.delete("/{item_id}")
def delete_content_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Delete a content item."""
    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization found")

    try:
        db.table("content_items").delete().eq(
            "id", item_id
        ).eq("organization_id", org_id).execute()
        return {"success": True}
    except Exception as e:
        logger.error("Failed to delete content item: %s", e)
        raise HTTPException(status_code=500, detail="Failed to delete content item")
