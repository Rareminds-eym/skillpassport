-- ============================================================================
-- CURRICULUM APPROVAL WORKFLOW - COMPLETE IMPLEMENTATION
-- ============================================================================
-- Purpose: Implements curriculum approval workflow for affiliated colleges
-- Features: Request approval, university admin approval, auto-publishing
-- Uses: organizations, university_colleges, users, curriculum_courses tables
-- ============================================================================

-- ============================================================================
-- SECTION 1: REUSE EXISTING STATUS COLUMN (No Duplicate approval_status)
-- ============================================================================

-- Check if status column already has the required values, if not, update the constraint
DO $$
BEGIN
    -- First, check if the status column exists and what constraint it has
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_curriculums' 
        AND column_name = 'status'
    ) THEN
        -- Drop existing constraint if it exists
        ALTER TABLE college_curriculums DROP CONSTRAINT IF EXISTS college_curriculums_status_check;
        
        -- Add updated constraint that includes approval workflow states
        ALTER TABLE college_curriculums 
        ADD CONSTRAINT college_curriculums_status_check 
        CHECK (status IN ('draft', 'submitted', 'pending_approval', 'approved', 'published', 'archived', 'rejected'));
        
        RAISE NOTICE '✅ Updated existing status column constraint to include approval workflow states';
    ELSE
        -- If status column doesn't exist, create it
        ALTER TABLE college_curriculums 
        ADD COLUMN status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'submitted', 'pending_approval', 'approved', 'published', 'archived', 'rejected'));
        
        RAISE NOTICE '✅ Created status column with approval workflow states';
    END IF;
END $$;

-- DO NOT add approval_status column - reuse existing status column

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS request_date TIMESTAMP;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS request_message TEXT;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS review_date TIMESTAMP;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS review_notes TEXT;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS published_date TIMESTAMP;

-- Update existing records to set university_id based on college affiliation
UPDATE college_curriculums 
SET university_id = (
    SELECT uc.university_id 
    FROM university_colleges uc 
    WHERE uc.college_id = college_curriculums.college_id
    AND uc.account_status = 'active'
    LIMIT 1
)
WHERE university_id IS NULL;

-- Add constraint to prevent multiple active affiliations (if desired)
-- Uncomment the following line if you want to enforce single university per college:
-- ALTER TABLE university_colleges ADD CONSTRAINT unique_active_college_affiliation 
--     EXCLUDE (college_id WITH =) WHERE (account_status = 'active');

