BEGIN;
-- Keep the original per-question evaluation intact when an educator adjusts the total.
CREATE FUNCTION update_college_ai_grade(p_user uuid,p_allocation uuid,p_marks numeric,p_feedback text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE allocation ai_assignment_learners; result ai_assignment_results; updated college_learner_assignments;
BEGIN
 SELECT * INTO allocation FROM ai_assignment_learners WHERE college_allocation_id=p_allocation;
 IF allocation.id IS NULL OR allocation.assigned_by IS DISTINCT FROM p_user THEN
  RAISE EXCEPTION 'Assignment educator access required';
 END IF;
 SELECT r.* INTO result FROM ai_assignment_results r JOIN ai_assignment_submissions s ON s.id=r.submission_id
 WHERE s.assignment_learner_id=allocation.id FOR UPDATE OF r;
 IF result.id IS NULL OR result.status<>'released' THEN RAISE EXCEPTION 'Complete evaluation before adjusting the total'; END IF;
 IF p_marks IS NULL OR p_marks::text IN ('NaN','Infinity','-Infinity') OR p_marks<0 OR p_marks>result.maximum_marks THEN
  RAISE EXCEPTION 'Score outside assignment range';
 END IF;
 UPDATE ai_assignment_results SET total_marks=p_marks,feedback=coalesce(p_feedback,''),reviewed_by=p_user,updated_at=now(),
 question_results=coalesce(result.question_results,'{}'::jsonb)||jsonb_build_object(
  'educator_override',jsonb_build_object('marks',p_marks,'previous_marks',result.total_marks,'reviewed_by',p_user,'updated_at',now()),
  'grade_history',coalesce(result.question_results->'grade_history','[]'::jsonb)||jsonb_build_array(jsonb_build_object(
   'previous_marks',result.total_marks,'marks',p_marks,'previous_feedback',result.feedback,'feedback',coalesce(p_feedback,''),'reviewed_by',p_user,'updated_at',now())))
 WHERE id=result.id;
 UPDATE college_learner_assignments SET status='graded',grade_received=p_marks,
 grade_percentage=round(p_marks/result.maximum_marks*100,2),instructor_feedback=coalesce(p_feedback,''),
 graded_date=now(),feedback_date=now(),updated_date=now(),completed_date=now(),
 graded_by=CASE WHEN EXISTS(SELECT 1 FROM college_lecturers WHERE user_id=p_user) THEN p_user ELSE NULL END,
 external_educator_graded_by=CASE WHEN EXISTS(SELECT 1 FROM college_lecturers WHERE user_id=p_user) THEN NULL ELSE p_user END
 WHERE learner_assignment_id=p_allocation AND NOT is_deleted RETURNING * INTO updated;
 IF updated.learner_assignment_id IS NULL THEN RAISE EXCEPTION 'Allocation unavailable'; END IF;
 RETURN to_jsonb(updated);
END $$;
REVOKE ALL ON FUNCTION update_college_ai_grade(uuid,uuid,numeric,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION update_college_ai_grade(uuid,uuid,numeric,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
