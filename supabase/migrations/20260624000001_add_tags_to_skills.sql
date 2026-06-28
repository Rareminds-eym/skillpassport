-- ============================================================================
-- Migration: Add tags column to skills table
-- Date: 2026-06-24
-- Purpose: Store skill metadata tags (JSONB array format)
-- Table: public.skills
-- ============================================================================

-- Add tags column as JSONB array
-- Default: empty array
-- Example: ["documentation", "quality-assurance", "production"]
ALTER TABLE public.skills
ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN public.skills.tags IS
'JSONB array of tags for skill categorization and metadata. Examples: "documentation", "quality-assurance", "production", "communication", "technical-config", etc.';

-- Create GIN index for efficient tag searching
CREATE INDEX idx_skills_tags ON public.skills USING GIN (tags);
