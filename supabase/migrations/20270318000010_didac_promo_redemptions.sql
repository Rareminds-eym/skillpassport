-- DIDAC 2026 Dynamic Promo Code Management — promo_redemptions table and the
-- redeem_promo_code() entry point. Depends on promo_codes (previous migration).
-- See TSD-didac-2026-dynamic-promo-code-management.yml (v2.1) and
-- Rareminds_DIDAC_Dynamic_Promo_Code_and_Sector_Pricing_PRD_v1.3 (R16/R17).
--
-- Quota is consumed ONLY together with an immutable snapshot of the exact
-- offer the user explicitly accepted (canonical plan id, published-offer
-- revision/version, exact price, duration, acceptance timestamp) — committed
-- atomically, in the same INSERT/transaction as the quota-consuming row.
-- There is no automatic/background redemption path anywhere in the
-- application (promo acceptance is a distinct, explicit action — see
-- functions/lib/subscriptions/promo-offer.ts).
BEGIN;

-- promo_redemptions — the receipt, one row per successful redemption, and
-- the Accepted_Offer_Snapshot (PRD R17) for that redemption.
CREATE TABLE IF NOT EXISTS "public"."promo_redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promo_code_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    -- Accepted_Offer_Snapshot (PRD R17): the exact, immutable terms the user explicitly
    -- accepted. Populated atomically by redeem_promo_code() alongside the row itself —
    -- never written or changed afterwards by any other code path.
    "accepted_plan_id" "uuid",
    "accepted_revision_id" "uuid",
    "accepted_revision_number" integer,
    "accepted_price_id" "uuid",
    "accepted_currency" "text",
    "accepted_minor_unit" integer,
    "accepted_interval_unit" "text",
    "accepted_interval_count" integer,
    "accepted_amount_minor" bigint,
    "accepted_at" timestamp with time zone,
    CONSTRAINT "promo_redemptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promo_redemptions_role_check" CHECK (("role" = ANY (ARRAY['learner'::"text", 'school_admin'::"text", 'college_admin'::"text"]))),
    CONSTRAINT "promo_redemptions_promo_code_id_user_id_key" UNIQUE ("promo_code_id", "user_id"),
    CONSTRAINT "promo_redemptions_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id"),
    CONSTRAINT "promo_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id"),
    CONSTRAINT "promo_redemptions_accepted_revision_number_check"
      CHECK ("accepted_revision_number" IS NULL OR "accepted_revision_number" >= 1),
    CONSTRAINT "promo_redemptions_accepted_minor_unit_check"
      CHECK ("accepted_minor_unit" IS NULL OR "accepted_minor_unit" >= 0),
    CONSTRAINT "promo_redemptions_accepted_interval_count_check"
      CHECK ("accepted_interval_count" IS NULL OR "accepted_interval_count" >= 1),
    CONSTRAINT "promo_redemptions_accepted_interval_unit_check"
      CHECK ("accepted_interval_unit" IS NULL OR "accepted_interval_unit" = ANY (ARRAY['month'::"text", 'year'::"text"])),
    CONSTRAINT "promo_redemptions_accepted_amount_minor_check"
      CHECK ("accepted_amount_minor" IS NULL OR "accepted_amount_minor" >= 0)
);

ALTER TABLE "public"."promo_redemptions" OWNER TO "postgres";

COMMENT ON TABLE "public"."promo_redemptions" IS
  'One committed redemption per (promo_code_id, user_id). role is a snapshot at '
  'redemption time, not a live join to users.role. The UNIQUE constraint on '
  '(promo_code_id, user_id) is the sole duplicate-prevention mechanism; its composite '
  'index has promo_code_id as the leading column, so it already serves the quota '
  'COUNT(*) WHERE promo_code_id = X queries in redeem_promo_code() — no separate index '
  'on promo_code_id is needed. The accepted_* columns are the Accepted_Offer_Snapshot '
  '(PRD R17): written once, atomically with the row itself, by redeem_promo_code() — '
  'never updated afterwards by any other code path.';

COMMENT ON COLUMN "public"."promo_redemptions"."accepted_plan_id" IS
  'The canonical plan the user explicitly accepted. Checkout must validate against '
  'this, never trust a client-supplied plan selection for promo pricing.';
