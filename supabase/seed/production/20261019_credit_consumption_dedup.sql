-- MANUAL PATCH: Credit consumption dedup (one-time, operational DML)
-- Run once by hand on each environment (dev or production) AFTER migration
-- 20261019120000_credit_consumption_idempotency.sql is applied.
-- Safe to re-run (fully idempotent — a second run deletes nothing).
-- Do NOT run through a migration tool (project standard 11.8: migration files
-- are DDL-only; operational DML lives in seeds).
--
-- Context: before the partial unique index on (tenant_id, feature_key,
-- reference_id) existed for transaction_type='consumption', retried HTTP
-- requests double-charged tenants — multiple consumption ledger rows sharing
-- one logical reference. This patch removes EVERY duplicate BUT THE FIRST
-- created row (earliest created_at, id as deterministic tiebreak): the first
-- consumption event is the one that legitimately happened, later duplicates
-- are over-charges.
--
-- Balance impact: each deleted duplicate consumption row INCREASES the
-- affected tenant's remaining balance (the over-charge is returned).
-- The RAISE NOTICE output reports what was removed — reconcile tenant
-- balances after running if you export balances anywhere.
--
-- Deployment order:
-- 1. Apply migration 20261019120000_credit_consumption_idempotency.sql.
--    If its index build fails on legacy duplicates, remove the losers by hand
--    (keep the earliest created_at row — the DO block below holds the exact
--    query), re-apply the migration, then:
-- 2. Run this ONCE on the migrated DB as the standing verification: with the
--    live index present it deletes any duplicate that could have slipped
--    through and reports 0 remaining on a conforming DB. Under the index,
--    duplicates cannot be inserted anymore, so a conforming run is a NO-OP by
--    construction (self-evidenced in the RAISE NOTICE output).
--
-- Expected state after run: zero duplicate groups remaining, zero rows
-- violating the new index.

BEGIN;

DO $dedup$
DECLARE
  v_deleted INTEGER := 0;
  v_stale   INTEGER := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'ux_credit_ledger_consumption_ref'
  ) THEN
    -- Keep only the FIRST created consumption row per
    -- (tenant_id, feature_key, reference_id); delete every later duplicate.
    -- Runs once in effect: re-runs find zero duplicates (idempotent).
    WITH doomed AS (
      SELECT id AS doomed_id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY tenant_id, feature_key, reference_id
                 ORDER BY created_at ASC, id ASC
               ) AS row_rank
        FROM public.credit_ledger
        WHERE transaction_type = 'consumption'
          AND reference_id IS NOT NULL
      ) ranked
      WHERE row_rank > 1
    ),
    deleted AS (
      DELETE FROM public.credit_ledger d
      USING doomed
      WHERE d.id = doomed.doomed_id
      RETURNING 1
    )
    SELECT count(*) INTO v_deleted FROM deleted;

    RAISE NOTICE 'index present: deleted % duplicate consumption row(s); first row per reference kept', v_deleted;

    -- Post-run invariant reminder: how many duplicate consumption groups would
    -- remain now (must be 0 — any non-zero value means the patch failed).
    SELECT count(*) INTO v_stale
    FROM (
      SELECT 1
      FROM public.credit_ledger
      WHERE transaction_type = 'consumption' AND reference_id IS NOT NULL
      GROUP BY tenant_id, feature_key, reference_id
      HAVING count(*) > 1
    ) g;
    RAISE NOTICE '% stale duplicate consumption group(s) would remain — 0 is the expected end state; a non-zero value means THE PATCH SILENTLY FAILED and it must be re-run', v_stale;
  ELSE
    -- Per the patch spec the delete is gated on the index existing: dedup and
    -- the enforcement boundary belong to the migration. Without the index this
    -- patch cannot do its job — report the stale count so the operator acts.
    SELECT count(*) INTO v_stale
    FROM (
      SELECT 1
      FROM public.credit_ledger
      WHERE transaction_type = 'consumption' AND reference_id IS NOT NULL
      GROUP BY tenant_id, feature_key, reference_id
      HAVING count(*) > 1
    ) g;
    RAISE NOTICE 'ux_credit_ledger_consumption_ref is MISSING — 0 duplicate(s) deleted; % stale duplicate consumption row(s) would REMAIN. The migration''s index build FAILS on existing duplicates: remove them manually first (keep the earliest created_at row per reference — the DO block above contains the exact detection/delete query to reuse), then apply the migration, then re-run this seed to verify 0/0', v_stale;
  END IF;
END
$dedup$;

COMMIT;
