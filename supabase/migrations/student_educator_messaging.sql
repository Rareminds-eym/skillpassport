-- Migration: Add support for student-educator messaging
-- This extends the existing messaging system to support conversations between students and educators
-- Uses school-based tables: school_classes, school_educators, school_educator_class_assignments

-- First, let's check if the conversations table exists and add missing columns
DO $$ 
BEGIN
    -- Add educator_id column if it doesn't exist (references school_educators)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'educator_id') THEN
        ALTER TABLE conversations ADD COLUMN educator_id UUID REFERENCES school_educators(id);
    END IF;
    
    -- Add class_id column if it doesn't exist (references school_classes)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'class_id') THEN
        ALTER TABLE conversations ADD COLUMN class_id UUID REFERENCES school_classes(id);
    END IF;
    
    -- Add subject column for the specific subject being discussed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'subject') THEN
        ALTER TABLE conversations ADD COLUMN subject VARCHAR(100);
    END IF;
    
    -- Add conversation_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'conversation_type') THEN
        ALTER TABLE conversations ADD COLUMN conversation_type VARCHAR(50) DEFAULT 'student_recruiter';
    END IF;
    
    -- Add educator_unread_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'educator_unread_count') THEN
        ALTER TABLE conversations ADD COLUMN educator_unread_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add soft delete columns for educator if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'deleted_by_educator') THEN
        ALTER TABLE conversations ADD COLUMN deleted_by_educator BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'educator_deleted_at') THEN
        ALTER TABLE conversations ADD COLUMN educator_deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add class_id and subject to messages table if they don't exist
DO $$ 
BEGIN
    -- Add class_id column to messages if it doesn't exist (references school_classes)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'class_id') THEN
        ALTER TABLE messages ADD COLUMN class_id UUID REFERENCES school_classes(id);
    END IF;
    
    -- Add subject column to messages if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'subject') THEN
        ALTER TABLE messages ADD COLUMN subject VARCHAR(100);
    END IF;
END $$;

-- Update sender_type and receiver_type enums to include 'educator'
-- Note: This assumes the columns are VARCHAR, not actual ENUMs
-- If they are ENUMs, you'll need to alter the type first

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_educator_id ON conversations(educator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_class_id ON conversations(class_id);
CREATE INDEX IF NOT EXISTS idx_conversations_subject ON conversations(subject);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_educator_unread ON conversations(educator_unread_count) WHERE educator_unread_count > 0;

CREATE INDEX IF NOT EXISTS idx_messages_class_id ON messages(class_id);
CREATE INDEX IF NOT EXISTS idx_messages_subject ON messages(subject);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_type ON messages(receiver_type);

-- Create a composite index for student-educator conversations
CREATE INDEX IF NOT EXISTS idx_conversations_student_educator ON conversations(student_id, educator_id, conversation_type) 
WHERE conversation_type = 'student_educator';

-- Create a composite index for educator conversations
CREATE INDEX IF NOT EXISTS idx_conversations_educator_active ON conversations(educator_id, status, deleted_by_educator) 
WHERE conversation_type = 'student_educator';

-- Update existing conversations to have the correct type
UPDATE conversations 
SET conversation_type = 'student_recruiter' 
WHERE conversation_type IS NULL AND recruiter_id IS NOT NULL;

-- First, we need to make recruiter_id nullable for student-educator conversations
DO $$
BEGIN
    -- Drop the NOT NULL constraint on recruiter_id if it exists
    BEGIN
        ALTER TABLE conversations ALTER COLUMN recruiter_id DROP NOT NULL;
    EXCEPTION
        WHEN others THEN
            -- Ignore if constraint doesn't exist or other errors
            NULL;
    END;
END $$;

-- Add constraints to ensure data integrity
-- A conversation must have either a recruiter_id or educator_id, but not both
DO $$ 
BEGIN
    -- Add check constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'conversations_participant_check') THEN
        ALTER TABLE conversations 
        ADD CONSTRAINT conversations_participant_check 
        CHECK (
            (recruiter_id IS NOT NULL AND educator_id IS NULL AND conversation_type = 'student_recruiter') OR
            (educator_id IS NOT NULL AND recruiter_id IS NULL AND conversation_type = 'student_educator') OR
            (recruiter_id IS NOT NULL AND educator_id IS NOT NULL AND conversation_type = 'educator_recruiter')
        );
    END IF;
