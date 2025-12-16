-- Project Approval System Setup
-- Similar to training/experience approval system

-- 1. Add approval fields to projects table (if not exists)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS approval_authority VARCHAR(20) DEFAULT 'rareminds_admin',
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Add constraint for approval_authority
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_approval_authority_check;

ALTER TABLE projects 
ADD CONSTRAINT projects_approval_authority_check 
CHECK (approval_authority IN ('school_admin', 'college_admin', 'rareminds_admin'));

-- Add constraint for approval_status
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_approval_status_check;

ALTER TABLE projects 
ADD CONSTRAINT projects_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'verified'));

-- 2. Create project_notifications table (similar to training_notifications)
CREATE TABLE IF NOT EXISTS project_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('school_admin', 'college_admin', 'rareminds_admin')),
    school_id UUID REFERENCES schools(id),
    college_id UUID REFERENCES colleges(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT project_notifications_reference_check CHECK (project_id IS NOT NULL)
);

-- Create indexes for project_notifications
CREATE INDEX IF NOT EXISTS idx_project_notifications_recipient 
ON project_notifications(recipient_type, school_id, college_id);

CREATE INDEX IF NOT EXISTS idx_project_notifications_read 
ON project_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_project_notifications_created 
ON project_notifications(created_at DESC);

-- 3. Create trigger function for project approval routing
CREATE OR REPLACE FUNCTION set_project_approval_authority()
RETURNS TRIGGER AS $$
DECLARE
    student_record RECORD;
    org_lower TEXT;
    school_match RECORD;
    college_match RECORD;
BEGIN
    -- Get student information
    SELECT s.student_type, s.school_id, s.college_id, s.university_college_id
    INTO student_record
    FROM students s
    WHERE s.id = NEW.student_id;

    -- If no student found, default to rareminds_admin
    IF NOT FOUND THEN
        NEW.approval_authority := 'rareminds_admin';
        RETURN NEW;
    END IF;

    -- If no organization specified, default to rareminds_admin
    IF NEW.organization IS NULL OR TRIM(NEW.organization) = '' THEN
        NEW.approval_authority := 'rareminds_admin';
        RETURN NEW;
    END IF;

    -- Normalize organization name for comparison
    org_lower := LOWER(TRIM(NEW.organization));

    -- Check if student is school type
    IF student_record.student_type = 'school' OR student_record.student_type = 'school_student' THEN
        -- Look for matching school name
        SELECT id, name INTO school_match
        FROM schools
        WHERE LOWER(TRIM(name)) = org_lower
        AND account_status IN ('active', 'pending')
        LIMIT 1;

        IF FOUND THEN
            NEW.approval_authority := 'school_admin';
            RETURN NEW;
        END IF;
    END IF;

    -- Check if student is college type
    IF student_record.student_type = 'college' OR student_record.student_type = 'college_student' THEN
        -- Look for matching college name
        SELECT id, name INTO college_match
        FROM colleges
        WHERE LOWER(TRIM(name)) = org_lower
        AND "accountStatus" = 'active'
        LIMIT 1;

        IF FOUND THEN
            NEW.approval_authority := 'college_admin';
            RETURN NEW;
        END IF;
    END IF;

    -- Default to rareminds_admin for external organizations
    NEW.approval_authority := 'rareminds_admin';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for project approval authority
DROP TRIGGER IF EXISTS trigger_set_project_approval_authority ON projects;

CREATE TRIGGER trigger_set_project_approval_authority
    BEFORE INSERT OR UPDATE OF organization, student_id
    ON projects
    FOR EACH ROW
    EXECUTE FUNCTION set_project_approval_authority();

-- 5. Create notification trigger function for projects
CREATE OR REPLACE FUNCTION notify_project_approval()
RETURNS TRIGGER AS $$
DECLARE
    student_record RECORD;
    notification_message TEXT;
    target_school_id UUID;
    target_college_id UUID;
