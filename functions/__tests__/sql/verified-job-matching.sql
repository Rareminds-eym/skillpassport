-- Run against a local seeded DB. All vector/state changes are rolled back.
BEGIN;
DO $$
DECLARE job public.opportunities; learner public.learners; source_hash text; old_revision bigint; s jsonb;
 v extensions.vector:=('['||array_to_string(array_fill(0.01::numeric,ARRAY[1536]),',')||']')::extensions.vector;
 signature text; role_name text; found_job boolean;
BEGIN
 SELECT * INTO STRICT job FROM public.opportunities WHERE status='open' AND is_active AND (deadline IS NULL OR deadline>now()) ORDER BY id LIMIT 1;
 SELECT * INTO STRICT learner FROM public.learners WHERE user_id IS NOT NULL LIMIT 1;
 source_hash:=md5(public.job_matching_text(job));
 ASSERT NOT public.publish_job_matching_vector(job.id,'fixture-model','obsolete-source',v),'published an obsolete job';
 ASSERT public.publish_job_matching_vector(job.id,'fixture-model',source_hash,v),'valid job rejected';
 ASSERT EXISTS(SELECT 1 FROM public.embeddings WHERE entity_type='opportunity' AND entity_id=job.id AND model_version='fixture-model' AND input_hash=source_hash),'provenance not persisted';
 s:=public.get_recommendation_state_v3(learner.id,learner.user_id,'fixture-model','learner-text-1','semantic-ranking-3-ai-only');
 old_revision:=(s->>'revision')::bigint;
 ASSERT public.publish_recommendation_vector_v3(learner.id,learner.user_id,old_revision,'fixture-model',v,'learner-text-1'),'learner vector rejected';
 SELECT EXISTS(SELECT 1 FROM public.match_verified_opportunities(learner.id,learner.user_id,'fixture-model',old_revision,50) m WHERE m.id=job.id) INTO found_job;
 ASSERT found_job,'compatible current job was not ranked';
 BEGIN
   PERFORM public.match_verified_opportunities(learner.id,gen_random_uuid(),'fixture-model',old_revision,50);
   RAISE EXCEPTION 'foreign actor was allowed';
 EXCEPTION WHEN raise_exception THEN
   ASSERT SQLERRM='Current matching profile is unavailable','foreign actor was allowed';
 END;
 UPDATE public.embeddings SET input_hash='obsolete-source' WHERE entity_type='opportunity' AND entity_id=job.id;
 ASSERT NOT EXISTS(SELECT 1 FROM public.match_verified_opportunities(learner.id,learner.user_id,'fixture-model',old_revision,50) m WHERE m.id=job.id),'stale input was ranked';
 UPDATE public.embeddings SET input_hash=source_hash,model_version='different-model' WHERE entity_type='opportunity' AND entity_id=job.id;
 ASSERT NOT EXISTS(SELECT 1 FROM public.match_verified_opportunities(learner.id,learner.user_id,'fixture-model',old_revision,50) m WHERE m.id=job.id),'different-model job was ranked';
 FOREACH signature IN ARRAY ARRAY['public.get_job_matching_index_batch(text,integer)','public.publish_job_matching_vector(uuid,text,text,extensions.vector)','public.match_verified_opportunities(uuid,uuid,text,bigint,integer)','public.job_matching_index_status(text)'] LOOP
   FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
     ASSERT NOT has_function_privilege(role_name,signature,'EXECUTE'),'client can execute index RPC';
   END LOOP;
 END LOOP;
 -- The row guard also prevents arbitrary service-client writes from claiming
 -- provider provenance; only the SECURITY DEFINER publisher can attach it.
 EXECUTE 'SET LOCAL ROLE service_role';
 BEGIN
   UPDATE public.embeddings SET model_version='forged' WHERE entity_type='opportunity' AND entity_id=job.id;
   RAISE EXCEPTION 'direct unverified vector write was allowed';
 EXCEPTION WHEN raise_exception THEN
   ASSERT SQLERRM='Job vectors must be published through the matching index','direct vector write was allowed';
 END;
 EXECUTE 'RESET ROLE';
END; $$;
ROLLBACK;
