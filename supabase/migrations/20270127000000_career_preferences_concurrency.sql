BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- A token changes on every update, including trusted maintenance writes. It
-- does not depend on wall-clock precision or unrelated profile revisions.
ALTER TABLE public.learner_career_preferences ADD COLUMN revision uuid NOT NULL DEFAULT gen_random_uuid();
CREATE FUNCTION public.advance_career_preferences_revision_v1() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN NEW.revision := gen_random_uuid(); RETURN NEW; END;
$$;
CREATE TRIGGER career_preferences_revision_v1 BEFORE UPDATE ON public.learner_career_preferences
  FOR EACH ROW EXECUTE FUNCTION public.advance_career_preferences_revision_v1();
REVOKE ALL ON FUNCTION public.advance_career_preferences_revision_v1() FROM PUBLIC,anon,authenticated;

-- Remove the unguarded writer instead of leaving a service API bypass.
DROP FUNCTION public.save_learner_career_preferences_v1(uuid,uuid,jsonb);
REVOKE INSERT,UPDATE,DELETE ON public.learner_career_preferences FROM service_role;
CREATE FUNCTION public.save_learner_career_preferences_v2(p_learner_id uuid,p_user_id uuid,p_preferences jsonb,p_expected_revision uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE current_revision uuid; next_revision uuid;
BEGIN
  -- Serialize first creation too: SELECT FOR UPDATE on a missing preference
  -- row alone would not prevent two simultaneous initial saves.
  PERFORM 1 FROM public.learners WHERE id=p_learner_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Learner ownership changed' USING ERRCODE='42501'; END IF;
  SELECT revision INTO current_revision FROM public.learner_career_preferences WHERE learner_id=p_learner_id;
  IF current_revision IS DISTINCT FROM p_expected_revision THEN
    RAISE EXCEPTION 'Career preferences changed; reload before saving' USING ERRCODE='40001';
  END IF;
  INSERT INTO public.learner_career_preferences(learner_id,preferences) VALUES(p_learner_id,p_preferences)
    ON CONFLICT(learner_id) DO UPDATE SET preferences=excluded.preferences,updated_at=now()
    RETURNING revision INTO next_revision;
  RETURN jsonb_build_object('learnerId',p_learner_id,'preferences',p_preferences,'preferencesRevision',next_revision,
    'inputRevision',public.get_recommendation_context_revision_v1(p_learner_id,p_user_id));
END;
$$;
REVOKE ALL ON FUNCTION public.save_learner_career_preferences_v2(uuid,uuid,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_learner_career_preferences_v2(uuid,uuid,jsonb,uuid) TO service_role;
COMMIT;
