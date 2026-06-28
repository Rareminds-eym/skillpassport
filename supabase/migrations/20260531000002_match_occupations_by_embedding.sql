-- ============================================================================
-- Migration: match_occupations_by_embedding()
-- Date: 2026-05-31
-- Purpose: Hybrid semantic + Holland hexagon RIASEC matching for career recommendations
--   Semantic: cosine distance over embeddings (0-100 scale)
--   RIASEC: Holland hexagon distance between 3-letter codes (0-1 similarity)
--   Weighted combination: 40% semantic + 60% RIASEC
-- ============================================================================

-- Drop existing function to recreate with updated return type
CREATE OR REPLACE FUNCTION holland_distance(type1 char, type2 char)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  -- Hexagon distance matrix based on circumplex model
  -- Hexagon arrangement (angular): R(0°), I(60°), A(120°), S(180°), E(240°), C(300°)
  -- Distance = angular_steps between types
  SELECT CASE
    WHEN type1 = type2 THEN 0
    -- Adjacent (distance 1): R-I, I-A, A-S, S-E, E-C, C-R
    WHEN (type1 = 'R' AND type2 = 'I') OR (type1 = 'I' AND type2 = 'R') THEN 1
    WHEN (type1 = 'I' AND type2 = 'A') OR (type1 = 'A' AND type2 = 'I') THEN 1
    WHEN (type1 = 'A' AND type2 = 'S') OR (type1 = 'S' AND type2 = 'A') THEN 1
    WHEN (type1 = 'S' AND type2 = 'E') OR (type1 = 'E' AND type2 = 'S') THEN 1
    WHEN (type1 = 'E' AND type2 = 'C') OR (type1 = 'C' AND type2 = 'E') THEN 1
    WHEN (type1 = 'C' AND type2 = 'R') OR (type1 = 'R' AND type2 = 'C') THEN 1
    -- Alternate (distance 2): R-A, I-S, A-E, S-C, E-R, C-I
    WHEN (type1 = 'R' AND type2 = 'A') OR (type1 = 'A' AND type2 = 'R') THEN 2
    WHEN (type1 = 'I' AND type2 = 'S') OR (type1 = 'S' AND type2 = 'I') THEN 2
    WHEN (type1 = 'A' AND type2 = 'E') OR (type1 = 'E' AND type2 = 'A') THEN 2
    WHEN (type1 = 'S' AND type2 = 'C') OR (type1 = 'C' AND type2 = 'S') THEN 2
    WHEN (type1 = 'E' AND type2 = 'R') OR (type1 = 'R' AND type2 = 'E') THEN 2
    WHEN (type1 = 'C' AND type2 = 'I') OR (type1 = 'I' AND type2 = 'C') THEN 2
    -- Opposite (distance 3): R-S, I-E, A-C
    WHEN (type1 = 'R' AND type2 = 'S') OR (type1 = 'S' AND type2 = 'R') THEN 3
    WHEN (type1 = 'I' AND type2 = 'E') OR (type1 = 'E' AND type2 = 'I') THEN 3
    WHEN (type1 = 'A' AND type2 = 'C') OR (type1 = 'C' AND type2 = 'A') THEN 3
    ELSE 3  -- Unknown combination
  END;
$$;

CREATE OR REPLACE FUNCTION match_occupations_by_embedding(
  query_embedding text,
  learner_riasec_code varchar(6) DEFAULT NULL,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  occupation_id uuid,
  occupation_code varchar(24),
  occupation_name varchar(255),
  occupation_codes varchar(10)[],
  similarity double precision,
  riasec_alignment double precision,
  description text
  )
LANGUAGE sql
STABLE
AS $$
  WITH scored AS (
    SELECT
      o.id,
      o.code,
      o.name,
      o.description,
      ARRAY[o.riasec_code_string]::varchar(10)[] AS occupation_codes,
      GREATEST(0, 1 - (e.embedding <=> query_embedding::vector)) AS semantic_sim,
      -- Holland hexagon: average distance between 3 letters, then convert to 0-1 similarity
      CASE
        WHEN learner_riasec_code IS NULL OR o.riasec_code_string IS NULL THEN 0.5
        ELSE 1.0 - (
          (
            -- For learner letter 1: minimum distance to any occ letter
            LEAST(
              holland_distance(SUBSTRING(learner_riasec_code, 1, 1), SUBSTRING(o.riasec_code_string, 1, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 1, 1), SUBSTRING(o.riasec_code_string, 2, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 1, 1), SUBSTRING(o.riasec_code_string, 3, 1))::double precision
            ) +
            -- For learner letter 2: minimum distance to any occ letter
            LEAST(
              holland_distance(SUBSTRING(learner_riasec_code, 2, 1), SUBSTRING(o.riasec_code_string, 1, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 2, 1), SUBSTRING(o.riasec_code_string, 2, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 2, 1), SUBSTRING(o.riasec_code_string, 3, 1))::double precision
            ) +
            -- For learner letter 3: minimum distance to any occ letter
            LEAST(
              holland_distance(SUBSTRING(learner_riasec_code, 3, 1), SUBSTRING(o.riasec_code_string, 1, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 3, 1), SUBSTRING(o.riasec_code_string, 2, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 3, 1), SUBSTRING(o.riasec_code_string, 3, 1))::double precision
            )
          ) / 9.0
        )
      END AS riasec_align
    FROM public.embeddings e
    JOIN public.occupations o
      ON o.id = e.entity_id AND o.is_active = TRUE
    WHERE e.entity_type = 'occupation'
  )
  SELECT
    id AS occupation_id,
    code AS occupation_code,
    name AS occupation_name,
    occupation_codes,
    semantic_sim AS similarity,
    riasec_align AS riasec_alignment,
    description
  FROM scored
  ORDER BY
    (semantic_sim * 0.4 + riasec_align * 100 * 0.6) DESC
  LIMIT match_count;
$$;

-- Test (with RIASEC code):
-- SELECT occupation_name, occupation_codes, similarity, riasec_alignment
-- FROM match_occupations_by_embedding('[0.1,0.2,...]'::text, 'ECI', 50);
--
-- Test (without RIASEC filtering):
-- SELECT occupation_name, occupation_codes, similarity
-- FROM match_occupations_by_embedding('[0.1,0.2,...]'::text, NULL, 50);
