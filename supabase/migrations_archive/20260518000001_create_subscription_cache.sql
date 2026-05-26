-- Migration: Create subscription_cache shadow table
-- Read-only projection of auth DB subscriptions for fast local reads.
-- Source of truth is auth DB. Self-heals via synced_at staleness detection.

CREATE TABLE IF NOT EXISTS public.subscription_cache (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users_shadow(id) ON DELETE CASCADE,
  organization_id uuid,

  -- Denormalized plan data (eliminates JOIN for feature gating)
  plan_id uuid NOT NULL,
  plan_code text NOT NULL,
  plan_name text,
  plan_type text,
  plan_amount numeric(10,2) DEFAULT 0,
  billing_cycle text,
  status text NOT NULL DEFAULT 'pending',
  features jsonb NOT NULL DEFAULT '[]',

  -- Key dates
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,

  -- Org fields
  is_organization_subscription boolean DEFAULT false,
  organization_type text,
  seat_count integer DEFAULT 1,
  assigned_seats integer DEFAULT 0,

  -- Sync metadata
  synced_at timestamptz NOT NULL DEFAULT now(),
  auth_updated_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_sub_cache_active_user
  ON public.subscription_cache(user_id)
  WHERE status IN ('active', 'pending');

CREATE INDEX idx_sub_cache_user ON public.subscription_cache(user_id);
CREATE INDEX idx_sub_cache_status ON public.subscription_cache(status);
CREATE INDEX idx_sub_cache_org ON public.subscription_cache(organization_id)
  WHERE organization_id IS NOT NULL;
CREATE INDEX idx_sub_cache_staleness ON public.subscription_cache(synced_at);

COMMENT ON TABLE public.subscription_cache
IS 'Read-only shadow of auth DB subscriptions. Self-heals via synced_at staleness detection. Source of truth is auth DB.';

-- Staleness detection helper
CREATE OR REPLACE FUNCTION public.get_stale_subscriptions(stale_threshold_minutes int DEFAULT 60)
RETURNS SETOF public.subscription_cache
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT * FROM public.subscription_cache
  WHERE synced_at < (now() - (stale_threshold_minutes || ' minutes')::interval)
  ORDER BY synced_at ASC
  LIMIT 100;
$$;