END $$;

-- Create a function to automatically update unread counts
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating unread counts
DROP TRIGGER IF EXISTS trigger_update_conversation_unread_count ON messages;
CREATE TRIGGER trigger_update_conversation_unread_count
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_unread_count();

-- Create RLS policies for student-educator conversations
-- Enable RLS on conversations table if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
    -- Drop conversation policies if they exist
    DROP POLICY IF EXISTS "Students can view their educator conversations" ON conversations;
    DROP POLICY IF EXISTS "Educators can view their student conversations" ON conversations;
    DROP POLICY IF EXISTS "Students can create educator conversations" ON conversations;
    DROP POLICY IF EXISTS "Educators can create student conversations" ON conversations;
    DROP POLICY IF EXISTS "Students can update their educator conversations" ON conversations;
    DROP POLICY IF EXISTS "Educators can update their student conversations" ON conversations;
    
    -- Drop message policies if they exist
    DROP POLICY IF EXISTS "Students can view educator conversation messages" ON messages;
    DROP POLICY IF EXISTS "Educators can view student conversation messages" ON messages;
    DROP POLICY IF EXISTS "Students can send messages to educators" ON messages;
    DROP POLICY IF EXISTS "Educators can send messages to students" ON messages;
    DROP POLICY IF EXISTS "Users can update their received messages" ON messages;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Ignore if policies don't exist
END $$;

-- Enable RLS on messages table if not already enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create conversation policies
CREATE POLICY "Students can view their educator conversations" ON conversations
    FOR SELECT USING (
        student_id = auth.uid() AND 
        conversation_type = 'student_educator' AND 
        (deleted_by_student IS NULL OR deleted_by_student = FALSE)
    );

CREATE POLICY "Educators can view their student conversations" ON conversations
    FOR SELECT USING (
        educator_id = auth.uid() AND 
        conversation_type = 'student_educator' AND 
        (deleted_by_educator IS NULL OR deleted_by_educator = FALSE)
    );

CREATE POLICY "Students can create educator conversations" ON conversations
    FOR INSERT WITH CHECK (
        student_id = auth.uid() AND 
        conversation_type = 'student_educator'
    );

CREATE POLICY "Educators can create student conversations" ON conversations
    FOR INSERT WITH CHECK (
        educator_id = auth.uid() AND 
        conversation_type = 'student_educator'
    );

CREATE POLICY "Students can update their educator conversations" ON conversations
    FOR UPDATE USING (
        student_id = auth.uid() AND 
        conversation_type = 'student_educator'
    );

CREATE POLICY "Educators can update their student conversations" ON conversations
    FOR UPDATE USING (
        educator_id = auth.uid() AND 
        conversation_type = 'student_educator'
    );

-- Create message policies
CREATE POLICY "Students can view educator conversation messages" ON messages
    FOR SELECT USING (
        (sender_id = auth.uid() AND sender_type = 'student') OR
        (receiver_id = auth.uid() AND receiver_type = 'student')
    );

CREATE POLICY "Educators can view student conversation messages" ON messages
    FOR SELECT USING (
        (sender_id = auth.uid() AND sender_type = 'educator') OR
        (receiver_id = auth.uid() AND receiver_type = 'educator')
    );

CREATE POLICY "Students can send messages to educators" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND 
        sender_type = 'student' AND 
        receiver_type = 'educator'
    );

CREATE POLICY "Educators can send messages to students" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND 
        sender_type = 'educator' AND 
        receiver_type = 'student'
    );

CREATE POLICY "Users can update their received messages" ON messages
    FOR UPDATE USING (
        receiver_id = auth.uid()
    );

