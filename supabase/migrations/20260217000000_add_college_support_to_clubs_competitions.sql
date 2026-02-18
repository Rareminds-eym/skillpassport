-- Migration: Add college support to clubs and competitions tables
-- This allows both schools and colleges to use the same tables

-- ============================================
-- 1. ADD college_id COLUMN TO clubs TABLE
-- ============================================

ALTER TABLE public.clubs 
ADD COLUMN college_id uuid REFERENCES public.organizations(id);

-- Make school_id optional (since colleges won't have school_id)
ALTER TABLE public.clubs 
ALTER COLUMN school_id DROP NOT NULL;

-- Add constraint: must have either school_id OR college_id (not both, not neither)
ALTER TABLE public.clubs
ADD CONSTRAINT check_club_institution 
CHECK (
    (school_id IS NOT NULL AND college_id IS NULL) OR 
    (school_id IS NULL AND college_id IS NOT NULL)
);

-- Add index for faster college queries
CREATE INDEX idx_clubs_college_id ON public.clubs(college_id) WHERE college_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.clubs.college_id IS 'Reference to college organization (mutually exclusive with school_id)';


-- ============================================
-- 2. ADD college_id COLUMN TO competitions TABLE
-- ============================================

ALTER TABLE public.competitions 
ADD COLUMN college_id uuid REFERENCES public.organizations(id);

-- Make school_id optional
ALTER TABLE public.competitions 
ALTER COLUMN school_id DROP NOT NULL;

-- Add constraint: must have either school_id OR college_id
ALTER TABLE public.competitions
ADD CONSTRAINT check_competition_institution 
CHECK (
    (school_id IS NOT NULL AND college_id IS NULL) OR 
    (school_id IS NULL AND college_id IS NOT NULL)
);

-- Add index for faster college queries
CREATE INDEX idx_competitions_college_id ON public.competitions(college_id) WHERE college_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.competitions.college_id IS 'Reference to college organization (mutually exclusive with school_id)';


-- ============================================
-- 3. UPDATE EXISTING VIEWS (if any reference these tables)
-- ============================================

-- Drop and recreate competition_performance_report view to include college_id
DROP VIEW IF EXISTS public.competition_performance_report;

CREATE OR REPLACE VIEW public.competition_performance_report AS
SELECT 
    comp.comp_id,
    comp.school_id,
    comp.college_id,
    comp.name AS competition_name,
    comp.level,
    comp.competition_date,
    comp.status,
    COUNT(DISTINCT cr.student_email) AS total_participants,
    COUNT(DISTINCT CASE WHEN cr.rank <= 3 THEN cr.student_email END) AS top_performers,
    AVG(cr.score) AS average_score
FROM public.competitions comp
LEFT JOIN public.competition_results cr ON comp.comp_id = cr.comp_id
GROUP BY comp.comp_id, comp.school_id, comp.college_id, comp.name, comp.level, comp.competition_date, comp.status;

COMMENT ON VIEW public.competition_performance_report IS 'Performance metrics for competitions (supports both schools and colleges)';


-- ============================================
-- 4. UPDATE RLS POLICIES (if needed)
-- ============================================

-- Note: Add RLS policies here if your tables have Row Level Security enabled
-- Example for clubs table:

-- DROP POLICY IF EXISTS "Users can view clubs in their institution" ON public.clubs;
-- CREATE POLICY "Users can view clubs in their institution" ON public.clubs
--     FOR SELECT
--     USING (
--         school_id IN (
--             SELECT school_id FROM public.school_educators WHERE user_id = auth.uid()
--         )
--         OR
--         college_id IN (
--             SELECT "collegeId" FROM public.college_lecturers WHERE user_id = auth.uid()
--         )
--     );


-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Verify the changes (run these manually to check)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'clubs' AND column_name IN ('school_id', 'college_id');

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'competitions' AND column_name IN ('school_id', 'college_id');
