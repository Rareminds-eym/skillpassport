BEGIN;
-- Server-owned discovery surface. No auth.uid(), Supabase Auth or RLS dependency.
-- NOT EXISTS filters before counts, limits and vector ranking, and preserves
-- existing public profiles. Only the internal receipt writer controls the marker.
CREATE VIEW public.zoho_recruiter_learners WITH (security_barrier=true) AS
  SELECT l.* FROM public.learners l
  WHERE NOT EXISTS (SELECT 1 FROM public.zoho_candidate_projections p
    WHERE p.target_id=l.user_id AND p.private_profile)
  WITH LOCAL CHECK OPTION;
REVOKE ALL ON public.zoho_recruiter_learners FROM PUBLIC,anon,authenticated;
GRANT SELECT,UPDATE,DELETE ON public.zoho_recruiter_learners TO service_role;

-- Copied contact fields and nested embeddings must be filtered at the parent
-- row as well. Keep normal membership/tenant authorization in the existing APIs.
CREATE VIEW public.zoho_recruiter_pipeline_candidates WITH (security_barrier=true) AS
  SELECT t.* FROM public.pipeline_candidates t WHERE NOT EXISTS (
    SELECT 1 FROM public.zoho_candidate_projections p JOIN public.learners l ON l.user_id=p.target_id
    WHERE p.private_profile AND l.id=t.learner_id) WITH LOCAL CHECK OPTION;
REVOKE ALL ON public.zoho_recruiter_pipeline_candidates FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.zoho_recruiter_pipeline_candidates TO service_role;

CREATE VIEW public.zoho_recruiter_pipeline_candidates_detailed WITH (security_barrier=true) AS
  SELECT t.* FROM public.pipeline_candidates_detailed t WHERE NOT EXISTS (
    SELECT 1 FROM public.zoho_candidate_projections p JOIN public.learners l ON l.user_id=p.target_id
    WHERE p.private_profile AND l.id=t.learner_id);
REVOKE ALL ON public.zoho_recruiter_pipeline_candidates_detailed FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.zoho_recruiter_pipeline_candidates_detailed TO service_role;

CREATE VIEW public.zoho_recruiter_applied_jobs WITH (security_barrier=true) AS
  SELECT t.* FROM public.applied_jobs t WHERE NOT EXISTS (
    SELECT 1 FROM public.zoho_candidate_projections p JOIN public.learners l ON l.user_id=p.target_id
    WHERE p.private_profile AND l.id=t.learner_id) WITH LOCAL CHECK OPTION;
REVOKE ALL ON public.zoho_recruiter_applied_jobs FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.zoho_recruiter_applied_jobs TO service_role;

-- interviews.learner_id references learners.user_id, unlike pipeline/applications.
CREATE VIEW public.zoho_recruiter_interviews WITH (security_barrier=true) AS
  SELECT t.* FROM public.interviews t WHERE NOT EXISTS (
    SELECT 1 FROM public.zoho_candidate_projections p JOIN public.learners l ON l.user_id=p.target_id
    WHERE p.private_profile AND l.user_id=t.learner_id) WITH LOCAL CHECK OPTION;
REVOKE ALL ON public.zoho_recruiter_interviews FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.zoho_recruiter_interviews TO service_role;

CREATE VIEW public.zoho_recruiter_shortlist_candidates WITH (security_barrier=true) AS
  SELECT t.* FROM public.shortlist_candidates t WHERE NOT EXISTS (
    SELECT 1 FROM public.zoho_candidate_projections p JOIN public.learners l ON l.user_id=p.target_id
    WHERE p.private_profile AND l.id=t.learner_id) WITH LOCAL CHECK OPTION;
REVOKE ALL ON public.zoho_recruiter_shortlist_candidates FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.zoho_recruiter_shortlist_candidates TO service_role;

