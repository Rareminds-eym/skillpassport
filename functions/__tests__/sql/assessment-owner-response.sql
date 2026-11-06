DO $$ BEGIN
 ASSERT NOT has_function_privilege('anon','public.save_owned_assessment_response(uuid,uuid,uuid,jsonb)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.save_owned_assessment_response(uuid,uuid,uuid,jsonb)','EXECUTE');
 ASSERT has_function_privilege('service_role','public.save_owned_assessment_response(uuid,uuid,uuid,jsonb)','EXECUTE');
END; $$;
SET ROLE service_role;
DO $$
DECLARE owner_id uuid:='10000000-0000-4000-8000-000000000001';
 v_attempt uuid:='30000000-0000-4000-8000-000000000001';
 v_question uuid:='50000000-0000-4000-8000-000000000001'; r jsonb; first_id text; value jsonb;
BEGIN
 ASSERT public.save_owned_assessment_response(owner_id,'30000000-0000-4000-8000-000000000002',v_question,'1') IS NULL;
 ASSERT public.save_owned_assessment_response(owner_id,'30000000-0000-4000-8000-000000000099',v_question,'1') IS NULL;
 ASSERT public.save_owned_assessment_response('20000000-0000-4000-8000-000000000001',v_attempt,v_question,'1') IS NULL;
 r:=public.save_owned_assessment_response(owner_id,v_attempt,v_question,'0'); first_id:=r->>'id';
 ASSERT r->'response_value'='0'::jsonb AND r->'is_correct'='null'::jsonb;
 UPDATE public.personal_assessment_responses SET is_correct=true WHERE id=first_id::uuid;
 FOREACH value IN ARRAY ARRAY['false'::jsonb,'""'::jsonb,'[]'::jsonb,'{"selected":"A"}'::jsonb] LOOP
   r:=public.save_owned_assessment_response(owner_id,v_attempt,v_question,value);
   ASSERT r->>'id'=first_id AND r->'response_value'=value AND r->'is_correct'='null'::jsonb;
 END LOOP;
 PERFORM pg_temp.expect_failure(format('SELECT public.save_owned_assessment_response(%L,%L,%L,%L)',owner_id,v_attempt,v_question,'null'),'22023');
 PERFORM pg_temp.expect_failure(format('SELECT public.save_owned_assessment_response(%L,%L,%L,%L)',owner_id,v_attempt,v_question,to_jsonb(repeat('a',262145))),'22023');
 PERFORM pg_temp.expect_failure(format('SELECT public.save_owned_assessment_response(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000003',v_question,'1'),'P0001');
 PERFORM pg_temp.expect_failure(format('SELECT public.save_owned_assessment_response(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000004',v_question,'1'),'P0001');
 ASSERT (SELECT count(*) FROM public.personal_assessment_responses saved WHERE saved.attempt_id=v_attempt AND saved.question_id=v_question)=1;
END; $$;
RESET ROLE;
