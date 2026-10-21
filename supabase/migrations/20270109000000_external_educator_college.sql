-- College-only external educator integration. No new tables and no audit_logs.
-- Apply AFTER both organization_staff migrations. Existing applied files remain unchanged.
BEGIN;
ALTER TABLE public.organization_staff_assignments
  ADD COLUMN IF NOT EXISTS assignment_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS supersedes_assignment_id uuid REFERENCES public.organization_staff_assignments(id),
  ADD COLUMN IF NOT EXISTS ended_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS ended_reason text;
DROP INDEX IF EXISTS public.idx_organization_staff_assignments_unique_active;
CREATE UNIQUE INDEX idx_organization_staff_assignments_unique_active
  ON public.organization_staff_assignments(staff_id,college_id,department_id,program_id,section_id) WHERE is_active;

ALTER TABLE public.college_attendance_sessions
  ADD COLUMN IF NOT EXISTS instructor_source text NOT NULL DEFAULT 'legacy_college',
  ADD COLUMN IF NOT EXISTS lms_course_id uuid REFERENCES public.courses(course_id),
  ADD COLUMN IF NOT EXISTS staff_assignment_id uuid REFERENCES public.organization_staff_assignments(id),
  ADD COLUMN IF NOT EXISTS organization_staff_id uuid REFERENCES public.organization_staff(id),
  ADD COLUMN IF NOT EXISTS original_organization_staff_id uuid REFERENCES public.organization_staff(id),
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id),
  ADD COLUMN IF NOT EXISTS program_section_id uuid REFERENCES public.program_sections(id),
  ADD COLUMN IF NOT EXISTS assignment_version_at_creation integer,
  ADD COLUMN IF NOT EXISTS staff_attendance_status text CHECK(staff_attendance_status IN ('present','absent','late','excused')),
  ADD COLUMN IF NOT EXISTS staff_attendance_marked_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS staff_attendance_marked_at timestamptz,
  ADD COLUMN IF NOT EXISTS staff_attendance_remarks text,
  ADD COLUMN IF NOT EXISTS instructor_changes jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS reassigned_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS reassigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS replacement_reason text,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS attendance_revision integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS creation_request_id uuid;
ALTER TABLE public.college_attendance_sessions ADD CONSTRAINT external_instructor_identity CHECK (
  instructor_source='legacy_college' OR (instructor_source='platform_staff' AND faculty_id IS NULL
    AND organization_staff_id IS NOT NULL AND staff_assignment_id IS NOT NULL
    AND lms_course_id IS NOT NULL AND program_section_id IS NOT NULL));
CREATE UNIQUE INDEX external_session_creation_request ON public.college_attendance_sessions(created_by,creation_request_id)
  WHERE creation_request_id IS NOT NULL;
CREATE INDEX external_staff_session_dates ON public.college_attendance_sessions(organization_staff_id,date,start_time);

ALTER TABLE public.college_attendance_records
  ADD COLUMN IF NOT EXISTS marked_by_staff_id uuid REFERENCES public.organization_staff(id),
  ADD COLUMN IF NOT EXISTS organization_staff_id uuid REFERENCES public.organization_staff(id),
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS revision_history jsonb NOT NULL DEFAULT '[]',
  ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.college_attendance_records ADD CONSTRAINT external_unmarked_attendance CHECK
  (status IS NOT NULL OR organization_staff_id IS NOT NULL);
-- Duplicate legacy rows must be reconciled before applying these uniqueness constraints; never delete them here.
CREATE UNIQUE INDEX IF NOT EXISTS attendance_session_learner_unique ON public.college_attendance_records(session_id,learner_id);

ALTER TABLE public.college_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_attendance_records ENABLE ROW LEVEL SECURITY;
-- These two tables previously had no RLS: keep legacy access without widening it to training rows.
CREATE POLICY legacy_session_browser_access ON public.college_attendance_sessions TO anon,authenticated
 USING(instructor_source='legacy_college') WITH CHECK(instructor_source='legacy_college');
CREATE POLICY legacy_record_browser_access ON public.college_attendance_records TO anon,authenticated
 USING(organization_staff_id IS NULL) WITH CHECK(organization_staff_id IS NULL);
CREATE POLICY external_session_browser_boundary ON public.college_attendance_sessions AS RESTRICTIVE TO anon,authenticated
 USING(instructor_source='legacy_college') WITH CHECK(instructor_source='legacy_college');
CREATE POLICY external_record_browser_boundary ON public.college_attendance_records AS RESTRICTIVE TO anon,authenticated
 USING(organization_staff_id IS NULL) WITH CHECK(organization_staff_id IS NULL);

