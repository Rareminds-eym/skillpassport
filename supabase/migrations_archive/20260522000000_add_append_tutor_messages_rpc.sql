-- Create RPC function for atomic message appending to tutor_conversations
-- This prevents race conditions when multiple requests try to update the same conversation

CREATE OR REPLACE FUNCTION append_tutor_messages(
  p_conversation_id UUID,
  p_learner_id UUID,
  p_new_messages JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomically append new messages to the existing messages array
  UPDATE tutor_conversations
  SET 
    messages = COALESCE(messages, '[]'::jsonb) || p_new_messages,
    updated_at = NOW()
  WHERE 
    id = p_conversation_id 
    AND learner_id = p_learner_id;
    
  -- Raise exception if no rows were updated (conversation not found or wrong learner)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found or access denied';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION append_tutor_messages(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION append_tutor_messages(UUID, UUID, JSONB) TO service_role;
