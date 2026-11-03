-- Preserve the RPC contracts while resolving the actual learner column names
-- and pgvector operators under the restricted SECURITY DEFINER search path.
BEGIN;

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
  FROM public.learners l
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
  FROM public.learners l
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

NOTIFY pgrst, 'reload schema';
COMMIT;
