-- Reuses embeddings and learner_recommendation_state; no new tables.
BEGIN;
ALTER TABLE public.embeddings
 ADD COLUMN model_version text,
 ADD COLUMN input_hash text;
ALTER TABLE public.embeddings DROP CONSTRAINT chk_entity_type;
ALTER TABLE public.embeddings ADD CONSTRAINT chk_entity_type CHECK(entity_type IN ('role','opportunity'));
-- Preserve the existing role-vector access policy. Job-vector writes are
-- guarded below, and index maintenance RPCs are service-only.

-- The exact text is shared by indexing, publication and ranking. A changed
-- source cannot accidentally retain an old, apparently verified job vector.
CREATE FUNCTION public.job_matching_text(p public.opportunities) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,public AS $$
 SELECT left(concat_ws(E'\n', 'Job: '||coalesce(p.job_title,p.title),
   'Company: '||p.company_name, 'Location: '||p.location,
   'Employment: '||p.employment_type, 'Experience: '||p.experience_level,
   'Required skills: '||p.skills_required::text,
   'Requirements: '||p.requirements::text,
   'Description: '||p.description),10000);
$$;
REVOKE ALL ON FUNCTION public.job_matching_text(public.opportunities) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.job_matching_text(public.opportunities) TO service_role;

CREATE FUNCTION public.get_job_matching_index_batch(p_model text,p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid,input_text text,input_hash text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT o.id,public.job_matching_text(o),md5(public.job_matching_text(o))
 FROM public.opportunities o LEFT JOIN public.embeddings e ON e.entity_type='opportunity' AND e.entity_id=o.id WHERE o.status='open' AND o.is_active
 AND (o.deadline IS NULL OR o.deadline>now())
 AND (e.embedding IS NULL OR e.model_version IS DISTINCT FROM p_model
   OR e.input_hash IS DISTINCT FROM md5(public.job_matching_text(o)))
 ORDER BY o.id LIMIT least(greatest(p_limit,1),100);
$$;
CREATE FUNCTION public.publish_job_matching_vector(p_id uuid,p_model text,p_input_hash text,p_embedding extensions.vector)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.opportunities;
BEGIN
 IF nullif(btrim(p_model),'') IS NULL OR p_embedding IS NULL OR extensions.vector_dims(p_embedding)<>1536
 OR NOT (extensions.vector_norm(p_embedding)>0 AND extensions.vector_norm(p_embedding)<'Infinity'::double precision)
 THEN RETURN false; END IF;
 SELECT * INTO job FROM public.opportunities WHERE id=p_id AND status='open' AND is_active
 AND (deadline IS NULL OR deadline>now()) FOR UPDATE;
 IF NOT FOUND OR md5(public.job_matching_text(job)) IS DISTINCT FROM p_input_hash THEN RETURN false; END IF;
 INSERT INTO public.embeddings(entity_type,entity_id,embedding,model_version,input_hash)
 VALUES('opportunity',p_id,p_embedding,p_model,p_input_hash)
 ON CONFLICT(entity_type,entity_id) DO UPDATE SET embedding=EXCLUDED.embedding,model_version=EXCLUDED.model_version,input_hash=EXCLUDED.input_hash,updated_at=now();
 UPDATE public.recommendation_catalog_revision SET revision=revision+1 WHERE singleton;
 RETURN true;
END; $$;

CREATE FUNCTION public.guard_job_vector_provenance() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF (NEW.entity_type='opportunity' OR (TG_OP='UPDATE' AND OLD.entity_type='opportunity'))
 AND current_user<>pg_get_userbyid((SELECT proowner FROM pg_proc WHERE oid='public.publish_job_matching_vector(uuid,text,text,extensions.vector)'::regprocedure))
 THEN RAISE EXCEPTION 'Job vectors must be published through the matching index'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_job_vector_provenance BEFORE INSERT OR UPDATE
 ON public.embeddings FOR EACH ROW EXECUTE FUNCTION public.guard_job_vector_provenance();

CREATE FUNCTION public.match_verified_opportunities(p_learner_id uuid,p_user_id uuid,p_model text,p_revision bigint,p_limit integer DEFAULT 50)
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
 WHERE o.status='open' AND o.is_active
 AND (o.deadline IS NULL OR o.deadline>now()) AND e.embedding IS NOT NULL
 AND e.model_version=p_model AND e.input_hash=md5(public.job_matching_text(o))
 AND NOT EXISTS(SELECT 1 FROM public.opportunity_interactions i WHERE i.learner_id=p_user_id AND i.action='dismiss' AND i.opportunity_id=o.id)
 AND (1-(e.embedding<=>query_vector))>0
 ORDER BY e.embedding<=>query_vector,o.id LIMIT least(greatest(p_limit,1),50);
END; $$;
CREATE FUNCTION public.job_matching_index_status(p_model text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('total',count(*),'verified',count(*) FILTER(WHERE e.embedding IS NOT NULL
 AND e.model_version=p_model AND e.input_hash=md5(public.job_matching_text(o))))
 FROM public.opportunities o LEFT JOIN public.embeddings e ON e.entity_type='opportunity' AND e.entity_id=o.id WHERE o.status='open' AND o.is_active AND (o.deadline IS NULL OR o.deadline>now());
$$;
REVOKE ALL ON FUNCTION public.get_job_matching_index_batch(text,integer),public.publish_job_matching_vector(uuid,text,text,extensions.vector),public.match_verified_opportunities(uuid,uuid,text,bigint,integer),public.job_matching_index_status(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_matching_index_batch(text,integer),public.publish_job_matching_vector(uuid,text,text,extensions.vector),public.match_verified_opportunities(uuid,uuid,text,bigint,integer),public.job_matching_index_status(text) TO service_role;
CREATE OR REPLACE FUNCTION public.get_recommendation_state_v3(p_learner_id uuid, p_user_id uuid, p_model text, p_preprocessing text, p_ranking_policy text) RETURNS jsonb
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
      AND s.ranking_policy_version = p_ranking_policy AND s.algorithm_version IN ('v1.0','v2.0','semantic-v3')
      AND s.expires_at > clock_timestamp() THEN s.matches ELSE NULL END,
    'computed_at', s.computed_at, 'algorithm_version', s.algorithm_version);
END;
$$;
CREATE OR REPLACE FUNCTION public.save_recommendation_matches_v3(p_learner_id uuid, p_user_id uuid, p_revision bigint, p_catalog_revision bigint, p_model text, p_matches jsonb, p_preprocessing text, p_ranking_policy text, p_algorithm text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE affected integer;
BEGIN
  IF p_matches IS NULL OR jsonb_typeof(p_matches) <> 'array' OR jsonb_array_length(p_matches) > 100
    OR p_ranking_policy IS NULL OR length(p_ranking_policy) = 0
    OR p_algorithm IS NULL OR p_algorithm NOT IN ('v1.0','v2.0','semantic-v3') THEN RETURN false; END IF;
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
COMMIT;
