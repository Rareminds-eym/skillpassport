-- Migration: Add support for student-college_admin messaging
-- This extends the existing messaging system to support conversations between students and college admins

-- Add college_id column to conversations table for college admin messaging
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id);

-- Add college_admin_unread_count column
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS college_admin_unread_count INTEGER DEFAULT 0;

-- Add soft delete columns for college admin
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_by_college_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS college_admin_deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_college_id ON conversations(college_id);
CREATE INDEX IF NOT EXISTS idx_conversations_college_admin_unread ON conversations(college_admin_unread_count) WHERE college_admin_unread_count > 0;

-- Create a composite index for student-college_admin conversations
CREATE INDEX IF NOT EXISTS idx_conversations_student_college_admin ON conversations(student_id, college_id, conversation_type) 
WHERE conversation_type = 'student_college_admin';

-- Create a composite index for college admin conversations
CREATE INDEX IF NOT EXISTS idx_conversations_college_admin_active ON conversations(college_id, status, deleted_by_college_admin) 
WHERE conversation_type = 'student_college_admin';

-- Drop existing constraint if it exists
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_check;

-- Add updated check constraint
ALTER TABLE conversations 
ADD CONSTRAINT conversations_participant_check 
CHECK (
    (recruiter_id IS NOT NULL AND educator_id IS NULL AND school_id IS NULL AND college_id IS NULL AND conversation_type = 'student_recruiter') OR
    (educator_id IS NOT NULL AND recruiter_id IS NULL AND school_id IS NULL AND college_id IS NULL AND conversation_type = 'student_educator') OR
    (school_id IS NOT NULL AND recruiter_id IS NULL AND educator_id IS NULL AND college_id IS NULL AND conversation_type = 'student_admin') OR
    (college_id IS NOT NULL AND recruiter_id IS NULL AND educator_id IS NULL AND school_id IS NULL AND conversation_type = 'student_college_admin') OR
    (recruiter_id IS NOT NULL AND educator_id IS NOT NULL AND school_id IS NULL AND college_id IS NULL AND conversation_type = 'educator_recruiter')
);

-- Update the unread count trigger function to handle college_admin
CREATE OR REPLACE FUNCTION update_conversation_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update unread count based on receiver type
    IF NEW.receiver_type = 'student' THEN
        UPDATE conversations 
        SET student_unread_count = student_unread_count + 1,
            last_message_at = NEW.created_at,
            last_message_preview = LEFT(NEW.message_text, 100),
            last_message_sender = NEW.sender_type,
            updated_at = NEW.created_at
        WHERE id = NEW.conversation_id;
    ELSIF NEW.receiver_type = 'recruiter' THEN
        UPDATE conversations 
        SET recruiter_unread_count = recruiter_unread_count + 1,
            last_message_at = NEW.created_at,
            last_message_preview = LEFT(NEW.message_text, 100),
            last_message_sender = NEW.sender_type,
            updated_at = NEW.created_at
        WHERE id = NEW.conversation_id;
    ELSIF NEW.receiver_type = 'educator' THEN
        UPDATE conversations 
        SET educator_unread_count = educator_unread_count + 1,
            last_message_at = NEW.created_at,
            last_message_preview = LEFT(NEW.message_text, 100),
            last_message_sender = NEW.sender_type,
            updated_at = NEW.created_at
        WHERE id = NEW.conversation_id;
    ELSIF NEW.receiver_type = 'school_admin' THEN
        UPDATE conversations 
        SET admin_unread_count = admin_unread_count + 1,
            last_message_at = NEW.created_at,
            last_message_preview = LEFT(NEW.message_text, 100),
            last_message_sender = NEW.sender_type,
            updated_at = NEW.created_at
        WHERE id = NEW.conversation_id;
    ELSIF NEW.receiver_type = 'college_admin' THEN
        UPDATE conversations 
        SET college_admin_unread_count = college_admin_unread_count + 1,
            last_message_at = NEW.created_at,
            last_message_preview = LEFT(NEW.message_text, 100),
            last_message_sender = NEW.sender_type,
            updated_at = NEW.created_at
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing check constraints if they exist
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_type_check;

-- Add updated check constraints that include 'college_admin'
ALTER TABLE messages 
ADD CONSTRAINT messages_sender_type_check 
CHECK (sender_type IN ('student', 'recruiter', 'educator', 'school_admin', 'college_admin'));

ALTER TABLE messages 
ADD CONSTRAINT messages_receiver_type_check 
CHECK (receiver_type IN ('student', 'recruiter', 'educator', 'school_admin', 'college_admin'));

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Students can view their college admin conversations" ON conversations;
DROP POLICY IF EXISTS "College admins can view their student conversations" ON conversations;
DROP POLICY IF EXISTS "Students can create college admin conversations" ON conversations;
DROP POLICY IF EXISTS "College admins can create student conversations" ON conversations;
DROP POLICY IF EXISTS "Students can update their college admin conversations" ON conversations;
DROP POLICY IF EXISTS "College admins can update their student conversations" ON conversations;

-- Drop message policies if they exist
DROP POLICY IF EXISTS "Students can view college admin conversation messages" ON messages;
DROP POLICY IF EXISTS "College admins can view student conversation messages" ON messages;
DROP POLICY IF EXISTS "Students can send messages to college admins" ON messages;
DROP POLICY IF EXISTS "College admins can send messages to students" ON messages;

