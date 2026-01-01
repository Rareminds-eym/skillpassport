-- Fix: Make student_id nullable in conversations table for educator-admin conversations
-- This allows educator-admin conversations to exist without a student_id

-- Step 1: Make student_id nullable
ALTER TABLE conversations ALTER COLUMN student_id DROP NOT NULL;

-- Step 2: Drop the existing constraint that requires student_id to be not null
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_check;

-- Step 3: Add updated constraint that allows student_id to be NULL for educator_admin conversations
ALTER TABLE conversations ADD CONSTRAINT conversations_participant_check CHECK (
    (
        -- student_recruiter: requires student_id, recruiter_id
        (student_id IS NOT NULL AND recruiter_id IS NOT NULL AND educator_id IS NULL AND school_id IS NULL AND college_id IS NULL AND conversation_type = 'student_recruiter')
        OR
        -- student_educator: requires student_id, educator_id  
        (student_id IS NOT NULL AND educator_id IS NOT NULL AND recruiter_id IS NULL AND school_id IS NULL AND college_id IS NULL AND conversation_type = 'student_educator')
        OR
        -- student_admin: requires student_id, school_id
        (student_id IS NOT NULL AND school_id IS NOT NULL AND recruiter_id IS NULL AND educator_id IS NULL AND college_id IS NULL AND conversation_type = 'student_admin')
        OR
        -- student_college_admin: requires student_id, college_id
        (student_id IS NOT NULL AND college_id IS NOT NULL AND recruiter_id IS NULL AND educator_id IS NULL AND school_id IS NULL AND conversation_type = 'student_college_admin')
        OR
        -- educator_recruiter: requires student_id, recruiter_id, educator_id
        (student_id IS NOT NULL AND recruiter_id IS NOT NULL AND educator_id IS NOT NULL AND school_id IS NULL AND college_id IS NULL AND conversation_type = 'educator_recruiter')
        OR
        -- educator_admin: NO student_id required, requires educator_id, school_id
        (student_id IS NULL AND educator_id IS NOT NULL AND school_id IS NOT NULL AND recruiter_id IS NULL AND college_id IS NULL AND conversation_type = 'educator_admin')
    )
);

-- Step 4: Drop and recreate the function
DROP FUNCTION IF EXISTS get_or_create_educator_admin_conversation(UUID, UUID, TEXT);

-- Step 5: Recreate the function with explicit NULL for student_id
CREATE OR REPLACE FUNCTION get_or_create_educator_admin_conversation(
    p_educator_id UUID,
    p_school_id UUID,
    p_subject TEXT DEFAULT 'General Discussion'
)
RETURNS TABLE(conversation_id TEXT) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    existing_conversation_id TEXT;
    new_conversation_id TEXT;
BEGIN
    -- Try to find existing conversation
    SELECT id INTO existing_conversation_id
    FROM conversations
    WHERE educator_id = p_educator_id 
      AND school_id = p_school_id
      AND conversation_type = 'educator_admin'
      AND (p_subject IS NULL OR subject = p_subject)
    LIMIT 1;
    
    IF existing_conversation_id IS NOT NULL THEN
        -- If conversation was soft deleted, restore it
        UPDATE conversations 
        SET deleted_by_educator = FALSE,
            deleted_by_admin = FALSE,
            educator_deleted_at = NULL,
            admin_deleted_at = NULL,
            updated_at = NOW()
        WHERE id = existing_conversation_id;
        
        RETURN QUERY SELECT existing_conversation_id;
    ELSE
        -- Create new conversation with explicit NULL for student_id
        new_conversation_id := 'conv_ea_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 9);
        
        INSERT INTO conversations (
            id,
            student_id,
            educator_id,
            school_id,
            recruiter_id,
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
            NULL,
            p_educator_id,
            p_school_id,
            NULL,
            p_subject,
            'educator_admin',
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
$$;

-- Step 6: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_or_create_educator_admin_conversation TO authenticated;