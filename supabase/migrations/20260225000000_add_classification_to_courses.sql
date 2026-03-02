-- Migration: Add classification enum and column to courses table
-- Created: 2026-02-25

-- Step 1: Create the enum type
CREATE TYPE public.classification AS ENUM (
    'middle_school',
    'high_school',
    'higher_secondary',
    'college'
);

-- Step 2: Add the classification column to courses table
ALTER TABLE public.courses
ADD COLUMN classification public.classification NULL;

-- Step 3: Create an index on the classification column for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_classification
ON public.courses USING btree (classification)
TABLESPACE pg_default;
