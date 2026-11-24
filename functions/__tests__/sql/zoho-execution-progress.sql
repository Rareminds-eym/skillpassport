BEGIN;
INSERT INTO public.zoho_staged_records
 SELECT md5(i::text)::uuid,'10000000-0000-4000-8000-000000000001','Candidates' FROM generate_series(1,120) i;
INSERT INTO public.zoho_approved_operations(record_id,state,action,last_error,lease_expires_at,expires_at,execution_attempts,next_attempt_at)
 SELECT md5(i::text)::uuid,CASE i WHEN 1 THEN 'queued' WHEN 2 THEN 'processing' WHEN 3 THEN 'processing'
 WHEN 4 THEN 'processing' WHEN 5 THEN 'failed' WHEN 6 THEN 'failed' WHEN 7 THEN 'failed'
 WHEN 8 THEN 'approval_stale' WHEN 9 THEN 'revoked' WHEN 10 THEN 'queued' ELSE 'completed' END,
 'provision_candidate',CASE WHEN i=3 THEN 'OUTCOME_UNKNOWN' ELSE NULL END,
 CASE WHEN i=4 THEN now()-interval '1 minute' ELSE now()+interval '1 minute' END,
 CASE WHEN i IN (6,10) THEN now()-interval '1 minute' ELSE now()+interval '1 hour' END,
 CASE WHEN i IN (6,7) THEN 8 ELSE 1 END,
 CASE WHEN i=5 THEN now()+interval '5 minutes' ELSE now() END FROM generate_series(1,120) i;
INSERT INTO public.zoho_staged_records VALUES
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Job_Openings'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Candidates');
INSERT INTO public.zoho_approved_operations(record_id,state,action,last_error,lease_expires_at,expires_at,execution_attempts,next_attempt_at) VALUES
 ('20000000-0000-4000-8000-000000000001','completed','apply_job',NULL,NULL,now(),1,now()),
 ('20000000-0000-4000-8000-000000000002','completed','provision_candidate',NULL,NULL,now(),1,now());
DO $$ DECLARE p jsonb; op public.zoho_approved_operations; n integer; BEGIN
 p:=public.zoho_execution_progress('10000000-0000-4000-8000-000000000001','Candidates');
 IF NOT p @> '{"total":120,"completed":110,"queued":1,"processing":1,"checking":2,"retrying":1,"attention":5,"expired":2,"exhausted":2,"emailPolicy":"forbidden"}'::jsonb
 THEN RAISE EXCEPTION 'Wrong aggregate: %',p; END IF;
 IF (p->>'nextRetryAt')::timestamptz<>now()+interval '5 minutes' THEN RAISE EXCEPTION 'Retry timing mismatch'; END IF;
 SELECT * INTO STRICT op FROM public.zoho_approved_operations WHERE record_id=md5('3')::uuid;
 IF public.zoho_note_candidate_projection_pending(op.id,gen_random_uuid(),op.source_hash,gen_random_uuid(),gen_random_uuid()) THEN RAISE EXCEPTION 'Unfenced projection marker accepted'; END IF;
 IF NOT public.zoho_note_candidate_projection_pending(op.id,op.lease_token,op.source_hash,gen_random_uuid(),gen_random_uuid()) THEN RAISE EXCEPTION 'Valid projection marker rejected'; END IF;
 p:=public.zoho_execution_progress('10000000-0000-4000-8000-000000000001','Candidates');
 IF NOT p @> '{"total":120,"completed":110,"checking":1,"syncing":1}'::jsonb THEN RAISE EXCEPTION 'Projection phase mismatch: %',p; END IF;
 IF has_function_privilege('anon','public.zoho_note_candidate_projection_pending(uuid,uuid,text,uuid,uuid)','EXECUTE') THEN RAISE EXCEPTION 'Projection marker leaked'; END IF;
 p:=public.zoho_execution_progress('10000000-0000-4000-8000-000000000001','Job_Openings');
 IF NOT p @> '{"total":1,"completed":1}'::jsonb THEN RAISE EXCEPTION 'Job scope mismatch'; END IF;
 p:=public.zoho_execution_progress('30000000-0000-4000-8000-000000000001','Candidates');
 IF NOT p @> '{"total":0,"completed":0,"attention":0}'::jsonb THEN RAISE EXCEPTION 'Empty scope mismatch'; END IF;
 IF has_function_privilege('anon','public.zoho_execution_progress(uuid,text)','EXECUTE') OR
 has_function_privilege('authenticated','public.zoho_execution_progress(uuid,text)','EXECUTE') OR
 has_function_privilege('zoho_discovery','public.zoho_execution_progress(uuid,text)','EXECUTE') THEN RAISE EXCEPTION 'Progress permission leak'; END IF;
 BEGIN PERFORM public.zoho_execution_progress('10000000-0000-4000-8000-000000000001',NULL); RAISE EXCEPTION 'Invalid scope accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 INSERT INTO public.zoho_staged_records SELECT md5('recovery-'||i)::uuid,'30000000-0000-4000-8000-000000000001','Candidates' FROM generate_series(1,130) i;
 INSERT INTO public.zoho_approved_operations(record_id,state,action,last_error,lease_expires_at,expires_at,execution_attempts,next_attempt_at)
 SELECT md5('recovery-'||i)::uuid,'processing','provision_candidate','OUTCOME_UNKNOWN',now()-interval '1 minute',now()+interval '1 hour',1,now() FROM generate_series(1,130) i;
 SELECT count(*) INTO n FROM public.zoho_schedule_reconciliation(ARRAY['provision_candidate']);
 IF n<>100 THEN RAISE EXCEPTION 'Recovery batch bound mismatch: %',n; END IF;
 SELECT count(*) INTO n FROM public.zoho_schedule_reconciliation(ARRAY['provision_candidate']);
 IF n<>32 THEN RAISE EXCEPTION 'Recovery remainder mismatch: %',n; END IF;
 SELECT count(*) INTO n FROM public.zoho_schedule_reconciliation(ARRAY['provision_candidate']);
 IF n<>0 THEN RAISE EXCEPTION 'Recovery reservation repeated work'; END IF;
 IF has_function_privilege('anon','public.zoho_schedule_reconciliation(text[])','EXECUTE') THEN RAISE EXCEPTION 'Recovery scheduling permission leak'; END IF;
END $$;
SET LOCAL ROLE service_role;
SELECT public.zoho_execution_progress('10000000-0000-4000-8000-000000000001','Candidates');
RESET ROLE;
ROLLBACK;
