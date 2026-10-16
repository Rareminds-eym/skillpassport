-- Run after the fixture and the actual migration, only in a disposable database.
DO $$
DECLARE
  learner uuid := '33333333-3333-4333-8333-333333333333';
  actor uuid := '11111111-1111-4111-8111-111111111111';
  other uuid := '22222222-2222-4222-8222-222222222222';
  s jsonb; old_revision bigint; catalog bigint; before_revision bigint;
  v extensions.vector := ('[' || array_to_string(array_fill(0.01::numeric, ARRAY[1536]), ',') || ']')::extensions.vector;
  signature text; role_name text;
BEGIN
  INSERT INTO public.learners(id,user_id,name) VALUES(learner,actor,'Own'),(other,other,'Other');
  s := public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-1','hybrid-ranking-1');
  old_revision := (s->>'revision')::bigint; catalog := (s->>'catalog_revision')::bigint;
  ASSERT s->'embedding' = 'null'::jsonb, 'unversioned learner vectors must not be adopted';
  ASSERT NOT public.publish_recommendation_vector_v3(learner,other,old_revision,'fixture-model',v,'learner-text-1'), 'foreign owner published';
  ASSERT public.publish_recommendation_vector_v3(learner,actor,old_revision,'fixture-model',v,'learner-text-1'), 'own vector rejected';
  ASSERT public.save_recommendation_matches_v3(learner,actor,old_revision,catalog,'fixture-model','[{"id":"fixture-job"}]','learner-text-1','hybrid-ranking-1','v2.0'), 'own cache rejected';
  s := public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-1','hybrid-ranking-1');
  ASSERT s->'matches' <> 'null'::jsonb, 'current cache missing';
  ASSERT s->>'algorithm_version' = 'v2.0', 'cached algorithm provenance missing';
  ASSERT (public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-2','hybrid-ranking-1'))->'embedding' = 'null'::jsonb, 'preprocessing mismatch reused vector';
  ASSERT (public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-2','hybrid-ranking-1'))->'matches' = 'null'::jsonb, 'preprocessing mismatch reused matches';
  ASSERT (public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-1','hybrid-ranking-2'))->'matches' = 'null'::jsonb, 'ranking policy mismatch reused matches';
  ASSERT (public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-1','hybrid-ranking-2'))->'embedding' <> 'null'::jsonb, 'ranking-only change discarded compatible vector';
  ASSERT NOT public.save_recommendation_matches_v3(learner,actor,old_revision,catalog,'fixture-model','[]','learner-text-2','hybrid-ranking-1','v2.0'), 'wrong preprocessing published cache';
  ASSERT NOT public.save_recommendation_matches_v3(learner,actor,old_revision,catalog,'fixture-model','[]','learner-text-1','','v2.0'), 'unversioned policy published cache';
  ASSERT NOT public.save_recommendation_matches_v3(learner,actor,old_revision,catalog,'fixture-model','[]','learner-text-1','hybrid-ranking-1','unknown'), 'unknown algorithm published cache';
  ASSERT public.publish_recommendation_vector_v3(learner,actor,old_revision,'fixture-model',v,'learner-text-2'), 'new preprocessing vector rejected';
  ASSERT (public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-1','hybrid-ranking-1'))->'embedding' = 'null'::jsonb, 'old preprocessing adopted new vector';
  ASSERT public.publish_recommendation_vector_v3(learner,actor,old_revision,'fixture-model',v,'learner-text-1'), 'restored preprocessing vector rejected';
  ASSERT public.save_recommendation_matches_v3(learner,actor,old_revision,catalog,'fixture-model','[]','learner-text-1','hybrid-ranking-1','v1.0'), 'V1 provenance save rejected';
  ASSERT (public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-1','hybrid-ranking-1'))->>'algorithm_version' = 'v1.0', 'V1 cache mislabelled';
  ASSERT (public.get_recommendation_state_v3(learner,actor,'other-model','learner-text-1','hybrid-ranking-1'))->'embedding' = 'null'::jsonb, 'model mismatch reused';
  UPDATE public.learners SET embedding=v,updated_at=now() WHERE id=learner;
  ASSERT (SELECT revision FROM public.learner_recommendation_state WHERE learner_id=learner)=old_revision, 'legacy writer changed recommendation vector revision';
  INSERT INTO public.skills(id,learner_id,name) VALUES('55555555-5555-4555-8555-555555555555',learner,'Changed skill');
  s := public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-1','hybrid-ranking-1');
  ASSERT (s->>'revision')::bigint > old_revision, 'skill edit did not advance revision';
  ASSERT s->'matches' = 'null'::jsonb AND s->'embedding' = 'null'::jsonb, 'stale data reused';
  ASSERT NOT public.publish_recommendation_vector_v3(learner,actor,old_revision,'fixture-model',v,'learner-text-1'), 'obsolete vector overwrote new revision';
  old_revision := (s->>'revision')::bigint;
  ASSERT public.publish_recommendation_vector_v3(learner,actor,old_revision,'fixture-model',v,'learner-text-1'), 'new vector rejected';
  INSERT INTO public.opportunities(id,title) VALUES('99999999-9999-4999-8999-999999999999','Changed catalog');
  ASSERT NOT public.save_recommendation_matches_v3(learner,actor,old_revision,catalog,'fixture-model','[]','learner-text-1','hybrid-ranking-1','v2.0'), 'obsolete catalog cached';
  before_revision := (SELECT revision FROM public.learner_recommendation_state WHERE learner_id=learner);
  INSERT INTO public.opportunity_interactions(id,learner_id) VALUES('77777777-7777-4777-8777-777777777777',actor);
  ASSERT (SELECT revision FROM public.learner_recommendation_state WHERE learner_id=learner)>before_revision, 'feedback user key not resolved';
  s := public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-1','hybrid-ranking-1');
  old_revision := (s->>'revision')::bigint;
  UPDATE public.learner_recommendation_state SET valid_until=now()-interval '1 second' WHERE learner_id=learner;
  ASSERT NOT public.publish_recommendation_vector_v3(learner,actor,old_revision,'fixture-model',v,'learner-text-1'), 'expired input published';
  ASSERT (public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-1','hybrid-ranking-1')->>'revision')::bigint>old_revision, 'clock expiry did not advance revision';
  s := public.get_recommendation_state_v3(other,other,'fixture-model','learner-text-1','hybrid-ranking-1');
  DELETE FROM public.learners WHERE id=other;
  ASSERT NOT EXISTS(SELECT FROM public.learner_recommendation_state WHERE learner_id=other), 'deleted learner state survived';
  ASSERT NOT public.publish_recommendation_vector_v3(other,other,(s->>'revision')::bigint,'fixture-model',v,'learner-text-1'), 'deleted learner resurrected';
  UPDATE public.skills SET embedding=v WHERE learner_id=learner;
  UPDATE public.skills SET name='New content' WHERE learner_id=learner;
  ASSERT (SELECT embedding IS NULL FROM public.skills WHERE learner_id=learner), 'changed entity kept stale vector';
  UPDATE public.opportunities SET embedding=v;
  UPDATE public.opportunities SET views_count=1;
  ASSERT (SELECT embedding IS NOT NULL FROM public.opportunities LIMIT 1), 'view count cleared job vector';
  UPDATE public.opportunities SET title='Changed job content';
  ASSERT (SELECT embedding IS NULL FROM public.opportunities LIMIT 1), 'changed job kept stale vector';
  -- The newest candidate is dismissed; older closed/expired/inactive jobs must
  -- not consume the limit either. UUIDs and interaction key match real schema.
  UPDATE public.opportunities SET status='closed';
  INSERT INTO public.opportunities(id,title,posted_date,status,is_active,deadline) VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Dismissed',now()+interval '4 hours','open',true,NULL),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','Expired',now()+interval '3 hours','open',true,now()-interval '1 second'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','Inactive',now()+interval '2 hours','open',false,NULL),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','Eligible',now(),'open',true,NULL);
  INSERT INTO public.opportunity_interactions(id,learner_id,opportunity_id,action) VALUES
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',actor,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','dismiss');
  ASSERT public.get_generic_recommendations_v3(learner,actor,1) = '[{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4"}]'::jsonb, 'fallback limited before filtering';
  ASSERT public.get_generic_recommendations_v3(learner,other,1) IS NULL, 'foreign actor read fallback';
  ASSERT public.get_generic_recommendations_v3(learner,actor,0) IS NULL, 'invalid generic limit accepted';
  UPDATE public.opportunities SET status='closed';
  ASSERT public.get_generic_recommendations_v3(learner,actor,1) = '[]'::jsonb, 'valid empty catalog not empty';
  UPDATE public.learners SET user_id='44444444-4444-4444-8444-444444444444' WHERE id=learner;
  ASSERT public.get_recommendation_state_v3(learner,actor,'fixture-model','learner-text-1','hybrid-ranking-1') IS NULL, 'old owner read state after transfer';
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOREACH signature IN ARRAY ARRAY[
      'public.get_cached_job_matches(uuid)', 'public.save_job_matches_cache(uuid,jsonb,character varying)',
      'public.is_job_matches_cache_valid(uuid)', 'public.compute_learner_profile_hash(uuid)',
      'public.match_opportunities_enhanced_v2(extensions.vector,uuid,uuid[],double precision,integer)',
      'public.get_recommendation_state_v3(uuid,uuid,text,text,text)',
      'public.publish_recommendation_vector_v3(uuid,uuid,bigint,text,extensions.vector,text)',
      'public.save_recommendation_matches_v3(uuid,uuid,bigint,bigint,text,jsonb,text,text,text)',
      'public.get_generic_recommendations_v3(uuid,uuid,integer)'
    ] LOOP
      ASSERT NOT has_function_privilege(role_name,signature,'EXECUTE'), 'public role can execute '||signature;
    END LOOP;
    ASSERT NOT has_table_privilege(role_name,'public.learner_recommendation_state','SELECT'), 'state directly exposed';
  END LOOP;
  ASSERT has_function_privilege('service_role','public.get_recommendation_state_v3(uuid,uuid,text,text,text)','EXECUTE'), 'backend cannot read state';
  ASSERT has_function_privilege('service_role','public.get_generic_recommendations_v3(uuid,uuid,integer)','EXECUTE'), 'backend cannot read generic jobs';
  ASSERT has_function_privilege('service_role','public.get_cached_job_matches(uuid)','EXECUTE'), 'legacy backend caller lost access';
  RAISE NOTICE 'PASS: ownership, preprocessing/ranking/model isolation, algorithm provenance, generic pre-limit filtering, invalidation, stale publication, catalog change, feedback key, clock expiry, deletion, and effective privileges';
END;
$$;
