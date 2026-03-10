"""Brand overlay image service.

Applies brand elements (logo, colors, gradient overlay) to event photos
to create branded images for social media publishing.
"""

import io
import logging
import math
from typing import Optional

import httpx
from PIL import Image, ImageDraw, ImageFont, ImageFilter

logger = logging.getLogger(__name__)

# ─── Image Formats ───────────────────────────────────────────────────

FORMATS = {
    "square": (1080, 1080),       # Instagram feed, Facebook feed
    "story": (1080, 1920),        # Instagram/Facebook stories
    "landscape": (1200, 628),     # LinkedIn, X/Twitter
    "portrait": (1080, 1350),     # Instagram portrait
}


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i: i + 2], 16) for i in (0, 2, 4))


def create_gradient_overlay(
    width: int,
    height: int,
    primary_color: str,
    secondary_color: str,
    opacity: float = 0.35,
    gradient_height_ratio: float = 0.35,
) -> Image.Image:
    """Create a gradient overlay for the bottom of an image.

    Args:
        width: Image width
        height: Image height
        primary_color: Start color (hex)
        secondary_color: End color (hex)
        opacity: Overall overlay opacity
        gradient_height_ratio: How much of the image the gradient covers

    Returns:
        RGBA overlay image
    """
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    r1, g1, b1 = hex_to_rgb(primary_color)
    r2, g2, b2 = hex_to_rgb(secondary_color)

    gradient_start = int(height * (1 - gradient_height_ratio))

    for y in range(gradient_start, height):
        # Progress from 0 to 1
        t = (y - gradient_start) / (height - gradient_start)
        # Ease-in curve for smoother gradient
        t = t * t

        r = int(r1 + (r2 - r1) * t)
        g = int(g1 + (g2 - g1) * t)
        b = int(b1 + (b2 - b1) * t)
        a = int(255 * opacity * t)

        draw.line([(0, y), (width, y)], fill=(r, g, b, a))

    return overlay


async def fetch_image(url: str) -> Image.Image:
    """Download an image from URL and return as PIL Image."""
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return Image.open(io.BytesIO(resp.content))


def resize_and_crop(img: Image.Image, target_size: tuple[int, int]) -> Image.Image:
    """Resize and center-crop image to target dimensions.

    Uses cover strategy: fills the target dimensions completely,
    cropping from center if needed.
    """
    target_w, target_h = target_size
    img_w, img_h = img.size

    # Calculate scale to cover target
    scale = max(target_w / img_w, target_h / img_h)
    new_w = int(img_w * scale)
    new_h = int(img_h * scale)

    img = img.resize((new_w, new_h), Image.LANCZOS)

    # Center crop
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    right = left + target_w
    bottom = top + target_h

    return img.crop((left, top, right, bottom))


