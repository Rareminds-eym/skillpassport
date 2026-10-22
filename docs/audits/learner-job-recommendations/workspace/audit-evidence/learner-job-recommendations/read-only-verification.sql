-- LJR-2026-10-12: catalog inspection only. No recommendation RPC is invoked.
-- Execute only against the intended database through an approved read connection.
-- This does not exercise SSO, RLS behavior, live matching, or browser interactions.
BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS database_name,
       current_user AS connection_role,
       current_setting('transaction_read_only') AS read_only,
       current_timestamp AS collected_at;

-- Does the live learner shape support the dashboard's scoring inputs?
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'learners'
  AND column_name IN (
    'id', 'user_id', 'embedding', 'preferred_employment_types',
    'preferred_locations', 'preferred_departments', 'experience_level',
    'metadata', 'skill_summary'
  )
ORDER BY column_name;

-- Exact function names, signatures, security-definer status, and definitions.
-- Catalog functions return source; application functions are NOT executed.
SELECT p.oid::regprocedure::text AS signature,
       p.prosecdef AS security_definer,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.proname IN (
    'match_opportunities_enhanced_v2', 'match_opportunities_enhanced',
    'is_learner_fresher', 'get_cached_job_matches', 'save_job_matches_cache',
    'compute_learner_profile_hash', 'is_job_matches_cache_valid',
    'invalidate_job_matches_cache', 'invalidate_all_job_matches_on_opportunity_change',
    'get_popular_opportunities', 'trigger_entity_embedding_generation',
    'trigger_opportunity_embedding', 'trigger_opportunity_embedding_queue',
    'trigger_enrollment_completion_embedding', 'get_embedding_queue_batch'
  )
ORDER BY p.proname, signature;

-- Actual attachments matter: a trigger function's existence is insufficient.
SELECT c.relname AS table_name, t.tgname AS trigger_name,
       t.tgenabled AS enabled_state, pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND c.relname IN (
    'learners', 'skills', 'certificates', 'projects', 'trainings',
    'course_enrollments', 'opportunities', 'opportunity_interactions', 'applied_jobs'
  )
ORDER BY c.relname, t.tgname;

-- Confirms table RLS settings, but not whether a service-role client respects RLS.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relname IN ('learners', 'learner_job_matches', 'opportunities', 'opportunity_interactions');

-- Inventory names only; avoids reading learner records, cron command text,
-- stored credentials, or private request payloads.
SELECT n.nspname AS schema_name, c.relname AS relation_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname = 'cron' AND c.relname = 'job')
   OR (n.nspname = 'public' AND c.relname = 'embedding_queue')
ORDER BY n.nspname, c.relname;

ROLLBACK;
