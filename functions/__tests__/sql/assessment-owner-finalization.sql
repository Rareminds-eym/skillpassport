INSERT INTO public.personal_assessment_attempts(id,learner_id,grade_level,status,stream_id)
 SELECT ('30000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'20000000-0000-4000-8000-000000000001',
 'college','in_progress',CASE WHEN n=7 THEN NULL ELSE 'bca' END FROM generate_series(7,15) n;
INSERT INTO public.adaptive_aptitude_results VALUES('40000000-0000-4000-8000-000000000003',
 '20000000-0000-4000-8000-000000000001',80,'{"logical_reasoning":{"correct":4,"total":5},"numerical_reasoning":{"correct":4,"total":5}}');
UPDATE public.personal_assessment_attempts SET adaptive_aptitude_session_id='40000000-0000-4000-8000-000000000003'
 WHERE id='30000000-0000-4000-8000-000000000011';
UPDATE public.personal_assessment_attempts SET adaptive_aptitude_session_id='40000000-0000-4000-8000-000000000004'
 WHERE id='30000000-0000-4000-8000-000000000013';
CREATE FUNCTION public.fixture_fail_completion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.id='30000000-0000-4000-8000-000000000009' AND NEW.status='completed' THEN
   RAISE EXCEPTION USING ERRCODE='XX000',MESSAGE='Injected parent update failure';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER fixture_fail_completion AFTER UPDATE ON public.personal_assessment_attempts
 FOR EACH ROW EXECUTE FUNCTION public.fixture_fail_completion();
DO $$ BEGIN
 ASSERT NOT has_function_privilege('anon','public.finalize_owned_assessment(uuid,uuid,text,jsonb)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.finalize_owned_assessment(uuid,uuid,text,jsonb)','EXECUTE');
 ASSERT has_function_privilege('service_role','public.finalize_owned_assessment(uuid,uuid,text,jsonb)','EXECUTE');
END; $$;
SET ROLE service_role;
DO $$
DECLARE owner_id uuid:='10000000-0000-4000-8000-000000000001';
 a uuid:='30000000-0000-4000-8000-000000000007'; r jsonb; first jsonb; saved_time timestamptz;
 report jsonb:='{"geminiResults":{"overallSummary":"owner report","learningPreferences":{"q":1},"strengthScores":[1]},"sectionTimings":{"riasec":20}}';
BEGIN
 ASSERT public.finalize_owned_assessment(owner_id,'30000000-0000-4000-8000-000000000002','results',report) IS NULL;
 ASSERT public.finalize_owned_assessment(owner_id,'30000000-0000-4000-8000-000000000099','submit','{}') IS NULL;
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,a,'submit','{"answers":[]}'),'22023');
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,a,'submit','{"status":"completed"}'),'22023');
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,a,'results','{"geminiResults":{}}'),'22023');
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,a,'results',
   report||'{"learnerId":"20000000-0000-4000-8000-000000000002"}'),'42501');
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,a,'results',
   report||'{"streamId":"bca"}'),'42501');
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,a,'results',
   report||'{"gradeLevel":"middle"}'),'42501');
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000004','submit','{}'),'P0001');
 first:=public.finalize_owned_assessment(owner_id,a,'submit','{"answers":{"q":1}}');
 SELECT completed_at INTO saved_time FROM public.personal_assessment_attempts WHERE id=a;
 ASSERT public.finalize_owned_assessment(owner_id,a,'submit','{"answers":{"q":1}}')=first;
 ASSERT public.finalize_owned_assessment(owner_id,a,'submit','{}')=first;
 ASSERT (SELECT completed_at=saved_time FROM public.personal_assessment_attempts WHERE id=a);
 ASSERT EXISTS(SELECT 1 FROM public.personal_assessment_results WHERE attempt_id=a AND stream_id IS NULL);
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,a,'submit','{"answers":{"q":2}}'),'P0001');
 PERFORM pg_temp.expect_failure(format('SELECT public.save_owned_assessment_response(%L,%L,%L,%L)',owner_id,a,'50000000-0000-4000-8000-000000000001','2'),'P0001');
 a:='30000000-0000-4000-8000-000000000008';
 first:=public.finalize_owned_assessment(owner_id,a,'results',report);
 ASSERT EXISTS(SELECT 1 FROM public.personal_assessment_results WHERE attempt_id=a AND learner_id='20000000-0000-4000-8000-000000000001'
   AND stream_id='bca' AND learning_preferences='{"q":1}' AND strength_scores='[1]');
 ASSERT public.finalize_owned_assessment(owner_id,a,'results',report)=first;
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,a,'results','{"geminiResults":{"changed":true}}'),'P0001');
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000009','results',report),'XX000');
 ASSERT NOT EXISTS(SELECT 1 FROM public.personal_assessment_results WHERE attempt_id='30000000-0000-4000-8000-000000000009');
 ASSERT EXISTS(SELECT 1 FROM public.personal_assessment_attempts WHERE id='30000000-0000-4000-8000-000000000009' AND status='in_progress' AND completed_at IS NULL);
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000009','submit','{}'),'XX000');
 ASSERT NOT EXISTS(SELECT 1 FROM public.personal_assessment_results WHERE attempt_id='30000000-0000-4000-8000-000000000009');
 a:='30000000-0000-4000-8000-000000000010';
 r:=public.finalize_owned_assessment(owner_id,a,'submit','{}');
 SELECT completed_at INTO saved_time FROM public.personal_assessment_attempts WHERE id=a;
 first:=public.finalize_owned_assessment(owner_id,a,'results',report);
 ASSERT first=r AND (SELECT completed_at=saved_time FROM public.personal_assessment_attempts WHERE id=a);
 a:='30000000-0000-4000-8000-000000000011';
 r:=public.finalize_owned_assessment(owner_id,a,'results',report||'{"geminiResults":{"aptitude":{"overallScore":0}}}');
 ASSERT EXISTS(SELECT 1 FROM public.personal_assessment_results WHERE attempt_id=a AND aptitude_overall=80
   AND aptitude_scores#>>'{abstract,correct}'='4' AND aptitude_scores#>>'{numerical,total}'='5');
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000012','results',
   report||'{"adaptiveAptitudeSessionId":"40000000-0000-4000-8000-000000000004"}'),'42501');
 PERFORM pg_temp.expect_failure(format('SELECT public.finalize_owned_assessment(%L,%L,%L,%L)',owner_id,'30000000-0000-4000-8000-000000000013','results',report),'P0001');
 ASSERT NOT EXISTS(SELECT 1 FROM public.personal_assessment_results WHERE learner_id='20000000-0000-4000-8000-000000000002');
END; $$;
RESET ROLE;
