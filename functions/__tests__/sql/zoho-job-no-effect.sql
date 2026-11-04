-- The preceding real race leaves one committed job and one definite quota rejection.
-- Resolve the rejected operation using its actual private SQL proof, not a caller flag.
SET ROLE service_role;
DO $$
DECLARE op public.zoho_approved_operations; proof jsonb; staged public.zoho_staged_records; changed integer;
BEGIN
  SELECT o.* INTO STRICT op FROM public.zoho_approved_operations o
    WHERE o.state='processing' AND o.action='apply_job'
      AND public.zoho_find_job_operation_receipt(o.id,o.source_hash)->>'state'='not_applied';
  SELECT * INTO STRICT staged FROM public.zoho_staged_records WHERE id=op.record_id;
  proof:=public.zoho_find_job_operation_receipt(op.id,op.source_hash);
  ASSERT (SELECT count(*)=7 FROM jsonb_object_keys(proof));
  ASSERT proof->>'lease'=op.lease_token::text AND proof->>'reasonCode'='JOB_REVIEW_REQUIRED';
  ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_job_receipts WHERE operation_id=op.id);
  BEGIN
    PERFORM public.zoho_ack_job_no_effect(op.id,gen_random_uuid(),op.source_hash);
    RAISE EXCEPTION 'Forged lease acknowledged';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  BEGIN
    PERFORM public.zoho_ack_job_no_effect(op.id,op.lease_token,repeat('f',64));
    RAISE EXCEPTION 'Forged source acknowledged';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  -- A lost destination response is initially unknown; later durable evidence,
  -- unlike receipt absence, can settle it even after its execution lease expires.
  PERFORM public.zoho_record_execution_outcome(op.id,op.lease_token,'OUTCOME_UNKNOWN');
  UPDATE public.zoho_approved_operations SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE id=op.id;
  ASSERT public.zoho_ack_job_no_effect(op.id,op.lease_token,op.source_hash)='{"reviewRequired":true}'::jsonb;
  ASSERT (SELECT state='approval_stale' AND last_error='NOT_APPLIED' FROM public.zoho_approved_operations WHERE id=op.id);
  SELECT revision INTO changed FROM public.zoho_staged_records WHERE id=op.record_id;
  ASSERT changed=staged.revision+1;
  ASSERT (SELECT decision='pending_approval' AND execution_state='not_approved' FROM public.zoho_staged_records WHERE id=op.record_id);
  ASSERT public.zoho_ack_job_no_effect(op.id,op.lease_token,op.source_hash)='{"reviewRequired":true}'::jsonb;
  ASSERT (SELECT revision=changed FROM public.zoho_staged_records WHERE id=op.record_id);
  ASSERT public.zoho_find_job_operation_receipt(op.id,op.source_hash)=proof;
  ASSERT public.zoho_claim_operation(op.id,gen_random_uuid())->'claimed'='false'::jsonb;
  ASSERT NOT has_table_privilege('service_role','public.zoho_job_no_effect_receipts','INSERT,UPDATE,DELETE');
  ASSERT NOT has_function_privilege('service_role','public.zoho_apply_job_operation_effect(jsonb)','EXECUTE');
  ASSERT NOT has_function_privilege('anon','public.zoho_ack_job_no_effect(uuid,uuid,text)','EXECUTE');
END $$;
RESET ROLE;

-- A genuine unexpected database failure must still raise, with no durable
-- no-effect assertion. This constraint is reviewed before the rejected insert.
ALTER TABLE public.opportunities ADD CONSTRAINT fixture_unexpected_title
  CHECK(title<>'Unanticipated database constraint');
DO $$
DECLARE c uuid; revision_value integer; grant_value jsonb; o record; receipt jsonb; rejected boolean:=false;
BEGIN
  FOR o IN SELECT * FROM public.zoho_approved_operations WHERE state='processing' LOOP
    receipt:=public.zoho_find_job_operation_receipt(o.id,o.source_hash);
    IF receipt->>'state'='completed' THEN
      PERFORM public.zoho_complete_operation(o.id,o.lease_token,(receipt->>'targetId')::uuid,(receipt->>'receiptId')::uuid);
    END IF;
  END LOOP;
  SELECT id,config_revision INTO STRICT c,revision_value FROM public.zoho_connections WHERE source_org_id='88888888888888888881';
  PERFORM public.zoho_configure_job_policy(c,'10000000-0000-4000-8000-000000000002',revision_value,
    '{"Open":"draft","Draft":"draft","Closed":"closed"}','{"Full time":"job"}',true,true,
    public.zoho_job_trigger_fingerprint(),'Reviewed unexpected constraint test');
  grant_value:=public.fixture_job_grant(c,'990099','Draft','Unanticipated database constraint');
  BEGIN
    PERFORM public.zoho_apply_job_operation(grant_value);
  EXCEPTION WHEN check_violation THEN rejected:=true; END;
  ASSERT rejected,'Unexpected failure was converted into a no-effect outcome';
  ASSERT public.zoho_find_job_operation_receipt((grant_value->>'operationId')::uuid,grant_value->>'sourceHash') IS NULL;
  ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_job_no_effect_receipts WHERE operation_id=(grant_value->>'operationId')::uuid);
END $$;
