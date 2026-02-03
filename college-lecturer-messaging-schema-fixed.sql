-- Add program_section_id to link conversations to specific program sections
ALTER TABLE conversations ADD COLUMN program_section_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE conversations ADD CONSTRAINT conversations_program_section_id_fkey 
FOREIGN KEY (program_section_id) REFERENCES program_sections (id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_conversations_program_section_id ON conversations USING btree (program_section_id);

-- Drop existing constraint to update it
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_check;

-- Add updated constraint with all conversation types
ALTER TABLE conversations ADD CONSTRAINT conversations_participant_check CHECK (
  -- Student-Recruiter conversations
  ((student_id IS NOT NULL) AND (recruiter_id IS NOT NULL) AND 
   (educator_id IS NULL) AND (school_id IS NULL) AND (college_id IS NULL) AND 
   (program_section_id IS NULL) AND (conversation_type = 'student_recruiter')) OR
  
  -- Student-School Educator conversations
  ((student_id IS NOT NULL) AND (educator_id IS NOT NULL) AND (school_id IS NOT NULL) AND
   (recruiter_id IS NULL) AND (college_id IS NULL) AND 
   (program_section_id IS NULL) AND (conversation_type = 'student_educator')) OR
  
  -- Educator-Recruiter conversations
  ((educator_id IS NOT NULL) AND (recruiter_id IS NOT NULL) AND 
   (student_id IS NULL) AND (school_id IS NULL) AND (college_id IS NULL) AND
   (program_section_id IS NULL) AND (conversation_type = 'educator_recruiter')) OR
  
  -- Student-School Admin conversations
  ((student_id IS NOT NULL) AND (school_id IS NOT NULL) AND
   (educator_id IS NULL) AND (recruiter_id IS NULL) AND (college_id IS NULL) AND
   (program_section_id IS NULL) AND (conversation_type = 'student_admin')) OR
  
  -- Educator-School Admin conversations
  ((educator_id IS NOT NULL) AND (school_id IS NOT NULL) AND
   (student_id IS NULL) AND (recruiter_id IS NULL) AND (college_id IS NULL) AND
   (program_section_id IS NULL) AND (conversation_type = 'educator_admin')) OR
  
  -- Student-College Admin conversations
  ((student_id IS NOT NULL) AND (college_id IS NOT NULL) AND
   (educator_id IS NULL) AND (recruiter_id IS NULL) AND (school_id IS NULL) AND
   (program_section_id IS NULL) AND (conversation_type = 'student_college_admin')) OR
  
  -- NEW: Student-College Educator conversations
  ((student_id IS NOT NULL) AND (educator_id IS NOT NULL) AND (college_id IS NOT NULL) AND
   (recruiter_id IS NULL) AND (school_id IS NULL) AND 
   (conversation_type = 'student_college_educator'))
);

-- Add specialized index for college educator conversations
CREATE INDEX idx_conversations_student_college_educator ON conversations USING btree 
(student_id, educator_id, college_id, conversation_type) 
WHERE conversation_type = 'student_college_educator';

-- Drop existing message constraints
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_type_check;

-- Add updated constraints with college_educator
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
ALTER TABLE messages ADD COLUMN program_section_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE messages ADD CONSTRAINT messages_program_section_id_fkey 
FOREIGN KEY (program_section_id) REFERENCES program_sections (id) ON DELETE SET NULL;

-- Add index
CREATE INDEX idx_messages_program_section_id ON messages USING btree (program_section_id);