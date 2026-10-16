-- Catalog-only, non-mutating preflight for an approved staging/production connection.
-- Do NOT call get_recommendation_state_v3 or cache RPCs here: they can write.
BEGIN TRANSACTION READ ONLY;
SELECT current_database(), current_user, current_timestamp AS collected_at;
SELECT p.oid::regprocedure AS signature, r.rolname AS owner, p.prosecdef,
       p.proconfig, p.proacl,
       has_function_privilege('anon',p.oid,'EXECUTE') AS anon_effective_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_effective_execute,
       has_function_privilege('service_role',p.oid,'EXECUTE') AS service_effective_execute,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_roles r ON r.oid=p.proowner
WHERE n.nspname='public' AND p.prokind='f' AND p.proname IN (
 'get_cached_job_matches','save_job_matches_cache','compute_learner_profile_hash','is_job_matches_cache_valid',
 'get_recommendation_state_v3','publish_recommendation_vector_v3','save_recommendation_matches_v3','get_generic_recommendations_v3',
 'match_opportunities_enhanced_v2','match_opportunities_enhanced','is_learner_fresher',
 'trigger_entity_embedding_generation','trigger_opportunity_embedding','trigger_opportunity_embedding_queue')
ORDER BY p.oid::regprocedure::text;
SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
       has_table_privilege('anon',c.oid,'SELECT') AS anon_effective_select,
       has_table_privilege('authenticated',c.oid,'UPDATE') AS authenticated_effective_update
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('learner_recommendation_state','recommendation_catalog_revision','learner_job_matches');
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conname IN ('learners_user_id_key','skills_learner_id_fkey','projects_learner_id_fkey',
 'certificates_learner_id_fkey','trainings_learner_id_fkey','opportunity_interactions_learner_id_fkey');
SELECT c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid)
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND NOT t.tgisinternal AND c.relname IN
 ('learners','skills','projects','certificates','trainings','course_enrollments','opportunity_interactions','opportunities')
ORDER BY c.relname,t.tgname;
ROLLBACK;