def add_logo_overlay(
    base: Image.Image,
    logo: Image.Image,
    position: str = "bottom-left",
    max_size_ratio: float = 0.12,
    padding: int = 24,
) -> Image.Image:
    """Place a logo on the image.

    Args:
        base: Base image (RGBA)
        logo: Logo image (RGBA)
        position: Where to place (top-left, top-right, bottom-left, bottom-right, center)
        max_size_ratio: Logo max size relative to image width
        padding: Pixel padding from edges

    Returns:
        Image with logo overlaid
    """
    base_w, base_h = base.size
    max_logo_w = int(base_w * max_size_ratio)

    # Scale logo proportionally
    logo_w, logo_h = logo.size
    scale = max_logo_w / logo_w
    new_logo_w = int(logo_w * scale)
    new_logo_h = int(logo_h * scale)
    logo = logo.resize((new_logo_w, new_logo_h), Image.LANCZOS)

    # Calculate position
    positions = {
        "top-left": (padding, padding),
        "top-right": (base_w - new_logo_w - padding, padding),
        "bottom-left": (padding, base_h - new_logo_h - padding),
        "bottom-right": (base_w - new_logo_w - padding, base_h - new_logo_h - padding),
        "center": ((base_w - new_logo_w) // 2, (base_h - new_logo_h) // 2),
    }
    pos = positions.get(position, positions["bottom-left"])

    # Composite
    result = base.copy()
    result.paste(logo, pos, logo if logo.mode == "RGBA" else None)
    return result


def add_text_overlay(
    img: Image.Image,
    text: str,
    position: str = "bottom-left",
    color: str = "#ffffff",
    max_font_size: int = 28,
    padding: int = 24,
    shadow: bool = True,
) -> Image.Image:
    """Add text overlay to image.

    Args:
        img: Base image
        text: Text to overlay
        position: Where to place
        color: Text color (hex)
        max_font_size: Maximum font size
        padding: Edge padding
        shadow: Add drop shadow for readability

    Returns:
        Image with text overlaid
    """
    draw = ImageDraw.Draw(img)

    # Use default font (Pillow's built-in)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", max_font_size)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", max_font_size)
        except (OSError, IOError):
            font = ImageFont.load_default()

    # Calculate text bounds
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    base_w, base_h = img.size

    positions = {
        "top-left": (padding, padding),
        "top-right": (base_w - text_w - padding, padding),
        "bottom-left": (padding, base_h - text_h - padding - 60),
        "bottom-right": (base_w - text_w - padding, base_h - text_h - padding - 60),
        "center": ((base_w - text_w) // 2, (base_h - text_h) // 2),
    }
    pos = positions.get(position, positions["bottom-left"])

    r, g, b = hex_to_rgb(color)

    if shadow:
        # Draw shadow
        shadow_offset = 2
        draw.text(
            (pos[0] + shadow_offset, pos[1] + shadow_offset),
            text, fill=(0, 0, 0, 160), font=font,
        )

    draw.text(pos, text, fill=(r, g, b, 255), font=font)

    return img


async def create_branded_image(
    source_image_url: str,
    logo_url: Optional[str] = None,
    primary_color: str = "#9333EA",
    secondary_color: str = "#DB2777",
    image_format: str = "square",
    event_name: Optional[str] = None,
    hashtags: Optional[list[str]] = None,
    gradient_opacity: float = 0.35,
    logo_position: str = "bottom-left",
    show_text: bool = True,
) -> bytes:
    """Create a branded image from a source photo.

    Pipeline:
    1. Download source image
    2. Resize/crop to target format
    3. Convert to RGBA
    4. Apply brand gradient overlay
    5. Overlay logo
    6. Optionally add event name + hashtags
    7. Export as JPEG bytes

    Args:
        source_image_url: URL of the original capture photo
        logo_url: Brand kit logo URL
        primary_color: Brand primary color (hex)
        secondary_color: Brand secondary color (hex)
        image_format: Output format (square, story, landscape, portrait)
        event_name: Optional event name to overlay
        hashtags: Optional hashtags to show
        gradient_opacity: Gradient overlay opacity (0-1)
        logo_position: Where to place logo
        show_text: Whether to add text overlays

    Returns:
        JPEG image bytes
    """
    target_size = FORMATS.get(image_format, FORMATS["square"])

    # 1. Fetch source image
    source = await fetch_image(source_image_url)

    # 2. Resize/crop to target format
    img = resize_and_crop(source, target_size)

    # 3. Convert to RGBA
    img = img.convert("RGBA")

    # 4. Apply gradient overlay
    gradient = create_gradient_overlay(
        target_size[0], target_size[1],
        primary_color, secondary_color,
        opacity=gradient_opacity,
    )
    img = Image.alpha_composite(img, gradient)

    # 5. Overlay logo if provided
    if logo_url:
        try:
            logo = await fetch_image(logo_url)
            logo = logo.convert("RGBA")
            img = add_logo_overlay(img, logo, position=logo_position)
        except Exception as e:
            logger.warning("Could not add logo overlay: %s", e)

    # 6. Add text overlays
    if show_text:
        if event_name:
            img = add_text_overlay(img, event_name, position="bottom-left")

        if hashtags:
            tags_text = " ".join(f"#{h.strip('#')}" for h in hashtags[:5])
            img = add_text_overlay(
                img, tags_text,
                position="bottom-left",
                max_font_size=18,
                padding=24,
            )

    # 7. Convert to RGB and export as JPEG
    final = img.convert("RGB")

    output = io.BytesIO()
    final.save(output, format="JPEG", quality=92, optimize=True)
    output.seek(0)

    return output.getvalue()


async def generate_branded_images_for_post(
    db,
    capture_media_url: str,
    logo_url: Optional[str],
    primary_color: str,
    secondary_color: str,
    event_name: str,
    hashtags: list[str],
    channels: list[str],
) -> dict[str, str]:
    """Generate branded images for each channel and upload to Supabase Storage.

    Args:
        db: Supabase client
        capture_media_url: URL of original captured photo
        logo_url: Brand kit logo URL
        primary_color: Brand primary color
        secondary_color: Brand secondary color
        event_name: Event name for text overlay
        hashtags: Hashtags to show
        channels: List of channels to generate for

    Returns:
        Dict mapping channel to branded_image_url
    """
    import uuid

    # Channel → preferred format mapping
    channel_formats = {
        "instagram": "square",
        "linkedin": "landscape",
        "x": "landscape",
        "facebook": "square",
    }

    results = {}

    for channel in channels:
        fmt = channel_formats.get(channel, "square")

        try:
            img_bytes = await create_branded_image(
                source_image_url=capture_media_url,
                logo_url=logo_url,
                primary_color=primary_color,
                secondary_color=secondary_color,
                image_format=fmt,
                event_name=event_name,
                hashtags=hashtags,
            )

            # Upload to Supabase Storage
            file_name = f"branded/{uuid.uuid4()}.jpg"
            db.storage.from_("media").upload(
                file_name,
                img_bytes,
                {"content-type": "image/jpeg"},
            )

            # Get public URL
            public_url = db.storage.from_("media").get_public_url(file_name)
            results[channel] = public_url

            logger.info("Branded image created for %s: %s format", channel, fmt)

        except Exception as e:
            logger.error("Failed to create branded image for %s: %s", channel, e)
            # Fallback to original image
            results[channel] = capture_media_url

    return results
