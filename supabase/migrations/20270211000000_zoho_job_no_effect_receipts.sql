BEGIN;

-- Only the destination transaction can certify a rejected, rolled-back effect.
-- Queue errors, lease expiry and an absent completed receipt are never proof.
CREATE TABLE public.zoho_job_no_effect_receipts (
  operation_id uuid NOT NULL REFERENCES public.zoho_approved_operations(id),
  lease_token uuid NOT NULL REFERENCES public.zoho_execution_attempts(id),
  source_hash text NOT NULL CHECK (source_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(operation_id,lease_token)
);
REVOKE ALL ON public.zoho_job_no_effect_receipts FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

CREATE FUNCTION public.zoho_job_no_effect_receipt(p_operation uuid,p_source_hash text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT jsonb_build_object('state','not_applied','operationId',r.operation_id,
    'lease',r.lease_token,'sourceHash',r.source_hash,'emailPolicy','forbidden',
    'reviewRequired',true,'reasonCode','JOB_REVIEW_REQUIRED')
  FROM public.zoho_job_no_effect_receipts r JOIN public.zoho_approved_operations o
    ON o.id=r.operation_id AND o.lease_token=r.lease_token AND o.source_hash=r.source_hash
  WHERE r.operation_id=p_operation AND r.source_hash=p_source_hash;
$$;

CREATE OR REPLACE FUNCTION public.zoho_find_job_operation_receipt(p_operation uuid,p_source_hash text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT coalesce((SELECT jsonb_build_object('state','completed','operationId',r.operation_id,
    'sourceHash',r.source_hash,'targetId',r.target_id,'receiptId',r.receipt_id,'emailPolicy','forbidden')
    FROM public.zoho_job_receipts r WHERE r.operation_id=p_operation AND r.source_hash=p_source_hash),
    public.zoho_job_no_effect_receipt(p_operation,p_source_hash));
$$;

CREATE FUNCTION public.zoho_apply_job_operation(p_grant jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE op public.zoho_approved_operations; result jsonb;
BEGIN
  IF jsonb_typeof(p_grant) IS DISTINCT FROM 'object'
    OR p_grant->>'module' IS DISTINCT FROM 'Job_Openings'
    OR p_grant->>'action' IS DISTINCT FROM 'apply_job'
    OR p_grant->>'emailPolicy' IS DISTINCT FROM 'forbidden' THEN
    RAISE EXCEPTION 'Job approval unavailable' USING ERRCODE='22023';
  END IF;
  -- Retain the standard connection -> staged record -> operation lock order.
  op:=public.zoho_lock_operation((p_grant->>'operationId')::uuid);
  IF op.action<>'apply_job' OR op.source_hash IS DISTINCT FROM p_grant->>'sourceHash' THEN
    RAISE EXCEPTION 'Job operation changed' USING ERRCODE='40001';
  END IF;
  result:=public.zoho_find_job_operation_receipt(op.id,op.source_hash);
  IF result->>'state'='completed' THEN RETURN result; END IF;
  IF result->>'state'='not_applied' AND result->>'lease'=p_grant->>'lease' THEN RETURN result; END IF;
  IF NOT public.zoho_is_live_approved_operation(p_grant) THEN
    RAISE EXCEPTION 'Job approval unavailable' USING ERRCODE='22023';
  END IF;
  BEGIN
    RETURN public.zoho_apply_job_operation_effect(p_grant);
  EXCEPTION WHEN SQLSTATE 'ZJ001' THEN
    -- The private effect function reserves ZJ001 for anticipated pre-write
    -- business rejection. This subtransaction has rolled back before proof is
    -- committed. Unexpected exceptions escape, retaining ambiguous semantics.
    IF EXISTS(SELECT 1 FROM public.zoho_job_receipts WHERE operation_id=op.id) THEN
      RAISE EXCEPTION 'Job outcome requires reconciliation' USING ERRCODE='40001';
    END IF;
    INSERT INTO public.zoho_job_no_effect_receipts(operation_id,lease_token,source_hash)
      VALUES(op.id,op.lease_token,op.source_hash) ON CONFLICT DO NOTHING;
    RETURN public.zoho_job_no_effect_receipt(op.id,op.source_hash);
  END;
END;
$$;

CREATE FUNCTION public.zoho_ack_job_no_effect(p_operation uuid,p_lease uuid,p_source_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE op public.zoho_approved_operations;
BEGIN
  op:=public.zoho_lock_operation(p_operation);
  IF op.action<>'apply_job' OR op.source_hash IS DISTINCT FROM p_source_hash
    OR op.lease_token IS DISTINCT FROM p_lease OR p_lease IS NULL
    OR NOT EXISTS(SELECT 1 FROM public.zoho_job_no_effect_receipts r
      WHERE r.operation_id=op.id AND r.lease_token=p_lease AND r.source_hash=p_source_hash)
    OR EXISTS(SELECT 1 FROM public.zoho_job_receipts WHERE operation_id=op.id) THEN
    RAISE EXCEPTION 'Job no-effect proof unavailable' USING ERRCODE='40001';
  END IF;
  IF op.state='approval_stale' THEN RETURN jsonb_build_object('reviewRequired',true); END IF;
  IF op.state<>'processing' THEN
    RAISE EXCEPTION 'Job execution state changed' USING ERRCODE='40001';
  END IF;
  -- Durable destination evidence can resolve a lost response even after expiry
  -- or OUTCOME_UNKNOWN. It never renews permission to execute the old revision.
  UPDATE public.zoho_approved_operations SET state='approval_stale',last_error='NOT_APPLIED' WHERE id=op.id;
  UPDATE public.zoho_staged_records SET revision=revision+1,decision='pending_approval',
    execution_state='not_approved',updated_at=now()
    WHERE id=op.record_id AND revision=op.record_revision AND decision IN ('processing','approved','failed');
  RETURN jsonb_build_object('reviewRequired',true);
END;
$$;

REVOKE ALL ON FUNCTION public.zoho_job_no_effect_receipt(uuid,text),
  public.zoho_apply_job_operation(jsonb),public.zoho_ack_job_no_effect(uuid,uuid,text),
  public.zoho_find_job_operation_receipt(uuid,text),public.zoho_apply_job_operation_effect(jsonb)
  FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_apply_job_operation(jsonb),
  public.zoho_ack_job_no_effect(uuid,uuid,text),public.zoho_find_job_operation_receipt(uuid,text) TO service_role;
COMMIT;
