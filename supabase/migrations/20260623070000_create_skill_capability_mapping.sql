-- ============================================================================
-- Migration: Create skill_capability_mapping junction table
-- Date: 2026-06-23
-- Purpose: Map skills to capabilities (M:N relationship)
--          Allows one skill to be used in multiple capabilities
--          Normalizes the data (no skill duplication)
-- ============================================================================

-- Create junction table for skill-capability mapping
CREATE TABLE IF NOT EXISTS public.skill_capability_mapping (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id      UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES public.capability_master(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_skill_capability UNIQUE(skill_id, capability_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_skill_capability_mapping_skill_id ON public.skill_capability_mapping(skill_id);
CREATE INDEX idx_skill_capability_mapping_capability_id ON public.skill_capability_mapping(capability_id);

-- Add comments
COMMENT ON TABLE public.skill_capability_mapping IS
'Junction table mapping skills to capabilities. Allows one skill to be associated with multiple capabilities without duplication.';

COMMENT ON COLUMN public.skill_capability_mapping.skill_id IS
'Foreign key to skills. The skill being mapped.';

COMMENT ON COLUMN public.skill_capability_mapping.capability_id IS
'Foreign key to capability_master. The capability that uses this skill.';
