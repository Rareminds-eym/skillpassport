-- Migration: Seed Features Catalog, Recruiter Plans & Entitlements
-- Source: skillpassport/skill_ecosystem_recruiter_subscription_model_final 1.md
-- Date: 2026-10-16

BEGIN;

-- Preserve v1 catalog IDs and any references while freeing the plan codes
-- reused by the v2 catalog. Subscription rows are remapped separately by
-- 20261016120300; changing or deleting the old primary keys would lose history.
UPDATE public.plans_cache
SET plan_code = 'legacy_' || plan_code,
    is_active = false,
    plan_family = 'recruiter',
    updated_at = NOW()
WHERE (id, plan_code) IN (
  ('b0000000-0000-4000-8000-000000000001'::uuid, 'recruiter_starter'),
  ('b0000000-0000-4000-8000-000000000002'::uuid, 'recruiter_pro'),
  ('b0000000-0000-4000-8000-000000000004'::uuid, 'recruiter_enterprise')
);

-- ============================================================
-- 1. SEED FEATURES CATALOG
-- ============================================================
INSERT INTO public.features (feature_key, display_name, feature_type, category, description) VALUES
  ('active_job_posts', 'Active Job Posts', 'numeric_limit', 'hiring', 'Maximum number of simultaneously active published job vacancies.'),
  ('recruiter_seats', 'Recruiter Seats', 'numeric_limit', 'team', 'Number of team members with recruiter dashboard access.'),
  ('contact_unlocks', 'Contact Unlocks', 'metered', 'credits', 'Direct candidate contact access (email, phone, direct messaging).'),
  ('candidate_invites', 'Candidate Invites', 'metered', 'credits', 'Outreach invitations sent directly to matching talent.'),
  ('job_boost_credits', 'Job Boost Credits', 'metered', 'credits', 'Each credit boosts job visibility in the learner feed for a limited period (spec section 6).'),
  ('ai_credits', 'AI Shortlist Credits', 'metered', 'credits', 'Credits for generating AI role-specific candidate shortlists (spec section 6).'),
  ('featured_employer', 'Featured Employer', 'boolean', 'branding', 'Enhanced employer branding across candidate search and job listings (add-on grant).'),
  ('employer_profile', 'Employer Profile & Branding', 'boolean', 'branding', 'Company profile with logo, description, and website.'),
  ('candidate_search', 'Candidate Search & Discovery', 'boolean', 'sourcing', 'Search verified candidate database with basic filters.'),
  ('advanced_skill_filters', 'Advanced Skill & Portfolio Filters', 'boolean', 'sourcing', 'Filter by verified skill credentials, portfolio proof, and experience depth.'),
  ('readiness_score_view', 'Readiness Score View', 'boolean', 'evaluation', 'View candidate skill-readiness and benchmark scores.'),
  ('full_assessment_insights', 'Full Assessment & Psychometric Insights', 'boolean', 'evaluation', 'Detailed breakdown of candidate assessment test results and sub-skill metrics.'),
  ('ai_candidate_recommendations', 'AI Candidate Shortlists & Recommendations', 'boolean', 'ai', 'Automated AI matching recommendations for open roles.'),
  ('shortlist_folders', 'Shortlist Folders & Tagging', 'boolean', 'workflow', 'Organize and track shortlisted applicants with custom tags.'),
  ('bulk_actions', 'Bulk Shortlist & Invite Actions', 'boolean', 'workflow', 'Batch invite and shortlist operations for high-volume hiring.'),
  ('role_wise_hiring_reports', 'Role-wise Hiring Reports', 'boolean', 'analytics', 'Pipeline conversion and applicant analytics per role.'),
  ('advanced_hiring_analytics', 'Advanced Team & Pipeline Analytics', 'boolean', 'analytics', 'Comprehensive recruiter performance and hiring velocity analytics.'),
  ('campus_talent_access', 'Campus & Institution Talent Access', 'boolean', 'enterprise', 'Direct hiring access to affiliated college and university batches.'),
  ('ats_api_integration', 'ATS & API Integration', 'boolean', 'enterprise', 'Webhook and REST API sync with external ATS platforms.'),
  ('dedicated_account_manager', 'Dedicated Account Manager', 'boolean', 'enterprise', 'Assigned customer success manager with priority SLA support.')
