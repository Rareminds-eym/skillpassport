-- ✅ FINAL: Two-Tier Training Approval System Setup
-- This script only adds what's missing (approval_status already exists)

-- 1. Add approval_authority column (the only missing piece)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trainings' 
        AND column_name = 'approval_authority'
    ) THEN
        ALTER TABLE public.trainings 
        ADD COLUMN approval_authority character varying(20) DEFAULT 'rareminds_admin';
        
        -- Add check constraint for approval_authority
        ALTER TABLE public.trainings 
        ADD CONSTRAINT trainings_approval_authority_check 
        CHECK (approval_authority IN ('school_admin', 'rareminds_admin'));
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_trainings_approval_authority 
        ON public.trainings (approval_authority);
        
        RAISE NOTICE '✅ Added approval_authority column to trainings table';
    ELSE
        RAISE NOTICE '✅ approval_authority column already exists';
    END IF;
END $$;

-- 2. Set approval authority based on organization for existing trainings
UPDATE public.trainings 
SET approval_authority = CASE 
    WHEN LOWER(organization) = 'rareminds' THEN 'school_admin'
    ELSE 'rareminds_admin'
END
WHERE approval_authority IS NULL OR approval_authority = 'rareminds_admin';

-- 3. Create admin functions for approval workflows

-- Function: Get approved trainings for student profile
CREATE OR REPLACE FUNCTION get_approved_trainings_for_student(student_email text)
RETURNS TABLE (
    id uuid,
    student_id uuid,
    title character varying(150),
    organization character varying(150),
    start_date date,
    end_date date,
    duration character varying(100),
    description text,
    status text,
    completed_modules integer,
    total_modules integer,
    hours_spent integer,
    course_id uuid,
    source character varying(50),
    approval_status character varying(20),
    approval_authority character varying(20),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT t.* FROM public.trainings t
    JOIN public.students s ON t.student_id = s.id
    WHERE s.email = student_email AND t.approval_status = 'approved';
END;
$$;

-- Function: Get pending Rareminds trainings for school admin
CREATE OR REPLACE FUNCTION get_pending_school_trainings(school_id uuid)
RETURNS TABLE (
    id uuid, student_id uuid, student_name text, student_email text,
    title character varying(150), organization character varying(150),
    start_date date, end_date date, description text,
    approval_status character varying(20), approval_authority character varying(20),
    created_at timestamp with time zone
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.student_id, s.name, s.email, t.title, t.organization,
           t.start_date, t.end_date, t.description, t.approval_status, 
           t.approval_authority, t.created_at
    FROM public.trainings t
    JOIN public.students s ON t.student_id = s.id
    WHERE s.school_id = school_id 
    AND t.approval_status = 'pending' 
    AND t.approval_authority = 'school_admin'
    ORDER BY t.created_at DESC;
END;
$$;

-- Function: Get pending external trainings for Rareminds admin
CREATE OR REPLACE FUNCTION get_pending_rareminds_trainings()
RETURNS TABLE (
    id uuid, student_id uuid, student_name text, student_email text, school_name text,
    title character varying(150), organization character varying(150),
    start_date date, end_date date, description text,
    approval_status character varying(20), approval_authority character varying(20),
    created_at timestamp with time zone
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.student_id, s.name, s.email, sch.name,
           t.title, t.organization, t.start_date, t.end_date, t.description,
           t.approval_status, t.approval_authority, t.created_at
    FROM public.trainings t
    JOIN public.students s ON t.student_id = s.id
    LEFT JOIN public.schools sch ON s.school_id = sch.id
    WHERE t.approval_status = 'pending' 
    AND t.approval_authority = 'rareminds_admin'
    ORDER BY t.created_at DESC;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_approved_trainings_for_student(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_school_trainings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_rareminds_trainings() TO authenticated;

-- 5. Add helpful comments
COMMENT ON FUNCTION get_approved_trainings_for_student(text) IS 'Returns only approved trainings for student profile display';
COMMENT ON FUNCTION get_pending_school_trainings(uuid) IS 'Returns pending Rareminds trainings for school admin approval';
COMMENT ON FUNCTION get_pending_rareminds_trainings() IS 'Returns pending external trainings for Rareminds admin approval';

-- ✅ SETUP COMPLETE!
-- approval_status: already existed ✅
-- approval_authority: added ✅  
-- Admin functions: created ✅
-- Two-tier routing: ready ✅