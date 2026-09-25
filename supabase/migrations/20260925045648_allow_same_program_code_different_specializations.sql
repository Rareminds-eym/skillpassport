BEGIN;

-- Allow the same program name/code in one department when specializations differ
-- (e.g. MCA general vs MCA hr,marketing). Uniqueness moves from
-- (department_id, code) to (department_id, code, specializations).
-- specializations is normalized to a sorted text[] in save-program so
-- "hr, marketing" and "marketing, hr" compare as the same set.

ALTER TABLE "public"."programs"
  DROP CONSTRAINT IF EXISTS "programs_department_id_code_key";

ALTER TABLE "public"."programs"
  ADD CONSTRAINT "programs_department_code_specs_key"
  UNIQUE ("department_id", "code", "specializations");

COMMIT;
