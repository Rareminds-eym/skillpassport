-- Two-Tier Training Approval System Setup
-- approval_status column already exists, only add approval_authority

-- Check if approval_status column exists and add constraints if missing
DO $$ 
BEGIN
    -- approval_status already exists, just ensure constraints are in place
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'trainings' 
        AND constraint_name = 'trainings_approval_status_check'
    ) THEN
        ALTER TABLE public.trainings 
        ADD CONSTRAINT trainings_approval_status_check 
        CHECK (approval_status IN ('pending', 'approved', 'rejected'));
        
        RAISE NOTICE 'Added approval_status constraint to trainings table';
    ELSE
        RAISE NOTICE 'approval_status constraint already exists';
    END IF;
    
    -- Create index for approval_status if not exists
    CREATE INDEX IF NOT EXISTS idx_trainings_approval_status 
    ON public.trainings (approval_status);
    
    RAISE NOTICE 'approval_status column already exists - skipping creation';
END $$;

-- Check if approval_authority column exists, if not add it
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
        
        RAISE NOTICE 'Added approval_authority column to trainings table';
    ELSE
        RAISE NOTICE 'approval_authority column already exists in trainings table';
    END IF;
END $$;

-- Note: approval_status column already exists with default 'pending'
-- Only need to set approval_authority for existing trainings

-- Set approval authority based on organization for existing trainings
UPDATE public.trainings 
SET approval_authority = CASE 
    WHEN LOWER(organization) = 'rareminds' THEN 'school_admin'
    ELSE 'rareminds_admin'
END
WHERE approval_authority IS NULL OR approval_authority = 'rareminds_admin';

-- Create a function to get approved trainings for a student
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT t.*
    FROM public.trainings t
    JOIN public.students s ON t.student_id = s.id
    WHERE s.email = student_email 
    AND t.approval_status = 'approved';
END;
$$;

-- Create a function to get pending trainings for school admin approval
CREATE OR REPLACE FUNCTION get_pending_school_trainings(school_id uuid)
RETURNS TABLE (
    id uuid,
    student_id uuid,
    student_name text,
    student_email text,
    title character varying(150),
    organization character varying(150),
    start_date date,
    end_date date,
    description text,
    approval_status character varying(20),
    approval_authority character varying(20),
    created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.student_id,
        s.name as student_name,
        s.email as student_email,
        t.title,
        t.organization,
        t.start_date,
        t.end_date,
        t.description,
        t.approval_status,
        t.approval_authority,
        t.created_at
    FROM public.trainings t
    JOIN public.students s ON t.student_id = s.id
    WHERE s.school_id = school_id
    AND t.approval_status = 'pending'
    AND t.approval_authority = 'school_admin'
    ORDER BY t.created_at DESC;
END;
$$;

-- Create a function to get pending trainings for Rareminds admin approval
CREATE OR REPLACE FUNCTION get_pending_rareminds_trainings()
RETURNS TABLE (
    id uuid,
    student_id uuid,
    student_name text,
    student_email text,
    school_name text,
    title character varying(150),
    organization character varying(150),
    start_date date,
    end_date date,
    description text,
    approval_status character varying(20),
    approval_authority character varying(20),
    created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.student_id,
        s.name as student_name,
        s.email as student_email,
        sch.name as school_name,
        t.title,
        t.organization,
        t.start_date,
        t.end_date,
        t.description,
        t.approval_status,
        t.approval_authority,
        t.created_at
    FROM public.trainings t
    JOIN public.students s ON t.student_id = s.id
    LEFT JOIN public.schools sch ON s.school_id = sch.id
    WHERE t.approval_status = 'pending'
    AND t.approval_authority = 'rareminds_admin'
    ORDER BY t.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_approved_trainings_for_student(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_school_trainings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_rareminds_trainings() TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_approved_trainings_for_student(text) IS 'Returns only approved trainings for a student by email';
COMMENT ON FUNCTION get_pending_school_trainings(uuid) IS 'Returns pending Rareminds trainings for school admin approval';
COMMENT ON FUNCTION get_pending_rareminds_trainings() IS 'Returns pending external trainings for Rareminds admin approval';