\set ON_ERROR_STOP on
-- Self-contained: explicit-column inserts run against the real app schema.
-- Rolls back everything. Run after migrations with: psql -v ON_ERROR_STOP=1 -f this file.
BEGIN;
INSERT INTO public.organizations(id,name,organization_type) VALUES('00000000-0000-0000-0000-000000000001','Platform','platform') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.organizations(id,name,organization_type,admin_id) VALUES('20000000-0000-0000-0000-000000000001','Soundarya','college','10000000-0000-0000-0000-000000000002');
INSERT INTO public.users(id,email,"organizationId",role) VALUES
 ('10000000-0000-0000-0000-000000000001','admin@test.invalid','00000000-0000-0000-0000-000000000001','admin'),
 ('10000000-0000-0000-0000-000000000002','college@test.invalid','20000000-0000-0000-0000-000000000001','college_admin'),
 ('10000000-0000-0000-0000-000000000003','hari@test.invalid','00000000-0000-0000-0000-000000000001','educator'),
 ('10000000-0000-0000-0000-000000000004','cover@test.invalid','00000000-0000-0000-0000-000000000001','educator'),
 ('10000000-0000-0000-0000-000000000005','student@test.invalid','20000000-0000-0000-0000-000000000001','learner');
INSERT INTO public.departments(id,college_id,name,code) VALUES('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Business','BUS');
INSERT INTO public.programs(id,department_id,name,code,degree_level,specializations) VALUES('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','MBA','MBA','Postgraduate',ARRAY['Analytics']);
INSERT INTO public.program_sections(id,department_id,program_id,semester,section,academic_year,status) VALUES('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',4,'A','2026-27','active');
INSERT INTO public.courses(course_id,title,code,description,duration,status) VALUES('60000000-0000-0000-0000-000000000001','Analytics','ANA','Course','2 days','Active');
INSERT INTO public.organization_staff(id,user_id,organization_id,organization_type,role,account_status,first_name,last_name,metadata) VALUES
 ('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','rareminds','educator','active','Hari','PN','{}'),
 ('70000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','rareminds','educator','active','Cover','Trainer','{}');
