-- =====================================================
-- CIRCULARS & NOTIFICATIONS SYSTEM
-- =====================================================

-- Circulars Table
CREATE TABLE IF NOT EXISTS circulars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    audience_type VARCHAR(50) NOT NULL CHECK (audience_type IN ('all', 'department', 'program', 'semester', 'batch', 'section', 'custom')),
    audience_filter JSONB DEFAULT '{}', -- Stores specific filters like dept_ids, program_ids, etc.
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'expired')),
    attachments JSONB DEFAULT '[]', -- Array of {name, url, size, type}
    publish_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    views_count INTEGER DEFAULT 0,
    college_id UUID REFERENCES colleges(id),
    CONSTRAINT valid_dates CHECK (expiry_date IS NULL OR expiry_date >= publish_date)
);

-- Circular Recipients (for tracking who should see it)
CREATE TABLE IF NOT EXISTS circular_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circular_id UUID NOT NULL REFERENCES circulars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(circular_id, user_id)
);

-- Circular Read Tracking
CREATE TABLE IF NOT EXISTS circular_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circular_id UUID NOT NULL REFERENCES circulars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(circular_id, user_id)
);

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'circular', 'exam', 'fee', 'attendance', etc.
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Array of variable names used in template
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_circulars_status ON circulars(status);
CREATE INDEX IF NOT EXISTS idx_circulars_college ON circulars(college_id);
CREATE INDEX IF NOT EXISTS idx_circulars_publish_date ON circulars(publish_date);
CREATE INDEX IF NOT EXISTS idx_circulars_expiry_date ON circulars(expiry_date);
CREATE INDEX IF NOT EXISTS idx_circulars_created_by ON circulars(created_by);
CREATE INDEX IF NOT EXISTS idx_circular_recipients_user ON circular_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_circular_recipients_circular ON circular_recipients(circular_id);
CREATE INDEX IF NOT EXISTS idx_circular_reads_user ON circular_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_circular_reads_circular ON circular_reads(circular_id);

-- RLS Policies
ALTER TABLE circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE circular_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE circular_reads ENABLE ROW LEVEL SECURITY;

-- Circulars: College admins can manage their college circulars
CREATE POLICY "College admins can manage circulars" ON circulars
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('college_admin', 'super_admin')
        )
    );

-- Users can view published circulars meant for them
CREATE POLICY "Users can view their circulars" ON circulars
    FOR SELECT USING (
        status = 'published' 
        AND (
            publish_date IS NULL OR publish_date <= NOW()
        )
        AND (
            expiry_date IS NULL OR expiry_date >= NOW()
        )
        AND (
            audience_type = 'all'
            OR EXISTS (
                SELECT 1 FROM circular_recipients 
                WHERE circular_recipients.circular_id = circulars.id 
                AND circular_recipients.user_id = auth.uid()
            )
        )
    );

-- Recipients policies
CREATE POLICY "Users can view their recipient records" ON circular_recipients
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their read status" ON circular_recipients
    FOR UPDATE USING (user_id = auth.uid());

-- Read tracking policies
CREATE POLICY "Users can track their reads" ON circular_reads
    FOR ALL USING (user_id = auth.uid());

-- Function to auto-expire circulars
CREATE OR REPLACE FUNCTION auto_expire_circulars()
RETURNS void AS $$
BEGIN
    UPDATE circulars
    SET status = 'expired'
    WHERE status = 'published'
    AND expiry_date IS NOT NULL
    AND expiry_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to mark circular as read
CREATE OR REPLACE FUNCTION mark_circular_read(p_circular_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Insert into circular_reads
    INSERT INTO circular_reads (circular_id, user_id, read_at)
    VALUES (p_circular_id, p_user_id, NOW())
    ON CONFLICT (circular_id, user_id) DO NOTHING;
    
    -- Update recipient record
    UPDATE circular_recipients
    SET is_read = TRUE, read_at = NOW()
    WHERE circular_id = p_circular_id AND user_id = p_user_id;
    
    -- Increment views count
    UPDATE circulars
    SET views_count = views_count + 1
    WHERE id = p_circular_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create recipients based on audience filter
CREATE OR REPLACE FUNCTION create_circular_recipients(p_circular_id UUID)
RETURNS void AS $$
DECLARE
    v_circular RECORD;
    v_user_id UUID;
BEGIN
    SELECT * INTO v_circular FROM circulars WHERE id = p_circular_id;
    
    IF v_circular.audience_type = 'all' THEN
        -- Add all users in the college
        INSERT INTO circular_recipients (circular_id, user_id)
        SELECT p_circular_id, id FROM users
        WHERE id NOT IN (
            SELECT user_id FROM circular_recipients WHERE circular_id = p_circular_id
        );
    ELSIF v_circular.audience_type = 'department' THEN
        -- Add users from specific departments
        INSERT INTO circular_recipients (circular_id, user_id)
        SELECT DISTINCT p_circular_id, cl.user_id
        FROM college_lecturers cl
        WHERE cl.department = ANY(
            SELECT jsonb_array_elements_text(v_circular.audience_filter->'departments')
        )
        AND cl.user_id NOT IN (
            SELECT user_id FROM circular_recipients WHERE circular_id = p_circular_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_circulars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER circulars_updated_at
    BEFORE UPDATE ON circulars
    FOR EACH ROW
    EXECUTE FUNCTION update_circulars_updated_at();

-- Insert default notification templates
INSERT INTO notification_templates (name, type, title_template, message_template, variables) VALUES
('Circular Published', 'circular', 'New Circular: {{title}}', 'A new circular has been published: {{message}}', '["title", "message"]'),
('Exam Scheduled', 'exam', 'Exam Scheduled: {{exam_name}}', 'Your exam {{exam_name}} has been scheduled for {{exam_date}}', '["exam_name", "exam_date"]'),
('Fee Due Reminder', 'fee', 'Fee Payment Reminder', 'Your fee payment of {{amount}} is due by {{due_date}}', '["amount", "due_date"]'),
('Attendance Alert', 'attendance', 'Attendance Below Threshold', 'Your attendance is {{percentage}}% which is below the required threshold', '["percentage"]')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE circulars IS 'Stores institutional circulars and announcements';
COMMENT ON TABLE circular_recipients IS 'Tracks which users should receive each circular';
COMMENT ON TABLE circular_reads IS 'Tracks when users read circulars';
COMMENT ON TABLE notification_templates IS 'Reusable templates for notifications';
