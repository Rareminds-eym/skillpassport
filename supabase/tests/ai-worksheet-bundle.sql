-- Rollback-only integration checks for one assignment with all generated levels.
BEGIN;
DO $$
DECLARE educator uuid; course uuid; conv uuid:=gen_random_uuid(); msg uuid:=gen_random_uuid(); grp uuid:=gen_random_uuid();
 payload jsonb; result jsonb; expected integer; denied boolean:=false;
BEGIN
 SELECT cl.user_id INTO educator FROM college_lecturers cl
 WHERE cl."accountStatus"='active' AND EXISTS(SELECT 1 FROM program_sections ps WHERE ps.faculty_id=cl.user_id AND ps.status='active')
 AND EXISTS(SELECT 1 FROM organization_members m WHERE m.user_id=cl.user_id AND m.organization_id=cl."collegeId" AND m.status='active')
 AND (SELECT count(*) FROM ai_worksheet_eligible_learners(cl.user_id))>0 ORDER BY cl.user_id LIMIT 1;
 IF educator IS NULL THEN RAISE EXCEPTION 'Mapped educator fixture required'; END IF;
 SELECT count(*) INTO expected FROM ai_worksheet_eligible_learners(educator);
 IF ai_worksheet_context(educator)->>'gradeLevel'<>'College/University' THEN RAISE EXCEPTION 'Incorrect college grade'; END IF;
 SELECT course_id INTO course FROM courses LIMIT 1;
 payload:=jsonb_build_array(
  jsonb_build_object('difficulty','beginner','studentContent','Beginner questions','solutions','PRIVATE BEGINNER'),
  jsonb_build_object('difficulty','intermediate','studentContent','Intermediate questions','solutions','PRIVATE INTERMEDIATE'),
  jsonb_build_object('difficulty','advanced','studentContent','Advanced questions','solutions','PRIVATE ADVANCED'));
 INSERT INTO tutor_conversations(id,learner_id,course_id,messages) VALUES(conv,educator,course,
  jsonb_build_array(jsonb_build_object('id',msg,'role','assistant','worksheetConfig',jsonb_build_object('questionCount',10),
  'worksheetVariants',jsonb_build_array(jsonb_build_object('difficulty','beginner'),jsonb_build_object('difficulty','intermediate'),jsonb_build_object('difficulty','advanced')))));
 result:=publish_ai_worksheet_bundle(educator,conv,msg,grp,'Combined worksheet','',NULL,payload);
 PERFORM publish_ai_worksheet_bundle(educator,conv,msg,grp,'Combined worksheet','',NULL,payload);
 IF (result->>'learnerCount')::integer<>expected THEN RAISE EXCEPTION 'Incorrect audience count'; END IF;
 IF (SELECT count(*) FROM ai_worksheet_sets WHERE generation_group_id=grp)<>1 THEN RAISE EXCEPTION 'Not a single assignment'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ai_worksheet_sets WHERE generation_group_id=grp AND difficulty='mixed'
  AND generation_config->>'totalQuestionCount'='30' AND student_content LIKE '%Beginner questions%'
  AND student_content LIKE '%Intermediate questions%' AND student_content LIKE '%Advanced questions%' AND student_content NOT LIKE '%PRIVATE%') THEN RAISE EXCEPTION 'Combined content/config is incorrect'; END IF;
 IF (SELECT count(*) FROM ai_worksheet_recipients r JOIN ai_worksheet_sets s ON s.id=r.worksheet_id WHERE s.generation_group_id=grp)<>expected THEN RAISE EXCEPTION 'Recipient count incorrect or retry duplicated delivery'; END IF;
 IF EXISTS(SELECT 1 FROM ai_worksheet_recipients r JOIN ai_worksheet_sets s ON s.id=r.worksheet_id WHERE s.generation_group_id=grp AND NOT EXISTS(SELECT 1 FROM ai_worksheet_eligible_learners(educator) e WHERE e.id=r.learner_id)) THEN RAISE EXCEPTION 'Unmapped recipient'; END IF;
 BEGIN
  PERFORM publish_ai_worksheet_bundle(educator,conv,msg,grp,'Changed title','',NULL,payload);
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%Publication conflict%' THEN RAISE; END IF; denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Changed retry accepted'; END IF;
 denied:=false;
 BEGIN
  PERFORM publish_ai_worksheet_bundle(educator,conv,msg,gen_random_uuid(),'Partial levels','',NULL,jsonb_build_array(payload->0));
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%All generated levels required%' THEN RAISE; END IF; denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Missing difficulty accepted'; END IF;
 IF has_function_privilege('authenticated','public.publish_ai_worksheet_bundle(uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Browser can publish directly'; END IF;
 RAISE NOTICE 'PASS: one mixed assignment, all mapped recipients, private solutions, grade context, idempotency and incomplete-level rejection';
END $$;
ROLLBACK;
