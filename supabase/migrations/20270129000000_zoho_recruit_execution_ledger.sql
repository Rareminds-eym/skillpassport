BEGIN;

-- Execution metadata only. These functions never create users, plans or jobs.
ALTER TABLE public.zoho_approved_operations
  ADD COLUMN lease_token uuid,
  ADD COLUMN lease_expires_at timestamptz,
  ADD COLUMN execution_attempts integer NOT NULL DEFAULT 0 CHECK(execution_attempts BETWEEN 0 AND 8),
  ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN last_error text CHECK(last_error IN ('NOT_APPLIED','OUTCOME_UNKNOWN')),
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN execution_receipt jsonb;
ALTER TABLE public.zoho_approved_operations ADD COLUMN next_reconcile_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX zoho_operations_reconcile_due ON public.zoho_approved_operations(next_reconcile_at,id) WHERE state='processing';
CREATE INDEX zoho_operations_retry_due ON public.zoho_approved_operations(next_attempt_at,id)
  WHERE state IN ('queued','failed') AND execution_attempts<8;
CREATE INDEX zoho_operations_unresolved ON public.zoho_approved_operations(lease_expires_at,id)
  WHERE state='processing';

-- Never reuse an old attempt's token, including after multiple retries. An
-- append-only history makes fencing durable rather than a caller convention.
CREATE TABLE public.zoho_execution_attempts (
  id uuid PRIMARY KEY,
  operation_id uuid NOT NULL REFERENCES public.zoho_approved_operations(id),
  attempt_number integer NOT NULL CHECK(attempt_number BETWEEN 1 AND 8),
  started_at timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz NOT NULL,
  UNIQUE(operation_id,attempt_number)
);
REVOKE ALL ON public.zoho_execution_attempts FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT ON public.zoho_execution_attempts TO service_role;

-- All execution transitions use the same connection -> record -> operation lock order
-- as staging, decisions and reconnection. The relationship IDs are immutable here.
CREATE FUNCTION public.zoho_lock_operation(p_operation uuid)
RETURNS public.zoho_approved_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE o public.zoho_approved_operations; connection uuid;
BEGIN
  SELECT * INTO o FROM public.zoho_approved_operations WHERE id=p_operation;
  IF NOT FOUND THEN RAISE EXCEPTION 'Operation unavailable' USING ERRCODE='22023'; END IF;
  SELECT connection_id INTO STRICT connection FROM public.zoho_staged_records WHERE id=o.record_id;
  PERFORM 1 FROM public.zoho_connections WHERE id=connection FOR UPDATE;
  PERFORM 1 FROM public.zoho_staged_records WHERE id=o.record_id FOR UPDATE;
  SELECT * INTO STRICT o FROM public.zoho_approved_operations WHERE id=p_operation FOR UPDATE;
  RETURN o;
END;
$$;

CREATE FUNCTION public.zoho_claim_operation(p_operation uuid,p_lease uuid)
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
    OR jsonb_array_length(r.validation_errors)>0 OR o.expires_at<=clock_timestamp() THEN
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
    'externalId',r.external_id,'data',o.approved_data,'targetId',o.expected_target_id,'emailPolicy','forbidden');
END;
$$;

