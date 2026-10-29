-- Add context dependencies before deploying the canonical reader/readiness guard.
-- No source rows, historical vectors or job embeddings are rewritten.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE TRIGGER recommendation_input_revision_v3 AFTER INSERT OR UPDATE OR DELETE ON public.education
  FOR EACH ROW EXECUTE FUNCTION public.bump_recommendation_input_v3();
CREATE TRIGGER recommendation_input_revision_v3 AFTER INSERT OR UPDATE OR DELETE ON public.experience
  FOR EACH ROW EXECUTE FUNCTION public.bump_recommendation_input_v3();

-- Existence of this function also identifies the source-revision contract.
-- Reuse the existing owned state initializer and clock-expiry fence. No
-- provider/index work and no adoption or return of a legacy vector.
CREATE FUNCTION public.get_recommendation_context_revision_v1(p_learner_id uuid, p_user_id uuid) RETURNS text
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT public.get_recommendation_state_v3(p_learner_id, p_user_id, '', '', '') ->> 'revision';
$$;
REVOKE ALL ON FUNCTION public.get_recommendation_context_revision_v1(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommendation_context_revision_v1(uuid,uuid) TO service_role;
COMMIT;