BEGIN
    -- Only create notifications for pending status
    IF NEW.approval_status != 'pending' THEN
        RETURN NEW;
    END IF;

    -- Get student and school/college information
    SELECT 
        s.id as student_id,
        s.student_type,
        s.school_id,
        s.college_id,
        s.university_college_id,
        COALESCE(s.name, p.name) as student_name,
        sch.id as school_uuid,
        col.id as college_uuid
    INTO student_record
    FROM students s
    LEFT JOIN students p ON s.id = p.id  -- For profile name fallback
    LEFT JOIN schools sch ON s.school_id = sch.id
    LEFT JOIN colleges col ON s.college_id = col.id OR s.university_college_id = col.id
    WHERE s.id = NEW.student_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Prepare notification message
    notification_message := format(
        'New project "%s" submitted by %s for approval (Organization: %s)',
        NEW.title,
        COALESCE(student_record.student_name, 'Student'),
        COALESCE(NEW.organization, 'Not specified')
    );

    -- Determine target school/college based on approval authority
    IF NEW.approval_authority = 'school_admin' THEN
        target_school_id := student_record.school_uuid;
        target_college_id := NULL;
    ELSIF NEW.approval_authority = 'college_admin' THEN
        target_school_id := NULL;
        target_college_id := student_record.college_uuid;
    ELSE
        -- For rareminds_admin, we don't create notifications in this table
        RETURN NEW;
    END IF;

    -- Insert notification
    INSERT INTO project_notifications (
        project_id,
        recipient_type,
        school_id,
        college_id,
        message,
        is_read,
        created_at
    ) VALUES (
        NEW.id,
        NEW.approval_authority,
        target_school_id,
        target_college_id,
        notification_message,
        FALSE,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create notification trigger for projects
DROP TRIGGER IF EXISTS trigger_notify_project_approval ON projects;

CREATE TRIGGER trigger_notify_project_approval
    AFTER INSERT OR UPDATE OF approval_status
    ON projects
    FOR EACH ROW
    EXECUTE FUNCTION notify_project_approval();

-- 7. Create RPC functions for project management

-- Get pending projects for school admin
CREATE OR REPLACE FUNCTION get_pending_school_projects(input_school_id UUID)
RETURNS TABLE (
    project_id UUID,
    student_id UUID,
    student_name TEXT,
    title TEXT,
    description TEXT,
    organization TEXT,
    status TEXT,
    start_date DATE,
    end_date DATE,
    duration TEXT,
    tech_stack TEXT[],
    demo_link TEXT,
    github_link TEXT,
    certificate_url TEXT,
    video_url TEXT,
    ppt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    approval_status TEXT,
    approval_authority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as project_id,
        p.student_id,
        COALESCE(s.name, sp.name) as student_name,
        p.title,
        p.description,
        p.organization,
        p.status,
        p.start_date,
        p.end_date,
        p.duration,
        p.tech_stack,
        p.demo_link,
        p.github_link,
        p.certificate_url,
        p.video_url,
        p.ppt_url,
        p.created_at,
        p.approval_status,
        p.approval_authority
    FROM projects p
    JOIN students s ON p.student_id = s.id
    LEFT JOIN students sp ON s.id = sp.id  -- For profile name fallback
    WHERE p.approval_status = 'pending'
    AND p.approval_authority = 'school_admin'
    AND s.school_id = input_school_id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get pending projects for college admin
CREATE OR REPLACE FUNCTION get_pending_college_projects(input_college_id UUID)
RETURNS TABLE (
    project_id UUID,
    student_id UUID,
    student_name TEXT,
    title TEXT,
    description TEXT,
    organization TEXT,
    status TEXT,
    start_date DATE,
    end_date DATE,
    duration TEXT,
    tech_stack TEXT[],
    demo_link TEXT,
    github_link TEXT,
    certificate_url TEXT,
    video_url TEXT,
    ppt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    approval_status TEXT,
    approval_authority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as project_id,
        p.student_id,
        COALESCE(s.name, sp.name) as student_name,
        p.title,
        p.description,
        p.organization,
        p.status,
        p.start_date,
        p.end_date,
        p.duration,
        p.tech_stack,
        p.demo_link,
        p.github_link,
        p.certificate_url,
        p.video_url,
        p.ppt_url,
        p.created_at,
        p.approval_status,
        p.approval_authority
    FROM projects p
    JOIN students s ON p.student_id = s.id
    LEFT JOIN students sp ON s.id = sp.id  -- For profile name fallback
    WHERE p.approval_status = 'pending'
    AND p.approval_authority = 'college_admin'
    AND (s.college_id = input_college_id OR s.university_college_id = input_college_id)
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get project notifications for school admin
CREATE OR REPLACE FUNCTION get_school_admin_project_notifications(admin_school_id UUID, unread_only BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
    notification_id UUID,
    project_id UUID,
    message TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    project_title TEXT,
    student_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pn.id as notification_id,
        pn.project_id,
        pn.message,
        pn.is_read,
        pn.created_at,
        p.title as project_title,
        COALESCE(s.name, sp.name) as student_name
    FROM project_notifications pn
    JOIN projects p ON pn.project_id = p.id
    JOIN students s ON p.student_id = s.id
    LEFT JOIN students sp ON s.id = sp.id  -- For profile name fallback
    WHERE pn.recipient_type = 'school_admin'
    AND pn.school_id = admin_school_id
    AND (NOT unread_only OR pn.is_read = FALSE)
    ORDER BY pn.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get project notifications for college admin
CREATE OR REPLACE FUNCTION get_college_admin_project_notifications(admin_college_id UUID, unread_only BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
    notification_id UUID,
    project_id UUID,
    message TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    project_title TEXT,
    student_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pn.id as notification_id,
        pn.project_id,
        pn.message,
        pn.is_read,
        pn.created_at,
        p.title as project_title,
        COALESCE(s.name, sp.name) as student_name
    FROM project_notifications pn
    JOIN projects p ON pn.project_id = p.id
    JOIN students s ON p.student_id = s.id
    LEFT JOIN students sp ON s.id = sp.id  -- For profile name fallback
    WHERE pn.recipient_type = 'college_admin'
    AND pn.college_id = admin_college_id
    AND (NOT unread_only OR pn.is_read = FALSE)
    ORDER BY pn.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update existing projects to set approval authority
UPDATE projects 
SET approval_authority = 'rareminds_admin'
WHERE approval_authority IS NULL;

COMMIT;