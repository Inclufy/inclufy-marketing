"""Email sending router - supports SendGrid and Resend."""
import os
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from supabase import Client

from dependencies import get_current_user, get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/email", tags=["Email Sending"])

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@inclufy.com")
DEFAULT_FROM_NAME = os.getenv("DEFAULT_FROM_NAME", "Inclufy Marketing")


class EmailSendRequest(BaseModel):
    to: List[str]
    subject: str
    html_body: str
    text_body: Optional[str] = None
    from_email: Optional[str] = None
    from_name: Optional[str] = None
    reply_to: Optional[str] = None
    campaign_id: Optional[str] = None
    tags: Optional[List[str]] = []

    @field_validator("to")
    @classmethod
    def validate_recipients(cls, v):
        if not v:
            raise ValueError("At least one recipient is required")
        for email in v:
            if "@" not in email:
                raise ValueError(f"Invalid email: {email}")
        return v

    @field_validator("subject")
    @classmethod
    def subject_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Subject cannot be empty")
        return v.strip()


class EmailBulkRequest(BaseModel):
    campaign_id: str
    subject: str
    html_body: str
    text_body: Optional[str] = None
    from_email: Optional[str] = None
    from_name: Optional[str] = None
    tags: Optional[List[str]] = []


async def _send_via_sendgrid(
    to_emails: List[str],
    subject: str,
    html_body: str,
    text_body: Optional[str],
    from_email: str,
    from_name: str,
    reply_to: Optional[str] = None,
) -> dict:
    """Send email using SendGrid API."""
    import httpx

    personalizations = [{"to": [{"email": email}]} for email in to_emails]

    content = [{"type": "text/html", "value": html_body}]
    if text_body:
        content.insert(0, {"type": "text/plain", "value": text_body})

    payload = {
        "personalizations": personalizations,
        "from": {"email": from_email, "name": from_name},
        "subject": subject,
        "content": content,
    }

    if reply_to:
        payload["reply_to"] = {"email": reply_to}

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            json=payload,
            headers={
                "Authorization": f"Bearer {SENDGRID_API_KEY}",
                "Content-Type": "application/json",
            },
        )

    if response.status_code not in (200, 202):
        raise Exception(f"SendGrid error {response.status_code}: {response.text}")

    return {"provider": "sendgrid", "status_code": response.status_code}


async def _send_via_resend(
    to_emails: List[str],
    subject: str,
    html_body: str,
    text_body: Optional[str],
    from_email: str,
    from_name: str,
    reply_to: Optional[str] = None,
) -> dict:
    """Send email using Resend API."""
    import httpx

    payload = {
        "from": f"{from_name} <{from_email}>",
        "to": to_emails,
        "subject": subject,
        "html": html_body,
    }

    if text_body:
        payload["text"] = text_body
    if reply_to:
        payload["reply_to"] = reply_to

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.resend.com/emails",
            json=payload,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
        )

    if response.status_code not in (200, 201):
        raise Exception(f"Resend error {response.status_code}: {response.text}")

    return {"provider": "resend", "id": response.json().get("id")}


def _get_email_provider():
    """Determine which email provider to use."""
    if SENDGRID_API_KEY:
        return "sendgrid"
    if RESEND_API_KEY:
        return "resend"
    return None


@router.get("/provider")
def get_email_provider(current_user: dict = Depends(get_current_user)):
    """Check which email provider is configured."""
    provider = _get_email_provider()
    return {
        "provider": provider,
        "configured": provider is not None,
        "from_email": DEFAULT_FROM_EMAIL,
        "from_name": DEFAULT_FROM_NAME,
    }


@router.post("/send")
async def send_email(
    data: EmailSendRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Send an email to one or more recipients."""
    provider = _get_email_provider()
    if not provider:
        raise HTTPException(
            status_code=503,
            detail="No email provider configured. Set SENDGRID_API_KEY or RESEND_API_KEY.",
        )

    from_email = data.from_email or DEFAULT_FROM_EMAIL
    from_name = data.from_name or DEFAULT_FROM_NAME

    try:
        if provider == "sendgrid":
            result = await _send_via_sendgrid(
                data.to, data.subject, data.html_body, data.text_body,
                from_email, from_name, data.reply_to,
            )
        else:
            result = await _send_via_resend(
                data.to, data.subject, data.html_body, data.text_body,
                from_email, from_name, data.reply_to,
            )

        # Log the email event
        org_id = current_user.get("organization_id")
        if org_id:
            for recipient in data.to:
                try:
                    db.table("events").insert({
                        "organization_id": org_id,
                        "event_type": "email_sent",
                        "campaign_id": data.campaign_id,
                        "metadata": {
                            "to": recipient,
                            "subject": data.subject,
                            "provider": provider,
                        },
                    }).execute()
                except Exception as e:
                    logger.warning("Failed to log email event: %s", e)

        return {
            "success": True,
            "recipients": len(data.to),
            "provider": provider,
            **result,
        }

    except Exception as e:
        logger.error("Email send failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@router.post("/send-campaign")
async def send_campaign_emails(
    data: EmailBulkRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    """Send campaign emails to all contacts with email addresses."""
    provider = _get_email_provider()
    if not provider:
        raise HTTPException(
            status_code=503,
            detail="No email provider configured. Set SENDGRID_API_KEY or RESEND_API_KEY.",
        )

    org_id = current_user.get("organization_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization found")

    # Get all contacts with emails for this org
    try:
        result = db.table("contacts").select("email").eq(
            "organization_id", org_id
        ).not_.is_("email", "null").execute()
        contacts = result.data or []
    except Exception as e:
        logger.error("Failed to fetch contacts: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch contacts")

    if not contacts:
        return {"success": True, "sent": 0, "message": "No contacts with email addresses found"}

    from_email = data.from_email or DEFAULT_FROM_EMAIL
    from_name = data.from_name or DEFAULT_FROM_NAME

    sent = 0
    failed = 0
    errors = []

    # Send in batches of 50
    batch_size = 50
    emails = [c["email"] for c in contacts if c.get("email")]

    for i in range(0, len(emails), batch_size):
        batch = emails[i:i + batch_size]
        try:
            if provider == "sendgrid":
                await _send_via_sendgrid(
                    batch, data.subject, data.html_body, data.text_body,
                    from_email, from_name,
                )
            else:
                await _send_via_resend(
                    batch, data.subject, data.html_body, data.text_body,
                    from_email, from_name,
                )
            sent += len(batch)
        except Exception as e:
            failed += len(batch)
            if len(errors) < 5:
                errors.append(str(e)[:200])

    # Log campaign send event
    try:
        db.table("events").insert({
            "organization_id": org_id,
            "event_type": "campaign_sent",
            "campaign_id": data.campaign_id,
            "metadata": {"sent": sent, "failed": failed, "provider": provider},
        }).execute()

        # Update campaign status to active
        db.table("campaigns").update({"status": "active"}).eq(
            "id", data.campaign_id
        ).eq("organization_id", org_id).execute()
    except Exception as e:
        logger.warning("Failed to update campaign status: %s", e)

    return {
        "success": True,
        "sent": sent,
        "failed": failed,
        "total_contacts": len(emails),
        "errors": errors,
    }
