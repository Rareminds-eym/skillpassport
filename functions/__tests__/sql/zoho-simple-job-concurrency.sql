-- Runs only in the disposable publisher-test database, after the final migration.
CREATE TABLE public.fixture_simple_concurrent_grants(n integer PRIMARY KEY,grant_value jsonb NOT NULL);
CREATE TABLE public.fixture_simple_quota_baseline AS
 SELECT count(*) AS active_jobs FROM public.opportunities
 WHERE organization_id='00000000-0000-0000-0000-000000000001' AND (is_active OR status='open');
DO $$
DECLARE c uuid; actor uuid:='10000000-0000-4000-8000-000000000002'; r public.zoho_staged_records; operation uuid; grant_value jsonb; n integer;
BEGIN
 ASSERT to_regprocedure('public.zoho_job_trigger_fingerprint()') IS NULL,'Concurrency fixture must run on the final schema';
 UPDATE public.tenant_entitlement_overrides SET value_numeric=(SELECT active_jobs+1 FROM public.fixture_simple_quota_baseline),
  is_enabled=true,expires_at=NULL WHERE tenant_id='00000000-0000-0000-0000-000000000001'
  AND feature_id=(SELECT id FROM public.features WHERE feature_key='active_job_posts');
 ASSERT FOUND,'Platform entitlement fixture missing';
 FOR n IN 1..2 LOOP
  c:=(public.zoho_register_connection('Current quota fixture','6666666666666666666'||n::text,'in',
   '00000000-0000-0000-0000-000000000001',actor)->>'id')::uuid;
  PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
  PERFORM public.zoho_configure_job_policy(c,actor,1,'{"Open":"open"}','{"Full time":"job"}',true,true,'Reviewed current quota fixture');
  PERFORM public.zoho_stage_record(c,'Job_Openings','1',clock_timestamp(),
   '{"title":"Concurrent fixture","company_name":"Fixture client","department":"","location":"Chennai","employment_type":"Full time","description":"Fixture","source_status":"Open","application_link":""}','[]');
  SELECT * INTO STRICT r FROM public.zoho_staged_records WHERE connection_id=c AND module='Job_Openings' AND external_id='1';
  PERFORM public.zoho_decide_records(c,jsonb_build_array(jsonb_build_object('id',r.id,'revision',r.revision,
   'sourceHash',r.source_hash,'configRevision',r.config_revision,'targetId',r.target_id)),
   'approve','Reviewed concurrent fixture',gen_random_uuid(),actor);
  SELECT id INTO STRICT operation FROM public.zoho_approved_operations WHERE record_id=r.id AND record_revision=r.revision;
  grant_value:=public.zoho_claim_operation(operation,gen_random_uuid());
  ASSERT grant_value->>'claimed'='true';
  INSERT INTO public.fixture_simple_concurrent_grants VALUES(n,grant_value);
 END LOOP;
END $$;
GRANT SELECT ON public.fixture_simple_concurrent_grants TO service_role;

-- RUN CONCURRENT OPERATIONS HERE

DO $$
DECLARE completed integer; rejected integer; g jsonb; result jsonb;
BEGIN
 SELECT count(*) FILTER(WHERE receipt->>'state'='completed'),count(*) FILTER(WHERE receipt->>'state'='not_applied')
 INTO completed,rejected FROM public.fixture_simple_concurrent_grants f
 CROSS JOIN LATERAL (SELECT public.zoho_find_job_operation_receipt((f.grant_value->>'operationId')::uuid,f.grant_value->>'sourceHash') AS receipt) receipts;
 ASSERT completed=1 AND rejected=1,'Concurrent publishers did not share the last slot';
 ASSERT (SELECT count(*) FROM public.opportunities WHERE organization_id='00000000-0000-0000-0000-000000000001'
  AND (is_active OR status='open'))=(SELECT active_jobs+1 FROM public.fixture_simple_quota_baseline),'Concurrent writes exceeded capacity';
 ASSERT (SELECT count(*) FROM public.zoho_job_links l JOIN public.fixture_simple_concurrent_grants f
  ON l.record_id=(f.grant_value->>'recordId')::uuid)=1,'Concurrent publishers created extra links';
 FOR g IN SELECT grant_value FROM public.fixture_simple_concurrent_grants LOOP
  result:=public.zoho_find_job_operation_receipt((g->>'operationId')::uuid,g->>'sourceHash');
  ASSERT result=public.zoho_apply_job_operation(g),'Concurrent outcome replay changed';
  IF result->>'state'='completed' THEN
   PERFORM public.zoho_complete_operation((g->>'operationId')::uuid,(g->>'lease')::uuid,(result->>'targetId')::uuid,(result->>'receiptId')::uuid);
  ELSE
   ASSERT result->>'reasonCode'='JOB_REVIEW_REQUIRED';
   PERFORM public.zoho_ack_job_no_effect((g->>'operationId')::uuid,(g->>'lease')::uuid,g->>'sourceHash');
  END IF;
 END LOOP;
 ASSERT NOT EXISTS(SELECT 1 FROM public.learning_job_notification_work),'Concurrent imports queued notifications';
END $$;
