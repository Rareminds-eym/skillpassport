-- Confirmed workbook (1): extend existing sessions into combined classes, preserving session IDs/marks.
-- Run after original Soundarya mapping/session seeds, before learner attendance. No SSO writes.
DO $soundarya_confirmed_batch$
BEGIN
LOCK TABLE public.organization_staff_assignments, public.assignment_time_slots,
 public.college_attendance_sessions, public.college_attendance_records IN SHARE ROW EXCLUSIVE MODE;
DO $$
DECLARE e record; base public.college_attendance_sessions%ROWTYPE; a public.organization_staff_assignments%ROWTYPE;
 ps record; mid uuid; mapping_group uuid; event_group uuid; mids uuid[]; n integer;
BEGIN
 FOR e IN SELECT * FROM (VALUES
 ('SES-MBA-013','2026-09-15'::date,'HR',ARRAY['HR','Finance','Marketing','Business Analytics']),
 ('SES-MBA-014','2026-09-16'::date,'HR',ARRAY['HR','Finance','Marketing','Business Analytics']),
 ('SES-MBA-018','2026-09-24'::date,'Finance',ARRAY['Finance','Business Analytics']),
 ('SES-MBA-019','2026-09-25'::date,'Finance',ARRAY['Finance','Business Analytics']),
 ('SES-MBA-020','2026-09-26'::date,'Finance',ARRAY['Finance','Business Analytics'])
 ) v(token,day,anchor,streams) LOOP
  SELECT count(*) INTO n FROM public.college_attendance_sessions s JOIN public.programs p ON p.id=s.program_id
   WHERE s.college_id='284c9ed9-cd13-584d-b5bc-e198866b917b' AND s.remarks LIKE '%('||e.token||')%'
   AND s.date=e.day AND p.specializations=ARRAY[e.anchor] AND s.semester=4 AND s.section='A';
  IF n<>1 THEN RAISE EXCEPTION 'Expected exactly one existing anchor for %, got %',e.token,n; END IF;
  SELECT s.* INTO base FROM public.college_attendance_sessions s JOIN public.programs p ON p.id=s.program_id
   WHERE s.college_id='284c9ed9-cd13-584d-b5bc-e198866b917b' AND s.remarks LIKE '%('||e.token||')%'
   AND s.date=e.day AND p.specializations=ARRAY[e.anchor] AND s.semester=4 AND s.section='A';
  SELECT * INTO STRICT a FROM public.organization_staff_assignments WHERE id=base.staff_assignment_id;
  mapping_group:=md5('soundarya-confirmed-combined-mapping:'||a.id::text)::uuid;
  event_group:=md5('soundarya-confirmed-combined-session:'||e.token)::uuid;
  mids:=ARRAY[]::uuid[];
  FOR ps IN SELECT s.*,p.name AS pname,d.name AS dname,p.specializations FROM public.program_sections s
   JOIN public.programs p ON p.id=s.program_id JOIN public.departments d ON d.id=s.department_id
   WHERE d.college_id=base.college_id AND p.code='MBA' AND p.specializations[1]=ANY(e.streams)
   AND cardinality(p.specializations)=1 AND s.semester=4 AND s.section='A' AND s.status='active'
  LOOP
   IF ps.id=a.section_id THEN mid:=a.id;
   ELSE
    mid:=md5('soundarya-confirmed-combined-mapping:'||a.id::text||':'||ps.id::text)::uuid;
    INSERT INTO public.organization_staff_assignments
     (id,staff_id,college_id,department_id,program_id,section_id,assigned_courses,start_date,end_date,is_active,notes,metadata)
    VALUES(mid,a.staff_id,a.college_id,ps.department_id,ps.program_id,ps.id,a.assigned_courses,a.start_date,a.end_date,true,
     'Soundarya confirmed combined class: '||array_to_string(e.streams,', '),'{"specializations":[]}'::jsonb)
    ON CONFLICT(id) DO NOTHING;
    INSERT INTO public.assignment_time_slots(assignment_id,start_time,end_time)
     SELECT mid,t.start_time,t.end_time FROM public.assignment_time_slots t WHERE t.assignment_id=a.id
     AND NOT EXISTS(SELECT 1 FROM public.assignment_time_slots x WHERE x.assignment_id=mid AND x.start_time=t.start_time AND x.end_time=t.end_time);
   END IF;
   mids:=array_append(mids,mid);
   IF NOT public.external_teaching_mapping_valid(mid,a.staff_id,a.college_id,ps.id,base.lms_course_id,e.day)
      OR NOT public.external_teaching_slot_covers(mid,e.day,base.start_time,base.end_time,base.lms_course_id,ps.id)
    THEN RAISE EXCEPTION 'Invalid combined mapping for % / %',e.token,ps.pname; END IF;
  END LOOP;
  IF cardinality(mids)<>cardinality(e.streams) THEN RAISE EXCEPTION 'Missing stream classes for %',e.token; END IF;
  IF EXISTS(SELECT 1 FROM public.organization_staff_assignments WHERE id=ANY(mids)
    AND combined_class_group_id IS NOT NULL AND combined_class_group_id<>mapping_group)
   THEN RAISE EXCEPTION 'Conflicting mapping group for %',e.token; END IF;
  PERFORM set_config('rareminds.combined_group_mapping_op',mapping_group::text,true);
  UPDATE public.organization_staff_assignments SET combined_class_group_id=mapping_group,assignment_version=assignment_version+1
   WHERE id=ANY(mids) AND combined_class_group_id IS NULL;
  PERFORM set_config('rareminds.combined_group_mapping_op','',true);
  IF base.combined_group_id IS NOT NULL AND base.combined_group_id<>event_group THEN RAISE EXCEPTION 'Conflicting event group for %',e.token; END IF;
  UPDATE public.college_attendance_sessions SET combined_group_id=event_group,version=version+1,updated_at=now()
   WHERE id=base.id AND combined_group_id IS NULL;
  INSERT INTO public.college_attendance_sessions
   (id,college_id,department_id,program_id,program_section_id,department_name,program_name,semester,section,academic_year,
    date,start_time,end_time,subject_name,subject_code,faculty_name,remarks,instructor_source,lms_course_id,staff_assignment_id,
    organization_staff_id,original_organization_staff_id,assignment_version_at_creation,combined_group_id)
  SELECT md5(event_group::text||':'||cls.id::text)::uuid,a.college_id,cls.department_id,cls.program_id,cls.id,d.name,p.name,4,'A',cls.academic_year,
   base.date,base.start_time,base.end_time,base.subject_name,base.subject_code,base.faculty_name,base.remarks,
   base.instructor_source,base.lms_course_id,m.id,base.organization_staff_id,base.original_organization_staff_id,m.assignment_version,event_group
  FROM public.organization_staff_assignments m JOIN public.program_sections cls ON cls.id=m.section_id
   JOIN public.programs p ON p.id=cls.program_id JOIN public.departments d ON d.id=cls.department_id
  WHERE m.id=ANY(mids) AND cls.id<>base.program_section_id
  ON CONFLICT(id) DO NOTHING;
  INSERT INTO public.college_attendance_records
   (session_id,learner_id,learner_name,roll_number,department_name,program_name,program_id,semester,section,date,status,
    subject_name,subject_code,faculty_name,college_id,organization_staff_id)
  SELECT s.id,l.id,l.name,coalesce(l.roll_number,''),s.department_name,s.program_name,s.program_id,4,'A',s.date,NULL,
   s.subject_name,s.subject_code,s.faculty_name,s.college_id,s.organization_staff_id
  FROM public.college_attendance_sessions s JOIN public.learners l ON l.college_id=s.college_id AND l.program_id=s.program_id
   AND l.semester=4 AND l.section='A' AND NOT coalesce(l.is_deleted,false)
  WHERE s.combined_group_id=event_group ON CONFLICT(session_id,learner_id) DO NOTHING;
 END LOOP;
