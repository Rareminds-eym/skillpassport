BEGIN;

CREATE OR REPLACE FUNCTION public.college_course_workflow(p_actor uuid,p_action text,p_payload jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  org uuid; admin boolean; lecturer uuid; cid uuid; cur public.college_curriculums;
  req jsonb; remaining jsonb; request_actor uuid; request_entity uuid; existing jsonb; proposed jsonb; row jsonb; unit_row jsonb; outcome_row jsonb;
  course_uuid uuid; unit_uuid uuid; result jsonb := '[]'; mapping public.college_course_mappings;
BEGIN
  SELECT u."organizationId",u.role::text = 'college_admin' INTO org,admin FROM public.users u
    WHERE u.id=p_actor AND coalesce(u."isActive",false);
  IF NOT FOUND THEN RAISE EXCEPTION 'Active user required' USING ERRCODE='42501'; END IF;
  SELECT l.id INTO lecturer FROM public.college_lecturers l WHERE l.user_id=p_actor AND l."collegeId"=org LIMIT 1;

  IF p_action='courses' THEN
    RETURN jsonb_build_object('isCollegeEducator',lecturer IS NOT NULL,'courses',coalesce((
      SELECT jsonb_agg(to_jsonb(x)) FROM (
        SELECT DISTINCT c.id AS id,c.course_name AS title,c.course_code AS code,c.description,'institution'::text AS ownership,
          c.college_id, m.program_id,m.semester,
          EXISTS(SELECT 1 FROM public.college_course_mappings em WHERE em.course_id=c.id AND em.program_id=m.program_id
            AND em.faculty_id IN (lecturer,p_actor) AND em.faculty_access='edit') AS can_propose_edits
        FROM public.college_course_mappings m JOIN public.college_courses c ON c.id=m.course_id
        WHERE m.faculty_id IN (lecturer,p_actor) AND c.college_id=org AND c.is_active
        UNION ALL
        SELECT DISTINCT c.course_id,c.title,c.code,c.description,'rareminds',NULL::uuid,NULL::uuid,NULL::integer,false
        FROM public.courses c WHERE c.deleted_at IS NULL AND (
          c.educator_id=p_actor OR EXISTS(SELECT 1 FROM public.course_co_educators ce WHERE ce.course_id=c.course_id AND ce.educator_id=p_actor)
          OR EXISTS(SELECT 1 FROM public.organization_staff s JOIN public.organization_staff_assignments sa ON sa.staff_id=s.id
            WHERE s.user_id=p_actor AND sa.assigned_courses @> jsonb_build_array(c.course_id::text)
            AND public.external_teaching_mapping_valid(sa.id,s.id,sa.college_id,sa.section_id,c.course_id,(now() AT TIME ZONE 'Asia/Kolkata')::date))
        )
      ) x),'[]'::jsonb));
  END IF;

  IF p_action='admin-overview' THEN
    IF NOT coalesce(admin,false) OR org IS NULL THEN RAISE EXCEPTION 'College admin required' USING ERRCODE='42501'; END IF;
    RETURN jsonb_build_object(
      'mappings',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (
        SELECT m.id,m.faculty_access,m.program_id,m.semester,c.course_name,c.course_code,
          concat_ws(' ',l.first_name,l.last_name) AS faculty_name,l.email
        FROM public.college_course_mappings m JOIN public.college_courses c ON c.id=m.course_id
        LEFT JOIN public.college_lecturers l ON (l.id=m.faculty_id OR l.user_id=m.faculty_id) AND l."collegeId"=org
        WHERE c.college_id=org AND m.faculty_id IS NOT NULL ORDER BY c.course_name,m.semester
      ) x),'[]'),
      'requests',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (
        SELECT r->>'id' AS id,cc.id AS curriculum_id,c.course_name,u.email AS requester_email,
          CASE WHEN r->>'change_type' IN ('unit_edit','unit_add') THEN 'unit' ELSE 'outcome' END AS entity_type,
          r->>'change_type' AS change_type,r->'data'->'before' AS before_data,r->'data'->'after' AS proposed_data,r->>'timestamp' AS created_at
        FROM public.college_curriculums cc
        CROSS JOIN LATERAL jsonb_array_elements(coalesce(cc.pending_changes,'[]')) AS changes(r)
        JOIN public.college_courses c ON c.id=cc.course_id
        JOIN public.users u ON u.id=(r->>'requested_by')::uuid
        WHERE cc.college_id=org AND r->>'source'='faculty_course' AND coalesce(r->>'status','pending')='pending'
        ORDER BY r->>'timestamp'
      ) x),'[]'));

  END IF;

  IF p_action='set-access' THEN
    IF NOT coalesce(admin,false) OR p_payload->>'access' NOT IN ('read','edit') THEN RAISE EXCEPTION 'Invalid permission' USING ERRCODE='42501'; END IF;
    UPDATE public.college_course_mappings m SET faculty_access=p_payload->>'access',updated_by=p_actor,updated_at=now()
      FROM public.college_courses c WHERE m.id=(p_payload->>'mappingId')::uuid AND c.id=m.course_id AND c.college_id=org;
    IF NOT FOUND THEN RAISE EXCEPTION 'Mapping not found' USING ERRCODE='42501'; END IF;
    RETURN jsonb_build_object('updated',true);
  END IF;

  IF p_action='import' THEN
    IF NOT coalesce(admin,false) THEN RAISE EXCEPTION 'College admin required' USING ERRCODE='42501'; END IF;
    PERFORM 1 FROM public.programs p JOIN public.departments d ON d.id=p.department_id
      WHERE p.id=(p_payload->>'programId')::uuid AND d.id=(p_payload->>'departmentId')::uuid AND d.college_id=org;
    IF NOT FOUND THEN RAISE EXCEPTION 'Program does not belong to this department and college' USING ERRCODE='42501'; END IF;
    -- Serialize imports in a program, including creation of previously absent rows.
    PERFORM pg_advisory_xact_lock(hashtextextended(org::text||':'||(p_payload->>'programId'),0));
    FOR row IN SELECT value FROM jsonb_array_elements(p_payload->'courses') LOOP
      course_uuid:=NULL;
      SELECT id INTO course_uuid FROM public.college_courses WHERE college_id=org AND course_code=row->>'code' FOR UPDATE;
      IF course_uuid IS NULL THEN
        INSERT INTO public.college_courses(college_id,course_code,course_name,credits,description,created_by)
          VALUES(org,row->>'code',row->>'title',(row->>'credits')::numeric,coalesce(row->>'description',''),p_actor) RETURNING id INTO course_uuid;
      ELSIF EXISTS(SELECT 1 FROM public.college_courses WHERE id=course_uuid
        AND (course_name IS DISTINCT FROM row->>'title' OR credits IS DISTINCT FROM (row->>'credits')::numeric)) THEN
        RAISE EXCEPTION 'Existing course name or credits differ for %. Match the catalogue before importing.',row->>'code' USING ERRCODE='22023';
      END IF;
      SELECT * INTO mapping FROM public.college_course_mappings WHERE course_id=course_uuid
        AND program_id=(p_payload->>'programId')::uuid AND semester=(p_payload->>'semester')::integer FOR UPDATE;
      IF FOUND AND mapping.is_locked THEN RAISE EXCEPTION 'Course mapping is locked: %',row->>'code' USING ERRCODE='22023'; END IF;
      IF NOT FOUND THEN
        INSERT INTO public.college_course_mappings(course_id,program_id,semester,offering_type,created_by)
          VALUES(course_uuid,(p_payload->>'programId')::uuid,(p_payload->>'semester')::integer,'core',p_actor);
      END IF;
      IF EXISTS(SELECT 1 FROM public.college_curriculums WHERE course_id=course_uuid AND program_id=(p_payload->>'programId')::uuid
        AND academic_year=p_payload->>'academicYear') THEN
        RAISE EXCEPTION 'Curriculum already exists for %. Import cancelled; existing content was preserved.',row->>'code' USING ERRCODE='23505';
      END IF;
      INSERT INTO public.college_curriculums(college_id,department_id,program_id,course_id,academic_year,created_by)
        VALUES(org,(p_payload->>'departmentId')::uuid,(p_payload->>'programId')::uuid,course_uuid,p_payload->>'academicYear',p_actor) RETURNING id INTO cid;
      FOR unit_row IN SELECT value FROM jsonb_array_elements(row->'units') LOOP
        INSERT INTO public.college_curriculum_units(curriculum_id,name,code,description,credits,estimated_duration,duration_unit,order_index,created_by)
          VALUES(cid,unit_row->>'name',unit_row->>'code',unit_row->>'description',(unit_row->>'credits')::numeric,
            (unit_row->>'duration')::integer,'hours',(unit_row->>'order')::integer,p_actor) RETURNING id INTO unit_uuid;
        FOR outcome_row IN SELECT value FROM jsonb_array_elements(unit_row->'outcomes') LOOP
          INSERT INTO public.college_curriculum_outcomes(curriculum_id,unit_id,outcome_text,bloom_level,assessment_mappings)
            VALUES(cid,unit_uuid,outcome_row->>'text',outcome_row->>'bloomLevel',coalesce(outcome_row->'assessments','[]'));
        END LOOP;
      END LOOP;
      result:=result||jsonb_build_array(jsonb_build_object('courseId',course_uuid,'curriculumId',cid));
    END LOOP;
    RETURN result;
  END IF;

  IF p_action='propose-add' THEN
    IF lecturer IS NULL OR NOT EXISTS(SELECT 1 FROM public.college_course_mappings m JOIN public.college_courses c ON c.id=m.course_id
      WHERE m.course_id=(p_payload->>'courseId')::uuid AND m.program_id=(p_payload->>'programId')::uuid
      AND m.faculty_id IN(lecturer,p_actor) AND m.faculty_access='edit' AND NOT m.is_locked AND c.college_id=org AND c.is_active) THEN
      RAISE EXCEPTION 'Edit permission on an unlocked assigned course is required' USING ERRCODE='42501'; END IF;
    IF length(trim(coalesce(p_payload->>'academicYear',''))) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Academic year required' USING ERRCODE='22023'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(org::text||':'||(p_payload->>'programId')||':'||(p_payload->>'courseId')||':'||(p_payload->>'academicYear'),0));
    IF p_payload->>'curriculumId' IS NOT NULL THEN
      SELECT * INTO cur FROM public.college_curriculums WHERE id=(p_payload->>'curriculumId')::uuid AND college_id=org
        AND course_id=(p_payload->>'courseId')::uuid AND program_id=(p_payload->>'programId')::uuid AND academic_year=p_payload->>'academicYear' FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Curriculum does not match this course' USING ERRCODE='42501'; END IF;
    ELSE
      SELECT * INTO cur FROM public.college_curriculums WHERE college_id=org AND course_id=(p_payload->>'courseId')::uuid
        AND program_id=(p_payload->>'programId')::uuid AND academic_year=p_payload->>'academicYear' FOR UPDATE;
      IF NOT FOUND THEN
        INSERT INTO public.college_curriculums(college_id,department_id,program_id,course_id,academic_year,created_by)
          SELECT org,p.department_id,p.id,(p_payload->>'courseId')::uuid,p_payload->>'academicYear',p_actor FROM public.programs p
          JOIN public.departments d ON d.id=p.department_id WHERE p.id=(p_payload->>'programId')::uuid AND d.college_id=org RETURNING * INTO cur;
        IF NOT FOUND THEN RAISE EXCEPTION 'Program not found' USING ERRCODE='42501'; END IF;
      END IF;
    END IF;
    IF p_payload->>'entityType'='unit' THEN
      IF length(trim(coalesce(p_payload->>'name',''))) NOT BETWEEN 1 AND 255 OR length(trim(coalesce(p_payload->>'code',''))) NOT BETWEEN 1 AND 50
        OR length(coalesce(p_payload->>'description',''))>10000 OR jsonb_typeof(coalesce(p_payload->'outcomes','[]'))<>'array'
        OR jsonb_array_length(coalesce(p_payload->'outcomes','[]'))>100 THEN RAISE EXCEPTION 'Invalid unit' USING ERRCODE='22023'; END IF;
      IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(coalesce(p_payload->'outcomes','[]')) o WHERE length(trim(o)) NOT BETWEEN 1 AND 10000) THEN RAISE EXCEPTION 'Invalid learning outcome' USING ERRCODE='22023'; END IF;
      IF EXISTS(SELECT 1 FROM public.college_curriculum_units WHERE curriculum_id=cur.id AND lower(code)=lower(trim(p_payload->>'code')))
        OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(cur.pending_changes,'[]')) r WHERE r->>'change_type'='unit_add' AND lower(r->'data'->'after'->>'code')=lower(trim(p_payload->>'code'))) THEN
        RAISE EXCEPTION 'Unit code already exists or awaits approval' USING ERRCODE='23505'; END IF;
      proposed:=jsonb_build_object('name',trim(p_payload->>'name'),'code',trim(p_payload->>'code'),'description',coalesce(p_payload->>'description',''),'outcomes',coalesce(p_payload->'outcomes','[]'));
    ELSIF p_payload->>'entityType'='outcome' THEN
      IF NOT EXISTS(SELECT 1 FROM public.college_curriculum_units WHERE id=(p_payload->>'unitId')::uuid AND curriculum_id=cur.id)
        OR length(trim(coalesce(p_payload->>'outcome_text',''))) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Valid unit and learning outcome required' USING ERRCODE='22023'; END IF;
      proposed:=jsonb_build_object('unit_id',p_payload->>'unitId','outcome_text',trim(p_payload->>'outcome_text'));
    ELSE RAISE EXCEPTION 'Invalid addition type' USING ERRCODE='22023'; END IF;
    course_uuid:=gen_random_uuid();
    req:=jsonb_build_object('id',course_uuid,'source','faculty_course','change_type',CASE WHEN p_payload->>'entityType'='unit' THEN 'unit_add' ELSE 'outcome_add' END,
      'entity_id',gen_random_uuid(),'data',jsonb_build_object('before','{}'::jsonb,'after',proposed),'requested_by',p_actor,
      'requester_name',(SELECT email FROM public.users WHERE id=p_actor),'request_message','Faculty curriculum addition','timestamp',now(),'status','pending');
    UPDATE public.college_curriculums SET pending_changes=coalesce(pending_changes,'[]')||jsonb_build_array(req),has_pending_changes=true,updated_at=now() WHERE id=cur.id;
    RETURN jsonb_build_object('requestId',course_uuid,'curriculumId',cur.id,'status','pending');
  END IF;

  IF p_action='review' THEN
    IF NOT coalesce(admin,false) OR p_payload->>'decision' NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'College admin required' USING ERRCODE='42501'; END IF;
    -- Lock the curriculum before reading or changing its pending/history arrays.
    SELECT cc.* INTO cur FROM public.college_curriculums cc WHERE cc.college_id=org
      AND EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(cc.pending_changes,'[]')) r
        WHERE r->>'id'=p_payload->>'requestId' AND r->>'source'='faculty_course' AND coalesce(r->>'status','pending')='pending')
      FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Request is no longer pending' USING ERRCODE='22023'; END IF;
    SELECT r INTO req FROM jsonb_array_elements(coalesce(cur.pending_changes,'[]')) r
      WHERE r->>'id'=p_payload->>'requestId' AND r->>'source'='faculty_course' AND coalesce(r->>'status','pending')='pending';
    IF req IS NULL THEN RAISE EXCEPTION 'Request is no longer pending' USING ERRCODE='22023'; END IF;
    request_actor:=(req->>'requested_by')::uuid;
    request_entity:=(req->>'entity_id')::uuid;
    IF request_actor=p_actor THEN RAISE EXCEPTION 'Self approval is not allowed' USING ERRCODE='42501'; END IF;
    IF p_payload->>'decision'='approved' THEN
      IF NOT EXISTS(SELECT 1 FROM public.college_course_mappings m JOIN public.college_lecturers l ON m.faculty_id IN(l.id,l.user_id)
        WHERE l.user_id=request_actor AND l."collegeId"=org AND m.course_id=cur.course_id AND m.program_id=cur.program_id AND m.faculty_access='edit') THEN
        RAISE EXCEPTION 'Educator no longer has edit permission' USING ERRCODE='42501'; END IF;
      proposed:=req->'data'->'after';
      IF req->>'change_type'='unit_add' THEN
        IF EXISTS(SELECT 1 FROM public.college_curriculum_units WHERE curriculum_id=cur.id AND lower(code)=lower(proposed->>'code')) THEN RAISE EXCEPTION 'Unit code already exists' USING ERRCODE='23505'; END IF;
        INSERT INTO public.college_curriculum_units(id,curriculum_id,name,code,description,credits,estimated_duration,duration_unit,order_index,created_by)
          VALUES(request_entity,cur.id,proposed->>'name',proposed->>'code',proposed->>'description',0,0,'hours',
            coalesce((SELECT max(order_index)+1 FROM public.college_curriculum_units WHERE curriculum_id=cur.id),0),request_actor);
        FOR outcome_row IN SELECT value FROM jsonb_array_elements(coalesce(proposed->'outcomes','[]')) LOOP
          INSERT INTO public.college_curriculum_outcomes(curriculum_id,unit_id,outcome_text,assessment_mappings) VALUES(cur.id,request_entity,outcome_row#>>'{}','[]');
        END LOOP;
      ELSIF req->>'change_type'='outcome_add' THEN
        IF NOT EXISTS(SELECT 1 FROM public.college_curriculum_units WHERE id=(proposed->>'unit_id')::uuid AND curriculum_id=cur.id) THEN RAISE EXCEPTION 'Unit no longer exists' USING ERRCODE='40001'; END IF;
        INSERT INTO public.college_curriculum_outcomes(id,curriculum_id,unit_id,outcome_text,assessment_mappings) VALUES(request_entity,cur.id,(proposed->>'unit_id')::uuid,proposed->>'outcome_text','[]');
      ELSE

      IF req->>'change_type'='unit_edit' THEN
        SELECT to_jsonb(u) INTO existing FROM public.college_curriculum_units u WHERE id=request_entity AND curriculum_id=cur.id FOR UPDATE;
      ELSE
        SELECT to_jsonb(o) INTO existing FROM public.college_curriculum_outcomes o WHERE id=request_entity AND curriculum_id=cur.id FOR UPDATE;
      END IF;
      IF existing IS NULL OR existing IS DISTINCT FROM req->'data'->'before' THEN RAISE EXCEPTION 'Content changed since this proposal. Ask the educator to submit again.' USING ERRCODE='40001'; END IF;
      proposed:=req->'data'->'after';
      IF req->>'change_type'='unit_edit' THEN
        UPDATE public.college_curriculum_units SET name=proposed->>'name',description=proposed->>'description',updated_at=now(),updated_by=p_actor WHERE id=request_entity;
      ELSE
        UPDATE public.college_curriculum_outcomes SET outcome_text=proposed->>'outcome_text',updated_at=now(),updated_by=p_actor WHERE id=request_entity;
      END IF;
      END IF;
    END IF;
    SELECT coalesce(jsonb_agg(r),'[]') INTO remaining FROM jsonb_array_elements(coalesce(cur.pending_changes,'[]')) r WHERE r->>'id' IS DISTINCT FROM p_payload->>'requestId';
    UPDATE public.college_curriculums SET
      pending_changes=remaining,has_pending_changes=jsonb_array_length(remaining)>0,
      change_history=coalesce(change_history,'[]')||jsonb_build_array(jsonb_build_object(
        'id',req->>'id','action',CASE WHEN p_payload->>'decision'='approved' THEN 'change_approved' ELSE 'change_rejected' END,
        'change_type',req->>'change_type','status',p_payload->>'decision','timestamp',now(),'user_id',p_actor,
        'review_notes',coalesce(p_payload->>'note',''),'applied',p_payload->>'decision'='approved','original_change',req)),
      version=coalesce(version,1)+CASE WHEN p_payload->>'decision'='approved' THEN 1 ELSE 0 END,updated_at=now()
      WHERE id=cur.id;
    RETURN jsonb_build_object('reviewed',true);
  END IF;

  cid:=(p_payload->>'curriculumId')::uuid;
  IF p_action='content' THEN
    RETURN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (
      SELECT cc.*,coalesce((SELECT jsonb_agg(to_jsonb(u) ORDER BY u.order_index) FROM public.college_curriculum_units u WHERE u.curriculum_id=cc.id),'[]') AS units,
        coalesce((SELECT jsonb_agg(to_jsonb(o)) FROM public.college_curriculum_outcomes o WHERE o.curriculum_id=cc.id),'[]') AS outcomes
      FROM public.college_curriculums cc WHERE cc.course_id=(p_payload->>'courseId')::uuid AND cc.program_id=(p_payload->>'programId')::uuid
        AND cc.college_id=org AND EXISTS(SELECT 1 FROM public.college_course_mappings m WHERE m.course_id=cc.course_id AND m.program_id=cc.program_id AND m.faculty_id IN(lecturer,p_actor))
      ORDER BY cc.academic_year DESC,cc.version DESC
    ) x),'[]');
  END IF;

  IF p_action='propose' THEN
    SELECT * INTO cur FROM public.college_curriculums WHERE id=cid AND college_id=org FOR UPDATE;
    IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.college_course_mappings m WHERE m.course_id=cur.course_id
      AND m.program_id=cur.program_id AND m.faculty_id IN(lecturer,p_actor) AND m.faculty_access='edit') THEN
      RAISE EXCEPTION 'Edit permission required for this curriculum' USING ERRCODE='42501'; END IF;
    IF p_payload->>'entityType'='unit' THEN
      SELECT to_jsonb(u) INTO existing FROM public.college_curriculum_units u WHERE u.id=(p_payload->>'entityId')::uuid AND curriculum_id=cid;
      proposed:=jsonb_build_object('name',p_payload->'changes'->>'name','description',p_payload->'changes'->>'description');
      IF length(trim(proposed->>'name')) NOT BETWEEN 1 AND 255 OR length(proposed->>'description')>10000 THEN RAISE EXCEPTION 'Invalid unit content' USING ERRCODE='22023'; END IF;
    ELSIF p_payload->>'entityType'='outcome' THEN
      SELECT to_jsonb(o) INTO existing FROM public.college_curriculum_outcomes o WHERE o.id=(p_payload->>'entityId')::uuid AND curriculum_id=cid;
      proposed:=jsonb_build_object('outcome_text',p_payload->'changes'->>'outcome_text');
      IF length(trim(proposed->>'outcome_text')) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Invalid outcome' USING ERRCODE='22023'; END IF;
    ELSE RAISE EXCEPTION 'Invalid entity' USING ERRCODE='22023'; END IF;
    IF existing IS NULL THEN RAISE EXCEPTION 'Content not found' USING ERRCODE='22023'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(cur.pending_changes,'[]')) r
      WHERE r->>'entity_id'=p_payload->>'entityId' AND coalesce(r->>'status','pending')='pending') THEN
      RAISE EXCEPTION 'This content already has a pending change. Review it before submitting another.' USING ERRCODE='23505'; END IF;
    course_uuid:=gen_random_uuid();
    req:=jsonb_build_object('id',course_uuid,'source','faculty_course',
      'change_type',CASE WHEN p_payload->>'entityType'='unit' THEN 'unit_edit' ELSE 'outcome_edit' END,
      'entity_id',p_payload->>'entityId','data',jsonb_build_object('before',existing,'after',proposed),
      'requested_by',p_actor,'requester_name',(SELECT email FROM public.users WHERE id=p_actor),
      'request_message','Faculty course edit','timestamp',now(),'status','pending');
    UPDATE public.college_curriculums SET pending_changes=coalesce(pending_changes,'[]')||jsonb_build_array(req),
      has_pending_changes=true,updated_at=now() WHERE id=cid;
    RETURN jsonb_build_object('requestId',course_uuid,'status','pending');
  END IF;
  RAISE EXCEPTION 'Unknown course action' USING ERRCODE='22023';
END;
$$;
REVOKE ALL ON FUNCTION public.college_course_workflow(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.college_course_workflow(uuid,text,jsonb) TO service_role;

COMMIT;
