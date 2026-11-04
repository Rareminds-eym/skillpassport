-- All identities, questions and answers are synthetic in a disposable DB.
INSERT INTO public.personal_assessment_sections(id,name,grade_level,is_stream_specific) VALUES('61000000-0000-4000-8000-000000000001','knowledge','after12',true);
INSERT INTO public.personal_assessment_questions(id,section_id,stream_id,correct_answer) VALUES
 ('62000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000001','bca','"A"'),
 ('62000000-0000-4000-8000-000000000002','61000000-0000-4000-8000-000000000001','bca','"B"');
INSERT INTO public.personal_assessment_attempts(id,learner_id,stream_id,grade_level,status,all_responses) VALUES
 ('63000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','bca','after12','in_progress','{}');
SET ROLE service_role;
DO $$
DECLARE result jsonb; repeated jsonb; receipt public.assessment_grading_receipts; generated jsonb;
 owner_id uuid:='10000000-0000-4000-8000-000000000001'; attempt_ref uuid:='63000000-0000-4000-8000-000000000001';
BEGIN
 ASSERT public.snapshot_owned_assessment_catalog(owner_id,attempt_ref,'61000000-0000-4000-8000-000000000001')->>'bound'='true';
 UPDATE public.personal_assessment_questions SET correct_answer='"A"' WHERE id='62000000-0000-4000-8000-000000000002';
 PERFORM public.patch_owned_assessment_progress(owner_id,attempt_ref,'progress',
  '{"all_responses":{"62000000-0000-4000-8000-000000000001":"A","62000000-0000-4000-8000-000000000002":{"answer":"A","correct_answer":"A","is_correct":true}}}');
 ASSERT public.patch_owned_assessment_context(owner_id,attempt_ref,'{"rawGrade":"After 12","selectedStream":"bca"}')->>'attemptId'=attempt_ref::text;
 ASSERT public.patch_owned_assessment_context(owner_id,attempt_ref,'{"rawGrade":"After 12","specialization":"Data Science"}')->>'attemptId'=attempt_ref::text;
 ASSERT (SELECT learner_context->>'specialization'='Data Science' FROM public.personal_assessment_attempts WHERE id=attempt_ref);
 PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_context(%L,%L,%L)',owner_id,attempt_ref,'{"rawGrade":"After12","specialization":100}'),'22023');
 ASSERT public.patch_owned_assessment_context('10000000-0000-4000-8000-000000000002',attempt_ref,'{"rawGrade":"Spoofed"}') IS NULL;
 PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_context(%L,%L,%L)',owner_id,attempt_ref,'{"rawGrade":"After12","aptitude_scores":100}'),'22023');
 result:=public.finalize_owned_assessment(owner_id,attempt_ref,'results','{"learnerId":"20000000-0000-4000-8000-000000000001","streamId":"bca","gradeLevel":"after12","geminiResults":{"knowledge":{"score":100},"aptitude":{"overallScore":100},"riasec":{"scores":{"R":100}}}}');
 SELECT * INTO STRICT receipt FROM public.assessment_grading_receipts WHERE id=(result#>>'{grading,receiptId}')::uuid;
 ASSERT receipt.objective_scores#>>'{knowledge,correct}'='1';
 ASSERT receipt.objective_scores#>>'{knowledge,total}'='2';
 ASSERT receipt.objective_scores#>>'{knowledge,percentage}'='50';
 ASSERT receipt.status='complete';
 ASSERT (SELECT grading_provenance->>'subjective'='advisory_unverified' AND grading_provenance->>'objective'='server_graded'
  FROM public.personal_assessment_results WHERE attempt_id=receipt.attempt_id);
 repeated:=public.grade_owned_assessment(owner_id,attempt_ref);
 ASSERT repeated->>'receiptId'=receipt.id::text;
 ASSERT public.grade_owned_assessment('10000000-0000-4000-8000-000000000002',attempt_ref) IS NULL;
 PERFORM pg_temp.expect_failure(format('SELECT public.patch_owned_assessment_context(%L,%L,%L)',owner_id,attempt_ref,'{"rawGrade":"Change completed"}'),'P0001');
 -- Server-generated new sets acquire provenance. Reusing an old set never does.
 generated:=public.get_or_create_shared_questions('bca','after12','aptitude','[{"id":"aptitude-q1","correctAnswer":"C"}]');
 ASSERT generated->>'is_new'='true';
 ASSERT (SELECT count(*)=1 FROM public.assessment_generated_question_authority);
 PERFORM public.get_or_create_shared_questions('bca','after12','aptitude','[{"id":"poison","correctAnswer":"X"}]');
 ASSERT (SELECT count(*)=1 FROM public.assessment_generated_question_authority);
 ASSERT NOT has_function_privilege('anon','public.get_or_create_shared_questions(text,text,text,jsonb,uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.grade_owned_assessment(uuid,uuid)','EXECUTE');
 ASSERT NOT has_table_privilege('service_role','public.assessment_grading_receipts','UPDATE');
 ASSERT NOT has_table_privilege('service_role','public.assessment_attempt_question_manifest','UPDATE');
 ASSERT NOT has_table_privilege('anon','public.career_assessment_ai_questions','INSERT');
 ASSERT NOT has_table_privilege('anon','public.personal_assessment_questions','SELECT');
END $$;
RESET ROLE;

INSERT INTO public.personal_assessment_attempts(id,learner_id,stream_id,grade_level,status,all_responses) VALUES
 ('63000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','bca','after12','in_progress','{}');
SET ROLE service_role;
DO $$ DECLARE result jsonb; owner_id uuid:='10000000-0000-4000-8000-000000000001'; target uuid:='63000000-0000-4000-8000-000000000003'; BEGIN
 ASSERT public.snapshot_generated_assessment_questions(owner_id,target,'bca','aptitude')->>'bound'='true';
 PERFORM public.patch_owned_assessment_progress(owner_id,target,'progress','{"all_responses":{"aptitude-q1":"C"}}');
 result:=public.finalize_owned_assessment(owner_id,target,'submit','{}');
 ASSERT result#>>'{grading,status}'='complete';
 ASSERT (SELECT objective_scores#>>'{aptitude,percentage}'='100' FROM public.assessment_grading_receipts WHERE id=(result#>>'{grading,receiptId}')::uuid);
END $$;
RESET ROLE;
DO $$
DECLARE receipt public.assessment_grading_receipts; owner_id uuid:='10000000-0000-4000-8000-000000000001'; attempt_ref uuid:='63000000-0000-4000-8000-000000000001';
BEGIN
 SELECT * INTO STRICT receipt FROM public.assessment_grading_receipts WHERE attempt_id=attempt_ref;
 -- A later catalog edit never rewrites a committed grading snapshot/receipt.
 UPDATE public.personal_assessment_questions SET correct_answer='"A"' WHERE id='62000000-0000-4000-8000-000000000002';
 ASSERT public.grade_owned_assessment(owner_id,attempt_ref)->>'receiptId'=receipt.id::text;
 ASSERT (SELECT objective_scores#>>'{knowledge,percentage}'='50' FROM public.assessment_grading_receipts WHERE id=receipt.id);
 -- Out-of-band answer drift cannot retain a valid receipt version.
 UPDATE public.personal_assessment_attempts SET all_responses=all_responses||'{"extra":"changed"}' WHERE id=attempt_ref;
 ASSERT (SELECT grading_receipt_id IS NULL FROM public.personal_assessment_results WHERE attempt_id=attempt_ref);
 PERFORM pg_temp.expect_failure(format('SELECT public.grade_owned_assessment(%L,%L)',owner_id,attempt_ref),'P0001');
END $$;

-- No retroactive certification from today's canonical IDs/keys.
INSERT INTO public.personal_assessment_attempts(id,learner_id,stream_id,grade_level,status,all_responses) VALUES
 ('63000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','bca','after12','in_progress',
  '{"62000000-0000-4000-8000-000000000001":"A","aptitude-q1":"C"}');
SET ROLE service_role;
DO $$ DECLARE result jsonb; owner_id uuid:='10000000-0000-4000-8000-000000000001'; target uuid:='63000000-0000-4000-8000-000000000002'; BEGIN
 -- Catalog/generated delivery after those answers cannot bind their keys.
 PERFORM public.snapshot_owned_assessment_catalog(owner_id,target,'61000000-0000-4000-8000-000000000001');
 PERFORM public.snapshot_generated_assessment_questions(owner_id,target,'bca','aptitude');
 ASSERT NOT EXISTS(SELECT 1 FROM public.assessment_attempt_question_manifest WHERE attempt_id=target AND answer_id IN('62000000-0000-4000-8000-000000000001','aptitude-q1'));
 result:=public.finalize_owned_assessment(owner_id,target,'submit','{}');
 ASSERT result#>>'{grading,status}'='unavailable';
 ASSERT (SELECT grading_provenance->>'objective'='unavailable' FROM public.personal_assessment_results WHERE attempt_id=target);
END $$;
RESET ROLE;