END $$;
-- Populate confirmed new learners in existing matching rosters as well (including older combined events).
CREATE TEMP TABLE soundarya_confirmed_added_roster ON COMMIT DROP AS
WITH added AS (
 INSERT INTO public.college_attendance_records
 (session_id,learner_id,learner_name,roll_number,department_name,program_name,program_id,semester,section,date,status,
 subject_name,subject_code,faculty_name,college_id,organization_staff_id)
 SELECT s.id,l.id,l.name,l.roll_number,s.department_name,s.program_name,s.program_id,s.semester,s.section,s.date,NULL,
 s.subject_name,s.subject_code,s.faculty_name,s.college_id,s.organization_staff_id
 FROM public.college_attendance_sessions s JOIN public.learners l ON l.college_id=s.college_id AND l.program_id=s.program_id
 AND l.semester=s.semester AND l.section=s.section AND NOT coalesce(l.is_deleted,false)
 WHERE s.college_id='284c9ed9-cd13-584d-b5bc-e198866b917b' AND s.remarks LIKE '%(SES-MBA-%'
 AND l.roll_number IN ('P03KU24M016083','P03KU24M015022','P03KU24M015062')
 AND s.status<>'cancelled' AND s.locked_at IS NULL
 ON CONFLICT(session_id,learner_id) DO NOTHING RETURNING session_id
) SELECT DISTINCT session_id FROM added;
-- A newly added unmarked learner makes a previously completed roster incomplete.
UPDATE public.college_attendance_sessions SET status='ongoing',version=version+1,updated_at=now()
WHERE id IN(SELECT session_id FROM soundarya_confirmed_added_roster) AND status='completed' AND locked_at IS NULL;
-- Refresh totals after extending the rosters without changing existing marks or completion state.
UPDATE public.college_attendance_sessions s SET total_learners=t.n
FROM (SELECT session_id,count(*) n FROM public.college_attendance_records GROUP BY session_id) t
WHERE s.id=t.session_id AND s.college_id='284c9ed9-cd13-584d-b5bc-e198866b917b' AND s.total_learners IS DISTINCT FROM t.n;
END;
$soundarya_confirmed_batch$;
