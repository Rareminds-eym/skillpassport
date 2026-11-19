-- Apply the SSO counterpart first.
-- LOCAL DEMO ONLY. Preserve plan, pricing, expiry and other users.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.subscription_cache WHERE id='ba5259ad-b2f7-587b-a19c-06c4091e6de4' AND user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3' AND plan_code='premium' AND status='active' AND subscription_end_date>now()) THEN
  RAISE EXCEPTION 'Arjun active local Premium subscription is required';
 END IF;
END $$;
UPDATE public.subscription_cache SET features=coalesce(features,'[]'::jsonb)||jsonb_build_array('ai_job_matching'),synced_at=now(),auth_updated_at=now()
WHERE id='ba5259ad-b2f7-587b-a19c-06c4091e6de4' AND user_id='77feba55-cc92-5f00-9ff6-49df5ec581b3' AND plan_code='premium' AND status='active' AND subscription_end_date>now()
AND NOT coalesce(features,'[]'::jsonb) ? 'ai_job_matching';
COMMIT;
