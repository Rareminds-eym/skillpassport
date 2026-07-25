-- Sync Recruitment Plans to Skillpassport
-- This inserts the 4 recruitment plans directly into Skillpassport's plans_cache table
-- Run this in Skillpassport Supabase (local or production)

BEGIN;

-- Insert recruitment plans directly (no FDW dependency)
INSERT INTO plans_cache (
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
  synced_at
) VALUES
-- Recruiter Starter (Free)
(
  'b0000000-0000-4000-8000-000000000001',
  'recruiter_starter',
  'Recruiter Starter',
  'b2b',
  ARRAY['recruitment'],
  '{"recruitment": {"yearly": 0, "monthly": 0, "currency": "INR"}}'::jsonb,
  '[
    "recruiter_login",
    "talent_pool_access_limited",
    "basic_filters_skills_location",
    "candidate_profile_preview",
    "shortlist_creation",
    "basic_messaging",
    "limited_job_postings_3"
  ]'::jsonb,
  '{
    "recruitment": {
      "tagline": "For small employers hiring occasionally",
      "duration": "forever",
      "ideal_for": "SMEs, local employers, first-time hiring partners",
      "max_users": 1,
      "description": "Free tier with basic recruitment features to get started",
      "positioning": "For small employers hiring occasionally",
      "display_name": "Recruiter Starter",
      "storage_limit": "1GB",
      "is_recommended": false
    }
  }'::jsonb,
  10,
  true,
  '912d5049-e195-46e9-a319-49e3502bf7e7',
  NOW()
),
-- Recruiter Pro (Popular)
(
  'b0000000-0000-4000-8000-000000000002',
  'recruiter_pro',
  'Recruiter Pro',
  'b2b',
  ARRAY['recruitment'],
  '{"recruitment": {"yearly": 49990, "monthly": 4999, "currency": "INR"}}'::jsonb,
  '[
    "everything_in_starter",
    "requisitions_job_management",
    "applicants_list_tracking",
    "ai_match_score",
    "saved_searches",
    "candidate_comparison",
    "interview_scheduling",
    "shareable_shortlists",
    "basic_analytics",
    "export_mini_profiles",
    "unlimited_job_postings"
  ]'::jsonb,
  '{
    "recruitment": {
      "tagline": "For active hiring teams",
      "duration": "monthly",
      "ideal_for": "Companies hiring regularly from the talent ecosystem",
      "max_users": 3,
      "description": "Complete recruitment toolkit with AI-powered matching and analytics",
      "positioning": "For active hiring teams",
      "display_name": "Recruiter Pro",
      "storage_limit": "10GB",
      "is_recommended": true
    }
  }'::jsonb,
  20,
  true,
  '912d5049-e195-46e9-a319-49e3502bf7e7',
  NOW()
),
-- Recruiter Premium
(
  'b0000000-0000-4000-8000-000000000003',
  'recruiter_premium',
  'Recruiter Premium',
  'b2b',
  ARRAY['recruitment'],
  '{"recruitment": {"yearly": 99990, "monthly": 9999, "currency": "INR"}}'::jsonb,
  '[
    "everything_in_pro",
    "ai_recruiter_copilot",
    "external_audited_filter",
    "verified_evidence_tabs",
    "pipeline_kanban",
    "offer_decision_tracking",
    "team_notes_ratings",
    "whatsapp_email_templates",
    "csv_ats_export",
    "advanced_analytics_funnel",
    "time_to_hire_metrics",
    "quality_hire_tracking",
    "geography_analytics"
  ]'::jsonb,
  '{
    "recruitment": {
      "tagline": "For serious placement and recruitment partners",
      "duration": "monthly",
      "ideal_for": "Recruitment agencies, corporates, sector-specific hiring drives",
      "max_users": 10,
      "description": "Premium features with AI copilot, verified evidence, and advanced analytics",
      "positioning": "For serious placement and recruitment partners",
      "display_name": "Recruiter Premium",
      "storage_limit": "50GB",
      "is_recommended": false
    }
  }'::jsonb,
  30,
  true,
  '912d5049-e195-46e9-a319-49e3502bf7e7',
  NOW()
),
-- Enterprise Recruitment Suite
(
  'b0000000-0000-4000-8000-000000000004',
  'recruiter_enterprise',
  'Enterprise Recruitment Suite',
  'b2b',
  ARRAY['recruitment'],
  '{"recruitment": {"yearly": 0, "monthly": 0, "currency": "INR", "custom": true}}'::jsonb,
  '[
    "everything_in_premium",
    "multiple_recruiter_seats",
    "organization_subscription",
    "bulk_hiring_campaigns",
    "campus_placement_workflows",
    "custom_assessment_rubric",
    "branded_hiring_page",
    "api_ats_webhook_integration",
    "compliance_audit_log",
    "dedicated_account_support",
    "custom_reports_dashboards",
    "sso_integration",
    "white_label_options",
    "priority_support_sla"
  ]'::jsonb,
  '{
    "recruitment": {
      "tagline": "For large employers, colleges, universities, and placement partnerships",
      "duration": "custom",
      "ideal_for": "Universities, large corporates, government/CSR placement programs",
      "max_users": 999999,
      "description": "Enterprise-grade recruitment suite with custom features and dedicated support",
      "positioning": "For large employers, colleges, universities, and placement partnerships",
      "display_name": "Enterprise Recruitment Suite",
      "storage_limit": "unlimited",
      "is_recommended": false,
      "contact_sales": true
    }
  }'::jsonb,
  40,
  true,
  '912d5049-e195-46e9-a319-49e3502bf7e7',
  NOW()
)
ON CONFLICT (plan_code) DO UPDATE SET
  name = EXCLUDED.name,
  pricing_matrix = EXCLUDED.pricing_matrix,
  base_features = EXCLUDED.base_features,
  entity_config = EXCLUDED.entity_config,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  synced_at = NOW();

COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify recruitment plans were synced
SELECT 
  plan_code, 
  name, 
  (pricing_matrix->'recruitment'->>'monthly')::int as monthly_price,
  (pricing_matrix->'recruitment'->>'yearly')::int as yearly_price,
  (entity_config->'recruitment'->>'is_recommended')::boolean as recommended,
  applicable_entities,
  display_order,
  is_active
FROM plans_cache
WHERE applicable_entities @> ARRAY['recruitment']
ORDER BY display_order;

-- Count recruitment plans in cache
SELECT COUNT(*) as recruitment_plans_in_cache
FROM plans_cache
WHERE applicable_entities @> ARRAY['recruitment'];

-- Show sync timestamp
SELECT 
  plan_code, 
  name,
  synced_at
FROM plans_cache
WHERE applicable_entities @> ARRAY['recruitment']
ORDER BY display_order;
