-- Rollback-only integration checks against the local mapping schema.
BEGIN;
DO $$
DECLARE educator uuid; org uuid; learner uuid; unmapped uuid; conv uuid:=gen_random_uuid();
 msg uuid:=gen_random_uuid(); grp uuid:=gen_random_uuid(); course uuid; denied boolean:=false; payload jsonb;
BEGIN
 -- Use an active educator with mapped learners and another learner in the same college.
 SELECT cl.user_id,cl."collegeId" INTO educator,org FROM college_lecturers cl
 WHERE cl."accountStatus"='active'
 AND (SELECT count(DISTINCT candidate.id) FROM (
  SELECT c."collegeId" id FROM college_lecturers c WHERE c.user_id=cl.user_id AND c."accountStatus"='active'
  UNION SELECT s.organization_id FROM organization_staff s WHERE s.user_id=cl.user_id AND s.account_status='active'
 ) candidate)=1
 AND EXISTS(SELECT 1 FROM program_sections ps WHERE ps.faculty_id=cl.user_id AND ps.status='active')
 AND EXISTS(SELECT 1 FROM organization_members m WHERE m.user_id=cl.user_id AND m.organization_id=cl."collegeId" AND m.status='active')
 ORDER BY cl.user_id LIMIT 1;
 IF educator IS NULL THEN RAISE EXCEPTION 'Requires a mapped active educator'; END IF;
 SELECT id INTO learner FROM ai_worksheet_eligible_learners(educator) LIMIT 1;
 IF learner IS NULL THEN RAISE EXCEPTION 'Requires a mapped learner'; END IF;
 SELECT l.id INTO unmapped FROM learners l WHERE l.college_id=org
 AND EXISTS(SELECT 1 FROM organization_members m WHERE m.user_id=l.user_id AND m.organization_id=org AND m.status='active')
 AND NOT EXISTS(SELECT 1 FROM ai_worksheet_eligible_learners(educator) eligible WHERE eligible.id=l.id) LIMIT 1;
 IF unmapped IS NULL THEN RAISE EXCEPTION 'Requires a same-college unmapped learner'; END IF;
 SELECT course_id INTO course FROM courses LIMIT 1;
 INSERT INTO tutor_conversations(id,learner_id,course_id,messages) VALUES(conv,educator,course,
 jsonb_build_array(jsonb_build_object('id',msg,'role','assistant','worksheetConfig',jsonb_build_object('questionCount',5),'worksheetVariants',jsonb_build_array(jsonb_build_object('difficulty','beginner','content','Generated material')))));
 payload:=jsonb_build_array(jsonb_build_object('difficulty','beginner','studentContent','Questions','solutions','Private','learnerIds',jsonb_build_array(learner)));
 PERFORM publish_ai_worksheets(educator,org,conv,msg,grp,'Mapped worksheet','',NULL,payload);
 IF NOT EXISTS(SELECT 1 FROM ai_worksheet_sets WHERE generation_group_id=grp) THEN RAISE EXCEPTION 'Valid publication failed'; END IF;
 grp:=gen_random_uuid();
 payload:=jsonb_build_array(jsonb_build_object('difficulty','beginner','studentContent','Questions','learnerIds',jsonb_build_array(learner,unmapped)));
 BEGIN
  PERFORM publish_ai_worksheets(educator,org,conv,msg,grp,'Blocked worksheet','',NULL,payload);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%not in an educator mapped%' THEN RAISE; END IF;
  denied:=true;
 END;
 IF NOT denied OR EXISTS(SELECT 1 FROM ai_worksheet_sets WHERE generation_group_id=grp) THEN RAISE EXCEPTION 'Unmapped learner publication was accepted'; END IF;
 IF has_function_privilege('service_role','public.publish_ai_worksheets_unscoped(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Unscoped publication is callable'; END IF;
 RAISE NOTICE 'PASS: mapped learner publication, same-college unmapped rejection, atomic rollback, no unscoped service access';
END $$;
ROLLBACK;
