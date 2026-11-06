BEGIN;
-- Server-only commit capability. Legacy response history is preserved; the
-- session row lock serializes future answers without deleting old duplicates.
CREATE INDEX adaptive_response_session_question ON public.adaptive_aptitude_responses(session_id,question_id);
CREATE FUNCTION public.commit_owned_adaptive_answer(
 p_owner uuid,p_session uuid,p_question text,p_answer text,p_response_time integer,
 p_read_only boolean DEFAULT false,p_expected_index integer DEFAULT NULL,p_expected_answered integer DEFAULT NULL,
 p_expected_phase text DEFAULT NULL,p_new_difficulty integer DEFAULT NULL,p_provisional_band integer DEFAULT NULL,p_test_complete boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE learner uuid; session public.adaptive_aptitude_sessions; previous public.adaptive_aptitude_responses;
 question jsonb; key text; correct boolean; response public.adaptive_aptitude_responses; previous_count integer;
BEGIN
 IF p_owner IS NULL OR p_session IS NULL OR p_question IS NULL OR length(p_question) NOT BETWEEN 1 AND 200 OR
 p_answer IS NULL OR p_answer NOT IN('A','B','C','D') OR p_response_time IS NULL OR p_response_time NOT BETWEEN 0 AND 3600000 OR p_read_only IS NULL THEN
 RAISE EXCEPTION 'Invalid adaptive answer' USING ERRCODE='22023';END IF;
 BEGIN SELECT id INTO STRICT learner FROM public.learners WHERE user_id=p_owner FOR SHARE;
 EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL;END;
 SELECT * INTO session FROM public.adaptive_aptitude_sessions WHERE id=p_session AND learner_id=learner FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL;END IF;
 SELECT count(*) INTO previous_count FROM public.adaptive_aptitude_responses WHERE session_id=session.id AND question_id=p_question;
 IF previous_count>1 THEN RAISE EXCEPTION 'Historical duplicate answer requires review' USING ERRCODE='40001';END IF;
 IF previous_count=1 THEN
  SELECT * INTO STRICT previous FROM public.adaptive_aptitude_responses WHERE session_id=session.id AND question_id=p_question;
  IF trim(previous.selected_answer)<>p_answer OR previous.response_time_ms<>p_response_time THEN
   RAISE EXCEPTION 'Answer already recorded' USING ERRCODE='40001';END IF;
  RETURN jsonb_build_object('recorded',true,'replayed',true,'isCorrect',previous.is_correct,'previousDifficulty',previous.difficulty_at_time,'session',to_jsonb(session));
 END IF;
 IF p_read_only THEN RETURN jsonb_build_object('recorded',false);END IF;
 IF session.status<>'in_progress' OR p_expected_index IS DISTINCT FROM session.current_question_index OR
 p_expected_answered IS DISTINCT FROM session.questions_answered OR p_expected_phase IS DISTINCT FROM session.current_phase::text THEN
 RAISE EXCEPTION 'Adaptive session changed' USING ERRCODE='40001';END IF;
 IF p_new_difficulty IS NULL OR p_new_difficulty NOT BETWEEN 1 AND 5 OR
 (p_provisional_band IS NOT NULL AND p_provisional_band NOT BETWEEN 1 AND 5) OR p_test_complete IS NULL OR
 p_test_complete IS DISTINCT FROM (session.questions_answered+1>=50 OR (session.current_phase::text='stability_confirmation' AND session.current_question_index+1>=6)) THEN
 RAISE EXCEPTION 'Invalid adaptive transition' USING ERRCODE='22023';END IF;
 IF jsonb_typeof(session.current_phase_questions) IS DISTINCT FROM 'array' OR jsonb_typeof(coalesce(session.all_responses,'[]')) IS DISTINCT FROM 'array' THEN
 RAISE EXCEPTION 'Adaptive session data invalid' USING ERRCODE='22023';END IF;
 question:=session.current_phase_questions->session.current_question_index;
 key:=upper(trim(coalesce(question->>'correctAnswer',question->>'correct_answer','')));
 IF question->>'id' IS DISTINCT FROM p_question OR key NOT IN('A','B','C','D') THEN
 RAISE EXCEPTION 'Current question required' USING ERRCODE='40001';END IF;
 correct:=p_answer=key;
 SELECT * INTO response FROM jsonb_populate_record(NULL::public.adaptive_aptitude_responses,jsonb_build_object(
  'id',gen_random_uuid(),'session_id',session.id,'question_id',p_question,'selected_answer',p_answer,'is_correct',correct,
  'response_time_ms',p_response_time,'difficulty_at_time',session.current_difficulty,'subtag',question->>'subtag','phase',session.current_phase,
  'sequence_number',session.questions_answered+1,'answered_at',clock_timestamp(),'question_text',question->>'text','question_options',question->'options',
  'correct_answer',key,'explanation',question->>'explanation'));
 INSERT INTO public.adaptive_aptitude_responses SELECT response.*;
 UPDATE public.adaptive_aptitude_sessions SET questions_answered=questions_answered+1,correct_answers=correct_answers+CASE WHEN correct THEN 1 ELSE 0 END,
  current_question_index=current_question_index+1,current_difficulty=p_new_difficulty,difficulty_path=array_append(difficulty_path,p_new_difficulty::smallint),
  provisional_band=p_provisional_band,all_responses=coalesce(all_responses,'[]')||jsonb_build_array(jsonb_build_object(
   'question_id',p_question,'selected_answer',p_answer,'is_correct',correct,'response_time_ms',p_response_time,'difficulty_at_time',session.current_difficulty,
   'subtag',question->>'subtag','phase',session.current_phase,'sequence_number',session.questions_answered+1,'timestamp',clock_timestamp())),
  status=CASE WHEN p_test_complete THEN 'completed'::public.session_status ELSE status END,
  completed_at=CASE WHEN p_test_complete THEN clock_timestamp() ELSE completed_at END,updated_at=clock_timestamp()
 WHERE id=session.id RETURNING * INTO session;
 RETURN jsonb_build_object('recorded',true,'replayed',false,'isCorrect',correct,'previousDifficulty',response.difficulty_at_time,'session',to_jsonb(session));
END;
$$;
REVOKE ALL ON FUNCTION public.commit_owned_adaptive_answer(uuid,uuid,text,text,integer,boolean,integer,integer,text,integer,integer,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commit_owned_adaptive_answer(uuid,uuid,text,text,integer,boolean,integer,integer,text,integer,integer,boolean) TO service_role;
COMMIT;
