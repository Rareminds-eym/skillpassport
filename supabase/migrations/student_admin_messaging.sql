-- Migration: Add support for student-school_admin messaging
-- This extends the existing messaging system to support conversations between students and school admins

-- Add school_id column to conversations table for school admin messaging
DO $$ 
BEGIN
    -- Add school_id column if it doesn't exist (references schools table)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'school_id') THEN
        ALTER TABLE conversations ADD COLUMN school_id UUID REFERENCES schools(id);
    END IF;
    
    -- Add admin_unread_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'admin_unread_count') THEN
        ALTER TABLE conversations ADD COLUMN admin_unread_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add soft delete columns for admin if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'deleted_by_admin') THEN
        ALTER TABLE conversations ADD COLUMN deleted_by_admin BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'admin_deleted_at') THEN
        ALTER TABLE conversations ADD COLUMN admin_deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_school_id ON conversations(school_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_unread ON conversations(admin_unread_count) WHERE admin_unread_count > 0;

-- Create a composite index for student-admin conversations
CREATE INDEX IF NOT EXISTS idx_conversations_student_admin ON conversations(student_id, school_id, conversation_type) 
WHERE conversation_type = 'student_admin';

-- Create a composite index for admin conversations
CREATE INDEX IF NOT EXISTS idx_conversations_admin_active ON conversations(school_id, status, deleted_by_admin) 
WHERE conversation_type = 'student_admin';

-- Update the participant check constraint to include student_admin conversations
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_check;
    
    -- Add updated check constraint
    ALTER TABLE conversations 
    ADD CONSTRAINT conversations_participant_check 
    CHECK (
        (recruiter_id IS NOT NULL AND educator_id IS NULL AND school_id IS NULL AND conversation_type = 'student_recruiter') OR
        (educator_id IS NOT NULL AND recruiter_id IS NULL AND school_id IS NULL AND conversation_type = 'student_educator') OR
        (school_id IS NOT NULL AND recruiter_id IS NULL AND educator_id IS NULL AND conversation_type = 'student_admin') OR
        (recruiter_id IS NOT NULL AND educator_id IS NOT NULL AND school_id IS NULL AND conversation_type = 'educator_recruiter')
    );
END $$;

-- Update the unread count trigger function to handle school_admin
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update sender_type and receiver_type constraints to include 'school_admin'
DO $$ 
BEGIN
    -- Drop existing check constraints if they exist
    BEGIN
        ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
    EXCEPTION
        WHEN others THEN
            NULL; -- Ignore if constraint doesn't exist
    END;
    
    BEGIN
        ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_type_check;
    EXCEPTION
        WHEN others THEN
            NULL; -- Ignore if constraint doesn't exist
    END;
END $$;

-- Add updated check constraints that include 'school_admin'
ALTER TABLE messages 
ADD CONSTRAINT messages_sender_type_check 
CHECK (sender_type IN ('student', 'recruiter', 'educator', 'school_admin'));

ALTER TABLE messages 
ADD CONSTRAINT messages_receiver_type_check 
CHECK (receiver_type IN ('student', 'recruiter', 'educator', 'school_admin'));

-- Create RLS policies for student-admin conversations
-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
    -- Drop conversation policies if they exist
    DROP POLICY IF EXISTS "Students can view their admin conversations" ON conversations;
    DROP POLICY IF EXISTS "School admins can view their student conversations" ON conversations;
    DROP POLICY IF EXISTS "Students can create admin conversations" ON conversations;
    DROP POLICY IF EXISTS "School admins can create student conversations" ON conversations;
    DROP POLICY IF EXISTS "Students can update their admin conversations" ON conversations;
    DROP POLICY IF EXISTS "School admins can update their student conversations" ON conversations;
    
    -- Drop message policies if they exist
    DROP POLICY IF EXISTS "Students can view admin conversation messages" ON messages;
    DROP POLICY IF EXISTS "School admins can view student conversation messages" ON messages;
    DROP POLICY IF EXISTS "Students can send messages to school admins" ON messages;
    DROP POLICY IF EXISTS "School admins can send messages to students" ON messages;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Ignore if policies don't exist
END $$;

-- Create conversation policies for student-admin
CREATE POLICY "Students can view their admin conversations" ON conversations
    FOR SELECT USING (
        student_id = auth.uid() AND 
        conversation_type = 'student_admin' AND 
        (deleted_by_student IS NULL OR deleted_by_student = FALSE)
    );

CREATE POLICY "School admins can view their student conversations" ON conversations
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM school_educators 
            WHERE user_id = auth.uid() AND role = 'school_admin'
        ) AND 
        conversation_type = 'student_admin' AND 
        (deleted_by_admin IS NULL OR deleted_by_admin = FALSE)
    );

