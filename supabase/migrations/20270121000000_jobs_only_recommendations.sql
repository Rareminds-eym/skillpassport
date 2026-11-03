-- Job recommendations and index readiness exclude industrial visits.
-- Existing visit records and vectors remain available to the visits feature.
BEGIN;
SET LOCAL lock_timeout='5s';

CREATE OR REPLACE FUNCTION public.get_job_matching_index_batch(p_model text,p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid,input_text text,input_hash text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT o.id,public.job_matching_text(o),md5(public.job_matching_text(o))
 FROM public.opportunities o LEFT JOIN public.embeddings e ON e.entity_type='opportunity' AND e.entity_id=o.id WHERE o.status='open' AND o.is_active AND o.employment_type<>'factory_visit'
 AND (o.deadline IS NULL OR o.deadline>now())
 AND (e.embedding IS NULL OR e.model_version IS DISTINCT FROM p_model
   OR e.input_hash IS DISTINCT FROM md5(public.job_matching_text(o)))
 ORDER BY o.id LIMIT least(greatest(p_limit,1),100);
$$;

CREATE OR REPLACE FUNCTION public.publish_job_matching_vector(p_id uuid,p_model text,p_input_hash text,p_embedding extensions.vector)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.opportunities;
BEGIN
 IF nullif(btrim(p_model),'') IS NULL OR p_embedding IS NULL OR extensions.vector_dims(p_embedding)<>1536
 OR NOT (extensions.vector_norm(p_embedding)>0 AND extensions.vector_norm(p_embedding)<'Infinity'::double precision)
 THEN RETURN false; END IF;
 SELECT * INTO job FROM public.opportunities WHERE id=p_id AND status='open' AND is_active AND employment_type<>'factory_visit'
 AND (deadline IS NULL OR deadline>now()) FOR UPDATE;
 IF NOT FOUND OR md5(public.job_matching_text(job)) IS DISTINCT FROM p_input_hash THEN RETURN false; END IF;
 INSERT INTO public.embeddings(entity_type,entity_id,embedding,model_version,input_hash)
 VALUES('opportunity',p_id,p_embedding,p_model,p_input_hash)
 ON CONFLICT(entity_type,entity_id) DO UPDATE SET embedding=EXCLUDED.embedding,model_version=EXCLUDED.model_version,input_hash=EXCLUDED.input_hash,updated_at=now();
 UPDATE public.recommendation_catalog_revision SET revision=revision+1 WHERE singleton;
 RETURN true;
END; $$;

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
 AND NOT EXISTS(SELECT 1 FROM public.opportunity_interactions i WHERE i.learner_id=p_user_id AND i.action='dismiss' AND i.opportunity_id=o.id)
 AND (1-(e.embedding<=>query_vector))>0
 ORDER BY e.embedding<=>query_vector,o.id LIMIT least(greatest(p_limit,1),50);
END; $$;

CREATE OR REPLACE FUNCTION public.job_matching_index_status(p_model text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('total',count(*),'verified',count(*) FILTER(WHERE e.embedding IS NOT NULL
 AND e.model_version=p_model AND e.input_hash=md5(public.job_matching_text(o))))
 FROM public.opportunities o LEFT JOIN public.embeddings e ON e.entity_type='opportunity' AND e.entity_id=o.id WHERE o.status='open' AND o.is_active AND o.employment_type<>'factory_visit' AND (o.deadline IS NULL OR o.deadline>now());
$$;
REVOKE ALL ON FUNCTION public.get_job_matching_index_batch(text,integer),public.publish_job_matching_vector(uuid,text,text,extensions.vector),public.match_verified_opportunities(uuid,uuid,text,bigint,integer),public.job_matching_index_status(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_matching_index_batch(text,integer),public.publish_job_matching_vector(uuid,text,text,extensions.vector),public.match_verified_opportunities(uuid,uuid,text,bigint,integer),public.job_matching_index_status(text) TO service_role;
COMMIT;
