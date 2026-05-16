-- Migration: Add Freemium (Pay As You Go) Plan
-- Description: Creates the Freemium tier subscription plan with ₹0 cost and lifetime duration
-- Date: 2026-05-13

-- Insert Freemium plan into subscription_plans table
INSERT INTO public.subscription_plans (
  plan_code,
  name,
  business_type,
  applicable_entities,
  pricing_matrix,
  base_features,
  entity_config,
  display_order,
  is_active,
  created_at,
  updated_at
) VALUES (
  'pay_as_you_go',
  'Freemium',
  'b2c',
  ARRAY['all']::text[],
  '{
    "all": {"monthly": 0, "yearly": 0, "currency": "INR"}
  }'::jsonb,
  '["dashboard_access", "profile_creation", "marketplace_access", "view_pricing", "opportunities_access", "courses_listing_access"]'::jsonb,
  '{
    "positioning": "Start free. Upgrade anytime to unlock all features.",
    "tagline": "Start free, upgrade anytime",
    "ideal_for": "Users who want to explore the platform",
    "storage_limit": "0GB",
    "duration": "lifetime"
  }'::jsonb,
  0,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (plan_code) DO NOTHING;

-- Verify the plan was created
DO $$
DECLARE
  plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count
  FROM public.subscription_plans
  WHERE plan_code = 'pay_as_you_go' AND is_active = true;
  
  IF plan_count = 0 THEN
    RAISE EXCEPTION 'Freemium plan was not created successfully';
  ELSE
    RAISE NOTICE 'Freemium plan created successfully';
  END IF;
END $$;
