-- Migration: Add school_name column to learners table
-- Purpose: Separate custom school names from custom college names
-- Currently both are stored in college_school_name which causes ambiguity

ALTER TABLE public.learners 
ADD COLUMN IF NOT EXISTS school_name character varying(150);
CREATE INDEX IF NOT EXISTS idx_learners_school_name ON public.learners(school_name);