-- PREPARED ONLY. Application, target SQL tests, and cohort transition require explicit approval.
-- Additive metadata owns attribution/receipts; credit_ledger remains the only signed balance ledger.
-- No historical rows are rewritten. Recovery: stop new consumers before reverting functions; retain
-- metadata and exclusion predicates while any attributed rows exist. Dropping metadata alone would
-- expose subscription credits to legacy spending and is NOT a safe rollback.
BEGIN;

CREATE TABLE public.subscription_credit_allocations (
  reference_id text PRIMARY KEY,
  scope jsonb NOT NULL,
  occurrence jsonb NOT NULL,
  ledger_id uuid UNIQUE REFERENCES public.credit_ledger(id) ON DELETE RESTRICT,
  expires_at_ms bigint NOT NULL,
  receipt jsonb NOT NULL
);
CREATE INDEX subscription_credit_allocations_scope_expiry
  ON public.subscription_credit_allocations(scope, expires_at_ms, reference_id);
CREATE TABLE public.subscription_credit_consumptions (
  operation_id uuid PRIMARY KEY,
  scope jsonb NOT NULL,
  command jsonb NOT NULL,
  ledger_id uuid NOT NULL UNIQUE REFERENCES public.credit_ledger(id) ON DELETE RESTRICT,
  receipt jsonb NOT NULL
);
CREATE INDEX subscription_credit_consumptions_scope ON public.subscription_credit_consumptions(scope);
CREATE TABLE public.subscription_credit_attribution (
  operation_id uuid NOT NULL REFERENCES public.subscription_credit_consumptions(operation_id) ON DELETE RESTRICT,
  reference_id text NOT NULL REFERENCES public.subscription_credit_allocations(reference_id) ON DELETE RESTRICT,
  amount integer NOT NULL CHECK(amount > 0),
  PRIMARY KEY(operation_id, reference_id)
);
CREATE INDEX subscription_credit_attribution_allocation ON public.subscription_credit_attribution(reference_id, operation_id);

CREATE FUNCTION public.reject_subscription_credit_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN RAISE EXCEPTION 'Subscription credit attribution and receipts are immutable'; END; $$;
CREATE TRIGGER subscription_credit_allocations_immutable BEFORE UPDATE OR DELETE OR TRUNCATE
  ON public.subscription_credit_allocations FOR EACH STATEMENT EXECUTE FUNCTION public.reject_subscription_credit_mutation();
CREATE TRIGGER subscription_credit_consumptions_immutable BEFORE UPDATE OR DELETE OR TRUNCATE
  ON public.subscription_credit_consumptions FOR EACH STATEMENT EXECUTE FUNCTION public.reject_subscription_credit_mutation();
CREATE TRIGGER subscription_credit_attribution_immutable BEFORE UPDATE OR DELETE OR TRUNCATE
  ON public.subscription_credit_attribution FOR EACH STATEMENT EXECUTE FUNCTION public.reject_subscription_credit_mutation();
CREATE FUNCTION public.protect_subscription_credit_ledger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF TG_OP='TRUNCATE' THEN
    IF EXISTS(SELECT 1 FROM public.subscription_credit_allocations WHERE ledger_id IS NOT NULL)
      OR EXISTS(SELECT 1 FROM public.subscription_credit_consumptions) THEN
      RAISE EXCEPTION 'Attributed credit ledger cannot be truncated';
    END IF;
    RETURN NULL;
  END IF;
  IF EXISTS(SELECT 1 FROM public.subscription_credit_allocations WHERE ledger_id=OLD.id)
    OR EXISTS(SELECT 1 FROM public.subscription_credit_consumptions WHERE ledger_id=OLD.id) THEN
    RAISE EXCEPTION 'Attributed credit ledger rows are immutable';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER subscription_credit_ledger_immutable BEFORE UPDATE OR DELETE ON public.credit_ledger
  FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_credit_ledger();
CREATE TRIGGER subscription_credit_ledger_no_truncate BEFORE TRUNCATE ON public.credit_ledger
  FOR EACH STATEMENT EXECUTE FUNCTION public.protect_subscription_credit_ledger();