ON CONFLICT (feature_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  feature_type = EXCLUDED.feature_type,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================
-- 2. SEED RECRUITER PLANS IN plans_cache
-- ============================================================
INSERT INTO public.plans_cache (
  id,
  plan_code,
  name,
  business_type,
  applicable_entities,
  pricing_matrix,
  base_features,
  entity_config,
  display_order,
  is_active,
  product_id,
  plan_family,
  hierarchy_order
) VALUES
-- 1. Recruiter Free (INR 0)
(
  'b0000000-0000-4000-8000-000000000010',
  'recruiter_free',
  'Recruiter Free',
  'b2b',
  ARRAY['recruitment'],
  '{"recruitment": {"yearly": 0, "monthly": 0, "currency": "INR"}}'::jsonb,
  '["active_job_posts_1", "employer_profile", "candidate_profile_preview", "candidate_invites_25", "basic_applicant_tracking", "email_support"]'::jsonb,
  '{
    "recruitment": {
      "tagline": "Post the first job and receive applications.",
      "duration": "yearly",
      "ideal_for": "First-time employers, startups, small/local employers",
      "max_users": 1,
      "description": "Free entry plan to test applicant flow with 1 active job post.",
      "display_name": "Free",
      "purchase_mode": "self_serve",
      "is_recommended": false,
      "cta_text": "Post Free Job",
      "capacity": {
        "recruiters": 1,
        "job_postings": 1,
        "candidate_invites": 25,
        "contact_unlocks": 0
      }
    }
  }'::jsonb,
  10,
  true,
  '912d5049-e195-46e9-a319-49e3502bf7e7',
  'recruiter',
  0
),

-- 2. Recruiter Lite (INR 2,500/year)
(
  'b0000000-0000-4000-8000-000000000020',
  'recruiter_lite',
  'Recruiter Lite',
  'b2b',
  ARRAY['recruitment'],
  '{"recruitment": {"yearly": 2500, "currency": "INR"}}'::jsonb,
  '["active_job_posts_3", "contact_unlocks_25", "basic_candidate_search", "readiness_score_view", "candidate_invites_100", "basic_shortlist_folder"]'::jsonb,
  '{
    "recruitment": {
      "tagline": "For occasional hiring.",
      "duration": "yearly",
      "ideal_for": "Occasional hiring, individual recruiters",
      "max_users": 1,
      "description": "Low-cost paid entry with 3 job posts, 25 contact unlocks and readiness scores.",
      "display_name": "Lite",
      "purchase_mode": "self_serve",
      "is_recommended": false,
      "cta_text": "Start Hiring",
      "capacity": {
        "recruiters": 1,
        "job_postings": 3,
        "candidate_invites": 100,
        "contact_unlocks": 25
      }
    }
  }'::jsonb,
  20,
  true,
  '912d5049-e195-46e9-a319-49e3502bf7e7',
  'recruiter',
  1
),

-- 3. Recruiter Starter (INR 7,500/year - Hidden from top public cards, visible in comparison/checkout)
(
  'b0000000-0000-4000-8000-000000000030',
  'recruiter_starter',
  'Recruiter Starter',
  'b2b',
  ARRAY['recruitment'],
  '{"recruitment": {"yearly": 7500, "currency": "INR"}}'::jsonb,
  '["active_job_posts_7", "contact_unlocks_75", "candidate_search_plus", "readiness_score_view", "candidate_invites_300", "shortlist_folder_with_tags", "job_boost_credits_5"]'::jsonb,
  '{
    "recruitment": {
      "tagline": "Affordable paid plan with useful sourcing limits.",
      "duration": "yearly",
      "ideal_for": "Small companies hiring a few roles annually",
      "max_users": 1,
      "description": "7 job posts and 75 candidate unlocks for growing small businesses.",
      "display_name": "Starter",
      "purchase_mode": "self_serve",
      "is_recommended": false,
      "is_hidden_from_public_cards": true,
      "cta_text": "Choose Starter",
      "capacity": {
        "recruiters": 1,
        "job_postings": 7,
        "candidate_invites": 300,
        "contact_unlocks": 75
      }
    }
  }'::jsonb,
  30,
  true,
  '912d5049-e195-46e9-a319-49e3502bf7e7',
  'recruiter',
  2
),