CREATE FUNCTION public.zoho_record_execution_outcome(p_operation uuid,p_lease uuid,p_outcome text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE o public.zoho_approved_operations;
BEGIN
  IF p_outcome IS NULL OR p_outcome NOT IN ('NOT_APPLIED','OUTCOME_UNKNOWN') THEN
    RAISE EXCEPTION 'Invalid outcome' USING ERRCODE='22023';
  END IF;
  o:=public.zoho_lock_operation(p_operation);
  IF o.state<>'processing' OR p_lease IS NULL OR o.lease_token IS DISTINCT FROM p_lease THEN
    RAISE EXCEPTION 'Execution lease changed' USING ERRCODE='40001';
  END IF;
  IF p_outcome='NOT_APPLIED' THEN
    -- Only a destination's definitive no-write response permits a retry. A transport
    -- timeout, expired lease or an already unknown outcome cannot assert this fact.
    IF o.lease_expires_at<=clock_timestamp() OR o.last_error='OUTCOME_UNKNOWN' THEN
      RAISE EXCEPTION 'Reconciliation required' USING ERRCODE='40001';
    END IF;
    UPDATE public.zoho_approved_operations SET state='failed',last_error=p_outcome,
      next_attempt_at=clock_timestamp()+interval '5 minutes' WHERE id=o.id;
    UPDATE public.zoho_staged_records SET decision='failed',execution_state='failed',updated_at=now() WHERE id=o.record_id;
  ELSE
    UPDATE public.zoho_approved_operations SET last_error=p_outcome WHERE id=o.id;
  END IF;
  RETURN jsonb_build_object('operationId',o.id,'retryPermitted',p_outcome='NOT_APPLIED');
END;
$$;

CREATE FUNCTION public.zoho_complete_operation(p_operation uuid,p_lease uuid,p_target uuid,p_receipt uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE o public.zoho_approved_operations; receipt jsonb;
BEGIN
  IF p_lease IS NULL OR p_target IS NULL OR p_receipt IS NULL THEN
    RAISE EXCEPTION 'Completion receipt required' USING ERRCODE='22023';
  END IF;
  o:=public.zoho_lock_operation(p_operation);
  IF o.expected_target_id IS NOT NULL AND o.expected_target_id<>p_target THEN
    RAISE EXCEPTION 'Receipt target changed' USING ERRCODE='40001';
  END IF;
  receipt:=jsonb_build_object('receiptId',p_receipt,'operationId',o.id,'targetId',p_target,'emailPolicy','forbidden');
  IF o.lease_token IS DISTINCT FROM p_lease THEN RAISE EXCEPTION 'Execution lease changed' USING ERRCODE='40001'; END IF;
  IF o.state='completed' THEN
    IF o.execution_receipt IS DISTINCT FROM receipt THEN RAISE EXCEPTION 'Receipt conflict' USING ERRCODE='40001'; END IF;
    RETURN jsonb_build_object('operationId',o.id,'completed',true,'replayed',true);
  END IF;
  IF o.state<>'processing' THEN RAISE EXCEPTION 'Execution not in flight' USING ERRCODE='40001'; END IF;
  -- A late receipt records an already committed effect; it never authorizes a new
  -- write or extends the approval/lease. The canonical destination verifies the grant.
  UPDATE public.zoho_approved_operations SET state='completed',execution_receipt=receipt,completed_at=now(),last_error=NULL WHERE id=o.id;
  UPDATE public.zoho_staged_records SET decision='completed',execution_state='completed',target_id=p_target,updated_at=now() WHERE id=o.record_id;
  RETURN jsonb_build_object('operationId',o.id,'completed',true,'replayed',false);
END;
$$;

-- Operational attention includes unknown/expired in-flight effects, separately
-- from ordinary processing. No operation payload or credential enters the summary.
CREATE OR REPLACE FUNCTION public.zoho_admin_snapshot() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
WITH statuses AS (
  SELECT connection_id,decision AS state,count(*) AS n FROM public.zoho_staged_records GROUP BY connection_id,decision
  UNION ALL
  SELECT r.connection_id,'reconciliation_required',count(*) FROM public.zoho_approved_operations o
    JOIN public.zoho_staged_records r ON r.id=o.record_id
    WHERE o.state='processing' AND (o.last_error='OUTCOME_UNKNOWN' OR o.lease_expires_at<=now()) GROUP BY r.connection_id
)
SELECT jsonb_build_object(
  'connections',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'sourceOrgId',c.source_org_id,
    'region',c.region,'status',c.status,'publisherOrganizationId',c.publisher_organization_id,'configRevision',c.config_revision,
    'lastDiscoveredAt',c.last_discovered_at,'createdAt',c.created_at) ORDER BY c.created_at) FROM public.zoho_connections c),'[]'::jsonb),
  'countsByConnection',coalesce((SELECT jsonb_object_agg(connection_id,totals) FROM (
    SELECT connection_id,jsonb_object_agg(state,n) AS totals FROM statuses GROUP BY connection_id) per_connection),'{}'::jsonb),
  'counts',coalesce((SELECT jsonb_object_agg(state,n) FROM (SELECT state,sum(n) AS n FROM statuses GROUP BY state) totals),'{}'::jsonb),
  'emailPolicy','forbidden');
$$;

REVOKE ALL ON FUNCTION public.zoho_lock_operation(uuid),public.zoho_claim_operation(uuid,uuid),
 public.zoho_record_execution_outcome(uuid,uuid,text),public.zoho_complete_operation(uuid,uuid,uuid,uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_lock_operation(uuid),public.zoho_claim_operation(uuid,uuid),
 public.zoho_record_execution_outcome(uuid,uuid,text),public.zoho_complete_operation(uuid,uuid,uuid,uuid) TO service_role;
COMMIT;
