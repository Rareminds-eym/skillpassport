-- Migration: Entitlement Engine Foundation
-- Description: Adds plan hierarchy, feature catalog, and plan-to-feature entitlement matrix
-- Pattern: Entitlement Engine (Stigg / Schematic / Stripe Entitlements)
-- Date: 2026-10-16

BEGIN;

-- 1. Extend plans_cache with plan_family and hierarchy_order
ALTER TABLE public.plans_cache
  ADD COLUMN IF NOT EXISTS plan_family VARCHAR(50) DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS hierarchy_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_plan_id UUID REFERENCES public.plans_cache(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_plans_cache_family_order 
  ON public.plans_cache (plan_family, hierarchy_order) 
  WHERE is_active = true;

-- Update existing individual plans to have explicit family and order
UPDATE public.plans_cache
SET plan_family = 'individual',
    hierarchy_order = CASE
      WHEN plan_code = 'freemium' THEN 0
      WHEN plan_code = 'basic' THEN 1
      WHEN plan_code = 'professional' THEN 2
      WHEN plan_code = 'premium' THEN 3
      WHEN plan_code = 'enterprise' THEN 4
      ELSE display_order
    END
WHERE plan_family IS NULL OR plan_family = 'individual';

-- Update existing institutional plans to have explicit institution family
UPDATE public.plans_cache
SET plan_family = 'institution'
WHERE plan_code LIKE 'school_%'
   OR plan_code LIKE 'college_%'
   OR plan_code LIKE 'university_%'
   OR plan_code = 'hybrid'
   OR 'school' = ANY(applicable_entities)
   OR 'college' = ANY(applicable_entities)
   OR 'university' = ANY(applicable_entities);

-- 2. Features Catalog (All gatable capabilities across tiers)
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  feature_type VARCHAR(20) NOT NULL DEFAULT 'boolean' CHECK (feature_type IN ('boolean', 'numeric_limit', 'metered')),
  category VARCHAR(100) NOT NULL DEFAULT 'core',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.features IS 'Master catalog of all system capabilities and limits that can be assigned to plans.';

CREATE INDEX IF NOT EXISTS idx_features_key ON public.features(feature_key);
CREATE INDEX IF NOT EXISTS idx_features_category ON public.features(category);

-- 3. Plan Entitlements Matrix (Which plan gets which feature & with what limit)
CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans_cache(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  value_numeric NUMERIC, -- quota limit or credit allowance
  value_text TEXT,       -- optional tier configuration or rule
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_plan_feature UNIQUE (plan_id, feature_id)
);

COMMENT ON TABLE public.plan_entitlements IS 'Associates plans with features and defines limits/quotas. Zero-hardcoding feature matrix.';

CREATE INDEX IF NOT EXISTS idx_plan_entitlements_plan ON public.plan_entitlements(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_entitlements_feature ON public.plan_entitlements(feature_id);

-- 4. Tenant Entitlement Overrides (Custom enterprise grants, pilot trials, add-ons)
CREATE TABLE IF NOT EXISTS public.tenant_entitlement_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- organization_id or user_id
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  value_numeric NUMERIC,
  value_text TEXT,
  expires_at TIMESTAMPTZ, -- null = permanent override
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_tenant_feature UNIQUE (tenant_id, feature_id)
);

COMMENT ON TABLE public.tenant_entitlement_overrides IS 'Tenant-level overrides for custom sales agreements, enterprise add-ons, or trials.';

CREATE INDEX IF NOT EXISTS idx_tenant_overrides_tenant ON public.tenant_entitlement_overrides(tenant_id);

-- 5. Access model (project convention): no RLS; explicit grants; authorization happens in
-- the backend (Pages Functions) using the service_role key. Tables are never exposed to
-- the anon key via PostgREST.
ALTER TABLE public.features DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_entitlement_overrides DISABLE ROW LEVEL SECURITY;

DO $access$
DECLARE
  r RECORD;
  tbl TEXT;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('features', 'plan_entitlements', 'tenant_entitlement_overrides')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;

  FOREACH tbl IN ARRAY ARRAY['features', 'plan_entitlements', 'tenant_entitlement_overrides']
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', tbl);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', tbl);
  END LOOP;
END
$access$;

COMMIT;
