BEGIN;

DO $$ BEGIN
 ASSERT to_regprocedure('public.zoho_job_trigger_fingerprint()') IS NULL;
 ASSERT to_regprocedure('public.zoho_job_dependency_objects()') IS NULL;
 ASSERT to_regprocedure('public.zoho_job_executable_surface()') IS NULL;
 ASSERT to_regprocedure('public.zoho_job_surface_page(uuid,text,integer)') IS NULL;
 ASSERT to_regprocedure('public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb,text)') IS NULL;
 ASSERT NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.zoho_job_publisher_policies'::regclass
   AND attname='trigger_fingerprint' AND NOT attisdropped);
 ASSERT NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname LIKE 'zoho_%'
     AND p.prosrc ~ 'zoho_job_(trigger_fingerprint|dependency_objects|executable_surface|sql_tokens|body_references)\(');
END $$;

-- Positive poison control: any accidentally retained fingerprint call fails.
CREATE FUNCTION public.zoho_job_trigger_fingerprint() RETURNS text LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Retired scanner was invoked'; END $$;

CREATE FUNCTION public.fixture_simple_jobs(first_id integer,amount integer) RETURNS jsonb LANGUAGE sql AS $$
 SELECT jsonb_agg(jsonb_build_object('externalId',id::text,'modified',clock_timestamp(),
  'data',jsonb_build_object('title','Simple fixture','company_name','Fixture client','department','',
    'location','Bengaluru','employment_type','Full time','description','Fixture description',
    'source_status','Open','application_link',''),
  'errors',jsonb_build_array('department mapping is required.','Job publication and status mapping requires review.')))
 FROM generate_series(first_id,first_id+amount-1) id
$$;
CREATE FUNCTION public.fixture_simple_grant(c uuid,external_value text,status_value text DEFAULT 'Open',title_value text DEFAULT 'Engineer')
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE item jsonb; staged public.zoho_staged_records; operation uuid;
BEGIN
 item:=public.fixture_simple_jobs(external_value::integer,1)->0;
 item:=jsonb_set(jsonb_set(item,'{data,title}',to_jsonb(title_value)),'{data,source_status}',to_jsonb(status_value));
 PERFORM public.zoho_stage_record(c,'Job_Openings',external_value,clock_timestamp(),item->'data',item->'errors');
 SELECT * INTO STRICT staged FROM public.zoho_staged_records WHERE connection_id=c AND external_id=external_value AND module='Job_Openings';
 PERFORM public.zoho_decide_records(c,jsonb_build_array(jsonb_build_object('id',staged.id,'revision',staged.revision,
  'sourceHash',staged.source_hash,'configRevision',staged.config_revision,'targetId',staged.target_id)),
  'approve','Synthetic simple import review',gen_random_uuid(),'10000000-0000-4000-8000-000000000002');
 SELECT id INTO STRICT operation FROM public.zoho_approved_operations WHERE record_id=staged.id AND record_revision=staged.revision;
 RETURN public.zoho_claim_operation(operation,gen_random_uuid());
END $$;
CREATE FUNCTION public.fixture_simple_timeout() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN IF NEW.external_id='1002' THEN RAISE EXCEPTION 'Injected timeout' USING ERRCODE='57014'; END IF; RETURN NEW; END $$;
CREATE TRIGGER fixture_simple_timeout AFTER INSERT ON public.zoho_staged_records
 FOR EACH ROW EXECUTE FUNCTION public.fixture_simple_timeout();

DO $$
DECLARE c uuid; r uuid; claim jsonb; g jsonb; result jsonb; target uuid; failed boolean; rev integer; i integer;
 actor uuid:='10000000-0000-4000-8000-000000000002'; started timestamptz; item jsonb;
