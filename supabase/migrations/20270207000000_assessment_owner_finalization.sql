-- No RLS dependency. Ownership and finalization are one transaction.
-- Null streams are already valid on attempts; results must represent them too.
ALTER TABLE public.personal_assessment_results ALTER COLUMN stream_id DROP NOT NULL;
CREATE OR REPLACE FUNCTION public.finalize_owned_assessment(
  p_owner uuid,p_attempt uuid,p_action text,p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE
 v_learner uuid; v_attempt public.personal_assessment_attempts%ROWTYPE;
 v_existing public.personal_assessment_results%ROWTYPE; v_new public.personal_assessment_results%ROWTYPE;
 v_adaptive public.adaptive_aptitude_results%ROWTYPE;
 v_answers jsonb; v_timings jsonb; v_report jsonb; v_data jsonb; v_key text; v_value jsonb;
 v_riasec jsonb; v_code text; v_fallback text; v_simple boolean;
 v_aptitude jsonb; v_overall numeric; v_category text; v_correct numeric; v_total numeric;
 v_sum_correct numeric:=0; v_sum_total numeric:=0; v_count numeric; v_right numeric;
BEGIN
 IF p_action IS NULL OR p_action NOT IN ('submit','results') OR p_payload IS NULL
   OR jsonb_typeof(p_payload)<>'object' OR octet_length(p_payload::text)>262144 THEN
   RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid finalization';
 END IF;
 FOR v_key IN SELECT jsonb_object_keys(p_payload) LOOP
   IF (p_action='submit' AND v_key<>'answers') OR (p_action='results' AND v_key NOT IN
     ('learnerId','streamId','gradeLevel','geminiResults','adaptiveAptitudeSessionId','sectionTimings')) THEN
     RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Unsupported finalization field';
   END IF;
 END LOOP;
 v_answers:=COALESCE(p_payload->'answers','{}');
 IF jsonb_typeof(v_answers)<>'object' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid answers'; END IF;
 IF p_action='results' AND (jsonb_typeof(p_payload->'geminiResults') IS DISTINCT FROM 'object' OR p_payload->'geminiResults'='{}') THEN
   RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid report';
 END IF;
 BEGIN
   SELECT id INTO STRICT v_learner FROM public.learners WHERE user_id=p_owner FOR SHARE;
 EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL;
 END;
 SELECT * INTO v_attempt FROM public.personal_assessment_attempts WHERE id=p_attempt AND learner_id=v_learner FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF v_attempt.status IS NULL OR v_attempt.status NOT IN ('in_progress','completed') THEN
   RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='assessment_not_finalizable';
 END IF;
 IF (p_payload ? 'learnerId' AND (p_payload->>'learnerId')::uuid IS DISTINCT FROM v_learner)
   OR (p_payload ? 'streamId' AND p_payload->>'streamId' IS DISTINCT FROM v_attempt.stream_id)
   OR (p_payload ? 'gradeLevel' AND p_payload->>'gradeLevel' IS DISTINCT FROM v_attempt.grade_level) THEN
   RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Assessment context mismatch';
 END IF;
 SELECT * INTO v_existing FROM public.personal_assessment_results WHERE attempt_id=p_attempt FOR UPDATE;
 IF FOUND AND (v_existing.learner_id IS DISTINCT FROM v_learner OR v_existing.stream_id IS DISTINCT FROM v_attempt.stream_id
    OR v_existing.grade_level IS DISTINCT FROM v_attempt.grade_level) THEN
   RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Existing result context mismatch';
 END IF;
 IF p_action='submit' AND v_attempt.status='completed' THEN
   FOR v_key,v_value IN SELECT * FROM jsonb_each(v_answers) LOOP
     IF v_attempt.all_responses->v_key IS DISTINCT FROM v_value THEN
       RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Completed answers are immutable';
     END IF;
   END LOOP;
   IF v_existing.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Completed result missing'; END IF;
   RETURN jsonb_build_object('attemptId',p_attempt,'resultId',v_existing.id);
 END IF;
 IF p_action='submit' THEN
   IF jsonb_typeof(COALESCE(v_attempt.all_responses,'{}'))<>'object' THEN
     RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Invalid existing answers';
   END IF;
   -- Insert the canonical placeholder first, so the completion trigger never
   -- invents stream/owner context. The entire operation rolls back on failure.
   INSERT INTO public.personal_assessment_results(attempt_id,learner_id,stream_id,grade_level,status,gemini_results)
     VALUES(p_attempt,v_learner,v_attempt.stream_id,v_attempt.grade_level,'completed','{}')
     ON CONFLICT(attempt_id) DO NOTHING;
   UPDATE public.personal_assessment_attempts SET all_responses=COALESCE(all_responses,'{}')||v_answers,
     status='completed',completed_at=clock_timestamp(),updated_at=clock_timestamp() WHERE id=p_attempt;
   SELECT * INTO STRICT v_existing FROM public.personal_assessment_results WHERE attempt_id=p_attempt;
   RETURN jsonb_build_object('attemptId',p_attempt,'resultId',v_existing.id);
 END IF;
 v_report:=p_payload->'geminiResults';
 IF p_payload->>'adaptiveAptitudeSessionId' IS NOT NULL AND
   (p_payload->>'adaptiveAptitudeSessionId')::uuid IS DISTINCT FROM v_attempt.adaptive_aptitude_session_id THEN
   RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Adaptive link mismatch';
 END IF;
 IF v_attempt.adaptive_aptitude_session_id IS NOT NULL THEN
   PERFORM id FROM public.adaptive_aptitude_sessions WHERE id=v_attempt.adaptive_aptitude_session_id
     AND learner_id=v_learner AND status='completed' FOR SHARE;
   IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Owned completed adaptive session required'; END IF;
   SELECT * INTO v_adaptive FROM public.adaptive_aptitude_results WHERE session_id=v_attempt.adaptive_aptitude_session_id
     AND learner_id=v_learner FOR SHARE;
   IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Owned adaptive results required'; END IF;
   v_aptitude:='{}';
   FOREACH v_category IN ARRAY ARRAY['verbal','numerical','abstract','spatial','clerical'] LOOP
     v_correct:=0;v_total:=0;
     FOR v_key,v_value IN SELECT * FROM jsonb_each(v_adaptive.accuracy_by_subtag) LOOP
       IF (CASE v_key WHEN 'verbal_reasoning' THEN 'verbal' WHEN 'numerical_reasoning' THEN 'numerical'
         WHEN 'data_interpretation' THEN 'numerical' WHEN 'logical_reasoning' THEN 'abstract'
         WHEN 'pattern_recognition' THEN 'abstract' WHEN 'spatial_reasoning' THEN 'spatial' ELSE NULL END)=v_category THEN
         v_right:=COALESCE((v_value->>'correct')::numeric,0);v_count:=COALESCE((v_value->>'total')::numeric,0);
         IF v_right<0 OR v_count<0 OR v_right>v_count THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Invalid adaptive counts'; END IF;
         v_correct:=v_correct+v_right;v_total:=v_total+v_count;
       END IF;
     END LOOP;
     v_aptitude:=v_aptitude||jsonb_build_object(v_category,jsonb_build_object('correct',v_correct,'total',v_total,
       'percentage',CASE WHEN v_total>0 THEN round(100*v_correct/v_total) ELSE 0 END));
     v_sum_correct:=v_sum_correct+v_correct;v_sum_total:=v_sum_total+v_total;
   END LOOP;
   v_overall:=COALESCE(round(v_adaptive.overall_accuracy),CASE WHEN v_sum_total>0 THEN round(100*v_sum_correct/v_sum_total) END);
 END IF;
 -- A filled report is immutable. Identical retries do not rewrite timestamps or
 -- completed answers. A submitted placeholder can be filled once by its owner.
 IF v_existing.id IS NOT NULL AND COALESCE(v_existing.gemini_results,'{}')<>'{}' THEN
   IF v_existing.gemini_results IS DISTINCT FROM v_report THEN
     RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Completed report is immutable';
   END IF;
   IF v_attempt.status IS DISTINCT FROM 'completed' THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='Inconsistent existing result'; END IF;
   RETURN jsonb_build_object('attemptId',p_attempt,'resultId',v_existing.id);
 END IF;
 v_timings:=COALESCE(v_attempt.section_timings,'{}');
 IF jsonb_typeof(v_timings)<>'object' OR (p_payload ? 'sectionTimings' AND jsonb_typeof(p_payload->'sectionTimings')<>'object') THEN
   RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid timings';
 END IF;
 v_timings:=v_timings||COALESCE(p_payload->'sectionTimings','{}');
 FOR v_key,v_value IN SELECT * FROM jsonb_each(v_timings) LOOP
   IF jsonb_typeof(v_value)<>'number' OR v_value::text !~ '^[0-9]+$' OR (v_value::text)::numeric>2147483647 THEN
     RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid timing number';
   END IF;
 END LOOP;
 IF (SELECT COALESCE(sum(value::numeric),0) FROM jsonb_each_text(v_timings))>2147483647 THEN
   RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Timing overflow';
 END IF;
 v_simple:=v_attempt.grade_level IN ('middle','highschool');
 v_riasec:=v_report#>'{riasec,scores}';v_code:=v_report#>>'{riasec,code}';
 IF jsonb_typeof(v_riasec)='object' AND NOT EXISTS(SELECT 1 FROM jsonb_each(v_riasec) WHERE value<>'0'::jsonb) THEN
   FOREACH v_fallback IN ARRAY ARRAY['_preservedScores','_scoreBackup','_originalScores','preCalculatedRiasec'] LOOP
     v_value:=CASE WHEN v_fallback='preCalculatedRiasec' THEN v_report#>'{preCalculatedRiasec,scores}' ELSE v_report->'riasec'->v_fallback END;
     IF jsonb_typeof(v_value)='object' AND EXISTS(SELECT 1 FROM jsonb_each(v_value) WHERE value<>'0'::jsonb) THEN
       v_riasec:=v_value;
       SELECT string_agg(key,'' ORDER BY score DESC,key) INTO v_code FROM
         (SELECT key,(value::text)::numeric score FROM jsonb_each(v_riasec) ORDER BY score DESC,key LIMIT 3) ranked;
       EXIT;
     END IF;
   END LOOP;
 END IF;
 v_data:=jsonb_build_object('attempt_id',p_attempt,'learner_id',v_learner,'stream_id',v_attempt.stream_id,
   'grade_level',v_attempt.grade_level,'status','completed','adaptive_aptitude_session_id',v_attempt.adaptive_aptitude_session_id,
   'created_at',COALESCE(v_existing.created_at,clock_timestamp()),'updated_at',clock_timestamp());
 v_data:=v_data||jsonb_build_object('learning_preferences',v_report->'learningPreferences');
 v_data:=v_data||jsonb_build_object('strength_scores',v_report->'strengthScores');
 v_data:=v_data||jsonb_build_object('riasec_scores',v_riasec);
 v_data:=v_data||jsonb_build_object('riasec_code',to_jsonb(v_code));
 v_data:=v_data||jsonb_build_object('aptitude_scores',COALESCE(v_aptitude, v_report#>'{aptitude,scores}'));
 v_data:=v_data||jsonb_build_object('aptitude_overall',COALESCE(to_jsonb(v_overall),v_report#>'{aptitude,overallScore}'));
 v_data:=v_data||jsonb_build_object('bigfive_scores',v_report->'bigFive');
 v_data:=v_data||jsonb_build_object('work_values_scores',CASE WHEN v_simple THEN NULL ELSE v_report#>'{workValues,scores}' END);
 v_data:=v_data||jsonb_build_object('employability_scores',CASE WHEN v_simple THEN NULL ELSE v_report#>'{employability,skillScores}' END);
 v_data:=v_data||jsonb_build_object('employability_readiness',CASE WHEN v_simple THEN NULL ELSE v_report#>'{employability,overallReadiness}' END);
 v_data:=v_data||jsonb_build_object('knowledge_score',CASE WHEN v_simple THEN NULL ELSE v_report#>'{knowledge,score}' END);
 v_data:=v_data||jsonb_build_object('knowledge_details',CASE WHEN v_simple THEN NULL ELSE v_report->'knowledge' END);
 v_data:=v_data||jsonb_build_object('career_fit',v_report->'careerFit');
 v_data:=v_data||jsonb_build_object('skill_gap',v_report->'skillGap');
 v_data:=v_data||jsonb_build_object('skill_gap_courses',v_report->'skillGapCourses');
 v_data:=v_data||jsonb_build_object('platform_courses',v_report->'platformCourses');
 v_data:=v_data||jsonb_build_object('courses_by_type',v_report->'coursesByType');
 v_data:=v_data||jsonb_build_object('roadmap',v_report->'roadmap');
 v_data:=v_data||jsonb_build_object('profile_snapshot',v_report->'profileSnapshot');
 v_data:=v_data||jsonb_build_object('timing_analysis',v_report->'timingAnalysis');
 v_data:=v_data||jsonb_build_object('final_note',v_report->'finalNote');
 v_data:=v_data||jsonb_build_object('overall_summary',v_report->'overallSummary');
 v_data:=v_data||jsonb_build_object('gemini_results',v_report);
 SELECT * INTO v_new FROM jsonb_populate_record(NULL::public.personal_assessment_results,v_data);
 INSERT INTO public.personal_assessment_results(attempt_id,learner_id,stream_id,grade_level,status,learning_preferences,strength_scores,riasec_scores,riasec_code,aptitude_scores,aptitude_overall,bigfive_scores,work_values_scores,employability_scores,employability_readiness,knowledge_score,knowledge_details,career_fit,skill_gap,skill_gap_courses,platform_courses,courses_by_type,roadmap,profile_snapshot,timing_analysis,final_note,overall_summary,gemini_results,adaptive_aptitude_session_id,created_at,updated_at)
 SELECT v_new.attempt_id,v_new.learner_id,v_new.stream_id,v_new.grade_level,v_new.status,v_new.learning_preferences,v_new.strength_scores,v_new.riasec_scores,v_new.riasec_code,v_new.aptitude_scores,v_new.aptitude_overall,v_new.bigfive_scores,v_new.work_values_scores,v_new.employability_scores,v_new.employability_readiness,v_new.knowledge_score,v_new.knowledge_details,v_new.career_fit,v_new.skill_gap,v_new.skill_gap_courses,v_new.platform_courses,v_new.courses_by_type,v_new.roadmap,v_new.profile_snapshot,v_new.timing_analysis,v_new.final_note,v_new.overall_summary,v_new.gemini_results,v_new.adaptive_aptitude_session_id,v_new.created_at,v_new.updated_at
 ON CONFLICT(attempt_id) DO UPDATE SET
 learner_id=EXCLUDED.learner_id,
 stream_id=EXCLUDED.stream_id,
 grade_level=EXCLUDED.grade_level,
 status=EXCLUDED.status,
 learning_preferences=EXCLUDED.learning_preferences,
 strength_scores=EXCLUDED.strength_scores,
 riasec_scores=EXCLUDED.riasec_scores,
 riasec_code=EXCLUDED.riasec_code,
 aptitude_scores=EXCLUDED.aptitude_scores,
 aptitude_overall=EXCLUDED.aptitude_overall,
 bigfive_scores=EXCLUDED.bigfive_scores,
 work_values_scores=EXCLUDED.work_values_scores,
 employability_scores=EXCLUDED.employability_scores,
 employability_readiness=EXCLUDED.employability_readiness,
 knowledge_score=EXCLUDED.knowledge_score,
 knowledge_details=EXCLUDED.knowledge_details,
 career_fit=EXCLUDED.career_fit,
 skill_gap=EXCLUDED.skill_gap,
 skill_gap_courses=EXCLUDED.skill_gap_courses,
 platform_courses=EXCLUDED.platform_courses,
 courses_by_type=EXCLUDED.courses_by_type,
 roadmap=EXCLUDED.roadmap,
 profile_snapshot=EXCLUDED.profile_snapshot,
 timing_analysis=EXCLUDED.timing_analysis,
 final_note=EXCLUDED.final_note,
 overall_summary=EXCLUDED.overall_summary,
 gemini_results=EXCLUDED.gemini_results,
 adaptive_aptitude_session_id=EXCLUDED.adaptive_aptitude_session_id,
 updated_at=EXCLUDED.updated_at RETURNING id INTO v_existing.id;
 IF v_attempt.status='in_progress' THEN
   UPDATE public.personal_assessment_attempts SET status='completed',completed_at=clock_timestamp(),
     section_timings=v_timings,updated_at=clock_timestamp() WHERE id=p_attempt;
 END IF;
 RETURN jsonb_build_object('attemptId',p_attempt,'resultId',v_existing.id);
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_owned_assessment(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_owned_assessment(uuid,uuid,text,jsonb) TO service_role;
