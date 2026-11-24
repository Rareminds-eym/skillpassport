-- Development-only promo codes: one each for learner, school and college checkout.
-- INR minor units are paise: 100000 = Rs 1,000; 600000 = Rs 6,000;
-- 550000 = Rs 5,500. Duration comes from each target plan's published yearly price.
-- Reruns preserve existing campaigns, accepted prices and redemption counts.
BEGIN;

DO $seed$
DECLARE
  target_code text;
  seed record;
BEGIN
  FOR seed IN SELECT * FROM (VALUES
    ('LEARNER1000', 'learner', 'Skill Starter', 'individual', 100000::bigint),
    ('SCHOOL6000', 'school_admin', 'School Starter', 'school', 600000::bigint),
    ('COLLEGE5500', 'college_admin', 'College Starter', 'college', 550000::bigint)
  ) AS values_row(code, account_role, plan_name, audience, amount_minor)
  LOOP
    SELECT plan_code INTO STRICT target_code
    FROM public.plans_cache
    WHERE name = seed.plan_name
      AND plan_code LIKE 'pln_%'
      AND seed.audience = ANY(applicable_entities)
      AND is_active = true;

  INSERT INTO public.promo_codes (
    code, campaign_name, active, starts_at, expires_at,
    overall_max_uses, role_quotas, price_adjustment,
    target_plan_code, fixed_price_minor
  )
  SELECT
    seed.code,
    'Development: ' || seed.account_role || ' yearly promo pricing',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    100,
    jsonb_build_object(seed.account_role, 100),
    0,
    lower(btrim(target_code)),
    seed.amount_minor
  ON CONFLICT (code) DO NOTHING;
  END LOOP;
END;
$seed$;

COMMIT;
