-- Sales-led ("contact sales", no checkout price) offers may publish negotiated "Custom" terms for display only.
-- Contract-required seat limits must be stored as disabled entitlement rows; contract-required credit rules are
-- retained verbatim and refused by allocation until a signed customer contract resolves them. Free and
-- self-serve offers keep rejecting unresolved terms. Replaces the function from 20270317010000; schema-only.
BEGIN;

CREATE OR REPLACE FUNCTION public.stage_subscription_plan_projection(p_projection jsonb, p_product_id uuid, p_actor_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  v_draft jsonb; v_policy jsonb; v_row jsonb; v_grant jsonb; v_definition record;
  v_plan uuid; v_revision uuid; v_existing public.subscription_plan_projections%ROWTYPE;
  v_count integer; v_numeric numeric; v_text text; v_sales_led boolean; v_negotiated boolean;
BEGIN
  IF p_projection IS NULL OR p_product_id IS NULL OR p_actor_id IS NULL
    OR octet_length(p_projection::text) > 262144 OR jsonb_typeof(p_projection) <> 'object'
    OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(p_projection) AS key)
       IS DISTINCT FROM ARRAY['bundle','entitlements','schemaVersion']::text[]
    OR p_projection->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR p_projection#>'{bundle,schemaVersion}' IS DISTINCT FROM '1'::jsonb
    OR p_projection#>'{bundle,draft,schemaVersion}' IS DISTINCT FROM '2'::jsonb
    OR jsonb_typeof(p_projection#>'{bundle,draft}') IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_projection->'entitlements') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_projection#>'{bundle,draft,features}') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid application projection' USING ERRCODE = '22023';
  END IF;
  IF (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(p_projection->'bundle') AS key)
       IS DISTINCT FROM ARRAY['draft','includedCredits','schemaVersion']::text[]
    OR jsonb_typeof(p_projection#>'{bundle,draft,plan}') IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_projection#>'{bundle,includedCredits}') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid projection bundle' USING ERRCODE = '22023';
  END IF;
  v_draft := p_projection#>'{bundle,draft}'; v_policy := p_projection#>'{bundle,includedCredits}';
  IF (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(v_draft) AS key)
       IS DISTINCT FROM ARRAY['audiences','features','id','name','plan','prices','purchaseMode','revisionNumber','schemaVersion']::text[]
    OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(v_policy) AS key)
       IS DISTINCT FROM ARRAY['funding','id','revisionId','rules','schemaVersion']::text[]
    OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(v_draft->'plan') AS key)
       IS DISTINCT FROM ARRAY['code','id','productId']::text[]
    OR jsonb_typeof(v_draft->'audiences') IS DISTINCT FROM 'array'
    OR jsonb_typeof(v_draft->'prices') IS DISTINCT FROM 'array'
    OR jsonb_typeof(v_draft->'revisionNumber') IS DISTINCT FROM 'number' THEN
    RAISE EXCEPTION 'Invalid projection revision shape' USING ERRCODE = '22023';
  END IF;
  v_numeric := (v_draft->>'revisionNumber')::numeric;
  IF v_numeric < 1 OR v_numeric > 9007199254740991 OR trunc(v_numeric) <> v_numeric
    OR jsonb_array_length(v_draft->'audiences') NOT BETWEEN 1 AND 200
    OR jsonb_array_length(v_draft->'prices') > 1000 THEN
    RAISE EXCEPTION 'Invalid projection revision bounds' USING ERRCODE = '22023';
  END IF;
  v_plan := (v_draft#>>'{plan,id}')::uuid; v_revision := (v_draft->>'id')::uuid;
  -- Sales-led offers carry no checkout price; only they may publish negotiated ("Custom") terms, display-only.
  v_sales_led := v_draft->>'purchaseMode' = 'contact_sales' AND jsonb_array_length(v_draft->'prices') = 0;
  IF v_plan IS NULL OR v_revision IS NULL
    OR (v_draft#>>'{plan,productId}')::uuid IS DISTINCT FROM p_product_id
    OR NOT coalesce(v_draft#>>'{plan,code}' ~ '^pln_[0-9a-f]{32}$', false)
    OR v_policy->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR v_policy->>'funding' IS DISTINCT FROM 'included'
    OR (v_policy->>'revisionId')::uuid IS DISTINCT FROM v_revision
    OR jsonb_typeof(v_policy->'rules') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_projection->'entitlements') > 1000
    OR jsonb_array_length(v_draft->'features') > 1000
    OR jsonb_array_length(v_policy->'rules') > 1000
    OR jsonb_array_length(p_projection->'entitlements') <> jsonb_array_length(v_draft->'features') THEN
    RAISE EXCEPTION 'Invalid projection scope or coverage' USING ERRCODE = '22023';
  END IF;
  -- One lock namespace per revision; serialize new inserts and exact replay without a local plan FK.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_revision::text, 0));
  SELECT * INTO v_existing FROM public.subscription_plan_projections WHERE revision_id = v_revision;
  IF FOUND THEN
    IF v_existing.plan_id IS DISTINCT FROM v_plan OR v_existing.product_id IS DISTINCT FROM p_product_id
      OR v_existing.staged_by IS DISTINCT FROM p_actor_id OR v_existing.projection IS DISTINCT FROM p_projection THEN
      RAISE EXCEPTION 'Immutable projection replay differs' USING ERRCODE = '23505';
    END IF;
    RETURN jsonb_build_object('projection',v_existing.projection,'stagedBy',v_existing.staged_by,'stagedAt',v_existing.staged_at);
  END IF;
  -- Prevent registry changes between feature validation and insertion; no registry writes occur here.
  LOCK TABLE public.features IN SHARE MODE;
  SELECT count(DISTINCT item->>'feature_id') INTO v_count FROM jsonb_array_elements(p_projection->'entitlements') AS item;
  IF v_count <> jsonb_array_length(p_projection->'entitlements') THEN
    RAISE EXCEPTION 'Duplicate projection feature' USING ERRCODE = '22023';
  END IF;
  SELECT count(DISTINCT item->>'key') INTO v_count FROM jsonb_array_elements(v_draft->'features') AS item;
  IF v_count <> jsonb_array_length(v_draft->'features') THEN
    RAISE EXCEPTION 'Duplicate revision feature' USING ERRCODE = '22023';
  END IF;
  FOR v_row IN SELECT value FROM jsonb_array_elements(p_projection->'entitlements') LOOP
    IF jsonb_typeof(v_row) <> 'object'
      OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(v_row) AS key)
         IS DISTINCT FROM ARRAY['feature_id','is_enabled','plan_id','value_numeric','value_text']::text[]
      OR (v_row->>'plan_id')::uuid IS DISTINCT FROM v_plan OR jsonb_typeof(v_row->'is_enabled') IS DISTINCT FROM 'boolean' THEN
      RAISE EXCEPTION 'Invalid entitlement row' USING ERRCODE = '22023';
    END IF;
    SELECT id, feature_key, feature_type, value_options INTO v_definition FROM public.features WHERE id = (v_row->>'feature_id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Unknown application feature' USING ERRCODE = '22023'; END IF;
    SELECT value INTO v_grant FROM jsonb_array_elements(v_draft->'features') WHERE value->>'key' = v_definition.feature_key;
    -- A negotiated limit row is always disabled: an enabled NULL limit reads as unlimited to consumers.
    v_negotiated := v_definition.feature_type = 'numeric_limit' AND v_grant#>>'{limit,kind}' = 'contract_required';
    IF v_grant IS NULL OR v_grant->>'type' IS DISTINCT FROM v_definition.feature_type
      OR (CASE WHEN v_negotiated THEN 'false'::jsonb ELSE v_grant->'enabled' END) IS DISTINCT FROM v_row->'is_enabled' THEN
      RAISE EXCEPTION 'Application feature binding differs' USING ERRCODE = '22023';
    END IF;
    v_numeric := NULL; v_text := NULL;
    IF v_definition.feature_type = 'numeric_limit' THEN
      IF v_grant#>>'{limit,kind}' = 'finite' THEN
        IF jsonb_typeof(v_grant#>'{limit,value}') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid limit' USING ERRCODE = '22023'; END IF;
        v_numeric := (v_grant#>>'{limit,value}')::numeric;
        IF v_numeric < 0 OR v_numeric > 9007199254740991 OR trunc(v_numeric) <> v_numeric THEN RAISE EXCEPTION 'Invalid limit' USING ERRCODE = '22023'; END IF;
      ELSIF v_negotiated THEN
        IF NOT v_sales_led OR (SELECT count(*) FROM jsonb_object_keys(v_grant->'limit')) <> 1 THEN
          RAISE EXCEPTION 'Unresolved limit' USING ERRCODE = '22023';
        END IF;
      ELSIF v_grant#>>'{limit,kind}' IS DISTINCT FROM 'unlimited' THEN
        RAISE EXCEPTION 'Unresolved limit' USING ERRCODE = '22023';
      END IF;
    ELSIF v_definition.feature_type = 'enum' THEN
      v_text := v_grant->>'value';
      IF (v_grant->>'enabled')::boolean IS DISTINCT FROM (v_text IS NOT NULL)
        OR (v_text IS NOT NULL AND NOT coalesce(v_text = ANY(v_definition.value_options), false)) THEN
        RAISE EXCEPTION 'Invalid enum selection' USING ERRCODE = '22023';
      END IF;
    ELSIF v_definition.feature_type = 'metered' THEN
      IF v_grant#>>'{limit,kind}' IS DISTINCT FROM 'allocation_policy' THEN RAISE EXCEPTION 'Invalid metered policy' USING ERRCODE = '22023'; END IF;
    ELSIF v_definition.feature_type <> 'boolean' THEN RAISE EXCEPTION 'Unknown feature type' USING ERRCODE = '22023'; END IF;
    IF v_row->'value_numeric' IS DISTINCT FROM coalesce(to_jsonb(v_numeric),'null'::jsonb)
      OR v_row->'value_text' IS DISTINCT FROM coalesce(to_jsonb(v_text),'null'::jsonb) THEN
      RAISE EXCEPTION 'Entitlement value differs' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  -- Reject unresolved credit quantities except on sales-led offers, where allocation refuses them until
  -- a signed contract resolves them; full recipient/cadence/expiry policy is stored verbatim.
  FOR v_row IN SELECT value FROM jsonb_array_elements(v_policy->'rules') LOOP
    IF v_row#>>'{quantity,kind}' = 'contract_required' THEN
      IF NOT v_sales_led OR (SELECT count(*) FROM jsonb_object_keys(v_row->'quantity')) <> 1 THEN
        RAISE EXCEPTION 'Unresolved credit quantity' USING ERRCODE = '22023';
      END IF;
      CONTINUE;
    END IF;
    IF v_row#>>'{quantity,kind}' IS DISTINCT FROM 'finite' OR jsonb_typeof(v_row#>'{quantity,value}') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'Unresolved credit quantity' USING ERRCODE = '22023';
    END IF;
    v_numeric := (v_row#>>'{quantity,value}')::numeric;
    IF v_numeric < 0 OR v_numeric > 2147483647 OR trunc(v_numeric) <> v_numeric THEN RAISE EXCEPTION 'Invalid credit quantity' USING ERRCODE = '22023'; END IF;
  END LOOP;
  INSERT INTO public.subscription_plan_projections(revision_id,plan_id,product_id,projection,staged_by)
  VALUES(v_revision,v_plan,p_product_id,p_projection,p_actor_id) RETURNING * INTO v_existing;
  RETURN jsonb_build_object('projection',v_existing.projection,'stagedBy',v_existing.staged_by,'stagedAt',v_existing.staged_at);
END;
$$;
REVOKE ALL ON FUNCTION public.stage_subscription_plan_projection(jsonb,uuid,uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.stage_subscription_plan_projection(jsonb,uuid,uuid) TO service_role;
COMMIT;
