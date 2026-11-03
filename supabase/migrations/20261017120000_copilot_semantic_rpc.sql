-- Migration: Recruiter Copilot Semantic RPCs (previously repo-missing)
--
-- functions/api/recruiter-copilot.ts calls search_candidates_by_embedding and
-- match_candidates_to_opportunity, but no migration ever defined them — fresh
-- environments would 23503 on every semantic copilot action. This file defines
-- both following the house match_opportunities convention (cosine distance via
-- pgvector <=>, similarity = 1 - distance).
--
-- Contact fields (email/contact_number) are deliberately NOT returned here:
-- access is governed by candidate_contact_unlocks and enforced server-side in
-- maskLockedContacts(); the DB layer returns discoverable, non-contact data only.
--
-- Deployment order:
-- 1. Run this migration
-- (Copilot semantic actions then work in fresh environments without any code change.)

BEGIN;

CREATE OR REPLACE FUNCTION public.search_candidates_by_embedding(
  query_embedding vector,
  match_threshold double precision,
  match_count integer
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  name varchar,
  university varchar,
  branch_field varchar,
  city varchar,
  state varchar,
  currentCgpa numeric,
  expectedGraduationDate date,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.name,
    l.university,
    l.branch_field,
    l.city,
    l.state,
    l.currentCgpa,
    l.expectedGraduationDate,
    (1 - (l.embedding <=> query_embedding))::float8 AS similarity
  FROM public.learners l
  WHERE l.embedding IS NOT NULL
    AND l.name IS NOT NULL
    AND (1 - (l.embedding <=> query_embedding)) >= match_threshold
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_candidates_to_opportunity(
  opportunity_embedding vector,
  match_count integer,
  min_similarity double precision
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  name varchar,
  university varchar,
  branch_field varchar,
  city varchar,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.name,
    l.university,
    l.branch_field,
    l.city,
    (1 - (l.embedding <=> opportunity_embedding))::float8 AS similarity
  FROM public.learners l
  WHERE l.embedding IS NOT NULL
    AND l.name IS NOT NULL
    AND (1 - (l.embedding <=> opportunity_embedding)) >= min_similarity
  ORDER BY l.embedding <=> opportunity_embedding
  LIMIT match_count;
END;
$$;

-- Access model (project convention): no RLS era; explicit grants; service-role only.
REVOKE ALL ON FUNCTION public.search_candidates_by_embedding(vector, double precision, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_candidates_by_embedding(vector, double precision, integer) TO service_role;

REVOKE ALL ON FUNCTION public.match_candidates_to_opportunity(vector, integer, double precision) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_candidates_to_opportunity(vector, integer, double precision) TO service_role;

COMMIT;