-- 4. Recruiter Growth (INR 15,000/year - Recommended / Most Popular)
(
  'b0000000-0000-4000-8000-000000000040',
  'recruiter_growth',
  'Recruiter Growth',
  'b2b',
  ARRAY['recruitment'],
  '{"recruitment": {"yearly": 15000, "currency": "INR"}}'::jsonb,
  '["active_job_posts_15", "recruiter_seats_3", "contact_unlocks_200", "advanced_skill_filters", "ai_candidate_recommendations", "role_wise_hiring_reports", "candidate_invites_1000", "job_boost_credits_20", "ai_credits_10"]'::jsonb,
  '{
    "recruitment": {
      "tagline": "For regular hiring teams.",
      "duration": "yearly",
      "ideal_for": "Regular hiring teams, growing SMBs",
      "max_users": 3,
      "description": "Main paid plan with 15 active jobs, 3 recruiter seats, 200 unlocks, and AI matching.",
      "display_name": "Growth",
      "purchase_mode": "self_serve",
      "is_recommended": true,
      "badge": "Most Popular for Active Hiring",
      "cta_text": "Upgrade to Growth",
      "capacity": {
        "recruiters": 3,
        "job_postings": 15,
        "candidate_invites": 1000,
        "contact_unlocks": 200
      }
    }
  }'::jsonb,
  40,
  true,
  '912d5049-e195-46e9-a319-49e3502bf7e7',
  'recruiter',
  3
),

-- 5. Recruiter Pro (INR 35,000/year)
(
  'b0000000-0000-4000-8000-000000000050',
  'recruiter_pro',
  'Recruiter Pro',
  'b2b',
  ARRAY['recruitment'],
  '{"recruitment": {"yearly": 35000, "currency": "INR"}}'::jsonb,
  '["active_job_posts_40", "recruiter_seats_5", "contact_unlocks_500", "full_assessment_insights", "bulk_shortlist_and_invite", "advanced_hiring_analytics", "candidate_invites_3000", "job_boost_credits_75", "ai_credits_100"]'::jsonb,
  '{
    "recruitment": {
      "tagline": "For high-volume hiring.",
      "duration": "yearly",
      "ideal_for": "High-volume hiring, staffing partners, scaling startups",
      "max_users": 5,
      "description": "Premium sourcing with 40 job posts, 5 seats, 500 unlocks, and full assessment insights.",
      "display_name": "Pro",
      "purchase_mode": "self_serve",
      "is_recommended": false,
      "cta_text": "Go Pro",
      "capacity": {
        "recruiters": 5,
        "job_postings": 40,
        "candidate_invites": 3000,
        "contact_unlocks": 500
      }
    }
  }'::jsonb,
  50,
  true,
  '912d5049-e195-46e9-a319-49e3502bf7e7',
  'recruiter',
  4
),

-- 6. Recruiter Enterprise (From INR 75,000/year - Sales led)
(
  'b0000000-0000-4000-8000-000000000060',
  'recruiter_enterprise',
  'Recruiter Enterprise',
  'b2b',
  ARRAY['recruitment'],
  '{"recruitment": {"yearly": 75000, "currency": "INR"}}'::jsonb,
  '["custom_seats", "custom_hiring_volume", "campus_talent_access", "ats_api_integration", "dedicated_campaigns", "dedicated_account_manager", "custom_job_boost_credits", "custom_ai_credits"]'::jsonb,
  '{
    "recruitment": {
      "tagline": "For campus, bulk and strategic hiring.",
      "duration": "yearly",
      "ideal_for": "Bulk hiring, campus hiring, enterprise teams",
      "max_users": 10,
      "description": "Custom volume hiring with campus access, ATS integration, and dedicated account manager.",
      "display_name": "Enterprise",
      "purchase_mode": "contact_sales",
      "is_recommended": false,
      "price_label": "From INR 75,000 / year",
      "cta_text": "Talk to Sales",
      "cta_link": "mailto:enterprise@skillpassport.com?subject=Recruiter%20Enterprise%20Inquiry",
      "capacity": {
        "recruiters": 10,
        "job_postings": 100,
        "candidate_invites": 10000,
        "contact_unlocks": 2000
      }
    }
  }'::jsonb,
  60,
  true,
  '912d5049-e195-46e9-a319-49e3502bf7e7',
  'recruiter',
  5
)
ON CONFLICT (id) DO UPDATE SET
  plan_code = EXCLUDED.plan_code,
  name = EXCLUDED.name,
  pricing_matrix = EXCLUDED.pricing_matrix,
  base_features = EXCLUDED.base_features,
  entity_config = EXCLUDED.entity_config,
  display_order = EXCLUDED.display_order,
  is_active = true,
  plan_family = 'recruiter',
  hierarchy_order = EXCLUDED.hierarchy_order,
  updated_at = NOW();

