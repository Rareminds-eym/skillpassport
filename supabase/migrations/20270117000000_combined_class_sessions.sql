-- Combined class sessions: group id column, guard trigger and group operations (one migration).
-- SP Admin defines a combined group by tagging the per-class mappings of one external trainer with a shared
-- organization_staff_assignments.combined_class_group_id (action group_mappings). The college admin can only schedule
-- an approved group (combined_groups lists them; create_combined_session needs approvedGroupId and the exact class set).
-- A combined class is stored as one ordinary session row per class (each keeps its own program_section_id,
-- staff_assignment_id and roster). Rows of the same combined class share combined_group_id; single-class sessions keep NULL
-- and behave exactly as before. external_educator_action is NOT changed: the group operations live in their own function.
-- Depends on 20270113000000 (staff attendance split) and the external educator support migration (20270115000000).
--
-- Actions of external_educator_combined_action (service_role only; each call is one transaction, so it is all or nothing):
--   group_mappings            mappingIds[], time_slots[] (SP Admin): tag existing per-class mappings of one trainer as one approved combined group
--                             and give every mapping the same time slots (validated like map; compared only with the trainer's OTHER mappings)
--   end_mapping_group         groupId, endDate, reason (SP Admin): end every active mapping of the group
--   combined_groups           collegeId, date (college admin): approved groups whose mappings are all valid on that date
--   create_combined_session   approvedGroupId, mappings[{mappingId,mappingVersion}], courseId, date, startTime, endTime, requestId, room?, remarks?
--   cancel_combined_session   groupId, sessions[{sessionId,version}] (every sibling), reason
--   replace_combined_session  groupId, sessions[{sessionId,version}] (every sibling), mappingIds[] (new trainer, one per class), reason
--   mark_combined_staff       groupId, sessions[{sessionId,version}] (every sibling), status, reason?
--   mark_combined_learners    groupId, sessions[{sessionId,version,attendanceRevision,records[{learnerId,status}]}] (one or more classes)
-- Trainer swap is not offered for combined sessions (out of scope for version 1).
BEGIN;

ALTER TABLE public.college_attendance_sessions
  ADD COLUMN IF NOT EXISTS combined_group_id uuid;

COMMENT ON COLUMN public.college_attendance_sessions.combined_group_id IS
  'Shared by the sibling session rows (one per class) of one combined class session. NULL for single-class sessions.';

-- Partial index: only combined rows are indexed, so single-class sessions add no index cost.
CREATE INDEX IF NOT EXISTS college_attendance_sessions_combined_group
  ON public.college_attendance_sessions(combined_group_id)
  WHERE combined_group_id IS NOT NULL;

-- A combined group is the set of active mappings that share combined_class_group_id (same trainer and courses). NULL for normal mappings.
ALTER TABLE public.organization_staff_assignments
  ADD COLUMN IF NOT EXISTS combined_class_group_id uuid;

CREATE INDEX IF NOT EXISTS organization_staff_assignments_combined_group
  ON public.organization_staff_assignments(combined_class_group_id)
  WHERE combined_class_group_id IS NOT NULL;

-- Guard: a grouped mapping cannot be edited, relocated or reassigned on its own (those actions create a superseding mapping),
-- and the group tag can only be set or changed by the group actions below (they set rareminds.combined_group_mapping_op).
-- Ending a mapping (is_active/end_date) stays allowed, so a class can still be ended; the approved group then shrinks visibly.
CREATE OR REPLACE FUNCTION public.guard_combined_group_mapping() RETURNS trigger
LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN
 IF TG_OP='INSERT' THEN
   IF NEW.supersedes_assignment_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.organization_staff_assignments o
        WHERE o.id=NEW.supersedes_assignment_id AND o.combined_class_group_id IS NOT NULL) THEN
     RAISE EXCEPTION 'This mapping belongs to a combined group. End the combined group and create a new one.' USING ERRCODE='40001';
   END IF;
   IF NEW.combined_class_group_id IS NOT NULL THEN
     RAISE EXCEPTION 'A mapping can only join a combined group through group_mappings' USING ERRCODE='40001';
   END IF;
   RETURN NEW;
 END IF;
 IF NEW.combined_class_group_id IS DISTINCT FROM OLD.combined_class_group_id THEN
   IF coalesce(current_setting('rareminds.combined_group_mapping_op',true),'')<>coalesce(NEW.combined_class_group_id,OLD.combined_class_group_id)::text THEN
     RAISE EXCEPTION 'The combined group of a mapping can only be changed through the group actions' USING ERRCODE='40001';
   END IF;
 ELSIF OLD.combined_class_group_id IS NOT NULL AND (NEW.staff_id IS DISTINCT FROM OLD.staff_id OR NEW.college_id IS DISTINCT FROM OLD.college_id
      OR NEW.section_id IS DISTINCT FROM OLD.section_id OR NEW.assigned_courses IS DISTINCT FROM OLD.assigned_courses
      OR NEW.start_date IS DISTINCT FROM OLD.start_date) THEN
   RAISE EXCEPTION 'This mapping belongs to a combined group. End the combined group and create a new one.' USING ERRCODE='40001';
 END IF;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_combined_group_mapping_insert ON public.organization_staff_assignments;
