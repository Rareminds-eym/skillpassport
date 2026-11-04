INSERT INTO public.learners(id,user_id) SELECT
 ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(3,7) n;
DO $$ BEGIN
 ASSERT NOT has_function_privilege('anon','public.start_owned_assessment(uuid,text,text,uuid,jsonb,boolean)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.start_owned_assessment(uuid,text,text,uuid,jsonb,boolean)','EXECUTE');
 ASSERT has_function_privilege('service_role','public.start_owned_assessment(uuid,text,text,uuid,jsonb,boolean)','EXECUTE');
END; $$;
SET ROLE service_role;
DO $$
DECLARE owner_id uuid:='10000000-0000-4000-8000-000000000003'; r jsonb; again jsonb; aid uuid;
BEGIN
 ASSERT public.start_owned_assessment('10000000-0000-4000-8000-000000000099',NULL,'college') IS NULL;
 PERFORM pg_temp.expect_failure(format('SELECT public.start_owned_assessment(%L,%L,%L,%L)',owner_id,'bca','college',
   '20000000-0000-4000-8000-000000000002'),'42501');
 PERFORM pg_temp.expect_failure(format('SELECT public.start_owned_assessment(%L,%L,%L)',owner_id,'inactive','college'),'22023');
 PERFORM pg_temp.expect_failure(format('SELECT public.start_owned_assessment(%L,%L,%L)',owner_id,'missing','college'),'22023');
 PERFORM pg_temp.expect_failure(format('SELECT public.start_owned_assessment(%L,%L,%L)',owner_id,NULL,'bad'),'22023');
 r:=public.start_owned_assessment(owner_id,'bca','college','20000000-0000-4000-8000-000000000003','{"programName":"BCA"}',true);
 ASSERT r->>'created'='true' AND r#>>'{attempt,learner_id}'='20000000-0000-4000-8000-000000000003';
 ASSERT r#>>'{attempt,grade_level}'='after12' AND r#>>'{attempt,stream_id}'='bca';
 aid:=(r#>>'{attempt,id}')::uuid;
 PERFORM public.patch_owned_assessment_progress(owner_id,aid,'progress','{"all_responses":{"q":1},"timer_remaining":45}');
 again:=public.start_owned_assessment(owner_id,'bca','college',owner_id,NULL,true);
 ASSERT again->>'created'='false' AND again#>>'{attempt,id}'=aid::text;
 ASSERT again#>'{attempt,all_responses}'='{"q":1}' AND again#>>'{attempt,timer_remaining}'='45';
 ASSERT again#>>'{attempt,learner_context,programName}'='BCA';
 PERFORM pg_temp.expect_failure(format('SELECT public.start_owned_assessment(%L,%L,%L,NULL,NULL,false)',owner_id,'bca','college'),'P0001');
 PERFORM pg_temp.expect_failure(format('SELECT public.start_owned_assessment(%L,%L,%L)',owner_id,NULL,'college'),'P0001');
 r:=public.start_owned_assessment('10000000-0000-4000-8000-000000000004',NULL,'college');
 ASSERT r#>'{attempt,stream_id}'='null'::jsonb;
 INSERT INTO public.personal_assessment_attempts(learner_id,grade_level,status)
 VALUES('20000000-0000-4000-8000-000000000003','college','in_progress');
 PERFORM pg_temp.expect_failure(format('SELECT public.start_owned_assessment(%L,%L,%L)',owner_id,'bca','college'),'P0001');
 INSERT INTO public.personal_assessment_attempts(learner_id,grade_level,status)
 VALUES('20000000-0000-4000-8000-000000000007','college','abandoned');
 r:=public.start_owned_assessment('10000000-0000-4000-8000-000000000007',NULL,'college');
 ASSERT r->>'created'='true';
 ASSERT (SELECT count(*) FROM public.personal_assessment_attempts WHERE learner_id='20000000-0000-4000-8000-000000000007' AND status='abandoned')=1;
END; $$;
RESET ROLE;
