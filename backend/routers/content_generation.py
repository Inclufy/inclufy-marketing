from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel, field_validator
import logging
import os
import base64
import tempfile
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
    brand_context: Optional[dict] = None

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
    brand_context: Optional[dict] = None

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
    brand_context: Optional[dict] = None

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
    brand_context: Optional[dict] = None

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


def _build_brand_system_prompt(base_role: str, brand_context: Optional[dict] = None) -> str:
    """Build a system prompt that includes brand voice guidelines when available.

    If *brand_context* is ``None`` or empty the caller's original *base_role*
    prompt is returned unchanged, keeping full backward-compatibility.
    """
    if not brand_context:
        return base_role

    lines = [base_role, "", "Brand Voice Guidelines:"]

    if brand_context.get("brand_name"):
        lines.append(f"- Brand: {brand_context['brand_name']}")
    if brand_context.get("tagline"):
        lines.append(f"- Tagline: {brand_context['tagline']}")
    if brand_context.get("mission"):
        lines.append(f"- Mission: {brand_context['mission']}")
    if brand_context.get("brand_description"):
        lines.append(f"- Description: {brand_context['brand_description']}")

    tone = brand_context.get("tone_attributes")
    if tone:
        # tone_attributes is a list of {attribute, description} dicts
        if isinstance(tone, list):
            formatted = ", ".join(
                t.get("attribute", str(t)) if isinstance(t, dict) else str(t) for t in tone
            )
            lines.append(f"- Tone: {formatted}")
        else:
            lines.append(f"- Tone: {tone}")

    if brand_context.get("messaging_dos"):
        lines.append(f"- Do's: {brand_context['messaging_dos']}")
    if brand_context.get("messaging_donts"):
        lines.append(f"- Don'ts: {brand_context['messaging_donts']}")
    if brand_context.get("preferred_vocabulary"):
        vocab = brand_context["preferred_vocabulary"]
        if isinstance(vocab, list):
            lines.append(f"- Preferred vocabulary: {', '.join(vocab)}")
        else:
            lines.append(f"- Preferred vocabulary: {vocab}")
    if brand_context.get("banned_phrases"):
        banned = brand_context["banned_phrases"]
        if isinstance(banned, list):
            lines.append(f"- Banned phrases: {', '.join(banned)}")
        else:
            lines.append(f"- Banned phrases: {banned}")
    if brand_context.get("usps"):
        usps = brand_context["usps"]
        if isinstance(usps, list):
            lines.append(f"- USPs: {', '.join(usps)}")
        else:
            lines.append(f"- USPs: {usps}")
    if brand_context.get("brand_values"):
        vals = brand_context["brand_values"]
        if isinstance(vals, list):
            lines.append(f"- Brand values: {', '.join(vals)}")
        else:
            lines.append(f"- Brand values: {vals}")
    if brand_context.get("audiences"):
        auds = brand_context["audiences"]
        if isinstance(auds, list):
            lines.append(f"- Target audiences: {', '.join(auds)}")
        else:
            lines.append(f"- Target audiences: {auds}")

    lines.append("")
    lines.append(
        "Always write content that is consistent with the brand voice, "
        "uses preferred vocabulary, avoids banned phrases, and highlights "
        "the brand's USPs where relevant."
    )
    return "\n".join(lines)


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
        system_prompt = _build_brand_system_prompt(
            "You are an expert email marketer.", data.brand_context
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}],
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
        system_prompt = _build_brand_system_prompt(
            "You are a social media expert.", data.brand_context
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}],
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
        system_prompt = _build_brand_system_prompt(
            "You are a content optimization expert.", data.brand_context
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}],
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
        system_prompt = _build_brand_system_prompt(
            "You are an expert content writer who creates compelling marketing content.",
            data.brand_context,
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
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


# ─── Inclufy GO: Event Post Generation (GPT-4o Vision) ───────────────


class GenerateEventPostInput(BaseModel):
    image_base64: Optional[str] = None
    transcript: Optional[str] = None
    platform: str
    event_context: dict  # {name, description, hashtags, location}
    capture_note: str = ""
    capture_tags: List[str] = []
    brand_context: Optional[dict] = None

    @field_validator("platform")
    @classmethod
    def valid_platform(cls, v):
        allowed = {"linkedin", "instagram", "x", "facebook"}
        if v not in allowed:
            raise ValueError(f"platform must be one of {allowed}")
        return v


PLATFORM_GUIDELINES = {
    "linkedin": (
        "LinkedIn post: professional tone, insightful, 1-3 paragraphs, "
        "use bullet points or numbered lists for key takeaways, "
        "include a call-to-action. No emojis in the first line."
    ),
    "instagram": (
        "Instagram caption: engaging, visual storytelling, casual but smart, "
        "use relevant emojis, max 2200 chars, include hashtags at the end."
    ),
    "x": (
        "X/Twitter post: concise, punchy, max 280 characters, "
        "use 1-2 hashtags, be attention-grabbing."
    ),
    "facebook": (
        "Facebook post: conversational, community-oriented, "
        "encourage engagement (likes/comments/shares), 1-2 paragraphs."
    ),
}


@router.post("/event-post")
def generate_event_post(
    data: GenerateEventPostInput,
    current_user: dict = Depends(get_current_user),
):
    """Generate an event post using GPT-4o Vision.

    Analyzes the captured image (if provided) and generates
    channel-specific text with brand voice.
    """
    try:
        client = _get_openai_client()

        # Build the event context prompt
        event = data.event_context
        event_info = (
            f"Event: {event.get('name', 'Event')}\n"
            f"Location: {event.get('location', '')}\n"
            f"Description: {event.get('description', '')}\n"
            f"Hashtags: {', '.join(event.get('hashtags', []))}\n"
        )

        capture_info = ""
        if data.capture_tags:
            capture_info += f"Content type: {', '.join(data.capture_tags)}\n"
        if data.capture_note:
            capture_info += f"Context note: {data.capture_note}\n"
        if data.transcript:
            capture_info += f"Audio transcript: {data.transcript}\n"

        platform_guide = PLATFORM_GUIDELINES.get(data.platform, "")

        user_prompt = (
            f"Generate a {data.platform} post for this event moment.\n\n"
            f"{event_info}\n"
            f"{capture_info}\n"
            f"Platform guidelines: {platform_guide}\n\n"
            "Return JSON with:\n"
            "- text: the post text\n"
            "- hashtags: array of relevant hashtags (without #)\n"
            "- image_description: brief description of what's in the image\n"
            "- optimal_post_time: suggested posting time (e.g. 'now', '14:00', '18:00')\n"
        )

        system_prompt = _build_brand_system_prompt(
            "You are a social media expert who creates engaging event content. "
            "Write in the language that matches the event context (Dutch if the "
            "event appears to be in the Netherlands, English otherwise).",
            data.brand_context,
        )

        # Build messages — include image if provided
        messages = [{"role": "system", "content": system_prompt}]

        if data.image_base64:
            # GPT-4o Vision: include image in the message
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{data.image_base64}",
                            "detail": "low",  # Use low detail for faster/cheaper analysis
                        },
                    },
                ],
            })
        else:
            messages.append({"role": "user", "content": user_prompt})

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=1000,
        )

        return {"result": response.choices[0].message.content}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Event post generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate event post")


