-- Migration: Create plans_cache shadow table
-- Read-only projection of auth DB plans for pricing pages and plan lookups.
-- ~8 rows, rarely changes. Synced on deploy and on-demand.

CREATE TABLE IF NOT EXISTS public.plans_cache (
  id uuid PRIMARY KEY,
  plan_code text UNIQUE NOT NULL,
  name text NOT NULL,
  business_type text NOT NULL,
  applicable_entities text[] NOT NULL DEFAULT '{}',
  pricing_matrix jsonb NOT NULL DEFAULT '{}',
  base_features jsonb DEFAULT '[]',
  entity_config jsonb DEFAULT '{}',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now(),
  auth_updated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_plans_cache_code ON public.plans_cache(plan_code);
CREATE INDEX idx_plans_cache_active ON public.plans_cache(is_active) WHERE is_active = true;

COMMENT ON TABLE public.plans_cache
IS 'Read-only shadow of auth DB plans (~8 rows). Used by pricing pages and plan lookups. Source of truth is auth DB.';
