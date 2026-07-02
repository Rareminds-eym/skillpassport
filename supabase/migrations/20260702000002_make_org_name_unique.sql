-- Migration: Make organization name unique
-- Ensures that no two organizations can have the same name
-- Date: 2026-07-02

-- Add unique constraint on organization name (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS organizations_name_unique_idx 
    ON public.organizations (LOWER(name)) 
    WHERE name IS NOT NULL;

COMMENT ON INDEX organizations_name_unique_idx IS 
    'Ensures organization names are unique (case-insensitive). NULL names are allowed during onboarding.';
