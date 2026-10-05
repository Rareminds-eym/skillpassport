BEGIN;

-- Allow the same program name/code in one department when specializations differ
-- (e.g. MCA general vs MCA hr,marketing). Uniqueness moves from
-- (department_id, code) to (department_id, code, specializations).
-- specializations is normalized to a sorted text[] in save-program so
-- "hr, marketing" and "marketing, hr" compare as the same set.

-- First, identify and handle any duplicate rows before adding the constraint
-- Keep the oldest record (by created_at) for each duplicate group
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY department_id, code, specializations 
      ORDER BY created_at ASC
    ) as rn
  FROM programs
)
DELETE FROM programs 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now drop the old constraint and add the new one
ALTER TABLE "public"."programs"
  DROP CONSTRAINT IF EXISTS "programs_department_id_code_key";

ALTER TABLE "public"."programs"
  ADD CONSTRAINT "programs_department_code_specs_key"
  UNIQUE ("department_id", "code", "specializations");

COMMIT;
