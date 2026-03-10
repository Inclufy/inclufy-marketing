"""Social media publishing service.

Publishes posts to LinkedIn, Meta (Facebook/Instagram), and X/Twitter
using OAuth tokens stored in the social_accounts + oauth_tokens tables.
"""

import os
import logging
import base64
from typing import Optional
from datetime import datetime, timezone

import httpx
from supabase import Client

logger = logging.getLogger(__name__)

# ─── LinkedIn Publishing ─────────────────────────────────────────────

LINKEDIN_API_BASE = "https://api.linkedin.com/v2"
LINKEDIN_REST_BASE = "https://api.linkedin.com/rest"


async def publish_to_linkedin(
    access_token: str,
    platform_account_id: str,
    text: str,
    image_url: Optional[str] = None,
    hashtags: Optional[list[str]] = None,
) -> dict:
    """Publish a post to LinkedIn using the Share API.

    Args:
        access_token: OAuth access token
        platform_account_id: LinkedIn member URN (e.g., person ID)
        text: Post text content
        image_url: Optional branded image URL to include
        hashtags: Optional list of hashtags to append

    Returns:
        dict with external_post_id and url
    """
    author = f"urn:li:person:{platform_account_id}"

    # Append hashtags to text
    full_text = text
    if hashtags:
        tag_str = " ".join(f"#{h.strip('#')}" for h in hashtags)
        full_text = f"{text}\n\n{tag_str}"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        if image_url:
            # Step 1: Initialize image upload
            init_payload = {
                "initializeUploadRequest": {
                    "owner": author,
                }
            }
            init_resp = await client.post(
                f"{LINKEDIN_REST_BASE}/images?action=initializeUpload",
                json=init_payload,
                headers=headers,
            )
            init_resp.raise_for_status()
            init_data = init_resp.json()["value"]
            upload_url = init_data["uploadUrl"]
            image_urn = init_data["image"]

            # Step 2: Download image and upload to LinkedIn
            img_resp = await client.get(image_url)
            img_resp.raise_for_status()

            await client.put(
                upload_url,
                content=img_resp.content,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/octet-stream",
                },
            )

            # Step 3: Create post with image
            post_payload = {
                "author": author,
                "commentary": full_text,
                "visibility": "PUBLIC",
                "distribution": {
                    "feedDistribution": "MAIN_FEED",
                    "targetEntities": [],
                    "thirdPartyDistributionChannels": [],
                },
                "content": {
                    "media": {
                        "title": "Event photo",
                        "id": image_urn,
                    }
                },
                "lifecycleState": "PUBLISHED",
                "isReshareDisabledByAuthor": False,
            }
        else:
            # Text-only post
            post_payload = {
                "author": author,
                "commentary": full_text,
                "visibility": "PUBLIC",
                "distribution": {
                    "feedDistribution": "MAIN_FEED",
                    "targetEntities": [],
                    "thirdPartyDistributionChannels": [],
                },
                "lifecycleState": "PUBLISHED",
                "isReshareDisabledByAuthor": False,
            }

        # Publish
        resp = await client.post(
            f"{LINKEDIN_REST_BASE}/posts",
            json=post_payload,
            headers=headers,
        )
        resp.raise_for_status()

        # LinkedIn returns post URN in x-restli-id header
        post_urn = resp.headers.get("x-restli-id", "")
        logger.info("LinkedIn post published: %s", post_urn)

        return {
            "external_post_id": post_urn,
            "url": f"https://www.linkedin.com/feed/update/{post_urn}",
            "platform": "linkedin",
        }


# ─── Meta (Facebook) Publishing ──────────────────────────────────────

META_GRAPH_API = "https://graph.facebook.com/v19.0"


