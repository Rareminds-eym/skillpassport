-- Migration: Credit consumption idempotency + opportunity views counter RPC
--
-- (1) Partial UNIQUE index on credit_ledger consumption entries: uq_credit_ledger_alloc_ref
--     (20261016120100 / 20261017 hardening patch) only covers positive-side transaction
--     types (plan_allocation / topup_purchase / rollover). Consumption had NO uniqueness,
--     so a retried HTTP request double-charged the caller. This index implements the
--     Stripe/IETF Idempotency-Key pattern at the ledger level: a client passes one key
--     (reference_id) per logical operation and a replay can never insert a second row —
--     the API layer instead replays the original result.
--
-- (2) increment_opportunity_views(): atomic counter RPC replacing the read-then-write
--     increment (read-modify-write race silently loses concurrent views).
--
-- ⚠ DDL only per project standard 11.8 — no INSERT/UPDATE/DELETE here. Pre-existing
--   duplicate consumption rows (created before this index existed) would make this
--   CREATE fail with a unique-violation during index build. Run the operational
--   dedup seed FIRST if such rows exist — same file for dev and production:
--   supabase/seed/dev/20261019_credit_consumption_dedup.sql
--   (byte-identical mirror in supabase/seed/production/).
--
-- Deployment order:
-- 1. Run this migration against the target DB.
--    If the CREATE UNIQUE INDEX fails with a unique violation, the DB holds
--    legacy duplicate consumption rows (created before any idempotency guard
--    existed): remove them manually keeping the earliest created_at row per
--    (tenant_id, feature_key, reference_id) — the exact detection/delete query
--    lives in supabase/seed/{dev,production}/20261019_credit_consumption_dedup.sql
--    — then re-run this migration.
-- 2. After the migration succeeds, run that dedup seed ONCE on each environment
--    (it is safe to re-run, self-reported via RAISE NOTICE): the expected end
--    state is a verified NO-OP. Under the live unique index duplicates can no
--    longer even be created, so the seed is the standing invariant checker.
-- 3. Deploy functions/api/recruiter-copilot.ts (idempotent charging + org gating).
--    The API tolerates the index being absent (ledger pre-check degrades to
--    per-run charging), so code deploy order is forgiving; DB order is NOT.
--
-- Rollback notes:
--   - DROP INDEX IF EXISTS public.ux_credit_ledger_consumption_ref;
--   - DROP FUNCTION IF EXISTS public.increment_opportunity_views(uuid);
--   - Neither object stores data; both roll back cleanly.
--   - Do NOT "roll back" the dedup seed: deleting duplicate consumption rows is
--     irreversible and deliberately balance-affecting (deleted duplicates were
--     over-charges; their removal refunds the tenant). Snapshot credit_ledger
--     before running the seed if an audit trail of the dedup is required.

BEGIN;

-- ── 1. Idempotency index for credit consumption ──
-- One consumption row per (tenant, feature, client-supplied reference). Excludes
-- rows without a reference (legacy free-form charges keep working).
CREATE UNIQUE INDEX IF NOT EXISTS ux_credit_ledger_consumption_ref
  ON public.credit_ledger (tenant_id, feature_key, reference_id)
  WHERE transaction_type = 'consumption' AND reference_id IS NOT NULL;
  -- 'refund' is deliberately excluded from BOTH unique indexes: partial refund
  -- rows legitimately share a reference id with the consumption row they pay back.

-- ── 2. Atomic opportunity views counter ──
-- SECURITY DEFINER + locked search_path per project access model; executable only
-- by service_role (Pages Functions), never anon/authenticated/PUBLIC. Returns NULL
-- when the id is unknown so the caller decides the (404) response semantics.
CREATE OR REPLACE FUNCTION public.increment_opportunity_views(p_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_views integer;
BEGIN
  UPDATE public.opportunities
     SET views_count = COALESCE(views_count, 0) + 1
   WHERE id = p_id
  RETURNING views_count INTO v_views;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN v_views;
END;
$$;

-- Access model (project convention): no RLS era; explicit grants; service-role only.
-- Postgres grants EXECUTE to PUBLIC by default, so an explicit REVOKE FROM PUBLIC
-- is required even though only service_role may call this.
REVOKE ALL ON FUNCTION public.increment_opportunity_views(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_opportunity_views(uuid) TO service_role;

COMMIT;
