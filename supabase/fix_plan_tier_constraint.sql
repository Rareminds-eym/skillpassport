-- Fix plan_tier check constraint issue

-- First, check what constraints exist on the table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.organization_recruitment_settings'::regclass
AND contype = 'c'; -- check constraints

-- Drop the existing check constraint if it exists
ALTER TABLE public.organization_recruitment_settings 
DROP CONSTRAINT IF EXISTS organization_recruitment_settings_plan_tier_check;

-- Add a new check constraint that allows 'free', 'basic', 'pro', 'enterprise'
ALTER TABLE public.organization_recruitment_settings
ADD CONSTRAINT organization_recruitment_settings_plan_tier_check
CHECK (plan_tier IN ('free', 'basic', 'pro', 'enterprise'));

-- Verify the constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.organization_recruitment_settings'::regclass
AND contype = 'c';

SELECT '✓ Plan tier constraint fixed!' as result;
