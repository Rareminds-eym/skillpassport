BEGIN;
CREATE FUNCTION public.get_recommendation_freshness_v1(p_learner_id uuid,p_user_id uuid) RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT jsonb_build_object('inputRevision',state->>'revision','catalogRevision',state->>'catalog_revision')
  FROM (SELECT public.get_recommendation_state_v3(p_learner_id,p_user_id,'','','') state) owned;
$$;
REVOKE ALL ON FUNCTION public.get_recommendation_freshness_v1(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommendation_freshness_v1(uuid,uuid) TO service_role;
COMMIT;
