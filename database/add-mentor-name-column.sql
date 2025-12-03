-- Add mentor_name column to clubs table
-- This allows storing mentor names even when they're not in the system

ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS mentor_name VARCHAR(255);

COMMENT ON COLUMN public.clubs.mentor_name IS 'Optional mentor name for display purposes, used when mentor is not linked to educator or school record';

-- Update existing clubs to populate mentor_name from linked records
UPDATE public.clubs c
SET mentor_name = CASE
    WHEN c.mentor_type = 'educator' THEN (
        SELECT COALESCE(se.name, se.email)
        FROM public.school_educators se
        WHERE se.id = c.mentor_educator_id
    )
    WHEN c.mentor_type = 'school' THEN (
        SELECT COALESCE(s.principal_name, s.name)
        FROM public.schools s
        WHERE s.id = c.mentor_school_id
    )
    ELSE NULL
END
WHERE c.mentor_name IS NULL;

-- Verify the update
SELECT 
    club_id,
    name,
    mentor_type,
    mentor_name,
    CASE 
        WHEN mentor_name IS NOT NULL THEN '✅ Has mentor name'
        ELSE '⚠️ No mentor name'
    END as status
FROM public.clubs
ORDER BY created_at DESC
LIMIT 10;
