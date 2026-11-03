-- Synthetic fixture database only. The runner creates and removes that DB.
DO $$
DECLARE
  learner uuid := '33333333-3333-4333-8333-333333333333';
  actor uuid := '11111111-1111-4111-8111-111111111111';
  other uuid := '22222222-2222-4222-8222-222222222222';
  before_revision bigint; current_revision bigint;
  source_table text;
BEGIN
  INSERT INTO public.learners(id,user_id,name) VALUES(learner,actor,'Synthetic owner'),(other,other,'Synthetic other');
  before_revision := public.get_recommendation_context_revision_v1(learner,actor)::bigint;
  ASSERT before_revision > 0, 'owned context did not initialize revision';
  ASSERT public.get_recommendation_context_revision_v1(learner,other) IS NULL, 'foreign actor read context revision';
  ASSERT public.get_recommendation_context_revision_v1(gen_random_uuid(),actor) IS NULL, 'nonexistent learner read context revision';
  ASSERT public.get_recommendation_context_revision_v1(learner,actor)::bigint = before_revision, 'unchanged read advanced revision';
  FOREACH source_table IN ARRAY ARRAY['education','experience'] LOOP
    EXECUTE format('INSERT INTO public.%I(id,learner_id) VALUES($1,$2)', source_table) USING learner,learner;
    current_revision := public.get_recommendation_context_revision_v1(learner,actor)::bigint;
    ASSERT current_revision > before_revision, 'source insert failed to invalidate ' || source_table;
    before_revision := current_revision;
    EXECUTE format('UPDATE public.%I SET enabled=false WHERE id=$1',source_table) USING learner;
    current_revision := public.get_recommendation_context_revision_v1(learner,actor)::bigint;
    ASSERT current_revision > before_revision, 'visibility change failed to invalidate ' || source_table;
    before_revision := current_revision;
    EXECUTE format('UPDATE public.%I SET learner_id=$1 WHERE id=$2',source_table) USING other,learner;
    current_revision := public.get_recommendation_context_revision_v1(learner,actor)::bigint;
    ASSERT current_revision > before_revision, 'ownership move failed to invalidate old owner';
    before_revision := public.get_recommendation_context_revision_v1(other,other)::bigint;
    EXECUTE format('DELETE FROM public.%I WHERE id=$1',source_table) USING learner;
    ASSERT public.get_recommendation_context_revision_v1(other,other)::bigint > before_revision, 'source deletion failed to invalidate new owner';
    before_revision := current_revision;
  END LOOP;
  UPDATE public.learner_recommendation_state SET valid_until=now()-interval '1 second' WHERE learner_id=learner;
  ASSERT public.get_recommendation_context_revision_v1(learner,actor)::bigint > before_revision, 'clock expiry did not invalidate context';
  ASSERT NOT has_function_privilege('anon','public.get_recommendation_context_revision_v1(uuid,uuid)','EXECUTE'), 'anon can read context';
  ASSERT NOT has_function_privilege('authenticated','public.get_recommendation_context_revision_v1(uuid,uuid)','EXECUTE'), 'browser role can read context';
  ASSERT has_function_privilege('service_role','public.get_recommendation_context_revision_v1(uuid,uuid)','EXECUTE'), 'backend cannot read context';
  RAISE NOTICE 'PASS: owned context, stable reads, education/experience insert/update/move/delete, clock expiry and effective privileges';
END;
$$;
