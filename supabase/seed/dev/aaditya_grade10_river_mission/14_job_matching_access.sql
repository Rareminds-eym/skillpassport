-- LOCAL DEMO ONLY. Apply sso-worker's matching 14 seed first.
-- Mirrors that exact SSO grant into Aaditya's existing subscription cache.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.subscription_cache
   WHERE id='9df777e6-f9fd-54c4-bd74-a9d970913e2a'
     AND user_id='6d1c48f6-b3a9-57fb-998c-6a7255713e0c'
     AND plan_code='premium' AND status='active' AND subscription_end_date>now()) THEN
   RAISE EXCEPTION 'Sync Aaditya local SSO subscription into SkillPassport first';
 END IF;
END $$;
UPDATE public.subscription_cache
SET features=coalesce(features,'[]'::jsonb)||'["ai_job_matching"]'::jsonb,
    synced_at=now(), auth_updated_at=now()
WHERE id='9df777e6-f9fd-54c4-bd74-a9d970913e2a'
  AND user_id='6d1c48f6-b3a9-57fb-998c-6a7255713e0c'
  AND plan_code='premium' AND status='active' AND subscription_end_date>now()
  AND NOT coalesce(features,'[]'::jsonb) @> '["ai_job_matching"]'::jsonb;
COMMIT;