async def publish_to_facebook(
    access_token: str,
    page_id: str,
    text: str,
    image_url: Optional[str] = None,
    hashtags: Optional[list[str]] = None,
) -> dict:
    """Publish a post to a Facebook Page.

    Args:
        access_token: Page access token
        page_id: Facebook page ID
        text: Post text content
        image_url: Optional image URL to include
        hashtags: Optional hashtags to append

    Returns:
        dict with external_post_id and url
    """
    full_text = text
    if hashtags:
        tag_str = " ".join(f"#{h.strip('#')}" for h in hashtags)
        full_text = f"{text}\n\n{tag_str}"

    async with httpx.AsyncClient(timeout=30) as client:
        if image_url:
            # Photo post
            resp = await client.post(
                f"{META_GRAPH_API}/{page_id}/photos",
                data={
                    "message": full_text,
                    "url": image_url,
                    "access_token": access_token,
                },
            )
        else:
            # Text-only post
            resp = await client.post(
                f"{META_GRAPH_API}/{page_id}/feed",
                data={
                    "message": full_text,
                    "access_token": access_token,
                },
            )

        resp.raise_for_status()
        data = resp.json()
        post_id = data.get("id") or data.get("post_id", "")

        logger.info("Facebook post published: %s", post_id)
        return {
            "external_post_id": post_id,
            "url": f"https://www.facebook.com/{post_id}",
            "platform": "facebook",
        }


# ─── Meta (Instagram) Publishing ─────────────────────────────────────


async def publish_to_instagram(
    access_token: str,
    ig_user_id: str,
    text: str,
    image_url: str,
    hashtags: Optional[list[str]] = None,
) -> dict:
    """Publish a post to Instagram (image required).

    Instagram requires a publicly accessible image URL.
    Uses the Instagram Content Publishing API (2-step process).

    Args:
        access_token: User/page access token with instagram_content_publish
        ig_user_id: Instagram business account ID
        text: Caption
        image_url: Publicly accessible image URL (required for Instagram)
        hashtags: Optional hashtags to append

    Returns:
        dict with external_post_id and url
    """
    full_text = text
    if hashtags:
        tag_str = " ".join(f"#{h.strip('#')}" for h in hashtags)
        full_text = f"{text}\n\n{tag_str}"

    async with httpx.AsyncClient(timeout=60) as client:
        # Step 1: Create media container
        container_resp = await client.post(
            f"{META_GRAPH_API}/{ig_user_id}/media",
            data={
                "image_url": image_url,
                "caption": full_text,
                "access_token": access_token,
            },
        )
        container_resp.raise_for_status()
        container_id = container_resp.json()["id"]

        # Step 2: Wait for media to process and publish
        # Instagram needs time to process the media
        import asyncio
        for _ in range(10):
            status_resp = await client.get(
                f"{META_GRAPH_API}/{container_id}",
                params={
                    "fields": "status_code",
                    "access_token": access_token,
                },
            )
            status_data = status_resp.json()
            if status_data.get("status_code") == "FINISHED":
                break
            await asyncio.sleep(2)

        # Step 3: Publish the container
        publish_resp = await client.post(
            f"{META_GRAPH_API}/{ig_user_id}/media_publish",
            data={
                "creation_id": container_id,
                "access_token": access_token,
            },
        )
        publish_resp.raise_for_status()
        media_id = publish_resp.json()["id"]

        logger.info("Instagram post published: %s", media_id)
        return {
            "external_post_id": media_id,
            "url": f"https://www.instagram.com/p/{media_id}/",
            "platform": "instagram",
        }


# ─── X/Twitter Publishing ────────────────────────────────────────────

X_API_BASE = "https://api.twitter.com/2"
X_UPLOAD_API = "https://upload.twitter.com/1.1"


