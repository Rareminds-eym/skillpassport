-- Add college educator to college admin messaging support
-- This follows the same pattern as school educator to school admin

-- First, update the conversation constraints to include the new type
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_check;

-- Add updated constraint with college educator to college admin conversations
-- Based on your existing constraint pattern
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
  
  -- Student-Recruiter-Educator conversations (3-way)
  ((student_id IS NOT NULL) AND (recruiter_id IS NOT NULL) AND (educator_id IS NOT NULL) AND 
   (school_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'educator_recruiter')) OR
  
  -- Educator-School Admin conversations
  ((student_id IS NULL) AND (educator_id IS NOT NULL) AND (school_id IS NOT NULL) AND 
   (recruiter_id IS NULL) AND (college_id IS NULL) AND 
   (conversation_type = 'educator_admin')) OR
  
  -- Student-College Educator conversations
  ((student_id IS NOT NULL) AND (educator_id IS NOT NULL) AND (college_id IS NOT NULL) AND 
   (recruiter_id IS NULL) AND (school_id IS NULL) AND 
   (conversation_type = 'student_college_educator')) OR
   
  -- NEW: College Educator-College Admin conversations
  ((student_id IS NULL) AND (educator_id IS NOT NULL) AND (college_id IS NOT NULL) AND
   (recruiter_id IS NULL) AND (school_id IS NULL) AND 
   (conversation_type = 'college_educator_admin'))
);

-- Add specialized indexes for college educator to admin conversations
CREATE INDEX IF NOT EXISTS idx_conversations_college_educator_admin ON conversations USING btree 
(educator_id, college_id, conversation_type) TABLESPACE pg_default
WHERE conversation_type = 'college_educator_admin';

CREATE INDEX IF NOT EXISTS idx_conversations_college_educator_admin_active ON conversations USING btree 
(educator_id, status, deleted_by_educator) TABLESPACE pg_default
WHERE conversation_type = 'college_educator_admin';

CREATE INDEX IF NOT EXISTS idx_conversations_college_admin_educator_active ON conversations USING btree 
(college_id, status, deleted_by_college_admin) TABLESPACE pg_default
WHERE conversation_type = 'college_educator_admin';

-- Create database function for college educator to admin conversations
-- Following the same pattern as existing functions
CREATE OR REPLACE FUNCTION get_or_create_college_educator_admin_conversation(
  p_educator_id UUID,
  p_college_id UUID,
  p_subject TEXT DEFAULT 'General Discussion'
)
RETURNS TABLE(conversation_id TEXT) AS $$
DECLARE
  existing_conversation_id TEXT;
  new_conversation_id TEXT;
BEGIN
  -- Check for existing conversation
  SELECT id INTO existing_conversation_id
  FROM conversations
  WHERE educator_id = p_educator_id
    AND college_id = p_college_id
    AND conversation_type = 'college_educator_admin'
    AND (subject = p_subject OR (subject IS NULL AND p_subject = 'General Discussion'))
  LIMIT 1;
  
  IF existing_conversation_id IS NOT NULL THEN
    -- Return existing conversation
    RETURN QUERY SELECT existing_conversation_id;
  ELSE
    -- Create new conversation
    new_conversation_id := 'conv_cea_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 9);
    
    INSERT INTO conversations (
      id,
      educator_id,
      college_id,
      subject,
      conversation_type,
      status,
      created_at,
      updated_at
    ) VALUES (
      new_conversation_id,
      p_educator_id,
      p_college_id,
      p_subject,
      'college_educator_admin',
      'active',
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    );
    
    RETURN QUERY SELECT new_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;