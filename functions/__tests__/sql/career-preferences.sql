DO $$
DECLARE
  learner uuid := '33333333-3333-4333-8333-333333333333';
  actor uuid := '11111111-1111-4111-8111-111111111111';
  other uuid := '22222222-2222-4222-8222-222222222222';
  before_revision bigint;
  result jsonb;
BEGIN
  before_revision := public.get_recommendation_context_revision_v1(learner,actor)::bigint;
  result := public.save_learner_career_preferences_v2(learner,actor,'{"targetRoles":["Marine technician"]}',(SELECT revision FROM public.learner_career_preferences WHERE learner_id=learner));
  ASSERT (result->>'inputRevision')::bigint > before_revision, 'preferences insert failed to invalidate context';
  before_revision := (result->>'inputRevision')::bigint;
  result := public.save_learner_career_preferences_v2(learner,actor,'{"locations":["Chennai"]}',(SELECT revision FROM public.learner_career_preferences WHERE learner_id=learner));
  ASSERT (result->>'inputRevision')::bigint > before_revision, 'preferences update failed to invalidate context';
  BEGIN
    PERFORM public.save_learner_career_preferences_v2(learner,other,'{}',(SELECT revision FROM public.learner_career_preferences WHERE learner_id=learner));
    RAISE EXCEPTION 'foreign preferences save succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  ASSERT (SELECT preferences->'locations' FROM public.learner_career_preferences WHERE learner_id=learner) = '["Chennai"]'::jsonb, 'foreign write changed preferences';
  ASSERT NOT has_table_privilege('anon','public.learner_career_preferences','SELECT'), 'anonymous preferences access';
  ASSERT NOT has_table_privilege('authenticated','public.learner_career_preferences','UPDATE'), 'direct browser preferences write';
  ASSERT NOT has_function_privilege('authenticated','public.save_learner_career_preferences_v2(uuid,uuid,jsonb,uuid)','EXECUTE'), 'browser can impersonate actor';
  ASSERT has_function_privilege('service_role','public.save_learner_career_preferences_v2(uuid,uuid,jsonb,uuid)','EXECUTE'), 'backend cannot save preferences';
  before_revision := (result->>'inputRevision')::bigint;
  DELETE FROM public.learner_career_preferences WHERE learner_id=learner;
  ASSERT public.get_recommendation_context_revision_v1(learner,actor)::bigint > before_revision, 'preferences deletion failed to invalidate context';
  RAISE NOTICE 'PASS: private preferences, owned writes, insert/update/delete revision invalidation';
END;
$$;

DO $$
DECLARE learner uuid := '33333333-3333-4333-8333-333333333333'; actor uuid := '11111111-1111-4111-8111-111111111111';
  first_save jsonb; opt_out jsonb; before_revision text;
BEGIN
  first_save := public.save_learner_career_preferences_v2(learner,actor,'{"useVerifiedLearning":true}',NULL);
  before_revision := public.get_recommendation_context_revision_v1(learner,actor);
  BEGIN
    PERFORM public.save_learner_career_preferences_v2(learner,actor,'{}',NULL);
    RAISE EXCEPTION 'stale initial-creation token overwrote an existing record';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  ASSERT public.get_recommendation_context_revision_v1(learner,actor)=before_revision, 'rejected stale creation invalidated context';
  opt_out := public.save_learner_career_preferences_v2(learner,actor,'{"useVerifiedLearning":false}',(first_save->>'preferencesRevision')::uuid);
  ASSERT first_save->>'preferencesRevision' <> opt_out->>'preferencesRevision', 'successful save reused token';
  before_revision := public.get_recommendation_context_revision_v1(learner,actor);
  BEGIN
    PERFORM public.save_learner_career_preferences_v2(learner,actor,'{"useVerifiedLearning":true}',(first_save->>'preferencesRevision')::uuid);
    RAISE EXCEPTION 'stale editor reversed opt-out';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  ASSERT (SELECT preferences->>'useVerifiedLearning' FROM public.learner_career_preferences WHERE learner_id=learner)='false', 'opt-out was overwritten';
  ASSERT public.get_recommendation_context_revision_v1(learner,actor)=before_revision, 'rejected stale update invalidated context';
  ASSERT to_regprocedure('public.save_learner_career_preferences_v1(uuid,uuid,jsonb)') IS NULL, 'unguarded writer remains callable';
  ASSERT NOT has_table_privilege('service_role','public.learner_career_preferences','UPDATE'), 'service API can bypass guarded writer';
  RAISE NOTICE 'PASS: preference compare-and-save, stale creation/update rejection, opt-out preservation and no unguarded writer';
END;
$$;
