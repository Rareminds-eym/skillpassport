-- Explicit server authorization; no Supabase Auth/RLS dependency.
CREATE OR REPLACE FUNCTION public.patch_owned_assessment_progress(
  p_owner uuid, p_attempt uuid, p_action text, p_patch jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $$
DECLARE
  v_learner uuid;
  v_attempt public.personal_assessment_attempts%ROWTYPE;
  v_key text;
  v_value jsonb;
  v_session uuid;
  v_timings jsonb;
BEGIN
  IF p_action NOT IN ('progress','abandon') OR p_action IS NULL
    OR p_patch IS NULL OR jsonb_typeof(p_patch) <> 'object'
    OR octet_length(p_patch::text) > 262144 THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid progress request';
  END IF;
  FOR v_key, v_value IN SELECT * FROM jsonb_each(p_patch) LOOP
    IF v_key NOT IN ('current_section_index','current_question_index','timer_remaining',
      'elapsed_time','aptitude_question_timer','section_timings','all_responses','adaptive_aptitude_session_id') THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Unsupported progress field';
    END IF;
    IF v_key IN ('section_timings','all_responses') THEN
      IF jsonb_typeof(v_value) <> 'object' THEN
        RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Progress maps must be objects';
      END IF;
    ELSIF v_key = 'adaptive_aptitude_session_id' THEN
      IF jsonb_typeof(v_value) <> 'string' OR (p_patch->>v_key) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid adaptive session';
      END IF;
    ELSIF NOT (v_value = 'null'::jsonb AND v_key IN ('timer_remaining','aptitude_question_timer')) THEN
      IF jsonb_typeof(v_value) <> 'number' OR v_value::text !~ '^[0-9]+$' OR (v_value::text)::numeric > 2147483647 THEN
        RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid progress number';
      END IF;
    END IF;
  END LOOP;
  IF p_action='abandon' AND p_patch <> '{}'::jsonb THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Abandon does not accept progress fields';
  END IF;

  -- Lock identity binding before the attempt, retaining ownership through commit.
  BEGIN
    SELECT id INTO STRICT v_learner FROM public.learners WHERE user_id=p_owner FOR SHARE;
  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL;
  END;
  SELECT * INTO v_attempt FROM public.personal_assessment_attempts
    WHERE id=p_attempt AND learner_id=v_learner FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF p_action='abandon' AND v_attempt.status='abandoned' THEN RETURN to_jsonb(v_attempt); END IF;
  IF v_attempt.status IS DISTINCT FROM 'in_progress' THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='assessment_not_in_progress';
  END IF;

  IF p_patch ? 'adaptive_aptitude_session_id' THEN
    v_session := (p_patch->>'adaptive_aptitude_session_id')::uuid;
    PERFORM id FROM public.adaptive_aptitude_sessions WHERE id=v_session AND learner_id=v_learner FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Adaptive session is not owned'; END IF;
    IF v_attempt.adaptive_aptitude_session_id IS NOT NULL AND v_attempt.adaptive_aptitude_session_id <> v_session THEN
      PERFORM id FROM public.adaptive_aptitude_sessions
        WHERE id=v_attempt.adaptive_aptitude_session_id AND status='completed' FOR SHARE;
      IF FOUND THEN RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='completed_adaptive_link_is_immutable'; END IF;
    END IF;
  END IF;

  IF jsonb_typeof(COALESCE(v_attempt.section_timings,'{}'::jsonb)) <> 'object'
    OR jsonb_typeof(COALESCE(v_attempt.all_responses,'{}'::jsonb)) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='invalid_existing_progress';
  END IF;
  v_timings := COALESCE(v_attempt.section_timings,'{}'::jsonb) || COALESCE(p_patch->'section_timings','{}'::jsonb);
  FOR v_key, v_value IN SELECT * FROM jsonb_each(v_timings) LOOP
    IF jsonb_typeof(v_value) <> 'number' OR v_value::text !~ '^[0-9]+$' OR (v_value::text)::numeric > 2147483647 THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid section timing';
    END IF;
  END LOOP;
  IF (SELECT COALESCE(sum(value::numeric),0) FROM jsonb_each_text(v_timings)) > 2147483647 THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Section timings exceed integer capacity';
  END IF;

  UPDATE public.personal_assessment_attempts SET
    status=CASE WHEN p_action='abandon' THEN 'abandoned' ELSE status END,
    completed_at=CASE WHEN p_action='abandon' THEN clock_timestamp() ELSE completed_at END,
    current_section_index=CASE WHEN p_patch ? 'current_section_index' THEN (p_patch->>'current_section_index')::integer ELSE current_section_index END,
    current_question_index=CASE WHEN p_patch ? 'current_question_index' THEN (p_patch->>'current_question_index')::integer ELSE current_question_index END,
    timer_remaining=CASE WHEN p_patch ? 'timer_remaining' THEN (p_patch->>'timer_remaining')::integer ELSE timer_remaining END,
    elapsed_time=CASE WHEN p_patch ? 'elapsed_time' THEN (p_patch->>'elapsed_time')::integer ELSE elapsed_time END,
    aptitude_question_timer=CASE WHEN p_patch ? 'aptitude_question_timer' THEN (p_patch->>'aptitude_question_timer')::integer ELSE aptitude_question_timer END,
    adaptive_aptitude_session_id=COALESCE(v_session,adaptive_aptitude_session_id),
    section_timings=v_timings,
    all_responses=COALESCE(all_responses,'{}'::jsonb) || COALESCE(p_patch->'all_responses','{}'::jsonb),
    updated_at=clock_timestamp()
  WHERE id=p_attempt AND learner_id=v_learner RETURNING * INTO v_attempt;
  RETURN to_jsonb(v_attempt);
END;
$$;
REVOKE ALL ON FUNCTION public.patch_owned_assessment_progress(uuid,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.patch_owned_assessment_progress(uuid,uuid,text,jsonb) TO service_role;
