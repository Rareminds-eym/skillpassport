-- ============================================================================
-- Migration: Add support for external educators grading assignments
-- Date: 2027-01-15
-- Description: Adds external_educator_graded_by column to support organization_staff 
--              educators grading assignments, without affecting existing 
--              college_lecturer grading functionality
-- ============================================================================

-- Step 1: Add new column for external educators grading (nullable)
-- This will only be set when an organization_staff member grades an assignment
ALTER TABLE "public"."college_learner_assignments"
ADD COLUMN "external_educator_graded_by" "uuid";

-- Step 2: Add foreign key constraint to users table
-- This works for both college_lecturers and organization_staff since both have user_id in users table
ALTER TABLE "public"."college_learner_assignments"
ADD CONSTRAINT "college_learner_assignments_external_educator_graded_by_fkey" 
FOREIGN KEY ("external_educator_graded_by") 
REFERENCES "public"."users"("id") 
ON DELETE SET NULL;

-- Step 3: Add check constraint to ensure data integrity
-- Rule: BOTH can be null (ungraded), OR exactly ONE of graded_by OR external_educator_graded_by must be set
-- (not both at the same time - can't be graded by two educators simultaneously)
ALTER TABLE "public"."college_learner_assignments"
ADD CONSTRAINT "college_learner_assignments_graded_by_check" 
CHECK (
  -- Either both are null (not yet graded)
  (graded_by IS NULL AND external_educator_graded_by IS NULL) 
  OR
  -- Or internal faculty graded (graded_by set, external null)
  (graded_by IS NOT NULL AND external_educator_graded_by IS NULL) 
  OR
  -- Or external staff graded (external set, graded_by null)
  (graded_by IS NULL AND external_educator_graded_by IS NOT NULL)
);

-- Step 4: Add documentation comments
COMMENT ON COLUMN "public"."college_learner_assignments"."graded_by" IS
'Foreign key to college_lecturers.user_id for internal faculty grading. Mutually exclusive with external_educator_graded_by. Can be null if not yet graded or graded by external educator.';

COMMENT ON COLUMN "public"."college_learner_assignments"."external_educator_graded_by" IS 
'Foreign key to users.id for external educators (organization_staff) grading. Mutually exclusive with graded_by. Can be null if not yet graded or graded by internal faculty. Either graded_by (internal) OR external_educator_graded_by (external) OR neither (ungraded), but never both.';

COMMENT ON CONSTRAINT "college_learner_assignments_graded_by_check" ON "public"."college_learner_assignments" IS
'Data integrity constraint: Ensures only one educator type grades an assignment - either internal faculty (graded_by) or external staff (external_educator_graded_by), or neither (ungraded), but never both simultaneously.';

-- ============================================================================
-- Impact Analysis:
-- ============================================================================
-- ✅ Existing college_lecturer grading: NO CHANGE
--    - graded_by remains populated with their user_id
--    - external_educator_graded_by will be null
--    - All existing grading queries work as-is
--
-- ✅ New external educator grading: NEW FUNCTIONALITY
--    - graded_by will be null
--    - external_educator_graded_by will contain their user_id
--    - Can now grade assignments without FK constraint violation
--
-- ⚠️  Required code changes after migration:
--    1. Update grade-college-assignment to detect educator type and set appropriate column
--    2. Update any grading history queries to check BOTH columns
-- ============================================================================
