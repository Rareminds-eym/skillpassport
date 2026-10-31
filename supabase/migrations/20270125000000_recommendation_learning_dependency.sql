BEGIN;
CREATE TABLE public.learner_recommendation_learning_dependency (
  learner_id uuid PRIMARY KEY REFERENCES public.learners(id) ON DELETE CASCADE,
  dependency_hash text NOT NULL CHECK (dependency_hash ~ '^[a-f0-9]{32}$')
);
ALTER TABLE public.learner_recommendation_learning_dependency ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.learner_recommendation_learning_dependency FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.learner_recommendation_learning_dependency TO service_role;
CREATE TRIGGER recommendation_input_revision_v3 AFTER INSERT OR UPDATE OR DELETE ON public.learner_recommendation_learning_dependency
  FOR EACH ROW EXECUTE FUNCTION public.bump_recommendation_input_v3();
CREATE FUNCTION public.sync_recommendation_learning_dependency_v1(p_learner_id uuid,p_user_id uuid,p_hash text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  PERFORM 1 FROM public.learners WHERE id=p_learner_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Learner ownership changed' USING ERRCODE='42501'; END IF;
  INSERT INTO public.learner_recommendation_learning_dependency(learner_id,dependency_hash) VALUES(p_learner_id,p_hash)
    ON CONFLICT(learner_id) DO UPDATE SET dependency_hash=excluded.dependency_hash
    WHERE learner_recommendation_learning_dependency.dependency_hash IS DISTINCT FROM excluded.dependency_hash;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_recommendation_learning_dependency_v1(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sync_recommendation_learning_dependency_v1(uuid,uuid,text) TO service_role;
COMMIT;
