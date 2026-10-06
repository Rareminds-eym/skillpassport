-- Stage F: BGE-M3 embedding spaces (additive, non-breaking).
--
-- DO NOT APPLY until the Stage F backfill approval is recorded in
-- docs/plans/openrouter-migration-status.md. These objects are
-- additive + nullable: applying changes nothing for existing readers,
-- which keep using the legacy 1536-dim columns until each consumer's
-- query/data switch-together step.
--
-- Provenance (probe-verified 2026-10-06): @cf/baai/bge-m3, 1024 dims.
-- Legacy spaces (1536 Gemini, 768 cache) are left untouched.

-- Retrieval-consumer tables gain a versioned BGE-M3 column + HNSW index.
-- HNSW (not ivfflat): builds without pre-existing data/training.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS embedding_bge_m3 extensions.vector(1024);

ALTER TABLE public.learners
  ADD COLUMN IF NOT EXISTS embedding_bge_m3 extensions.vector(1024);

ALTER TABLE public.embeddings
  ADD COLUMN IF NOT EXISTS embedding_bge_m3 extensions.vector(1024);

COMMENT ON COLUMN public.courses.embedding_bge_m3 IS
  'BGE-M3 text embedding (@cf/baai/bge-m3, 1024 dims). Backfill-gated; do not read until the consumer switch-together step.';
COMMENT ON COLUMN public.learners.embedding_bge_m3 IS
  'BGE-M3 text embedding (@cf/baai/bge-m3, 1024 dims). Backfill-gated; do not read until the consumer switch-together step.';
COMMENT ON COLUMN public.embeddings.embedding_bge_m3 IS
  'BGE-M3 text embedding (@cf/baai/bge-m3, 1024 dims). Backfill-gated; do not read until the consumer switch-together step.';

CREATE INDEX IF NOT EXISTS courses_embedding_bge_m3_hnsw_idx
  ON public.courses USING hnsw (embedding_bge_m3 extensions.vector_cosine_ops)
  WITH (m = '16', ef_construction = '64');

CREATE INDEX IF NOT EXISTS learners_embedding_bge_m3_hnsw_idx
  ON public.learners USING hnsw (embedding_bge_m3 extensions.vector_cosine_ops)
  WITH (m = '16', ef_construction = '64');

CREATE INDEX IF NOT EXISTS embeddings_bge_m3_hnsw_idx
  ON public.embeddings USING hnsw (embedding_bge_m3 extensions.vector_cosine_ops)
  WITH (m = '16', ef_construction = '64');

-- Cache poisoning guard: embedding_cache is keyed by (text_hash, cache_type)
-- with NO model discrimination, and stores 768-dim vectors from yet another
-- space. A BGE-M3 write under the same key would poison readers.
-- Widen the lookup key with the model before any BGE-M3 cache write.
ALTER TABLE public.embedding_cache
  ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT 'legacy';

DROP INDEX IF EXISTS public.idx_embedding_cache_lookup;
CREATE INDEX IF NOT EXISTS idx_embedding_cache_lookup
  ON public.embedding_cache USING btree (text_hash, cache_type, model);

COMMENT ON COLUMN public.embedding_cache.model IS
  'Embedding space key (legacy = 1536-dim Gemini; bge_m3 = 1024-dim BGE-M3). Part of the cache lookup key.';
