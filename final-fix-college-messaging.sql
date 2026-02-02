-- FINAL FIX: Handle existing constraints gracefully
-- Only add what doesn't exist, update what needs updating

-- STEP 1: Remove the foreign key constraint that's blocking college educators
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_educator_id_fkey;

-- STEP 2: Add new columns only if they don't exist
DO $$
BEGIN
    -- Add program_section_id to conversations if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'program_section_id') THEN
        ALTER TABLE conversations ADD COLUMN program_section_id UUID NULL;
    END IF;
    
    -- Add college_educator_unread_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'college_educator_unread_count') THEN
        ALTER TABLE conversations ADD COLUMN college_educator_unread_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add deleted_by_college_educator if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'deleted_by_college_educator') THEN
        ALTER TABLE conversations ADD COLUMN deleted_by_college_educator BOOLEAN DEFAULT false;
    END IF;
    
    -- Add college_educator_deleted_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'conversations' AND column_name = 'college_educator_deleted_at') THEN
        ALTER TABLE conversations ADD COLUMN college_educator_deleted_at TIMESTAMP WITH TIME ZONE NULL;
    END IF;
    
    -- Add program_section_id to messages if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'messages' AND column_name = 'program_section_id') THEN
        ALTER TABLE messages ADD COLUMN program_section_id UUID NULL;
    END IF;
END $$;

-- STEP 3: Add foreign key constraints only if they don't exist
DO $$
BEGIN
    -- Add conversations foreign key constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'conversations_program_section_id_fkey') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_sections') THEN
            ALTER TABLE conversations ADD CONSTRAINT conversations_program_section_id_fkey 
            FOREIGN KEY (program_section_id) REFERENCES program_sections (id) ON DELETE SET NULL;
        END IF;
    END IF;
    
    -- Add messages foreign key constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'messages_program_section_id_fkey') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_sections') THEN
            ALTER TABLE messages ADD CONSTRAINT messages_program_section_id_fkey 
            FOREIGN KEY (program_section_id) REFERENCES program_sections (id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- STEP 4: Update CHECK constraints (these need to be replaced)
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_participant_check CHECK (
  -- Student-Recruiter conversations
  ((student_id IS NOT NULL) AND (recruiter_id IS NOT NULL) AND 
   (educator_id IS NULL) AND (school_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'student_recruiter')) OR
  -- Student-School Educator conversations  
  ((student_id IS NOT NULL) AND (educator_id IS NOT NULL) AND 
   (recruiter_id IS NULL) AND (school_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'student_educator')) OR
  -- Student-School Admin conversations
  ((student_id IS NOT NULL) AND (school_id IS NOT NULL) AND 
   (recruiter_id IS NULL) AND (educator_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'student_admin')) OR
  -- Student-College Admin conversations
  ((student_id IS NOT NULL) AND (college_id IS NOT NULL) AND 
   (recruiter_id IS NULL) AND (educator_id IS NULL) AND (school_id IS NULL) AND 
   (conversation_type = 'student_college_admin')) OR
  -- Educator-Recruiter conversations
  ((student_id IS NOT NULL) AND (recruiter_id IS NOT NULL) AND (educator_id IS NOT NULL) AND 
   (school_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'educator_recruiter')) OR
  -- Educator-School Admin conversations
  ((student_id IS NULL) AND (educator_id IS NOT NULL) AND (school_id IS NOT NULL) AND 
   (recruiter_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'educator_admin')) OR
  -- NEW: Student-College Educator conversations
  ((student_id IS NOT NULL) AND (educator_id IS NOT NULL) AND (college_id IS NOT NULL) AND
   (recruiter_id IS NULL) AND (school_id IS NULL) AND 
   (conversation_type = 'student_college_educator'))
);

-- Update message constraints
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_type_check;

ALTER TABLE messages ADD CONSTRAINT messages_sender_type_check CHECK (
  sender_type = ANY (ARRAY[
    'student'::text,
    'recruiter'::text, 
    'educator'::text,
    'college_educator'::text,
    'school_admin'::text,
    'college_admin'::text
  ])
);

ALTER TABLE messages ADD CONSTRAINT messages_receiver_type_check CHECK (
  receiver_type = ANY (ARRAY[
    'student'::text,
    'recruiter'::text,
    'educator'::text, 
    'college_educator'::text,
    'school_admin'::text,
    'college_admin'::text
  ])
);

-- STEP 5: Add indexes (these are safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_conversations_program_section_id ON conversations USING btree (program_section_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student_college_educator ON conversations USING btree 
(student_id, educator_id, college_id, conversation_type) 
WHERE conversation_type = 'student_college_educator';
CREATE INDEX IF NOT EXISTS idx_messages_program_section_id ON messages USING btree (program_section_id);
CREATE INDEX IF NOT EXISTS idx_conversations_college_educator_unread ON conversations USING btree 
(college_educator_unread_count) WHERE college_educator_unread_count > 0;
CREATE INDEX IF NOT EXISTS idx_conversations_college_educator_active ON conversations USING btree 
(educator_id, status, deleted_by_college_educator) 
WHERE conversation_type = 'student_college_educator';