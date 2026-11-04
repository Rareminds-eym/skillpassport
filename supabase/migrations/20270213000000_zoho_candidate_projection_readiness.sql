BEGIN;

-- Read-only deployment probe. A flag cannot override the actual grant boundary.
-- Neither application rows nor provider/network/consumer health are inferred here.
CREATE FUNCTION public.zoho_candidate_projection_ready() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE signature text; relation text;
BEGIN
  IF to_regprocedure('public.zoho_assert_private_projection_boundary()') IS NULL THEN RETURN false; END IF;
  PERFORM public.zoho_assert_private_projection_boundary();
  IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    CROSS JOIN (VALUES('anon'),('authenticated')) browser(role)
    WHERE n.nspname='public' AND c.relname IN ('zoho_staged_records','zoho_approved_operations','zoho_deferred_records',
      'zoho_connection_secrets','zoho_oauth_states','zoho_candidate_projections')
    AND (has_table_privilege(browser.role,c.oid,'SELECT,INSERT,UPDATE,DELETE')
      OR has_any_column_privilege(browser.role,c.oid,'SELECT,INSERT,UPDATE'))) THEN RETURN false; END IF;
  FOREACH signature IN ARRAY ARRAY[
    'public.zoho_generic_identity_sync_policy(uuid)',
    'public.zoho_apply_candidate_projection(text,text)',
    'public.zoho_check_candidate_projection(uuid,text,text,uuid)'
  ] LOOP
    IF to_regprocedure(signature) IS NULL
      OR NOT has_function_privilege('service_role',to_regprocedure(signature),'EXECUTE')
      OR has_function_privilege('anon',to_regprocedure(signature),'EXECUTE')
      OR has_function_privilege('authenticated',to_regprocedure(signature),'EXECUTE') THEN RETURN false; END IF;
  END LOOP;
  FOREACH relation IN ARRAY ARRAY['zoho_candidate_projections','users','learners','users_shadow','plans_cache','subscription_cache',
    'zoho_recruiter_learners','zoho_recruiter_pipeline_candidates','zoho_recruiter_pipeline_candidates_detailed',
    'zoho_recruiter_applied_jobs','zoho_recruiter_interviews','zoho_recruiter_shortlist_candidates',
    'zoho_recruiter_trainings','zoho_recruiter_certificates','zoho_recruiter_skills'] LOOP
    IF to_regclass('public.'||relation) IS NULL THEN RETURN false; END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM (VALUES('anon'),('authenticated'),('service_role')) browser(role)
    WHERE has_table_privilege(browser.role,'public.zoho_candidate_projections','INSERT,UPDATE,DELETE')
      OR has_any_column_privilege(browser.role,'public.zoho_candidate_projections','INSERT,UPDATE')) THEN RETURN false; END IF;
  IF (SELECT count(*) FROM pg_trigger t WHERE NOT t.tgisinternal AND t.tgenabled IN ('O','A')
    AND ((t.tgrelid='public.learners'::regclass AND t.tgname='zoho_private_learner_owner')
      OR (t.tgrelid='public.users_shadow'::regclass AND t.tgname='zoho_private_shadow_owner'))
    AND t.tgfoid=to_regprocedure('public.zoho_protect_candidate_owner()'))<>2 THEN RETURN false; END IF;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Unavailable/incompatible storage is never a positive readiness assertion.
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_candidate_projection_ready() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_candidate_projection_ready() TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