# ─── Inclufy GO: Audio Transcription (Whisper) ──────────────────────


class TranscribeInput(BaseModel):
    audio_base64: str


@router.post("/transcribe")
def transcribe_audio(
    data: TranscribeInput,
    current_user: dict = Depends(get_current_user),
):
    """Transcribe audio using OpenAI Whisper."""
    try:
        client = _get_openai_client()

        # Decode base64 audio to a temp file
        audio_bytes = base64.b64decode(data.audio_base64)

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
            tmp.write(audio_bytes)
            tmp.flush()

            with open(tmp.name, "rb") as audio_file:
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="json",
                )

        return {
            "result": {
                "transcript": response.text,
                "duration": 0,  # Whisper doesn't return duration directly
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Audio transcription failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to transcribe audio")


# ─── Inclufy GO: Story Arc (AI day-planner) ──────────────────────────


class StoryArcInput(BaseModel):
    event_name: str
    event_date: str
    event_start_time: Optional[str] = "09:00"
    event_end_time: Optional[str] = "18:00"
    channels: List[str] = ["linkedin", "instagram", "x"]
    hashtags: List[str] = []
    goals: List[str] = []
    captures_so_far: int = 0
    brand_context: Optional[dict] = None


@router.post("/story-arc")
def generate_story_arc(
    data: StoryArcInput,
    current_user: dict = Depends(get_current_user),
):
    """Generate a Story Arc — AI-planned posting schedule for an event day.

    Plans posts as a narrative through the day:
    - Morning: "We're here!" / arrival / setup
    - Mid-morning: First sessions / keynotes
    - Midday: Highlights / networking
    - Afternoon: Deep content / demos
    - Evening: Wrap-up / recap / thanks

    Returns a schedule with suggested times, content themes, and channels.
    """
    try:
        client = _get_openai_client()

        system_prompt = _build_brand_system_prompt(
            "You are an expert social media strategist who plans event content as "
            "a compelling story arc through the day. Each post builds on previous ones, "
            "creating a narrative that keeps followers engaged from start to finish.",
            data.brand_context,
        )

        user_prompt = (
            f"Plan a story arc (posting schedule) for this event:\n\n"
            f"Event: {data.event_name}\n"
            f"Date: {data.event_date}\n"
            f"Time: {data.event_start_time} – {data.event_end_time}\n"
            f"Channels: {', '.join(data.channels)}\n"
            f"Hashtags: {', '.join(data.hashtags)}\n"
            f"Goals: {', '.join(data.goals) or 'engagement, brand awareness'}\n"
            f"Posts already made today: {data.captures_so_far}\n\n"
            "Return JSON with:\n"
            "- arc: array of planned posts, each with:\n"
            "  - time: suggested posting time (HH:MM)\n"
            "  - phase: story phase (arrival, keynote, networking, demo, highlights, wrapup)\n"
            "  - theme: what to capture/post about\n"
            "  - channel: best channel for this moment\n"
            "  - content_type: photo, video, audio, or quote\n"
            "  - tip: practical advice for the content creator\n"
            "  - caption_template: a template caption (with [placeholders])\n"
            "- total_planned: total number of posts planned\n"
            "- narrative_summary: 1-sentence description of the day's story\n"
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=2000,
        )

        return {"result": response.choices[0].message.content}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Story arc generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate story arc")


# ─── Inclufy GO: Multi-Language Translation ──────────────────────────


class TranslateInput(BaseModel):
    text: str
    source_language: str = "nl"
    target_languages: List[str] = ["en", "de", "fr"]
    platform: Optional[str] = None  # Adapt style per platform
    brand_context: Optional[dict] = None


@router.post("/translate")
def translate_content(
    data: TranslateInput,
    current_user: dict = Depends(get_current_user),
):
    """Translate social media content to multiple languages.

    Not just literal translation — adapts tone, idioms, hashtags,
    and emoji usage for each target language and culture.
    """
    try:
        client = _get_openai_client()

        lang_names = {
            "nl": "Dutch", "en": "English", "de": "German",
            "fr": "French", "es": "Spanish", "it": "Italian",
        }

        system_prompt = _build_brand_system_prompt(
            "You are a multilingual social media expert. You don't just translate — "
            "you culturally adapt content. Adjust idioms, emoji usage, hashtag style, "
            "and tone to feel native in each target language. Keep brand voice consistent.",
            data.brand_context,
        )

        platform_note = ""
        if data.platform:
            platform_note = f"\nAdapt for {data.platform} in each language."

        target_names = [lang_names.get(l, l) for l in data.target_languages]

        user_prompt = (
            f"Translate and culturally adapt this {lang_names.get(data.source_language, 'Dutch')} "
            f"social media text to: {', '.join(target_names)}.{platform_note}\n\n"
            f"Original text:\n{data.text}\n\n"
            f"Return JSON with:\n"
            f"- translations: object with language code as key, each containing:\n"
            f"  - text: the adapted translation\n"
            f"  - hashtags: culturally relevant hashtags for that language\n"
            f"  - notes: brief note on what was adapted and why\n"
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=2000,
        )

        return {"result": response.choices[0].message.content}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Translation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to translate content")


# ─── Inclufy GO: Event Recap Generator ───────────────────────────────


class EventRecapInput(BaseModel):
    event_name: str
    event_date: str
    location: str = ""
    posts: List[dict] = []  # Array of {channel, text_content, hashtags, status}
    captures_count: int = 0
    published_count: int = 0
    output_format: str = "blog"  # blog, newsletter, linkedin_article
    brand_context: Optional[dict] = None


@router.post("/event-recap")
def generate_event_recap(
    data: EventRecapInput,
    current_user: dict = Depends(get_current_user),
):
    """Generate an event recap from all posts and captures.

    Aggregates all content from the event day into a cohesive
    blog post, newsletter, or LinkedIn article.
    """
    try:
        client = _get_openai_client()

        format_guides = {
            "blog": "Write a compelling blog post (800-1200 words) with headers, highlights, and key takeaways.",
            "newsletter": "Write a concise newsletter section (300-500 words) with bullet points and a CTA.",
            "linkedin_article": "Write a professional LinkedIn article (500-800 words) with insights and lessons learned.",
        }

        system_prompt = _build_brand_system_prompt(
            "You are a content strategist who creates compelling event recaps. "
            "Weave together the day's highlights into a cohesive narrative "
            "that showcases the brand and provides value to the reader.",
            data.brand_context,
        )

        # Build post summaries
        post_summaries = ""
        for i, post in enumerate(data.posts[:20], 1):
            channel = post.get("channel", "unknown")
            text = post.get("text_content", "")[:200]
            post_summaries += f"{i}. [{channel}] {text}\n"

        user_prompt = (
            f"Create an event recap for:\n\n"
            f"Event: {data.event_name}\n"
            f"Date: {data.event_date}\n"
            f"Location: {data.location}\n"
            f"Total captures: {data.captures_count}\n"
            f"Posts published: {data.published_count}\n\n"
            f"Posts from the day:\n{post_summaries}\n\n"
            f"Format: {format_guides.get(data.output_format, format_guides['blog'])}\n\n"
            f"Return JSON with:\n"
            f"- title: compelling title for the recap\n"
            f"- content: the full recap text (markdown formatted)\n"
            f"- key_highlights: array of 3-5 key moments\n"
            f"- suggested_cta: a call-to-action for follow-up\n"
            f"- social_teaser: a short teaser (1-2 sentences) to promote the recap on social media\n"
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=3000,
        )

        return {"result": response.choices[0].message.content}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Event recap generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate event recap")


# ─── Inclufy GO: Auto-Tagging (GPT-4o Vision) ────────────────────────


class AutoTagInput(BaseModel):
    image_base64: str
    existing_tags: List[str] = []


@router.post("/auto-tag")
def auto_tag_image(
    data: AutoTagInput,
    current_user: dict = Depends(get_current_user),
):
    """Auto-tag an image using GPT-4o Vision.

    Detects people, objects, products, locations, activities, and moods
    in the captured image. Returns structured tags with confidence scores.
    """
    try:
        client = _get_openai_client()

        system_prompt = (
            "You are an expert image analyst for event marketing. "
            "Analyze photos taken at events and identify key elements that "
            "are relevant for social media marketing content."
        )

        user_prompt = (
            "Analyze this event photo and identify key elements.\n\n"
            "Return JSON with:\n"
            "- tags: array of detected elements, each with:\n"
            "  - type: category (person, product, location, activity, mood, branding, setup)\n"
            "  - label: descriptive label (e.g. 'Speaker at podium', 'Networking group')\n"
            "  - confidence: confidence score 0.0-1.0\n"
            "- scene_description: one-sentence description of the scene\n"
            "- suggested_tags: array of simple tag strings suitable for social media\n"
            "- people_count: estimated number of people visible\n"
        )

        if data.existing_tags:
            user_prompt += (
                f"\nExisting manual tags: {', '.join(data.existing_tags)}\n"
                "Take these into account but add additional AI-detected tags."
            )

        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{data.image_base64}",
                            "detail": "low",
                        },
                    },
                ],
            },
        ]

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=1000,
        )

        return {"result": response.choices[0].message.content}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Auto-tagging failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to auto-tag image")


