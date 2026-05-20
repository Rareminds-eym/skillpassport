-- Migration: Add 'general' to grade_level CHECK constraint on personal_assessment_sections
-- Description: Allows shared sections (like RIASEC) that apply to multiple grade levels
--              without duplicating rows per grade level.
-- Date: 2026-05-20

-- Drop the old constraint
ALTER TABLE "public"."personal_assessment_sections"
  DROP CONSTRAINT IF EXISTS "personal_assessment_sections_grade_level_check";

-- Re-add with 'general' included
ALTER TABLE "public"."personal_assessment_sections"
  ADD CONSTRAINT "personal_assessment_sections_grade_level_check"
  CHECK (grade_level = ANY (ARRAY[
    'middle'::text,
    'highschool'::text,
    'higher_secondary'::text,
    'after10'::text,
    'after12'::text,
    'college'::text,
    'general'::text
  ]));
