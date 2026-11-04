-- Actual baseline adaptive cache/response tables and four baseline definer
-- functions are installed in the disposable fixture runner before migration.
DO $$ DECLARE relation text; capability record; browser text;
BEGIN
 FOREACH relation IN ARRAY ARRAY['adaptive_aptitude_sessions','adaptive_aptitude_responses','adaptive_aptitude_results',
  'adaptive_aptitude_questions_cache','adaptive_session_grant_fixture','adaptive_nested_grant_fixture'] LOOP
  FOREACH browser IN ARRAY ARRAY['anon','authenticated'] LOOP
   ASSERT NOT has_table_privilege(browser,'public.'||relation,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER');
   ASSERT NOT has_any_column_privilege(browser,'public.'||relation,'SELECT,INSERT,UPDATE,REFERENCES');
  END LOOP;
 END LOOP;
 FOREACH relation IN ARRAY ARRAY['adaptive_aptitude_sessions','adaptive_aptitude_responses','adaptive_aptitude_results','adaptive_aptitude_questions_cache'] LOOP
  ASSERT has_table_privilege('service_role','public.'||relation,'SELECT');
 END LOOP;
 FOR capability IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
  AND p.proname IN('append_adaptive_response','calculate_session_stats','get_available_questions','update_question_usage') LOOP
  ASSERT NOT has_function_privilege('anon',capability.oid,'EXECUTE');
  ASSERT NOT has_function_privilege('authenticated',capability.oid,'EXECUTE');
  ASSERT has_function_privilege('service_role',capability.oid,'EXECUTE');
 END LOOP;
 ASSERT NOT has_function_privilege('anon','public.assert_private_adaptive_assessment_grants()','EXECUTE');
 ASSERT has_function_privilege('service_role','public.assert_private_adaptive_assessment_grants()','EXECUTE');
 PERFORM public.assert_private_adaptive_assessment_grants();
END $$;
-- Fail closed for future table, nested view, column and definer-RPC regressions.
GRANT SELECT ON public.adaptive_aptitude_sessions TO anon;
SELECT pg_temp.expect_failure('SELECT public.assert_private_adaptive_assessment_grants()','42501');
REVOKE SELECT ON public.adaptive_aptitude_sessions FROM anon;
GRANT SELECT(id) ON public.adaptive_nested_grant_fixture TO authenticated;
SELECT pg_temp.expect_failure('SELECT public.assert_private_adaptive_assessment_grants()','42501');
REVOKE SELECT(id) ON public.adaptive_nested_grant_fixture FROM authenticated;
GRANT EXECUTE ON FUNCTION public.append_adaptive_response(uuid,jsonb) TO PUBLIC;
SELECT pg_temp.expect_failure('SELECT public.assert_private_adaptive_assessment_grants()','42501');
REVOKE EXECUTE ON FUNCTION public.append_adaptive_response(uuid,jsonb) FROM PUBLIC;
SELECT public.assert_private_adaptive_assessment_grants();
