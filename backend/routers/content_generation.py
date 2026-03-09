from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel, field_validator
import logging
import os
import openai

from dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/content", tags=["Content Generation"])


class GenerateEmailInput(BaseModel):
    type: str
    product: str
    audience: str
    goal: str
    variants: int = 1

    @field_validator("type")
    @classmethod
    def valid_type(cls, v):
        allowed = {"welcome", "promotional", "newsletter", "follow-up", "re-engagement"}
        if v not in allowed:
            raise ValueError(f"type must be one of {allowed}")
        return v


class GenerateSocialInput(BaseModel):
    topic: str
    platform: str
    style: Optional[str] = "professional"

    @field_validator("platform")
    @classmethod
    def valid_platform(cls, v):
        allowed = {"twitter", "linkedin", "instagram", "facebook"}
        if v not in allowed:
            raise ValueError(f"platform must be one of {allowed}")
        return v


class GenerateWriterInput(BaseModel):
    prompt: str
    content_type: str = "blog"
    tone: str = "professional"
    length: str = "medium"

    @field_validator("content_type")
    @classmethod
    def valid_content_type(cls, v):
        allowed = {"blog", "article", "ad_copy", "product_description", "press_release", "script"}
        if v not in allowed:
            raise ValueError(f"content_type must be one of {allowed}")
        return v

    @field_validator("prompt")
    @classmethod
    def prompt_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Prompt cannot be empty")
        return v


class GenerateImageInput(BaseModel):
    prompt: str
    size: str = "1024x1024"
    style: str = "vivid"

    @field_validator("size")
    @classmethod
    def valid_size(cls, v):
        allowed = {"1024x1024", "1792x1024", "1024x1792"}
        if v not in allowed:
            raise ValueError(f"size must be one of {allowed}")
        return v

    @field_validator("style")
    @classmethod
    def valid_style(cls, v):
        allowed = {"vivid", "natural"}
        if v not in allowed:
            raise ValueError(f"style must be one of {allowed}")
        return v

    @field_validator("prompt")
    @classmethod
    def prompt_not_empty_img(cls, v):
        if not v.strip():
            raise ValueError("Prompt cannot be empty")
        return v


class ImproveContentInput(BaseModel):
    content: str
    goal: str

    @field_validator("goal")
    @classmethod
    def valid_goal(cls, v):
        allowed = {"clarity", "engagement", "conversion", "seo"}
        if v not in allowed:
            raise ValueError(f"goal must be one of {allowed}")
        return v

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v


def _get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")
    return openai.OpenAI(api_key=api_key)


@router.post("/image")
def generate_image(
    data: GenerateImageInput,
    current_user: dict = Depends(get_current_user),
):
    """Generate an image using DALL-E 3."""
    try:
        client = _get_openai_client()
        response = client.images.generate(
            model="dall-e-3",
            prompt=data.prompt,
            size=data.size,
            style=data.style,
            n=1,
        )
        return {"image_url": response.data[0].url, "revised_prompt": response.data[0].revised_prompt}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Image generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate image")


@router.post("/email")
def generate_email(
    data: GenerateEmailInput,
    current_user: dict = Depends(get_current_user),
):
    try:
        client = _get_openai_client()
        prompt = (
            f"Generate a {data.type} email campaign.\n"
            f"Product: {data.product}\n"
            f"Target audience: {data.audience}\n"
            f"Goal: {data.goal}\n"
            f"Generate {data.variants} variant(s).\n"
            "Return JSON with: subject, preheader, body_html, cta_text for each variant."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "You are an expert email marketer."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        return {"result": response.choices[0].message.content}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Email generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate email content")


@router.post("/social")
def generate_social(
    data: GenerateSocialInput,
    current_user: dict = Depends(get_current_user),
):
    try:
        client = _get_openai_client()
        prompt = (
            f"Generate a {data.platform} post about: {data.topic}\n"
            f"Style: {data.style}\n"
            "Return JSON with: text, hashtags, optimal_post_time."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "You are a social media expert."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        return {"result": response.choices[0].message.content}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Social post generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate social post")


@router.post("/improve")
def improve_content(
    data: ImproveContentInput,
    current_user: dict = Depends(get_current_user),
):
    try:
        client = _get_openai_client()
        prompt = (
            f"Improve the following content for {data.goal}:\n\n"
            f"{data.content}\n\n"
            "Return JSON with: improved_content, changes_made (array of strings), score_before (0-100), score_after (0-100)."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "You are a content optimization expert."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        return {"result": response.choices[0].message.content}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Content improvement failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to improve content")


@router.post("/write")
def generate_content(
    data: GenerateWriterInput,
    current_user: dict = Depends(get_current_user),
):
    """General-purpose AI content writer."""
    try:
        client = _get_openai_client()
        length_guide = {"short": "200-300 words", "medium": "500-700 words", "long": "1000-1500 words"}
        prompt = (
            f"Write a {data.content_type} about: {data.prompt}\n"
            f"Tone: {data.tone}\n"
            f"Length: approximately {length_guide.get(data.length, '500-700 words')}\n"
            "Return JSON with: title, content (in markdown), summary (1-2 sentences), word_count."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert content writer who creates compelling marketing content."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )
        return {"result": response.choices[0].message.content}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Content write failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate content")
