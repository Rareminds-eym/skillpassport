-- Preparation only: deployment requires approval for the target database.
-- A conversation can be deleted after the handler's ownership read while AI is
-- streaming. A zero-row UPDATE must never acknowledge the turn as saved.
-- Preserve the existing quota policy and RPC response contract. Commercial
-- AI-credit settlement is a separate unresolved integration, not changed here.
CREATE OR REPLACE FUNCTION public.save_career_ai_message(
  p_learner_id uuid,
  p_conversation_id uuid,
  p_title text,
  p_messages jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  user_count int;
  conv_id uuid;
BEGIN
  -- Serialize concurrent requests per learner
  PERFORM pg_advisory_xact_lock(hashtext(p_learner_id::text));

  -- Count existing user messages across ALL conversations
  SELECT COUNT(*) INTO user_count
  FROM public.career_ai_conversations c,
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
    UPDATE public.career_ai_conversations
    SET messages = COALESCE(messages, '[]'::jsonb) || p_messages,
        updated_at = now()
    WHERE id = p_conversation_id AND learner_id = p_learner_id
    RETURNING id INTO conv_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'CONVERSATION_NOT_FOUND');
    END IF;
    RETURN jsonb_build_object('success', true, 'conversation_id', conv_id);
  ELSE
    INSERT INTO public.career_ai_conversations (learner_id, title, messages)
    VALUES (p_learner_id, p_title, p_messages)
    RETURNING id INTO conv_id;
    IF conv_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'FAILED_TO_CREATE_CONVERSATION');
    END IF;
    RETURN jsonb_build_object('success', true, 'conversation_id', conv_id);
  END IF;
END;
$$;

-- The caller supplies the SSO-verified learner through the trusted server client.
-- Preserve the installed local service-role-only execution boundary explicitly.
REVOKE ALL ON FUNCTION public.save_career_ai_message(uuid, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_career_ai_message(uuid, uuid, text, jsonb) TO service_role;
