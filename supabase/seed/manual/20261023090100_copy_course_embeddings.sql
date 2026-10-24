-- Explicit operator seed: copy existing course vectors into generic storage.
-- Prerequisite: 20261023120000_generic_retrieval.sql (includes course entity constraint).
-- Run as the database owner/service operator, never from a browser.
-- No provider calls: courses without vectors require a separate embedding job.
-- Copies ALL courses with non-null vectors, regardless of publication status;
-- this is storage maintenance and does not grant catalog visibility/approval.
-- Source vectors/model provenance are legacy/unknown. Do not attest career_rag
-- metadata or claim Gemini compatibility merely from matching dimensions.
BEGIN;
INSERT INTO public.embeddings AS target
  (entity_type, entity_id, embedding, metadata)
SELECT 'course', c.course_id, c.embedding,
  jsonb_build_object('course_vector_seed', jsonb_build_object(
    'version', 'course-vector-copy-v1',
    'source', 'public.courses.embedding',
    'model_provenance', 'unknown'
  ))
FROM public.courses c
WHERE c.embedding IS NOT NULL
ON CONFLICT (entity_type, entity_id) DO UPDATE
SET embedding = EXCLUDED.embedding,
    metadata = coalesce(target.metadata, '{}'::jsonb) || EXCLUDED.metadata,
    updated_at = now()
-- Only refresh rows owned by this seed. Preserve independently generated or
-- verified vectors; never overwrite a newer authoritative index on rerun.
WHERE target.metadata->'course_vector_seed'->>'version' = 'course-vector-copy-v1'
  AND target.metadata->'career_rag' IS NULL
  AND (target.embedding::text IS DISTINCT FROM EXCLUDED.embedding::text);

-- Aggregate report only: no vector payloads or private course content.
SELECT
  (SELECT count(*) FROM public.courses) AS total_courses,
  (SELECT count(*) FROM public.courses WHERE embedding IS NOT NULL) AS source_vectors,
  (SELECT count(*) FROM public.courses WHERE embedding IS NULL) AS missing_source_vectors,
  (SELECT count(*) FROM public.embeddings WHERE entity_type = 'course') AS stored_course_rows;
COMMIT;
