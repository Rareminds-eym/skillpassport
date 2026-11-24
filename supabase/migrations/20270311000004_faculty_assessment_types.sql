BEGIN;

CREATE OR REPLACE FUNCTION public.create_college_assessment_type(p_actor uuid,p_course uuid,p_program uuid,p_name text,p_description text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE org uuid; actor_role text; item public.assessment_types;
BEGIN
  SELECT u."organizationId",u.role::text INTO org,actor_role FROM public.users u
    WHERE u.id=p_actor AND coalesce(u."isActive",false);
  IF NOT FOUND OR org IS NULL THEN RAISE EXCEPTION 'Active college affiliation required' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.college_course_mappings m JOIN public.college_courses c ON c.id=m.course_id
    WHERE m.course_id=p_course AND m.program_id=p_program AND c.college_id=org AND c.is_active AND NOT m.is_locked
    AND (actor_role = 'college_admin' OR (m.faculty_access='edit' AND (m.faculty_id=p_actor OR EXISTS(
      SELECT 1 FROM public.college_lecturers l WHERE l.id=m.faculty_id AND l.user_id=p_actor AND l."collegeId"=org))))) THEN
    RAISE EXCEPTION 'Edit permission on an assigned college course is required' USING ERRCODE='42501';
  END IF;
  p_name:=trim(p_name);
  IF length(coalesce(p_name,'')) NOT BETWEEN 1 AND 100 OR length(coalesce(p_description,''))>1000 THEN
    RAISE EXCEPTION 'Enter a name up to 100 characters and description up to 1000 characters' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(org::text||':assessment:'||lower(p_name),0));
  SELECT * INTO item FROM public.assessment_types WHERE lower(trim(name))=lower(p_name) AND is_active
    AND (institution_id IS NULL OR (institution_id=org AND institution_type='college')) ORDER BY institution_id NULLS LAST LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO public.assessment_types(name,description,institution_id,institution_type,is_active)
      VALUES(p_name,trim(coalesce(p_description,'')),org,'college',true) RETURNING * INTO item;
  END IF;
  RETURN jsonb_build_object('id',item.id,'name',item.name,'description',item.description);
END;
$$;
REVOKE ALL ON FUNCTION public.create_college_assessment_type(uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_college_assessment_type(uuid,uuid,uuid,text,text) TO service_role;

COMMIT;
