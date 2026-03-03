from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from supabase import Client
from collections import Counter
from datetime import datetime
import uuid
import io
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


@router.get("/analytics/pdf")
def export_analytics_pdf(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Export analytics overview as PDF report."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch

        org_id = current_user.get("organization_id")
        if not org_id:
            raise HTTPException(status_code=403, detail="No organization found")

        # Fetch data
        campaigns = (db.table("campaigns").select("id, name, status, type, budget_amount")
                     .eq("organization_id", org_id).execute()).data or []
        contacts = (db.table("contacts").select("id", count="exact")
                    .eq("organization_id", org_id).execute())
        events = (db.table("events").select("event_type")
                  .eq("organization_id", org_id).execute()).data or []

        contact_total = contacts.count if hasattr(contacts, "count") and contacts.count else len(contacts.data or [])
        status_counts = Counter(c.get("status", "unknown") for c in campaigns)
        type_counts = Counter(c.get("type", "other") for c in campaigns)
        event_counts = Counter(e.get("event_type", "") for e in events)
        total_budget = sum(c.get("budget_amount") or 0 for c in campaigns)

        sent = event_counts.get("email_sent", 0)
        opened = event_counts.get("email_opened", 0)
        clicked = event_counts.get("email_clicked", 0)

        # Build PDF
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("CustomTitle", parent=styles["Title"], fontSize=24, textColor=colors.HexColor("#6b21a8"))
        heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], textColor=colors.HexColor("#4c1d95"), spaceBefore=16)

        elements = []
        elements.append(Paragraph("Marketing Analytics Report", title_style))
        elements.append(Paragraph(f"Generated {datetime.utcnow().strftime('%B %d, %Y')}", styles["Normal"]))
        elements.append(Spacer(1, 20))

        # Summary table
        elements.append(Paragraph("Overview", heading_style))
        summary_data = [
            ["Metric", "Value"],
            ["Total Campaigns", str(len(campaigns))],
            ["Active Campaigns", str(status_counts.get("active", 0))],
            ["Draft Campaigns", str(status_counts.get("draft", 0))],
            ["Total Contacts", str(contact_total)],
            ["Total Budget", f"${total_budget:,.0f}"],
            ["Emails Sent", str(sent)],
            ["Emails Opened", str(opened)],
            ["Open Rate", f"{round(opened / sent * 100, 1) if sent > 0 else 0}%"],
            ["Click Rate", f"{round(clicked / sent * 100, 1) if sent > 0 else 0}%"],
        ]
        t = Table(summary_data, colWidths=[3 * inch, 3 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7c3aed")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))

        # Campaign breakdown
        if type_counts:
            elements.append(Paragraph("Campaign Types", heading_style))
            type_data = [["Type", "Count"]] + [[t, str(c)] for t, c in type_counts.items()]
            t2 = Table(type_data, colWidths=[3 * inch, 3 * inch])
            t2.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#7c3aed")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            elements.append(t2)

        doc.build(elements)
        buf.seek(0)

        filename = f"Analytics_Report_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Analytics PDF export failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate analytics report")
