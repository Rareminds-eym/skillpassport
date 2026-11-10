DO $$
DECLARE c uuid; other_source uuid; empty_source uuid; org uuid; actor uuid:=gen_random_uuid();
 result jsonb; source_totals jsonb; candidate_totals jsonb; job_totals jsonb; batch uuid:=gen_random_uuid();
 state_key text; before_rows bigint; i integer;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Module counts fixture','99999999999999998101','in',org,actor)->>'id')::uuid;
 other_source:=(public.zoho_register_connection('Other counts fixture','99999999999999998102','in',org,actor)->>'id')::uuid;
 empty_source:=(public.zoho_register_connection('Empty counts fixture','99999999999999998103','in',org,actor)->>'id')::uuid;
 UPDATE public.zoho_connections SET status='connected' WHERE id IN(c,other_source,empty_source);
 FOR i IN 1..60 LOOP
  PERFORM public.zoho_stage_record(c,'Candidates',(1000+i)::text,now(),jsonb_build_object('name','Private fixture candidate','email','private-fixture@example.invalid'),'[]');
 END LOOP;
 FOR i IN 1..7 LOOP
  PERFORM public.zoho_stage_record(c,'Job_Openings',(5000+i)::text,now(),jsonb_build_object('title','Private fixture job'),'[]');
 END LOOP;
 PERFORM public.zoho_stage_record(other_source,'Candidates','9001',now(),'{}','[]');
 PERFORM public.zoho_stage_record(other_source,'Job_Openings','9002',now(),'{}','[]');
 UPDATE public.zoho_staged_records SET decision='completed',execution_state='completed'
 WHERE (connection_id=c AND ((module='Candidates' AND external_id IN('1001','1002','1003'))
  OR (module='Job_Openings' AND external_id IN('5001','5002')))) OR (connection_id=other_source AND module='Candidates');
 UPDATE public.zoho_staged_records SET decision='held' WHERE connection_id=c AND module='Job_Openings' AND external_id='5003';
 SELECT count(*) INTO before_rows FROM public.zoho_staged_records;
 result:=public.zoho_admin_snapshot();
 candidate_totals:=result->'countsByConnectionAndModule'->c::text->'Candidates';
 job_totals:=result->'countsByConnectionAndModule'->c::text->'Job_Openings';
 ASSERT candidate_totals->>'pending_approval'='57','Counts must include records beyond the 50-row page';
 ASSERT candidate_totals->>'completed'='3'; ASSERT job_totals->>'completed'='2';
 ASSERT job_totals->>'pending_approval'='4'; ASSERT job_totals->>'held'='1';
 ASSERT result->'countsByConnectionAndModule'->other_source::text->'Candidates'->>'completed'='1';
 ASSERT result->'countsByConnectionAndModule'->other_source::text->'Job_Openings'->>'pending_approval'='1';
 ASSERT NOT (result->'countsByConnectionAndModule')?empty_source::text;
 ASSERT result->'countsByConnection'->c::text->>'completed'='5';
 ASSERT result->'countsByConnection'->c::text->>'pending_approval'='61';
 ASSERT result->>'emailPolicy'='forbidden';
 ASSERT result::text NOT LIKE '%private-fixture@example.invalid%' AND result::text NOT LIKE '%Private fixture job%';
 ASSERT (SELECT count(*)=before_rows FROM public.zoho_staged_records);
 -- Reconciliation attention remains scoped to the operation's source and type.
 INSERT INTO public.zoho_approval_batches(id,connection_id,request_id,actor_id,decision,reason,manifest)
 VALUES(batch,c,gen_random_uuid(),actor,'approve','Synthetic module-count verification','[]');
 INSERT INTO public.zoho_approved_operations(batch_id,record_id,record_revision,source_hash,config_revision,approved_data,action,state,expires_at,lease_token,lease_expires_at,last_error,candidate_review_hash)
 SELECT batch,r.id,r.revision,r.source_hash,r.config_revision,r.proposed_data,
  CASE r.module WHEN 'Candidates' THEN 'provision_candidate' ELSE 'apply_job' END,'processing',now()+interval '1 hour',
  gen_random_uuid(),now()-interval '1 minute','OUTCOME_UNKNOWN',CASE WHEN r.module='Candidates' THEN repeat('a',64) ELSE NULL END
 FROM public.zoho_staged_records r WHERE r.connection_id=c AND r.external_id IN('1004','5004');
 UPDATE public.zoho_staged_records SET decision='processing',execution_state='processing' WHERE connection_id=c AND external_id IN('1004','5004');
 result:=public.zoho_admin_snapshot();
 candidate_totals:=result->'countsByConnectionAndModule'->c::text->'Candidates';
 job_totals:=result->'countsByConnectionAndModule'->c::text->'Job_Openings';
 source_totals:=result->'countsByConnection'->c::text;
 ASSERT candidate_totals->>'reconciliation_required'='1'; ASSERT job_totals->>'reconciliation_required'='1';
 FOR state_key IN SELECT jsonb_object_keys(source_totals) LOOP
  ASSERT (source_totals->>state_key)::bigint=coalesce((candidate_totals->>state_key)::bigint,0)+coalesce((job_totals->>state_key)::bigint,0),'Combined totals changed semantics';
 END LOOP;
 ASSERT NOT has_function_privilege('anon','public.zoho_admin_snapshot()','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_admin_snapshot()','EXECUTE');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_admin_snapshot()','EXECUTE');
 ASSERT has_function_privilege('service_role','public.zoho_admin_snapshot()','EXECUTE');
END $$;
