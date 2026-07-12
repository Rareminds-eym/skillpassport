-- Enable career_ai feature for specific learners
-- principal.hit@harshainstitute.edu.in (user_id: eb7313eb-bd50-582b-8da5-412ddf8d1ecd)
-- ramya03@acharya.ac.in (user_id: 3c14e807-1f15-5dec-b361-88fdb7a28820)

-- Career Starter bundle ID (includes career_ai feature)
-- bundles.id: 146d2cb6-9515-467f-8451-038ed79cf064

-- Insert career_ai entitlements for principal.hit@harshainstitute.edu.in
INSERT INTO public.user_entitlements (
  user_id,
  feature_key,
  bundle_id,
  status,
  billing_period,
  start_date,
  end_date,
  price_at_purchase,
  auto_renew,
  granted_by_organization
) VALUES (
  'eb7313eb-bd50-582b-8da5-412ddf8d1ecd'::uuid,
  'career_ai',
  '146d2cb6-9515-467f-8451-038ed79cf064'::uuid,
  'active',
  'annual',
  NOW(),
  NOW() + INTERVAL '1 year',
  0.00,
  true,
  false
) ON CONFLICT DO NOTHING;

-- Insert career_ai entitlements for ramya03@acharya.ac.in
INSERT INTO public.user_entitlements (
  user_id,
  feature_key,
  bundle_id,
  status,
  billing_period,
  start_date,
  end_date,
  price_at_purchase,
  auto_renew,
  granted_by_organization
) VALUES (
  '3c14e807-1f15-5dec-b361-88fdb7a28820'::uuid,
  'career_ai',
  '146d2cb6-9515-467f-8451-038ed79cf064'::uuid,
  'active',
  'annual',
  NOW(),
  NOW() + INTERVAL '1 year',
  0.00,
  true,
  false
) ON CONFLICT DO NOTHING;
