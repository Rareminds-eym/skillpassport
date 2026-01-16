-- ============================================================================
-- CURRICULUM APPROVAL WORKFLOW SCHEMA
-- ============================================================================
-- Purpose: Implements curriculum approval workflow for affiliated colleges
-- Features: Request approval, university admin approval, auto-publishing
-- ============================================================================

-- ============================================================================
-- 1. ADD APPROVAL WORKFLOW COLUMNS TO EXISTING CURRICULUM TABLES
-- ============================================================================

-- Add approval workflow columns to college_curriculums table
ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'draft' 
    CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected', 'published'));

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS request_date TIMESTAMP;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS approval_notes TEXT;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Update existing records to set university_id based on college affiliation
UPDATE college_curriculums 
SET university_id = (
    SELECT uc.university_id 
    FROM university_colleges uc 
    WHERE uc.college_id = college_curriculums.college_id
    LIMIT 1
)
WHERE university_id IS NULL;

-- ============================================================================
-- 2. CREATE CURRICULUM APPROVAL REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS curriculum_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id UUID REFERENCES college_curriculums(id) ON DELETE CASCADE NOT NULL,
    university_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    college_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    
    -- Request details
    requested_by UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    request_date TIMESTAMP DEFAULT NOW() NOT NULL,
    request_message TEXT,
    
    -- Approval details
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    review_date TIMESTAMP,
    review_notes TEXT,
    
    -- Auto-publishing
    auto_published BOOLEAN DEFAULT FALSE,
    published_date TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one active request per curriculum
    UNIQUE(curriculum_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_curriculum_approval_requests_university 
ON curriculum_approval_requests(university_id, status);

CREATE INDEX IF NOT EXISTS idx_curriculum_approval_requests_college 
ON curriculum_approval_requests(college_id, status);

-- ============================================================================
-- 3. CREATE CURRICULUM APPROVAL NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS curriculum_approval_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_request_id UUID REFERENCES curriculum_approval_requests(id) ON DELETE CASCADE NOT NULL,
    
    -- Notification details
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    notification_type VARCHAR(50) NOT NULL 
        CHECK (notification_type IN ('request_submitted', 'request_approved', 'request_rejected', 'curriculum_published')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Additional data (JSON)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_curriculum_notifications_recipient 
ON curriculum_approval_notifications(recipient_id, is_read, created_at DESC);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if college is affiliated with university
CREATE OR REPLACE FUNCTION is_college_affiliated_with_university(
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
$$ LANGUAGE plpgsql;

-- Function to get university for a college
CREATE OR REPLACE FUNCTION get_university_for_college(p_college_id UUID) 
RETURNS UUID AS $$
DECLARE
    v_university_id UUID;
BEGIN
    SELECT university_id INTO v_university_id
    FROM university_colleges 
    WHERE college_id = p_college_id 
    AND account_status = 'active'
    LIMIT 1;
    
    RETURN v_university_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get university admins for a university
CREATE OR REPLACE FUNCTION get_university_admins(p_university_id UUID) 
RETURNS TABLE(user_id UUID, email TEXT, full_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.full_name
    FROM users u
    WHERE u.organizationId = p_university_id
    AND u.role = 'university_admin'
    AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. TRIGGER FUNCTIONS FOR WORKFLOW AUTOMATION
-- ============================================================================

-- Function to handle curriculum approval request submission
CREATE OR REPLACE FUNCTION handle_curriculum_approval_request() 
RETURNS TRIGGER AS $$
DECLARE
    v_university_id UUID;
    v_admin_record RECORD;
BEGIN
    -- Get university for this college
    v_university_id := get_university_for_college(NEW.college_id);
    
    IF v_university_id IS NULL THEN
        RAISE EXCEPTION 'College is not affiliated with any university';
    END IF;
    
    -- Update curriculum status
    UPDATE college_curriculums 
    SET approval_status = 'pending_approval',
        university_id = v_university_id,
        requested_by = NEW.requested_by,
        request_date = NEW.request_date
    WHERE id = NEW.curriculum_id;
    
    -- Create notifications for all university admins
    FOR v_admin_record IN 
        SELECT user_id, email, full_name FROM get_university_admins(v_university_id)
    LOOP
        INSERT INTO curriculum_approval_notifications (
            approval_request_id,
            recipient_id,
            notification_type,
            title,
            message,
            metadata
        ) VALUES (
            NEW.id,
            v_admin_record.user_id,
            'request_submitted',
            'New Curriculum Approval Request',
            'A new curriculum approval request has been submitted and requires your review.',
            jsonb_build_object(
                'curriculum_id', NEW.curriculum_id,
                'college_id', NEW.college_id,
                'university_id', v_university_id,
                'requested_by_email', (SELECT email FROM users WHERE id = NEW.requested_by)
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle curriculum approval/rejection
CREATE OR REPLACE FUNCTION handle_curriculum_approval_decision() 
RETURNS TRIGGER AS $$
DECLARE
    v_curriculum_record RECORD;
    v_requester_id UUID;
    v_notification_type VARCHAR(50);
    v_notification_title VARCHAR(255);
    v_notification_message TEXT;
BEGIN
    -- Only process when status changes to approved or rejected
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;
    
    -- Get curriculum and requester details
    SELECT c.*, r.requested_by INTO v_curriculum_record, v_requester_id
    FROM college_curriculums c
    JOIN curriculum_approval_requests r ON r.curriculum_id = c.id
    WHERE c.id = NEW.curriculum_id AND r.id = NEW.id;
    
    IF NEW.status = 'approved' THEN
        -- Update curriculum status to approved
        UPDATE college_curriculums 
        SET approval_status = 'approved',
            approved_by = NEW.reviewed_by,
            approval_date = NEW.review_date,
            approval_notes = NEW.review_notes
        WHERE id = NEW.curriculum_id;
        
        -- Auto-publish the curriculum
        UPDATE college_curriculums 
        SET approval_status = 'published',
            published_date = NOW()
        WHERE id = NEW.curriculum_id;
        
        -- Update request as auto-published
        UPDATE curriculum_approval_requests 
        SET auto_published = TRUE,
            published_date = NOW()
        WHERE id = NEW.id;
        
        v_notification_type := 'request_approved';
        v_notification_title := 'Curriculum Approved and Published';
        v_notification_message := 'Your curriculum has been approved and automatically published.';
        
    ELSIF NEW.status = 'rejected' THEN
        -- Update curriculum status to rejected
        UPDATE college_curriculums 
        SET approval_status = 'rejected',
            approved_by = NEW.reviewed_by,
            approval_date = NEW.review_date,
            approval_notes = NEW.review_notes
        WHERE id = NEW.curriculum_id;
        
        v_notification_type := 'request_rejected';
        v_notification_title := 'Curriculum Approval Rejected';
        v_notification_message := 'Your curriculum approval request has been rejected. Please review the feedback and resubmit.';
    END IF;
    
    -- Create notification for requester
    INSERT INTO curriculum_approval_notifications (
        approval_request_id,
        recipient_id,
        notification_type,
        title,
        message,
        metadata
    ) VALUES (
        NEW.id,
        v_requester_id,
        v_notification_type,
        v_notification_title,
        v_notification_message,
        jsonb_build_object(
            'curriculum_id', NEW.curriculum_id,
            'review_notes', NEW.review_notes,
            'reviewed_by', NEW.reviewed_by,
            'auto_published', CASE WHEN NEW.status = 'approved' THEN TRUE ELSE FALSE END
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE TRIGGERS
-- ============================================================================

-- Trigger for new approval requests
DROP TRIGGER IF EXISTS trigger_curriculum_approval_request ON curriculum_approval_requests;
CREATE TRIGGER trigger_curriculum_approval_request
    AFTER INSERT ON curriculum_approval_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_curriculum_approval_request();

-- Trigger for approval decisions
DROP TRIGGER IF EXISTS trigger_curriculum_approval_decision ON curriculum_approval_requests;
CREATE TRIGGER trigger_curriculum_approval_decision
    AFTER UPDATE ON curriculum_approval_requests
    FOR EACH ROW
    WHEN (OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected'))
    EXECUTE FUNCTION handle_curriculum_approval_decision();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE curriculum_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_approval_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for curriculum_approval_requests
CREATE POLICY "College admins can view their requests" ON curriculum_approval_requests
    FOR SELECT USING (
        college_id IN (
            SELECT cl.collegeId FROM college_lecturers cl WHERE cl.user_id = auth.uid()
        )
    );

CREATE POLICY "University admins can view requests for their colleges" ON curriculum_approval_requests
    FOR SELECT USING (
        university_id IN (
            SELECT organizationId FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "College admins can create requests" ON curriculum_approval_requests
    FOR INSERT WITH CHECK (
        college_id IN (
            SELECT cl.collegeId FROM college_lecturers cl WHERE cl.user_id = auth.uid()
        )
    );

CREATE POLICY "University admins can update requests" ON curriculum_approval_requests
    FOR UPDATE USING (
        university_id IN (
            SELECT organizationId FROM users WHERE id = auth.uid()
        )
    );

-- Policies for curriculum_approval_notifications
CREATE POLICY "Users can view their notifications" ON curriculum_approval_notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON curriculum_approval_notifications
    FOR UPDATE USING (recipient_id = auth.uid());

-- ============================================================================
-- 8. VIEWS FOR EASY QUERYING
-- ============================================================================

-- View for curriculum approval dashboard (University Admin)
CREATE OR REPLACE VIEW curriculum_approval_dashboard AS
SELECT 
    car.id as request_id,
    car.curriculum_id,
    car.university_id,
    car.college_id,
    car.status as request_status,
    car.request_date,
    car.review_date,
    car.review_notes,
    car.auto_published,
    
    -- Curriculum details
    cc.course_id,
    cc.department_id,
    cc.program_id,
    cc.academic_year,
    cc.approval_status as curriculum_status,
    
    -- Course details
    course.course_code,
    course.course_name,
    
    -- College details
    college_org.name as college_name,
    uc.code as college_code,
    uc.dean_name,
    uc.dean_email,
    
    -- Requester details
    requester.email as requester_email,
    requester.full_name as requester_name,
    
    -- Reviewer details
    reviewer.email as reviewer_email,
    reviewer.full_name as reviewer_name,
    
    -- Department and Program details
    dept.name as department_name,
    prog.name as program_name
    
FROM curriculum_approval_requests car
JOIN college_curriculums cc ON cc.id = car.curriculum_id
JOIN college_courses course ON course.id = cc.course_id
JOIN organizations college_org ON college_org.id = car.college_id
JOIN university_colleges uc ON uc.college_id = car.college_id AND uc.university_id = car.university_id
LEFT JOIN users requester ON requester.id = car.requested_by
LEFT JOIN users reviewer ON reviewer.id = car.reviewed_by
LEFT JOIN college_departments dept ON dept.id = cc.department_id
LEFT JOIN college_programs prog ON prog.id = cc.program_id;

-- View for college curriculum status
CREATE OR REPLACE VIEW college_curriculum_status AS
SELECT 
    cc.id as curriculum_id,
    cc.college_id,
    cc.course_id,
    cc.department_id,
    cc.program_id,
    cc.academic_year,
    cc.approval_status,
    cc.university_id,
    
    -- Course details
    course.course_code,
    course.course_name,
    
    -- Check if college is affiliated
    CASE 
        WHEN cc.university_id IS NOT NULL THEN TRUE 
        ELSE FALSE 
    END as is_affiliated,
    
    -- Latest approval request
    car.id as latest_request_id,
    car.status as latest_request_status,
    car.request_date as latest_request_date,
    car.review_notes as latest_review_notes,
    
    -- University details (if affiliated)
    univ_org.name as university_name,
    
    -- Department and Program details
    dept.name as department_name,
    prog.name as program_name
    
FROM college_curriculums cc
JOIN college_courses course ON course.id = cc.course_id
LEFT JOIN curriculum_approval_requests car ON car.curriculum_id = cc.id 
    AND car.id = (
        SELECT id FROM curriculum_approval_requests 
        WHERE curriculum_id = cc.id 
        ORDER BY created_at DESC 
        LIMIT 1
    )
LEFT JOIN organizations univ_org ON univ_org.id = cc.university_id
LEFT JOIN college_departments dept ON dept.id = cc.department_id
LEFT JOIN college_programs prog ON prog.id = cc.program_id;

-- ============================================================================
-- 9. SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample assessment types if they don't exist
INSERT INTO assessment_types (school_id, name, description) VALUES
    (NULL, 'Mid-term Exam', 'Mid-semester examination'),
    (NULL, 'Final Exam', 'End-semester examination'),
    (NULL, 'Internal Assessment', 'Continuous internal evaluation'),
    (NULL, 'Viva Voce', 'Oral examination'),
    (NULL, 'Seminar', 'Student seminar presentation'),
    (NULL, 'Case Study', 'Case study analysis and presentation')
ON CONFLICT (school_id, name) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Curriculum Approval Workflow Schema created successfully!';
    RAISE NOTICE 'Features implemented:';
    RAISE NOTICE '- Approval workflow columns added to college_curriculums';
    RAISE NOTICE '- curriculum_approval_requests table for tracking requests';
    RAISE NOTICE '- curriculum_approval_notifications for user notifications';
    RAISE NOTICE '- Helper functions for college-university relationships';
    RAISE NOTICE '- Automated triggers for workflow management';
    RAISE NOTICE '- RLS policies for security';
    RAISE NOTICE '- Dashboard views for easy querying';
    RAISE NOTICE '- Auto-publishing upon approval';
END $$;