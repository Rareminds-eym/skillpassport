-- Migration: Credit Ledger & Metered Quota Engine
-- Description: Immutable double-entry ledger for credits (contact unlocks, candidate invites, job boosts)
-- Date: 2026-10-16

BEGIN;

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- organization_id or user_id
  feature_key VARCHAR(100) NOT NULL, -- e.g., 'contact_unlocks', 'candidate_invites'
  transaction_type VARCHAR(50) NOT NULL CHECK (
    transaction_type IN ('plan_allocation', 'topup_purchase', 'consumption', 'refund', 'rollover', 'expiry')
  ),
  amount INTEGER NOT NULL, -- positive for credits added, negative for consumed
  reference_id VARCHAR(255), -- candidate_id, opportunity_id, order_id, etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.credit_ledger IS 'Append-only ledger tracking all allocations and consumptions of metered credits.';

CREATE INDEX IF NOT EXISTS idx_credit_ledger_tenant_feature 
  ON public.credit_ledger (tenant_id, feature_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_ref 
  ON public.credit_ledger (reference_id) 
  WHERE reference_id IS NOT NULL;

-- Function: Get current credit balance for a tenant and feature
CREATE OR REPLACE FUNCTION public.get_credit_balance(
  p_tenant_id UUID,
  p_feature_key VARCHAR
)
RETURNS TABLE (
  allocated INTEGER,
  consumed INTEGER,
  remaining INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_allocated INTEGER := 0;
  v_consumed INTEGER := 0;
  v_remaining INTEGER := 0;
BEGIN
  SELECT 
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0),
    COALESCE(SUM(amount), 0)
  INTO 
    v_allocated,
    v_consumed,
    v_remaining
  FROM public.credit_ledger
  WHERE tenant_id = p_tenant_id 
    AND feature_key = p_feature_key;

  RETURN QUERY SELECT v_allocated, v_consumed, GREATEST(v_remaining, 0);
END;
$$;

-- Function: Atomically consume credits with row locking & balance check
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_tenant_id UUID,
  p_feature_key VARCHAR,
  p_amount INTEGER,
  p_reference_id VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_current_remaining INTEGER;
  v_new_remaining INTEGER;
  v_ledger_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Consumption amount must be greater than zero';
  END IF;

  -- Acquire an advisory transaction lock scoped to (tenant_id, feature_key) to prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || p_feature_key, 0));

  -- Calculate current balance
  SELECT COALESCE(SUM(amount), 0)
  INTO v_current_remaining
  FROM public.credit_ledger
  WHERE tenant_id = p_tenant_id 
    AND feature_key = p_feature_key;

  IF v_current_remaining < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'remaining', v_current_remaining,
      'required', p_amount
    );
  END IF;

  -- Insert negative amount entry into ledger
  INSERT INTO public.credit_ledger (
    tenant_id,
    feature_key,
    transaction_type,
    amount,
    reference_id,
    notes
  ) VALUES (
    p_tenant_id,
    p_feature_key,
    'consumption',
    -p_amount,
    p_reference_id,
    p_notes
  ) RETURNING id INTO v_ledger_id;

  v_new_remaining := v_current_remaining - p_amount;

  RETURN jsonb_build_object(
    'success', true,
    'ledger_id', v_ledger_id,
    'consumed', p_amount,
    'remaining', v_new_remaining
  );
END;
$$;

-- Access model (project convention): no RLS; explicit grants; authorization happens in the
-- backend (Pages Functions) which uses the service_role key. The ledger is never writable by
-- the public key — otherwise anon could mint credits directly against PostgREST.
ALTER TABLE public.credit_ledger DISABLE ROW LEVEL SECURITY;

DO $access$
DECLARE
  r RECORD;
BEGIN
  -- Remove any RLS policies (deny-all RLS is a redundant belt alongside REVOKE-all);
  -- keep enabling state harmless since no client role holds table privileges.
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'credit_ledger'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.credit_ledger', r.policyname);
  END LOOP;

  REVOKE ALL ON TABLE public.credit_ledger FROM PUBLIC, anon, authenticated;
  GRANT ALL ON TABLE public.credit_ledger TO service_role;
END
$access$;

-- SECURITY DEFINER functions must not be reachable by the public key:
-- Postgres grants EXECUTE to PUBLIC on functions by default, so an explicit
-- REVOKE FROM PUBLIC is required even when only authenticated/service_role
-- grants appear in the original file.
REVOKE ALL ON FUNCTION public.get_credit_balance(UUID, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_credit_balance(UUID, VARCHAR) TO service_role;

REVOKE ALL ON FUNCTION public.consume_credits(UUID, VARCHAR, INTEGER, VARCHAR, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credits(UUID, VARCHAR, INTEGER, VARCHAR, TEXT) TO service_role;

-- Idempotency: one credit allocation per payment/plan reference. Prevents a replayed
-- payment verification from stacking additional ledger rows (C3).
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_ledger_alloc_ref
  ON public.credit_ledger (tenant_id, feature_key, reference_id)
  WHERE reference_id IS NOT NULL AND amount > 0
    AND transaction_type IN ('plan_allocation', 'topup_purchase', 'rollover');
    -- 'refund' deliberately excluded: partial refunds of the same payment share a
    -- reference id and must be allowed to coexist as separate rows.

COMMIT;
