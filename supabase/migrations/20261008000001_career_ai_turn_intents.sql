-- Career AI 30-credit system: durable turn intents (Phase 4).
-- One row per client-issued turn UUID. Lets transport retries reuse the
-- allocated session and frozen worker input instead of minting new
-- conversations or rebilling. Server-only; never exposed to the browser.
--
-- Claim order (double-submit safe): claim turn first (no session), then
-- exactly one claimant wins the NULL→session compare-and-set; losers adopt
-- the winner's session and delete their orphaned empty conversation row.

CREATE TABLE IF NOT EXISTS public.career_ai_turn_intents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id uuid NULL REFERENCES public.career_ai_conversations(id) ON DELETE CASCADE,
  request_hash text NOT NULL,
  worker_input jsonb NULL,
  worker_input_hash text NULL,
  response_text text NULL,
  assistant_message_id text NULL,
  state text NOT NULL DEFAULT 'preparing'
    CHECK (state IN ('preparing', 'ready', 'dispatched', 'terminal', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS career_ai_turn_intents_user_created_idx
  ON public.career_ai_turn_intents (user_id, created_at DESC);

-- Atomic claim: first writer wins; replays verify owner + request hash.
-- Returns {created, turn...} or {conflict} when the same turn key carries
-- a different payload (client bug — must mint a new turn, never reuse).
CREATE OR REPLACE FUNCTION public.claim_career_turn_intent(
  p_turn_id uuid, p_user_id uuid, p_request_hash text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_turn public.career_ai_turn_intents%ROWTYPE;
BEGIN
  INSERT INTO public.career_ai_turn_intents (id, user_id, request_hash, state)
  VALUES (p_turn_id, p_user_id, p_request_hash, 'preparing')
  ON CONFLICT (id) DO NOTHING
  RETURNING * INTO v_turn;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'created', true,
      'turn_id', v_turn.id, 'session_id', v_turn.session_id, 'state', v_turn.state);
  END IF;
  SELECT * INTO v_turn FROM public.career_ai_turn_intents WHERE id = p_turn_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'TURN_GONE');
  END IF;
  IF v_turn.user_id <> p_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'TURN_OWNER_MISMATCH');
  END IF;
  IF v_turn.request_hash <> p_request_hash THEN
    RETURN jsonb_build_object('ok', false, 'error', 'TURN_PAYLOAD_CONFLICT');
  END IF;
  RETURN jsonb_build_object('ok', true, 'created', false,
    'turn_id', v_turn.id, 'session_id', v_turn.session_id, 'state', v_turn.state,
    'worker_input', v_turn.worker_input, 'worker_input_hash', v_turn.worker_input_hash,
    'response_text', v_turn.response_text, 'assistant_message_id', v_turn.assistant_message_id);
END;
$$;

-- Single-winner session adoption. The caller pre-inserts its candidate
-- conversation row, then exactly one claimant wins the NULL→session
-- transition; losers adopt the winner's session and delete their orphan.
CREATE OR REPLACE FUNCTION public.adopt_career_turn_session(
  p_turn_id uuid, p_session_id uuid
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_session uuid;
BEGIN
  UPDATE public.career_ai_turn_intents
  SET session_id = p_session_id, updated_at = now()
  WHERE id = p_turn_id AND session_id IS NULL;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'won', true, 'session_id', p_session_id);
  END IF;
  SELECT session_id INTO v_session FROM public.career_ai_turn_intents WHERE id = p_turn_id;
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'TURN_GONE');
  END IF;
  RETURN jsonb_build_object('ok', true, 'won', false, 'session_id', v_session);
END;
$$;

-- Freeze the validated worker input once context assembly completes.
-- Only the preparing winner may write; replays reuse the frozen input.
CREATE OR REPLACE FUNCTION public.ready_career_turn_intent(
  p_turn_id uuid, p_worker_input jsonb, p_worker_input_hash text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.career_ai_turn_intents
  SET worker_input = p_worker_input, worker_input_hash = p_worker_input_hash,
      state = 'ready', updated_at = now()
  WHERE id = p_turn_id AND state = 'preparing';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'TURN_NOT_PREPARING');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Mark terminal with the saved answer for duplicate replays.
CREATE OR REPLACE FUNCTION public.complete_career_turn_intent(
  p_turn_id uuid, p_response_text text, p_assistant_message_id text, p_state text DEFAULT 'terminal'
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_state NOT IN ('terminal', 'failed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_INPUT');
  END IF;
  UPDATE public.career_ai_turn_intents
  SET response_text = COALESCE(p_response_text, response_text),
      assistant_message_id = COALESCE(p_assistant_message_id, assistant_message_id),
      state = p_state, updated_at = now()
  WHERE id = p_turn_id AND state IN ('preparing', 'ready', 'dispatched');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'TURN_NOT_OPEN');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_career_turn_intent(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.adopt_career_turn_session(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ready_career_turn_intent(uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_career_turn_intent(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_career_turn_intent(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.adopt_career_turn_session(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ready_career_turn_intent(uuid, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_career_turn_intent(uuid, text, text, text) TO service_role;
