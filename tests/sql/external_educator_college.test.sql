\set ON_ERROR_STOP on
-- Run only after the isolated fixture and new migration.
BEGIN;
INSERT INTO public.users(id,email,"organizationId",role) VALUES
 ('10000000-0000-0000-0000-000000000001','admin@test.invalid','00000000-0000-0000-0000-000000000001','admin'),
 ('10000000-0000-0000-0000-000000000002','college@test.invalid','20000000-0000-0000-0000-000000000001','college_admin'),
 ('10000000-0000-0000-0000-000000000003','hari@test.invalid','00000000-0000-0000-0000-000000000001','educator'),
 ('10000000-0000-0000-0000-000000000004','cover@test.invalid','00000000-0000-0000-0000-000000000001','educator'),
 ('10000000-0000-0000-0000-000000000005','student@test.invalid','20000000-0000-0000-0000-000000000001','learner');
INSERT INTO public.organizations VALUES('20000000-0000-0000-0000-000000000001','Soundarya','college','10000000-0000-0000-0000-000000000002');
INSERT INTO public.departments VALUES('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Business');
INSERT INTO public.programs VALUES('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','MBA','MBA',ARRAY['Analytics']);
INSERT INTO public.program_sections VALUES('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',4,'A','2026-27','active');
INSERT INTO public.courses VALUES('60000000-0000-0000-0000-000000000001','Analytics','ANA','Course','2 days','Active',NULL);
INSERT INTO public.organization_staff(id,user_id,organization_id,role,account_status,first_name,last_name,metadata) VALUES
 ('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','educator','active','Hari','PN','{}'),
 ('70000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','educator','active','Cover','Trainer','{}');
INSERT INTO public.learners VALUES('80000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000005','Student','1','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',4,'A','Analytics',false);
DO $$
DECLARE admin uuid='10000000-0000-0000-0000-000000000001'; college uuid='10000000-0000-0000-0000-000000000002';
 trainer uuid='10000000-0000-0000-0000-000000000003'; cover uuid='10000000-0000-0000-0000-000000000004'; student uuid='10000000-0000-0000-0000-000000000005';
 map1 uuid; map2 uuid; ses uuid; result jsonb; payload jsonb; today date=(now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
 IF has_function_privilege('authenticated','public.external_educator_action(uuid,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Browser can call service RPC'; END IF;
 payload:=jsonb_build_object('staffId','70000000-0000-0000-0000-000000000001','collegeId','20000000-0000-0000-0000-000000000001','sectionId','50000000-0000-0000-0000-000000000001',
  'courseIds',jsonb_build_array('60000000-0000-0000-0000-000000000001'),'specializations',jsonb_build_array('Analytics'),'startDate',today::text);
 BEGIN PERFORM public.external_educator_action(trainer,'map',payload); RAISE EXCEPTION 'Trainer self-assigned'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 map1:=(public.external_educator_action(admin,'map',payload)->>'mappingId')::uuid;
 map2:=(public.external_educator_action(admin,'map',payload||'{"staffId":"70000000-0000-0000-0000-000000000002"}'::jsonb)->>'mappingId')::uuid;
 result:=public.external_educator_action(college,'mapped_courses',jsonb_build_object('collegeId','20000000-0000-0000-0000-000000000001','sectionId','50000000-0000-0000-0000-000000000001','date',today));
 IF jsonb_array_length(result)<>2 THEN RAISE EXCEPTION 'Mapped candidates missing'; END IF;
 payload:=jsonb_build_object('mappingId',map1,'mappingVersion',1,'courseId','60000000-0000-0000-0000-000000000001','date',today,'startTime','09:00','endTime','10:00','requestId','90000000-0000-0000-0000-000000000001');
 result:=public.external_educator_action(college,'create_session',payload); ses:=(result->>'id')::uuid;
 IF result->>'created_by'<>college::text OR result->>'faculty_id' IS NOT NULL THEN RAISE EXCEPTION 'Wrong identity domains'; END IF;
 IF (result->>'total_learners')::integer<>1 THEN RAISE EXCEPTION 'Roster missing'; END IF;
 IF (public.external_educator_action(college,'create_session',payload)->>'id')::uuid<>ses THEN RAISE EXCEPTION 'Retry duplicated session'; END IF;
 BEGIN PERFORM public.external_educator_action(college,'create_session',payload||'{"requestId":"90000000-0000-0000-0000-000000000002"}'::jsonb); RAISE EXCEPTION 'Conflict accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 PERFORM public.external_educator_action(admin,'mark_staff',jsonb_build_object('sessionId',ses,'version',1,'status','absent','reason','Sick'));
 PERFORM public.external_educator_action(admin,'replace',jsonb_build_object('sessionId',ses,'version',2,'mappingId',map2,'reason','Cover'));
 BEGIN PERFORM public.external_educator_action(trainer,'session_roster',jsonb_build_object('sessionId',ses)); RAISE EXCEPTION 'Original can read covered roster'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 result:=public.external_educator_action(cover,'session_roster',jsonb_build_object('sessionId',ses));
 IF result->'session'->'instructor_changes'->0->>'staffAttendance'<>'absent' THEN RAISE EXCEPTION 'Absence lost'; END IF;
 PERFORM public.external_educator_action(cover,'mark_learners',jsonb_build_object('sessionId',ses,'version',3,'attendanceRevision',0,'records',jsonb_build_array(jsonb_build_object('learnerId','80000000-0000-0000-0000-000000000001','status','present'))));
 RAISE NOTICE 'PASS: mappings, faculty identity, session idempotency/conflict, absence cover, learner attendance';
END $$;
ROLLBACK;
