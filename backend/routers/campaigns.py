from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime
from supabase import Client
from pydantic import BaseModel, field_validator
import uuid
import logging

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])


def validate_uuid(value: str) -> str:
    try:
        uuid.UUID(value, version=4)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid UUID format: '{value}'",
        )
    return value


class CampaignCreateInput(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    budget_amount: Optional[float] = None
    audience_filters: Optional[dict] = None
    content: Optional[dict] = None
    settings: Optional[dict] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Campaign name cannot be empty")
        return v.strip()

    @field_validator("type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        allowed = {"email", "sms", "push", "multi-channel"}
        if v not in allowed:
            raise ValueError(f"type must be one of {allowed}")
        return v


class CampaignUpdateInput(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    budget_amount: Optional[float] = None
    audience_filters: Optional[dict] = None
    content: Optional[dict] = None
    settings: Optional[dict] = None


@router.get("/")
def list_campaigns(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return []

        query = db.table("campaigns").select("*").eq("organization_id", org_id)
        if status_filter:
            query = query.eq("status", status_filter)
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        result = query.execute()
        return result.data or []
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list campaigns: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve campaigns")


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_campaign(
    data: CampaignCreateInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            raise HTTPException(status_code=403, detail="No organization found for user")

        record = {
            "organization_id": org_id,
            "name": data.name,
            "type": data.type,
            "description": data.description,
            "status": "draft",
            "starts_at": data.starts_at,
            "ends_at": data.ends_at,
            "budget_amount": data.budget_amount,
            "audience_filters": data.audience_filters or {},
            "content": data.content or {},
            "settings": data.settings or {},
            "created_by": current_user["id"],
        }
        result = db.table("campaigns").insert(record).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create campaign: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create campaign")


@router.get("/{campaign_id}")
def get_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    validate_uuid(campaign_id)
    try:
        org_id = current_user.get("organization_id")
        result = db.table("campaigns").select("*").eq("id", campaign_id).eq("organization_id", org_id).single().execute()
        return result.data
    except Exception as e:
        logger.error("Campaign not found %s: %s", campaign_id, e)
        raise HTTPException(status_code=404, detail="Campaign not found")


@router.patch("/{campaign_id}")
def update_campaign(
    campaign_id: str,
    data: CampaignUpdateInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    validate_uuid(campaign_id)
    try:
        org_id = current_user.get("organization_id")
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        updates["updated_by"] = current_user["id"]

        result = db.table("campaigns").update(updates).eq("id", campaign_id).eq("organization_id", org_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update campaign %s: %s", campaign_id, e)
        raise HTTPException(status_code=500, detail="Failed to update campaign")


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    validate_uuid(campaign_id)
    try:
        org_id = current_user.get("organization_id")
        db.table("campaigns").delete().eq("id", campaign_id).eq("organization_id", org_id).execute()
    except Exception as e:
        logger.error("Failed to delete campaign %s: %s", campaign_id, e)
        raise HTTPException(status_code=500, detail="Failed to delete campaign")
