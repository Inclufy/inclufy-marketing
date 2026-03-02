from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from supabase import Client
from pydantic import BaseModel, field_validator
import uuid
import logging

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/brand-memory", tags=["Brand Memory"])


def validate_uuid(value: str) -> str:
    try:
        uuid.UUID(value, version=4)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid UUID format: '{value}'",
        )
    return value


class BrandKitInput(BaseModel):
    name: str
    primary_color: str = "#7C3AED"
    secondary_color: str = "#10B981"
    font_family: Optional[str] = None
    logo_url: Optional[str] = None
    tagline: Optional[str] = None
    is_default: bool = False

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Brand kit name cannot be empty")
        return v.strip()

    @field_validator("primary_color", "secondary_color")
    @classmethod
    def valid_color(cls, v):
        import re
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError(f"Invalid hex color: {v}")
        return v


class BrandDocumentInput(BaseModel):
    type: str
    content: str
    title: Optional[str] = None


@router.get("/kits")
def list_brand_kits(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    try:
        result = db.table("brand_kits").select("*").order("created_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        logger.error("Failed to list brand kits: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve brand kits")


@router.post("/kits", status_code=status.HTTP_201_CREATED)
def create_brand_kit(
    data: BrandKitInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    try:
        record = {
            "name": data.name,
            "primary_color": data.primary_color,
            "secondary_color": data.secondary_color,
            "font_family": data.font_family,
            "logo_url": data.logo_url,
            "tagline": data.tagline,
            "is_default": data.is_default,
        }
        result = db.table("brand_kits").insert(record).execute()
        return result.data[0]
    except Exception as e:
        logger.error("Failed to create brand kit: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create brand kit")


@router.patch("/kits/{kit_id}")
def update_brand_kit(
    kit_id: str,
    data: BrandKitInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    validate_uuid(kit_id)
    try:
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        result = db.table("brand_kits").update(updates).eq("id", kit_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Brand kit not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update brand kit %s: %s", kit_id, e)
        raise HTTPException(status_code=500, detail="Failed to update brand kit")


@router.delete("/kits/{kit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand_kit(
    kit_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    validate_uuid(kit_id)
    try:
        db.table("brand_kits").delete().eq("id", kit_id).execute()
    except Exception as e:
        logger.error("Failed to delete brand kit %s: %s", kit_id, e)
        raise HTTPException(status_code=500, detail="Failed to delete brand kit")


@router.post("/documents/process")
def process_brand_document(
    data: BrandDocumentInput,
    current_user: dict = Depends(get_current_user),
):
    """Process a brand document and extract knowledge."""
    try:
        import os
        import openai

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="AI service not configured")

        client = openai.OpenAI(api_key=api_key)
        prompt = (
            f"Analyze this {data.type} document and extract brand knowledge:\n\n"
            f"{data.content[:3000]}\n\n"
            "Return JSON with: brand_voice, key_messages, target_audience, brand_values, unique_selling_points."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "You are a brand strategist."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        return {"result": response.choices[0].message.content}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Brand document processing failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to process brand document")
