/**
 * Migration: Add strength_scores column to personal_assessment_results
 *
 * Purpose: Store strength dimension scores for middle school assessments
 * Each strength has: dimension name, ratings array, and average score
 *
 * Example format:
 * [
 *   {
 *     "dimension": "leadership",
 *     "ratings": [3, 4, 4],
 *     "average": 3.67
 *   },
 *   {
 *     "dimension": "creativity",
 *     "ratings": [5, 4],
 *     "average": 4.5
 *   }
 * ]
 */

-- Add strength_scores column to personal_assessment_results
ALTER TABLE "public"."personal_assessment_results"
ADD COLUMN "strength_scores" jsonb DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN "public"."personal_assessment_results"."strength_scores"
IS 'Strength dimension scores array. Each object contains: dimension (string), ratings (number[]), average (number). Used to display learner strengths in assessment results.';

-- Create index for querying (optional, for future use)
CREATE INDEX IF NOT EXISTS "idx_personal_assessment_results_strength_scores"
ON "public"."personal_assessment_results" USING GIN ("strength_scores");
