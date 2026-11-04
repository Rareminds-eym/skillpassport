-- Baseline browser grants must block projection even if an operator turns on
-- delivery. The test then explicitly prepares a server-only fixture; production
-- migrations never silently revoke unrelated legacy grants.
DO $$ BEGIN
 BEGIN
  PERFORM public.zoho_assert_private_projection_boundary();
  RAISE EXCEPTION 'Browser-readable boundary accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.zoho_apply_candidate_projection(pg_temp.snapshot(),
    encode(sha256(convert_to(pg_temp.snapshot(),'UTF8')),'hex'));
  RAISE EXCEPTION 'Projection bypassed private boundary';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 ASSERT NOT EXISTS(SELECT 1 FROM public.users);
 ASSERT NOT EXISTS(SELECT 1 FROM public.learners);
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_candidate_projections);
END $$;
REVOKE ALL ON public.users,public.learners,public.users_shadow FROM PUBLIC,anon,authenticated;
-- The owner-run inherited view is an independent bypass even without base grants.
DO $$ BEGIN
 BEGIN
  PERFORM public.zoho_assert_private_projection_boundary();
  RAISE EXCEPTION 'Owner-run browser view accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
REVOKE ALL ON public.learner_applications_with_pipeline FROM PUBLIC,anon,authenticated;
-- Only in this disposable fixture, close inherited definer execution privileges.
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef
 LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature); END LOOP;
END $$;
SELECT public.zoho_assert_private_projection_boundary();
-- A transitively dependent view and callable RPC must each prevent readiness.
CREATE VIEW public.fixture_nested_reader AS SELECT * FROM public.learner_applications_with_pipeline;
GRANT SELECT ON public.fixture_nested_reader TO anon;
DO $$ BEGIN
 BEGIN PERFORM public.zoho_assert_private_projection_boundary(); RAISE EXCEPTION 'Nested reader accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
DROP VIEW public.fixture_nested_reader;
CREATE FUNCTION public.fixture_privileged_reader() RETURNS bigint LANGUAGE sql SECURITY DEFINER
 SET search_path=pg_catalog,public AS $$ SELECT count(*) FROM public.learners $$;
DO $$ BEGIN
 BEGIN PERFORM public.zoho_assert_private_projection_boundary(); RAISE EXCEPTION 'Callable definer accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
DROP FUNCTION public.fixture_privileged_reader();
SELECT public.zoho_assert_private_projection_boundary();
