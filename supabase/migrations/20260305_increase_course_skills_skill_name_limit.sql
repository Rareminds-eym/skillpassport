-- Migration: Increase skill_name character limit in course_skills table
-- Created: 2026-03-04
-- Description: Increase skill_name from 100 to 255 characters to accommodate longer skill names

-- Drop dependent view
DROP VIEW IF EXISTS course_summary CASCADE;

-- Alter the column
ALTER TABLE public.course_skills
ALTER COLUMN skill_name TYPE character varying(255);

-- Recreate the view if it existed
-- Note: The view will be recreated by subsequent migrations or application code if needed
