-- Migration: Add role_id and capability tracking to learner_course_recommendations
-- Purpose: Support both course and capability recommendations with role tracking
-- Pattern: Expand-Migrate-Contract (Phase 1: Expand)

-- 1. Remove foreign key constraint on course_id
-- Allows storing capability IDs from LTE without FK violation
ALTER TABLE learner_course_recommendations
DROP CONSTRAINT learner_course_recommendations_course_id_fkey;

-- 2. Update course_id column comment to explain dual-use pattern
COMMENT ON COLUMN learner_course_recommendations.course_id IS
'UUID for learning item - can store EITHER:
- Course ID from SkillPassport.courses table (for course recommendations)
- Capability ID from LTE.capabilities table (for capability/learning sequence recommendations)
No FK constraint because IDs come from different databases.
Application logic determines type based on context.';

-- 3. Add role_id column to track which role each capability recommendation is for
ALTER TABLE learner_course_recommendations
ADD COLUMN role_id UUID;

-- 4. Add role_id column comment
COMMENT ON COLUMN learner_course_recommendations.role_id IS
'UUID of the occupation/role this recommendation is associated with.
For capability recommendations, this tracks which role the capability is being recommended for.
Allows the same capability to appear in recommendations for multiple roles with separate records.';

-- 5. Update the unique constraint to include role_id
-- This allows the same capability to appear for different roles
ALTER TABLE learner_course_recommendations
DROP CONSTRAINT IF EXISTS learner_course_recommendations_unique;

ALTER TABLE learner_course_recommendations
ADD CONSTRAINT learner_course_recommendations_unique
UNIQUE(learner_id, course_id, role_id, assessment_result_id);
