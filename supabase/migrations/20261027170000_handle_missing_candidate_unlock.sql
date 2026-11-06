-- Return the same not-found contract for malformed and missing candidate IDs.
BEGIN;

CREATE OR REPLACE FUNCTION public.unlock_candidate_contact(
  p_organization_id UUID,
  p_candidate_id TEXT,
  p_unlocked_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_candidate RECORD;
  v_unlock_id UUID;
  v_charge JSONB;
BEGIN
  -- Serialize concurrent unlock attempts per (org, candidate)
  PERFORM pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':' || p_candidate_id, 0));

  -- Resolve by canonical learners.id first, then by user_id alias. Two sargable
  -- steps instead of an OR over ::text casts (PK indexes usable), and
  -- deterministic: the id match always wins over a user_id match.
  IF p_candidate_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id, name, email, contact_number
    INTO v_candidate
    FROM public.learners
    WHERE id = p_candidate_id::uuid
    LIMIT 1;

    IF v_candidate.id IS NULL THEN
      SELECT id, name, email, contact_number
      INTO v_candidate
      FROM public.learners
      WHERE user_id = p_candidate_id::uuid
      LIMIT 1;
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'CANDIDATE_NOT_FOUND');
  END IF;

  -- A valid UUID may refer to a deleted or unavailable candidate.
  -- Resolve this before attempting the NOT NULL unlock row or charging credits.
  IF v_candidate.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'CANDIDATE_NOT_FOUND');
  END IF;

  -- Claim first, charge second, all-or-nothing in this transaction
  INSERT INTO public.candidate_contact_unlocks
    (organization_id, candidate_id, unlocked_by, credits_consumed)
  VALUES (p_organization_id, v_candidate.id, p_unlocked_by, 1)
  ON CONFLICT (organization_id, candidate_id) DO NOTHING
  RETURNING id INTO v_unlock_id;

  IF v_unlock_id IS NOT NULL THEN
    v_charge := public.consume_credits(
      p_organization_id,
      'contact_unlocks',
      1,
      v_candidate.id::text,
      jsonb_build_object('unlocked_by', p_unlocked_by)::text
    );

    IF NOT COALESCE((v_charge->>'success')::boolean, false) THEN
      RAISE EXCEPTION 'INSUFFICIENT_CREDITS: %', v_charge->>'error';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_unlocked', (v_unlock_id IS NULL),
    'candidate', to_jsonb(v_candidate)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_candidate_contact(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_candidate_contact(UUID, TEXT, UUID) TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
