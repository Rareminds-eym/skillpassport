-- Career AI: Per-user 2-message limit enforcement
-- Two SECURITY DEFINER RPC functions with pg_advisory_xact_lock for race-condition-proof quota enforcement

-- Count user messages across all conversations for a learner (pre-check)
CREATE OR REPLACE FUNCTION count_career_ai_user_messages(p_learner_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  total int;
BEGIN
  SELECT COUNT(*) INTO total
  FROM career_ai_conversations c,
       jsonb_array_elements(c.messages) AS msg
  WHERE c.learner_id = p_learner_id
    AND msg->>'role' = 'user';
  RETURN COALESCE(total, 0);
END;
$$;

-- Atomically check quota and save messages (race-condition-proof)
-- p_learner_id is sourced from authenticated session (middleware), never from client payload
CREATE OR REPLACE FUNCTION save_career_ai_message(
  p_learner_id uuid,
  p_conversation_id uuid,
  p_title text,
  p_messages jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  user_count int;
  conv_id uuid;
BEGIN
  -- Serialize concurrent requests per learner
  PERFORM pg_advisory_xact_lock(hashtext(p_learner_id::text));

  -- Count existing user messages across ALL conversations
  SELECT COUNT(*) INTO user_count
  FROM career_ai_conversations c,
       jsonb_array_elements(c.messages) AS msg
  WHERE c.learner_id = p_learner_id
    AND msg->>'role' = 'user';

  -- Count new user messages being added in this batch
  user_count := user_count + (
    SELECT COUNT(*) FROM jsonb_array_elements(p_messages) AS m
    WHERE m->>'role' = 'user'
  );

  IF user_count > 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'QUOTA_EXCEEDED');
  END IF;

  IF p_conversation_id IS NOT NULL THEN
    UPDATE career_ai_conversations
    SET messages = COALESCE(messages, '[]'::jsonb) || p_messages,
        updated_at = now()
    WHERE id = p_conversation_id AND learner_id = p_learner_id;
    RETURN jsonb_build_object('success', true, 'conversation_id', p_conversation_id);
  ELSE
    INSERT INTO career_ai_conversations (learner_id, title, messages)
    VALUES (p_learner_id, p_title, p_messages)
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO conv_id;
    RETURN jsonb_build_object('success', true, 'conversation_id', conv_id);
  END IF;
END;
$$;
