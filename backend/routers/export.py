from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from supabase import Client
import uuid
import logging

from dependencies import get_current_user, get_supabase_client
from services.pdf_generator import generate_blueprint_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/export", tags=["Export"])


def validate_uuid(value: str) -> str:
    try:
        uuid.UUID(value, version=4)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid UUID format: '{value}'")
    return value


@router.get("/blueprint/{blueprint_id}/pdf")
def export_blueprint_pdf(
    blueprint_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Export a growth blueprint as PDF."""
    validate_uuid(blueprint_id)
    try:
        # Fetch blueprint
        blueprint = db.table("growth_blueprints").select("*").eq("id", blueprint_id).eq("user_id", current_user["id"]).single().execute()
        if not blueprint.data:
            raise HTTPException(status_code=404, detail="Blueprint not found")

        # Fetch related data
        status_quo = db.table("blueprint_status_quo").select("*").eq("blueprint_id", blueprint_id).limit(1).execute()
        vision = db.table("blueprint_vision").select("*").eq("blueprint_id", blueprint_id).limit(1).execute()
        recommendations = db.table("blueprint_recommendations").select("*").eq("blueprint_id", blueprint_id).execute()
        opportunities = db.table("blueprint_opportunities").select("*").eq("blueprint_id", blueprint_id).execute()
        threats = db.table("blueprint_threats").select("*").eq("blueprint_id", blueprint_id).execute()

        blueprint_data = {
            "blueprint": blueprint.data,
            "status_quo": status_quo.data[0] if status_quo.data else {},
            "vision": vision.data[0] if vision.data else {},
            "recommendations": recommendations.data or [],
            "opportunities": opportunities.data or [],
            "threats": threats.data or [],
        }

        pdf_buffer = generate_blueprint_pdf(blueprint_data)
        company = blueprint.data.get("company_name", "blueprint").replace(" ", "_")
        filename = f"Growth_Blueprint_{company}.pdf"

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("PDF export failed for blueprint %s: %s", blueprint_id, e)
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")
