INSERT INTO public.learners VALUES
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002');
INSERT INTO public.personal_assessment_attempts(id,learner_id,grade_level,status) VALUES
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','college','in_progress'),
 ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','college','in_progress'),
 ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','college','completed'),
 ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000001','college','in_progress'),
 ('30000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000001','college','in_progress'),
 ('30000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000001','college','in_progress');
INSERT INTO public.adaptive_aptitude_sessions VALUES
 ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','in_progress'),
 ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','in_progress'),
 ('40000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','completed'),
 ('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','completed'),
 ('40000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000001','completed');
UPDATE public.personal_assessment_attempts SET adaptive_aptitude_session_id='40000000-0000-4000-8000-000000000004'
 WHERE id='30000000-0000-4000-8000-000000000002';
CREATE FUNCTION pg_temp.expect_failure(statement text, expected text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE actual text;
BEGIN
 BEGIN EXECUTE statement;
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS actual=RETURNED_SQLSTATE;
   ASSERT actual=expected,format('Expected %s, received %s',expected,actual); RETURN;
 END;
 RAISE EXCEPTION 'Expected rejection: %',statement;
END; $$;
DO $$ BEGIN
 ASSERT NOT has_function_privilege('anon','public.patch_owned_assessment_progress(uuid,uuid,text,jsonb)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.patch_owned_assessment_progress(uuid,uuid,text,jsonb)','EXECUTE');
 ASSERT has_function_privilege('service_role','public.patch_owned_assessment_progress(uuid,uuid,text,jsonb)','EXECUTE');
END; $$;
SET ROLE service_role;
DO $$
DECLARE owner_id uuid:='10000000-0000-4000-8000-000000000001';
 attempt_id uuid:='30000000-0000-4000-8000-000000000001'; r jsonb; again jsonb; patch jsonb;
BEGIN
 ASSERT public.patch_owned_assessment_progress(owner_id,'30000000-0000-4000-8000-000000000002','progress','{}') IS NULL;
 ASSERT public.patch_owned_assessment_progress(owner_id,'30000000-0000-4000-8000-000000000002','progress',
   '{"adaptive_aptitude_session_id":"40000000-0000-4000-8000-000000000001"}') IS NULL;
 ASSERT public.patch_owned_assessment_progress(owner_id,'30000000-0000-4000-8000-000000000099','progress','{}') IS NULL;
 ASSERT public.patch_owned_assessment_progress('20000000-0000-4000-8000-000000000001',attempt_id,'progress','{}') IS NULL;
 r:=public.patch_owned_assessment_progress(owner_id,attempt_id,'progress',
   '{"current_question_index":3,"timer_remaining":45,"all_responses":{"original":1},"section_timings":{"riasec":30}}');
 ASSERT r->>'current_question_index'='3' AND r->>'timer_remaining'='45';
 r:=public.patch_owned_assessment_progress(owner_id,attempt_id,'progress','{"all_responses":{"next":2}}');
 ASSERT r->'all_responses' @> '{"original":1,"next":2}'::jsonb AND r->>'timer_remaining'='45';
 ASSERT r->>'current_question_index'='3';
 r:=public.patch_owned_assessment_progress(owner_id,attempt_id,'progress','{"timer_remaining":null}');
 ASSERT r->'timer_remaining'='null'::jsonb;
 FOREACH patch IN ARRAY ARRAY['{"status":"completed"}'::jsonb,'{"learner_id":"foreign"}'::jsonb,
   '{"aptitude_scores":{}}'::jsonb,'{"elapsed_time":-1}'::jsonb,'{"all_responses":[]}'::jsonb,
   '{"section_timings":{"riasec":"2"}}'::jsonb,'{"section_timings":{"riasec":2147483648}}'::jsonb] LOOP
   PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_progress(%L,%L,%L,%L)', owner_id,attempt_id,'progress',patch),'22023');
 END LOOP;
 PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_progress(%L,%L,%L,%L)',owner_id,attempt_id,'progress',
   '{"adaptive_aptitude_session_id":"40000000-0000-4000-8000-000000000002"}'),'42501');
 r:=public.patch_owned_assessment_progress(owner_id,attempt_id,'progress','{"adaptive_aptitude_session_id":"40000000-0000-4000-8000-000000000003"}');
 r:=public.patch_owned_assessment_progress(owner_id,attempt_id,'progress','{"adaptive_aptitude_session_id":"40000000-0000-4000-8000-000000000003"}');
 ASSERT r->>'adaptive_aptitude_session_id'='40000000-0000-4000-8000-000000000003';
 PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_progress(%L,%L,%L,%L)',owner_id,attempt_id,'progress',
   '{"adaptive_aptitude_session_id":"40000000-0000-4000-8000-000000000001"}'),'P0001');
 PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_progress(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000003','progress','{}'),'P0001');
 PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_progress(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000003','progress',
   '{"adaptive_aptitude_session_id":"40000000-0000-4000-8000-000000000001"}'),'P0001');
 PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_progress(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000003','abandon','{}'),'P0001');
 r:=public.patch_owned_assessment_progress(owner_id,'30000000-0000-4000-8000-000000000004','abandon','{}');
 again:=public.patch_owned_assessment_progress(owner_id,'30000000-0000-4000-8000-000000000004','abandon','{}');
 ASSERT r=again AND r->>'status'='abandoned';
 PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_progress(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000004','progress','{}'),'P0001');
 PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_progress(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000004','progress',
   '{"adaptive_aptitude_session_id":"40000000-0000-4000-8000-000000000001"}'),'P0001');
 ASSERT NOT EXISTS(SELECT 1 FROM public.personal_assessment_attempts WHERE learner_id='20000000-0000-4000-8000-000000000002' AND all_responses<>'{}'::jsonb);
END; $$;
RESET ROLE;
