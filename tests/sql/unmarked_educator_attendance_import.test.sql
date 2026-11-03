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
DECLARE admin uuid='10000000-0000-0000-0000-000000000001'; college uuid='10000000-0000-0000-0000-000000000002'; trainer uuid='10000000-0000-0000-0000-000000000003'; staff uuid='70000000-0000-0000-0000-000000000001';
 mid uuid; first_id uuid; second_id uuid; payload jsonb; result jsonb; today date=(now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
 mid:=(public.external_educator_action(admin,'map',jsonb_build_object('staffId',staff,'collegeId','20000000-0000-0000-0000-000000000001','sectionId','50000000-0000-0000-0000-000000000001','courseIds',jsonb_build_array('60000000-0000-0000-0000-000000000001'),'startDate',today))->>'mappingId')::uuid;
 payload:=jsonb_build_object('mappingId',mid,'mappingVersion',1,'courseId','60000000-0000-0000-0000-000000000001','date',today,'startTime','09:00','endTime','10:00','requestId','90000000-0000-0000-0000-000000000011');
 first_id:=(public.external_educator_action(college,'create_session',payload)->>'id')::uuid;
 second_id:=(public.external_educator_action(college,'create_session',payload||'{"startTime":"10:00","endTime":"11:00","requestId":"90000000-0000-0000-0000-000000000012"}'::jsonb)->>'id')::uuid;
 result:=public.unmarked_educator_attendance_sessions(admin);
 IF jsonb_array_length(result)<>2 OR EXISTS(SELECT 1 FROM jsonb_array_elements(result) r WHERE r->>'status'<>'') THEN RAISE EXCEPTION 'Template must list both classes with blank statuses'; END IF;
 IF has_function_privilege('authenticated','public.import_unmarked_educator_attendance(uuid,uuid,uuid,integer,text,text)','EXECUTE') THEN RAISE EXCEPTION 'Browser RPC exposed'; END IF;
 BEGIN PERFORM public.unmarked_educator_attendance_sessions(trainer); RAISE EXCEPTION 'Trainer downloaded admin template'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 result:=public.import_unmarked_educator_attendance(admin,first_id,staff,1,'present',NULL);
 IF (result->>'skipped')::boolean THEN RAISE EXCEPTION 'First mark skipped'; END IF;
 result:=public.import_unmarked_educator_attendance(admin,first_id,staff,1,'absent',NULL);
 IF NOT (result->>'skipped')::boolean OR (SELECT status FROM public.organization_staff_attendence WHERE session_id=first_id)<>'present' THEN RAISE EXCEPTION 'Overwrite allowed'; END IF;
 IF jsonb_array_length(public.unmarked_educator_attendance_sessions(admin))<>1 THEN RAISE EXCEPTION 'Marked class still in template'; END IF;
 result:=public.import_unmarked_educator_attendance(admin,second_id,staff,99,'absent',NULL);
 IF NOT (result->>'skipped')::boolean THEN RAISE EXCEPTION 'Stale version accepted'; END IF;
 UPDATE public.college_attendance_sessions SET organization_staff_id='70000000-0000-0000-0000-000000000002' WHERE id=second_id;
 result:=public.import_unmarked_educator_attendance(admin,second_id,staff,1,'absent',NULL);
 IF NOT (result->>'skipped')::boolean THEN RAISE EXCEPTION 'Changed educator accepted'; END IF;
 UPDATE public.college_attendance_sessions SET date=today+1 WHERE id=second_id;
 IF jsonb_array_length(public.unmarked_educator_attendance_sessions(admin))<>0 THEN RAISE EXCEPTION 'Future class listed'; END IF;
 UPDATE public.college_attendance_sessions SET date=today,status='cancelled' WHERE id=second_id;
 IF jsonb_array_length(public.unmarked_educator_attendance_sessions(admin))<>0 THEN RAISE EXCEPTION 'Cancelled class listed'; END IF;
 payload:=payload||'{"startTime":"11:00","endTime":"12:00","requestId":"90000000-0000-0000-0000-000000000013"}'::jsonb;
 first_id:=(public.external_educator_action(college,'create_session',payload)->>'id')::uuid;
 result:=public.import_unmarked_educator_attendance(admin,first_id,staff,1,'late',NULL);
 IF (result->>'skipped')::boolean OR (SELECT status FROM public.organization_staff_attendence WHERE session_id=first_id)<>'late' THEN RAISE EXCEPTION 'Late import failed'; END IF;
 payload:=payload||'{"startTime":"12:00","endTime":"13:00","requestId":"90000000-0000-0000-0000-000000000014"}'::jsonb;
 first_id:=(public.external_educator_action(college,'create_session',payload)->>'id')::uuid;
 result:=public.import_unmarked_educator_attendance(admin,first_id,staff,1,'excused',NULL);
 IF (result->>'skipped')::boolean OR NOT EXISTS(SELECT 1 FROM public.organization_staff_attendence WHERE session_id=first_id AND status='excused' AND remarks IS NULL) THEN RAISE EXCEPTION 'Excused with optional remarks failed'; END IF;
 RAISE NOTICE 'PASS: unmarked templates, multi-class dates, blank status, no overwrite, permissions, revisions and assignment checks';
END $$;
ROLLBACK;