-- Create a helper function to get student-educator conversation
CREATE OR REPLACE FUNCTION get_or_create_student_educator_conversation(
    p_student_id UUID,
    p_educator_id UUID,
    p_class_id UUID DEFAULT NULL,
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
      AND educator_id = p_educator_id
      AND conversation_type = 'student_educator'
      AND (p_class_id IS NULL OR class_id = p_class_id)
      AND (p_subject IS NULL OR subject = p_subject)
    LIMIT 1;
    
    IF existing_conversation_id IS NOT NULL THEN
        -- If conversation was soft deleted, restore it
        UPDATE conversations 
        SET deleted_by_student = FALSE,
            deleted_by_educator = FALSE,
            student_deleted_at = NULL,
            educator_deleted_at = NULL,
            updated_at = NOW()
        WHERE id = existing_conversation_id;
        
        RETURN QUERY SELECT existing_conversation_id;
    ELSE
        -- Create new conversation
        new_conversation_id := 'conv_se_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 9);
        
        INSERT INTO conversations (
            id,
            student_id,
            educator_id,
            class_id,
            subject,
            conversation_type,
            status,
            student_unread_count,
            recruiter_unread_count,
            educator_unread_count,
            created_at,
            updated_at
        ) VALUES (
            new_conversation_id,
            p_student_id,
            p_educator_id,
            p_class_id,
            p_subject,
            'student_educator',
            'active',
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
GRANT EXECUTE ON FUNCTION get_or_create_student_educator_conversation TO authenticated;

-- Create sample data for testing (optional)
-- This creates a few sample student-educator conversations
-- Uncomment if you want to test with sample data

/*
-- Insert sample student-educator conversations
INSERT INTO conversations (
    id,
    student_id,
    educator_id,
    course_id,
    subject,
    conversation_type,
    status,
    student_unread_count,
    recruiter_unread_count,
    educator_unread_count,
    created_at,
    updated_at
) VALUES 
(
    'conv_se_sample_1',
    (SELECT id FROM students LIMIT 1),
    (SELECT id FROM educators LIMIT 1),
    (SELECT id FROM courses LIMIT 1),
    'Mathematics Discussion',
    'student_educator',
    'active',
    0,
    0,
    0,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample messages
INSERT INTO messages (
    conversation_id,
    sender_id,
    sender_type,
    receiver_id,
    receiver_type,
    message_text,
    course_id,
    is_read,
    created_at,
    updated_at
) VALUES 
(
    'conv_se_sample_1',
    (SELECT id FROM students LIMIT 1),
    'student',
    (SELECT id FROM educators LIMIT 1),
    'educator',
    'Hello, I have a question about today''s assignment.',
    (SELECT id FROM courses LIMIT 1),
    FALSE,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;
*/

-- Add comments for documentation
COMMENT ON COLUMN conversations.educator_id IS 'Reference to school_educators for student-educator conversations';
COMMENT ON COLUMN conversations.class_id IS 'Reference to school_classes for class context';
COMMENT ON COLUMN conversations.subject IS 'Subject being discussed (from school_educator_class_assignments)';
COMMENT ON COLUMN conversations.conversation_type IS 'Type of conversation: student_recruiter, student_educator, or educator_recruiter';
COMMENT ON COLUMN conversations.educator_unread_count IS 'Number of unread messages for the educator';
COMMENT ON COLUMN conversations.deleted_by_educator IS 'Whether the educator has soft-deleted this conversation';
COMMENT ON COLUMN conversations.educator_deleted_at IS 'When the educator deleted the conversation';

COMMENT ON COLUMN messages.class_id IS 'Reference to school_classes for class context';
COMMENT ON COLUMN messages.subject IS 'Subject being discussed (from school_educator_class_assignments)';

COMMENT ON FUNCTION get_or_create_student_educator_conversation IS 'Helper function to get or create a conversation between student and educator';

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'Student-Educator messaging migration completed successfully!';
    RAISE NOTICE 'New conversation types supported: student_recruiter, student_educator, educator_recruiter';
    RAISE NOTICE 'New columns added: educator_id, class_id, subject, conversation_type, educator_unread_count';
    RAISE NOTICE 'Uses school-based tables: school_classes, school_educators, school_educator_class_assignments';
    RAISE NOTICE 'RLS policies created for secure access';
    RAISE NOTICE 'Helper function created: get_or_create_student_educator_conversation';
END $$;