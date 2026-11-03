BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- SSO ownership is checked by the API and the service-only atomic writer.
-- No direct browser/database access to private career preferences.
CREATE TABLE public.learner_career_preferences (
  learner_id uuid PRIMARY KEY REFERENCES public.learners(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL CHECK (jsonb_typeof(preferences) = 'object' AND octet_length(preferences::text) <= 12000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.learner_career_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.learner_career_preferences FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_career_preferences TO service_role;
CREATE TRIGGER recommendation_input_revision_v3
  AFTER INSERT OR UPDATE OR DELETE ON public.learner_career_preferences
  FOR EACH ROW EXECUTE FUNCTION public.bump_recommendation_input_v3();

CREATE FUNCTION public.save_learner_career_preferences_v1(p_learner_id uuid, p_user_id uuid, p_preferences jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  PERFORM 1 FROM public.learners WHERE id = p_learner_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Learner ownership changed' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.learner_career_preferences(learner_id, preferences)
    VALUES(p_learner_id, p_preferences)
    ON CONFLICT(learner_id) DO UPDATE SET preferences = EXCLUDED.preferences, updated_at = now();
  RETURN jsonb_build_object('learnerId', p_learner_id, 'preferences', p_preferences,
    'inputRevision', public.get_recommendation_context_revision_v1(p_learner_id, p_user_id));
END;
$$;
REVOKE ALL ON FUNCTION public.save_learner_career_preferences_v1(uuid,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_learner_career_preferences_v1(uuid,uuid,jsonb) TO service_role;
COMMIT;
