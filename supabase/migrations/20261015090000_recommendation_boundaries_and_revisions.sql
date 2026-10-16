-- Additive recommendation-only lifecycle. Apply in staging BEFORE backend cutover.
-- No existing vectors, cache rows, statuses, or subscription data are rewritten.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Legacy SECURITY DEFINER cache endpoints must not bypass the verified SSO API.
REVOKE ALL ON FUNCTION public.get_cached_job_matches(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_job_matches_cache(uuid,jsonb,character varying) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_job_matches_cache_valid(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_learner_profile_hash(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cached_job_matches(uuid), public.save_job_matches_cache(uuid,jsonb,character varying),
  public.is_job_matches_cache_valid(uuid), public.compute_learner_profile_hash(uuid) TO service_role;
DO $$
DECLARE routine regprocedure;
BEGIN
  -- Exact installed overloads are inventory-driven; do not manufacture the
  -- missing historical V1 helper/function to make a local schema look complete.
  FOR routine IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('match_opportunities_enhanced_v2','match_opportunities_enhanced') LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', routine);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', routine);
  END LOOP;
END;
$$;

CREATE TABLE public.recommendation_catalog_revision (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  revision bigint NOT NULL DEFAULT 1
);
INSERT INTO public.recommendation_catalog_revision(singleton) VALUES (true);
CREATE TABLE public.learner_recommendation_state (
  learner_id uuid PRIMARY KEY REFERENCES public.learners(id) ON DELETE CASCADE,
  revision bigint NOT NULL DEFAULT 1,
  embedding extensions.vector(1536),
  vector_revision bigint,
  model_version text,
  preprocessing_version text,
  ranking_policy_version text,
  algorithm_version text,
  matches jsonb,
  matches_revision bigint,
  catalog_revision bigint,
  computed_at timestamptz,
  expires_at timestamptz,
  -- Expiry-driven changes do not fire UPDATE triggers. Daily ceiling plus the
  -- next certificate expiry fences reuse without requiring a background job.
  valid_until timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.learner_recommendation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_catalog_revision ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.learner_recommendation_state, public.recommendation_catalog_revision FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.learner_recommendation_state, public.recommendation_catalog_revision TO service_role;

CREATE FUNCTION public.bump_recommendation_input_v3() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public SET timezone = 'UTC' AS $$
DECLARE old_id uuid; new_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'learners' THEN
    -- The legacy vector/updated_at may be written by other pipelines. Neither
    -- can publish or overwrite this recommendation-specific versioned vector.
    IF TG_OP = 'UPDATE' AND (to_jsonb(NEW) - 'embedding' - 'updated_at') = (to_jsonb(OLD) - 'embedding' - 'updated_at') THEN
      RETURN NEW;
    END IF;
    new_id := NEW.id;
  ELSE
    IF TG_OP <> 'INSERT' THEN old_id := OLD.learner_id; END IF;
    IF TG_OP <> 'DELETE' THEN new_id := NEW.learner_id; END IF;
    IF TG_TABLE_NAME = 'opportunity_interactions' THEN
      SELECT id INTO old_id FROM public.learners WHERE user_id = old_id;
      SELECT id INTO new_id FROM public.learners WHERE user_id = new_id;
    END IF;
  END IF;
  -- Stable lock order for an evidence row moved between learners.
  INSERT INTO public.learner_recommendation_state(learner_id, revision)
    SELECT id, 1 FROM public.learners WHERE id IN (old_id, new_id) ORDER BY id
    ON CONFLICT (learner_id) DO UPDATE SET revision = learner_recommendation_state.revision + 1, valid_until = now();
  RETURN NULL; -- AFTER trigger; return value is ignored.
END;
$$;
CREATE FUNCTION public.bump_recommendation_catalog_v3() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  UPDATE public.recommendation_catalog_revision SET revision = revision + 1 WHERE singleton;
  RETURN NULL;
END;
$$;
CREATE TRIGGER recommendation_learner_revision_v3 AFTER UPDATE ON public.learners
  FOR EACH ROW EXECUTE FUNCTION public.bump_recommendation_input_v3();
DO $$
DECLARE relation text;
BEGIN
  FOREACH relation IN ARRAY ARRAY['skills','certificates','projects','trainings','course_enrollments','opportunity_interactions'] LOOP
    EXECUTE format('CREATE TRIGGER recommendation_input_revision_v3 AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.bump_recommendation_input_v3()', relation);
  END LOOP;
END;
$$;
CREATE TRIGGER recommendation_catalog_revision_v3 AFTER INSERT OR UPDATE OR DELETE ON public.opportunities
  FOR EACH STATEMENT EXECUTE FUNCTION public.bump_recommendation_catalog_v3();

-- Never continue ranking against an entity/job vector after its source changes.
-- Existing regeneration mechanisms remain deployment dependencies. Null is a
-- truthful dirty/pending state; this migration does not call an unknown worker.
CREATE FUNCTION public.clear_changed_recommendation_embedding_v3() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['embedding','updated_at','views_count','view_count','applications_count','messages_count'])
    IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['embedding','updated_at','views_count','view_count','applications_count','messages_count'])
    AND NEW.embedding::text IS NOT DISTINCT FROM OLD.embedding::text THEN
    NEW.embedding := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DO $$
DECLARE relation text;
BEGIN
  FOREACH relation IN ARRAY ARRAY['skills','certificates','projects','opportunities'] LOOP
    EXECUTE format('CREATE TRIGGER recommendation_clear_dirty_vector_v3 BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.clear_changed_recommendation_embedding_v3()', relation);
  END LOOP;
END;
$$;

CREATE FUNCTION public.get_recommendation_state_v3(p_learner_id uuid, p_user_id uuid, p_model text, p_preprocessing text, p_ranking_policy text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public SET timezone = 'UTC' AS $$
DECLARE s public.learner_recommendation_state; catalog bigint; next_expiry timestamptz;
BEGIN
  -- Bind every cache/state validation to the actor too. The key-share lock
  -- keeps a concurrent ownership transfer/deletion out of this short read.
  PERFORM 1 FROM public.learners WHERE id = p_learner_id AND user_id = p_user_id FOR KEY SHARE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  INSERT INTO public.learner_recommendation_state(learner_id)
    SELECT id FROM public.learners WHERE id = p_learner_id ON CONFLICT DO NOTHING;
  SELECT * INTO s FROM public.learner_recommendation_state WHERE learner_id = p_learner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF s.valid_until <= clock_timestamp() THEN
    SELECT min(expiry_date::timestamptz) INTO next_expiry FROM public.certificates
      WHERE learner_id = p_learner_id AND enabled = true AND approval_status = 'approved'
        AND expiry_date::timestamptz > clock_timestamp();
    UPDATE public.learner_recommendation_state SET revision = revision + 1,
      valid_until = LEAST(date_trunc('day', clock_timestamp()) + interval '1 day', COALESCE(next_expiry, 'infinity'))
      WHERE learner_id = p_learner_id RETURNING * INTO s;
  END IF;
  SELECT revision INTO catalog FROM public.recommendation_catalog_revision WHERE singleton;
  RETURN jsonb_build_object('revision', s.revision::text, 'catalog_revision', catalog::text,
    'embedding', CASE WHEN s.vector_revision = s.revision AND s.model_version = p_model
      AND s.preprocessing_version = p_preprocessing THEN s.embedding::text ELSE NULL END,
    'matches', CASE WHEN s.matches_revision = s.revision AND s.catalog_revision = catalog
      AND s.model_version = p_model AND s.preprocessing_version = p_preprocessing
      AND s.ranking_policy_version = p_ranking_policy AND s.algorithm_version IN ('v1.0','v2.0')
      AND s.expires_at > clock_timestamp() THEN s.matches ELSE NULL END,
    'computed_at', s.computed_at, 'algorithm_version', s.algorithm_version);
END;
$$;

CREATE FUNCTION public.publish_recommendation_vector_v3(p_learner_id uuid, p_user_id uuid, p_revision bigint, p_model text, p_embedding extensions.vector, p_preprocessing text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE affected integer;
BEGIN
  IF p_model IS NULL OR length(p_model) = 0 OR p_preprocessing IS NULL OR length(p_preprocessing) = 0
    OR p_embedding IS NULL OR extensions.vector_dims(p_embedding) <> 1536 OR extensions.vector_norm(p_embedding) = 0 THEN RETURN false; END IF;
  UPDATE public.learner_recommendation_state SET embedding = p_embedding, vector_revision = p_revision,
    model_version = p_model, preprocessing_version = p_preprocessing, matches = NULL, matches_revision = NULL,
    ranking_policy_version = NULL, algorithm_version = NULL
    WHERE learner_id = p_learner_id AND revision = p_revision AND valid_until > clock_timestamp()
      AND EXISTS (SELECT 1 FROM public.learners WHERE id = p_learner_id AND user_id = p_user_id);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END;
$$;

CREATE FUNCTION public.save_recommendation_matches_v3(p_learner_id uuid, p_user_id uuid, p_revision bigint, p_catalog_revision bigint, p_model text, p_matches jsonb, p_preprocessing text, p_ranking_policy text, p_algorithm text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE affected integer;
BEGIN
  IF p_matches IS NULL OR jsonb_typeof(p_matches) <> 'array' OR jsonb_array_length(p_matches) > 100
    OR p_ranking_policy IS NULL OR length(p_ranking_policy) = 0
    OR p_algorithm IS NULL OR p_algorithm NOT IN ('v1.0','v2.0') THEN RETURN false; END IF;
  UPDATE public.learner_recommendation_state SET matches = p_matches, matches_revision = p_revision,
    catalog_revision = p_catalog_revision, ranking_policy_version = p_ranking_policy, algorithm_version = p_algorithm,
    computed_at = clock_timestamp(), expires_at = clock_timestamp() + interval '24 hours'
    WHERE learner_id = p_learner_id AND revision = p_revision AND vector_revision = p_revision
      AND model_version = p_model AND preprocessing_version = p_preprocessing AND valid_until > clock_timestamp()
      AND EXISTS (SELECT 1 FROM public.learners WHERE id = p_learner_id AND user_id = p_user_id)
      AND p_catalog_revision = (SELECT revision FROM public.recommendation_catalog_revision WHERE singleton);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END;
$$;

-- A generic list is not a personalized ranking. Resolve its actor and filter
-- dismissed IDs before LIMIT, rather than overfetching an arbitrary finite
-- prefix that can still consist entirely of dismissed jobs.
CREATE FUNCTION public.get_generic_recommendations_v3(p_learner_id uuid, p_user_id uuid, p_limit integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 50 THEN RETURN NULL; END IF;
  PERFORM 1 FROM public.learners WHERE id = p_learner_id AND user_id = p_user_id FOR KEY SHARE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', candidate.id) ORDER BY candidate.posted_date DESC NULLS LAST, candidate.created_at DESC, candidate.id), '[]'::jsonb)
    FROM (SELECT o.id, o.posted_date, o.created_at FROM public.opportunities o
      WHERE o.status = 'open' AND o.is_active = true AND (o.deadline IS NULL OR o.deadline > clock_timestamp())
        AND NOT EXISTS (SELECT 1 FROM public.opportunity_interactions i
          WHERE i.learner_id = p_user_id AND i.opportunity_id = o.id AND i.action = 'dismiss')
      ORDER BY o.posted_date DESC NULLS LAST, o.created_at DESC, o.id LIMIT p_limit) candidate);
END;
$$;

REVOKE ALL ON FUNCTION public.bump_recommendation_input_v3(), public.bump_recommendation_catalog_v3(),
  public.clear_changed_recommendation_embedding_v3(),
  public.get_recommendation_state_v3(uuid,uuid,text,text,text), public.publish_recommendation_vector_v3(uuid,uuid,bigint,text,extensions.vector,text),
  public.save_recommendation_matches_v3(uuid,uuid,bigint,bigint,text,jsonb,text,text,text),
  public.get_generic_recommendations_v3(uuid,uuid,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommendation_state_v3(uuid,uuid,text,text,text),
  public.publish_recommendation_vector_v3(uuid,uuid,bigint,text,extensions.vector,text),
  public.save_recommendation_matches_v3(uuid,uuid,bigint,bigint,text,jsonb,text,text,text),
  public.get_generic_recommendations_v3(uuid,uuid,integer) TO service_role;
COMMIT;