# ─── Inclufy GO: Audience Targeting ──────────────────────────────────


class AudienceTargetInput(BaseModel):
    text_content: str
    channel: str
    event_context: dict = {}
    hashtags: List[str] = []
    brand_context: Optional[dict] = None


@router.post("/audience-target")
def suggest_audience(
    data: AudienceTargetInput,
    current_user: dict = Depends(get_current_user),
):
    """Suggest the best target audience for a post.

    Analyzes the post content, channel, and event context to recommend
    the ideal audience segments and optimal posting strategy.
    """
    try:
        client = _get_openai_client()

        system_prompt = _build_brand_system_prompt(
            "You are an expert social media strategist who specializes in "
            "audience targeting and post optimization. You analyze content "
            "and recommend the best audience segments for maximum engagement.",
            data.brand_context,
        )

        user_prompt = (
            f"Analyze this {data.channel} post and suggest the optimal target audience.\n\n"
            f"Post content:\n{data.text_content}\n\n"
            f"Hashtags: {', '.join(data.hashtags)}\n"
        )

        event = data.event_context
        if event:
            user_prompt += (
                f"Event: {event.get('name', '')}\n"
                f"Industry/Type: {event.get('description', '')}\n"
            )

        user_prompt += (
            "\nReturn JSON with:\n"
            "- primary: the primary audience segment (e.g. 'Marketing Managers')\n"
            "- secondary: secondary audience segment\n"
            "- reasoning: why these audiences are the best fit (1-2 sentences)\n"
            "- demographics: brief demographic profile\n"
            "- interests: array of related interests/topics this audience cares about\n"
            "- optimal_time: best time to post for this audience (e.g. 'Tuesday 09:00')\n"
            "- engagement_tips: array of 2-3 tips to maximize engagement with this audience\n"
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
        )

        return {"result": response.choices[0].message.content}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Audience targeting failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to suggest audience")
