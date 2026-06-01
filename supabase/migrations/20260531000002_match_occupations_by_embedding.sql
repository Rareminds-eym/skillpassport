-- ============================================================================
-- Migration: match_occupations_by_embedding()
-- Date: 2026-05-31
-- Purpose: RAG retrieval for the career cluster generator (RAG -> scoring -> LLM).
--   Pure semantic retrieval: given a student query embedding, return the top-K
--   occupations by cosine similarity over their stored embeddings.
--
--   C-Index is NOT used anywhere. The function returns each occupation's RIASEC profile
--   codes (occupation_codes) so the backend computes Interest Fit via the Holland hexagon.
--   query_embedding is passed as text and cast to vector so it works cleanly over
--   PostgREST / supabase-js rpc().
-- ============================================================================

CREATE OR REPLACE FUNCTION match_occupations_by_embedding(
  query_embedding text,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  occupation_id uuid,
  occupation_code varchar(20),
  occupation_name varchar(255),
  occupation_codes varchar(10)[],
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    o.id,
    o.code,
    o.name,
    codes.arr,
    1 - (e.embedding <=> query_embedding::vector) AS similarity
  FROM public.embeddings e
  JOIN public.occupations o
    ON o.id = e.entity_id AND o.is_active = TRUE
  LEFT JOIN LATERAL (
    SELECT array_agg(DISTINCT rp.profile_code ORDER BY rp.profile_code) AS arr
    FROM public.riasec_profiles rp
    WHERE rp.occupation_id = o.id
  ) codes ON TRUE
  WHERE e.entity_type = 'occupation'
  ORDER BY e.embedding <=> query_embedding::vector  -- cosine distance asc = most similar first
  LIMIT match_count;
$$;

-- Test:
-- SELECT occupation_name, occupation_codes, similarity
-- FROM match_occupations_by_embedding('[0,0,...]', 10);
