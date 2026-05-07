-- ────────────────────────────────────────────────────────────────────
-- HOTFIX: verwijder IG rows met account_type='personal' (broken state)
--
-- Achtergrond: oauth-callback had bug waarbij IG OAuth ook een 'personal'
-- row aanmaakte met Facebook user ID als platform_account_id. Deze rows
-- staan in de picker maar fallen silent als user op tapt (publish-social
-- skipt IG rows met account_type != 'business').
--
-- Run NA `2026-05-07-diagnose-social-accounts.sql` zodat je eerst weet
-- hoeveel rijen geraakt worden.
--
-- DESTRUCTIVE — backup eerst (Supabase auto-snapshot is OK).
-- ────────────────────────────────────────────────────────────────────

-- DRY RUN — toont wat verwijderd zou worden, voert NIET uit
SELECT
  sa.id,
  sa.platform,
  sa.account_type,
  sa.account_name,
  sa.platform_account_id,
  sa.user_id,
  u.email
FROM social_accounts sa
JOIN auth.users u ON sa.user_id = u.id
WHERE sa.platform = 'instagram'
  AND sa.account_type = 'personal';

-- ────────────────────────────────────────────────────────────────────
-- REAL DELETE (uncomment to execute)
-- ────────────────────────────────────────────────────────────────────
-- BEGIN;
--
-- -- Delete oauth_tokens first (no cascade defined yet)
-- DELETE FROM oauth_tokens
-- WHERE social_account_id IN (
--   SELECT id FROM social_accounts
--   WHERE platform = 'instagram' AND account_type = 'personal'
-- );
--
-- -- Then the broken IG rows
-- DELETE FROM social_accounts
-- WHERE platform = 'instagram' AND account_type = 'personal';
--
-- -- Verify
-- SELECT
--   COUNT(*) FILTER (WHERE platform = 'instagram' AND account_type = 'personal') AS remaining_broken_ig,
--   COUNT(*) FILTER (WHERE platform = 'instagram' AND account_type = 'business') AS valid_ig_business
-- FROM social_accounts;
--
-- COMMIT;