-- Explicit schema checks also protect backend callers that bypass TypeScript. No policy defaults.
CREATE FUNCTION public.validate_subscription_credit_scope(p_scope jsonb) RETURNS void
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF jsonb_typeof(p_scope) IS DISTINCT FROM 'object'
    OR NOT p_scope ?& ARRAY['productId','subscriptionId','recipient','featureKey','poolKey']
    OR (p_scope - ARRAY['productId','subscriptionId','recipient','featureKey','poolKey']) <> '{}'::jsonb
    OR jsonb_typeof(p_scope->'productId') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_scope->'subscriptionId') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_scope->'recipient') IS DISTINCT FROM 'object'
    OR NOT (p_scope->'recipient') ?& ARRAY['kind','id']
    OR ((p_scope->'recipient') - ARRAY['kind','id']) <> '{}'::jsonb
    OR coalesce(p_scope#>>'{recipient,kind}','') NOT IN ('subscriber','organization','managed_learner')
    OR jsonb_typeof(p_scope#>'{recipient,id}') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_scope->'featureKey') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_scope->'poolKey') IS DISTINCT FROM 'string'
    OR length(btrim(p_scope->>'featureKey'))=0 OR length(p_scope->>'featureKey')>100
    OR btrim(p_scope->>'featureKey')<>p_scope->>'featureKey'
    OR length(btrim(p_scope->>'poolKey'))=0 OR btrim(p_scope->>'poolKey')<>p_scope->>'poolKey' THEN
    RAISE EXCEPTION 'Invalid subscription credit scope';
  END IF;
  PERFORM (p_scope->>'productId')::uuid, (p_scope->>'subscriptionId')::uuid, (p_scope#>>'{recipient,id}')::uuid;
END; $$;

CREATE FUNCTION public.allocate_subscription_credits(p_occurrence jsonb, p_actor_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  s jsonb; prior public.subscription_credit_allocations; q integer; starts_ms bigint; ends_ms bigint; expires_ms bigint;
  at_time timestamptz; at_ms bigint; ledger uuid; result jsonb; key text;
BEGIN
  IF jsonb_typeof(p_occurrence) IS DISTINCT FROM 'object' OR p_actor_id IS NULL
    OR NOT p_occurrence ?& ARRAY['schemaVersion','referenceId','subscriptionId','productId','planId','revisionId','policyId','ruleId','featureKey','poolKey','audience','recipient','quantity','startsAt','endsAt','expiresAt','rollover','timePolicies']
    OR (p_occurrence - ARRAY['schemaVersion','referenceId','subscriptionId','productId','planId','revisionId','policyId','ruleId','featureKey','poolKey','audience','recipient','quantity','startsAt','endsAt','expiresAt','rollover','timePolicies']) <> '{}'::jsonb
    OR p_occurrence->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR jsonb_typeof(p_occurrence->'referenceId') IS DISTINCT FROM 'string'
    OR (p_occurrence->>'referenceId') !~ '^sc1_[0-9a-f]{64}$'
    OR jsonb_typeof(p_occurrence->'audience') IS DISTINCT FROM 'string'
    OR length(btrim(p_occurrence->>'audience'))=0 OR btrim(p_occurrence->>'audience')<>p_occurrence->>'audience'
    OR p_occurrence->'rollover' IS DISTINCT FROM '{"kind":"none"}'::jsonb
    OR jsonb_typeof(p_occurrence->'timePolicies') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid allocation or unavailable rollover execution';
  END IF;
  FOREACH key IN ARRAY ARRAY['planId','revisionId','policyId','ruleId'] LOOP
    IF jsonb_typeof(p_occurrence->key) IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'Invalid allocation identity'; END IF;
    PERFORM (p_occurrence->>key)::uuid;
  END LOOP;
  FOREACH key IN ARRAY ARRAY['quantity','startsAt','endsAt','expiresAt'] LOOP
    IF jsonb_typeof(p_occurrence->key) IS DISTINCT FROM 'number' OR (p_occurrence->>key) !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Invalid allocation quantity or instant';
    END IF;
  END LOOP;
  q:=(p_occurrence->>'quantity')::integer; starts_ms:=(p_occurrence->>'startsAt')::bigint;
  ends_ms:=(p_occurrence->>'endsAt')::bigint; expires_ms:=(p_occurrence->>'expiresAt')::bigint;
  IF q<0 OR starts_ms>=ends_ms OR starts_ms>=expires_ms OR greatest(ends_ms,expires_ms)>253370764799999 THEN
    RAISE EXCEPTION 'Invalid allocation interval';
  END IF;
  s:=jsonb_build_object('productId',p_occurrence->'productId','subscriptionId',p_occurrence->'subscriptionId',
    'recipient',p_occurrence->'recipient','featureKey',p_occurrence->'featureKey','poolKey',p_occurrence->'poolKey');
  PERFORM public.validate_subscription_credit_scope(s);
  PERFORM pg_advisory_xact_lock(hashtextextended((s#>>'{recipient,id}')::uuid::text||':'||(s->>'featureKey'),0));
  SELECT * INTO prior FROM public.subscription_credit_allocations WHERE reference_id=p_occurrence->>'referenceId';
  IF FOUND THEN
    IF prior.occurrence IS DISTINCT FROM p_occurrence OR prior.receipt->>'actorId' IS DISTINCT FROM p_actor_id::text THEN
      RAISE EXCEPTION 'Allocation replay differs';
    END IF;
    RETURN prior.receipt; -- replay precedes time checks, including after expiry
  END IF;
  at_time:=clock_timestamp(); at_ms:=floor(extract(epoch FROM at_time)*1000)::bigint;
  IF starts_ms>at_ms OR expires_ms<=at_ms THEN RAISE EXCEPTION 'Allocation is not due or has expired'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.features WHERE feature_key=s->>'featureKey' AND feature_type='metered') THEN
    RAISE EXCEPTION 'Allocation feature is not configured';
  END IF;
  IF q>0 THEN
    INSERT INTO public.credit_ledger(tenant_id,feature_key,transaction_type,amount,reference_id,created_at)
      VALUES((s#>>'{recipient,id}')::uuid,s->>'featureKey','plan_allocation',q,p_occurrence->>'referenceId',at_time) RETURNING id INTO ledger;
  END IF;
  result:=jsonb_build_object('occurrence',p_occurrence,'actorId',p_actor_id,'ledgerId',ledger,
    'allocatedAt',to_char(at_time AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  INSERT INTO public.subscription_credit_allocations(reference_id,scope,occurrence,ledger_id,expires_at_ms,receipt)
    VALUES(p_occurrence->>'referenceId',s,p_occurrence,ledger,expires_ms,result);
  RETURN result;
END; $$;

CREATE FUNCTION public.consume_subscription_credits(p_command jsonb, p_actor_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  s jsonb; operation uuid; requested integer; needed integer; take integer; available bigint; item record;
  prior public.subscription_credit_consumptions; ledger uuid; result jsonb; attribution jsonb:='[]'::jsonb;
  at_time timestamptz; at_ms bigint; ordering text;
BEGIN
  IF jsonb_typeof(p_command) IS DISTINCT FROM 'object' OR p_actor_id IS NULL
    OR NOT p_command ?& ARRAY['productId','subscriptionId','recipient','featureKey','poolKey','operationId','actionKey','amount','spendingOrder']
    OR (p_command - ARRAY['productId','subscriptionId','recipient','featureKey','poolKey','operationId','actionKey','amount','spendingOrder']) <> '{}'::jsonb
    OR jsonb_typeof(p_command->'operationId') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_command->'actionKey') IS DISTINCT FROM 'string'
    OR length(btrim(p_command->>'actionKey'))=0 OR btrim(p_command->>'actionKey')<>p_command->>'actionKey'
    OR jsonb_typeof(p_command->'amount') IS DISTINCT FROM 'number' OR (p_command->>'amount') !~ '^[0-9]+$'
    OR coalesce(p_command->>'spendingOrder','') NOT IN ('expires_first','oldest_first') THEN
    RAISE EXCEPTION 'Invalid subscription consumption';
  END IF;
  s:=p_command - ARRAY['operationId','actionKey','amount','spendingOrder'];
  PERFORM public.validate_subscription_credit_scope(s);
  operation:=(p_command->>'operationId')::uuid; requested:=(p_command->>'amount')::integer; needed:=requested;
  ordering:=p_command->>'spendingOrder';
  IF requested<=0 THEN RAISE EXCEPTION 'Consumption must be positive'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended((s#>>'{recipient,id}')::uuid::text||':'||(s->>'featureKey'),0));
  SELECT * INTO prior FROM public.subscription_credit_consumptions WHERE operation_id=operation;
  IF FOUND THEN
    IF prior.command IS DISTINCT FROM p_command OR prior.receipt->>'actorId' IS DISTINCT FROM p_actor_id::text THEN
      RAISE EXCEPTION 'Consumption replay differs';
    END IF;
    RETURN prior.receipt;
  END IF;
  at_time:=clock_timestamp(); at_ms:=floor(extract(epoch FROM at_time)*1000)::bigint;
  SELECT coalesce(sum(l.amount-coalesce(spent.amount,0)),0) INTO available
    FROM public.subscription_credit_allocations a JOIN public.credit_ledger l ON l.id=a.ledger_id
    LEFT JOIN LATERAL (SELECT sum(t.amount) AS amount FROM public.subscription_credit_attribution t WHERE t.reference_id=a.reference_id) spent ON true
    WHERE a.scope=s AND a.expires_at_ms>at_ms;
  IF available<requested THEN RAISE EXCEPTION 'INSUFFICIENT_SUBSCRIPTION_CREDITS'; END IF;
  FOR item IN
    SELECT a.reference_id,l.amount-coalesce(spent.amount,0) AS remaining
    FROM public.subscription_credit_allocations a JOIN public.credit_ledger l ON l.id=a.ledger_id
    LEFT JOIN LATERAL (SELECT sum(t.amount) AS amount FROM public.subscription_credit_attribution t WHERE t.reference_id=a.reference_id) spent ON true
    WHERE a.scope=s AND a.expires_at_ms>at_ms AND l.amount>coalesce(spent.amount,0)
    ORDER BY CASE WHEN ordering='expires_first' THEN a.expires_at_ms END, l.created_at, a.reference_id
  LOOP
    take:=least(needed,item.remaining)::integer;
    attribution:=attribution||jsonb_build_array(jsonb_build_object('referenceId',item.reference_id,'amount',take));
    needed:=needed-take; EXIT WHEN needed=0;
  END LOOP;
  IF needed<>0 THEN RAISE EXCEPTION 'Subscription attribution is inconsistent'; END IF;
  -- The immutable operation PK owns idempotency. A NULL legacy reference prevents old caller-key
  -- prechecks from mistaking this scoped debit for a previously paid unscoped operation.
  INSERT INTO public.credit_ledger(tenant_id,feature_key,transaction_type,amount,reference_id,created_at)
    VALUES((s#>>'{recipient,id}')::uuid,s->>'featureKey','consumption',-requested,NULL,at_time) RETURNING id INTO ledger;
  result:=jsonb_build_object('command',p_command,'actorId',p_actor_id,'ledgerId',ledger,
    'consumedAt',to_char(at_time AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'allocations',attribution);
  INSERT INTO public.subscription_credit_consumptions(operation_id,scope,command,ledger_id,receipt) VALUES(operation,s,p_command,ledger,result);
  INSERT INTO public.subscription_credit_attribution(operation_id,reference_id,amount)
    SELECT operation,e->>'referenceId',(e->>'amount')::integer FROM jsonb_array_elements(attribution) e;
  RETURN result;
END; $$;

CREATE FUNCTION public.get_subscription_credit_usage(p_scope jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE allocated numeric; consumed numeric; at_time timestamptz:=statement_timestamp();
BEGIN
  PERFORM public.validate_subscription_credit_scope(p_scope);
  SELECT coalesce(sum(l.amount),0),coalesce(sum(spent.amount),0) INTO allocated,consumed
    FROM public.subscription_credit_allocations a JOIN public.credit_ledger l ON l.id=a.ledger_id
    LEFT JOIN LATERAL (SELECT sum(t.amount) AS amount FROM public.subscription_credit_attribution t WHERE t.reference_id=a.reference_id) spent ON true
    WHERE a.scope=p_scope AND a.expires_at_ms>floor(extract(epoch FROM at_time)*1000)::bigint;
  IF allocated<consumed OR allocated>9007199254740991 OR consumed>9007199254740991 THEN RAISE EXCEPTION 'Credit usage exceeds accounting capacity'; END IF;
  RETURN p_scope||jsonb_build_object('allocated',allocated,'consumed',consumed,'remaining',allocated-consumed,
    'asOf',to_char(at_time AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
END; $$;

-- Preserve old signatures, outputs and historical rows while isolating new subscription credit rows.
CREATE OR REPLACE FUNCTION public.get_credit_balance(p_tenant_id uuid,p_feature_key varchar)
RETURNS TABLE(allocated integer,consumed integer,remaining integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  RETURN QUERY SELECT coalesce(sum(CASE WHEN l.amount>0 THEN l.amount ELSE 0 END),0)::integer,
    coalesce(sum(CASE WHEN l.amount<0 THEN abs(l.amount) ELSE 0 END),0)::integer,
    greatest(coalesce(sum(l.amount),0),0)::integer
  FROM public.credit_ledger l WHERE l.tenant_id=p_tenant_id AND l.feature_key=p_feature_key
    AND NOT EXISTS(SELECT 1 FROM public.subscription_credit_allocations a WHERE a.ledger_id=l.id)
    AND NOT EXISTS(SELECT 1 FROM public.subscription_credit_consumptions c WHERE c.ledger_id=l.id);
END; $$;
CREATE OR REPLACE FUNCTION public.consume_credits(p_tenant_id uuid,p_feature_key varchar,p_amount integer,
  p_reference_id varchar DEFAULT NULL,p_notes text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE balance integer; ledger uuid;
BEGIN
  IF p_amount<=0 THEN RAISE EXCEPTION 'Consumption amount must be greater than zero'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant_id::text||':'||p_feature_key,0));
  SELECT coalesce(sum(l.amount),0)::integer INTO balance FROM public.credit_ledger l
    WHERE l.tenant_id=p_tenant_id AND l.feature_key=p_feature_key
      AND NOT EXISTS(SELECT 1 FROM public.subscription_credit_allocations a WHERE a.ledger_id=l.id)
      AND NOT EXISTS(SELECT 1 FROM public.subscription_credit_consumptions c WHERE c.ledger_id=l.id);
  IF balance<p_amount THEN RETURN jsonb_build_object('success',false,'error','INSUFFICIENT_CREDITS','remaining',balance,'required',p_amount); END IF;
  INSERT INTO public.credit_ledger(tenant_id,feature_key,transaction_type,amount,reference_id,notes)
    VALUES(p_tenant_id,p_feature_key,'consumption',-p_amount,p_reference_id,p_notes) RETURNING id INTO ledger;
  RETURN jsonb_build_object('success',true,'ledger_id',ledger,'consumed',p_amount,'remaining',balance-p_amount);
END; $$;

-- Owner-only metadata writes: backend executes functions; it cannot edit receipts directly.
ALTER TABLE public.subscription_credit_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_credit_consumptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_credit_attribution DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_credit_allocations,public.subscription_credit_consumptions,public.subscription_credit_attribution FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.subscription_credit_allocations,public.subscription_credit_consumptions,public.subscription_credit_attribution TO service_role;
REVOKE ALL ON FUNCTION public.reject_subscription_credit_mutation(),public.protect_subscription_credit_ledger(),public.validate_subscription_credit_scope(jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.allocate_subscription_credits(jsonb,uuid),public.consume_subscription_credits(jsonb,uuid),public.get_subscription_credit_usage(jsonb),public.get_credit_balance(uuid,varchar),public.consume_credits(uuid,varchar,integer,varchar,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_subscription_credits(jsonb,uuid),public.consume_subscription_credits(jsonb,uuid),public.get_subscription_credit_usage(jsonb),public.get_credit_balance(uuid,varchar),public.consume_credits(uuid,varchar,integer,varchar,text) TO service_role;
COMMIT;