CREATE VIEW public.zoho_recruiter_trainings WITH (security_barrier=true) AS
  SELECT t.* FROM public.trainings t WHERE NOT EXISTS (
    SELECT 1 FROM public.zoho_candidate_projections p JOIN public.learners l ON l.user_id=p.target_id
    WHERE p.private_profile AND l.id=t.learner_id) WITH LOCAL CHECK OPTION;
REVOKE ALL ON public.zoho_recruiter_trainings FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.zoho_recruiter_trainings TO service_role;

CREATE VIEW public.zoho_recruiter_certificates WITH (security_barrier=true) AS
  SELECT t.* FROM public.certificates t WHERE NOT EXISTS (
    SELECT 1 FROM public.zoho_candidate_projections p JOIN public.learners l ON l.user_id=p.target_id
    WHERE p.private_profile AND l.id=t.learner_id) WITH LOCAL CHECK OPTION;
REVOKE ALL ON public.zoho_recruiter_certificates FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.zoho_recruiter_certificates TO service_role;

CREATE VIEW public.zoho_recruiter_skills WITH (security_barrier=true) AS
  SELECT t.* FROM public.skills t WHERE NOT EXISTS (
    SELECT 1 FROM public.zoho_candidate_projections p JOIN public.learners l ON l.user_id=p.target_id
    WHERE p.private_profile AND l.id=t.learner_id) WITH LOCAL CHECK OPTION;
REVOKE ALL ON public.zoho_recruiter_skills FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.zoho_recruiter_skills TO service_role;

