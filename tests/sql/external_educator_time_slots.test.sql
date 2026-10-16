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
INSERT INTO public.program_sections(id,department_id,program_id,semester,section,academic_year,status)
VALUES('50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',4,'B','2026-27','active');
DO $$
DECLARE admin uuid='10000000-0000-0000-0000-000000000001'; college uuid='10000000-0000-0000-0000-000000000002';
 payload jsonb; other_payload jsonb; mid uuid; sid uuid; result jsonb; today date=(now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
 payload:=jsonb_build_object('staffId','70000000-0000-0000-0000-000000000001','collegeId','20000000-0000-0000-0000-000000000001','sectionId','50000000-0000-0000-0000-000000000001',
 'courseIds',jsonb_build_array('60000000-0000-0000-0000-000000000001'),'startDate',today,'time_slots','[{"start_time":"09:00","end_time":"10:00"}]'::jsonb);
 mid:=(public.external_educator_action(admin,'map',payload)->>'mappingId')::uuid;
 IF (SELECT count(*) FROM public.assignment_time_slots WHERE assignment_id=mid)<>1 THEN RAISE EXCEPTION 'Time-slot write-through lost'; END IF;
 BEGIN PERFORM public.external_educator_action(admin,'map',payload); RAISE EXCEPTION 'Duplicate mapping accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 other_payload:=payload||'{"sectionId":"50000000-0000-0000-0000-000000000002","time_slots":[{"start_time":"09:30","end_time":"10:30"}]}'::jsonb;
 BEGIN PERFORM public.external_educator_action(admin,'map',other_payload); RAISE EXCEPTION 'Overlapping allocation accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 IF (SELECT count(*) FROM public.organization_staff_assignments WHERE section_id='50000000-0000-0000-0000-000000000002')<>0 THEN RAISE EXCEPTION 'Rejected allocation leaked mapping'; END IF;
 PERFORM public.external_educator_action(admin,'map',other_payload||'{"time_slots":[{"start_time":"10:00","end_time":"11:00"}]}'::jsonb);
 payload:=jsonb_build_object('mappingId',mid,'mappingVersion',1,'courseId','60000000-0000-0000-0000-000000000001','date',today,'startTime','12:00','endTime','13:00','requestId','90000000-0000-0000-0000-000000000031');
 BEGIN PERFORM public.external_educator_action(college,'create_session',payload); RAISE EXCEPTION 'Out-of-slot session accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END;
 sid:=(public.external_educator_action(college,'create_session',payload||'{"startTime":"09:00","endTime":"10:00"}'::jsonb)->>'id')::uuid;
 PERFORM public.external_educator_action(admin,'mark_staff',jsonb_build_object('sessionId',sid,'version',1,'status','absent','reason','Trainer unavailable'));
 IF NOT EXISTS(SELECT 1 FROM public.organization_staff_attendence WHERE session_id=sid AND status='absent') THEN RAISE EXCEPTION 'Scheduling restored old attendance storage'; END IF;
 result:=public.external_educator_action(admin,'admin_overview','{}');
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result->'sessions') r WHERE r->>'id'=sid::text AND r->>'staff_attendance_status'='absent') THEN RAISE EXCEPTION 'Attendance response missing'; END IF;
 RAISE NOTICE 'PASS: slot persistence, duplicate mapping, overlap rejection, boundary adjacency, session coverage and separate attendance';
END $$;
ROLLBACK;
