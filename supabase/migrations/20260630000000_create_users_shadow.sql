-- Migration: Create users_shadow table
-- Read-only projection of auth DB users for fast local reads.
-- Must exist before subscription_cache since subscription_cache references it.

CREATE TABLE IF NOT EXISTS public.users_shadow (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_shadow_email ON public.users_shadow(email);

COMMENT ON TABLE public.users_shadow
IS 'Shadow table for auth DB users. Referenced by subscription_cache.';
