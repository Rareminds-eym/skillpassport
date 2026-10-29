DO $$
DECLARE
  learner uuid := '33333333-3333-4333-8333-333333333333'; actor uuid := '11111111-1111-4111-8111-111111111111';
  selected uuid := '99999999-9999-4999-8999-999999999999'; before_revision bigint; result_count integer;
BEGIN
  INSERT INTO public.opportunities(id,title,location,mode) VALUES(selected,'Old eligible job','Chennai, India','remote');
  -- More excluded jobs than the candidate limit: filtering must happen first.
  INSERT INTO public.opportunities(id,title,location,mode,created_at)
    SELECT gen_random_uuid(),'Already applied','Chennai, India','remote',now()+interval '1 day' FROM generate_series(1,110);
  INSERT INTO public.applied_jobs(learner_id,opportunity_id) SELECT learner,id FROM public.opportunities WHERE title='Already applied';
  SELECT count(*) INTO result_count FROM public.get_recommendation_candidates_v1(learner,actor);
  ASSERT result_count=1, 'applied jobs consumed the candidate limit';
  ASSERT (SELECT id FROM public.get_recommendation_candidates_v1(learner,actor))=selected, 'valid older job was lost';
  UPDATE public.learner_recommendation_state SET embedding=array_fill(0.01::real,ARRAY[1536])::extensions.vector,
    vector_revision=revision,model_version='fixture-model',valid_until=now()+interval '1 hour' WHERE learner_id=learner;
  INSERT INTO public.embeddings(entity_type,entity_id,embedding,model_version,input_hash)
    SELECT 'opportunity',id,array_fill(0.01::real,ARRAY[1536])::extensions.vector,'fixture-model',md5(title) FROM public.opportunities;
  ASSERT (SELECT id FROM public.match_verified_opportunities(learner,actor,'fixture-model',
    (SELECT revision FROM public.learner_recommendation_state WHERE learner_id=learner),1))=selected, 'applied jobs consumed the semantic candidate limit';
  PERFORM public.save_learner_career_preferences_v2(learner,actor,'{"locations":["Chennai"],"strictLocations":true,"workModes":["remote"],"strictWorkModes":true}',(SELECT revision FROM public.learner_career_preferences WHERE learner_id=learner));
  ASSERT public.recommendation_job_allowed_v1(learner,actor,selected,'full_time','Chennai, India','remote'), 'city component did not match';
  ASSERT NOT public.recommendation_job_allowed_v1(learner,actor,selected,'full_time','Chennaiville','remote'), 'location substring false positive';
  ASSERT NOT public.recommendation_job_allowed_v1(learner,actor,selected,'full_time',NULL,'remote'), 'unknown location passed strict choice';
  ASSERT NOT public.recommendation_job_allowed_v1(learner,actor,selected,'full_time','Chennai','onsite'), 'strict work mode ignored';
  ASSERT NOT public.recommendation_job_allowed_v1(learner,learner,selected,'full_time','Chennai','remote'), 'user/learner namespaces conflated';
  INSERT INTO public.opportunity_interactions(id,learner_id,opportunity_id,action) VALUES(gen_random_uuid(),actor,selected,'dismiss');
  ASSERT NOT EXISTS(SELECT 1 FROM public.get_recommendation_candidates_v1(learner,actor)), 'dismissed job returned';
  ASSERT (public.get_recommendation_freshness_v1(learner,actor)->>'catalogRevision') IS NOT NULL, 'catalog revision missing from freshness';
  before_revision := public.get_recommendation_context_revision_v1(learner,actor)::bigint;
  INSERT INTO public.personal_assessment_results(id,learner_id,status) VALUES(gen_random_uuid(),learner,'completed');
  ASSERT public.get_recommendation_context_revision_v1(learner,actor)::bigint > before_revision, 'assessment producer failed to invalidate';
  PERFORM public.sync_recommendation_learning_dependency_v1(learner,actor,repeat('a',32));
  before_revision := public.get_recommendation_context_revision_v1(learner,actor)::bigint;
  PERFORM public.sync_recommendation_learning_dependency_v1(learner,actor,repeat('a',32));
  ASSERT public.get_recommendation_context_revision_v1(learner,actor)::bigint=before_revision, 'unchanged LTE hash caused refresh loop';
  PERFORM public.sync_recommendation_learning_dependency_v1(learner,actor,repeat('b',32));
  ASSERT public.get_recommendation_context_revision_v1(learner,actor)::bigint>before_revision, 'changed LTE evidence did not invalidate';
  ASSERT NOT has_function_privilege('authenticated','public.sync_recommendation_learning_dependency_v1(uuid,uuid,text)','EXECUTE'), 'browser can replace LTE revision';
  RAISE NOTICE 'PASS: candidate exclusions before limit, required preferences, assessment producers and LTE dependency changes';
END;
$$;
