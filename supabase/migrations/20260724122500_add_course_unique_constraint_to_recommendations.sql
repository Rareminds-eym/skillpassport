-- Migration: Re-add unique constraint for course-based recommendations
ALTER TABLE "public"."learner_course_recommendations"
ADD CONSTRAINT "learner_course_recommendations_course_unique_key"
UNIQUE (learner_id, course_id, role_id, assessment_result_id);