async def publish_to_x(
    access_token: str,
    text: str,
    image_url: Optional[str] = None,
    hashtags: Optional[list[str]] = None,
) -> dict:
    """Publish a tweet to X/Twitter.

    Args:
        access_token: OAuth 2.0 access token
        text: Tweet text (max 280 chars)
        image_url: Optional image URL to upload and attach
        hashtags: Optional hashtags to append

    Returns:
        dict with external_post_id and url
    """
    full_text = text
    if hashtags:
        tag_str = " ".join(f"#{h.strip('#')}" for h in hashtags)
        full_text = f"{text}\n\n{tag_str}"

    # Trim to 280 characters
    if len(full_text) > 280:
        full_text = full_text[:277] + "..."

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        tweet_payload = {"text": full_text}

        if image_url:
            try:
                # Download image
                img_resp = await client.get(image_url)
                img_resp.raise_for_status()
                img_data = img_resp.content

                # Upload media to X
                upload_headers = {
                    "Authorization": f"Bearer {access_token}",
                }

                # INIT
                init_resp = await client.post(
                    f"{X_UPLOAD_API}/media/upload.json",
                    data={
                        "command": "INIT",
                        "total_bytes": len(img_data),
                        "media_type": "image/jpeg",
                    },
                    headers=upload_headers,
                )
                init_resp.raise_for_status()
                media_id = init_resp.json()["media_id_string"]

                # APPEND
                await client.post(
                    f"{X_UPLOAD_API}/media/upload.json",
                    data={
                        "command": "APPEND",
                        "media_id": media_id,
                        "segment_index": "0",
                    },
                    files={"media_data": img_data},
                    headers=upload_headers,
                )

                # FINALIZE
                await client.post(
                    f"{X_UPLOAD_API}/media/upload.json",
                    data={
                        "command": "FINALIZE",
                        "media_id": media_id,
                    },
                    headers=upload_headers,
                )

                tweet_payload["media"] = {"media_ids": [media_id]}
            except Exception as e:
                logger.warning("Failed to upload image to X: %s", e)
                # Continue without image

        resp = await client.post(
            f"{X_API_BASE}/tweets",
            json=tweet_payload,
            headers=headers,
        )
        resp.raise_for_status()
        data = resp.json()["data"]
        tweet_id = data["id"]

        logger.info("X/Twitter post published: %s", tweet_id)
        return {
            "external_post_id": tweet_id,
            "url": f"https://x.com/i/status/{tweet_id}",
            "platform": "x",
        }


# ─── Unified Publisher ───────────────────────────────────────────────


async def publish_post_to_channel(
    db: Client,
    user_id: str,
    post: dict,
) -> dict:
    """Publish a post to its designated social channel.

    Looks up the user's connected social account and OAuth token,
    then publishes to the correct platform.

    Args:
        db: Supabase client
        user_id: Current user ID
        post: Post record from go_posts table

    Returns:
        dict with success status, external_post_id, and url
    """
    channel = post["channel"]

    # Map channel to platform name (instagram → instagram, x → x, etc.)
    platform = channel  # They're the same for our purposes

    # Find connected social account for this channel
    # First try to find via organization, then direct user
    account_result = (
        db.table("social_accounts")
        .select("*, oauth_tokens(*)")
        .eq("platform", platform)
        .eq("status", "active")
        .limit(1)
        .execute()
    )

    if not account_result.data:
        raise ValueError(
            f"Geen verbonden {channel} account gevonden. "
            f"Verbind eerst je {channel} account in het dashboard."
        )

    account = account_result.data[0]
    tokens = account.get("oauth_tokens")

    if not tokens or (isinstance(tokens, list) and not tokens):
        raise ValueError(f"Geen geldige OAuth token voor {channel}.")

    token = tokens[0] if isinstance(tokens, list) else tokens
    access_token = token["access_token"]
    platform_account_id = account["platform_account_id"]

    # Check token expiry
    if token.get("expires_at"):
        expiry = datetime.fromisoformat(token["expires_at"].replace("Z", "+00:00"))
        if expiry < datetime.now(timezone.utc):
            raise ValueError(
                f"OAuth token voor {channel} is verlopen. "
                f"Vernieuw de verbinding in het dashboard."
            )

    # Get image URL and hashtags from post
    image_url = post.get("branded_image_url") or post.get("media_url")
    hashtags = post.get("hashtags", [])
    text = post["text_content"]

    # Publish to the correct platform
    if channel == "linkedin":
        return await publish_to_linkedin(
            access_token, platform_account_id, text, image_url, hashtags
        )
    elif channel == "facebook":
        return await publish_to_facebook(
            access_token, platform_account_id, text, image_url, hashtags
        )
    elif channel == "instagram":
        if not image_url:
            raise ValueError("Instagram vereist een afbeelding. Geen foto gevonden bij deze post.")
        return await publish_to_instagram(
            access_token, platform_account_id, text, image_url, hashtags
        )
    elif channel == "x":
        return await publish_to_x(access_token, text, image_url, hashtags)
    else:
        raise ValueError(f"Onbekend kanaal: {channel}")
