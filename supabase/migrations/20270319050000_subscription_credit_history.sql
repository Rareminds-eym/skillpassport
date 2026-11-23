-- PREPARED ONLY. Depends on subscription_credit_execution; application requires target approval.
-- Additive read API. Recovery: stop history callers, revoke/drop this function; retain all ledger rows.
BEGIN;
CREATE FUNCTION public.get_subscription_credit_history(p_scope jsonb, p_after text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; now_ms bigint := floor(extract(epoch FROM statement_timestamp())*1000)::bigint;
BEGIN
  PERFORM public.validate_subscription_credit_scope(p_scope);
  IF p_after IS NOT NULL AND p_after !~ '^sc1_[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid history cursor'; END IF;
  WITH amounts AS (
    SELECT a.reference_id, a.occurrence, a.receipt, a.expires_at_ms,
      coalesce(l.amount,0)::bigint AS allocated,
      coalesce((SELECT sum(t.amount) FROM public.subscription_credit_attribution t WHERE t.reference_id=a.reference_id),0)::bigint AS consumed
    FROM public.subscription_credit_allocations a LEFT JOIN public.credit_ledger l ON l.id=a.ledger_id
    WHERE a.scope=p_scope
  ), totals AS (
    SELECT coalesce(sum(allocated),0) AS allocated, coalesce(sum(consumed),0) AS consumed,
      coalesce(sum(CASE WHEN expires_at_ms>now_ms THEN allocated-consumed ELSE 0 END),0) AS remaining,
      coalesce(sum(CASE WHEN expires_at_ms<=now_ms THEN allocated-consumed ELSE 0 END),0) AS expired
    FROM amounts
  ), page AS (
    SELECT * FROM amounts WHERE p_after IS NULL OR reference_id>p_after ORDER BY reference_id LIMIT 50
  ) SELECT jsonb_build_object('schemaVersion',1,'scope',p_scope,'asOf',statement_timestamp(),
    'allocated',totals.allocated,'consumed',totals.consumed,'remaining',totals.remaining,'expiredRemaining',totals.expired,
    'allocations',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'referenceId',p.reference_id,'planId',p.occurrence->>'planId','revisionId',p.occurrence->>'revisionId',
      'policyId',p.occurrence->>'policyId','ruleId',p.occurrence->>'ruleId',
      'quantity',p.allocated,'consumed',p.consumed,
      'remaining',CASE WHEN p.expires_at_ms>now_ms THEN p.allocated-p.consumed ELSE 0 END,
      'expiredRemaining',CASE WHEN p.expires_at_ms<=now_ms THEN p.allocated-p.consumed ELSE 0 END,
      'startsAt',p.occurrence->'startsAt','endsAt',p.occurrence->'endsAt','expiresAt',p.expires_at_ms,
      'allocatedAt',p.receipt->>'allocatedAt') ORDER BY p.reference_id) FROM page p),'[]'::jsonb),
    'nextCursor',CASE WHEN (SELECT count(*) FROM page)=50 THEN (SELECT max(reference_id) FROM page) ELSE NULL END)
  INTO result FROM totals;
  IF (result->>'allocated')::numeric>9007199254740991 OR (result->>'consumed')::numeric>9007199254740991
    OR (result->>'remaining')::numeric<0 OR (result->>'expiredRemaining')::numeric<0 THEN
    RAISE EXCEPTION 'Invalid credit history accounting';
  END IF;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.get_subscription_credit_history(jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_credit_history(jsonb,text) TO service_role;
COMMIT;
