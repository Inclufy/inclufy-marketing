from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from supabase import Client
from pydantic import BaseModel, field_validator
import uuid
import logging

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/contacts", tags=["Contacts"])


def validate_uuid(value: str) -> str:
    try:
        uuid.UUID(value, version=4)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid UUID format: '{value}'",
        )
    return value


class ContactCreateInput(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    tags: Optional[List[str]] = []
    attributes: Optional[dict] = {}
    source: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if v and "@" not in v:
            raise ValueError("Invalid email format")
        return v


class ContactUpdateInput(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    tags: Optional[List[str]] = None
    attributes: Optional[dict] = None


@router.get("/")
def list_contacts(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return []

        query = db.table("contacts").select("*").eq("organization_id", org_id)
        if search:
            query = query.or_(f"email.ilike.%{search}%,first_name.ilike.%{search}%,last_name.ilike.%{search}%")
        if tag:
            query = query.contains("tags", [tag])
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        result = query.execute()
        return result.data or []
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list contacts: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve contacts")


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_contact(
    data: ContactCreateInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            raise HTTPException(status_code=403, detail="No organization found for user")

        record = {
            "organization_id": org_id,
            "email": data.email,
            "phone": data.phone,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "country": data.country,
            "city": data.city,
            "tags": data.tags or [],
            "attributes": data.attributes or {},
            "source": data.source or "manual",
        }
        result = db.table("contacts").insert(record).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create contact: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create contact")


@router.get("/{contact_id}")
def get_contact(
    contact_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    validate_uuid(contact_id)
    try:
        org_id = current_user.get("organization_id")
        result = db.table("contacts").select("*").eq("id", contact_id).eq("organization_id", org_id).single().execute()
        return result.data
    except Exception as e:
        logger.error("Contact not found %s: %s", contact_id, e)
        raise HTTPException(status_code=404, detail="Contact not found")


@router.patch("/{contact_id}")
def update_contact(
    contact_id: str,
    data: ContactUpdateInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    validate_uuid(contact_id)
    try:
        org_id = current_user.get("organization_id")
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        result = db.table("contacts").update(updates).eq("id", contact_id).eq("organization_id", org_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Contact not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update contact %s: %s", contact_id, e)
        raise HTTPException(status_code=500, detail="Failed to update contact")


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    validate_uuid(contact_id)
    try:
        org_id = current_user.get("organization_id")
        db.table("contacts").delete().eq("id", contact_id).eq("organization_id", org_id).execute()
    except Exception as e:
        logger.error("Failed to delete contact %s: %s", contact_id, e)
        raise HTTPException(status_code=500, detail="Failed to delete contact")


@router.get("/stats/overview")
def contact_stats(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return {"total": 0, "with_email": 0, "with_consent": 0}

        result = db.table("contacts").select("id, email, email_consent").eq("organization_id", org_id).execute()
        contacts = result.data or []
        return {
            "total": len(contacts),
            "with_email": sum(1 for c in contacts if c.get("email")),
            "with_consent": sum(1 for c in contacts if c.get("email_consent")),
        }
    except Exception as e:
        logger.error("Failed to get contact stats: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve contact statistics")