-- Create conversation policies for student-college_admin
CREATE POLICY "Students can view their college admin conversations" ON conversations
    FOR SELECT USING (
        student_id = auth.uid() AND 
        conversation_type = 'student_college_admin' AND 
        (deleted_by_student IS NULL OR deleted_by_student = FALSE)
    );

CREATE POLICY "College admins can view their student conversations" ON conversations
    FOR SELECT USING (
        college_id IN (
            SELECT "collegeId" FROM college_lecturers 
            WHERE user_id = auth.uid()
            UNION
            SELECT "collegeId" FROM college_lecturers 
            WHERE "userId" = auth.uid()
            UNION
            SELECT id FROM colleges 
            WHERE created_by = auth.uid()
        ) AND 
        conversation_type = 'student_college_admin' AND 
        (deleted_by_college_admin IS NULL OR deleted_by_college_admin = FALSE)
    );

CREATE POLICY "Students can create college admin conversations" ON conversations
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND 
        conversation_type = 'student_college_admin'
    );

CREATE POLICY "College admins can create student conversations" ON conversations
    FOR INSERT WITH CHECK (
        college_id IN (
            SELECT "collegeId" FROM college_lecturers 
            WHERE user_id = auth.uid()
            UNION
            SELECT "collegeId" FROM college_lecturers 
            WHERE "userId" = auth.uid()
            UNION
            SELECT id FROM colleges 
            WHERE created_by = auth.uid()
        ) AND 
        conversation_type = 'student_college_admin'
    );

CREATE POLICY "Students can update their college admin conversations" ON conversations
    FOR UPDATE USING (
        student_id = auth.uid() AND 
        conversation_type = 'student_college_admin'
    );

CREATE POLICY "College admins can update their student conversations" ON conversations
    FOR UPDATE USING (
        college_id IN (
            SELECT "collegeId" FROM college_lecturers 
            WHERE user_id = auth.uid()
            UNION
            SELECT "collegeId" FROM college_lecturers 
            WHERE "userId" = auth.uid()
            UNION
            SELECT id FROM colleges 
            WHERE created_by = auth.uid()
        ) AND 
        conversation_type = 'student_college_admin'
    );

-- Create message policies for student-college_admin
CREATE POLICY "Students can view college admin conversation messages" ON messages
    FOR SELECT USING (
        (sender_id = auth.uid() AND sender_type = 'student') OR
        (receiver_id = auth.uid() AND receiver_type = 'student')
    );

CREATE POLICY "College admins can view student conversation messages" ON messages
    FOR SELECT USING (
        (sender_id = auth.uid() AND sender_type = 'college_admin') OR
        (receiver_id = auth.uid() AND receiver_type = 'college_admin')
    );

CREATE POLICY "Students can send messages to college admins" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND 
        sender_type = 'student' AND 
        receiver_type = 'college_admin'
    );

CREATE POLICY "College admins can send messages to students" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND 
        sender_type = 'college_admin' AND 
        receiver_type = 'student'
    );

-- Create a helper function to get or create student-college_admin conversation
CREATE OR REPLACE FUNCTION get_or_create_student_college_admin_conversation(
    p_student_id UUID,
    p_college_id UUID,
    p_subject TEXT DEFAULT 'General Discussion'
)
RETURNS TABLE(conversation_id TEXT) AS $$
DECLARE
    existing_conversation_id TEXT;
    new_conversation_id TEXT;
BEGIN
    -- Try to find existing conversation
    SELECT id INTO existing_conversation_id
    FROM conversations
    WHERE student_id = p_student_id 
      AND college_id = p_college_id
      AND conversation_type = 'student_college_admin'
      AND (p_subject IS NULL OR subject = p_subject)
    LIMIT 1;
    
    IF existing_conversation_id IS NOT NULL THEN
        -- If conversation was soft deleted, restore it
        UPDATE conversations 
        SET deleted_by_student = FALSE,
            deleted_by_college_admin = FALSE,
            student_deleted_at = NULL,
            college_admin_deleted_at = NULL,
            updated_at = NOW()
        WHERE id = existing_conversation_id;
        
        RETURN QUERY SELECT existing_conversation_id;
    ELSE
        -- Create new conversation
        new_conversation_id := 'conv_ca_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 9);
        
        INSERT INTO conversations (
            id,
            student_id,
            college_id,
            subject,
            conversation_type,
            status,
            student_unread_count,
            recruiter_unread_count,
            educator_unread_count,
            admin_unread_count,
            college_admin_unread_count,
            created_at,
            updated_at
        ) VALUES (
            new_conversation_id,
            p_student_id,
            p_college_id,
            p_subject,
            'student_college_admin',
            'active',
            0,
            0,
            0,
            0,
            0,
            NOW(),
            NOW()
        );
        
        RETURN QUERY SELECT new_conversation_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_or_create_student_college_admin_conversation TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN conversations.college_id IS 'Reference to colleges table for student-college_admin conversations (all admins in college can see)';
COMMENT ON COLUMN conversations.college_admin_unread_count IS 'Number of unread messages for the college admin';
COMMENT ON COLUMN conversations.deleted_by_college_admin IS 'Whether the college admin has soft-deleted this conversation';
COMMENT ON COLUMN conversations.college_admin_deleted_at IS 'When the college admin deleted the conversation';

COMMENT ON FUNCTION get_or_create_student_college_admin_conversation IS 'Helper function to get or create a conversation between student and college (visible to all college admins)';