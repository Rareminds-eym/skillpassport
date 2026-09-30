-- Read-only shadow of the auth DB's public.feature_keys (canonical
-- admin-dashboard feature catalog — see sso-worker's feature_keys migration
-- and listFeatureKeys() RPC). Mirrors the existing plans_cache pattern:
-- source of truth lives in the auth DB, this table is synced via the cron
-- reconcile job (see functions/api/cron/reconcile-subscriptions.ts and
-- syncFeatureKeysCache in functions/lib/sync-shadow.ts).
--
-- Consumed by Sidebar.tsx to decide which nav items a Hybrid-plan org's
-- subscription_cache.features grants access to, and by the college-admin
-- API route handlers (functions/api/college-admin/*.ts) for server-side
-- enforcement via requireFeatureAccess-style guards.
--
-- Date: 2026-09-25
CREATE TABLE IF NOT EXISTS public.feature_keys_cache (
  id uuid NOT NULL PRIMARY KEY,
  product_id text,
  key text NOT NULL,
  role text NOT NULL,
  nav_group text,
  nav_label text NOT NULL,
  nav_path text NOT NULL,
  display_order integer DEFAULT 0,
  synced_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.feature_keys_cache IS
  'Read-only shadow of auth DB feature_keys. Used by Sidebar.tsx nav gating and college-admin API route guards. Source of truth is the auth DB.';

CREATE INDEX IF NOT EXISTS idx_feature_keys_cache_role
  ON public.feature_keys_cache (role);
