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
  occupation_code varchar(24),   -- matches occupations.code (widened for industry prefixes e.g. DAI-ROLE-001)
  occupation_name varchar(255),
  occupation_codes varchar(10)[],
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  -- v2 schema: roles carry a single RIASEC code string (e.g. 'ESC') instead of the
  -- dropped riasec_profiles table. occupation_codes is returned as a 1-element array to
  -- preserve the function's output contract for the Holland-hexagon Interest Fit calc.
  SELECT
    o.id,
    o.code,
    o.name,
    ARRAY[o.riasec_code_string]::varchar(10)[],
    1 - (e.embedding <=> query_embedding::vector) AS similarity
  FROM public.embeddings e
  JOIN public.occupations o
    ON o.id = e.entity_id AND o.is_active = TRUE
  WHERE e.entity_type = 'occupation'
  ORDER BY e.embedding <=> query_embedding::vector  -- cosine distance asc = most similar first
  LIMIT match_count;
$$;

-- Test:
-- SELECT occupation_name, occupation_codes, similarity
-- FROM match_occupations_by_embedding('[0,0,...]', 10);
