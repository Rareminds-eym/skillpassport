-- Trainer-session bulk import updates the existing roster atomically; no new tables.
BEGIN;
CREATE OR REPLACE FUNCTION public.import_training_attendance_records(
 p_session_id uuid, p_records jsonb, p_marked_by uuid, p_version integer, p_attendance_revision integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE s public.college_attendance_sessions%ROWTYPE; payload jsonb; result jsonb; n integer;
BEGIN
 SELECT * INTO STRICT s FROM public.college_attendance_sessions WHERE id=p_session_id AND instructor_source='platform_staff' FOR UPDATE;
 IF NOT public.external_teaching_college_admin(p_marked_by,s.college_id) THEN
  RAISE EXCEPTION 'College administration required' USING ERRCODE='42501';
 END IF;
 IF s.version<>p_version OR s.attendance_revision<>p_attendance_revision OR s.status IN ('completed','cancelled') OR s.locked_at IS NOT NULL THEN
  RAISE EXCEPTION 'Session changed, locked or already marked' USING ERRCODE='40001';
 END IF;
 IF EXISTS(SELECT 1 FROM public.college_attendance_records WHERE session_id=s.id AND status IS NOT NULL) THEN
  RAISE EXCEPTION 'Attendance already marked; re-upload is not allowed' USING ERRCODE='40001';
 END IF;
 SELECT count(*) INTO n FROM public.college_attendance_records WHERE session_id=s.id;
 IF jsonb_typeof(p_records)<>'array' OR jsonb_array_length(p_records)<>n OR n=0 OR n>2000 THEN
  RAISE EXCEPTION 'Import must include the complete session roster';
 END IF;
 IF (SELECT count(DISTINCT r->>'learner_id') FROM jsonb_array_elements(p_records) r)<>n OR EXISTS(
  SELECT 1 FROM jsonb_array_elements(p_records) r WHERE NOT EXISTS(
   SELECT 1 FROM public.college_attendance_records a WHERE a.session_id=s.id AND a.learner_id=(r->>'learner_id')::uuid)
   OR r->>'status' IS NULL OR r->>'status' NOT IN ('present','absent','late','excused')
   OR (r->>'status'='excused' AND nullif(trim(r->>'remarks'),'') IS NULL)
 ) THEN RAISE EXCEPTION 'Invalid or duplicate learner attendance'; END IF;
 SELECT jsonb_agg(jsonb_build_object('learnerId',r->>'learner_id','status',r->>'status')) INTO payload FROM jsonb_array_elements(p_records) r;
 result:=public.external_educator_action(p_marked_by,'mark_learners',jsonb_build_object(
  'sessionId',s.id,'version',p_version,'attendanceRevision',p_attendance_revision,'records',payload));
 UPDATE public.college_attendance_records a SET time_in=nullif(r->>'time_in','')::time,
  remarks=nullif(r->>'remarks','')
 FROM jsonb_array_elements(p_records) r WHERE a.session_id=s.id AND a.learner_id=(r->>'learner_id')::uuid;
 RETURN jsonb_build_object('imported',n,'total_learners',n,'present',(result->>'present_count')::integer,
  'absent',(result->>'absent_count')::integer,'late',(result->>'late_count')::integer,
  'excused',(result->>'excused_count')::integer,'attendance_percentage',result->'attendance_percentage');
END;
$$;
REVOKE ALL ON FUNCTION public.import_training_attendance_records(uuid,jsonb,uuid,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.import_training_attendance_records(uuid,jsonb,uuid,integer,integer) TO service_role;
COMMIT;
