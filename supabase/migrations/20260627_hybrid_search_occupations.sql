-- ============================================================================
-- Migration: Hybrid Search for Occupations
-- Date: 2026-06-27
-- Purpose: Implement BM25 (keyword) + Semantic (embedding) hybrid search
--          with Reciprocal Rank Fusion (RRF) for better results
-- ============================================================================

-- Enable full-text search extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create full-text search index on occupation names and descriptions
CREATE INDEX IF NOT EXISTS idx_occupations_fts ON occupations
USING GIN(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')));

-- ============================================================================
-- Holland Hexagon Distance Function (for RIASEC matching)
-- ============================================================================
CREATE OR REPLACE FUNCTION holland_distance(type1 char, type2 char)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN type1 = type2 THEN 0
    WHEN (type1 = 'R' AND type2 = 'I') OR (type1 = 'I' AND type2 = 'R') THEN 1
    WHEN (type1 = 'I' AND type2 = 'A') OR (type1 = 'A' AND type2 = 'I') THEN 1
    WHEN (type1 = 'A' AND type2 = 'S') OR (type1 = 'S' AND type2 = 'A') THEN 1
    WHEN (type1 = 'S' AND type2 = 'E') OR (type1 = 'E' AND type2 = 'S') THEN 1
    WHEN (type1 = 'E' AND type2 = 'C') OR (type1 = 'C' AND type2 = 'E') THEN 1
    WHEN (type1 = 'C' AND type2 = 'R') OR (type1 = 'R' AND type2 = 'C') THEN 1
    WHEN (type1 = 'R' AND type2 = 'A') OR (type1 = 'A' AND type2 = 'R') THEN 2
    WHEN (type1 = 'I' AND type2 = 'S') OR (type1 = 'S' AND type2 = 'I') THEN 2
    WHEN (type1 = 'A' AND type2 = 'E') OR (type1 = 'E' AND type2 = 'A') THEN 2
    WHEN (type1 = 'S' AND type2 = 'C') OR (type1 = 'C' AND type2 = 'S') THEN 2
    WHEN (type1 = 'E' AND type2 = 'R') OR (type1 = 'R' AND type2 = 'E') THEN 2
    WHEN (type1 = 'C' AND type2 = 'I') OR (type1 = 'I' AND type2 = 'C') THEN 2
    WHEN (type1 = 'R' AND type2 = 'S') OR (type1 = 'S' AND type2 = 'R') THEN 3
    WHEN (type1 = 'I' AND type2 = 'E') OR (type1 = 'E' AND type2 = 'I') THEN 3
    WHEN (type1 = 'A' AND type2 = 'C') OR (type1 = 'C' AND type2 = 'A') THEN 3
    ELSE 3
  END;
$$;

-- ============================================================================
-- HYBRID SEARCH FUNCTION: BM25 + Semantic with RRF + Holland Hexagon RIASEC
-- ============================================================================
CREATE OR REPLACE FUNCTION hybrid_search_occupations(
  query_text text,
  query_embedding vector,
  learner_riasec_code varchar(6) DEFAULT NULL,
  match_count int DEFAULT 50,
  alpha float DEFAULT 0.5  -- Balance: 0.5 = equal weight, 0.7 = favor semantic
)
RETURNS TABLE (
  occupation_id uuid,
  occupation_code varchar(24),
  occupation_name varchar(255),
  occupation_codes varchar(10)[],
  semantic_similarity double precision,
  keyword_rank_score double precision,
  hybrid_score double precision,
  search_method varchar(20),
  riasec_alignment double precision,
  description text,
  domain_name text
)
LANGUAGE sql
STABLE
AS $$
  WITH keyword_search AS (
    -- BM25 Keyword Search
    SELECT
      o.id,
      o.code,
      o.name,
      o.description,
      ARRAY[o.riasec_code_string]::varchar(10)[] AS occupation_codes,
      ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', COALESCE(o.name, '') || ' ' || COALESCE(o.description, '')),
                         plainto_tsquery('english', query_text)) DESC) AS bm25_rank,
      ts_rank(to_tsvector('english', COALESCE(o.name, '') || ' ' || COALESCE(o.description, '')),
              plainto_tsquery('english', query_text)) AS bm25_score
    FROM public.occupations o
    WHERE to_tsvector('english', COALESCE(o.name, '') || ' ' || COALESCE(o.description, '')) @@
          plainto_tsquery('english', query_text)
    AND o.is_active = TRUE
    LIMIT match_count * 2  -- Retrieve extra for better fusion
  ),
  semantic_search AS (
    -- Semantic Vector Search
    SELECT
      o.id,
      o.code,
      o.name,
      o.description,
      ARRAY[o.riasec_code_string]::varchar(10)[] AS occupation_codes,
      ROW_NUMBER() OVER (ORDER BY GREATEST(0, 1 - (e.embedding <=> query_embedding::vector)) DESC) AS semantic_rank,
      GREATEST(0, 1 - (e.embedding <=> query_embedding::vector)) AS semantic_score
    FROM public.embeddings e
    JOIN public.occupations o ON o.id = e.entity_id AND o.is_active = TRUE
    WHERE e.entity_type = 'occupation'
    ORDER BY semantic_score DESC
    LIMIT match_count * 2
  ),
  combined AS (
    -- Combine both searches with RRF (Reciprocal Rank Fusion)
    SELECT
      COALESCE(ks.id, ss.id) AS id,
      COALESCE(ks.code, ss.code) AS code,
      COALESCE(ks.name, ss.name) AS name,
      COALESCE(ks.description, ss.description) AS description,
      COALESCE(ks.occupation_codes, ss.occupation_codes) AS occupation_codes,
      ss.semantic_score,
      ks.bm25_score,
      -- RRF Formula: 1/(k + rank), then normalize
      CASE
        WHEN ks.bm25_rank IS NOT NULL AND ss.semantic_rank IS NOT NULL THEN
          (alpha * (1.0 / (60 + ss.semantic_rank)) + (1 - alpha) * (1.0 / (60 + ks.bm25_rank)))
        WHEN ss.semantic_rank IS NOT NULL THEN
          (alpha * (1.0 / (60 + ss.semantic_rank)))
        ELSE
          ((1 - alpha) * (1.0 / (60 + ks.bm25_rank)))
      END AS hybrid_score,
      CASE
        WHEN ks.bm25_rank IS NOT NULL AND ss.semantic_rank IS NOT NULL THEN 'HYBRID'
        WHEN ss.semantic_rank IS NOT NULL THEN 'SEMANTIC'
        ELSE 'KEYWORD'
      END AS search_method,
      -- RIASEC Alignment using Holland Hexagon Distance
      CASE
        WHEN learner_riasec_code IS NULL OR COALESCE(ks.code, ss.code) IS NULL THEN 0.5
        ELSE 1.0 - (
          (
            LEAST(
              holland_distance(SUBSTRING(learner_riasec_code, 1, 1), SUBSTRING(COALESCE(ks.code, ss.code), 1, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 1, 1), SUBSTRING(COALESCE(ks.code, ss.code), 2, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 1, 1), SUBSTRING(COALESCE(ks.code, ss.code), 3, 1))::double precision
            ) +
            LEAST(
              holland_distance(SUBSTRING(learner_riasec_code, 2, 1), SUBSTRING(COALESCE(ks.code, ss.code), 1, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 2, 1), SUBSTRING(COALESCE(ks.code, ss.code), 2, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 2, 1), SUBSTRING(COALESCE(ks.code, ss.code), 3, 1))::double precision
            ) +
            LEAST(
              holland_distance(SUBSTRING(learner_riasec_code, 3, 1), SUBSTRING(COALESCE(ks.code, ss.code), 1, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 3, 1), SUBSTRING(COALESCE(ks.code, ss.code), 2, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 3, 1), SUBSTRING(COALESCE(ks.code, ss.code), 3, 1))::double precision
            )
          ) / 9.0
        )
      END AS riasec_align
    FROM keyword_search ks
    FULL OUTER JOIN semantic_search ss ON ks.id = ss.id
  )
  SELECT
    ranked.id,
    ranked.code,
    ranked.name,
    ranked.occupation_codes,
    COALESCE(ranked.semantic_similarity, 0)::double precision AS semantic_similarity,
    COALESCE(ranked.keyword_rank_score, 0)::double precision AS keyword_rank_score,
    ranked.hybrid_score::double precision,
    ranked.search_method::varchar(20),
    ranked.riasec_align::double precision,
    ranked.description,
    COALESCE(d.name, 'Unclassified')::text AS domain_name
  FROM (
    SELECT
      c.id,
      c.code,
      c.name,
      c.description,
      c.occupation_codes,
      c.semantic_score AS semantic_similarity,
      c.bm25_score AS keyword_rank_score,
      c.hybrid_score,
      c.search_method,
      c.riasec_align,
      ROW_NUMBER() OVER (ORDER BY c.hybrid_score DESC, c.riasec_align DESC) AS final_rank
    FROM combined c
  ) ranked
  LEFT JOIN public.role_domains rd ON ranked.id = rd.role_id
  LEFT JOIN public.domains d ON rd.domain_id = d.id
  WHERE ranked.final_rank <= match_count
  ORDER BY ranked.hybrid_score DESC, ranked.riasec_align DESC;
$$;

-- ============================================================================
-- SIMPLIFIED HYBRID SEARCH (easier to use)
-- ============================================================================
CREATE OR REPLACE FUNCTION hybrid_search_simple(
  query_text text,
  query_embedding vector,
  learner_riasec_code varchar(6) DEFAULT NULL,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  occupation_id uuid,
  occupation_code varchar(24),
  occupation_name varchar(255),
  occupation_codes varchar(10)[],
  similarity double precision,
  riasec_alignment double precision,
  method varchar(20),
  description text,
  domain_name text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    occupation_id,
    occupation_code,
    occupation_name,
    occupation_codes,
    hybrid_score::double precision as similarity,
    riasec_alignment,
    search_method::varchar(20) as method,
    description,
    domain_name
  FROM hybrid_search_occupations(
    query_text,
    query_embedding,
    learner_riasec_code,
    match_count,
    0.6  -- Favor semantic (0.6) over keyword (0.4)
  );
$$;

-- Test query examples:
-- SELECT * FROM hybrid_search_occupations('Software Engineer', '[0.1,0.2,...]'::vector, 'IEC', 20, 0.6);
-- SELECT * FROM hybrid_search_simple('Data Science', '[0.1,0.2,...]'::vector, 'IRE', 20);
