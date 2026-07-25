-- Add dedicated growth_map column to personal_assessment_results
-- This extracts the growth_map from profile_snapshot for faster querying and indexing

ALTER TABLE "public"."personal_assessment_results"
ADD COLUMN "growth_map" "jsonb" DEFAULT NULL;

COMMENT ON COLUMN "public"."personal_assessment_results"."growth_map" IS 'Dedicated column for growth map data extracted from profile_snapshot. Contains: interest_worlds, character_strengths, self_social (EQ/SQ), explorer_map, capability_wheel, what_i_have, what_i_need_next, recommended_missions';

-- Create index for faster queries on growth_map
CREATE INDEX "idx_personal_assessment_results_growth_map"
ON "public"."personal_assessment_results"
USING GIN ("growth_map");

-- Create index to find results by learner for quick retrieval
CREATE INDEX "idx_personal_assessment_results_learner_completed"
ON "public"."personal_assessment_results" ("learner_id", "grade_level", "status")
WHERE "status" = 'completed';
