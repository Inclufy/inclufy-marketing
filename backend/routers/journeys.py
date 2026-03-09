"""Journey management router – build, activate, and enroll contacts."""
import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, field_validator
from supabase import Client

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/journeys", tags=["Journeys"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _validate_uuid(value: str) -> str:
    try:
        uuid.UUID(value, version=4)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid UUID format: '{value}'",
        )
    return value


def _get_journey_or_404(db: Client, journey_id: str, org_id: str) -> dict:
    """Fetch a journey scoped to the organisation or raise 404."""
    try:
        result = (
            db.table("journeys")
            .select("*")
            .eq("id", journey_id)
            .eq("organization_id", org_id)
            .neq("status", "archived")
            .single()
            .execute()
        )
        return result.data
    except Exception:
        raise HTTPException(status_code=404, detail="Journey not found")


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------

class JourneyCreateInput(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: Optional[list] = None
    edges: Optional[list] = None
    entry_rules: Optional[dict] = None
    exit_rules: Optional[dict] = None
    settings: Optional[dict] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Journey name cannot be empty")
        return v.strip()


class JourneyUpdateInput(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[list] = None
    edges: Optional[list] = None
    entry_rules: Optional[dict] = None
    exit_rules: Optional[dict] = None
    settings: Optional[dict] = None


class EnrollContactsInput(BaseModel):
    contact_ids: List[str]

    @field_validator("contact_ids")
    @classmethod
    def at_least_one(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("contact_ids must contain at least one ID")
        return v


# ---------------------------------------------------------------------------
# 1. POST /journeys/ – Create a new journey
# ---------------------------------------------------------------------------

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_journey(
    data: JourneyCreateInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Create a new journey in *draft* status."""
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            raise HTTPException(status_code=403, detail="No organization found for user")

        record = {
            "organization_id": org_id,
            "name": data.name,
            "description": data.description,
            "status": "draft",
            "nodes": data.nodes or [],
            "edges": data.edges or [],
            "entry_rules": data.entry_rules or {},
            "exit_rules": data.exit_rules or {},
            "settings": data.settings or {},
            "created_by": current_user["id"],
            "updated_by": current_user["id"],
        }
        result = db.table("journeys").insert(record).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create journey: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create journey")


# ---------------------------------------------------------------------------
# 2. GET /journeys/ – List journeys with enrollment counts
# ---------------------------------------------------------------------------

@router.get("/")
def list_journeys(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """List all journeys for the user's organisation, including enrollment counts."""
    try:
        org_id = current_user.get("organization_id")
        if not org_id:
            return {"journeys": []}

        query = (
            db.table("journeys")
            .select("*, journey_enrollments(count)")
            .eq("organization_id", org_id)
            .neq("status", "archived")
        )
        if status_filter:
            query = query.eq("status", status_filter)
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        result = query.execute()

        journeys = []
        for row in result.data or []:
            enrollment_info = row.pop("journey_enrollments", [])
            if isinstance(enrollment_info, list) and enrollment_info:
                row["enrollment_count"] = enrollment_info[0].get("count", 0)
            else:
                row["enrollment_count"] = 0
            journeys.append(row)

        return {"journeys": journeys}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list journeys: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve journeys")


# ---------------------------------------------------------------------------
# 3. GET /journeys/{journey_id} – Journey detail with enrollment stats
# ---------------------------------------------------------------------------

@router.get("/{journey_id}")
def get_journey(
    journey_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Return full journey definition together with enrollment statistics."""
    _validate_uuid(journey_id)
    org_id = current_user.get("organization_id")
    journey = _get_journey_or_404(db, journey_id, org_id)

    # Fetch enrollment stats per status
    try:
        enrollments_result = (
            db.table("journey_enrollments")
            .select("status")
            .eq("journey_id", journey_id)
            .execute()
        )
        enrollments = enrollments_result.data or []
        stats = {"active": 0, "completed": 0, "exited": 0, "goal_reached": 0}
        for e in enrollments:
            s = e.get("status")
            if s in stats:
                stats[s] += 1
        journey["enrollment_stats"] = stats
        journey["enrollment_count"] = sum(stats.values())
    except Exception as e:
        logger.warning("Could not fetch enrollment stats for journey %s: %s", journey_id, e)
        journey["enrollment_stats"] = {}
        journey["enrollment_count"] = 0

    return journey


# ---------------------------------------------------------------------------
# 4. PUT /journeys/{journey_id} – Update journey definition
# ---------------------------------------------------------------------------

@router.put("/{journey_id}")
def update_journey(
    journey_id: str,
    data: JourneyUpdateInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Update a journey's definition. Only allowed when status is *draft* or *paused*."""
    _validate_uuid(journey_id)
    try:
        org_id = current_user.get("organization_id")
        journey = _get_journey_or_404(db, journey_id, org_id)

        if journey["status"] not in ("draft", "paused"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot edit a journey with status '{journey['status']}'. "
                       "Only draft or paused journeys can be updated.",
            )

        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        updates["updated_by"] = current_user["id"]

        result = (
            db.table("journeys")
            .update(updates)
            .eq("id", journey_id)
            .eq("organization_id", org_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Journey not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update journey %s: %s", journey_id, e)
        raise HTTPException(status_code=500, detail="Failed to update journey")


# ---------------------------------------------------------------------------
# 5. DELETE /journeys/{journey_id} – Soft-delete (archive)
# ---------------------------------------------------------------------------

@router.delete("/{journey_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journey(
    journey_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Soft-delete a journey by setting its status to *archived*."""
    _validate_uuid(journey_id)
    try:
        org_id = current_user.get("organization_id")
        result = (
            db.table("journeys")
            .update({"status": "archived", "updated_by": current_user["id"]})
            .eq("id", journey_id)
            .eq("organization_id", org_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Journey not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to archive journey %s: %s", journey_id, e)
        raise HTTPException(status_code=500, detail="Failed to delete journey")


# ---------------------------------------------------------------------------
# 6. POST /journeys/{journey_id}/activate
# ---------------------------------------------------------------------------

@router.post("/{journey_id}/activate")
def activate_journey(
    journey_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Transition a journey from *draft* or *paused* to *active*."""
    _validate_uuid(journey_id)
    try:
        org_id = current_user.get("organization_id")
        journey = _get_journey_or_404(db, journey_id, org_id)

        if journey["status"] not in ("draft", "paused"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot activate a journey with status '{journey['status']}'. "
                       "Only draft or paused journeys can be activated.",
            )

        result = (
            db.table("journeys")
            .update({"status": "active", "updated_by": current_user["id"]})
            .eq("id", journey_id)
            .eq("organization_id", org_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Journey not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to activate journey %s: %s", journey_id, e)
        raise HTTPException(status_code=500, detail="Failed to activate journey")


# ---------------------------------------------------------------------------
# 7. POST /journeys/{journey_id}/pause
# ---------------------------------------------------------------------------

@router.post("/{journey_id}/pause")
def pause_journey(
    journey_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Transition a journey from *active* to *paused*."""
    _validate_uuid(journey_id)
    try:
        org_id = current_user.get("organization_id")
        journey = _get_journey_or_404(db, journey_id, org_id)

        if journey["status"] != "active":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot pause a journey with status '{journey['status']}'. "
                       "Only active journeys can be paused.",
            )

        result = (
            db.table("journeys")
            .update({"status": "paused", "updated_by": current_user["id"]})
            .eq("id", journey_id)
            .eq("organization_id", org_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Journey not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to pause journey %s: %s", journey_id, e)
        raise HTTPException(status_code=500, detail="Failed to pause journey")


# ---------------------------------------------------------------------------
# 8. POST /journeys/{journey_id}/enroll – Enroll contacts
# ---------------------------------------------------------------------------

@router.post("/{journey_id}/enroll")
def enroll_contacts(
    journey_id: str,
    data: EnrollContactsInput,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Enroll one or more contacts into the journey."""
    _validate_uuid(journey_id)
    try:
        org_id = current_user.get("organization_id")
        journey = _get_journey_or_404(db, journey_id, org_id)

        if journey["status"] != "active":
            raise HTTPException(
                status_code=400,
                detail="Contacts can only be enrolled in an active journey.",
            )

        # Determine the first trigger node (first node in the list)
        nodes = journey.get("nodes") or []
        first_node_id = nodes[0]["id"] if nodes else None

        records = []
        for contact_id in data.contact_ids:
            _validate_uuid(contact_id)
            records.append({
                "journey_id": journey_id,
                "contact_id": contact_id,
                "status": "active",
                "current_node_id": first_node_id,
                "path": [first_node_id] if first_node_id else [],
                "context_data": {},
            })

        result = db.table("journey_enrollments").insert(records).execute()
        return {
            "enrolled": len(result.data),
            "enrollments": result.data,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to enroll contacts in journey %s: %s", journey_id, e)
        raise HTTPException(status_code=500, detail="Failed to enroll contacts")


# ---------------------------------------------------------------------------
# 9. GET /journeys/{journey_id}/enrollments – List enrollments
# ---------------------------------------------------------------------------

@router.get("/{journey_id}/enrollments")
def list_enrollments(
    journey_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """List enrollments for a specific journey."""
    _validate_uuid(journey_id)
    try:
        org_id = current_user.get("organization_id")
        # Verify journey belongs to this org (also ensures it exists)
        _get_journey_or_404(db, journey_id, org_id)

        query = (
            db.table("journey_enrollments")
            .select("*")
            .eq("journey_id", journey_id)
        )
        if status_filter:
            query = query.eq("status", status_filter)
        query = query.order("entered_at", desc=True).range(offset, offset + limit - 1)
        result = query.execute()

        return {"enrollments": result.data or []}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list enrollments for journey %s: %s", journey_id, e)
        raise HTTPException(status_code=500, detail="Failed to retrieve enrollments")
