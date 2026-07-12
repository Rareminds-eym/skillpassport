-- ============================================================
-- PREMIUM SUBSCRIPTION CACHE - CLIENT TEST ACCOUNTS (SKILLPASSPORT DATABASE)
-- Accounts: ramya03@acharya.ac.in, principal.hit@harshainstitute.edu.in
-- Mirrors the SSO subscriptions in
-- sso-worker/supabase/seed/seed_zzz_zpremium_client_accounts.sql
-- (same subscription IDs). Runs after seed_zzz_ramya03.sql /
-- seed_zzz_principal_hit.sql, which create the users.
-- ============================================================

BEGIN;

-- users_shadow rows are required by subscription_cache's FK
INSERT INTO "public"."users_shadow" ("id", "email") VALUES
  ('3c14e807-1f15-5dec-b361-88fdb7a28820', 'ramya03@acharya.ac.in'),
  ('eb7313eb-bd50-582b-8da5-412ddf8d1ecd', 'principal.hit@harshainstitute.edu.in')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "public"."subscription_cache"
  ("id", "user_id", "plan_id", "plan_code", "plan_name", "plan_type", "plan_amount",
   "billing_cycle", "status", "features", "subscription_start_date", "subscription_end_date",
   "is_organization_subscription", "seat_count", "assigned_seats", "synced_at", "product_id")
VALUES
  ('a1b40c1e-52a3-5e2f-9b71-3f0c6d1e8a01', '3c14e807-1f15-5dec-b361-88fdb7a28820',
   '8460ee67-18ff-4c2e-ac57-7e1f87dc8316', 'premium', 'Career Accelerator', 'Premium', 999,
   'yearly', 'active',
   '["career_builder_features", "interview_readiness_tools", "resume_profile_review", "priority_opportunity_matching", "advanced_portfolio_proof", "career_progress_analytics"]',
   '2026-07-11 00:00:00+00', '2027-07-11 00:00:00+00',
   false, 1, 0, now(), '912d5049-e195-46e9-a319-49e3502bf7e7'),
  ('a1b40c1e-52a3-5e2f-9b71-3f0c6d1e8a02', 'eb7313eb-bd50-582b-8da5-412ddf8d1ecd',
   '8460ee67-18ff-4c2e-ac57-7e1f87dc8316', 'premium', 'Career Accelerator', 'Premium', 999,
   'yearly', 'active',
   '["career_builder_features", "interview_readiness_tools", "resume_profile_review", "priority_opportunity_matching", "advanced_portfolio_proof", "career_progress_analytics"]',
   '2026-07-11 00:00:00+00', '2027-07-11 00:00:00+00',
   false, 1, 0, now(), '912d5049-e195-46e9-a319-49e3502bf7e7')
ON CONFLICT ("id") DO NOTHING;

COMMIT;
