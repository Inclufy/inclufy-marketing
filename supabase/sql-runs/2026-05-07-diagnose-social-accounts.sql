-- ────────────────────────────────────────────────────────────────────
-- DIAGNOSE social_accounts voor Sami's user — ZIE actuele tagging
-- Run in Supabase SQL editor (project: mpxkugfqzmxydxnlxqoj).
-- READ-ONLY. Wijzigt niets.
-- ────────────────────────────────────────────────────────────────────

-- 1. Toon alle Sami's social_accounts rows (vervang email als ander adres)
SELECT
  sa.id,
  sa.platform,
  sa.account_type,
  sa.account_name,
  sa.platform_account_id,
  sa.status,
  sa.connected_page_id,
  sa.connected_page_name,
  sa.created_at::date AS connected_on,
  CASE
    WHEN sa.platform = 'instagram' AND sa.account_type = 'personal' THEN '❌ BROKEN — personal IG kan niet publiceren'
    WHEN sa.platform = 'instagram' AND sa.account_type = 'business' THEN '✅ OK — IG Business werkt'
    WHEN sa.platform = 'facebook' AND sa.account_type = 'personal' AND sa.connected_page_id IS NULL THEN '⚠️ Geen page gekoppeld — publish faalt'
    WHEN sa.platform = 'facebook' AND sa.account_type = 'page' THEN '✅ OK — FB Page werkt'
    WHEN sa.platform = 'linkedin' AND sa.account_type = 'personal' THEN '✅ OK — LI personal werkt'
    WHEN sa.platform = 'linkedin' AND sa.account_type = 'company' THEN '🚫 LMDP pending — kan nog niet publiceren'
    ELSE '? Onbekend'
  END AS publish_status
FROM social_accounts sa
JOIN auth.users u ON sa.user_id = u.id
WHERE u.email = 'sami@inclufy.com'
ORDER BY sa.platform, sa.account_type;

-- 2. Tel rows die hotfix nodig hebben (mistagged IG personal die eigenlijk FB-user-IDs zijn)
SELECT
  COUNT(*) FILTER (WHERE platform = 'instagram' AND account_type = 'personal') AS broken_ig_personal_count,
  COUNT(*) FILTER (WHERE platform = 'facebook' AND account_type = 'personal' AND connected_page_id IS NULL) AS fb_no_page_count,
  COUNT(*) FILTER (WHERE platform = 'instagram' AND account_type = 'business') AS valid_ig_business_count,
  COUNT(*) FILTER (WHERE platform = 'facebook' AND account_type = 'page') AS valid_fb_page_count
FROM social_accounts sa
JOIN auth.users u ON sa.user_id = u.id
WHERE u.email = 'sami@inclufy.com';

-- 3. Check oauth_tokens — moeten 1-op-1 matchen met social_accounts
SELECT
  ot.id AS token_id,
  ot.social_account_id,
  sa.platform,
  sa.account_type,
  sa.account_name,
  ot.expires_at::date AS token_expires,
  CASE WHEN sa.id IS NULL THEN '⚠️ ORPHAN — social_account verwijderd' ELSE 'ok' END AS state
FROM oauth_tokens ot
LEFT JOIN social_accounts sa ON ot.social_account_id = sa.id
JOIN auth.users u ON COALESCE(sa.user_id, ot.user_id) = u.id
WHERE u.email = 'sami@inclufy.com'
ORDER BY sa.platform NULLS LAST, sa.account_type NULLS LAST;
