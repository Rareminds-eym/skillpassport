-- DIDAC 2026 Dynamic Promo Code Management — promo_codes table.
-- See TSD-didac-2026-dynamic-promo-code-management.yml (v2.1).
-- promo_redemptions (FK to this table) follows in the next migration.
BEGIN;

-- Validates role_quotas jsonb shape. Must exist before promo_codes, since
-- it's referenced in that table's CHECK constraint. IMMUTABLE is required
-- for use inside a CHECK constraint.
CREATE OR REPLACE FUNCTION public.is_valid_role_quotas(v jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN jsonb_typeof(v) IS DISTINCT FROM 'object' THEN false
    ELSE NOT EXISTS (
      SELECT 1 FROM jsonb_each_text(v) AS kv(key, value)
      WHERE kv.key NOT IN ('learner','school_admin','college_admin')
         OR kv.value !~ '^[0-9]+$'
    )
  END
$$;

COMMENT ON FUNCTION public.is_valid_role_quotas(jsonb) IS
  'Validates promo_codes.role_quotas: must be a JSON object whose keys are one of '
  'learner/school_admin/college_admin and whose values are non-negative integers. '
  'The CASE guard (not a bare AND) is required because jsonb_each_text() raises an '
  'error, not false, when called on a non-object JSON value.';

REVOKE ALL ON FUNCTION public.is_valid_role_quotas(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_role_quotas(jsonb) TO service_role;

-- promo_codes — the rulebook, one row per campaign code.
CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "campaign_name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "overall_max_uses" integer NOT NULL,
    "role_quotas" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "price_adjustment" numeric DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promo_codes_code_key" UNIQUE ("code"),
    CONSTRAINT "promo_codes_code_normalized_check" CHECK (("code" = "upper"("btrim"("code")))),
    CONSTRAINT "promo_codes_dates_check" CHECK (("expires_at" > "starts_at")),
    CONSTRAINT "promo_codes_overall_max_uses_check" CHECK (("overall_max_uses" >= 0)),
    CONSTRAINT "promo_codes_price_adjustment_check" CHECK (("price_adjustment" >= 0)),
    CONSTRAINT "promo_codes_role_quotas_check" CHECK ("public"."is_valid_role_quotas"("role_quotas")),
    CONSTRAINT "promo_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id"),
    CONSTRAINT "promo_codes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id")
);

ALTER TABLE "public"."promo_codes" OWNER TO "postgres";

COMMENT ON TABLE "public"."promo_codes" IS
  'DIDAC 2026 dynamic promo codes. campaign_name is mandatory for reporting but never '
  'read by redemption validation. price_adjustment is a single additive amount applied '
  'to the base price of whichever plan(s) the existing subscription-plans gating logic '
  'marks eligible — not a discount, and not plan-specific (see TSD v2.1). '
  'created_by/updated_by/updated_at provide last-change accountability only, not full '
  'old/new-value audit history (a dedicated promo_audit_log table was evaluated and '
  'intentionally excluded for this phase).';

ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_codes_admin_write" ON "public"."promo_codes"
  USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"))
  WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));

GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";
GRANT SELECT ON TABLE "public"."promo_codes" TO "authenticated";

NOTIFY pgrst,'reload schema';
COMMIT;
