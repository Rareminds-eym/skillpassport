-- Owner-scoped creation, serialized with existing assessment mutations; no RLS.
CREATE OR REPLACE FUNCTION public.start_owned_assessment(
 p_owner uuid,p_stream text,p_grade text,p_reference uuid DEFAULT NULL,
 p_context jsonb DEFAULT NULL,p_reuse boolean DEFAULT true
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE v_learner uuid; v_grade text:=p_grade; v_attempt public.personal_assessment_attempts%ROWTYPE; v_count bigint;
BEGIN
 IF p_grade IS NULL OR p_grade NOT IN ('middle','highschool','higher_secondary','after10','after12','college')
   OR (p_stream IS NOT NULL AND (length(p_stream)=0 OR length(p_stream)>50)) OR p_reuse IS NULL
   OR (p_context IS NOT NULL AND (jsonb_typeof(p_context)<>'object' OR octet_length(p_context::text)>65536)) THEN
   RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid assessment start';
 END IF;
 -- Exclusive owner binding serializes creation, even when no attempt row exists yet.
 BEGIN
   SELECT id INTO STRICT v_learner FROM public.learners WHERE user_id=p_owner FOR UPDATE;
 EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL;
 END;
 IF p_reference IS NOT NULL AND p_reference<>v_learner AND p_reference<>p_owner THEN
   RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Learner reference mismatch';
 END IF;
 IF p_stream IS NOT NULL THEN
   SELECT grade_level INTO v_grade FROM public.personal_assessment_streams WHERE id=p_stream AND is_active IS TRUE FOR SHARE;
   IF NOT FOUND OR v_grade IS NULL OR v_grade NOT IN ('middle','highschool','higher_secondary','after10','after12','college') THEN
     RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Unknown or inactive stream';
   END IF;
 END IF;
 SELECT count(*) INTO v_count FROM public.personal_assessment_attempts WHERE learner_id=v_learner AND status='in_progress';
 IF v_count>1 THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Multiple open attempts require review'; END IF;
 SELECT * INTO v_attempt FROM public.personal_assessment_attempts WHERE learner_id=v_learner AND status='in_progress'
   ORDER BY started_at DESC,id DESC LIMIT 1 FOR UPDATE;
 IF FOUND THEN
   IF NOT p_reuse OR v_attempt.grade_level IS DISTINCT FROM v_grade OR v_attempt.stream_id IS DISTINCT FROM p_stream THEN
     RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Resume or abandon the existing assessment first';
   END IF;
   RETURN jsonb_build_object('attempt',to_jsonb(v_attempt),'created',false);
 END IF;
 INSERT INTO public.personal_assessment_attempts(learner_id,stream_id,grade_level,learner_context,status,
   all_responses,section_timings,timer_remaining,elapsed_time,current_section_index,current_question_index,started_at)
 VALUES(v_learner,p_stream,v_grade,p_context,'in_progress','{}','{}',NULL,0,0,0,clock_timestamp()) RETURNING * INTO v_attempt;
 RETURN jsonb_build_object('attempt',to_jsonb(v_attempt),'created',true);
END; $$;
REVOKE ALL ON FUNCTION public.start_owned_assessment(uuid,text,text,uuid,jsonb,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.start_owned_assessment(uuid,text,text,uuid,jsonb,boolean) TO service_role;
