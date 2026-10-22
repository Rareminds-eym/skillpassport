-- Preserve the existing two-use allowance; reserve it atomically before inference.
CREATE TABLE public.ai_tutor_generation_claims (
  actor_id uuid NOT NULL REFERENCES public.users(id),
  operation_id uuid NOT NULL,
  request_hash text NOT NULL CHECK (request_hash ~ '^[a-f0-9]{64}$'),
  state text NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (actor_id, operation_id)
);
ALTER TABLE public.ai_tutor_generation_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_tutor_generation_claims FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_tutor_generation_claims TO service_role;
CREATE POLICY tutor_generation_service_only ON public.ai_tutor_generation_claims TO service_role USING (true) WITH CHECK (true);

CREATE FUNCTION public.claim_tutor_generation(p_actor_id uuid, p_operation_id uuid, p_request_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_metadata jsonb; v_used integer; v_reserved integer; v_claim ai_tutor_generation_claims%ROWTYPE;
BEGIN
  IF p_operation_id IS NULL OR p_request_hash IS NULL OR p_request_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid generation identity' USING ERRCODE = '22023';
  END IF;
  SELECT coalesce(metadata, '{}'::jsonb) INTO v_metadata FROM users WHERE id = p_actor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Generation actor unavailable' USING ERRCODE = '42501'; END IF;
  IF jsonb_typeof(v_metadata) <> 'object' THEN v_metadata := '{}'::jsonb; END IF;
  -- Invalid legacy counters deny rather than silently granting more allowance.
  BEGIN v_used := greatest(0, floor(coalesce((v_metadata->>'ai_tutor_generation_count')::numeric, 0)))::integer;
  EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Generation counter unavailable' USING ERRCODE = '22023'; END;
  SELECT * INTO v_claim FROM ai_tutor_generation_claims WHERE actor_id = p_actor_id AND operation_id = p_operation_id;
  IF FOUND THEN
    IF v_claim.request_hash <> p_request_hash THEN RAISE EXCEPTION 'Generation identity conflict' USING ERRCODE = '23505'; END IF;
  ELSE
    SELECT count(*) INTO v_reserved FROM ai_tutor_generation_claims WHERE actor_id = p_actor_id AND state = 'reserved';
    IF v_used + v_reserved >= 2 THEN RAISE EXCEPTION 'Generation allowance exhausted' USING ERRCODE = 'P0001'; END IF;
    INSERT INTO ai_tutor_generation_claims(actor_id, operation_id, request_hash) VALUES (p_actor_id, p_operation_id, p_request_hash);
  END IF;
  SELECT count(*) INTO v_reserved FROM ai_tutor_generation_claims WHERE actor_id = p_actor_id AND state = 'reserved';
  RETURN jsonb_build_object('limit', 2, 'used', v_used, 'remaining', greatest(0, 2 - v_used - v_reserved));
END $$;

CREATE FUNCTION public.complete_tutor_generation(p_actor_id uuid, p_operation_id uuid, p_request_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_metadata jsonb; v_used integer; v_reserved integer; v_claim ai_tutor_generation_claims%ROWTYPE;
BEGIN
  -- Same user-first lock ordering as admission; concurrent completion cannot lose increments.
  SELECT coalesce(metadata, '{}'::jsonb) INTO v_metadata FROM users WHERE id = p_actor_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Generation actor unavailable' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_claim FROM ai_tutor_generation_claims WHERE actor_id = p_actor_id AND operation_id = p_operation_id;
  -- Non-teacher material sends have no allowance claim and no counter mutation.
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF p_request_hash IS NULL OR v_claim.request_hash <> p_request_hash THEN RAISE EXCEPTION 'Generation identity conflict' USING ERRCODE = '23505'; END IF;
  IF jsonb_typeof(v_metadata) <> 'object' THEN v_metadata := '{}'::jsonb; END IF;
  v_used := greatest(0, floor(coalesce((v_metadata->>'ai_tutor_generation_count')::numeric, 0)))::integer;
  IF v_claim.state = 'reserved' THEN
    v_used := v_used + 1;
    UPDATE users SET metadata = jsonb_set(v_metadata, '{ai_tutor_generation_count}', to_jsonb(v_used)), "updatedAt" = now() WHERE id = p_actor_id;
    UPDATE ai_tutor_generation_claims SET state = 'completed', completed_at = now() WHERE actor_id = p_actor_id AND operation_id = p_operation_id;
  END IF;
  SELECT count(*) INTO v_reserved FROM ai_tutor_generation_claims WHERE actor_id = p_actor_id AND state = 'reserved';
  RETURN jsonb_build_object('limit', 2, 'used', v_used, 'remaining', greatest(0, 2 - v_used - v_reserved));
END $$;
REVOKE ALL ON FUNCTION public.claim_tutor_generation(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_tutor_generation(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_tutor_generation(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_tutor_generation(uuid, uuid, text) TO service_role;
-- Pending reservations are conservative. Never expire/release an unknown model outcome automatically.
CREATE FUNCTION public.get_tutor_generation_usage(p_actor_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object('limit', 2, 'used', counts.used,
    'remaining', greatest(0, 2 - counts.used - (SELECT count(*) FROM ai_tutor_generation_claims c WHERE c.actor_id = u.id AND c.state = 'reserved')))
  FROM users u CROSS JOIN LATERAL (
    SELECT greatest(0, floor(coalesce(((CASE WHEN jsonb_typeof(u.metadata) = 'object' THEN u.metadata ELSE '{}'::jsonb END)->>'ai_tutor_generation_count')::numeric, 0)))::integer AS used
  ) counts WHERE u.id = p_actor_id;
$$;
REVOKE ALL ON FUNCTION public.get_tutor_generation_usage(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tutor_generation_usage(uuid) TO service_role;
