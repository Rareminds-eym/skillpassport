-- Opt-in "retain expired assignments" for ONE trainer at a time (default OFF: nothing changes for a trainer who is not flagged).
-- Flag: organization_staff.metadata->>'retain_expired_assignments' = 'true' (set per trainer by a seed or by hand; this migration sets nobody).
-- For a flagged, active trainer with teaching access whose mappings have passed their end date:
--   * courses and learners lists keep showing them (the mapping is checked as of its last day instead of today);
--   * session_roster, mark_learners and mark_combined_learners work for sessions of the ended mapping (the "end_date >= today" test is waived);
--   * context also returns retainExpiredAssignments so the attendance screen can lift its past-date lock for that trainer only.
-- Unchanged for everybody, flagged or not: the mapping must still be active (administrator-ended mappings have is_active=false and stay closed), valid on the session
-- date, the course must be Active and not deleted, mappings that have not started stay hidden, cancelled / locked / future sessions stay closed, and the context action
-- still lists only current mappings (no new work on an ended assignment). Assignment dates are never changed.
-- external_educator_action is a copy of 20270118000000_allow_multiple_trainer_class_mappings.sql and external_educator_combined_action a copy of
-- 20270117000000_combined_class_sessions.sql, each with ONLY the lines described above changed (4 and 1 lines). Depends on 20270113000000, 20270117000000 and 20270118000000.
BEGIN;

