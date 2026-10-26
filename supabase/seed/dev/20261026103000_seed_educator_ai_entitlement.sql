-- Migration/Seed for Skillpassport App DB
-- Grants 'educator_ai' access to educator accounts so they can immediately use the AI Teaching Assistant / Copilot.
--
-- Target DB: Skillpassport App DB (https://dpooleduinyyzxgrcwko.supabase.co)

BEGIN;

-- 1. Grant direct user entitlement to testeducator@gmail.com (fcd52c03-3a09-48cd-8594-d062971533a6)
INSERT INTO public.user_entitlements (
  id,
  user_id,
  feature_key,
  bundle_id,
  status,
  billing_period,
  start_date,
  end_date,
  auto_renew,
  price_at_purchase,
  created_at,
  updated_at
)
VALUES (
  'e0ca1001-beef-42bf-9f0e-3dd71787d559',
  'fcd52c03-3a09-48cd-8594-d062971533a6',
  'educator_ai',
  NULL,
  'active',
  'annual',
  NOW(),
  NOW() + INTERVAL '1 year',
  true,
  9990.00,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  end_date = NOW() + INTERVAL '1 year',
  updated_at = NOW();

-- 2. Also grant entitlement to all college educators/lecturers with registered user accounts
INSERT INTO public.user_entitlements (
  id,
  user_id,
  feature_key,
  bundle_id,
  status,
  billing_period,
  start_date,
  end_date,
  auto_renew,
  price_at_purchase,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  cs.user_id,
  'educator_ai',
  NULL,
  'active',
  'annual',
  NOW(),
  NOW() + INTERVAL '1 year',
  true,
  9990.00,
  NOW(),
  NOW()
FROM public.college_staff cs
WHERE cs.user_id IS NOT NULL
  AND cs.user_id != 'fcd52c03-3a09-48cd-8594-d062971533a6'
ON CONFLICT DO NOTHING;

-- 3. Update subscription_cache to include 'educator_ai' in features array for active subscriptions of educators
UPDATE public.subscription_cache
SET features = (
  SELECT jsonb_agg(DISTINCT elem)
  FROM jsonb_array_elements_text(COALESCE(features, '[]'::jsonb) || '["educator_ai"]'::jsonb) AS elem
),
updated_at = NOW()
WHERE user_id = 'fcd52c03-3a09-48cd-8594-d062971533a6';

COMMIT;
