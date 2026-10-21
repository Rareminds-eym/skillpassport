-- Depends on the staff attendance split (20270113000000).
BEGIN;
CREATE OR REPLACE FUNCTION public.unmarked_educator_attendance_sessions(p_actor uuid,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 1000)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF p_actor IS NULL OR NOT public.external_teaching_platform_admin(p_actor) THEN
  RAISE EXCEPTION 'Platform administration required' USING ERRCODE='42501';
 END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.session_id) FROM (
  SELECT s.id AS session_id,s.organization_staff_id AS staff_id,s.version AS session_version,
   st.employee_id,st.first_name||' '||st.last_name AS educator_name,o.name AS organization,
   s.subject_name AS course,s.date,s.start_time,s.end_time,''::text AS status,''::text AS reason
  FROM public.college_attendance_sessions s
  JOIN public.organization_staff st ON st.id=s.organization_staff_id
  LEFT JOIN public.organizations o ON o.id=s.college_id
  WHERE s.instructor_source='platform_staff' AND s.status<>'cancelled' AND s.locked_at IS NULL
   AND s.date<=(now() AT TIME ZONE 'Asia/Kolkata')::date
   AND (p_after IS NULL OR s.id>p_after)
   AND NOT EXISTS(SELECT 1 FROM public.organization_staff_attendence a WHERE a.session_id=s.id AND a.organization_staff_id=s.organization_staff_id)
  ORDER BY s.id LIMIT greatest(1,least(coalesce(p_limit,1000),1000))
 ) t),'[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.import_unmarked_educator_attendance(
 p_actor uuid,p_session uuid,p_staff uuid,p_version integer,p_status text,p_reason text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE s public.college_attendance_sessions%ROWTYPE; inserted integer;
BEGIN
 IF p_actor IS NULL OR NOT public.external_teaching_platform_admin(p_actor) THEN
  RAISE EXCEPTION 'Platform administration required' USING ERRCODE='42501';
 END IF;
 IF p_status IS NULL OR p_status NOT IN ('present','absent','late','excused') THEN RAISE EXCEPTION 'Status must be present, absent, late or excused'; END IF;
 SELECT * INTO s FROM public.college_attendance_sessions WHERE id=p_session AND instructor_source='platform_staff' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Session not found' USING ERRCODE='P0002'; END IF;
 IF s.organization_staff_id IS DISTINCT FROM p_staff THEN
  RETURN jsonb_build_object('skipped',true,'message','Assigned educator changed; download a fresh template.');
 END IF;
 IF EXISTS(SELECT 1 FROM public.organization_staff_attendence WHERE session_id=s.id AND organization_staff_id=p_staff) THEN
  RETURN jsonb_build_object('skipped',true,'message','Attendance already marked; existing mark preserved.');
 END IF;
 IF p_version IS NULL OR s.version<>p_version OR s.status='cancelled' OR s.locked_at IS NOT NULL
  OR s.date>(now() AT TIME ZONE 'Asia/Kolkata')::date THEN
  RETURN jsonb_build_object('skipped',true,'message','Session changed or is ineligible; download a fresh template.');
 END IF;
 INSERT INTO public.organization_staff_attendence(organization_staff_id,date,status,session_id,organization_id,marked_by,marked_at,remarks)
 VALUES(p_staff,s.date,p_status,s.id,s.college_id,p_actor,now(),nullif(trim(p_reason),''))
 ON CONFLICT (organization_staff_id,session_id) WHERE session_id IS NOT NULL DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted=0 THEN RETURN jsonb_build_object('skipped',true,'message','Attendance already marked; existing mark preserved.'); END IF;
 UPDATE public.college_attendance_sessions SET version=version+1 WHERE id=s.id;
 RETURN jsonb_build_object('skipped',false,'message','Attendance marked.');
END $$;
REVOKE ALL ON FUNCTION public.unmarked_educator_attendance_sessions(uuid,uuid,integer),public.import_unmarked_educator_attendance(uuid,uuid,uuid,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.unmarked_educator_attendance_sessions(uuid,uuid,integer),public.import_unmarked_educator_attendance(uuid,uuid,uuid,integer,text,text) TO service_role;
COMMIT;