CREATE OR REPLACE FUNCTION public.check_teaching_attendance_source() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE parent_source text;
BEGIN
 IF NEW.session_id IS NULL THEN RETURN NEW; END IF;
 SELECT instructor_source INTO STRICT parent_source FROM public.college_attendance_sessions WHERE id=NEW.session_id;
 IF (parent_source='platform_staff')<>(NEW.organization_staff_id IS NOT NULL) THEN
   RAISE EXCEPTION 'Attendance source mismatch' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.check_teaching_attendance_source() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER check_external_attendance_source BEFORE INSERT OR UPDATE ON public.college_attendance_records
 FOR EACH ROW EXECUTE FUNCTION public.check_teaching_attendance_source();

-- Administrative grant is employer-funded delegated teaching access, limited to this portal.
-- It is NOT a subscription/product grant to unrelated educator features.
CREATE OR REPLACE FUNCTION public.external_teaching_platform_admin(p_actor uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.users u WHERE u.id=p_actor AND u."isActive"
   AND u."organizationId"='00000000-0000-0000-0000-000000000001'
   AND u.role::text IN ('admin','super_admin','rm_admin','rm_manager'))
 OR EXISTS(SELECT 1 FROM public.organization_staff s WHERE s.user_id=p_actor
   AND s.organization_id='00000000-0000-0000-0000-000000000001' AND s.account_status='active'
   AND s.role IN ('admin','super_admin','rm_admin','rm_manager'));
