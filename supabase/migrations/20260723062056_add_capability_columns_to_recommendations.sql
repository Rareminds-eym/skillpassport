-- Add denormalized capability columns to learner_course_recommendations
ALTER TABLE learner_course_recommendations
ADD COLUMN IF NOT EXISTS capability_id TEXT,
ADD COLUMN IF NOT EXISTS capability_name TEXT,
ADD COLUMN IF NOT EXISTS capability_code TEXT,
ADD COLUMN IF NOT EXISTS capability_description TEXT,
ADD COLUMN IF NOT EXISTS cached_at TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learner_course_recommendations_learner_status
ON learner_course_recommendations(learner_id, status)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_learner_course_recommendations_capability_id
ON learner_course_recommendations(capability_id)
WHERE capability_id IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN learner_course_recommendations.capability_id IS 'Denormalized capability ID - stored to avoid repeated LTE API calls';
COMMENT ON COLUMN learner_course_recommendations.capability_name IS 'Denormalized capability name for dashboard display';
COMMENT ON COLUMN learner_course_recommendations.capability_code IS 'Denormalized capability code for dashboard display';
COMMENT ON COLUMN learner_course_recommendations.capability_description IS 'Denormalized capability description for dashboard display';
COMMENT ON COLUMN learner_course_recommendations.cached_at IS 'Timestamp when capability data was last cached';

-- Update unique constraint to use capability_id instead of course_id
-- Drop old constraint created by 20260721084047_add_role_id_and_capability_tracking.sql
ALTER TABLE "public"."learner_course_recommendations"
DROP CONSTRAINT IF EXISTS "learner_course_recommendation_unique";

ALTER TABLE "public"."learner_course_recommendations"
DROP CONSTRAINT IF EXISTS "learner_course_recommendations_learner_id_course_id_role_id_assessment_result_id_key";

-- Create new constraint using capability_id
ALTER TABLE "public"."learner_course_recommendations"
ADD CONSTRAINT "learner_course_recommendations_learner_id_capability_id_role_id_assessment_result_id_key"
UNIQUE (learner_id, capability_id, role_id, assessment_result_id);
