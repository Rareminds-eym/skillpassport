-- DIDAC 2026 Dynamic Promo Code Management — per-code plan targeting and
-- fixed promotional pricing.
--
-- Until now every DIDAC code shared one hardcoded plan per role
-- (DIDAC_ALLOWED_PLAN_CODE_BY_ROLE in functions/api/payments/lib/promoCode.ts)
-- and price_adjustment was always an additive top-up on that plan's live
-- price. This adds, per code:
--   - target_plan_code: which plan this specific code makes eligible,
--     overriding the role default (NULL keeps the old role-default behavior,
--     so every existing/untargeted code keeps working unchanged). Matched
--     against either the plan's plan_code OR its display name — in the live
--     SSO catalog plan_code is an opaque per-plan hash (pln_<32 hex>), not a
--     stable slug, so this is normally configured as the plan's NAME (e.g.
--     "Career Builder"), lowercased.
--   - fixed_price_minor: an exact promotional price in minor units (e.g.
--     paise), overriding price_adjustment's additive-on-top-of-live-price
--     semantics for codes that need to land on a fixed number (e.g.
--     "Career Builder at ₹399") regardless of the plan's live base price.
-- The two pricing modes are mutually exclusive per code (CHECK below) — a
-- code is either a plain additive top-up (price_adjustment, the original
-- convention) or a fixed promotional price (fixed_price_minor), never both.
BEGIN;

ALTER TABLE "public"."promo_codes"
  ADD COLUMN IF NOT EXISTS "target_plan_code" "text",
  ADD COLUMN IF NOT EXISTS "fixed_price_minor" bigint;

ALTER TABLE "public"."promo_codes"
  ADD CONSTRAINT "promo_codes_target_plan_code_normalized_check"
    CHECK ("target_plan_code" IS NULL OR "target_plan_code" = "lower"("btrim"("target_plan_code"))),
  ADD CONSTRAINT "promo_codes_fixed_price_minor_check"
    CHECK ("fixed_price_minor" IS NULL OR "fixed_price_minor" >= 0),
  ADD CONSTRAINT "promo_codes_pricing_mode_exclusive_check"
    CHECK ("fixed_price_minor" IS NULL OR "price_adjustment" = 0);

COMMENT ON COLUMN "public"."promo_codes"."target_plan_code" IS
  'The plans_cache.plan_code this specific code makes eligible (and thus price-adjusted), '
  'overriding the fixed per-role default in DIDAC_ALLOWED_PLAN_CODE_BY_ROLE. NULL means '
  '"use the role default", so pre-existing codes created before this column keep working '
  'unchanged.';
COMMENT ON COLUMN "public"."promo_codes"."fixed_price_minor" IS
  'An exact promotional price (minor units of whatever currency the matched offer is '
  'published in) that this code locks the target plan to, regardless of the plan''s live '
  'base price — e.g. "Career Builder at ₹399" as 39900. Mutually exclusive with '
  'price_adjustment (see promo_codes_pricing_mode_exclusive_check); NULL means this code '
  'uses the plain additive price_adjustment instead.';

NOTIFY pgrst,'reload schema';
COMMIT;