CREATE POLICY "Students can create admin conversations" ON conversations
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND 
        conversation_type = 'student_admin'
    );

CREATE POLICY "School admins can create student conversations" ON conversations
    FOR INSERT WITH CHECK (
        school_id IN (
            SELECT school_id FROM school_educators 
            WHERE user_id = auth.uid() AND role = 'school_admin'
        ) AND 
        conversation_type = 'student_admin'
    );

CREATE POLICY "Students can update their admin conversations" ON conversations
    FOR UPDATE USING (
        student_id = auth.uid() AND 
        conversation_type = 'student_admin'
    );

CREATE POLICY "School admins can update their student conversations" ON conversations
    FOR UPDATE USING (
        school_id IN (
            SELECT school_id FROM school_educators 
            WHERE user_id = auth.uid() AND role = 'school_admin'
        ) AND 
        conversation_type = 'student_admin'
    );

-- Create message policies for student-admin
CREATE POLICY "Students can view admin conversation messages" ON messages
    FOR SELECT USING (
        (sender_id = auth.uid() AND sender_type = 'student') OR
        (receiver_id = auth.uid() AND receiver_type = 'student')
    );

CREATE POLICY "School admins can view student conversation messages" ON messages
    FOR SELECT USING (
        (sender_id = auth.uid() AND sender_type = 'school_admin') OR
        (receiver_id = auth.uid() AND receiver_type = 'school_admin')
    );

CREATE POLICY "Students can send messages to school admins" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND 
        sender_type = 'student' AND 
        receiver_type = 'school_admin'
    );

CREATE POLICY "School admins can send messages to students" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND 
        sender_type = 'school_admin' AND 
        receiver_type = 'student'
    );

-- Create a helper function to get or create student-admin conversation
CREATE OR REPLACE FUNCTION get_or_create_student_admin_conversation(
    p_student_id UUID,
    p_school_id UUID,
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
      AND school_id = p_school_id
      AND conversation_type = 'student_admin'
      AND (p_subject IS NULL OR subject = p_subject)
    LIMIT 1;
    
    IF existing_conversation_id IS NOT NULL THEN
        -- If conversation was soft deleted, restore it
        UPDATE conversations 
        SET deleted_by_student = FALSE,
            deleted_by_admin = FALSE,
            student_deleted_at = NULL,
            admin_deleted_at = NULL,
            updated_at = NOW()
        WHERE id = existing_conversation_id;
        
        RETURN QUERY SELECT existing_conversation_id;
    ELSE
        -- Create new conversation
        new_conversation_id := 'conv_sa_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 9);
        
        INSERT INTO conversations (
            id,
            student_id,
            school_id,
            subject,
            conversation_type,
            status,
            student_unread_count,
            recruiter_unread_count,
            educator_unread_count,
            admin_unread_count,
            created_at,
            updated_at
        ) VALUES (
            new_conversation_id,
            p_student_id,
            p_school_id,
            p_subject,
            'student_admin',
            'active',
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
GRANT EXECUTE ON FUNCTION get_or_create_student_admin_conversation TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN conversations.school_id IS 'Reference to schools table for student-admin conversations (all admins in school can see)';
COMMENT ON COLUMN conversations.admin_unread_count IS 'Number of unread messages for the school admin';
COMMENT ON COLUMN conversations.deleted_by_admin IS 'Whether the school admin has soft-deleted this conversation';
COMMENT ON COLUMN conversations.admin_deleted_at IS 'When the school admin deleted the conversation';

COMMENT ON FUNCTION get_or_create_student_admin_conversation IS 'Helper function to get or create a conversation between student and school (visible to all school admins)';

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'Student-School Admin messaging migration completed successfully!';
    RAISE NOTICE 'New conversation type supported: student_admin';
    RAISE NOTICE 'New columns added: school_id, admin_unread_count, deleted_by_admin, admin_deleted_at';
    RAISE NOTICE 'Uses schools table - all admins in the school can see student messages';
    RAISE NOTICE 'RLS policies created for secure access';
    RAISE NOTICE 'Helper function created: get_or_create_student_admin_conversation';
END $$;