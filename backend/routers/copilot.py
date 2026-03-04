# backend/routers/copilot.py
# AI Marketing Co-pilot — chat endpoint met OpenAI
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import logging

from dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/copilot", tags=["AI Co-pilot"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    system_prompt: Optional[str] = None
    model: Optional[str] = "gpt-4o-mini"
    max_tokens: Optional[int] = 1500
    temperature: Optional[float] = 0.7


@router.post("/chat")
async def copilot_chat(
    data: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """AI Co-pilot chat endpoint — stuurt berichten naar OpenAI en geeft antwoord terug."""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API key niet geconfigureerd")

    try:
        import openai

        client = openai.OpenAI(api_key=OPENAI_API_KEY)

        # Build messages array
        messages = []

        # System prompt
        system_prompt = data.system_prompt or (
            "Je bent een behulpzame AI Marketing Co-pilot voor het Inclufy Marketing platform. "
            "Antwoord altijd in het Nederlands. Je helpt met marketing strategie, content creatie, "
            "campagne planning, SEO, social media, en e-mail marketing. "
            "Geef praktische, actiegerichte adviezen. Gebruik markdown formatting voor duidelijke structuur. "
            "Houd antwoorden beknopt maar informatief (max 300 woorden)."
        )
        messages.append({"role": "system", "content": system_prompt})

        # Add conversation history
        for msg in data.messages:
            if msg.role in ("user", "assistant"):
                messages.append({"role": msg.role, "content": msg.content})

        logger.info(
            "Copilot chat: user=%s, messages=%d, model=%s",
            current_user.get("email", "unknown"),
            len(data.messages),
            data.model,
        )

        response = client.chat.completions.create(
            model=data.model or "gpt-4o-mini",
            messages=messages,
            max_tokens=data.max_tokens or 1500,
            temperature=data.temperature or 0.7,
        )

        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else 0

        return {
            "response": content,
            "tokens_used": tokens_used,
            "model": data.model or "gpt-4o-mini",
        }

    except ImportError:
        logger.error("openai package not installed")
        raise HTTPException(status_code=503, detail="OpenAI package niet geinstalleerd. Run: pip install openai")
    except Exception as e:
        logger.error("Copilot chat error: %s", e, exc_info=True)
        error_msg = str(e)
        if "api_key" in error_msg.lower() or "auth" in error_msg.lower():
            raise HTTPException(status_code=503, detail="OpenAI API key ongeldig of verlopen")
        raise HTTPException(status_code=500, detail=f"AI fout: {error_msg}")


@router.get("/health")
def copilot_health():
    """Health check voor AI Co-pilot."""
    return {
        "ok": True,
        "openai_configured": bool(OPENAI_API_KEY),
    }
