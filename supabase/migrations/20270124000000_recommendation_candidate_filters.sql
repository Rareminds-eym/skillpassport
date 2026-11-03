BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
CREATE INDEX IF NOT EXISTS recommendation_applied_exclusion ON public.applied_jobs(learner_id,opportunity_id);
CREATE INDEX IF NOT EXISTS recommendation_interaction_exclusion ON public.opportunity_interactions(learner_id,opportunity_id) WHERE action IN ('dismiss','apply');

CREATE FUNCTION public.recommendation_choice_key_v1(value text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = pg_catalog AS $$
  SELECT CASE WHEN key = 'on site' THEN 'onsite' ELSE key END
  FROM (SELECT regexp_replace(lower(trim(normalize(coalesce(value,''), NFKC))), '[-_[:space:]]+', ' ', 'g') key) normalized;
$$;

CREATE FUNCTION public.recommendation_job_allowed_v1(p_learner uuid,p_user uuid,p_job uuid,p_type text,p_location text,p_mode text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT EXISTS(SELECT 1 FROM public.learners WHERE id=p_learner AND user_id=p_user)
    AND NOT EXISTS(SELECT 1 FROM public.applied_jobs WHERE learner_id=p_learner AND opportunity_id=p_job)
    AND NOT EXISTS(SELECT 1 FROM public.opportunity_interactions WHERE learner_id=p_user AND opportunity_id=p_job AND action IN ('dismiss','apply'))
    AND coalesce((SELECT
      (NOT coalesce((preferences->>'strictEmploymentTypes')::boolean,false) OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(preferences->'employmentTypes') choice WHERE public.recommendation_choice_key_v1(choice)=public.recommendation_choice_key_v1(p_type)))
      AND (NOT coalesce((preferences->>'strictWorkModes')::boolean,false) OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(preferences->'workModes') choice WHERE public.recommendation_choice_key_v1(choice)=public.recommendation_choice_key_v1(p_mode)))
      AND (NOT coalesce((preferences->>'strictLocations')::boolean,false) OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(preferences->'locations') choice, unnest(array_prepend(p_location,string_to_array(p_location,','))) part WHERE public.recommendation_choice_key_v1(choice)=public.recommendation_choice_key_v1(part)))
      FROM public.learner_career_preferences WHERE learner_id=p_learner),true);
$$;

CREATE FUNCTION public.get_recommendation_candidates_v1(p_learner_id uuid,p_user_id uuid) RETURNS SETOF public.opportunities
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT o.* FROM public.opportunities o
  WHERE o.status='open' AND o.is_active AND o.employment_type<>'factory_visit'
    AND (o.deadline IS NULL OR o.deadline>now())
    AND public.recommendation_job_allowed_v1(p_learner_id,p_user_id,o.id,o.employment_type,o.location,o.mode)
  ORDER BY o.created_at DESC,o.id LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION public.match_verified_opportunities(p_learner_id uuid,p_user_id uuid,p_model text,p_revision bigint,p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid,similarity double precision,final_score double precision,match_percentage integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,extensions AS $$
DECLARE query_vector extensions.vector;
BEGIN
 SELECT s.embedding INTO query_vector FROM public.learner_recommendation_state s
 JOIN public.learners l ON l.id=s.learner_id
 WHERE l.id=p_learner_id AND l.user_id=p_user_id AND s.revision=p_revision
 AND s.vector_revision=p_revision AND s.model_version=p_model AND s.valid_until>now();
 IF query_vector IS NULL THEN RAISE EXCEPTION 'Current matching profile is unavailable'; END IF;
 RETURN QUERY SELECT o.id,(1-(e.embedding<=>query_vector))::double precision,
   greatest(0,least(1,1-(e.embedding<=>query_vector)))::double precision,
   round(greatest(0,least(1,1-(e.embedding<=>query_vector)))*100)::integer
 FROM public.opportunities o JOIN public.embeddings e ON e.entity_type='opportunity' AND e.entity_id=o.id
 WHERE o.status='open' AND o.is_active AND o.employment_type<>'factory_visit'
 AND (o.deadline IS NULL OR o.deadline>now()) AND e.embedding IS NOT NULL
 AND e.model_version=p_model AND e.input_hash=md5(public.job_matching_text(o))
 AND public.recommendation_job_allowed_v1(p_learner_id,p_user_id,o.id,o.employment_type,o.location,o.mode)
 AND (1-(e.embedding<=>query_vector))>0
 ORDER BY e.embedding<=>query_vector,o.id LIMIT least(greatest(p_limit,1),50);
END; $$;

CREATE TRIGGER recommendation_input_revision_v3 AFTER INSERT OR UPDATE OR DELETE ON public.applied_jobs
  FOR EACH ROW EXECUTE FUNCTION public.bump_recommendation_input_v3();
CREATE TRIGGER recommendation_input_revision_v3 AFTER INSERT OR UPDATE OR DELETE ON public.personal_assessment_results
  FOR EACH ROW EXECUTE FUNCTION public.bump_recommendation_input_v3();

REVOKE ALL ON FUNCTION public.recommendation_choice_key_v1(text), public.recommendation_job_allowed_v1(uuid,uuid,uuid,text,text,text),public.get_recommendation_candidates_v1(uuid,uuid),public.match_verified_opportunities(uuid,uuid,text,bigint,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recommendation_choice_key_v1(text), public.recommendation_job_allowed_v1(uuid,uuid,uuid,text,text,text),public.get_recommendation_candidates_v1(uuid,uuid),public.match_verified_opportunities(uuid,uuid,text,bigint,integer) TO service_role;
COMMIT;