COMMENT ON COLUMN "public"."promo_redemptions"."accepted_revision_id" IS
  'The published offer revision (subscription_plan_projections.revision_id) in force '
  'at the moment of acceptance. Revisions are themselves immutable once published, so '
  'this id alone is enough to re-derive the exact published terms the user saw, forever.';
COMMENT ON COLUMN "public"."promo_redemptions"."accepted_amount_minor" IS
  'The exact final price (base price plus the promo adjustment) the user accepted, in '
  'minor units of accepted_currency. Checkout must read this value, never recompute a '
  'fresh adjustment against whatever the live catalog price happens to be later.';

ALTER TABLE "public"."promo_redemptions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_redemptions_own_read" ON "public"."promo_redemptions"
  FOR SELECT
  USING (("auth"."uid"() = "user_id"));

GRANT ALL ON TABLE "public"."promo_redemptions" TO "service_role";
GRANT SELECT ON TABLE "public"."promo_redemptions" TO "authenticated";

-- redeem_promo_code — the one atomic entry point for validation, quota
-- redemption AND immutable accepted-offer snapshot write (PRD R16/R17), all
-- in one row/transaction. There is no 3-argument overload: this is the only
-- signature this function has ever had.
CREATE OR REPLACE FUNCTION "public"."redeem_promo_code"(
  "p_code" "text", "p_user_id" "uuid", "p_role" "text",
  "p_accepted_plan_id" "uuid", "p_accepted_revision_id" "uuid", "p_accepted_revision_number" integer,
  "p_accepted_price_id" "uuid", "p_accepted_currency" "text", "p_accepted_minor_unit" integer,
  "p_accepted_interval_unit" "text", "p_accepted_interval_count" integer, "p_accepted_amount_minor" bigint
) RETURNS "jsonb"
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
  -- invalidate an already-committed, already-counted redemption. Immutability
  -- (R17): always echo back the STORED snapshot here, never the freshly
  -- supplied parameters — this is what makes re-calling this function with a
  -- different (e.g. later/changed) offer a safe, idempotent no-op rather
  -- than a silent re-acceptance.
  SELECT id, accepted_plan_id, accepted_revision_id, accepted_revision_number, accepted_price_id,
         accepted_currency, accepted_minor_unit, accepted_interval_unit, accepted_interval_count,
         accepted_amount_minor, accepted_at
    INTO v_existing FROM promo_redemptions
    WHERE promo_code_id = v_promo.id AND user_id = p_user_id;
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'code', 'PROMO_ALREADY_REDEEMED', 'redemption_id', v_existing.id,
      'offer', jsonb_build_object(
        'planId', v_existing.accepted_plan_id, 'revisionId', v_existing.accepted_revision_id,
        'revisionNumber', v_existing.accepted_revision_number, 'priceId', v_existing.accepted_price_id,
        'currency', v_existing.accepted_currency, 'minorUnit', v_existing.accepted_minor_unit,
        'intervalUnit', v_existing.accepted_interval_unit, 'intervalCount', v_existing.accepted_interval_count,
        'amountMinor', v_existing.accepted_amount_minor, 'acceptedAt', v_existing.accepted_at));
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

  -- Atomic quota redemption + immutable offer snapshot: one INSERT, one row,
  -- one transaction. ON CONFLICT is defense-in-depth, not the primary
  -- protection: the FOR UPDATE lock above already serializes every call for
  -- this code (including same-user concurrent calls) through the
  -- existing-redemption check and this INSERT, so a genuine race on
  -- (promo_code_id, user_id) should not reach here. This clause only guards
  -- against that assumption ever being wrong — it does not change the
  -- function's normal behavior.
  INSERT INTO promo_redemptions (
    promo_code_id, user_id, role,
    accepted_plan_id, accepted_revision_id, accepted_revision_number, accepted_price_id,
    accepted_currency, accepted_minor_unit, accepted_interval_unit, accepted_interval_count,
    accepted_amount_minor, accepted_at
  ) VALUES (
    v_promo.id, p_user_id, p_role,
    p_accepted_plan_id, p_accepted_revision_id, p_accepted_revision_number, p_accepted_price_id,
    p_accepted_currency, p_accepted_minor_unit, p_accepted_interval_unit, p_accepted_interval_count,
    p_accepted_amount_minor, now()
  )
  ON CONFLICT (promo_code_id, user_id) DO NOTHING
  RETURNING id, accepted_plan_id, accepted_revision_id, accepted_revision_number, accepted_price_id,
            accepted_currency, accepted_minor_unit, accepted_interval_unit, accepted_interval_count,
            accepted_amount_minor, accepted_at
    INTO v_existing;
  IF NOT FOUND THEN
    SELECT id, accepted_plan_id, accepted_revision_id, accepted_revision_number, accepted_price_id,
           accepted_currency, accepted_minor_unit, accepted_interval_unit, accepted_interval_count,
           accepted_amount_minor, accepted_at
      INTO v_existing FROM promo_redemptions
      WHERE promo_code_id = v_promo.id AND user_id = p_user_id;
    RETURN jsonb_build_object('success', true, 'code', 'PROMO_ALREADY_REDEEMED', 'redemption_id', v_existing.id,
      'offer', jsonb_build_object(
        'planId', v_existing.accepted_plan_id, 'revisionId', v_existing.accepted_revision_id,
        'revisionNumber', v_existing.accepted_revision_number, 'priceId', v_existing.accepted_price_id,
        'currency', v_existing.accepted_currency, 'minorUnit', v_existing.accepted_minor_unit,
        'intervalUnit', v_existing.accepted_interval_unit, 'intervalCount', v_existing.accepted_interval_count,
        'amountMinor', v_existing.accepted_amount_minor, 'acceptedAt', v_existing.accepted_at));
  END IF;
  RETURN jsonb_build_object('success', true, 'code', 'PROMO_REDEEMED', 'redemption_id', v_existing.id,
    'offer', jsonb_build_object(
      'planId', v_existing.accepted_plan_id, 'revisionId', v_existing.accepted_revision_id,
      'revisionNumber', v_existing.accepted_revision_number, 'priceId', v_existing.accepted_price_id,
      'currency', v_existing.accepted_currency, 'minorUnit', v_existing.accepted_minor_unit,
      'intervalUnit', v_existing.accepted_interval_unit, 'intervalCount', v_existing.accepted_interval_count,
      'amountMinor', v_existing.accepted_amount_minor, 'acceptedAt', v_existing.accepted_at));
