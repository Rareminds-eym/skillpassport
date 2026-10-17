-- Migration: Candidate Contact Unlocks Table & Security Policies
-- Tracks which candidate profiles have been unlocked by which organization
-- Enforces Spec Sections 6 & 9 (1 contact unlock credit per candidate unlock)

BEGIN;

CREATE TABLE IF NOT EXISTS public.candidate_contact_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    candidate_id TEXT NOT NULL,
    unlocked_by UUID NOT NULL,
    credits_consumed INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_candidate_unlock UNIQUE (organization_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_unlocks_org_cand 
    ON public.candidate_contact_unlocks(organization_id, candidate_id);

CREATE INDEX IF NOT EXISTS idx_contact_unlocks_org_created 
    ON public.candidate_contact_unlocks(organization_id, created_at DESC);

-- Access model (project convention): no RLS; explicit grants; backend authorization only.
ALTER TABLE public.candidate_contact_unlocks DISABLE ROW LEVEL SECURITY;

DO $access$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'candidate_contact_unlocks'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.candidate_contact_unlocks', r.policyname);
  END LOOP;

  REVOKE ALL ON TABLE public.candidate_contact_unlocks FROM PUBLIC, anon, authenticated;
  GRANT ALL ON TABLE public.candidate_contact_unlocks TO service_role;
END
$access$;

-- Atomic unlock (H2): claim the unlock row FIRST (UNIQUE(org, candidate) is the
-- authority), then charge the credit inside the SAME transaction. If the tenant has
-- insufficient credits the RAISE rolls back both the unlock row and the charge.
-- Resolves the candidate by learners.id OR user_id and stores the canonical learners.id,
-- so both aliases cost exactly one credit and create exactly one unlock row.
-- service_role-only: the tool RPC is never exposed via PostgREST to the anon key.
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

COMMIT;
