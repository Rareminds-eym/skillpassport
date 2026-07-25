-- ============================================================================
-- Migration: add stream_aptitude_score + stream_aptitude_details
-- Date: 2026-05-31
-- Purpose: store the STREAM-BASED (AI-generated MCQ) aptitude result for
--   college/higher grades. Previously this MCQ aptitude was never scored/stored.
--   Distinct from:
--     - aptitude_overall / aptitude_scores → the ADAPTIVE aptitude test
--     - knowledge_score                    → the stream KNOWLEDGE MCQ percentage
-- Safe: nullable columns, no data change.
-- ============================================================================

ALTER TABLE public.personal_assessment_results
  ADD COLUMN IF NOT EXISTS stream_aptitude_score numeric;

ALTER TABLE public.personal_assessment_results
  ADD COLUMN IF NOT EXISTS stream_aptitude_details jsonb;

COMMENT ON COLUMN public.personal_assessment_results.stream_aptitude_score
  IS 'Stream-based (AI MCQ) aptitude percentage 0-100. Adaptive aptitude is separate (aptitude_overall).';
COMMENT ON COLUMN public.personal_assessment_results.stream_aptitude_details
  IS 'Breakdown: { score, correctCount, totalQuestions, byDifficulty:{easy/medium/hard:{correct,total,percentage}} }';
