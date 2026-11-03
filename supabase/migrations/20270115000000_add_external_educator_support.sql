-- ============================================================================
-- Migration: Add support for external educators in college_assignments
-- Date: 2027-01-15
-- Description: Adds external_educator_id column to support organization_staff 
--              educators creating assignments, without affecting existing 
--              college_lecturer functionality
-- ============================================================================

-- Step 1: Remove NOT NULL constraint from college_educator_id
-- This allows the column to be null for external educators
ALTER TABLE "public"."college_assignments"
ALTER COLUMN "college_educator_id" DROP NOT NULL;

-- Step 2: Add new column for external educators (nullable, will only be set for org staff)
ALTER TABLE "public"."college_assignments"
ADD COLUMN "external_educator_id" "uuid";

-- Step 3: Add foreign key constraint to users table
-- This works for both college_lecturers and organization_staff since both have user_id in users table
ALTER TABLE "public"."college_assignments"
ADD CONSTRAINT "college_assignments_external_educator_id_fkey" 
FOREIGN KEY ("external_educator_id") 
REFERENCES "public"."users"("id") 
ON DELETE SET NULL;

-- Step 4: Add check constraint to ensure data integrity
-- Rule: Exactly ONE of college_educator_id OR external_educator_id must be set (not both, not neither)
ALTER TABLE "public"."college_assignments"
ADD CONSTRAINT "college_assignments_educator_check" 
CHECK (
  -- Either internal faculty (college_educator_id set, external null)
  (college_educator_id IS NOT NULL AND external_educator_id IS NULL) 
  OR
  -- Or external staff (external_educator_id set, college null)
  (college_educator_id IS NULL AND external_educator_id IS NOT NULL)
);

-- Step 5: Add documentation comments
COMMENT ON COLUMN "public"."college_assignments"."college_educator_id" IS
'Foreign key to college_lecturers.user_id for internal faculty. Can be null for external educators. Mutually exclusive with external_educator_id.';

COMMENT ON COLUMN "public"."college_assignments"."external_educator_id" IS 
'Foreign key to users.id for external educators (organization_staff). Mutually exclusive with college_educator_id. Either college_educator_id (internal faculty) OR external_educator_id (external staff) must be set, but not both.';

COMMENT ON CONSTRAINT "college_assignments_educator_check" ON "public"."college_assignments" IS
'Data integrity constraint: Ensures exactly one educator type is set - either internal faculty (college_educator_id) or external staff (external_educator_id), but never both or neither.';

-- ============================================================================
-- Impact Analysis:
-- ============================================================================
-- ✅ Existing college_lecturer assignments: NO CHANGE
--    - college_educator_id remains populated with their user_id
--    - external_educator_id will be null
--    - All existing queries work as-is
--
-- ✅ New external educator assignments: NEW FUNCTIONALITY
--    - college_educator_id will be null (NOW ALLOWED)
--    - external_educator_id will contain their user_id
--    - Can now create assignments without NOT NULL constraint violation
--
-- ⚠️  Required code changes after migration:
--    1. Update create-assignment to populate external_educator_id for org staff ✅
--    2. Update get-educator-assignments to check BOTH columns ✅
--    3. Update get-assignment-stats to include external_educator_id ✅
-- ============================================================================