-- Also ensure old plans_cache rows for legacy recruiter plans are deactivated
UPDATE public.plans_cache
SET is_active = false
WHERE plan_code IN ('recruiter_premium')
  AND id NOT IN ('b0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000020', 'b0000000-0000-4000-8000-000000000030', 'b0000000-0000-4000-8000-000000000040', 'b0000000-0000-4000-8000-000000000050', 'b0000000-0000-4000-8000-000000000060');

-- ============================================================
-- 3. SEED PLAN ENTITLEMENTS (Matrix mapping plans to features)
-- ============================================================

-- Helper procedure to map plan entitlements cleanly
DO $$
DECLARE
  v_plan_free UUID := 'b0000000-0000-4000-8000-000000000010';
  v_plan_lite UUID := 'b0000000-0000-4000-8000-000000000020';
  v_plan_starter UUID := 'b0000000-0000-4000-8000-000000000030';
  v_plan_growth UUID := 'b0000000-0000-4000-8000-000000000040';
  v_plan_pro UUID := 'b0000000-0000-4000-8000-000000000050';
  v_plan_enterprise UUID := 'b0000000-0000-4000-8000-000000000060';

  v_feat RECORD;
BEGIN
  -- 1. Active Job Posts
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'active_job_posts';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled, value_numeric) VALUES
    (v_plan_free, v_feat.id, true, 1),
    (v_plan_lite, v_feat.id, true, 3),
    (v_plan_starter, v_feat.id, true, 7),
    (v_plan_growth, v_feat.id, true, 15),
    (v_plan_pro, v_feat.id, true, 40),
    (v_plan_enterprise, v_feat.id, true, 100)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, is_enabled = true;

  -- 2. Recruiter Seats
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'recruiter_seats';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled, value_numeric) VALUES
    (v_plan_free, v_feat.id, true, 1),
    (v_plan_lite, v_feat.id, true, 1),
    (v_plan_starter, v_feat.id, true, 1),
    (v_plan_growth, v_feat.id, true, 3),
    (v_plan_pro, v_feat.id, true, 5),
    (v_plan_enterprise, v_feat.id, true, 10)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, is_enabled = true;

  -- 3. Contact Unlocks
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'contact_unlocks';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled, value_numeric) VALUES
    (v_plan_free, v_feat.id, false, 0),
    (v_plan_lite, v_feat.id, true, 25),
    (v_plan_starter, v_feat.id, true, 75),
    (v_plan_growth, v_feat.id, true, 200),
    (v_plan_pro, v_feat.id, true, 500),
    (v_plan_enterprise, v_feat.id, true, 2000)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, is_enabled = EXCLUDED.is_enabled;

  -- 4. Candidate Invites
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'candidate_invites';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled, value_numeric) VALUES
    (v_plan_free, v_feat.id, true, 25),
    (v_plan_lite, v_feat.id, true, 100),
    (v_plan_starter, v_feat.id, true, 300),
    (v_plan_growth, v_feat.id, true, 1000),
    (v_plan_pro, v_feat.id, true, 3000),
    (v_plan_enterprise, v_feat.id, true, 10000)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, is_enabled = true;

  -- 4a. Job Boost Credits (metered; spec §5: Starter 5, Growth 20, Pro 75; Enterprise custom placeholder)
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'job_boost_credits';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled, value_numeric) VALUES
    (v_plan_free, v_feat.id, false, 0),
    (v_plan_lite, v_feat.id, false, 0),
    (v_plan_starter, v_feat.id, true, 5),
    (v_plan_growth, v_feat.id, true, 20),
    (v_plan_pro, v_feat.id, true, 75),
    (v_plan_enterprise, v_feat.id, true, 100)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, is_enabled = EXCLUDED.is_enabled;

  -- 4b. AI Shortlist Credits (metered; spec §5: Free/Lite no; Starter add-on-only; Growth 10 limited;
  -- Pro 100 included; Enterprise custom placeholder)
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'ai_credits';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled, value_numeric) VALUES
    (v_plan_free, v_feat.id, false, 0),
    (v_plan_lite, v_feat.id, false, 0),
    (v_plan_starter, v_feat.id, false, 0),
    (v_plan_growth, v_feat.id, true, 10),
    (v_plan_pro, v_feat.id, true, 100),
    (v_plan_enterprise, v_feat.id, true, 200)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET value_numeric = EXCLUDED.value_numeric, is_enabled = EXCLUDED.is_enabled;

  -- 5. Employer Profile
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'employer_profile';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, true),
    (v_plan_lite, v_feat.id, true),
    (v_plan_starter, v_feat.id, true),
    (v_plan_growth, v_feat.id, true),
    (v_plan_pro, v_feat.id, true),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = true;

  -- 6. Candidate Search
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'candidate_search';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, true),
    (v_plan_starter, v_feat.id, true),
    (v_plan_growth, v_feat.id, true),
    (v_plan_pro, v_feat.id, true),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 7. Advanced Skill Filters
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'advanced_skill_filters';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, false),
    (v_plan_starter, v_feat.id, false),
    (v_plan_growth, v_feat.id, true),
    (v_plan_pro, v_feat.id, true),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 8. Readiness Score View
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'readiness_score_view';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, true),
    (v_plan_starter, v_feat.id, true),
    (v_plan_growth, v_feat.id, true),
    (v_plan_pro, v_feat.id, true),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 9. Full Assessment Insights
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'full_assessment_insights';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, false),
    (v_plan_starter, v_feat.id, false),
    (v_plan_growth, v_feat.id, false),
    (v_plan_pro, v_feat.id, true),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 10. AI Candidate Recommendations
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'ai_candidate_recommendations';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, false),
    (v_plan_starter, v_feat.id, false),
    (v_plan_growth, v_feat.id, true),
    (v_plan_pro, v_feat.id, true),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 11. Shortlist Folders
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'shortlist_folders';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, true),
    (v_plan_starter, v_feat.id, true),
    (v_plan_growth, v_feat.id, true),
    (v_plan_pro, v_feat.id, true),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 12. Bulk Actions
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'bulk_actions';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, false),
    (v_plan_starter, v_feat.id, false),
    (v_plan_growth, v_feat.id, false),
    (v_plan_pro, v_feat.id, true),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 13. Role-wise Hiring Reports
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'role_wise_hiring_reports';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, false),
    (v_plan_starter, v_feat.id, false),
    (v_plan_growth, v_feat.id, true),
    (v_plan_pro, v_feat.id, true),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 14. Advanced Hiring Analytics
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'advanced_hiring_analytics';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, false),
    (v_plan_starter, v_feat.id, false),
    (v_plan_growth, v_feat.id, false),
    (v_plan_pro, v_feat.id, true),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 15. Campus Talent Access
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'campus_talent_access';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, false),
    (v_plan_starter, v_feat.id, false),
    (v_plan_growth, v_feat.id, false),
    (v_plan_pro, v_feat.id, false),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 16. ATS API Integration
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'ats_api_integration';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, false),
    (v_plan_starter, v_feat.id, false),
    (v_plan_growth, v_feat.id, false),
    (v_plan_pro, v_feat.id, false),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

  -- 17. Dedicated Account Manager
  SELECT id INTO v_feat FROM public.features WHERE feature_key = 'dedicated_account_manager';
  INSERT INTO public.plan_entitlements (plan_id, feature_id, is_enabled) VALUES
    (v_plan_free, v_feat.id, false),
    (v_plan_lite, v_feat.id, false),
    (v_plan_starter, v_feat.id, false),
    (v_plan_growth, v_feat.id, false),
    (v_plan_pro, v_feat.id, false),
    (v_plan_enterprise, v_feat.id, true)
  ON CONFLICT (plan_id, feature_id) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

END $$;

COMMIT;
