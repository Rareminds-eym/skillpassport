-- LOCAL ROHAN DEMO ONLY. Apply the SSO counterpart first, then mirror its grant.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.subscription_cache WHERE id='af3e7e1f-92a5-535a-aecd-3f5b628beb84' AND user_id='02f0a43d-3c0a-5026-b44f-5d0696e75f19' AND plan_code='premium' AND status='active' AND subscription_end_date>now()) THEN
  RAISE EXCEPTION 'Sync Rohan active local Premium subscription first';
 END IF;
END $$;
UPDATE public.subscription_cache SET features=coalesce(features,'[]'::jsonb)||jsonb_build_array('ai_job_matching'),synced_at=now(),auth_updated_at=now()
WHERE id='af3e7e1f-92a5-535a-aecd-3f5b628beb84' AND user_id='02f0a43d-3c0a-5026-b44f-5d0696e75f19' AND plan_code='premium' AND status='active' AND subscription_end_date>now()
AND NOT coalesce(features,'[]'::jsonb) ? 'ai_job_matching';
COMMIT;