CREATE TRIGGER guard_combined_group_mapping_insert BEFORE INSERT ON public.organization_staff_assignments
  FOR EACH ROW EXECUTE FUNCTION public.guard_combined_group_mapping();
DROP TRIGGER IF EXISTS guard_combined_group_mapping_update ON public.organization_staff_assignments;
CREATE TRIGGER guard_combined_group_mapping_update BEFORE UPDATE ON public.organization_staff_assignments
  FOR EACH ROW WHEN (OLD.combined_class_group_id IS NOT NULL OR NEW.combined_class_group_id IS NOT NULL)
  EXECUTE FUNCTION public.guard_combined_group_mapping();

-- Guard: a single sibling cannot be cancelled, moved to another trainer/mapping/class/course/time, or detached from its group
-- by any individual operation (including external_educator_action's cancel_session, replace, swap and reassign_mapping).
-- The group functions below set rareminds.combined_group_op to the group id for their own transaction to pass the guard.
-- Counts, attendance revision, version and status changes other than cancelling stay allowed (student marking uses them).
CREATE OR REPLACE FUNCTION public.guard_combined_session_changes() RETURNS trigger
LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN
 IF coalesce(current_setting('rareminds.combined_group_op',true),'')=OLD.combined_group_id::text THEN RETURN NEW; END IF;
 IF NEW.combined_group_id IS DISTINCT FROM OLD.combined_group_id
    OR NEW.organization_staff_id IS DISTINCT FROM OLD.organization_staff_id
    OR NEW.staff_assignment_id IS DISTINCT FROM OLD.staff_assignment_id
    OR NEW.program_section_id IS DISTINCT FROM OLD.program_section_id
    OR NEW.lms_course_id IS DISTINCT FROM OLD.lms_course_id
    OR NEW.date IS DISTINCT FROM OLD.date
    OR NEW.start_time IS DISTINCT FROM OLD.start_time
    OR NEW.end_time IS DISTINCT FROM OLD.end_time
    OR (NEW.status='cancelled' AND OLD.status IS DISTINCT FROM 'cancelled') THEN
   RAISE EXCEPTION 'This session belongs to a combined class and must be changed as a group' USING ERRCODE='40001';
 END IF;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_combined_session_changes ON public.college_attendance_sessions;
CREATE TRIGGER guard_combined_session_changes BEFORE UPDATE ON public.college_attendance_sessions
  FOR EACH ROW WHEN (OLD.combined_group_id IS NOT NULL) EXECUTE FUNCTION public.guard_combined_session_changes();

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
        AND EXISTS(SELECT 1 FROM public.organization_staff_assignments WHERE id=ss.staff_assignment_id AND (end_date IS NULL OR end_date>=today)))) THEN
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