-- Do not silently change legacy browser grants or unrelated policies. Instead
-- refuse private projection unless the actual database has a server-only boundary.
-- This deliberately conservative check ignores RLS even when it is enabled.
-- Callable SECURITY DEFINER RPCs are denied conservatively: their transitive or
-- dynamic reads cannot reliably be inferred by parsing function source text.
CREATE FUNCTION public.zoho_assert_private_projection_boundary() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF EXISTS (
    WITH RECURSIVE protected(oid) AS (
      SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relname IN ('users','learners','users_shadow')
      UNION
      SELECT r.ev_class FROM protected p
        JOIN pg_depend d ON d.refobjid=p.oid AND d.refclassid='pg_class'::regclass
          AND d.classid='pg_rewrite'::regclass
        JOIN pg_rewrite r ON r.oid=d.objid WHERE r.ev_class<>p.oid
    )
    SELECT 1 FROM protected p CROSS JOIN (VALUES ('anon'),('authenticated')) AS browser(role)
    WHERE has_table_privilege(browser.role,p.oid,'SELECT,INSERT,UPDATE,DELETE')
       OR has_any_column_privilege(browser.role,p.oid,'SELECT,INSERT,UPDATE')
  ) OR EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE p.prosecdef AND n.nspname NOT IN ('pg_catalog','information_schema')
      AND (has_schema_privilege('anon',n.oid,'USAGE') AND has_function_privilege('anon',p.oid,'EXECUTE')
        OR has_schema_privilege('authenticated',n.oid,'USAGE') AND has_function_privilege('authenticated',p.oid,'EXECUTE'))
  ) THEN
    RAISE EXCEPTION 'Private projection requires a verified server-only data boundary' USING ERRCODE='42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_assert_private_projection_boundary() FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.search_candidates_by_embedding(
  query_embedding extensions.vector,
  match_threshold double precision,
  match_count integer
)
RETURNS TABLE(
  id uuid, user_id uuid, name varchar, university varchar, branch_field varchar,
  city varchar, state varchar, currentCgpa numeric, expectedGraduationDate date,
  similarity double precision
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.user_id, l.name::varchar, l.university::varchar,
    l.branch_field::varchar, l.city::varchar, l.state::varchar,
    l."currentCgpa", l."expectedGraduationDate",
    (1 - (l.embedding OPERATOR(extensions.<=>) query_embedding))::double precision
  FROM public.zoho_recruiter_learners l
  WHERE l.embedding IS NOT NULL AND l.name IS NOT NULL
    AND (1 - (l.embedding OPERATOR(extensions.<=>) query_embedding)) >= match_threshold
  ORDER BY l.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_candidates_to_opportunity(
  opportunity_embedding extensions.vector,
  match_count integer,
  min_similarity double precision
)
RETURNS TABLE(
  id uuid, user_id uuid, name varchar, university varchar, branch_field varchar,
  city varchar, similarity double precision
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.user_id, l.name::varchar, l.university::varchar,
    l.branch_field::varchar, l.city::varchar,
    (1 - (l.embedding OPERATOR(extensions.<=>) opportunity_embedding))::double precision
  FROM public.zoho_recruiter_learners l
  WHERE l.embedding IS NOT NULL AND l.name IS NOT NULL
    AND (1 - (l.embedding OPERATOR(extensions.<=>) opportunity_embedding)) >= min_similarity
  ORDER BY l.embedding OPERATOR(extensions.<=>) opportunity_embedding
  LIMIT match_count;
END;
$$;

REVOKE ALL ON FUNCTION public.search_candidates_by_embedding(extensions.vector,double precision,integer),
  public.match_candidates_to_opportunity(extensions.vector,integer,double precision)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.search_candidates_by_embedding(extensions.vector,double precision,integer),
  public.match_candidates_to_opportunity(extensions.vector,integer,double precision)
  TO service_role;


CREATE OR REPLACE FUNCTION public.unlock_candidate_contact(
  p_organization_id UUID,
  p_candidate_id TEXT,
  p_unlocked_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_candidate RECORD;
  v_unlock_id UUID;
  v_charge JSONB;
BEGIN
  -- Serialize concurrent unlock attempts per (org, candidate)
  PERFORM pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':' || p_candidate_id, 0));

  -- Resolve by canonical learners.id first, then by user_id alias. Two sargable
  -- steps instead of an OR over ::text casts (PK indexes usable), and
  -- deterministic: the id match always wins over a user_id match.
  IF p_candidate_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id, name, email, contact_number
    INTO v_candidate
    FROM public.zoho_recruiter_learners
    WHERE id = p_candidate_id::uuid
    LIMIT 1;

    IF v_candidate.id IS NULL THEN
      SELECT id, name, email, contact_number
      INTO v_candidate
      FROM public.zoho_recruiter_learners
      WHERE user_id = p_candidate_id::uuid
      LIMIT 1;
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'CANDIDATE_NOT_FOUND');
  END IF;

  -- A valid UUID may refer to a deleted or unavailable candidate.
  -- Resolve this before attempting the NOT NULL unlock row or charging credits.
  IF v_candidate.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'CANDIDATE_NOT_FOUND');
  END IF;

  -- Claim first, charge second, all-or-nothing in this transaction
  INSERT INTO public.candidate_contact_unlocks
    (organization_id, candidate_id, unlocked_by, credits_consumed)
  VALUES (p_organization_id, v_candidate.id, p_unlocked_by, 1)
  ON CONFLICT (organization_id, candidate_id) DO NOTHING
  RETURNING id INTO v_unlock_id;

  IF v_unlock_id IS NOT NULL THEN
    v_charge := public.consume_credits(
      p_organization_id,
      'contact_unlocks',
      1,
      v_candidate.id::text,
      jsonb_build_object('unlocked_by', p_unlocked_by)::text
    );

    IF NOT COALESCE((v_charge->>'success')::boolean, false) THEN
      RAISE EXCEPTION 'INSUFFICIENT_CREDITS: %', v_charge->>'error';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_unlocked', (v_unlock_id IS NULL),
    'candidate', to_jsonb(v_candidate)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_candidate_contact(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_candidate_contact(UUID, TEXT, UUID) TO service_role;


NOTIFY pgrst, 'reload schema';
COMMIT;
