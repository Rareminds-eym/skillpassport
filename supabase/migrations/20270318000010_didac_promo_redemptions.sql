-- DIDAC 2026 Dynamic Promo Code Management — promo_redemptions table and the
-- redeem_promo_code() entry point. Depends on promo_codes (previous migration).
-- See TSD-didac-2026-dynamic-promo-code-management.yml (v2.1).
-- Integration point for the backend hook (separate, already-applied change):
-- functions/lib/auth.ts withAuth(), immediately after requireVerifiedEmail().
BEGIN;

-- promo_redemptions — the receipt, one row per successful redemption.
CREATE TABLE IF NOT EXISTS "public"."promo_redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promo_code_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "promo_redemptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promo_redemptions_role_check" CHECK (("role" = ANY (ARRAY['learner'::"text", 'school_admin'::"text", 'college_admin'::"text"]))),
    CONSTRAINT "promo_redemptions_promo_code_id_user_id_key" UNIQUE ("promo_code_id", "user_id"),
    CONSTRAINT "promo_redemptions_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id"),
    CONSTRAINT "promo_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
);

ALTER TABLE "public"."promo_redemptions" OWNER TO "postgres";

COMMENT ON TABLE "public"."promo_redemptions" IS
  'One committed redemption per (promo_code_id, user_id). role is a snapshot at '
  'redemption time, not a live join to users.role. The UNIQUE constraint on '
  '(promo_code_id, user_id) is the sole duplicate-prevention mechanism; its composite '
  'index has promo_code_id as the leading column, so it already serves the quota '
  'COUNT(*) WHERE promo_code_id = X queries in redeem_promo_code() — no separate index '
  'on promo_code_id is needed.';

ALTER TABLE "public"."promo_redemptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_redemptions_own_read" ON "public"."promo_redemptions"
  FOR SELECT
  USING (("auth"."uid"() = "user_id"));

GRANT ALL ON TABLE "public"."promo_redemptions" TO "service_role";
GRANT SELECT ON TABLE "public"."promo_redemptions" TO "authenticated";

-- redeem_promo_code — the one atomic entry point for validation + redemption.
CREATE OR REPLACE FUNCTION "public"."redeem_promo_code"("p_code" "text", "p_user_id" "uuid", "p_role" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_code text := upper(btrim(p_code));
  v_promo RECORD;
  v_existing RECORD;
  v_role_max int;
BEGIN
  -- Row-locks the promo_codes row, serializing ALL concurrent calls for this
  -- code (different users competing for the last slot, and repeated calls
  -- from the same user) through every check below and the final INSERT.
  SELECT id, active, starts_at, expires_at, role_quotas, overall_max_uses
    INTO v_promo FROM promo_codes WHERE code = v_code FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'PROMO_CODE_NOT_FOUND');
  END IF;

  -- Existing-redemption check runs FIRST, before any eligibility/quota check:
  -- a prior success must stay a success even if the code later becomes
  -- inactive/expired/exhausted — that later state must not retroactively
  -- invalidate an already-committed, already-counted redemption.
  SELECT id INTO v_existing FROM promo_redemptions
    WHERE promo_code_id = v_promo.id AND user_id = p_user_id;
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'code', 'PROMO_ALREADY_REDEEMED',
                               'redemption_id', v_existing.id);
  END IF;

  IF NOT v_promo.active THEN
    RETURN jsonb_build_object('success', false, 'code', 'PROMO_CODE_INACTIVE');
  END IF;
  IF now() < v_promo.starts_at THEN
    RETURN jsonb_build_object('success', false, 'code', 'PROMO_CODE_NOT_YET_VALID');
  END IF;
  IF now() > v_promo.expires_at THEN
    RETURN jsonb_build_object('success', false, 'code', 'PROMO_CODE_EXPIRED');
  END IF;
  IF NOT (v_promo.role_quotas ? p_role) THEN
    RETURN jsonb_build_object('success', false, 'code', 'PROMO_ROLE_NOT_ELIGIBLE');
  END IF;
  IF (SELECT count(*) FROM promo_redemptions WHERE promo_code_id = v_promo.id)
     >= v_promo.overall_max_uses THEN
    RETURN jsonb_build_object('success', false, 'code', 'PROMO_QUOTA_EXHAUSTED_OVERALL');
  END IF;
  v_role_max := (v_promo.role_quotas ->> p_role)::int;
  IF (SELECT count(*) FROM promo_redemptions
      WHERE promo_code_id = v_promo.id AND role = p_role) >= v_role_max THEN
    RETURN jsonb_build_object('success', false, 'code', 'PROMO_QUOTA_EXHAUSTED_ROLE');
  END IF;

  -- ON CONFLICT is defense-in-depth, not the primary protection: the FOR
  -- UPDATE lock above already serializes every call for this code (including
  -- same-user concurrent calls) through the existing-redemption check and
  -- this INSERT, so a genuine race on (promo_code_id, user_id) should not
  -- reach here. This clause only guards against that assumption ever being
  -- wrong — it does not change the function's normal behavior.
  INSERT INTO promo_redemptions (promo_code_id, user_id, role)
    VALUES (v_promo.id, p_user_id, p_role)
    ON CONFLICT (promo_code_id, user_id) DO NOTHING
    RETURNING id INTO v_existing;
  IF NOT FOUND THEN
    SELECT id INTO v_existing FROM promo_redemptions
      WHERE promo_code_id = v_promo.id AND user_id = p_user_id;
    RETURN jsonb_build_object('success', true, 'code', 'PROMO_ALREADY_REDEEMED',
                               'redemption_id', v_existing.id);
  END IF;
  RETURN jsonb_build_object('success', true, 'code', 'PROMO_REDEEMED',
                             'redemption_id', v_existing.id);
END;
$$;
-- No EXCEPTION block: any unexpected error (e.g. a transient DB failure)
-- propagates naturally and rolls back the row lock plus any partial work via
-- Postgres's own transaction guarantees — this function never returns a
-- false success. It does NOT return a PROMO_REDEMPTION_DB_ERROR value itself;
-- that code is the CALLER's (functions/lib/promo-redemption.ts, invoked from
-- withAuth()) classification of a thrown/rejected RPC call, applied in its
-- own try/catch, never surfaced to the end user, retried safely on the
-- user's next authenticated request.

ALTER FUNCTION "public"."redeem_promo_code"("p_code" "text", "p_user_id" "uuid", "p_role" "text") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."redeem_promo_code"("text", "uuid", "text") IS
  'Atomic promo-code validation and redemption. p_role is text throughout (role values '
  'are strings like ''learner'', never a uuid). SECURITY DEFINER, callable only by '
  'service_role per the REVOKE/GRANT below, matching this codebase''s existing '
  'SECURITY DEFINER convention (see 20270313010000_hybrid_seat_integrity.sql).';

REVOKE ALL ON FUNCTION "public"."redeem_promo_code"("text", "uuid", "text") FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."redeem_promo_code"("text", "uuid", "text") TO "service_role";

-- Index note: promo_redemptions(promo_code_id, user_id) UNIQUE constraint
-- already provides a composite btree index with promo_code_id as the
-- leading column, which fully serves the COUNT(*) WHERE promo_code_id = X
-- queries inside redeem_promo_code(). No additional index is created here.

NOTIFY pgrst,'reload schema';
COMMIT;
