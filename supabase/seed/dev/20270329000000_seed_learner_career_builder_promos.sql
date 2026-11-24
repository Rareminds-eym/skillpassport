-- Development-only Career Builder promo prices for learner checkout.
-- INR minor units are paise: 100000 = Rs 1,000; 600000 = Rs 6,000;
-- 550000 = Rs 5,500. Duration comes from Career Builder's published yearly price.
-- Reruns preserve existing campaigns, accepted prices and redemption counts.
BEGIN;

DO $seed$
DECLARE
  target_code text;
BEGIN
  SELECT plan_code INTO STRICT target_code
  FROM public.plans_cache
  WHERE id = 'ad0db9a1-7d9b-4876-a69d-19483d8bddf0'::uuid
    AND name = 'Career Builder'
    AND plan_family = 'individual'
    AND is_active = true;

  INSERT INTO public.promo_codes (
    code, campaign_name, active, starts_at, expires_at,
    overall_max_uses, role_quotas, price_adjustment,
    target_plan_code, fixed_price_minor
  )
  SELECT
    seed.code,
    'Development: learner Career Builder yearly pricing',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    100,
    '{"learner": 100}'::jsonb,
    0,
    lower(btrim(target_code)),
    seed.amount_minor
  FROM (VALUES
    ('LEARNER1000', 100000::bigint),
    ('LEARNER6000', 600000::bigint),
    ('LEARNER5500', 550000::bigint)
  ) AS seed(code, amount_minor)
  ON CONFLICT (code) DO NOTHING;
END;
$seed$;

COMMIT;