$$;
CREATE OR REPLACE FUNCTION public.external_teaching_college_admin(p_actor uuid,p_college uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT public.external_teaching_platform_admin(p_actor) OR EXISTS(
   SELECT 1 FROM public.organizations o WHERE o.id=p_college AND o.organization_type='college' AND o.admin_id=p_actor)
 OR EXISTS(SELECT 1 FROM public.users u WHERE u.id=p_actor AND u."isActive"
   AND u."organizationId"=p_college AND u.role::text='college_admin');
$$;
CREATE OR REPLACE FUNCTION public.external_teaching_staff(p_actor uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT s.id FROM public.organization_staff s WHERE s.user_id=p_actor
   AND s.organization_id='00000000-0000-0000-0000-000000000001'
   AND s.account_status='active' AND s.role IN ('educator','rm_trainer','trainer') LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.external_teaching_mapping_valid(p_mapping uuid,p_staff uuid,p_college uuid,p_section uuid,p_course uuid,p_date date)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.organization_staff_assignments m
 JOIN public.organization_staff s ON s.id=m.staff_id JOIN public.program_sections ps ON ps.id=m.section_id
 JOIN public.programs p ON p.id=ps.program_id JOIN public.departments d ON d.id=p.department_id
 JOIN public.courses c ON c.course_id=p_course
 WHERE m.id=p_mapping AND m.staff_id=p_staff AND m.college_id=p_college AND m.section_id=p_section
 AND m.program_id=p.id AND m.department_id=d.id AND d.college_id=p_college
 AND ps.status='active' AND m.is_active AND s.account_status='active' AND s.organization_id='00000000-0000-0000-0000-000000000001' AND s.role IN ('educator','rm_trainer','trainer') AND coalesce((s.metadata->>'teaching_access_enabled')::boolean,false)
 AND (m.start_date IS NULL OR m.start_date<=p_date) AND (m.end_date IS NULL OR m.end_date>=p_date)
 AND m.assigned_courses @> jsonb_build_array(p_course::text) AND c.deleted_at IS NULL AND c.status='Active');
$$;

-- All payloads come from authenticated server APIs; these RPCs are not executable by browser roles.
CREATE OR REPLACE FUNCTION public.external_educator_action(p_actor uuid,p_action text,p_payload jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
#variable_conflict use_column
DECLARE
 st uuid; col uuid; sec uuid; cid uuid; mid uuid; idval uuid; otherid uuid; newst uuid;
 m public.organization_staff_assignments%ROWTYPE; ss public.college_attendance_sessions%ROWTYPE;
 other public.college_attendance_sessions%ROWTYPE; ps public.program_sections%ROWTYPE;
 item jsonb; result jsonb; change jsonb; dayval date; roster uuid[]; actor_is_admin boolean;
BEGIN
 IF p_actor IS NULL THEN RAISE EXCEPTION 'Unauthorized' USING ERRCODE='42501'; END IF;
 st:=public.external_teaching_staff(p_actor); actor_is_admin:=public.external_teaching_platform_admin(p_actor);
 IF p_action='context' THEN
   SELECT jsonb_build_object('id',s.id,'name',s.first_name||' '||s.last_name,'first_name',s.first_name,
     'last_name',s.last_name,'homeOrganization',s.organization_id,'metadata',jsonb_build_object('teaching_access_enabled',s.metadata->'teaching_access_enabled'))
     INTO result FROM public.organization_staff s WHERE s.id=st;
   IF st IS NULL THEN RETURN jsonb_build_object('external',false); END IF;
   RETURN jsonb_build_object('external',true,'staff',result,'delegatedAccess',coalesce((result->'metadata'->>'teaching_access_enabled')::boolean,false),
     'mappings',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (
       SELECT m.*,p.name AS program_name,ps.semester,ps.section,o.name AS college_name,c.title AS course_title,c.course_id AS course_id
       FROM public.organization_staff_assignments m JOIN public.program_sections ps ON ps.id=m.section_id
       JOIN public.programs p ON p.id=m.program_id JOIN public.organizations o ON o.id=m.college_id
       JOIN public.courses c ON m.assigned_courses @> jsonb_build_array(c.course_id::text)
       WHERE m.staff_id=st AND public.external_teaching_mapping_valid(m.id,st,m.college_id,m.section_id,c.course_id,(now() AT TIME ZONE 'Asia/Kolkata')::date)
     ) x),'[]'::jsonb));
 END IF;
 IF p_action IN ('map','edit_mapping','relocate','reassign_mapping','end_mapping','edit_profile','deactivate_staff','admin_overview') THEN
   IF NOT actor_is_admin THEN RAISE EXCEPTION 'Platform administration required' USING ERRCODE='42501'; END IF;
   IF p_action='admin_overview' THEN
     RETURN jsonb_build_object('staff',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT id,first_name,last_name,phone,qualification,account_status FROM public.organization_staff
       WHERE organization_id='00000000-0000-0000-0000-000000000001' AND role IN ('educator','rm_trainer','trainer') ORDER BY first_name) x),'[]'),
       'mappings',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(
       SELECT m.*,s.first_name||' '||s.last_name AS staff_name,o.name AS college_name,p.name AS program_name,ps.semester,ps.section
       FROM public.organization_staff_assignments m JOIN public.organization_staff s ON s.id=m.staff_id
       JOIN public.organizations o ON o.id=m.college_id LEFT JOIN public.programs p ON p.id=m.program_id
       LEFT JOIN public.program_sections ps ON ps.id=m.section_id ORDER BY m.created_at DESC LIMIT 300) x),'[]'),
       'sessions',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT * FROM public.college_attendance_sessions
         WHERE instructor_source='platform_staff' ORDER BY date DESC,start_time DESC LIMIT 300) x),'[]'));
   END IF;
   IF p_action='edit_profile' THEN
     UPDATE public.organization_staff SET first_name=trim(p_payload->>'firstName'),last_name=trim(p_payload->>'lastName'),
       phone=p_payload->>'phone',qualification=p_payload->>'qualification',updated_at=now()
     WHERE id=(p_payload->>'staffId')::uuid AND organization_id='00000000-0000-0000-0000-000000000001';
     IF NOT FOUND THEN RAISE EXCEPTION 'Staff not found'; END IF; RETURN '{"updated":true}';
   END IF;
   IF p_action='deactivate_staff' THEN
     IF EXISTS(SELECT 1 FROM public.college_attendance_sessions WHERE organization_staff_id=(p_payload->>'staffId')::uuid AND status IN ('scheduled','ongoing')) THEN
       RAISE EXCEPTION 'Reassign or cancel outstanding sessions before deactivating this educator'; END IF;
     UPDATE public.organization_staff SET account_status='inactive',metadata=coalesce(metadata,'{}')||jsonb_build_object('teaching_access_enabled',false,'deactivation_reason',p_payload->>'reason'),updated_at=now()
       WHERE id=(p_payload->>'staffId')::uuid AND organization_id='00000000-0000-0000-0000-000000000001' AND role IN ('educator','rm_trainer','trainer');
     IF NOT FOUND THEN RAISE EXCEPTION 'Educator not found'; END IF; RETURN '{"deactivated":true}';
   END IF;
   IF p_action<>'map' THEN
     SELECT * INTO STRICT m FROM public.organization_staff_assignments WHERE id=(p_payload->>'mappingId')::uuid FOR UPDATE;
     IF m.assignment_version<>(p_payload->>'version')::integer THEN RAISE EXCEPTION 'Stale mapping revision' USING ERRCODE='40001'; END IF;
     IF nullif(trim(p_payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Reason required'; END IF;
     IF p_action='end_mapping' THEN
       UPDATE public.organization_staff_assignments SET is_active=false,end_date=(p_payload->>'endDate')::date,
         ended_by=p_actor,ended_reason=p_payload->>'reason',assignment_version=assignment_version+1 WHERE id=m.id;
       RETURN '{"ended":true}';
     END IF;
   END IF;
   newst:=(p_payload->>'staffId')::uuid; col:=(p_payload->>'collegeId')::uuid; sec:=(p_payload->>'sectionId')::uuid;
   dayval:=(p_payload->>'startDate')::date;
   IF newst IS NULL OR col IS NULL OR sec IS NULL OR dayval IS NULL OR jsonb_array_length(p_payload->'courseIds')=0 THEN RAISE EXCEPTION 'Exact class, trainer, courses and start date required'; END IF;
   PERFORM pg_advisory_xact_lock(hashtextextended('external-map:'||newst::text,0));
   PERFORM pg_advisory_xact_lock(hashtextextended('external-staff:'||newst::text,0));
   IF NOT EXISTS(SELECT 1 FROM public.organization_staff WHERE id=newst AND organization_id='00000000-0000-0000-0000-000000000001'
      AND account_status='active' AND role IN ('educator','rm_trainer','trainer')) THEN RAISE EXCEPTION 'Active platform trainer required'; END IF;
   SELECT * INTO STRICT ps FROM public.program_sections WHERE id=sec;
   IF NOT EXISTS(SELECT 1 FROM public.programs p JOIN public.departments d ON d.id=p.department_id
      WHERE ps.status='active' AND p.id=ps.program_id AND d.id=ps.department_id AND d.college_id=col) THEN RAISE EXCEPTION 'Class does not belong to destination'; END IF;
   IF nullif(p_payload->>'endDate','')::date<dayval THEN RAISE EXCEPTION 'End date precedes start'; END IF;
   FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'courseIds') LOOP
     IF NOT EXISTS(SELECT 1 FROM public.courses WHERE course_id=(item#>>'{}')::uuid AND deleted_at IS NULL AND status='Active') THEN RAISE EXCEPTION 'Course unavailable'; END IF;
   END LOOP;
   IF jsonb_array_length(p_payload->'courseIds')<>(SELECT count(DISTINCT value) FROM jsonb_array_elements(p_payload->'courseIds')) THEN RAISE EXCEPTION 'Duplicate courses'; END IF;
   IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(coalesce(p_payload->'specializations','[]')) sp
      WHERE NOT EXISTS(SELECT 1 FROM public.programs WHERE id=ps.program_id AND sp.value=ANY(specializations))) THEN RAISE EXCEPTION 'Specialization does not belong to program'; END IF;
   IF p_action<>'map' THEN
     UPDATE public.organization_staff_assignments SET is_active=false,ended_by=p_actor,ended_reason=p_payload->>'reason',
       assignment_version=assignment_version+1 WHERE id=m.id;
   END IF;
   INSERT INTO public.organization_staff_assignments(staff_id,college_id,department_id,program_id,section_id,assigned_courses,start_date,end_date,assigned_by,notes,metadata,supersedes_assignment_id)
   VALUES(newst,col,ps.department_id,ps.program_id,sec,p_payload->'courseIds',dayval,nullif(p_payload->>'endDate','')::date,p_actor,p_payload->>'notes',
     jsonb_build_object('specializations',coalesce(p_payload->'specializations','[]')),CASE WHEN p_action='map' THEN NULL ELSE m.id END) RETURNING id INTO mid;
   UPDATE public.organization_staff SET metadata=coalesce(metadata,'{}')||jsonb_build_object('portal_mode','assigned_trainer','teaching_access_enabled',true,'teaching_access_granted_by',p_actor) WHERE id=newst;
   IF p_action<>'map' THEN
     IF EXISTS(SELECT 1 FROM public.college_attendance_sessions x WHERE x.staff_assignment_id=m.id AND x.status IN ('scheduled','ongoing')
       AND x.date>=dayval AND NOT public.external_teaching_mapping_valid(mid,newst,x.college_id,x.program_section_id,x.lms_course_id,x.date)) THEN
       RAISE EXCEPTION 'Old future sessions must be cancelled or relocated explicitly before changing class/destination/course';
     END IF;
     IF EXISTS(SELECT 1 FROM public.college_attendance_sessions x JOIN public.college_attendance_sessions booked
       ON booked.organization_staff_id=newst AND booked.date=x.date AND booked.status<>'cancelled'
       AND booked.id<>x.id AND booked.staff_assignment_id<>m.id AND booked.start_time<x.end_time AND booked.end_time>x.start_time
       WHERE x.staff_assignment_id=m.id AND x.date>=dayval AND x.status='scheduled') THEN
       RAISE EXCEPTION 'New educator already booked for an affected session' USING ERRCODE='40001'; END IF;
     UPDATE public.college_attendance_sessions x SET staff_assignment_id=mid,organization_staff_id=newst,
       faculty_name=(SELECT first_name||' '||last_name FROM public.organization_staff WHERE id=newst),
       instructor_changes=x.instructor_changes||jsonb_build_array(jsonb_build_object('staffId',x.organization_staff_id,'staffAttendance',x.staff_attendance_status,'attendanceMarkedBy',x.staff_attendance_marked_by,'attendanceMarkedAt',x.staff_attendance_marked_at,'attendanceRemarks',x.staff_attendance_remarks,'mappingId',x.staff_assignment_id,'actor',p_actor,'reason',p_payload->>'reason','at',now())),
       staff_attendance_status=NULL,staff_attendance_marked_by=NULL,staff_attendance_marked_at=NULL,staff_attendance_remarks=NULL,reassigned_by=p_actor,reassigned_at=now(),replacement_reason=p_payload->>'reason',version=x.version+1
     WHERE x.staff_assignment_id=m.id AND x.date>=dayval AND x.status='scheduled';
   END IF;
   RETURN jsonb_build_object('mappingId',mid);
 END IF;

 IF p_action='class_sections' THEN
   col:=(p_payload->>'collegeId')::uuid;
   IF NOT public.external_teaching_college_admin(p_actor,col) THEN RAISE EXCEPTION 'College administration required' USING ERRCODE='42501'; END IF;
   RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT ps.id,ps.section,ps.academic_year FROM public.program_sections ps
     JOIN public.programs p ON p.id=ps.program_id JOIN public.departments d ON d.id=p.department_id
     WHERE ps.status='active' AND d.college_id=col AND ps.program_id=(p_payload->>'programId')::uuid AND ps.semester=(p_payload->>'semester')::integer ORDER BY ps.academic_year DESC,ps.section) x),'[]');
 END IF;
 IF p_action='college_sessions' THEN
   col:=(p_payload->>'collegeId')::uuid;
   IF NOT public.external_teaching_college_admin(p_actor,col) THEN RAISE EXCEPTION 'College administration required' USING ERRCODE='42501'; END IF;
   RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT * FROM public.college_attendance_sessions
     WHERE college_id=col AND instructor_source='platform_staff' ORDER BY date DESC,start_time LIMIT 200) x),'[]');
 END IF;
 IF p_action='mapped_courses' THEN
   col:=(p_payload->>'collegeId')::uuid; sec:=(p_payload->>'sectionId')::uuid; dayval:=(p_payload->>'date')::date;
   IF NOT public.external_teaching_college_admin(p_actor,col) THEN RAISE EXCEPTION 'College administration required' USING ERRCODE='42501'; END IF;
   RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT c.course_id,c.title,c.code,m.id AS mapping_id,m.assignment_version,s.id AS staff_id,
      s.first_name||' '||s.last_name AS staff_name,ps.id AS section_id FROM public.organization_staff_assignments m
      JOIN public.organization_staff s ON s.id=m.staff_id JOIN public.program_sections ps ON ps.id=m.section_id
      JOIN public.courses c ON m.assigned_courses @> jsonb_build_array(c.course_id::text)
      WHERE public.external_teaching_mapping_valid(m.id,s.id,col,sec,c.course_id,dayval) ORDER BY c.title,s.first_name) x),'[]');
 END IF;
 IF p_action='create_session' THEN
   mid:=(p_payload->>'mappingId')::uuid; cid:=(p_payload->>'courseId')::uuid; dayval:=(p_payload->>'date')::date;
   SELECT * INTO STRICT m FROM public.organization_staff_assignments WHERE id=mid FOR SHARE;
   SELECT * INTO STRICT ps FROM public.program_sections WHERE id=m.section_id;
   IF NOT public.external_teaching_college_admin(p_actor,m.college_id) OR NOT public.external_teaching_mapping_valid(mid,m.staff_id,m.college_id,m.section_id,cid,dayval) THEN RAISE EXCEPTION 'Invalid course mapping' USING ERRCODE='42501'; END IF;
   IF m.assignment_version<>(p_payload->>'mappingVersion')::integer THEN RAISE EXCEPTION 'Stale mapping revision' USING ERRCODE='40001'; END IF;
   IF (p_payload->>'endTime')::time<=(p_payload->>'startTime')::time THEN RAISE EXCEPTION 'Invalid session interval'; END IF;
   PERFORM pg_advisory_xact_lock(hashtextextended('external-staff:'||m.staff_id::text,0));
   SELECT * INTO ss FROM public.college_attendance_sessions WHERE created_by=p_actor AND creation_request_id=(p_payload->>'requestId')::uuid;
   IF FOUND THEN
     IF ss.staff_assignment_id<>mid OR ss.lms_course_id<>cid OR ss.date<>dayval OR ss.start_time<>(p_payload->>'startTime')::time OR ss.end_time<>(p_payload->>'endTime')::time THEN RAISE EXCEPTION 'Creation reference already used' USING ERRCODE='40001'; END IF;
     RETURN to_jsonb(ss);
   END IF;
   IF EXISTS(SELECT 1 FROM public.college_attendance_sessions WHERE organization_staff_id=m.staff_id AND date=dayval AND status<>'cancelled'
      AND start_time<(p_payload->>'endTime')::time AND end_time>(p_payload->>'startTime')::time) THEN RAISE EXCEPTION 'Trainer is already booked' USING ERRCODE='40001'; END IF;
   INSERT INTO public.college_attendance_sessions(college_id,department_id,program_id,program_section_id,department_name,program_name,semester,section,academic_year,
     date,start_time,end_time,subject_name,subject_code,faculty_name,room_number,remarks,created_by,instructor_source,lms_course_id,staff_assignment_id,organization_staff_id,original_organization_staff_id,assignment_version_at_creation,creation_request_id)
   SELECT m.college_id,m.department_id,m.program_id,m.section_id,d.name,p.name,ps.semester,ps.section,ps.academic_year,
     dayval,(p_payload->>'startTime')::time,(p_payload->>'endTime')::time,c.title,c.code,s.first_name||' '||s.last_name,
     p_payload->>'room',p_payload->>'remarks',p_actor,'platform_staff',cid,mid,m.staff_id,m.staff_id,m.assignment_version,(p_payload->>'requestId')::uuid
   FROM public.departments d,public.programs p,public.courses c,public.organization_staff s
   WHERE d.id=m.department_id AND p.id=m.program_id AND c.course_id=cid AND s.id=m.staff_id RETURNING * INTO ss;
   INSERT INTO public.college_attendance_records(session_id,learner_id,learner_name,roll_number,department_name,program_name,program_id,semester,section,date,status,
     subject_name,subject_code,faculty_name,college_id,organization_staff_id)
   SELECT ss.id,l.id,l.name,coalesce(l.roll_number,''),ss.department_name,ss.program_name,ss.program_id,ss.semester,ss.section,ss.date,NULL,
     ss.subject_name,ss.subject_code,ss.faculty_name,ss.college_id,m.staff_id FROM public.learners l
   WHERE l.college_id=m.college_id AND l.program_id=m.program_id AND l.semester=ps.semester AND l.section=ps.section AND NOT coalesce(l.is_deleted,false)
     AND (jsonb_array_length(coalesce(m.metadata->'specializations','[]'))=0 OR m.metadata->'specializations' @> jsonb_build_array(l.specialization));
   UPDATE public.college_attendance_sessions SET total_learners=(SELECT count(*) FROM public.college_attendance_records WHERE session_id=ss.id) WHERE id=ss.id RETURNING * INTO ss;
   RETURN to_jsonb(ss);
 END IF;

 IF p_action IN ('sessions','learners','courses') THEN
   IF st IS NULL THEN RAISE EXCEPTION 'Assigned trainer required' USING ERRCODE='42501'; END IF;
   IF p_action='sessions' THEN RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT ss.* FROM public.college_attendance_sessions ss
     WHERE ss.organization_staff_id=st AND public.external_teaching_mapping_valid(ss.staff_assignment_id,st,ss.college_id,ss.program_section_id,ss.lms_course_id,ss.date)
     ORDER BY ss.date DESC,ss.start_time LIMIT 200) x),'[]'); END IF;
   IF p_action='courses' THEN RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT DISTINCT c.course_id,c.title,c.code,c.description,c.duration
      FROM public.courses c JOIN public.organization_staff_assignments m ON m.assigned_courses @> jsonb_build_array(c.course_id::text)
      WHERE m.staff_id=st AND public.external_teaching_mapping_valid(m.id,st,m.college_id,m.section_id,c.course_id,(now() AT TIME ZONE 'Asia/Kolkata')::date)) x),'[]'); END IF;
   RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT DISTINCT l.id,l.name,l.roll_number,l.program_id,l.semester,l.section,l.specialization
     FROM public.learners l JOIN public.program_sections ps ON ps.program_id=l.program_id AND ps.semester=l.semester AND ps.section=l.section
     JOIN public.organization_staff_assignments m ON m.section_id=ps.id AND m.college_id=l.college_id
     JOIN public.courses c ON m.assigned_courses @> jsonb_build_array(c.course_id::text)
     WHERE m.staff_id=st AND NOT coalesce(l.is_deleted,false)
      AND public.external_teaching_mapping_valid(m.id,st,m.college_id,ps.id,c.course_id,(now() AT TIME ZONE 'Asia/Kolkata')::date)
      AND (jsonb_array_length(coalesce(m.metadata->'specializations','[]'))=0 OR m.metadata->'specializations' @> jsonb_build_array(l.specialization)) LIMIT 1000) x),'[]');
 END IF;
 IF p_action IN ('session_roster','mark_learners','mark_staff','replace','swap','cancel_session') THEN
   IF p_action='swap' THEN
     PERFORM 1 FROM public.college_attendance_sessions WHERE id IN((p_payload->>'sessionId')::uuid,(p_payload->>'otherSessionId')::uuid)
       ORDER BY id FOR UPDATE;
   END IF;
   SELECT * INTO STRICT ss FROM public.college_attendance_sessions WHERE id=(p_payload->>'sessionId')::uuid AND instructor_source='platform_staff' FOR UPDATE;
   IF p_action IN ('mark_staff','replace','swap','cancel_session') THEN
     IF NOT actor_is_admin THEN RAISE EXCEPTION 'Platform administration required' USING ERRCODE='42501'; END IF;
   ELSE
     IF NOT public.external_teaching_college_admin(p_actor,ss.college_id) AND (st IS NULL OR st<>ss.organization_staff_id OR NOT public.external_teaching_mapping_valid(ss.staff_assignment_id,st,ss.college_id,ss.program_section_id,ss.lms_course_id,ss.date)
        OR NOT EXISTS(SELECT 1 FROM public.organization_staff_assignments WHERE id=ss.staff_assignment_id AND (end_date IS NULL OR end_date>=(now() AT TIME ZONE 'Asia/Kolkata')::date))
     ) THEN RAISE EXCEPTION 'Session not assigned to educator' USING ERRCODE='42501'; END IF;
   END IF;
   IF p_action='session_roster' THEN RETURN jsonb_build_object('session',to_jsonb(ss),'learners',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM public.college_attendance_records r WHERE r.session_id=ss.id),'[]')); END IF;
   IF ss.version<>(p_payload->>'version')::integer THEN RAISE EXCEPTION 'Stale session revision' USING ERRCODE='40001'; END IF;
   IF p_action='mark_learners' THEN
     IF ss.status='cancelled' OR ss.locked_at IS NOT NULL OR ss.date>(now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Attendance cannot be marked for this session'; END IF;
     IF ss.attendance_revision<>(p_payload->>'attendanceRevision')::integer THEN RAISE EXCEPTION 'Stale attendance revision' USING ERRCODE='40001'; END IF;
     FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'records') LOOP
       IF item->>'status' NOT IN ('present','absent','late','excused') THEN RAISE EXCEPTION 'Invalid attendance status'; END IF;
       UPDATE public.college_attendance_records SET revision_history=revision_history||jsonb_build_array(jsonb_build_object('status',status,'markedBy',marked_by,'at',marked_at)),
        status=item->>'status',marked_by=p_actor,marked_by_staff_id=st,organization_staff_id=ss.organization_staff_id,faculty_name=ss.faculty_name,marked_at=now(),version=version+1
        WHERE session_id=ss.id AND learner_id=(item->>'learnerId')::uuid;
       IF NOT FOUND THEN RAISE EXCEPTION 'Learner is not in session roster' USING ERRCODE='42501'; END IF;
     END LOOP;
     UPDATE public.college_attendance_sessions SET attendance_revision=attendance_revision+1,version=version+1,
       present_count=(SELECT count(*) FROM public.college_attendance_records WHERE session_id=ss.id AND status='present'),
       absent_count=(SELECT count(*) FROM public.college_attendance_records WHERE session_id=ss.id AND status='absent'),
       late_count=(SELECT count(*) FROM public.college_attendance_records WHERE session_id=ss.id AND status='late'),
       excused_count=(SELECT count(*) FROM public.college_attendance_records WHERE session_id=ss.id AND status='excused'),
       status=CASE WHEN EXISTS(SELECT 1 FROM public.college_attendance_records WHERE session_id=ss.id AND status IS NULL) THEN 'ongoing' ELSE 'completed' END
       WHERE id=ss.id RETURNING * INTO ss;
     RETURN to_jsonb(ss);
   END IF;
   IF p_action='mark_staff' THEN
     IF p_payload->>'status' NOT IN ('present','absent','late','excused') OR ss.status='cancelled' OR ss.date>(now() AT TIME ZONE 'Asia/Kolkata')::date THEN RAISE EXCEPTION 'Invalid educator attendance'; END IF;
     UPDATE public.college_attendance_sessions SET staff_attendance_status=p_payload->>'status',staff_attendance_marked_by=p_actor,
       staff_attendance_marked_at=now(),staff_attendance_remarks=p_payload->>'reason',version=version+1 WHERE id=ss.id;
     RETURN '{"updated":true}';
   END IF;
   IF nullif(trim(p_payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Reason required'; END IF;
   IF ss.status IN ('completed','cancelled') OR ss.locked_at IS NOT NULL THEN RAISE EXCEPTION 'Session history cannot be reassigned'; END IF;
   IF p_action='cancel_session' THEN UPDATE public.college_attendance_sessions SET status='cancelled',remarks=p_payload->>'reason',version=version+1 WHERE id=ss.id; RETURN '{"cancelled":true}'; END IF;
   IF p_action='swap' THEN
     otherid:=(p_payload->>'otherSessionId')::uuid;
     IF otherid=ss.id THEN RAISE EXCEPTION 'Choose two different sessions'; END IF;
     SELECT * INTO STRICT other FROM public.college_attendance_sessions WHERE id=otherid AND instructor_source='platform_staff' FOR UPDATE;
     IF other.version<>(p_payload->>'otherVersion')::integer OR other.status IN ('completed','cancelled') THEN RAISE EXCEPTION 'Other session changed' USING ERRCODE='40001'; END IF;
     mid:=(p_payload->>'mappingId')::uuid; idval:=(p_payload->>'otherMappingId')::uuid;
     IF NOT public.external_teaching_mapping_valid(mid,other.organization_staff_id,ss.college_id,ss.program_section_id,ss.lms_course_id,ss.date)
       OR NOT public.external_teaching_mapping_valid(idval,ss.organization_staff_id,other.college_id,other.program_section_id,other.lms_course_id,other.date) THEN RAISE EXCEPTION 'Both trainers need matching destination course grants'; END IF;
     newst:=other.organization_staff_id;
   ELSE
     mid:=(p_payload->>'mappingId')::uuid; SELECT staff_id INTO STRICT newst FROM public.organization_staff_assignments WHERE id=mid;
     IF NOT public.external_teaching_mapping_valid(mid,newst,ss.college_id,ss.program_section_id,ss.lms_course_id,ss.date) THEN RAISE EXCEPTION 'Replacement mapping is not valid'; END IF;
   END IF;
   PERFORM pg_advisory_xact_lock(hashtextextended('external-staff:'||least(ss.organization_staff_id::text,newst::text),0));
   PERFORM pg_advisory_xact_lock(hashtextextended('external-staff:'||greatest(ss.organization_staff_id::text,newst::text),0));
   IF EXISTS(SELECT 1 FROM public.college_attendance_sessions WHERE organization_staff_id=newst AND date=ss.date AND id<>ss.id
      AND (p_action<>'swap' OR id<>other.id) AND status<>'cancelled' AND start_time<ss.end_time AND end_time>ss.start_time) THEN RAISE EXCEPTION 'Replacement trainer is booked' USING ERRCODE='40001'; END IF;
   IF p_action='swap' AND EXISTS(SELECT 1 FROM public.college_attendance_sessions WHERE organization_staff_id=ss.organization_staff_id AND date=other.date
      AND id NOT IN(ss.id,other.id) AND status<>'cancelled' AND start_time<other.end_time AND end_time>other.start_time) THEN RAISE EXCEPTION 'Swap trainer is booked' USING ERRCODE='40001'; END IF;
   UPDATE public.college_attendance_sessions SET organization_staff_id=newst,staff_assignment_id=mid,
     faculty_name=(SELECT first_name||' '||last_name FROM public.organization_staff WHERE id=newst),
     instructor_changes=instructor_changes||jsonb_build_array(jsonb_build_object('staffId',ss.organization_staff_id,'staffAttendance',ss.staff_attendance_status,'attendanceMarkedBy',ss.staff_attendance_marked_by,'attendanceMarkedAt',ss.staff_attendance_marked_at,'attendanceRemarks',ss.staff_attendance_remarks,'mappingId',ss.staff_assignment_id,'actor',p_actor,'reason',p_payload->>'reason','at',now())),
     staff_attendance_status=NULL,staff_attendance_marked_by=NULL,staff_attendance_marked_at=NULL,staff_attendance_remarks=NULL,reassigned_by=p_actor,reassigned_at=now(),replacement_reason=p_payload->>'reason',version=version+1 WHERE id=ss.id;
   IF p_action='swap' THEN
     UPDATE public.college_attendance_sessions SET organization_staff_id=ss.organization_staff_id,staff_assignment_id=idval,faculty_name=ss.faculty_name,
       instructor_changes=instructor_changes||jsonb_build_array(jsonb_build_object('staffId',other.organization_staff_id,'staffAttendance',other.staff_attendance_status,'attendanceMarkedBy',other.staff_attendance_marked_by,'attendanceMarkedAt',other.staff_attendance_marked_at,'attendanceRemarks',other.staff_attendance_remarks,'mappingId',other.staff_assignment_id,'actor',p_actor,'reason',p_payload->>'reason','at',now())),
       staff_attendance_status=NULL,staff_attendance_marked_by=NULL,staff_attendance_marked_at=NULL,staff_attendance_remarks=NULL,reassigned_by=p_actor,reassigned_at=now(),replacement_reason=p_payload->>'reason',version=version+1 WHERE id=other.id;
   END IF;
   RETURN '{"updated":true}';
 END IF;
 RAISE EXCEPTION 'Unknown teaching action';
END;
$$;
REVOKE ALL ON FUNCTION public.external_teaching_platform_admin(uuid), public.external_teaching_college_admin(uuid,uuid),
 public.external_teaching_staff(uuid), public.external_teaching_mapping_valid(uuid,uuid,uuid,uuid,uuid,date),
 public.external_educator_action(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.external_teaching_platform_admin(uuid), public.external_teaching_college_admin(uuid,uuid),
 public.external_teaching_staff(uuid), public.external_teaching_mapping_valid(uuid,uuid,uuid,uuid,uuid,date),
 public.external_educator_action(uuid,text,jsonb) TO service_role;
COMMIT;
