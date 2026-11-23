-- Publish validated automatic grades atomically, without educator approval.
BEGIN;
CREATE OR REPLACE FUNCTION complete_ai_assignment_evaluation(p_result uuid,p_claim timestamptz,p_results jsonb,p_model text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r ai_assignment_results; allocation ai_assignment_learners; a ai_assignments; q jsonb; item jsonb; total numeric:=0; maximum numeric:=0; scores jsonb:='[]'; v_feedback text:='Automatic evaluation complete.';
BEGIN
 SELECT * INTO r FROM ai_assignment_results WHERE id=p_result FOR UPDATE;
 IF NOT FOUND OR r.status NOT IN ('evaluating','review_required') OR r.updated_at IS DISTINCT FROM p_claim THEN RETURN false; END IF;
 SELECT al.* INTO allocation FROM ai_assignment_submissions s JOIN ai_assignment_learners al ON al.id=s.assignment_learner_id WHERE s.id=r.submission_id;
 SELECT * INTO a FROM ai_assignments WHERE id=allocation.assignment_id;
 IF jsonb_typeof(p_results) IS DISTINCT FROM 'array' OR jsonb_array_length(p_results)<>jsonb_array_length(a.content->'questions') THEN RAISE EXCEPTION 'Every question requires an automatic grade'; END IF;
 FOR q IN SELECT value FROM jsonb_array_elements(a.content->'questions') LOOP
  SELECT value INTO item FROM jsonb_array_elements(p_results) WHERE value->>'questionId'=q->>'id';
  IF item IS NULL OR (SELECT count(*) FROM jsonb_array_elements(p_results) WHERE value->>'questionId'=q->>'id')<>1 OR item->>'marks' IS NULL OR (item->>'marks')::numeric::text IN ('NaN','Infinity','-Infinity') OR (item->>'marks')::numeric NOT BETWEEN 0 AND (q->>'maxMarks')::numeric THEN RAISE EXCEPTION 'Invalid automatic grade'; END IF;
  total:=total+(item->>'marks')::numeric; maximum:=maximum+(q->>'maxMarks')::numeric;
  scores:=scores||jsonb_build_array(jsonb_build_object('questionId',q->>'id','marks',(item->>'marks')::numeric,'reason','Automatically evaluated'));
 END LOOP;
 IF maximum<=0 THEN RAISE EXCEPTION 'Positive maximum marks required'; END IF;
 UPDATE ai_assignment_results SET status='released',question_results=jsonb_build_object('ai',p_results,'review',scores),total_marks=total,maximum_marks=maximum,model=p_model,feedback=v_feedback,reviewed_by=NULL,released_at=now(),updated_at=now() WHERE id=r.id;
 UPDATE learner_assignments SET status='graded',grade_received=total,grade_percentage=round(total/maximum*100,2),instructor_feedback=v_feedback,graded_by=NULL,graded_date=now(),feedback_date=now(),updated_date=now() WHERE learner_assignment_id=allocation.school_allocation_id;
 UPDATE college_learner_assignments SET status='graded',grade_received=total,grade_percentage=round(total/maximum*100,2),instructor_feedback=v_feedback,graded_by=NULL,graded_date=now(),feedback_date=now(),updated_date=now() WHERE learner_assignment_id=allocation.college_allocation_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION complete_ai_assignment_evaluation(uuid,timestamptz,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION complete_ai_assignment_evaluation(uuid,timestamptz,jsonb,text) TO service_role;
-- Release existing completed evaluations as well; pending and failed work stays private.
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT id,updated_at,question_results,model FROM ai_assignment_results WHERE status='review_required' LOOP
  PERFORM complete_ai_assignment_evaluation(r.id,r.updated_at,r.question_results,r.model);
 END LOOP;
END $$;
COMMIT;
