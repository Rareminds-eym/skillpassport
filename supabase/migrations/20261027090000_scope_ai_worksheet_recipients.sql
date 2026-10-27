BEGIN;
-- Resolve the educator's existing college/school profile, never a browser selection.
CREATE OR REPLACE FUNCTION public.ai_worksheet_educator_scope(p_user_id uuid)
RETURNS TABLE(organization_id uuid,organization_name text) LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path=public,pg_temp AS $$
DECLARE ids uuid[];
BEGIN
 SELECT array_agg(DISTINCT candidate.id) INTO ids FROM (
  SELECT cl."collegeId" id FROM college_lecturers cl WHERE cl.user_id=p_user_id AND cl."accountStatus"='active'
  UNION SELECT se.school_id FROM school_educators se WHERE se.user_id=p_user_id AND se.account_status='active'
  UNION SELECT s.organization_id FROM organization_staff s WHERE s.user_id=p_user_id AND s.account_status='active'
 ) candidate JOIN organization_members m ON m.organization_id=candidate.id AND m.user_id=p_user_id AND m.status='active'
 JOIN users u ON u.id=p_user_id AND u.role IN ('educator','college_educator','school_educator');
 IF COALESCE(cardinality(ids),0)<>1 THEN RAISE EXCEPTION 'A single active educator college or school profile is required'; END IF;
 RETURN QUERY SELECT o.id,o.name::text FROM organizations o WHERE o.id=ids[1];
END $$;

CREATE OR REPLACE FUNCTION public.ai_worksheet_eligible_learners(p_user_id uuid)
RETURNS TABLE(id uuid,name text,user_id uuid,school_class_id uuid,program_section_id uuid,program_id uuid,organization_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT l.id,l.name::text,l.user_id,l.school_class_id,l.program_section_id,l.program_id,scope.organization_id
 FROM ai_worksheet_educator_scope(p_user_id) scope
 JOIN learners l ON (l.college_id=scope.organization_id OR l.school_id=scope.organization_id)
 WHERE COALESCE(l.is_deleted,false)=false
 AND EXISTS(SELECT 1 FROM organization_members m WHERE m.user_id=l.user_id AND m.organization_id=scope.organization_id AND m.status='active')
 AND (
  -- College learners must belong to an explicitly mapped active program.
  (l.college_id=scope.organization_id AND EXISTS(
   SELECT 1 FROM programs p JOIN departments d ON d.id=p.department_id
   WHERE p.id=l.program_id AND p.status='active' AND d.college_id=scope.organization_id AND (
    EXISTS(SELECT 1 FROM program_sections ps WHERE ps.program_id=p.id AND ps.faculty_id=p_user_id AND ps.status='active')
    OR EXISTS(SELECT 1 FROM college_course_mappings cm WHERE cm.program_id=p.id AND cm.faculty_id=p_user_id)
    OR EXISTS(SELECT 1 FROM organization_staff s JOIN organization_staff_assignments a ON a.staff_id=s.id
      WHERE s.user_id=p_user_id AND s.organization_id=scope.organization_id AND s.account_status='active'
      AND a.college_id=scope.organization_id AND a.program_id=p.id AND a.is_active=true
      AND (a.start_date IS NULL OR a.start_date<=current_date) AND (a.end_date IS NULL OR a.end_date>=current_date)
      AND (a.section_id IS NULL OR a.section_id=l.program_section_id))
   )))
  OR (l.school_id=scope.organization_id AND EXISTS(
   SELECT 1 FROM school_educators se JOIN school_educator_class_assignments a ON a.educator_id=se.id
   JOIN school_classes sc ON sc.id=a.class_id AND sc.academic_year=a.academic_year
   WHERE se.user_id=p_user_id AND se.school_id=scope.organization_id AND se.account_status='active'
   AND a.class_id=l.school_class_id AND sc.school_id=scope.organization_id
  ))
 );
$$;
REVOKE ALL ON FUNCTION public.ai_worksheet_educator_scope(uuid),public.ai_worksheet_eligible_learners(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ai_worksheet_educator_scope(uuid),public.ai_worksheet_eligible_learners(uuid) TO service_role;

-- Keep the existing atomic implementation behind a mapping-checked entry point.
DO $$ BEGIN
 IF to_regprocedure('public.publish_ai_worksheets_unscoped(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb)') IS NULL THEN
  ALTER FUNCTION public.publish_ai_worksheets(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb) RENAME TO publish_ai_worksheets_unscoped;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.publish_ai_worksheets_unscoped(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.publish_ai_worksheets(p_user_id uuid,p_organization_id uuid,
 p_conversation_id uuid,p_message_id uuid,p_group_id uuid,p_title text,p_instructions text,
 p_due_at timestamptz,p_variants jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,pg_temp AS $$
DECLARE scope uuid; recipient uuid; variant jsonb;
BEGIN
 SELECT organization_id INTO scope FROM ai_worksheet_educator_scope(p_user_id);
 IF scope IS DISTINCT FROM p_organization_id THEN RAISE EXCEPTION 'Educator college mismatch'; END IF;
 FOR variant IN SELECT * FROM jsonb_array_elements(p_variants) LOOP
  FOR recipient IN SELECT value::uuid FROM jsonb_array_elements_text(variant->'learnerIds') LOOP
   IF NOT EXISTS(SELECT 1 FROM ai_worksheet_eligible_learners(p_user_id) eligible WHERE eligible.id=recipient) THEN
    RAISE EXCEPTION 'Learner is not in an educator mapped program or class';
   END IF;
  END LOOP;
 END LOOP;
 RETURN publish_ai_worksheets_unscoped(p_user_id,scope,p_conversation_id,p_message_id,p_group_id,p_title,p_instructions,p_due_at,p_variants);
END $$;
REVOKE ALL ON FUNCTION public.publish_ai_worksheets(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_ai_worksheets(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
