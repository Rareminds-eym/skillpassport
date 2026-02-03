-- STEP 1: Remove the foreign key constraint that's blocking college educators
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_educator_id_fkey;

-- STEP 2: Add new columns
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS program_section_id UUID NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS college_educator_unread_count INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_by_college_educator BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS college_educator_deleted_at TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS program_section_id UUID NULL;

-- STEP 3: Add foreign key constraints for program_section_id
ALTER TABLE conversations ADD CONSTRAINT conversations_program_section_id_fkey 
FOREIGN KEY (program_section_id) REFERENCES program_sections (id) ON DELETE SET NULL;

ALTER TABLE messages ADD CONSTRAINT messages_program_section_id_fkey 
FOREIGN KEY (program_section_id) REFERENCES program_sections (id) ON DELETE SET NULL;

-- STEP 4: Update existing CHECK constraints to include new types
-- First, get the current constraint definition and modify it
-- We'll replace the existing constraints with updated versions

-- For conversations - we need to modify the existing constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_participant_check CHECK (
  -- Keep all existing conversation types
  ((student_id IS NOT NULL) AND (recruiter_id IS NOT NULL) AND 
   (educator_id IS NULL) AND (school_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'student_recruiter')) OR
  ((student_id IS NOT NULL) AND (educator_id IS NOT NULL) AND 
   (recruiter_id IS NULL) AND (school_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'student_educator')) OR
  ((student_id IS NOT NULL) AND (school_id IS NOT NULL) AND 
   (recruiter_id IS NULL) AND (educator_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'student_admin')) OR
  ((student_id IS NOT NULL) AND (college_id IS NOT NULL) AND 
   (recruiter_id IS NULL) AND (educator_id IS NULL) AND (school_id IS NULL) AND 
   (conversation_type = 'student_college_admin')) OR
  ((student_id IS NOT NULL) AND (recruiter_id IS NOT NULL) AND (educator_id IS NOT NULL) AND 
   (school_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'educator_recruiter')) OR
  ((student_id IS NULL) AND (educator_id IS NOT NULL) AND (school_id IS NOT NULL) AND 
   (recruiter_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'educator_admin')) OR
  -- ADD: Student-College Educator conversations
  ((student_id IS NOT NULL) AND (educator_id IS NOT NULL) AND (college_id IS NOT NULL) AND
   (recruiter_id IS NULL) AND (school_id IS NULL) AND 
   (conversation_type = 'student_college_educator'))
);

-- For messages - update to include college_educator
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_type_check;

ALTER TABLE messages ADD CONSTRAINT messages_sender_type_check CHECK (
  sender_type = ANY (ARRAY[
    'student'::text,
    'recruiter'::text, 
    'educator'::text,
    'college_educator'::text,  -- ADD THIS
    'school_admin'::text,
    'college_admin'::text
  ])
);

ALTER TABLE messages ADD CONSTRAINT messages_receiver_type_check CHECK (
  receiver_type = ANY (ARRAY[
    'student'::text,
    'recruiter'::text,
    'educator'::text, 
    'college_educator'::text,  -- ADD THIS
    'school_admin'::text,
    'college_admin'::text
  ])
);

-- STEP 5: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_program_section_id ON conversations USING btree (program_section_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student_college_educator ON conversations USING btree 
(student_id, educator_id, college_id, conversation_type) 
WHERE conversation_type = 'student_college_educator';
CREATE INDEX IF NOT EXISTS idx_messages_program_section_id ON conversations USING btree (program_section_id);
CREATE INDEX IF NOT EXISTS idx_conversations_college_educator_unread ON conversations USING btree 
(college_educator_unread_count) WHERE college_educator_unread_count > 0;
CREATE INDEX IF NOT EXISTS idx_conversations_college_educator_active ON conversations USING btree 
(educator_id, status, deleted_by_college_educator) 
WHERE conversation_type = 'student_college_educator';