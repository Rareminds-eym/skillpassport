-- Local integration verification. All fixtures and deliveries roll back.
BEGIN;
DO $$
DECLARE educator uuid; org uuid; learner uuid; other_learner uuid; outsider uuid; course uuid;
 conv uuid:=gen_random_uuid(); msg uuid:=gen_random_uuid(); grp uuid:=gen_random_uuid(); payload jsonb; denied boolean:=false;
BEGIN
 SELECT cl.user_id,cl."collegeId" INTO educator,org FROM college_lecturers cl
 WHERE cl."accountStatus"='active'
 AND EXISTS(SELECT 1 FROM program_sections ps WHERE ps.faculty_id=cl.user_id AND ps.status='active')
 AND EXISTS(SELECT 1 FROM organization_members m WHERE m.user_id=cl.user_id AND m.organization_id=cl."collegeId" AND m.status='active')
 AND (SELECT count(*) FROM ai_worksheet_eligible_learners(cl.user_id))>=2
 ORDER BY cl.user_id LIMIT 1;
 SELECT id INTO learner FROM ai_worksheet_eligible_learners(educator) LIMIT 1;
 IF educator IS NULL THEN RAISE EXCEPTION 'Requires a local educator and learner sharing active organization membership'; END IF;
 SELECT id INTO other_learner FROM ai_worksheet_eligible_learners(educator) WHERE id<>learner LIMIT 1;
 IF other_learner IS NULL THEN RAISE EXCEPTION 'Requires two local learners in the educator organization'; END IF;
 SELECT course_id INTO course FROM courses LIMIT 1;
 INSERT INTO tutor_conversations(id,learner_id,course_id,messages) VALUES(conv,educator,course,
 jsonb_build_array(jsonb_build_object('id',msg,'role','assistant','worksheetConfig',jsonb_build_object('questionCount',5),'worksheetVariants',jsonb_build_array(jsonb_build_object('difficulty','beginner','content','Generated material'),jsonb_build_object('difficulty','advanced','content','Advanced material')))));
 payload:=jsonb_build_array(jsonb_build_object('difficulty','beginner','studentContent','Reviewed questions','solutions','PRIVATE ANSWER','learnerIds',jsonb_build_array(learner)));
 payload:=payload || jsonb_build_array(jsonb_build_object('difficulty','advanced','studentContent','Advanced questions','solutions','PRIVATE ADVANCED ANSWER','learnerIds',jsonb_build_array(other_learner)));
 PERFORM publish_ai_worksheets(educator,org,conv,msg,grp,'Test worksheet','Instructions',NULL,payload);
 PERFORM publish_ai_worksheets(educator,org,conv,msg,grp,'Test worksheet','Instructions',NULL,payload);
 IF (SELECT count(*) FROM ai_worksheet_sets WHERE generation_group_id=grp)<>2 THEN RAISE EXCEPTION 'Retry duplicated worksheet'; END IF;
 IF (SELECT count(*) FROM ai_worksheet_recipients r JOIN ai_worksheet_sets s ON s.id=r.worksheet_id WHERE s.generation_group_id=grp)<>2 THEN RAISE EXCEPTION 'Retry duplicated delivery'; END IF;
 IF NOT EXISTS(SELECT 1 FROM ai_worksheet_recipients r JOIN ai_worksheet_sets s ON s.id=r.worksheet_id WHERE s.generation_group_id=grp AND r.learner_id=other_learner AND s.difficulty='advanced' AND s.student_content='Advanced questions') THEN RAISE EXCEPTION 'Wrong difficulty delivered'; END IF;
 BEGIN
  PERFORM publish_ai_worksheets(educator,org,conv,msg,grp,'Changed title','Instructions',NULL,payload);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%Publication conflict%' THEN RAISE; END IF;
  denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Changed retry payload was accepted'; END IF;
 denied:=false;
 IF EXISTS(SELECT 1 FROM ai_worksheet_sets WHERE generation_group_id=grp AND student_content LIKE '%PRIVATE ANSWER%') THEN RAISE EXCEPTION 'Private solution leaked'; END IF;
 SELECT l.id INTO outsider FROM learners l WHERE NOT EXISTS(SELECT 1 FROM organization_members m WHERE m.user_id=l.user_id AND m.organization_id=org AND m.status='active') LIMIT 1;
 IF outsider IS NULL THEN RAISE EXCEPTION 'Requires an out-of-organization learner'; END IF;
 grp:=gen_random_uuid();
 payload:=jsonb_build_array(jsonb_build_object('difficulty','beginner','studentContent','Questions','learnerIds',jsonb_build_array(learner,outsider)));
 BEGIN
  PERFORM publish_ai_worksheets(educator,org,conv,msg,grp,'Denied worksheet','',NULL,payload);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%not in an educator mapped%' THEN RAISE; END IF;
  denied:=true;
 END;
 IF NOT denied OR EXISTS(SELECT 1 FROM ai_worksheet_sets WHERE generation_group_id=grp) THEN RAISE EXCEPTION 'Cross-organization publication was not atomic'; END IF;
 IF has_table_privilege('authenticated','ai_worksheet_solutions','SELECT') THEN RAISE EXCEPTION 'Browser can read answer keys'; END IF;
 DELETE FROM tutor_conversations WHERE id=conv;
 IF (SELECT count(*) FROM ai_worksheet_sets WHERE source_message_id=msg AND source_conversation_id IS NULL)<>2 THEN RAISE EXCEPTION 'Deleting chat removed published content'; END IF;
 RAISE NOTICE 'PASS: atomic publication, retry idempotency, solution isolation and cross-organization rejection';
END $$;
ROLLBACK;
