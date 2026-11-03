BEGIN;
-- Exact command recovery reads immutable intent only. It never rechecks current
-- record state, renews approval, publishes a queue message or creates operations.
CREATE FUNCTION public.zoho_lookup_decision(p_connection uuid,p_items jsonb,p_decision text,p_reason text,p_request uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE b public.zoho_approval_batches; manifest jsonb;
BEGIN
  IF p_connection IS NULL OR p_actor IS NULL OR p_request IS NULL OR p_decision IS NULL
    OR p_decision NOT IN ('approve','hold','reject') OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500
    OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid decision lookup' USING ERRCODE='22023';
  END IF;
  IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Invalid decision lookup' USING ERRCODE='22023';
  END IF;
  SELECT * INTO b FROM public.zoho_approval_batches WHERE connection_id=p_connection AND request_id=p_request;
  IF NOT FOUND THEN RETURN jsonb_build_object('found',false); END IF;
  SELECT jsonb_agg(value ORDER BY value->>'id') INTO manifest FROM jsonb_array_elements(p_items);
  IF b.manifest IS DISTINCT FROM manifest OR b.actor_id IS DISTINCT FROM p_actor
    OR b.decision IS DISTINCT FROM p_decision OR b.reason IS DISTINCT FROM trim(p_reason) THEN
    RAISE EXCEPTION 'Idempotency conflict' USING ERRCODE='40001';
  END IF;
  RETURN jsonb_build_object('found',true,'result',jsonb_build_object('approvalId',b.id,'decision',b.decision,
    'count',jsonb_array_length(b.manifest),'replayed',true,'emailPolicy','forbidden'));
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_lookup_decision(uuid,jsonb,text,text,uuid,uuid) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_lookup_decision(uuid,jsonb,text,text,uuid,uuid) TO service_role;
COMMIT;
