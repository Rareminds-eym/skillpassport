-- Raw answers are untrusted inputs, not client-certified scores. No RLS dependency.
CREATE OR REPLACE FUNCTION public.save_owned_assessment_response(
  p_owner uuid, p_attempt uuid, p_question uuid, p_answer jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_learner uuid;
  v_status text;
  v_response public.personal_assessment_responses%ROWTYPE;
BEGIN
  IF p_question IS NULL OR p_answer IS NULL OR p_answer = 'null'::jsonb
    OR octet_length(p_answer::text) > 262144 THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid response';
  END IF;
  BEGIN
    SELECT id INTO STRICT v_learner FROM public.learners WHERE user_id=p_owner FOR SHARE;
  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL;
  END;
  SELECT status INTO v_status FROM public.personal_assessment_attempts
    WHERE id=p_attempt AND learner_id=v_learner FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_status IS DISTINCT FROM 'in_progress' THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='assessment_not_in_progress';
  END IF;
  INSERT INTO public.personal_assessment_responses(attempt_id,question_id,response_value,is_correct,responded_at)
    VALUES(p_attempt,p_question,p_answer,NULL,clock_timestamp())
    ON CONFLICT(attempt_id,question_id) DO UPDATE SET
      response_value=EXCLUDED.response_value,is_correct=NULL,responded_at=EXCLUDED.responded_at
    RETURNING * INTO v_response;
  RETURN to_jsonb(v_response);
END;
$$;
REVOKE ALL ON FUNCTION public.save_owned_assessment_response(uuid,uuid,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_owned_assessment_response(uuid,uuid,uuid,jsonb) TO service_role;