-- ============================================================================
-- SECTION 2: HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a college is affiliated with a university
CREATE OR REPLACE FUNCTION check_college_affiliation_status(
    p_college_id UUID,
    p_university_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- If university_id is provided, check specific affiliation
    IF p_university_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM university_colleges 
            WHERE college_id = p_college_id 
            AND university_id = p_university_id
            AND account_status = 'active'
        );
    END IF;
    
    -- Otherwise, check if college is affiliated with any university
    RETURN EXISTS (
        SELECT 1 FROM university_colleges 
        WHERE college_id = p_college_id 
        AND account_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get university admins for a specific university
CREATE OR REPLACE FUNCTION get_university_admins(p_university_id UUID)
RETURNS TABLE(id UUID, email TEXT, full_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, CONCAT(u."firstName", ' ', u."lastName") as full_name
    FROM users u
    WHERE u."organizationId" = p_university_id
    AND u.role = 'university_admin'
    AND u.account_status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 3: MAIN WORKFLOW FUNCTIONS
-- ============================================================================

-- Function to check college affiliation for current user
CREATE OR REPLACE FUNCTION check_college_affiliation()
RETURNS TABLE(
    is_affiliated BOOLEAN,
    college_id UUID,
    university_id UUID,
    university_name TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_college_id UUID;
    v_university_id UUID;
    v_university_name TEXT;
    v_is_affiliated BOOLEAN := FALSE;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Get college_id from user
    SELECT u."organizationId" INTO v_college_id
    FROM users u
    WHERE u.id = v_user_id;
    
    IF v_college_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Check if college is affiliated with a university
    SELECT uc.university_id, o.name INTO v_university_id, v_university_name
    FROM university_colleges uc
    JOIN organizations o ON o.id = uc.university_id
    WHERE uc.college_id = v_college_id
    AND uc.account_status = 'active'
    LIMIT 1;
    
    v_is_affiliated := (v_university_id IS NOT NULL);
    
    RETURN QUERY SELECT v_is_affiliated, v_college_id, v_university_id, v_university_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit curriculum for approval
CREATE OR REPLACE FUNCTION submit_curriculum_for_approval(
    p_curriculum_id UUID,
    p_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_college_info RECORD;
    v_college_name TEXT;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Get college affiliation info
    SELECT * INTO v_college_info FROM check_college_affiliation() LIMIT 1;
    
    -- Check if college is affiliated
    IF NOT v_college_info.is_affiliated THEN
        RAISE EXCEPTION 'College is not affiliated with any university';
    END IF;
    
    -- Get college name from organizations table
    SELECT name INTO v_college_name
    FROM organizations 
    WHERE id = v_college_info.college_id;
    
    -- Update curriculum status (using existing status column)
    UPDATE college_curriculums 
    SET 
        status = 'pending_approval',  -- Use existing status column
        requested_by = v_user_id,
        request_date = NOW(),
        request_message = p_message,
        university_id = v_college_info.university_id
    WHERE id = p_curriculum_id
    AND college_id = v_college_info.college_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Curriculum not found or access denied';
    END IF;
    
    -- Create notifications for university admins (only if notifications table exists)
    IF to_regclass('public.notifications') IS NOT NULL THEN
        INSERT INTO notifications (
            recipient_id,
            title,
            message,
            type,
            metadata
        )
        SELECT 
            ua.id,
            'New Curriculum Approval Request',
            'A new curriculum approval request has been submitted by ' || COALESCE(v_college_name, 'Unknown College'),
            'curriculum_approval_request',
            jsonb_build_object(
                'curriculum_id', p_curriculum_id,
                'college_id', v_college_info.college_id,
                'university_id', v_college_info.university_id,
                'requested_by_email', (SELECT email FROM users WHERE id = v_user_id)
            )
        FROM get_university_admins(v_college_info.university_id) ua;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to review curriculum (approve/reject)
CREATE OR REPLACE FUNCTION review_curriculum(
    p_curriculum_id UUID,
    p_decision TEXT, -- 'approved' or 'rejected'
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_curriculum RECORD;
    v_new_status TEXT;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Validate decision
    IF p_decision NOT IN ('approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid decision. Must be approved or rejected';
    END IF;
    
    -- Get curriculum info (using existing status column)
    SELECT * INTO v_curriculum
    FROM college_curriculums 
    WHERE id = p_curriculum_id
    AND status = 'pending_approval';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Curriculum not found or not pending approval';
    END IF;
    
    -- Check if user is university admin for this curriculum
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = v_user_id 
        AND role = 'university_admin'
        AND "organizationId" = v_curriculum.university_id
    ) THEN
        RAISE EXCEPTION 'Access denied. University admin role required';
    END IF;
    
    -- Set new status (auto-publish on approval, no intermediate 'approved' status)
    v_new_status := CASE 
        WHEN p_decision = 'approved' THEN 'published'  -- Auto-publish on approval
        ELSE 'rejected'
    END;
    
    -- Update curriculum (using existing status column)
    UPDATE college_curriculums 
    SET 
        status = v_new_status,  -- Use existing status column
        reviewed_by = v_user_id,
        review_date = NOW(),
        review_notes = p_notes,
        published_date = CASE WHEN p_decision = 'approved' THEN NOW() ELSE NULL END
    WHERE id = p_curriculum_id;
    
    -- Create notification for requester (only if notifications table exists)
    IF to_regclass('public.notifications') IS NOT NULL THEN
        INSERT INTO notifications (
            recipient_id,
            title,
            message,
            type,
            metadata
        )
        VALUES (
            v_curriculum.requested_by,
            CASE 
                WHEN p_decision = 'approved' THEN 'Curriculum Approved and Published'
                ELSE 'Curriculum Approval Rejected'
            END,
            CASE 
                WHEN p_decision = 'approved' THEN 'Your curriculum has been approved and is now published'
                ELSE 'Your curriculum approval request has been rejected. Please review the feedback and resubmit.'
            END,
            CASE 
                WHEN p_decision = 'approved' THEN 'curriculum_approved'
                ELSE 'curriculum_rejected'
            END,
            jsonb_build_object(
                'curriculum_id', p_curriculum_id,
                'decision', p_decision,
                'notes', p_notes,
                'reviewer_id', v_user_id
            )
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on college_curriculums if not already enabled
ALTER TABLE college_curriculums ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "College admins can view their curriculum" ON college_curriculums;
DROP POLICY IF EXISTS "University admins can view affiliated college curriculum" ON college_curriculums;
DROP POLICY IF EXISTS "College admins can update their curriculum" ON college_curriculums;
DROP POLICY IF EXISTS "University admins can update curriculum for approval" ON college_curriculums;

-- College admins can view their curriculum (with proper role check)
CREATE POLICY "College admins can view their curriculum" ON college_curriculums
    FOR SELECT USING (
        college_id IN (
            SELECT "organizationId" FROM users 
            WHERE id = auth.uid() AND role = 'college_admin'
        )
    );

-- University admins can view affiliated college curriculum
CREATE POLICY "University admins can view affiliated college curriculum" ON college_curriculums
    FOR SELECT USING (
        university_id IN (
            SELECT "organizationId" FROM users 
            WHERE id = auth.uid() AND role = 'university_admin'
        )
    );

-- College admins can update their curriculum (with proper role check)
CREATE POLICY "College admins can update their curriculum" ON college_curriculums
    FOR UPDATE USING (
        college_id IN (
            SELECT "organizationId" FROM users 
            WHERE id = auth.uid() AND role = 'college_admin'
        )
    );

-- University admins can update curriculum for approval (with proper role check)
CREATE POLICY "University admins can update curriculum for approval" ON college_curriculums
    FOR UPDATE USING (
        university_id IN (
            SELECT "organizationId" FROM users 
            WHERE id = auth.uid() AND role = 'university_admin'
        )
        AND status IN ('pending_approval', 'rejected')  -- Use existing status column
    );

-- ============================================================================
-- SECTION 5: VIEWS FOR DASHBOARD AND STATUS
-- ============================================================================

-- View for curriculum approval dashboard (University Admin)
CREATE OR REPLACE VIEW curriculum_approval_dashboard AS
SELECT 
    c.id as curriculum_id,
    c.academic_year,
    c.status,  -- Use existing status column
    c.request_date,
    c.request_message,
    c.review_date,
    c.review_notes,
    c.published_date,
    
    -- Course details (from college_courses via college_course_mappings)
    cc.course_name as course_name,
    cc.course_code as course_code,
    cm.semester,
    
    -- College details
    college_org.name as college_name,
    college_org.id as college_id,
    
    -- University details
    univ_org.name as university_name,
    univ_org.id as university_id,
    
    -- Requester details
    requester.email as requester_email,
    CONCAT(requester."firstName", ' ', requester."lastName") as requester_name,
    
    -- Reviewer details
    reviewer.email as reviewer_email,
    CONCAT(reviewer."firstName", ' ', reviewer."lastName") as reviewer_name,
    
    -- Department and Program details
    dept.name as department_name,
    prog.name as program_name
    
FROM college_curriculums c
LEFT JOIN college_course_mappings cm ON cm.id = c.course_id
LEFT JOIN college_courses cc ON cc.id = cm.course_id
LEFT JOIN organizations college_org ON college_org.id = c.college_id
LEFT JOIN organizations univ_org ON univ_org.id = c.university_id
LEFT JOIN users requester ON requester.id = c.requested_by
LEFT JOIN users reviewer ON reviewer.id = c.reviewed_by
LEFT JOIN departments dept ON dept.id = c.department_id
LEFT JOIN programs prog ON prog.id = c.program_id
WHERE c.status IN ('pending_approval', 'rejected', 'published');

-- View for college curriculum status (College Admin)
CREATE OR REPLACE VIEW college_curriculum_status AS
SELECT 
    c.id as curriculum_id,
    c.academic_year,
    c.status,  -- Use existing status column
    c.request_date,
    c.request_message,
    c.review_date,
    c.review_notes,
    c.published_date,
    
    -- Course details (from college_courses via college_course_mappings)
    cc.course_name as course_name,
    cc.course_code as course_code,
    cm.semester,
    
    -- Affiliation info
    CASE 
        WHEN uc.university_id IS NOT NULL THEN TRUE 
        ELSE FALSE 
    END as is_affiliated,
    
    uc.university_id,
    univ_org.name as university_name,
    
    -- Department and Program details
    dept.name as department_name,
    prog.name as program_name
    
FROM college_curriculums c
LEFT JOIN college_course_mappings cm ON cm.id = c.course_id
LEFT JOIN college_courses cc ON cc.id = cm.course_id
LEFT JOIN university_colleges uc ON uc.college_id = c.college_id AND uc.account_status = 'active'
LEFT JOIN organizations univ_org ON univ_org.id = uc.university_id
LEFT JOIN departments dept ON dept.id = c.department_id
LEFT JOIN programs prog ON prog.id = c.program_id;

-- ============================================================================
-- SECTION 6: TRIGGERS FOR AUTO-UPDATES
-- ============================================================================

-- Function to auto-set university_id when curriculum is created
CREATE OR REPLACE FUNCTION auto_set_university_id()
RETURNS TRIGGER AS $$
DECLARE
    v_university_id UUID;
BEGIN
    -- Get university_id for the college
    SELECT uc.university_id INTO v_university_id
    FROM university_colleges uc
    WHERE uc.college_id = NEW.college_id
    AND uc.account_status = 'active'
    LIMIT 1;
    
    -- Set university_id if college is affiliated
    IF v_university_id IS NOT NULL THEN
        NEW.university_id := v_university_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-setting university_id
DROP TRIGGER IF EXISTS trigger_auto_set_university_id ON college_curriculums;
CREATE TRIGGER trigger_auto_set_university_id
    BEFORE INSERT OR UPDATE ON college_curriculums
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_university_id();

-- ============================================================================
-- SECTION 7: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_college_curriculums_status ON college_curriculums(status);  -- Use existing status column
CREATE INDEX IF NOT EXISTS idx_college_curriculums_university_id ON college_curriculums(university_id);
CREATE INDEX IF NOT EXISTS idx_college_curriculums_college_id ON college_curriculums(college_id);
CREATE INDEX IF NOT EXISTS idx_college_curriculums_course_id ON college_curriculums(course_id);
CREATE INDEX IF NOT EXISTS idx_college_curriculums_requested_by ON college_curriculums(requested_by);
CREATE INDEX IF NOT EXISTS idx_college_curriculums_reviewed_by ON college_curriculums(reviewed_by);

-- Critical index for university_colleges table - frequently queried for affiliation checks
CREATE INDEX IF NOT EXISTS idx_univ_colleges_college ON university_colleges(college_id);
CREATE INDEX IF NOT EXISTS idx_university_colleges_college_university ON university_colleges(college_id, university_id);

-- ============================================================================
-- SECTION 8: FIX DUPLICATE TRIGGERS (Bug Fix)
-- ============================================================================

-- Remove any duplicate triggers that might exist
DROP TRIGGER IF EXISTS update_univ_colleges_updated_at ON university_colleges;
DROP TRIGGER IF EXISTS update_university_colleges_updated_at ON university_colleges;

-- Only create trigger if updated_at column exists and function doesn't already exist globally
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'university_colleges' 
        AND column_name = 'updated_at'
    ) THEN
        -- Only create function if it doesn't exist globally
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $trigger$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $trigger$ LANGUAGE plpgsql;
        END IF;
        
        -- Create the single trigger
        CREATE TRIGGER update_university_colleges_updated_at
            BEFORE UPDATE ON university_colleges
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Created single updated_at trigger for university_colleges table';
    ELSE
        RAISE NOTICE 'No updated_at column found in university_colleges table - skipping trigger creation';
    END IF;
END $$;

-- ============================================================================
-- SECTION 9: SAMPLE DATA AND TESTING
-- ============================================================================

-- Insert sample approval workflow data (for testing)
-- This will be commented out in production

/*
-- Sample: Update a curriculum to pending approval
UPDATE college_curriculums 
SET 
    approval_status = 'pending_approval',
    requested_by = (SELECT id FROM users WHERE role = 'college_admin' LIMIT 1),
    request_date = NOW(),
    request_message = 'Please review this curriculum for Computer Science program'
WHERE id = (SELECT id FROM college_curriculums LIMIT 1);
*/

-- ============================================================================
-- SECTION 10: DEPLOYMENT VERIFICATION
-- ============================================================================

-- Verify the implementation
DO $$
BEGIN
    -- Check if all required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_curriculums' 
        AND column_name = 'status'  -- Use existing status column
    ) THEN
        RAISE EXCEPTION 'status column not found in college_curriculums table';
    END IF;
    
    -- Check if functions exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'check_college_affiliation'
    ) THEN
        RAISE EXCEPTION 'check_college_affiliation function not found';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'submit_curriculum_for_approval'
    ) THEN
        RAISE EXCEPTION 'submit_curriculum_for_approval function not found';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'review_curriculum'
    ) THEN
        RAISE EXCEPTION 'review_curriculum function not found';
    END IF;
    
    -- Check if views exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'curriculum_approval_dashboard'
    ) THEN
        RAISE EXCEPTION 'curriculum_approval_dashboard view not found';
    END IF;
    
    RAISE NOTICE 'Curriculum Approval Workflow implementation completed successfully!';
END $$;