END;
$$;
-- No EXCEPTION block: any unexpected error (e.g. a transient DB failure)
-- propagates naturally and rolls back the row lock plus any partial work via
-- Postgres's own transaction guarantees — this function never returns a
-- false success.

ALTER FUNCTION "public"."redeem_promo_code"(
  "text", "uuid", "text", "uuid", "uuid", integer, "uuid", "text", integer, "text", integer, bigint
) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."redeem_promo_code"(
  "text", "uuid", "text", "uuid", "uuid", integer, "uuid", "text", integer, "text", integer, bigint
) IS
  'Atomic promo-code validation, quota redemption AND immutable accepted-offer snapshot '
  'write (PRD R16/R17), all in one row/transaction. p_role is text throughout (role '
  'values are strings like ''learner'', never a uuid). The ONLY way promo quota is ever '
  'consumed — there is no automatic/background redemption path; this is called only from '
  'the explicit accept-offer endpoint (functions/lib/subscriptions/promo-offer.ts). '
  'Re-calling for an already-redeemed user always returns the originally stored snapshot, '
  'never the newly supplied one. SECURITY DEFINER, callable only by service_role per the '
  'REVOKE/GRANT below, matching this codebase''s existing SECURITY DEFINER convention '
  '(see 20270313010000_hybrid_seat_integrity.sql).';

REVOKE ALL ON FUNCTION "public"."redeem_promo_code"(
  "text", "uuid", "text", "uuid", "uuid", integer, "uuid", "text", integer, "text", integer, bigint
) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."redeem_promo_code"(
  "text", "uuid", "text", "uuid", "uuid", integer, "uuid", "text", integer, "text", integer, bigint
) TO "service_role";

-- Index note: promo_redemptions(promo_code_id, user_id) UNIQUE constraint
-- already provides a composite btree index with promo_code_id as the
-- leading column, which fully serves the COUNT(*) WHERE promo_code_id = X
-- queries inside redeem_promo_code(). No additional index is created here.

NOTIFY pgrst,'reload schema';
COMMIT;
