-- MANUAL PATCH: Access-model hardening & credit idempotency
-- Run once by hand on any already-seeded DB (local dev or hosted).
-- Safe to re-run (fully idempotent). Do NOT run through a migration tool.
--
-- Context: the recruiter subscription migration files (20261016120...) were applied to
-- this DB before the access-model correction; this patch converges live objects to the
-- project access model (no RLS policies; REVOKE from PUBLIC/anon/authenticated; grants
-- only to service_role) and installs the credit-allocation idempotency index (C3).
-- Verified ids: credit_ledger, candidate_contact_unlocks, features, plan_entitlements,
-- tenant_entitlement_overrides, consume_credits, get_credit_balance.

BEGIN;

-- ── 1. Tables: drop RLS policies, revoke public-series access, grant service_role ──
DO $patch$
DECLARE
  tbl TEXT;
  r RECORD;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'credit_ledger',
    'candidate_contact_unlocks',
    'features',
    'plan_entitlements',
    'tenant_entitlement_overrides',
    'addon_catalog'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      FOR r IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = tbl
      LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, tbl);
      END LOOP;

      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', tbl);

      EXECUTE format(
        'REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', tbl
      );
      -- addon_catalog: no runtime reader in the app DB (catalog lives in the sso auth
      -- DB); grant is kept ready if the table is retained for local-only tooling.
      EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', tbl);
    ELSE
      RAISE NOTICE 'table skipped (not present): %', tbl;
    END IF;
  END LOOP;
END
$patch$;

-- ── 2. SECURITY DEFINER credit functions: harden search_path and revoke public-series ──
-- Postgres grants EXECUTE to PUBLIC by default; only an explicit REVOKE FROM PUBLIC closes it.
DO $patch$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'consume_credits'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.consume_credits(UUID, VARCHAR, INTEGER, VARCHAR, TEXT) SET search_path = pg_catalog, public';
    EXECUTE 'ALTER FUNCTION public.consume_credits(UUID, VARCHAR, INTEGER, VARCHAR, TEXT) SECURITY DEFINER';
    EXECUTE 'REVOKE ALL ON FUNCTION public.consume_credits(UUID, VARCHAR, INTEGER, VARCHAR, TEXT) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.consume_credits(UUID, VARCHAR, INTEGER, VARCHAR, TEXT) TO service_role';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'get_credit_balance'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.get_credit_balance(UUID, VARCHAR) SET search_path = pg_catalog, public';
    EXECUTE 'ALTER FUNCTION public.get_credit_balance(UUID, VARCHAR) SECURITY DEFINER';
    EXECUTE 'REVOKE ALL ON FUNCTION public.get_credit_balance(UUID, VARCHAR) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_credit_balance(UUID, VARCHAR) TO service_role';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'unlock_candidate_contact'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.unlock_candidate_contact(UUID, TEXT, UUID) SET search_path = pg_catalog, public';
    EXECUTE 'ALTER FUNCTION public.unlock_candidate_contact(UUID, TEXT, UUID) SECURITY DEFINER';
    EXECUTE 'REVOKE ALL ON FUNCTION public.unlock_candidate_contact(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.unlock_candidate_contact(UUID, TEXT, UUID) TO service_role';
  END IF;
END
$patch$;

-- ── 3. Idempotency index for credit allocations (C3) ──
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_ledger_alloc_ref
  ON public.credit_ledger (tenant_id, feature_key, reference_id)
  WHERE reference_id IS NOT NULL AND amount > 0
    AND transaction_type IN ('plan_allocation', 'topup_purchase', 'rollover');

-- ── 4. Add-on fulfilment columns (boost / featured visibility windows) ──
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_opportunities_visibility
  ON public.opportunities (boosted_until DESC NULLS LAST, featured_until DESC NULLS LAST, created_at DESC);

-- ── 5. H8 backfill: subscription_cache rows synced with empty features arrays ──
-- sync-shadow.ts previously stored `[]` (truthy shadow of base_features) for self-serve
-- org purchases; healed rows would otherwise deny every legacy feature check until renewal.
UPDATE public.subscription_cache sc
SET features = pc.base_features
FROM public.plans_cache pc
WHERE sc.plan_id = pc.id
  AND sc.status IN ('active', 'grace_period', 'cancelled')
  AND (sc.features IS NULL OR sc.features::text = '[]')
  AND pc.base_features IS NOT NULL
  AND pc.base_features::text <> '[]'
  AND (sc.features::text IS DISTINCT FROM pc.base_features::text);

COMMIT;
