-- Save the complete course edit in the same transaction as the hierarchy.
CREATE OR REPLACE FUNCTION public.update_course_transactional(
  p_course_id uuid, p_fields jsonb, p_skills jsonb, p_classes jsonb,
  p_modules jsonb, p_expected_updated_at timestamptz DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE current_course courses%ROWTYPE; updated_course courses%ROWTYPE;
BEGIN
  SELECT * INTO current_course FROM courses WHERE course_id=p_course_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found' USING ERRCODE='P0002'; END IF;
  IF p_expected_updated_at IS NOT NULL AND current_course.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'Course has been modified' USING ERRCODE='40001';
  END IF;
  UPDATE courses c SET
    (title, code, description, university, duration, credits, category, thumbnail, target_outcomes, updated_at, educator_id, skills_mapped, total_skills) =
    (SELECT x.title, x.code, x.description, x.university, x.duration, x.credits, x.category, x.thumbnail, x.target_outcomes, x.updated_at, x.educator_id, x.skills_mapped, x.total_skills
     FROM jsonb_populate_record(c, p_fields) AS x)
    WHERE c.course_id=p_course_id RETURNING c.* INTO updated_course;
  IF p_skills IS NOT NULL THEN
    DELETE FROM course_skills WHERE course_id=p_course_id;
    INSERT INTO course_skills(course_id, skill_name)
      SELECT p_course_id, value FROM jsonb_array_elements_text(p_skills);
  END IF;
  IF p_classes IS NOT NULL THEN
    DELETE FROM course_classes WHERE course_id=p_course_id;
    INSERT INTO course_classes(course_id, class_name)
      SELECT p_course_id, value FROM jsonb_array_elements_text(p_classes);
  END IF;
  IF p_modules IS NOT NULL THEN PERFORM sync_course_hierarchy(p_course_id, p_modules); END IF;
  RETURN to_jsonb(updated_course);
END;
$$;
REVOKE ALL ON FUNCTION public.update_course_transactional(uuid,jsonb,jsonb,jsonb,jsonb,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_course_transactional(uuid,jsonb,jsonb,jsonb,jsonb,timestamptz) TO service_role;
