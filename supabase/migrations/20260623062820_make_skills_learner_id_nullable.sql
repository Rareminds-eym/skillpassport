-- ============================================================================
-- Migration: Make learner_id nullable for curriculum skills
-- Date: 2026-06-23 06:28:20
-- Purpose: Allow storing occupation/curriculum skills without learner_id
--          Learner-specific skills will have learner_id
--          Curriculum skills can have NULL learner_id
-- ============================================================================

-- Drop the existing foreign key constraint
ALTER TABLE public.skills DROP CONSTRAINT skills_learner_id_fkey;

-- Make learner_id nullable
ALTER TABLE public.skills ALTER COLUMN learner_id DROP NOT NULL;

-- Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.skills
ADD CONSTRAINT skills_learner_id_fkey
FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN public.skills.learner_id IS
'Foreign key to learners. NULL for curriculum/occupation skills, non-NULL for learner-specific skills.';
