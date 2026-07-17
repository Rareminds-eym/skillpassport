-- ============================================================================
-- Migration: Hybrid Search for Roles
-- Date: 2026-06-27 (restructured 2026-07-16 for the 2-DB split junction design)
-- Purpose: BM25 (keyword) + Semantic (embedding) hybrid search with
--          Reciprocal Rank Fusion (RRF) and Holland-hexagon RIASEC alignment.
-- Schema: `role` is slim identity; all searchable/contextual attributes
--         (description, RIASEC, degree gate, profiles) live in
--         role_family_roles (one row per family/domain context).
--         Embeddings are one vector per context (entity_type='role',
--         entity_id = role_family_roles.id — the id sent to LTE).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Stored tsvector for full-text search over the context description (role name
-- is always part of the description text). Stored (not computed per query) so
-- ts_rank over broad matches does not rebuild tsvectors row by row.
ALTER TABLE public.role_family_roles
  ADD COLUMN IF NOT EXISTS description_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', COALESCE(description, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_role_family_roles_fts ON public.role_family_roles
USING GIN(description_tsv);

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
-- Returns one row per role code (best-scoring context wins);
-- role_family_role_id is the context id LTE resolves learning paths by.
-- ============================================================================
CREATE OR REPLACE FUNCTION hybrid_search_roles(
  query_text text,
  query_embedding vector,
  learner_riasec_code varchar(6) DEFAULT NULL,
  match_count int DEFAULT 50,
  alpha float DEFAULT 0.5
)
RETURNS TABLE (
  role_id uuid,
  role_family_role_id uuid,
  role_code varchar(50),
  role_name varchar(255),
  riasec_codes varchar(10)[],
  semantic_similarity double precision,
  keyword_rank_score double precision,
  hybrid_score double precision,
  search_method varchar(20),
  riasec_alignment double precision,
  description text,
  domain_name text,
  degree_gate varchar(20),
  direct_degree_mapping text,
  aptitude_profile jsonb,
  big_five_profile jsonb,
  work_values_profile jsonb
)
LANGUAGE sql
STABLE
AS $$
  WITH query_terms AS (
    -- OR the query's lexemes: plainto_tsquery ANDs every word, so a multi-term query
    -- ("BCA Web Development Operating Systems") would require ALL terms in one document and
    -- match nothing. OR semantics lets ts_rank reward documents matching MORE terms instead.
    SELECT CASE
      WHEN length(trim(COALESCE(query_text, ''))) = 0
        OR array_length(tsvector_to_array(to_tsvector('english', query_text)), 1) IS NULL
      THEN NULL
      ELSE to_tsquery('english',
             array_to_string(tsvector_to_array(to_tsvector('english', query_text)), ' | '))
    END AS q
  ),
  keyword_hits AS (
    -- BM25 Keyword Search over the contextual description (role name is always
    -- part of the description text). Filters role_family_roles DIRECTLY on the
    -- stored description_tsv (GIN indexed) — routing this through a
    -- multi-referenced CTE materializes it and forces a per-row tsvector
    -- build over the whole catalog (statement timeout).
    SELECT
      m.id AS context_id,
      ROW_NUMBER() OVER (ORDER BY ts_rank(m.description_tsv, qt.q) DESC) AS bm25_rank,
      ts_rank(m.description_tsv, qt.q) AS bm25_score
    FROM public.role_family_roles m, query_terms qt
    WHERE qt.q IS NOT NULL
    AND m.is_active = TRUE
    AND m.description_tsv @@ qt.q
    ORDER BY bm25_score DESC  -- keep the BEST keyword matches (LIMIT without ORDER BY cuts arbitrary rows)
    LIMIT match_count * 2  -- Retrieve extra for better fusion
  ),
  semantic_hits AS (
    -- Semantic Vector Search (one vector per role context = role_family_roles.id)
    SELECT
      e.entity_id AS context_id,
      ROW_NUMBER() OVER (ORDER BY GREATEST(0, 1 - (e.embedding <=> query_embedding::vector)) DESC, e.entity_id) AS semantic_rank,
      GREATEST(0, 1 - (e.embedding <=> query_embedding::vector)) AS semantic_score
    FROM public.embeddings e
    JOIN public.role_family_roles m ON m.id = e.entity_id AND m.is_active = TRUE
    WHERE e.entity_type = 'role'
    ORDER BY semantic_score DESC
    LIMIT match_count * 2
  ),
  hits AS (
    -- Fuse the two hit lists first; enrichment joins below run only on these
    -- <= match_count * 4 finalists instead of the whole catalog.
    SELECT
      COALESCE(ks.context_id, ss.context_id) AS context_id,
      ks.bm25_rank, ks.bm25_score,
      ss.semantic_rank, ss.semantic_score
    FROM keyword_hits ks
    FULL OUTER JOIN semantic_hits ss ON ks.context_id = ss.context_id
  ),
  base AS (
    -- One row per fused hit, enriched with role/family/domain attributes.
    SELECT
      r.id,
      r.code,
      r.name,
      m.id AS context_id,
      m.description,
      m.riasec_code_string AS riasec_str,
      m.degree_gate::varchar(20) AS degree_gate,
      m.direct_degree_mapping,
      m.aptitude_profile,
      m.big_five_profile,
      m.work_values_profile,
      d.name AS domain_name,
      h.bm25_rank, h.bm25_score, h.semantic_rank, h.semantic_score
    FROM hits h
    JOIN public.role_family_roles m ON m.id = h.context_id
    JOIN public.role r ON r.id = m.role_id
    JOIN public.role_family_domains rfd ON rfd.id = m.role_family_domain_id
    JOIN public.industry_domains idm ON idm.id = rfd.industry_domain_id
    JOIN public.domains d ON d.id = idm.domain_id
  ),
  combined AS (
    -- RRF (Reciprocal Rank Fusion) + Holland-hexagon RIASEC alignment
    SELECT
      b.id,
      b.context_id,
      b.code,
      b.name,
      b.description,
      ARRAY[b.riasec_str]::varchar(10)[] AS riasec_codes,
      b.degree_gate,
      b.direct_degree_mapping,
      b.aptitude_profile,
      b.big_five_profile,
      b.work_values_profile,
      b.domain_name,
      b.semantic_score,
      b.bm25_score,
      -- RRF Formula: 1/(k + rank), then normalize
      CASE
        WHEN b.bm25_rank IS NOT NULL AND b.semantic_rank IS NOT NULL THEN
          (alpha * (1.0 / (60 + b.semantic_rank)) + (1 - alpha) * (1.0 / (60 + b.bm25_rank)))
        WHEN b.semantic_rank IS NOT NULL THEN
          (alpha * (1.0 / (60 + b.semantic_rank)))
        ELSE
          ((1 - alpha) * (1.0 / (60 + b.bm25_rank)))
      END AS hybrid_score,
      CASE
        WHEN b.bm25_rank IS NOT NULL AND b.semantic_rank IS NOT NULL THEN 'HYBRID'
        WHEN b.semantic_rank IS NOT NULL THEN 'SEMANTIC'
        ELSE 'KEYWORD'
      END AS search_method,
      -- RIASEC Alignment using Holland Hexagon Distance
      -- Compares learner RIASEC vs the context's riasec_code_string
      CASE
        WHEN learner_riasec_code IS NULL OR b.riasec_str IS NULL THEN 0.5
        ELSE 1.0 - (
          (
            LEAST(
              holland_distance(SUBSTRING(learner_riasec_code, 1, 1), SUBSTRING(b.riasec_str, 1, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 1, 1), SUBSTRING(b.riasec_str, 2, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 1, 1), SUBSTRING(b.riasec_str, 3, 1))::double precision
            ) +
            LEAST(
              holland_distance(SUBSTRING(learner_riasec_code, 2, 1), SUBSTRING(b.riasec_str, 1, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 2, 1), SUBSTRING(b.riasec_str, 2, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 2, 1), SUBSTRING(b.riasec_str, 3, 1))::double precision
            ) +
            LEAST(
              holland_distance(SUBSTRING(learner_riasec_code, 3, 1), SUBSTRING(b.riasec_str, 1, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 3, 1), SUBSTRING(b.riasec_str, 2, 1))::double precision,
              holland_distance(SUBSTRING(learner_riasec_code, 3, 1), SUBSTRING(b.riasec_str, 3, 1))::double precision
            )
          ) / 9.0
        )
      END AS riasec_align
    FROM base b
  )
  SELECT
    ranked.id AS role_id,
    ranked.context_id AS role_family_role_id,
    ranked.code AS role_code,
    ranked.name AS role_name,
    ranked.riasec_codes,
    COALESCE(ranked.semantic_similarity, 0)::double precision AS semantic_similarity,
    COALESCE(ranked.keyword_rank_score, 0)::double precision AS keyword_rank_score,
    ranked.hybrid_score::double precision AS hybrid_score,
    ranked.search_method::varchar(20) AS search_method,
    ranked.riasec_align::double precision AS riasec_alignment,
    ranked.description,
    COALESCE(ranked.domain_name, 'Unclassified')::text AS domain_name,
    ranked.degree_gate,
    ranked.direct_degree_mapping,
    ranked.aptitude_profile,
    ranked.big_five_profile,
    ranked.work_values_profile
  FROM (
    SELECT
      dedup.*,
      ROW_NUMBER() OVER (ORDER BY dedup.hybrid_score DESC, dedup.riasec_align DESC) AS final_rank
    FROM (
      -- Multi-domain roles have one junction row per family/domain context (same
      -- role code). Keep only the best-scoring context per code so results
      -- are unique per role.
      SELECT DISTINCT ON (c.code)
        c.id, c.context_id, c.code, c.name, c.description, c.riasec_codes, c.degree_gate,
        c.direct_degree_mapping, c.aptitude_profile, c.big_five_profile,
        c.work_values_profile, c.domain_name,
        c.semantic_score AS semantic_similarity,
        c.bm25_score AS keyword_rank_score,
        c.hybrid_score, c.search_method, c.riasec_align
      FROM combined c
      ORDER BY c.code, c.hybrid_score DESC, c.riasec_align DESC
    ) dedup
  ) ranked
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
  role_id uuid,
  role_family_role_id uuid,
  role_code varchar(50),
  role_name varchar(255),
  riasec_codes varchar(10)[],
  similarity double precision,
  riasec_alignment double precision,
  method varchar(20),
  description text,
  domain_name text,
  degree_gate varchar(20)
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    role_id,
    role_family_role_id,
    role_code,
    role_name,
    riasec_codes,
    hybrid_score::double precision as similarity,
    riasec_alignment,
    search_method::varchar(20) as method,
    description,
    domain_name,
    degree_gate
  FROM hybrid_search_roles(
    query_text,
    query_embedding,
    learner_riasec_code,
    match_count,
    0.6  -- Favor semantic (0.6) over keyword (0.4)
  );
$$;

-- Test query examples:
-- SELECT * FROM hybrid_search_roles('Software Engineer', '[0.1,0.2,...]'::vector, 'IEC', 20, 0.6);
-- SELECT * FROM hybrid_search_simple('Data Science', '[0.1,0.2,...]'::vector, 'IRE', 20);