BEGIN
 c:=(public.zoho_register_connection('Simple import fixture','77777777777777777772','in',
  '00000000-0000-0000-0000-000000000001',actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 PERFORM public.zoho_configure_job_policy(c,actor,1,'{"Open":"open","Closed":"closed","Draft":"draft"}',
  '{"Full time":"job"}',true,true,'Reviewed source mappings');
 ASSERT public.zoho_job_publisher_ready();
 result:=public.zoho_read_job_policy(c);
 ASSERT result->'policy'->>'enabled'='true';
 ASSERT NOT result ?| ARRAY['triggerFingerprint','surfaceCount','surfaceKinds','triggerSurface'];
 ASSERT NOT (result->'policy') ? 'triggerFingerprint';
 rev:=(result->>'configRevision')::integer;
 started:=clock_timestamp();
 FOR i IN 1..20 LOOP ASSERT public.zoho_job_publisher_ready(); END LOOP;
 ASSERT clock_timestamp()-started<interval '5 seconds','Simple readiness exceeded dependency budget';

 r:=(public.zoho_start_discovery(c,'Job_Openings',actor)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery_batch(r);
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,public.fixture_simple_jobs(10,10),'[]',false);
 ASSERT (SELECT received_count=10 AND staged_count=10 AND next_page=2 FROM public.zoho_discovery_runs WHERE id=r);
 ASSERT (SELECT count(*)=10 FROM public.zoho_staged_records WHERE connection_id=c AND validation_errors='[]');
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_job_links l JOIN public.zoho_staged_records s ON s.id=l.record_id WHERE s.connection_id=c);
 PERFORM public.zoho_stage_record(c,'Candidates','200',clock_timestamp(),'{"name":"Candidate fixture","email":"fixture@example.invalid"}','[]');

 -- Exercise repeated bounded pages plus progress readiness, not just one row.
 r:=(public.zoho_start_discovery(c,'Job_Openings',actor)->>'runId')::uuid;
 started:=clock_timestamp();
 FOR i IN 1..20 LOOP
  claim:=public.zoho_claim_discovery_batch(r);
  PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,i,public.fixture_simple_jobs(4000+(i-1)*10,10),'[]',i<20);
  ASSERT public.zoho_job_publisher_ready();
 END LOOP;
 ASSERT (SELECT next_page=21 AND received_count=200 AND staged_count=200 AND state='completed' FROM public.zoho_discovery_runs WHERE id=r);
 ASSERT clock_timestamp()-started<interval '15 seconds','Simple page and readiness workload exceeded local regression budget';

 g:=public.fixture_simple_grant(c,'1');
 failed:=false;
 BEGIN PERFORM public.zoho_apply_job_operation(jsonb_set(g,'{data,title}','"Forged title"')); EXCEPTION WHEN OTHERS THEN failed:=true; END;
 ASSERT failed,'Changed approval payload accepted';
 failed:=false;
 BEGIN PERFORM public.zoho_apply_job_operation(jsonb_set(g,'{publisherOrganizationId}',to_jsonb(gen_random_uuid()))); EXCEPTION WHEN OTHERS THEN failed:=true; END;
 ASSERT failed,'Publisher override accepted';
 result:=public.zoho_apply_job_operation(g); target:=(result->>'targetId')::uuid;
 ASSERT result->>'state'='completed' AND result->>'emailPolicy'='forbidden';
 ASSERT result=public.zoho_apply_job_operation(g),'Replay changed receipt';
 ASSERT (SELECT organization_id='00000000-0000-0000-0000-000000000001' AND title='Engineer'
   AND company_name='Fixture client' AND department='' AND location='Bengaluru' AND status='open' AND is_active
   FROM public.opportunities WHERE id=target);
 ASSERT (SELECT count(*)=1 FROM public.zoho_job_links WHERE target_id=target);
 ASSERT NOT EXISTS(SELECT 1 FROM public.learning_job_notification_work),'Import queued a notification';
 PERFORM public.zoho_complete_operation((g->>'operationId')::uuid,(g->>'lease')::uuid,target,(result->>'receiptId')::uuid);
 ASSERT public.zoho_find_job_operation_receipt((g->>'operationId')::uuid,g->>'sourceHash')=result;
 g:=public.fixture_simple_grant(c,'1','Closed','Updated');
 result:=public.zoho_apply_job_operation(g);
 ASSERT (result->>'targetId')::uuid=target;
 ASSERT (SELECT status='closed' AND NOT is_active AND title='Updated' FROM public.opportunities WHERE id=target);
 PERFORM public.zoho_complete_operation((g->>'operationId')::uuid,(g->>'lease')::uuid,target,(result->>'receiptId')::uuid);

 -- Preserve manual edits and return the existing durable no-effect proof.
 UPDATE public.opportunities SET title='Manual edit' WHERE id=target;
 g:=public.fixture_simple_grant(c,'1','Open','Source update');
 result:=public.zoho_apply_job_operation(g);
 ASSERT result->>'state'='not_applied' AND result->>'reviewRequired'='true';
 ASSERT (SELECT title='Manual edit' AND status='closed' FROM public.opportunities WHERE id=target);
 PERFORM public.zoho_ack_job_no_effect((g->>'operationId')::uuid,(g->>'lease')::uuid,g->>'sourceHash');

 -- Entitlement failure cannot become success after scanner removal.
 UPDATE public.tenant_entitlement_overrides SET is_enabled=false
 WHERE tenant_id='00000000-0000-0000-0000-000000000001';
 g:=public.fixture_simple_grant(c,'3','Open');
 result:=public.zoho_apply_job_operation(g);
 ASSERT result->>'state'='not_applied';
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_job_links WHERE record_id=(g->>'recordId')::uuid);
 PERFORM public.zoho_ack_job_no_effect((g->>'operationId')::uuid,(g->>'lease')::uuid,g->>'sourceHash');
 UPDATE public.tenant_entitlement_overrides SET is_enabled=true
 WHERE tenant_id='00000000-0000-0000-0000-000000000001';

 -- Normal field/mapping failures still require individual correction.
 item:=public.fixture_simple_jobs(30,1)->0;
 PERFORM public.zoho_stage_record(c,'Job_Openings','30',clock_timestamp(),jsonb_set(item->'data','{source_status}','"Unknown"'),'[]');
 ASSERT (SELECT validation_errors @> '["Job publication and status mapping requires review."]' FROM public.zoho_staged_records WHERE connection_id=c AND external_id='30');
 PERFORM public.zoho_set_source_suppression(c,'Job_Openings','40',true,'Synthetic suppression check',actor);
 ASSERT public.zoho_stage_record(c,'Job_Openings','40',clock_timestamp(),item->'data','[]')->>'suppressed'='true';
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_staged_records WHERE connection_id=c AND external_id='40');

 -- Mid-page failure must preserve the checkpoint and roll back every job.
 r:=(public.zoho_start_discovery(c,'Job_Openings',actor)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery_batch(r); failed:=false;
 BEGIN PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,public.fixture_simple_jobs(1001,2),'[]',false);
 EXCEPTION WHEN query_canceled THEN failed:=true; END;
 ASSERT failed;
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_staged_records WHERE connection_id=c AND external_id IN ('1001','1002'));
 ASSERT (SELECT next_page=1 AND staged_count=0 FROM public.zoho_discovery_runs WHERE id=r);
 failed:=false;
 BEGIN PERFORM public.zoho_commit_claimed_discovery(r,gen_random_uuid(),1,public.fixture_simple_jobs(1003,1),'[]',false);
 EXCEPTION WHEN serialization_failure THEN failed:=true; END;
 ASSERT failed,'Unclaimed batch committed';

 -- Existing in-flight and payload-retention fences still apply to jobs.
 g:=public.fixture_simple_grant(c,'11','Draft');
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,public.fixture_simple_jobs(11,1),'[]',false);
 ASSERT (SELECT deferred_count=1 FROM public.zoho_discovery_runs WHERE id=r);
 ASSERT EXISTS(SELECT 1 FROM public.zoho_deferred_records WHERE connection_id=c AND external_id='11' AND state='waiting_execution');
 PERFORM public.zoho_record_execution_outcome((g->>'operationId')::uuid,(g->>'lease')::uuid,'NOT_APPLIED');
 UPDATE public.zoho_staged_records SET payload_staged_at=now()-interval '90 days' WHERE connection_id=c AND external_id='10';
 item:=public.fixture_simple_jobs(10,1)->0;
 PERFORM public.zoho_stage_record(c,'Job_Openings','10',clock_timestamp(),item->'data',item->'errors');
 ASSERT (SELECT revision=2 AND payload_staged_at>now()-interval '1 minute'
   FROM public.zoho_staged_records WHERE connection_id=c AND external_id='10');

 -- Mapping changes invalidate old grants through the existing configuration fence.
 g:=public.fixture_simple_grant(c,'2','Draft');
 PERFORM public.zoho_record_execution_outcome((g->>'operationId')::uuid,(g->>'lease')::uuid,'NOT_APPLIED');
 PERFORM public.zoho_configure_job_policy(c,actor,rev,'{"Open":"open","Closed":"closed","Draft":"draft"}',
  '{"Full time":"job"}',true,true,'Updated source mappings');
 failed:=false; BEGIN PERFORM public.zoho_apply_job_operation(g); EXCEPTION WHEN OTHERS THEN failed:=true; END;
 ASSERT failed,'Old configuration grant accepted';
 failed:=false; BEGIN PERFORM public.zoho_configure_job_policy(c,actor,rev,'{"Open":"open"}',
  '{"Full time":"job"}',true,true,'Stale configuration'); EXCEPTION WHEN serialization_failure THEN failed:=true; END;
 ASSERT failed,'Stale mapping save accepted';
 ASSERT has_function_privilege('service_role','public.zoho_configure_job_policy(uuid,uuid,integer,jsonb,jsonb,boolean,boolean,text)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_configure_job_policy(uuid,uuid,integer,jsonb,jsonb,boolean,boolean,text)','EXECUTE');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_apply_job_operation(jsonb)','EXECUTE');
END $$;
ROLLBACK;
