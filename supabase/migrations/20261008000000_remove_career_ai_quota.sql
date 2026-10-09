-- Career AI: remove 2-message limit (unlimited chat).
-- Redefines save_career_ai_message without the user_count > 2 gate.
-- count_career_ai_user_messages is kept for analytics but no longer gates writes.

CREATE OR REPLACE FUNCTION save_career_ai_message(
  p_learner_id uuid,
  p_conversation_id uuid,
  p_title text,
  p_messages jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  conv_id uuid;
BEGIN
  IF p_conversation_id IS NOT NULL THEN
    UPDATE career_ai_conversations
    SET messages = COALESCE(messages, '[]'::jsonb) || p_messages,
        updated_at = now()
    WHERE id = p_conversation_id AND learner_id = p_learner_id;
    RETURN jsonb_build_object('success', true, 'conversation_id', p_conversation_id);
  ELSE
    INSERT INTO career_ai_conversations (learner_id, title, messages)
    VALUES (p_learner_id, p_title, p_messages)
    RETURNING id INTO conv_id;
    IF conv_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'FAILED_TO_CREATE_CONVERSATION');
    END IF;
    RETURN jsonb_build_object('success', true, 'conversation_id', conv_id);
  END IF;
END;
$$;
