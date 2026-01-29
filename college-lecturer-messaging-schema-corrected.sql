-- Add program_section_id to conversations table for college lecturer context
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS program_section_id UUID NULL;

-- Add foreign key constraint for program_section_id
ALTER TABLE conversations ADD CONSTRAINT conversations_program_section_id_fkey 
FOREIGN KEY (program_section_id) REFERENCES program_sections (id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_program_section_id ON conversations USING btree (program_section_id);

-- Drop existing participant check constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_check;

-- Add updated constraint with student_college_educator type
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

-- Add specialized index for college educator conversations
CREATE INDEX IF NOT EXISTS idx_conversations_student_college_educator ON conversations USING btree 
(student_id, educator_id, college_id, conversation_type) 
WHERE conversation_type = 'student_college_educator';

-- Drop existing message type constraints
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_type_check;

-- Add updated constraints with college_educator type
ALTER TABLE messages ADD CONSTRAINT messages_sender_type_check CHECK (
  sender_type = ANY (ARRAY[
    'student'::text,
    'recruiter'::text, 
    'educator'::text,
    'college_educator'::text,  -- NEW
    'school_admin'::text,
    'college_admin'::text
  ])
);

ALTER TABLE messages ADD CONSTRAINT messages_receiver_type_check CHECK (
  receiver_type = ANY (ARRAY[
    'student'::text,
    'recruiter'::text,
    'educator'::text, 
    'college_educator'::text,  -- NEW
    'school_admin'::text,
    'college_admin'::text
  ])
);

-- Add program_section_id to messages for context (optional)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS program_section_id UUID NULL;

-- Add foreign key constraint for messages
ALTER TABLE messages ADD CONSTRAINT messages_program_section_id_fkey 
FOREIGN KEY (program_section_id) REFERENCES program_sections (id) ON DELETE SET NULL;

-- Add index for messages program_section_id
CREATE INDEX IF NOT EXISTS idx_messages_program_section_id ON messages USING btree (program_section_id);

-- Add college educator unread count columns to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS college_educator_unread_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_by_college_educator BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS college_educator_deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- Add index for college educator unread messages
CREATE INDEX IF NOT EXISTS idx_conversations_college_educator_unread ON conversations USING btree 
(college_educator_unread_count) WHERE college_educator_unread_count > 0;

-- Add index for college educator active conversations
CREATE INDEX IF NOT EXISTS idx_conversations_college_educator_active ON conversations USING btree 
(educator_id, status, deleted_by_college_educator) 
WHERE conversation_type = 'student_college_educator';