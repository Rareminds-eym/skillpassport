BEGIN;
-- Canonical review evidence is immutable approval context, never destination data.
-- Existing review-less candidate operations cannot be executed under the new contract.
ALTER TABLE public.zoho_approved_operations ADD COLUMN candidate_review_hash text
  CHECK(candidate_review_hash IS NULL OR candidate_review_hash ~ '^[0-9a-f]{64}$');
-- Matching dev/production seeds invalidate prior unreviewed queued/failed work.
-- Claim and live-authority guards below fail closed even before those seeds run.
-- Processing work is deliberately retained for read-only reconciliation. A migration
-- cannot infer whether an old external effect occurred or authorize a second effect.

CREATE OR REPLACE FUNCTION public.zoho_decide_records(p_connection uuid,p_items jsonb,p_decision text,p_reason text,p_request uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; b public.zoho_approval_batches; v public.zoho_staged_records;
  item jsonb; manifest jsonb; n integer;
BEGIN
  IF p_connection IS NULL OR p_actor IS NULL OR p_request IS NULL OR p_decision IS NULL
    OR p_decision NOT IN ('approve','hold','reject') OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500
    OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid decision' USING ERRCODE='22023';
  END IF;
  IF jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Invalid decision size' USING ERRCODE='22023';
  END IF;
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
  SELECT jsonb_agg(value ORDER BY value->>'id') INTO manifest FROM jsonb_array_elements(p_items);
  SELECT * INTO b FROM public.zoho_approval_batches WHERE connection_id=p_connection AND request_id=p_request;
  IF FOUND THEN
    IF b.manifest<>manifest OR b.actor_id<>p_actor OR b.decision<>p_decision OR b.reason<>trim(p_reason) THEN
      RAISE EXCEPTION 'Idempotency conflict' USING ERRCODE='40001';
    END IF;
    RETURN jsonb_build_object('approvalId',b.id,'decision',b.decision,'count',jsonb_array_length(manifest),'replayed',true);
  END IF;
  SELECT count(DISTINCT value->>'id') INTO n FROM jsonb_array_elements(p_items);
  IF n<>jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Duplicate selection' USING ERRCODE='22023'; END IF;
  IF p_decision='approve' AND c.status<>'connected' THEN RAISE EXCEPTION 'Connection unavailable' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(manifest) LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR NOT item ?& ARRAY['id','revision']
      OR EXISTS(SELECT 1 FROM jsonb_object_keys(item) k WHERE k NOT IN ('id','revision','sourceHash','configRevision','targetId','candidateReviewHash'))
      OR jsonb_typeof(item->'id') IS DISTINCT FROM 'string' OR (item->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      OR jsonb_typeof(item->'revision') IS DISTINCT FROM 'number' OR (item->>'revision') !~ '^[1-9][0-9]{0,8}$' THEN
      RAISE EXCEPTION 'Invalid reviewed selection' USING ERRCODE='22023';
    END IF;
    SELECT * INTO v FROM public.zoho_staged_records WHERE id=(item->>'id')::uuid AND connection_id=p_connection FOR UPDATE;
    IF NOT FOUND OR v.revision IS DISTINCT FROM (item->>'revision')::integer OR v.config_revision IS DISTINCT FROM c.config_revision THEN
      RAISE EXCEPTION 'Reviewed revision changed' USING ERRCODE='40001';
    END IF;
    IF p_decision='approve' OR item ?| ARRAY['sourceHash','configRevision','targetId'] THEN
      IF NOT item ?& ARRAY['sourceHash','configRevision','targetId']
        OR jsonb_typeof(item->'configRevision') IS DISTINCT FROM 'number' OR (item->>'configRevision') !~ '^[1-9][0-9]{0,8}$'
        OR jsonb_typeof(item->'sourceHash') IS DISTINCT FROM 'string' OR (item->>'sourceHash') !~ '^[0-9a-f]{64}$'
        OR (item->'targetId'<>'null'::jsonb AND (jsonb_typeof(item->'targetId') IS DISTINCT FROM 'string'
          OR (item->>'targetId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')) THEN
        RAISE EXCEPTION 'Invalid reviewed context' USING ERRCODE='22023';
      END IF;
      IF v.source_hash IS DISTINCT FROM item->>'sourceHash' OR v.config_revision IS DISTINCT FROM (item->>'configRevision')::integer
        OR to_jsonb(v)->'target_id' IS DISTINCT FROM item->'targetId' THEN
        RAISE EXCEPTION 'Reviewed context changed' USING ERRCODE='40001';
      END IF;
    END IF;
    IF (p_decision='approve' AND v.module='Candidates' AND
      (jsonb_typeof(item->'candidateReviewHash') IS DISTINCT FROM 'string' OR (item->>'candidateReviewHash') !~ '^[0-9a-f]{64}$'))
      OR (v.module='Job_Openings' AND item ? 'candidateReviewHash') THEN
      RAISE EXCEPTION 'Canonical candidate review required' USING ERRCODE='22023';
    END IF;
    IF v.decision NOT IN ('pending_approval','held','rejected') THEN
      RAISE EXCEPTION 'Record cannot be decided in this state' USING ERRCODE='22023';
    END IF;
    IF p_decision='approve' AND jsonb_array_length(v.validation_errors)>0 THEN
      RAISE EXCEPTION 'Record has validation errors' USING ERRCODE='22023';
    END IF;
  END LOOP;
  INSERT INTO public.zoho_approval_batches(connection_id,request_id,actor_id,decision,reason,manifest)
  VALUES(p_connection,p_request,p_actor,p_decision,trim(p_reason),manifest) RETURNING * INTO b;
  FOR item IN SELECT value FROM jsonb_array_elements(manifest) LOOP
    SELECT * INTO STRICT v FROM public.zoho_staged_records WHERE id=(item->>'id')::uuid;
    IF p_decision='approve' THEN
      INSERT INTO public.zoho_approved_operations(batch_id,record_id,record_revision,source_hash,config_revision,approved_data,expected_target_id,action,expires_at,candidate_review_hash)
      VALUES(b.id,v.id,v.revision,v.source_hash,v.config_revision,v.proposed_data,v.target_id,
        CASE WHEN v.module='Candidates' THEN 'provision_candidate' ELSE 'apply_job' END,now()+interval '24 hours',CASE WHEN v.module='Candidates' THEN item->>'candidateReviewHash' END);
    END IF;
    UPDATE public.zoho_staged_records SET decision=CASE p_decision WHEN 'approve' THEN 'approved' WHEN 'hold' THEN 'held' ELSE 'rejected' END,
      execution_state=CASE WHEN p_decision='approve' THEN 'queued' ELSE 'not_approved' END,updated_at=now() WHERE id=v.id;
  END LOOP;
  RETURN jsonb_build_object('approvalId',b.id,'decision',p_decision,'count',n,'emailPolicy','forbidden');
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_claim_operation(p_operation uuid,p_lease uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE o public.zoho_approved_operations; r public.zoho_staged_records;
  c public.zoho_connections; actor uuid; deadline timestamptz;
BEGIN
  IF p_lease IS NULL THEN RAISE EXCEPTION 'Lease required' USING ERRCODE='22023'; END IF;
  o:=public.zoho_lock_operation(p_operation);
  SELECT * INTO STRICT r FROM public.zoho_staged_records WHERE id=o.record_id;
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=r.connection_id;
  -- An expired processing lease has an unknown external outcome. Never steal it.
  IF o.state='processing' THEN
    IF o.lease_token IS DISTINCT FROM p_lease OR o.lease_expires_at<=clock_timestamp() THEN
      RETURN jsonb_build_object('claimed',false,'reason','IN_FLIGHT_OR_RECONCILIATION_REQUIRED');
    END IF;
  ELSIF o.state NOT IN ('queued','failed') THEN
    RETURN jsonb_build_object('claimed',false,'reason','TERMINAL_OPERATION');
  END IF;
  IF c.status<>'connected' OR c.config_revision<>o.config_revision
    OR r.config_revision<>o.config_revision OR r.revision<>o.record_revision
    OR r.source_hash<>o.source_hash OR r.proposed_data<>o.approved_data
    OR jsonb_array_length(r.validation_errors)>0 OR o.expires_at<=clock_timestamp()
    OR (r.module='Candidates' AND o.candidate_review_hash IS NULL) THEN
    -- Stale processing work must be reconciled; invalidation cannot undo an external write.
    IF o.state='processing' THEN
      RETURN jsonb_build_object('claimed',false,'reason','IN_FLIGHT_OR_RECONCILIATION_REQUIRED');
    END IF;
    UPDATE public.zoho_approved_operations SET state='approval_stale' WHERE id=o.id;
    IF r.revision=o.record_revision AND r.decision IN ('approved','failed') THEN
      -- A fresh review gets a new revision even if the source content itself is unchanged.
      UPDATE public.zoho_staged_records SET revision=revision+1,decision='pending_approval',
        execution_state='not_approved',updated_at=now() WHERE id=r.id;
    END IF;
    RETURN jsonb_build_object('claimed',false,'reason','APPROVAL_STALE');
  END IF;
  IF o.state<>'processing' THEN
    IF r.decision NOT IN ('approved','failed') OR r.execution_state NOT IN ('queued','failed')
      OR o.execution_attempts>=8 OR o.next_attempt_at>clock_timestamp() THEN
      RETURN jsonb_build_object('claimed',false,'reason','NOT_ELIGIBLE_OR_NOT_DUE');
    END IF;
    deadline:=least(o.expires_at,clock_timestamp()+interval '5 minutes');
    IF EXISTS(SELECT 1 FROM public.zoho_execution_attempts WHERE id=p_lease) THEN
      RETURN jsonb_build_object('claimed',false,'reason','LEASE_ALREADY_USED');
    END IF;
    INSERT INTO public.zoho_execution_attempts(id,operation_id,attempt_number,lease_expires_at)
      VALUES(p_lease,o.id,o.execution_attempts+1,deadline);
    UPDATE public.zoho_approved_operations SET state='processing',lease_token=p_lease,
      lease_expires_at=deadline,execution_attempts=execution_attempts+1,last_error=NULL WHERE id=o.id;
    UPDATE public.zoho_staged_records SET decision='processing',execution_state='processing',updated_at=now() WHERE id=r.id;
  ELSE
    IF o.last_error='OUTCOME_UNKNOWN' THEN
      RETURN jsonb_build_object('claimed',false,'reason','IN_FLIGHT_OR_RECONCILIATION_REQUIRED');
    END IF;
    deadline:=o.lease_expires_at;
  END IF;
  SELECT actor_id INTO STRICT actor FROM public.zoho_approval_batches WHERE id=o.batch_id;
  RETURN jsonb_build_object('claimed',true,'operationId',o.id,'lease',p_lease,'leaseExpiresAt',deadline,
    'approvalExpiresAt',o.expires_at,'actorId',actor,'connectionId',c.id,'sourceOrgId',c.source_org_id,
    'publisherOrganizationId',c.publisher_organization_id,'recordId',r.id,'revision',o.record_revision,
    'configRevision',o.config_revision,'sourceHash',o.source_hash,'action',o.action,'module',r.module,
    'externalId',r.external_id,'data',o.approved_data,'targetId',o.expected_target_id,'emailPolicy','forbidden')
    || CASE WHEN r.module='Candidates' THEN jsonb_build_object('candidateReviewHash',o.candidate_review_hash) ELSE '{}'::jsonb END;
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_is_live_approved_operation(p_grant jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF jsonb_typeof(p_grant) IS DISTINCT FROM 'object' OR p_grant->'claimed' IS DISTINCT FROM 'true'::jsonb
    OR p_grant->>'emailPolicy' IS DISTINCT FROM 'forbidden' THEN RETURN false; END IF;
  RETURN EXISTS(
    SELECT 1 FROM public.zoho_approved_operations o
    JOIN public.zoho_staged_records r ON r.id=o.record_id
    JOIN public.zoho_connections c ON c.id=r.connection_id
    JOIN public.zoho_approval_batches b ON b.id=o.batch_id
    JOIN public.zoho_execution_attempts a ON a.id=o.lease_token AND a.operation_id=o.id
    WHERE o.id=(p_grant->>'operationId')::uuid AND o.state='processing'
      AND o.lease_token=(p_grant->>'lease')::uuid AND o.lease_expires_at>statement_timestamp()
      AND o.last_error IS DISTINCT FROM 'OUTCOME_UNKNOWN'
      AND o.lease_expires_at=(p_grant->>'leaseExpiresAt')::timestamptz
      AND o.expires_at=(p_grant->>'approvalExpiresAt')::timestamptz AND o.expires_at>statement_timestamp()
      AND b.actor_id=(p_grant->>'actorId')::uuid AND b.decision='approve'
      AND c.id=(p_grant->>'connectionId')::uuid AND c.status='connected'
      AND c.source_org_id=p_grant->>'sourceOrgId' AND c.publisher_organization_id=(p_grant->>'publisherOrganizationId')::uuid
      AND c.config_revision=o.config_revision AND r.config_revision=o.config_revision
      AND o.config_revision=(p_grant->>'configRevision')::integer
      AND r.id=(p_grant->>'recordId')::uuid AND r.revision=o.record_revision AND o.record_revision=(p_grant->>'revision')::integer
      AND r.source_hash=o.source_hash AND o.source_hash=p_grant->>'sourceHash'
      AND r.proposed_data=o.approved_data AND o.approved_data=p_grant->'data'
      AND r.decision='processing' AND r.execution_state='processing' AND jsonb_array_length(r.validation_errors)=0
      AND o.action=p_grant->>'action' AND r.module=p_grant->>'module' AND r.external_id=p_grant->>'externalId'
      AND ((r.module='Candidates' AND o.candidate_review_hash IS NOT NULL AND o.candidate_review_hash=p_grant->>'candidateReviewHash')
        OR (r.module='Job_Openings' AND NOT p_grant ? 'candidateReviewHash'))
      AND p_grant ? 'targetId' AND to_jsonb(o)->'expected_target_id'=p_grant->'targetId'
  );
EXCEPTION WHEN invalid_text_representation OR datetime_field_overflow OR numeric_value_out_of_range THEN RETURN false;
END;
$$;

-- zoho_lookup_decision already compares the entire immutable manifest, including
-- candidateReviewHash. Removing or changing the hash therefore conflicts on replay.
REVOKE ALL ON FUNCTION public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid),
  public.zoho_claim_operation(uuid,uuid),public.zoho_is_live_approved_operation(jsonb)
  FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid),
  public.zoho_claim_operation(uuid,uuid),public.zoho_is_live_approved_operation(jsonb) TO service_role;
COMMIT;