INSERT INTO public.learners(id,user_id,name,roll_number,email,college_id,program_id,semester,section,specialization,is_deleted) VALUES('80000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000005','Student','1','student@test.invalid','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',4,'A','Analytics',false);
DO $$
DECLARE admin uuid='10000000-0000-0000-0000-000000000001'; college uuid='10000000-0000-0000-0000-000000000002';
 trainer uuid='10000000-0000-0000-0000-000000000003'; cover uuid='10000000-0000-0000-0000-000000000004'; student uuid='10000000-0000-0000-0000-000000000005';
 map1 uuid; map2 uuid; ses uuid; ses_a uuid; ses_b uuid; result jsonb; payload jsonb; today date=(now() AT TIME ZONE 'Asia/Kolkata')::date;
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
  -- Separate storage: the original mark wrote exactly one register row.
  IF (SELECT count(*) FROM public.organization_staff_attendence WHERE session_id=ses)<>1 THEN RAISE EXCEPTION 'Mark did not write separate row'; END IF;
  -- Replace RETAINS the previous holder's row (no wiping).
  IF (SELECT count(*) FROM public.organization_staff_attendence WHERE session_id=ses AND organization_staff_id='70000000-0000-0000-0000-000000000001')<>1 THEN RAISE EXCEPTION 'Previous holder attendance lost'; END IF;
  -- New holder marks: second row, holder-scoped reads see only theirs.
  PERFORM public.external_educator_action(admin,'mark_staff',jsonb_build_object('sessionId',ses,'version',4,'status','present','reason','Cover present'));
  IF (SELECT count(*) FROM public.organization_staff_attendence WHERE session_id=ses)<>2 THEN RAISE EXCEPTION 'Cover mark missing'; END IF;
  result:=public.external_educator_action(cover,'session_roster',jsonb_build_object('sessionId',ses));
  IF result->'session'->>'staff_attendance_status'<>'present' THEN RAISE EXCEPTION 'Holder-scoped roster mark missing'; END IF;
  -- Read contracts resolve the current trainer while keeping the original absence.
  result:=public.external_educator_action(admin,'admin_overview','{}');
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result->'sessions') x WHERE x->>'id'=ses::text AND x->>'staff_attendance_status'='present') THEN RAISE EXCEPTION 'Admin overview omitted separate attendance'; END IF;
  result:=public.external_educator_action(college,'college_sessions',jsonb_build_object('collegeId','20000000-0000-0000-0000-000000000001'));
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result) x WHERE x->>'id'=ses::text AND x->>'staff_attendance_status'='present') THEN RAISE EXCEPTION 'College sessions omitted separate attendance'; END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='college_attendance_sessions' AND column_name IN ('staff_attendance_status','staff_attendance_marked_by','staff_attendance_marked_at','staff_attendance_remarks')) THEN RAISE EXCEPTION 'Old storage columns remain'; END IF;
  -- Swaps retain each previous holder's row and expose only the new holder's mark.
  payload:=jsonb_build_object('mappingId',map1,'mappingVersion',1,'courseId','60000000-0000-0000-0000-000000000001','date',today,'startTime','11:00','endTime','12:00','requestId','90000000-0000-0000-0000-000000000021');
  ses_a:=(public.external_educator_action(college,'create_session',payload)->>'id')::uuid;
  ses_b:=(public.external_educator_action(college,'create_session',payload||jsonb_build_object('mappingId',map2,'startTime','13:00','endTime','14:00','requestId','90000000-0000-0000-0000-000000000022'))->>'id')::uuid;
  PERFORM public.external_educator_action(admin,'mark_staff',jsonb_build_object('sessionId',ses_a,'version',1,'status','absent','reason','Original absent'));
  PERFORM public.external_educator_action(admin,'mark_staff',jsonb_build_object('sessionId',ses_b,'version',1,'status','late','reason','Original late'));
  PERFORM public.external_educator_action(admin,'swap',jsonb_build_object('sessionId',ses_a,'version',2,'otherSessionId',ses_b,'otherVersion',2,'mappingId',map2,'otherMappingId',map1,'reason','Swap classes'));
  IF public.staff_attendance_json(ses_a,'70000000-0000-0000-0000-000000000001')->>'staff_attendance_status'<>'absent' THEN RAISE EXCEPTION 'Swap lost original attendance'; END IF;
  result:=public.external_educator_action(cover,'session_roster',jsonb_build_object('sessionId',ses_a));
  IF result->'session'->>'staff_attendance_status' IS NOT NULL THEN RAISE EXCEPTION 'Swap exposed previous holder attendance as current'; END IF;
  PERFORM public.external_educator_action(admin,'mark_staff',jsonb_build_object('sessionId',ses_a,'version',3,'status','present','reason','Cover arrived'));
  IF (SELECT count(*) FROM public.organization_staff_attendence WHERE session_id=ses_a)<>2 THEN RAISE EXCEPTION 'Swap replacement attendance not retained separately'; END IF;

  -- Reassignment uses a new holder and retains the old holder's historical mark.
  INSERT INTO public.users(id,email,"organizationId",role) VALUES('10000000-0000-0000-0000-000000000006','third@test.invalid','00000000-0000-0000-0000-000000000001','educator');
  INSERT INTO public.organization_staff(id,user_id,organization_id,organization_type,role,account_status,first_name,last_name,metadata) VALUES('70000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','rareminds','educator','active','Third','Trainer','{}');
  PERFORM public.external_educator_action(admin,'mark_staff',jsonb_build_object('sessionId',ses_b,'version',3,'status','excused','reason','Replacement unavailable'));
  PERFORM public.external_educator_action(admin,'reassign_mapping',jsonb_build_object('mappingId',map1,'version',1,'staffId','70000000-0000-0000-0000-000000000003','collegeId','20000000-0000-0000-0000-000000000001','sectionId','50000000-0000-0000-0000-000000000001','courseIds',jsonb_build_array('60000000-0000-0000-0000-000000000001'),'specializations',jsonb_build_array('Analytics'),'startDate',today,'reason','Third trainer takes assignment'));
  IF NOT EXISTS(SELECT 1 FROM public.organization_staff_attendence WHERE session_id=ses_b AND organization_staff_id='70000000-0000-0000-0000-000000000001' AND status='excused') THEN RAISE EXCEPTION 'Reassignment erased attendance'; END IF;
  result:=public.external_educator_action('10000000-0000-0000-0000-000000000006','session_roster',jsonb_build_object('sessionId',ses_b));
  IF result->'session'->>'staff_attendance_status' IS NOT NULL THEN RAISE EXCEPTION 'Reassigned holder inherited another trainer mark'; END IF;
  -- Browser roles cannot read the register directly (RLS, no policies).
  SET LOCAL ROLE authenticated;
  IF (SELECT count(*) FROM public.organization_staff_attendence)<>0 THEN RAISE EXCEPTION 'Browser can read attendance register'; END IF;
  RESET ROLE;
  -- History is protected: session delete is refused while attendance exists.
  BEGIN DELETE FROM public.college_attendance_sessions WHERE id=ses; RAISE EXCEPTION 'Session delete allowed despite history'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  RAISE NOTICE 'PASS: mappings, faculty identity, session idempotency/conflict, absence cover, learner attendance';
END $$;
ROLLBACK;
