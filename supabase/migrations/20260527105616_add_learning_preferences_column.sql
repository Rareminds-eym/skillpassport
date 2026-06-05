/**
 * Migration: Add learning_preferences column to personal_assessment_results
 *
 * Purpose: Store raw learning preferences (ms17-ms20) for middle school assessments
 * Stores by question UUID (not question code)
 *
 * Questions stored:
 * - ms17 (UUID): Learning modality preferences
 * - ms18 (UUID): Collaboration style preferences
 * - ms19 (UUID): Group role preferences
 * - ms20 (UUID): Problem-solving approach preferences
 *
 * These are stored as-is (no scoring) for later use in AI prompt context
 * and career recommendation generation.
 */

-- Add learning_preferences column to personal_assessment_results
ALTER TABLE "public"."personal_assessment_results"
ADD COLUMN "learning_preferences" jsonb DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN "public"."personal_assessment_results"."learning_preferences"
IS 'Raw learning preferences (ms17-ms20) by UUID: learning modality, collaboration style, group role, problem-solving approach. Format: { "uuid1": answer, "uuid2": answer, ... }. Used for AI prompt context and career recommendations.';

-- Create index for querying by learning preferences (optional, for future use)
CREATE INDEX IF NOT EXISTS "idx_personal_assessment_results_learning_preferences"
ON "public"."personal_assessment_results" USING GIN ("learning_preferences");