DO $guard$
BEGIN
  IF to_regprocedure('public.trainer_class_mapping_clash(uuid)') IS NULL
     OR to_regprocedure('public.external_teaching_mapping_valid(uuid,uuid,uuid,uuid,uuid,date)') IS NULL
     OR to_regprocedure('public.external_educator_combined_action(uuid,text,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'Apply 20270113000000, 20270117000000 and 20270118000000 first';
  END IF;
END $guard$;

-- true only for an active trainer of the platform organization with teaching access whose profile carries the flag
CREATE OR REPLACE FUNCTION public.external_teaching_retains_expired(p_staff uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path TO '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_staff s WHERE s.id = p_staff
    AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
    AND s.role IN ('educator','rm_trainer','trainer')
    AND coalesce((s.metadata->>'teaching_access_enabled')::boolean, false)
    AND s.metadata->>'retain_expired_assignments' = 'true');
$$;

REVOKE ALL ON FUNCTION public.external_teaching_retains_expired(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.external_teaching_retains_expired(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.external_educator_action(p_actor uuid, p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
#variable_conflict use_column
DECLARE
 st uuid; col uuid; sec uuid; cid uuid; mid uuid; idval uuid; otherid uuid; newst uuid;
 m public.organization_staff_assignments%ROWTYPE; ss public.college_attendance_sessions%ROWTYPE;
 other public.college_attendance_sessions%ROWTYPE; ps public.program_sections%ROWTYPE;
 item jsonb; result jsonb; change jsonb; dayval date; roster uuid[]; actor_is_admin boolean; conflict text;
BEGIN
 IF p_actor IS NULL THEN RAISE EXCEPTION 'Unauthorized' USING ERRCODE='42501'; END IF;
 st:=public.external_teaching_staff(p_actor); actor_is_admin:=public.external_teaching_platform_admin(p_actor);
 IF p_action='context' THEN
   SELECT jsonb_build_object('id',s.id,'name',s.first_name||' '||s.last_name,'first_name',s.first_name,
     'last_name',s.last_name,'homeOrganization',s.organization_id,'metadata',jsonb_build_object('teaching_access_enabled',s.metadata->'teaching_access_enabled'))
     INTO result FROM public.organization_staff s WHERE s.id=st;
   IF st IS NULL THEN RETURN jsonb_build_object('external',false); END IF;
   RETURN jsonb_build_object('external',true,'staff',result,'delegatedAccess',coalesce((result->'metadata'->>'teaching_access_enabled')::boolean,false),'retainExpiredAssignments',public.external_teaching_retains_expired(st),
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
       'sessions',coalesce((SELECT jsonb_agg(to_jsonb(x) || coalesce(public.staff_attendance_json(x.id,x.organization_staff_id),'{}')) FROM(SELECT * FROM public.college_attendance_sessions
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
    IF EXISTS(SELECT 1 FROM public.organization_staff_assignments o WHERE o.staff_id=newst AND o.college_id=col AND o.department_id=ps.department_id AND o.program_id=ps.program_id AND o.section_id=sec AND o.is_active AND (p_action='map' OR o.id<>m.id) AND dayval<=coalesce(o.end_date,'infinity'::date) AND coalesce(nullif(p_payload->>'endDate','')::date,'infinity'::date)>=o.start_date AND EXISTS(SELECT 1 FROM jsonb_array_elements_text(p_payload->'courseIds') c WHERE o.assigned_courses ? c) AND (jsonb_array_length(coalesce(p_payload->'time_slots','[]'))=0 OR NOT EXISTS(SELECT 1 FROM public.assignment_time_slots t WHERE t.assignment_id=o.id))) THEN RAISE EXCEPTION 'Trainer already has an active mapping for this class and section' USING ERRCODE='40001'; END IF;
   INSERT INTO public.organization_staff_assignments(staff_id,college_id,department_id,program_id,section_id,assigned_courses,start_date,end_date,assigned_by,notes,metadata,supersedes_assignment_id)
   VALUES(newst,col,ps.department_id,ps.program_id,sec,p_payload->'courseIds',dayval,nullif(p_payload->>'endDate','')::date,p_actor,p_payload->>'notes',
      jsonb_build_object('specializations',coalesce(p_payload->'specializations','[]')),CASE WHEN p_action='map' THEN NULL ELSE m.id END) RETURNING id INTO mid;
    IF p_action IN ('map','edit_mapping','relocate','reassign_mapping') THEN
      PERFORM public.external_teaching_validate_slots(mid, coalesce(p_payload->'time_slots','[]'), p_payload->'courseIds', sec, col);
      IF p_action<>'map' THEN DELETE FROM public.assignment_time_slots WHERE assignment_id=m.id; END IF;
      INSERT INTO public.assignment_time_slots(assignment_id,start_time,end_time)
      SELECT mid,
        coalesce((s.value->>'start_time')::time,(s.value->>'startTime')::time),
        coalesce((s.value->>'end_time')::time,(s.value->>'endTime')::time)
      FROM jsonb_array_elements(coalesce(p_payload->'time_slots','[]')) AS s(value);
    END IF;
    SELECT 'Trainer is already allocated to ' || COALESCE(p2.name,'another program') || ' Section ' || COALESCE(ps2.section,'?') || ' (Sem ' || COALESCE(ps2.semester::text,'?') || ') at ' || to_char(os.start_time,'HH24:MI') || '-' || to_char(os.end_time,'HH24:MI')
      INTO conflict
    FROM public.assignment_time_slots ns
    JOIN public.assignment_time_slots os ON os.assignment_id <> ns.assignment_id
    JOIN public.organization_staff_assignments oa ON oa.id = os.assignment_id
    LEFT JOIN public.programs p2 ON p2.id = oa.program_id
    LEFT JOIN public.program_sections ps2 ON ps2.id = oa.section_id
    WHERE ns.assignment_id = mid
      AND oa.staff_id = newst AND oa.is_active
      AND dayval <= COALESCE(oa.end_date, 'infinity'::date)
      AND COALESCE(nullif(p_payload->>'endDate','')::date, 'infinity'::date) >= oa.start_date
      AND ns.start_time < os.end_time AND os.start_time < ns.end_time
    LIMIT 1;
    IF FOUND THEN RAISE EXCEPTION '%', conflict USING ERRCODE='40001'; END IF;
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
       instructor_changes=x.instructor_changes||jsonb_build_array(jsonb_build_object('staffId',x.organization_staff_id,'staffAttendance',(SELECT a.status FROM public.organization_staff_attendence a WHERE a.session_id=x.id AND a.organization_staff_id=x.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'attendanceMarkedBy',(SELECT a.marked_by FROM public.organization_staff_attendence a WHERE a.session_id=x.id AND a.organization_staff_id=x.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'attendanceMarkedAt',(SELECT a.marked_at FROM public.organization_staff_attendence a WHERE a.session_id=x.id AND a.organization_staff_id=x.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'attendanceRemarks',(SELECT a.remarks FROM public.organization_staff_attendence a WHERE a.session_id=x.id AND a.organization_staff_id=x.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'mappingId',x.staff_assignment_id,'actor',p_actor,'reason',p_payload->>'reason','at',now())),
       reassigned_by=p_actor,reassigned_at=now(),replacement_reason=p_payload->>'reason',version=x.version+1
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
   RETURN coalesce((SELECT jsonb_agg(to_jsonb(x) || coalesce(public.staff_attendance_json(x.id,x.organization_staff_id),'{}')) FROM(SELECT * FROM public.college_attendance_sessions
     WHERE college_id=col AND instructor_source='platform_staff' ORDER BY date DESC,start_time LIMIT 200) x),'[]');
 END IF;
 IF p_action='mapped_courses' THEN
   col:=(p_payload->>'collegeId')::uuid; sec:=(p_payload->>'sectionId')::uuid; dayval:=(p_payload->>'date')::date;
   IF NOT public.external_teaching_college_admin(p_actor,col) THEN RAISE EXCEPTION 'College administration required' USING ERRCODE='42501'; END IF;
   RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT c.course_id,c.title,c.code,m.id AS mapping_id,m.assignment_version,s.id AS staff_id,
      s.first_name||' '||s.last_name AS staff_name,ps.id AS section_id,
      m.start_date,m.end_date,
      coalesce((SELECT jsonb_agg(jsonb_build_object('start_time',ts.start_time,'end_time',ts.end_time) ORDER BY ts.start_time)
        FROM public.assignment_time_slots ts WHERE ts.assignment_id=m.id),'[]'::jsonb) AS time_slots FROM public.organization_staff_assignments m
      JOIN public.organization_staff s ON s.id=m.staff_id JOIN public.program_sections ps ON ps.id=m.section_id
      JOIN public.courses c ON m.assigned_courses @> jsonb_build_array(c.course_id::text)
      WHERE public.external_teaching_mapping_valid(m.id,s.id,col,sec,c.course_id,coalesce(m.start_date,least(dayval,m.end_date))) AND public.external_teaching_slot_covers(m.id,dayval,NULL,NULL,c.course_id,sec) ORDER BY c.title,s.first_name) x),'[]');
 END IF;
 IF p_action='create_session' THEN
   mid:=(p_payload->>'mappingId')::uuid; cid:=(p_payload->>'courseId')::uuid; dayval:=(p_payload->>'date')::date;
   SELECT * INTO STRICT m FROM public.organization_staff_assignments WHERE id=mid FOR SHARE;
   SELECT * INTO STRICT ps FROM public.program_sections WHERE id=m.section_id;
   IF NOT public.external_teaching_college_admin(p_actor,m.college_id) OR NOT public.external_teaching_mapping_valid(mid,m.staff_id,m.college_id,m.section_id,cid,dayval) THEN RAISE EXCEPTION 'Invalid course mapping' USING ERRCODE='42501'; END IF;
   IF m.assignment_version<>(p_payload->>'mappingVersion')::integer THEN RAISE EXCEPTION 'Stale mapping revision' USING ERRCODE='40001'; END IF;
   IF (p_payload->>'endTime')::time<=(p_payload->>'startTime')::time THEN RAISE EXCEPTION 'Invalid session interval'; END IF;
    IF NOT public.external_teaching_slot_covers(mid, dayval, (p_payload->>'startTime')::time, (p_payload->>'endTime')::time, cid, m.section_id) THEN RAISE EXCEPTION 'No trainer time slot covers this session' USING ERRCODE='40001'; END IF;
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
   IF p_action='sessions' THEN RETURN coalesce((SELECT jsonb_agg(to_jsonb(x) || coalesce(public.staff_attendance_json(x.id,x.organization_staff_id),'{}')) FROM(SELECT ss.* FROM public.college_attendance_sessions ss
     WHERE ss.organization_staff_id=st AND public.external_teaching_mapping_valid(ss.staff_assignment_id,st,ss.college_id,ss.program_section_id,ss.lms_course_id,ss.date)
     ORDER BY ss.date DESC,ss.start_time LIMIT 200) x),'[]'); END IF;
   IF p_action='courses' THEN RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT DISTINCT c.course_id,c.title,c.code,c.description,c.duration
      FROM public.courses c JOIN public.organization_staff_assignments m ON m.assigned_courses @> jsonb_build_array(c.course_id::text)
      WHERE m.staff_id=st AND public.external_teaching_mapping_valid(m.id,st,m.college_id,m.section_id,c.course_id,CASE WHEN public.external_teaching_retains_expired(st) THEN least(coalesce(m.end_date,(now() AT TIME ZONE 'Asia/Kolkata')::date),(now() AT TIME ZONE 'Asia/Kolkata')::date) ELSE (now() AT TIME ZONE 'Asia/Kolkata')::date END)) x),'[]'); END IF;
   RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM(SELECT DISTINCT l.id,l.name,l.roll_number,l.program_id,l.semester,l.section,l.specialization
     FROM public.learners l JOIN public.program_sections ps ON ps.program_id=l.program_id AND ps.semester=l.semester AND ps.section=l.section
     JOIN public.organization_staff_assignments m ON m.section_id=ps.id AND m.college_id=l.college_id
     JOIN public.courses c ON m.assigned_courses @> jsonb_build_array(c.course_id::text)
     WHERE m.staff_id=st AND NOT coalesce(l.is_deleted,false)
      AND public.external_teaching_mapping_valid(m.id,st,m.college_id,ps.id,c.course_id,CASE WHEN public.external_teaching_retains_expired(st) THEN least(coalesce(m.end_date,(now() AT TIME ZONE 'Asia/Kolkata')::date),(now() AT TIME ZONE 'Asia/Kolkata')::date) ELSE (now() AT TIME ZONE 'Asia/Kolkata')::date END)
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
        OR NOT EXISTS(SELECT 1 FROM public.organization_staff_assignments WHERE id=ss.staff_assignment_id AND (end_date IS NULL OR end_date>=(now() AT TIME ZONE 'Asia/Kolkata')::date OR public.external_teaching_retains_expired(st)))
     ) THEN RAISE EXCEPTION 'Session not assigned to educator' USING ERRCODE='42501'; END IF;
   END IF;
   IF p_action='session_roster' THEN RETURN jsonb_build_object('session',to_jsonb(ss) || coalesce(public.staff_attendance_json(ss.id,ss.organization_staff_id),'{}'),'learners',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM public.college_attendance_records r WHERE r.session_id=ss.id),'[]')); END IF;
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
     INSERT INTO public.organization_staff_attendence(organization_staff_id,date,status,session_id,organization_id,marked_by,marked_at,remarks)
    VALUES(ss.organization_staff_id,ss.date,p_payload->>'status',ss.id,ss.college_id,p_actor,now(),p_payload->>'reason')
    ON CONFLICT (organization_staff_id,session_id) WHERE session_id IS NOT NULL
    DO UPDATE SET status=EXCLUDED.status,marked_by=EXCLUDED.marked_by,marked_at=now(),remarks=EXCLUDED.remarks,updated_at=now();
    UPDATE public.college_attendance_sessions SET version=version+1 WHERE id=ss.id;
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
     instructor_changes=instructor_changes||jsonb_build_array(jsonb_build_object('staffId',ss.organization_staff_id,'staffAttendance',(SELECT a.status FROM public.organization_staff_attendence a WHERE a.session_id=ss.id AND a.organization_staff_id=ss.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'attendanceMarkedBy',(SELECT a.marked_by FROM public.organization_staff_attendence a WHERE a.session_id=ss.id AND a.organization_staff_id=ss.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'attendanceMarkedAt',(SELECT a.marked_at FROM public.organization_staff_attendence a WHERE a.session_id=ss.id AND a.organization_staff_id=ss.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'attendanceRemarks',(SELECT a.remarks FROM public.organization_staff_attendence a WHERE a.session_id=ss.id AND a.organization_staff_id=ss.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'mappingId',ss.staff_assignment_id,'actor',p_actor,'reason',p_payload->>'reason','at',now())),
     reassigned_by=p_actor,reassigned_at=now(),replacement_reason=p_payload->>'reason',version=version+1 WHERE id=ss.id;
   IF p_action='swap' THEN
     UPDATE public.college_attendance_sessions SET organization_staff_id=ss.organization_staff_id,staff_assignment_id=idval,faculty_name=ss.faculty_name,
       instructor_changes=instructor_changes||jsonb_build_array(jsonb_build_object('staffId',other.organization_staff_id,'staffAttendance',(SELECT a.status FROM public.organization_staff_attendence a WHERE a.session_id=other.id AND a.organization_staff_id=other.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'attendanceMarkedBy',(SELECT a.marked_by FROM public.organization_staff_attendence a WHERE a.session_id=other.id AND a.organization_staff_id=other.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'attendanceMarkedAt',(SELECT a.marked_at FROM public.organization_staff_attendence a WHERE a.session_id=other.id AND a.organization_staff_id=other.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'attendanceRemarks',(SELECT a.remarks FROM public.organization_staff_attendence a WHERE a.session_id=other.id AND a.organization_staff_id=other.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),'mappingId',other.staff_assignment_id,'actor',p_actor,'reason',p_payload->>'reason','at',now())),
       reassigned_by=p_actor,reassigned_at=now(),replacement_reason=p_payload->>'reason',version=version+1 WHERE id=other.id;
   END IF;
   RETURN '{"updated":true}';
 END IF;
  RAISE EXCEPTION 'Unknown teaching action';
END;
$function$;

REVOKE ALL ON FUNCTION public.external_educator_action(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.external_educator_action(uuid,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.external_educator_combined_action(
  p_actor uuid, p_action text, p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SET search_path TO '' AS $$
#variable_conflict use_column
DECLARE
 mids uuid[]; derived uuid[]; ids uuid[]; req uuid[]; mid uuid; cid uuid; dayval date; stime time; etime time;
 gid uuid; reqid uuid; st uuid; newst uuid; oldst uuid; n int; i int; found_n int; ver int; today date; col uuid; agid uuid;
 conflict text; wanted jsonb; have jsonb;
 m public.organization_staff_assignments%ROWTYPE; ps public.program_sections%ROWTYPE;
 ss public.college_attendance_sessions%ROWTYPE; r public.college_attendance_sessions%ROWTYPE;
 acc jsonb:='[]'::jsonb; item jsonb; entry jsonb;
BEGIN
 IF p_actor IS NULL THEN RAISE EXCEPTION 'Unauthorized' USING ERRCODE='42501'; END IF;
 IF p_action NOT IN ('group_mappings','end_mapping_group','combined_groups','create_combined_session','cancel_combined_session','replace_combined_session','mark_combined_staff','mark_combined_learners') THEN
   RAISE EXCEPTION 'Unknown combined action' USING ERRCODE='22023'; END IF;
 today:=(now() AT TIME ZONE 'Asia/Kolkata')::date;

 ----------------------------------------------------------------------------------------------------------------
 -- SP Admin: define a combined group from existing per-class mappings of one trainer
 IF p_action='group_mappings' THEN
   IF NOT public.external_teaching_platform_admin(p_actor) THEN RAISE EXCEPTION 'Platform administration required' USING ERRCODE='42501'; END IF;
   SELECT array_agg(x::uuid ORDER BY x::uuid) INTO mids FROM jsonb_array_elements_text(p_payload->'mappingIds') x;
   n:=coalesce(array_length(mids,1),0);
   IF n<2 OR n>10 OR n<>(SELECT count(DISTINCT x) FROM unnest(mids) x) THEN
     RAISE EXCEPTION 'A combined group needs 2 to 10 different class mappings'; END IF;
   PERFORM 1 FROM public.organization_staff_assignments WHERE id=ANY(mids) ORDER BY id FOR UPDATE;
   IF (SELECT count(*) FROM public.organization_staff_assignments WHERE id=ANY(mids) AND is_active AND combined_class_group_id IS NULL)<>n THEN
     RAISE EXCEPTION 'Every mapping must be active and not already in a combined group'; END IF;
   IF (SELECT count(DISTINCT staff_id) FROM public.organization_staff_assignments WHERE id=ANY(mids))<>1
      OR (SELECT count(DISTINCT college_id) FROM public.organization_staff_assignments WHERE id=ANY(mids))<>1
      OR (SELECT count(DISTINCT section_id) FROM public.organization_staff_assignments WHERE id=ANY(mids))<>n THEN
     RAISE EXCEPTION 'A combined group needs one trainer, one college and a different class in each mapping'; END IF;
   IF (SELECT count(DISTINCT q.cs) FROM (SELECT (SELECT jsonb_agg(c ORDER BY c) FROM jsonb_array_elements_text(a.assigned_courses) c)::text AS cs
        FROM public.organization_staff_assignments a WHERE a.id=ANY(mids)) q)<>1 THEN
     RAISE EXCEPTION 'Every mapping in a combined group must have the same courses'; END IF;
   -- shared time slots: validated like map, applied to every class, compared only with the trainer's other mappings
   IF jsonb_typeof(p_payload->'time_slots') IS DISTINCT FROM 'array' OR jsonb_array_length(p_payload->'time_slots')=0 THEN
     RAISE EXCEPTION 'Add at least one time slot' USING ERRCODE='22000'; END IF;
   PERFORM public.external_teaching_validate_slots(mids[1],p_payload->'time_slots',
     (SELECT assigned_courses FROM public.organization_staff_assignments WHERE id=mids[1]),
     (SELECT section_id FROM public.organization_staff_assignments WHERE id=mids[1]),
     (SELECT college_id FROM public.organization_staff_assignments WHERE id=mids[1]));
   SELECT jsonb_agg(jsonb_build_array(q.st::text,q.et::text) ORDER BY q.st,q.et) INTO wanted FROM (
     SELECT coalesce(s->>'start_time',s->>'startTime')::time AS st,coalesce(s->>'end_time',s->>'endTime')::time AS et
     FROM jsonb_array_elements(p_payload->'time_slots') s) q;
   -- a mapping that already has slots may only be grouped when they are exactly the shared slots
   FOR i IN 1..n LOOP
     SELECT jsonb_agg(jsonb_build_array(ts.start_time::text,ts.end_time::text) ORDER BY ts.start_time,ts.end_time) INTO have
       FROM public.assignment_time_slots ts WHERE ts.assignment_id=mids[i];
     IF have IS NOT NULL AND have IS DISTINCT FROM wanted THEN
       RAISE EXCEPTION 'A mapping in this group already has different time slots. End it and create the group again' USING ERRCODE='40001'; END IF;
   END LOOP;
   SELECT 'Trainer is already allocated to '||COALESCE(p2.name,'another program')||' Section '||COALESCE(ps2.section,'?')||' (Sem '||COALESCE(ps2.semester::text,'?')||') at '
       ||to_char(os.start_time,'HH24:MI')||'-'||to_char(os.end_time,'HH24:MI')
     INTO conflict
     FROM public.organization_staff_assignments gm
     CROSS JOIN (SELECT coalesce(s->>'start_time',s->>'startTime')::time AS st,coalesce(s->>'end_time',s->>'endTime')::time AS et
                 FROM jsonb_array_elements(p_payload->'time_slots') s) ns
     JOIN public.organization_staff_assignments oa ON oa.staff_id=gm.staff_id AND oa.is_active AND oa.id<>ALL(mids)
       AND coalesce(gm.end_date,'infinity'::date)>=oa.start_date AND gm.start_date<=coalesce(oa.end_date,'infinity'::date)
     JOIN public.assignment_time_slots os ON os.assignment_id=oa.id
     LEFT JOIN public.programs p2 ON p2.id=oa.program_id
     LEFT JOIN public.program_sections ps2 ON ps2.id=oa.section_id
     WHERE gm.id=ANY(mids) AND ns.st<os.end_time AND os.start_time<ns.et
     LIMIT 1;
   IF conflict IS NOT NULL THEN RAISE EXCEPTION '%',conflict USING ERRCODE='40001'; END IF;
   INSERT INTO public.assignment_time_slots(assignment_id,start_time,end_time)
     SELECT m2,q.st,q.et FROM unnest(mids) m2
     CROSS JOIN (SELECT coalesce(s->>'start_time',s->>'startTime')::time AS st,coalesce(s->>'end_time',s->>'endTime')::time AS et
                 FROM jsonb_array_elements(p_payload->'time_slots') s) q
     WHERE NOT EXISTS(SELECT 1 FROM public.assignment_time_slots x WHERE x.assignment_id=m2);
   gid:=gen_random_uuid();
   PERFORM set_config('rareminds.combined_group_mapping_op',gid::text,true);
   UPDATE public.organization_staff_assignments SET combined_class_group_id=gid,assignment_version=assignment_version+1 WHERE id=ANY(mids);
   PERFORM set_config('rareminds.combined_group_mapping_op','',true);
   RETURN jsonb_build_object('groupId',gid,'mappingIds',to_jsonb(mids));
 END IF;

 -- SP Admin: end every active mapping of a combined group (same fields as end_mapping)
 IF p_action='end_mapping_group' THEN
   IF NOT public.external_teaching_platform_admin(p_actor) THEN RAISE EXCEPTION 'Platform administration required' USING ERRCODE='42501'; END IF;
   IF nullif(trim(p_payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Reason required'; END IF;
   gid:=(p_payload->>'groupId')::uuid;
   PERFORM 1 FROM public.organization_staff_assignments WHERE combined_class_group_id=gid AND is_active ORDER BY id FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Combined group not found' USING ERRCODE='P0002'; END IF;
   UPDATE public.organization_staff_assignments SET is_active=false,end_date=(p_payload->>'endDate')::date,
     ended_by=p_actor,ended_reason=p_payload->>'reason',assignment_version=assignment_version+1
   WHERE combined_class_group_id=gid AND is_active;
   GET DIAGNOSTICS n=ROW_COUNT;
   RETURN jsonb_build_object('ended',true,'groupId',gid,'count',n);
 END IF;

 -- College admin: the approved groups of this college that can be scheduled on the date (every mapping valid for the course)
 IF p_action='combined_groups' THEN
   col:=(p_payload->>'collegeId')::uuid; dayval:=(p_payload->>'date')::date;
   IF NOT public.external_teaching_college_admin(p_actor,col) THEN RAISE EXCEPTION 'College administration required' USING ERRCODE='42501'; END IF;
   RETURN coalesce((SELECT jsonb_agg(to_jsonb(g) ORDER BY g."courseTitle",g."staffName") FROM (
     SELECT m.combined_class_group_id AS "groupId",s.id AS "staffId",s.first_name||' '||s.last_name AS "staffName",c.course_id AS "courseId",c.title AS "courseTitle",
       jsonb_agg(jsonb_build_object('mappingId',m.id,'mappingVersion',m.assignment_version,'sectionId',ps.id,'departmentName',dp.name,'programName',p.name,
         'specializations',to_jsonb(p.specializations),'semester',ps.semester,'section',ps.section,'academicYear',ps.academic_year,
         'startDate',m.start_date,'endDate',m.end_date,
         'timeSlots',coalesce((SELECT jsonb_agg(jsonb_build_object('start_time',to_char(ts.start_time,'HH24:MI'),'end_time',to_char(ts.end_time,'HH24:MI')) ORDER BY ts.start_time)
            FROM public.assignment_time_slots ts WHERE ts.assignment_id=m.id),'[]'::jsonb)) ORDER BY ps.id) AS classes
     FROM public.organization_staff_assignments m
     JOIN public.organization_staff s ON s.id=m.staff_id
     JOIN public.program_sections ps ON ps.id=m.section_id
     JOIN public.programs p ON p.id=ps.program_id
     JOIN public.departments dp ON dp.id=m.department_id
     JOIN public.courses c ON m.assigned_courses @> jsonb_build_array(c.course_id::text)
     WHERE m.combined_class_group_id IS NOT NULL AND m.is_active AND m.college_id=col
     GROUP BY m.combined_class_group_id,s.id,s.first_name,s.last_name,c.course_id,c.title
     HAVING count(*)>=2 AND bool_and(public.external_teaching_mapping_valid(m.id,s.id,col,ps.id,c.course_id,dayval)
        AND public.external_teaching_slot_covers(m.id,dayval,NULL,NULL,c.course_id,ps.id))
   ) g),'[]'::jsonb);
 END IF;

 ----------------------------------------------------------------------------------------------------------------
 IF p_action='create_combined_session' THEN
   cid:=(p_payload->>'courseId')::uuid; dayval:=(p_payload->>'date')::date;
   stime:=(p_payload->>'startTime')::time; etime:=(p_payload->>'endTime')::time; reqid:=(p_payload->>'requestId')::uuid;
   IF etime<=stime THEN RAISE EXCEPTION 'Invalid session interval'; END IF;
   SELECT array_agg((x->>'mappingId')::uuid ORDER BY o) INTO mids FROM jsonb_array_elements(p_payload->'mappings') WITH ORDINALITY t(x,o);
   n:=coalesce(array_length(mids,1),0);
   IF n<2 OR n>10 OR n<>(SELECT count(DISTINCT x) FROM unnest(mids) x) THEN
     RAISE EXCEPTION 'A combined session needs 2 to 10 different class mappings'; END IF;
   -- only an SP Admin approved group can be scheduled, and exactly its class set, within one college
   agid:=(p_payload->>'approvedGroupId')::uuid;
   IF agid IS NULL THEN RAISE EXCEPTION 'Choose an approved combined group' USING ERRCODE='22023'; END IF;
   IF (SELECT array_agg(a.id ORDER BY a.id) FROM public.organization_staff_assignments a
        WHERE a.combined_class_group_id=agid AND a.is_active AND a.assigned_courses @> jsonb_build_array(cid::text))
      IS DISTINCT FROM (SELECT array_agg(x ORDER BY x) FROM unnest(mids) x) THEN
     RAISE EXCEPTION 'The classes must be exactly the approved combined group. Refresh and try again' USING ERRCODE='40001'; END IF;
   IF (SELECT count(DISTINCT college_id) FROM public.organization_staff_assignments WHERE id=ANY(mids))>1 THEN
     RAISE EXCEPTION 'All classes of a combined session must belong to one college' USING ERRCODE='42501'; END IF;
   -- lock the mappings in a fixed order (no deadlocks); every id must exist
   PERFORM 1 FROM public.organization_staff_assignments WHERE id=ANY(mids) ORDER BY id FOR SHARE;
   IF (SELECT count(*) FROM public.organization_staff_assignments WHERE id=ANY(mids))<>n THEN
     RAISE EXCEPTION 'Invalid course mapping' USING ERRCODE='42501'; END IF;
   -- 1) validate EVERY class first, with the same checks as create_session
   FOR i IN 1..n LOOP
     mid:=mids[i];
     SELECT * INTO STRICT m FROM public.organization_staff_assignments WHERE id=mid;
     IF i=1 THEN st:=m.staff_id; END IF;
     IF m.staff_id<>st THEN RAISE EXCEPTION 'All classes must belong to the same trainer' USING ERRCODE='42501'; END IF;
     IF NOT public.external_teaching_college_admin(p_actor,m.college_id)
        OR NOT public.external_teaching_mapping_valid(mid,m.staff_id,m.college_id,m.section_id,cid,dayval) THEN
       RAISE EXCEPTION 'Invalid course mapping' USING ERRCODE='42501'; END IF;
     IF m.assignment_version<>(p_payload->'mappings'->(i-1)->>'mappingVersion')::integer THEN
       RAISE EXCEPTION 'Stale mapping revision' USING ERRCODE='40001'; END IF;
     IF NOT public.external_teaching_slot_covers(mid,dayval,stime,etime,cid,m.section_id) THEN
       RAISE EXCEPTION 'No trainer time slot covers this session' USING ERRCODE='40001'; END IF;
     -- a combined session has one time for every class, so it must fit inside one of the shared slots (not merely touch one)
     IF EXISTS(SELECT 1 FROM public.assignment_time_slots s WHERE s.assignment_id=mid)
        AND NOT EXISTS(SELECT 1 FROM public.assignment_time_slots s WHERE s.assignment_id=mid AND s.start_time<=stime AND s.end_time>=etime) THEN
       RAISE EXCEPTION 'The session must fit inside one of the trainer time slots' USING ERRCODE='40001'; END IF;
   END LOOP;
   -- same per-trainer lock as create_session, so single and combined creates queue together
   PERFORM pg_advisory_xact_lock(hashtextextended('external-staff:'||st::text,0));
   -- 2) safe retry: one derived request id per class
   SELECT array_agg(md5(reqid::text||':'||x::text)::uuid ORDER BY o) INTO derived FROM unnest(mids) WITH ORDINALITY t(x,o);
   SELECT count(*) INTO found_n FROM public.college_attendance_sessions WHERE created_by=p_actor AND creation_request_id=ANY(derived);
   IF found_n=n THEN
     IF EXISTS(SELECT 1 FROM public.college_attendance_sessions WHERE created_by=p_actor AND creation_request_id=ANY(derived)
         AND (lms_course_id<>cid OR date<>dayval OR start_time<>stime OR end_time<>etime)) THEN
       RAISE EXCEPTION 'Creation reference already used' USING ERRCODE='40001'; END IF;
     SELECT jsonb_build_object('groupId',min(combined_group_id::text)::uuid,'sessions',jsonb_agg(to_jsonb(x) ORDER BY x.program_section_id))
       INTO item FROM public.college_attendance_sessions x WHERE x.created_by=p_actor AND x.creation_request_id=ANY(derived);
     RETURN item;
   ELSIF found_n>0 THEN RAISE EXCEPTION 'Creation reference already used' USING ERRCODE='40001'; END IF;
   -- 3) booking check ONCE, before any sibling exists (so no "same group" exemption is needed)
   IF EXISTS(SELECT 1 FROM public.college_attendance_sessions WHERE organization_staff_id=st AND date=dayval AND status<>'cancelled'
       AND start_time<etime AND end_time>stime) THEN RAISE EXCEPTION 'Trainer is already booked' USING ERRCODE='40001'; END IF;
   -- 4) one session per class, all sharing one new group id
   gid:=gen_random_uuid();
   FOR i IN 1..n LOOP
     mid:=mids[i];
     SELECT * INTO STRICT m FROM public.organization_staff_assignments WHERE id=mid;
     SELECT * INTO STRICT ps FROM public.program_sections WHERE id=m.section_id;
     INSERT INTO public.college_attendance_sessions(college_id,department_id,program_id,program_section_id,department_name,program_name,semester,section,academic_year,
       date,start_time,end_time,subject_name,subject_code,faculty_name,room_number,remarks,created_by,instructor_source,lms_course_id,staff_assignment_id,
       organization_staff_id,original_organization_staff_id,assignment_version_at_creation,creation_request_id,combined_group_id)
     SELECT m.college_id,m.department_id,m.program_id,m.section_id,d.name,p.name,ps.semester,ps.section,ps.academic_year,
       dayval,stime,etime,c.title,c.code,s.first_name||' '||s.last_name,p_payload->>'room',p_payload->>'remarks',p_actor,'platform_staff',cid,mid,
       m.staff_id,m.staff_id,m.assignment_version,derived[i],gid
     FROM public.departments d,public.programs p,public.courses c,public.organization_staff s
     WHERE d.id=m.department_id AND p.id=m.program_id AND c.course_id=cid AND s.id=m.staff_id RETURNING * INTO ss;
     -- same roster rule as create_session (class + optional specialization filter)
     INSERT INTO public.college_attendance_records(session_id,learner_id,learner_name,roll_number,department_name,program_name,program_id,semester,section,date,status,
       subject_name,subject_code,faculty_name,college_id,organization_staff_id)
     SELECT ss.id,l.id,l.name,coalesce(l.roll_number,''),ss.department_name,ss.program_name,ss.program_id,ss.semester,ss.section,ss.date,NULL,
       ss.subject_name,ss.subject_code,ss.faculty_name,ss.college_id,m.staff_id FROM public.learners l
     WHERE l.college_id=m.college_id AND l.program_id=m.program_id AND l.semester=ps.semester AND l.section=ps.section AND NOT coalesce(l.is_deleted,false)
       AND (jsonb_array_length(coalesce(m.metadata->'specializations','[]'))=0 OR m.metadata->'specializations' @> jsonb_build_array(l.specialization));
     UPDATE public.college_attendance_sessions SET total_learners=(SELECT count(*) FROM public.college_attendance_records WHERE session_id=ss.id)
       WHERE id=ss.id RETURNING * INTO ss;
     acc:=acc||to_jsonb(ss);
   END LOOP;
   RETURN jsonb_build_object('groupId',gid,'sessions',acc);
 END IF;

 ----------------------------------------------------------------------------------------------------------------
 -- every other action works on an existing group
 gid:=(p_payload->>'groupId')::uuid;
 SELECT array_agg(id ORDER BY id) INTO ids FROM public.college_attendance_sessions WHERE combined_group_id=gid AND instructor_source='platform_staff';
 IF ids IS NULL THEN RAISE EXCEPTION 'Combined session not found' USING ERRCODE='P0002'; END IF;
 PERFORM 1 FROM public.college_attendance_sessions WHERE id=ANY(ids) ORDER BY id FOR UPDATE;

 IF p_action IN ('cancel_combined_session','replace_combined_session','mark_combined_staff') THEN
   IF NOT public.external_teaching_platform_admin(p_actor) THEN RAISE EXCEPTION 'Platform administration required' USING ERRCODE='42501'; END IF;
   -- the caller must have seen the whole group, and every sibling version must be current
   SELECT array_agg((x->>'sessionId')::uuid ORDER BY (x->>'sessionId')::uuid) INTO req FROM jsonb_array_elements(p_payload->'sessions') x;
   IF req IS DISTINCT FROM ids THEN RAISE EXCEPTION 'Combined session changed. Refresh and try again' USING ERRCODE='40001'; END IF;
   FOR r IN SELECT * FROM public.college_attendance_sessions WHERE id=ANY(ids) ORDER BY id LOOP
     ver:=(SELECT (x->>'version')::integer FROM jsonb_array_elements(p_payload->'sessions') x WHERE (x->>'sessionId')::uuid=r.id);
     IF r.version<>ver THEN RAISE EXCEPTION 'Stale session revision' USING ERRCODE='40001'; END IF;
   END LOOP;

   IF p_action='mark_combined_staff' THEN
     IF p_payload->>'status' IS NULL OR p_payload->>'status' NOT IN ('present','absent','late','excused')
        OR EXISTS(SELECT 1 FROM public.college_attendance_sessions WHERE id=ANY(ids) AND (status='cancelled' OR date>today)) THEN
       RAISE EXCEPTION 'Invalid educator attendance'; END IF;
     FOR r IN SELECT * FROM public.college_attendance_sessions WHERE id=ANY(ids) ORDER BY id LOOP
       INSERT INTO public.organization_staff_attendence(organization_staff_id,date,status,session_id,organization_id,marked_by,marked_at,remarks)
       VALUES(r.organization_staff_id,r.date,p_payload->>'status',r.id,r.college_id,p_actor,now(),p_payload->>'reason')
       ON CONFLICT (organization_staff_id,session_id) WHERE session_id IS NOT NULL
       DO UPDATE SET status=EXCLUDED.status,marked_by=EXCLUDED.marked_by,marked_at=now(),remarks=EXCLUDED.remarks,updated_at=now();
       UPDATE public.college_attendance_sessions SET version=version+1 WHERE id=r.id;
     END LOOP;
     RETURN jsonb_build_object('updated',true,'groupId',gid);
   END IF;

   IF nullif(trim(p_payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION 'Reason required'; END IF;
   IF EXISTS(SELECT 1 FROM public.college_attendance_sessions WHERE id=ANY(ids) AND (status IN ('completed','cancelled') OR locked_at IS NOT NULL)) THEN
     RAISE EXCEPTION 'Session history cannot be reassigned'; END IF;

   IF p_action='cancel_combined_session' THEN
     PERFORM set_config('rareminds.combined_group_op',gid::text,true);
     UPDATE public.college_attendance_sessions SET status='cancelled',remarks=p_payload->>'reason',version=version+1 WHERE id=ANY(ids);
     PERFORM set_config('rareminds.combined_group_op','',true);
     RETURN jsonb_build_object('cancelled',true,'groupId',gid,'count',array_length(ids,1));
   END IF;

   -- replace_combined_session: the whole group moves to one new trainer
   SELECT * INTO STRICT ss FROM public.college_attendance_sessions WHERE id=ids[1];
   oldst:=ss.organization_staff_id; dayval:=ss.date; stime:=ss.start_time; etime:=ss.end_time; cid:=ss.lms_course_id;
   IF EXISTS(SELECT 1 FROM public.college_attendance_sessions WHERE id=ANY(ids) AND (organization_staff_id<>oldst OR date<>dayval
        OR start_time<>stime OR end_time<>etime OR lms_course_id<>cid)) THEN
     RAISE EXCEPTION 'Combined session is inconsistent and cannot be replaced as a group'; END IF;
   SELECT array_agg(x::uuid) INTO mids FROM jsonb_array_elements_text(p_payload->'mappingIds') x;
   n:=coalesce(array_length(mids,1),0);
   IF n<>array_length(ids,1) OR n<>(SELECT count(DISTINCT x) FROM unnest(mids) x) THEN
     RAISE EXCEPTION 'Replacement needs one different mapping for every class of the group'; END IF;
   IF (SELECT count(DISTINCT staff_id) FROM public.organization_staff_assignments WHERE id=ANY(mids))<>1
      OR (SELECT count(*) FROM public.organization_staff_assignments WHERE id=ANY(mids))<>n THEN
     RAISE EXCEPTION 'Replacement mappings must belong to one trainer'; END IF;
   SELECT staff_id INTO STRICT newst FROM public.organization_staff_assignments WHERE id=mids[1];
   IF newst=oldst THEN RAISE EXCEPTION 'Choose a different trainer'; END IF;
   FOR r IN SELECT * FROM public.college_attendance_sessions WHERE id=ANY(ids) ORDER BY id LOOP
     SELECT a.id INTO mid FROM public.organization_staff_assignments a WHERE a.id=ANY(mids) AND a.section_id=r.program_section_id;
     IF mid IS NULL OR NOT public.external_teaching_mapping_valid(mid,newst,r.college_id,r.program_section_id,r.lms_course_id,r.date) THEN
       RAISE EXCEPTION 'Replacement mapping is not valid'; END IF;
   END LOOP;
   PERFORM pg_advisory_xact_lock(hashtextextended('external-staff:'||least(oldst::text,newst::text),0));
   PERFORM pg_advisory_xact_lock(hashtextextended('external-staff:'||greatest(oldst::text,newst::text),0));
   -- the new trainer must be free; the group's own rows are ignored (they are moving together)
   IF EXISTS(SELECT 1 FROM public.college_attendance_sessions WHERE organization_staff_id=newst AND date=dayval AND id<>ALL(ids)
       AND status<>'cancelled' AND start_time<etime AND end_time>stime) THEN
     RAISE EXCEPTION 'Replacement trainer is booked' USING ERRCODE='40001'; END IF;
   PERFORM set_config('rareminds.combined_group_op',gid::text,true);
   FOR r IN SELECT * FROM public.college_attendance_sessions WHERE id=ANY(ids) ORDER BY id LOOP
     SELECT a.id INTO mid FROM public.organization_staff_assignments a WHERE a.id=ANY(mids) AND a.section_id=r.program_section_id;
     UPDATE public.college_attendance_sessions SET organization_staff_id=newst,staff_assignment_id=mid,
       faculty_name=(SELECT first_name||' '||last_name FROM public.organization_staff WHERE id=newst),
       instructor_changes=instructor_changes||jsonb_build_array(jsonb_build_object('staffId',r.organization_staff_id,
         'staffAttendance',(SELECT a.status FROM public.organization_staff_attendence a WHERE a.session_id=r.id AND a.organization_staff_id=r.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),
         'attendanceMarkedBy',(SELECT a.marked_by FROM public.organization_staff_attendence a WHERE a.session_id=r.id AND a.organization_staff_id=r.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),
         'attendanceMarkedAt',(SELECT a.marked_at FROM public.organization_staff_attendence a WHERE a.session_id=r.id AND a.organization_staff_id=r.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),
         'attendanceRemarks',(SELECT a.remarks FROM public.organization_staff_attendence a WHERE a.session_id=r.id AND a.organization_staff_id=r.organization_staff_id ORDER BY a.marked_at DESC LIMIT 1),
         'mappingId',r.staff_assignment_id,'actor',p_actor,'reason',p_payload->>'reason','at',now())),
       reassigned_by=p_actor,reassigned_at=now(),replacement_reason=p_payload->>'reason',version=version+1 WHERE id=r.id;
   END LOOP;
   PERFORM set_config('rareminds.combined_group_op','',true);
   RETURN jsonb_build_object('updated',true,'groupId',gid);
 END IF;

 ----------------------------------------------------------------------------------------------------------------
 -- mark_combined_learners: one or more classes of the group, all or nothing
 st:=public.external_teaching_staff(p_actor);
 IF jsonb_typeof(p_payload->'sessions')<>'array' OR jsonb_array_length(p_payload->'sessions')=0 THEN
   RAISE EXCEPTION 'Choose the classes to mark'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'sessions') LOOP
   SELECT * INTO STRICT ss FROM public.college_attendance_sessions WHERE id=(item->>'sessionId')::uuid AND combined_group_id=gid;
   IF NOT (public.external_teaching_college_admin(p_actor,ss.college_id) OR (st IS NOT NULL AND st=ss.organization_staff_id
        AND public.external_teaching_mapping_valid(ss.staff_assignment_id,st,ss.college_id,ss.program_section_id,ss.lms_course_id,ss.date)
        AND EXISTS(SELECT 1 FROM public.organization_staff_assignments WHERE id=ss.staff_assignment_id AND (end_date IS NULL OR end_date>=today OR public.external_teaching_retains_expired(st))))) THEN
     RAISE EXCEPTION 'Session not assigned to educator' USING ERRCODE='42501'; END IF;
   IF ss.version<>(item->>'version')::integer THEN RAISE EXCEPTION 'Stale session revision' USING ERRCODE='40001'; END IF;
   IF ss.status='cancelled' OR ss.locked_at IS NOT NULL OR ss.date>today THEN RAISE EXCEPTION 'Attendance cannot be marked for this session'; END IF;
   IF ss.attendance_revision<>(item->>'attendanceRevision')::integer THEN RAISE EXCEPTION 'Stale attendance revision' USING ERRCODE='40001'; END IF;
   FOR entry IN SELECT value FROM jsonb_array_elements(item->'records') LOOP
     IF entry->>'status' IS NULL OR entry->>'status' NOT IN ('present','absent','late','excused') THEN RAISE EXCEPTION 'Invalid attendance status'; END IF;
     UPDATE public.college_attendance_records SET revision_history=revision_history||jsonb_build_array(jsonb_build_object('status',status,'markedBy',marked_by,'at',marked_at)),
       status=entry->>'status',marked_by=p_actor,marked_by_staff_id=st,organization_staff_id=ss.organization_staff_id,faculty_name=ss.faculty_name,marked_at=now(),version=version+1
       WHERE session_id=ss.id AND learner_id=(entry->>'learnerId')::uuid;
     IF NOT FOUND THEN RAISE EXCEPTION 'Learner is not in session roster' USING ERRCODE='42501'; END IF;
   END LOOP;
   UPDATE public.college_attendance_sessions SET attendance_revision=attendance_revision+1,version=version+1,
     present_count=(SELECT count(*) FROM public.college_attendance_records WHERE session_id=ss.id AND status='present'),
     absent_count=(SELECT count(*) FROM public.college_attendance_records WHERE session_id=ss.id AND status='absent'),
     late_count=(SELECT count(*) FROM public.college_attendance_records WHERE session_id=ss.id AND status='late'),
     excused_count=(SELECT count(*) FROM public.college_attendance_records WHERE session_id=ss.id AND status='excused'),
     status=CASE WHEN EXISTS(SELECT 1 FROM public.college_attendance_records WHERE session_id=ss.id AND status IS NULL) THEN 'ongoing' ELSE 'completed' END
     WHERE id=ss.id RETURNING * INTO ss;
   acc:=acc||to_jsonb(ss);
 END LOOP;
 RETURN jsonb_build_object('updated',true,'groupId',gid,'sessions',acc);
END $$;

REVOKE ALL ON FUNCTION public.external_educator_combined_action(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.external_educator_combined_action(uuid,text,jsonb) TO service_role;

COMMIT;
