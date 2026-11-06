-- Both RLS and Supabase Auth are absent. Public-profile discovery goes through
-- the server-only relation; owner/admin APIs use their explicitly authorized path.
INSERT INTO public.users(id,email,role) VALUES('10000000-0000-4000-8000-000000000020','legacy@fixture.example','learner');
INSERT INTO public.learners(user_id,email,name) VALUES('10000000-0000-4000-8000-000000000020','legacy@fixture.example','Legacy Learner');
INSERT INTO public.pipeline_candidates(learner_id,stage,status)
 SELECT id,'new','active' FROM public.learners WHERE user_id='10000000-0000-4000-8000-000000000006';
SET ROLE service_role;
DO $$ BEGIN
 ASSERT (SELECT count(*)=0 FROM public.zoho_recruiter_learners WHERE email='concurrent-projection@fixture.example');
 ASSERT (SELECT count(*)=1 FROM public.zoho_recruiter_learners WHERE email='legacy@fixture.example');
 ASSERT (SELECT count(*)=0 FROM public.zoho_recruiter_pipeline_candidates);
 ASSERT (SELECT count(*)=1 FROM public.learners WHERE email='concurrent-projection@fixture.example');
 ASSERT (public.unlock_candidate_contact('10000000-0000-4000-8000-000000000030',
   '10000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000099')->>'error')='CANDIDATE_NOT_FOUND';
END $$;
RESET ROLE;
SET ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM * FROM public.learners; RAISE EXCEPTION 'Authenticated browser read accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM * FROM public.learner_applications_with_pipeline; RAISE EXCEPTION 'Browser view read accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

CREATE FUNCTION pg_temp.assert_access_conflict(s text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE before_row jsonb; receipt_count integer;
BEGIN
 SELECT to_jsonb(c) INTO before_row FROM public.subscription_cache c WHERE id='10000000-0000-4000-8000-000000000008';
 SELECT count(*) INTO receipt_count FROM public.zoho_candidate_projections;
 BEGIN
  PERFORM public.zoho_apply_candidate_projection(s,encode(sha256(convert_to(s,'UTF8')),'hex'));
  RAISE EXCEPTION 'Critical equal-version conflict was accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 ASSERT (SELECT to_jsonb(c)=before_row FROM public.subscription_cache c WHERE id='10000000-0000-4000-8000-000000000008');
 ASSERT (SELECT count(*)=receipt_count FROM public.zoho_candidate_projections);
END $$;
DO $$
DECLARE b jsonb; s text; receipt jsonb; before_profile jsonb;
BEGIN
 b:=replace(replace(replace(replace(fixture.snapshot(),
  '10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000006'),
  '10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000009'),
  '10000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000008'),
  'projection@fixture.example','concurrent-projection@fixture.example')::jsonb;
 b:=jsonb_set(jsonb_set(b,'{subscriptions,0,plan_type}','"Freemium"'),'{identityOutcome}','"existing_access_preserved"');
 -- This also exercises the default SQL-only runner. The integration test seeds
 -- these values from the actual generic sync handler before running this fixture.
 IF current_setting('zoho.real_generic',true) IS DISTINCT FROM 'true' THEN
  UPDATE public.subscription_cache SET plan_type='Freemium',plan_name='Freemium' WHERE id='10000000-0000-4000-8000-000000000008';
 END IF;
 ASSERT (SELECT plan_type='Freemium' AND plan_name='Freemium' AND plan_amount=0 AND status='active'
  AND auth_updated_at='2026-10-30T00:00:00Z' FROM public.subscription_cache WHERE id='10000000-0000-4000-8000-000000000008');
 SELECT to_jsonb(l) INTO before_profile FROM public.learners l WHERE user_id='10000000-0000-4000-8000-000000000006';
 s:=b::text;
 receipt:=public.zoho_apply_candidate_projection(s,encode(sha256(convert_to(s,'UTF8')),'hex'));
 ASSERT public.zoho_check_candidate_projection((receipt->>'operationId')::uuid,receipt->>'sourceHash',receipt->>'projectionHash',(receipt->>'projectionReceiptId')::uuid);
 ASSERT (SELECT plan_name='Discover' AND plan_type='Freemium' AND plan_amount=0 AND status='active'
  AND auth_updated_at='2026-10-30T00:00:00Z' FROM public.subscription_cache WHERE id='10000000-0000-4000-8000-000000000008');
 ASSERT public.zoho_apply_candidate_projection(s,encode(sha256(convert_to(s,'UTF8')),'hex'))=receipt;
 ASSERT (SELECT to_jsonb(l)=before_profile FROM public.learners l WHERE user_id='10000000-0000-4000-8000-000000000006');
 UPDATE public.subscription_cache SET plan_name='Freemium',status='cancelled' WHERE id='10000000-0000-4000-8000-000000000008';
 PERFORM pg_temp.assert_access_conflict(s);
 UPDATE public.subscription_cache SET status='active',plan_amount=99 WHERE id='10000000-0000-4000-8000-000000000008';
 PERFORM pg_temp.assert_access_conflict(s);
 UPDATE public.subscription_cache SET plan_amount=0,features='["unexpected_paid_feature"]' WHERE id='10000000-0000-4000-8000-000000000008';
 PERFORM pg_temp.assert_access_conflict(s);
 UPDATE public.subscription_cache SET features='[]',subscription_end_date='2026-11-01T00:00:00Z' WHERE id='10000000-0000-4000-8000-000000000008';
 PERFORM pg_temp.assert_access_conflict(s);
 UPDATE public.subscription_cache SET subscription_end_date=NULL,auth_updated_at='2026-11-01T00:00:00Z' WHERE id='10000000-0000-4000-8000-000000000008';
 PERFORM pg_temp.assert_access_conflict(s);
 UPDATE public.subscription_cache SET auth_updated_at='2026-10-30T00:00:00Z',plan_code='wrong_fixture' WHERE id='10000000-0000-4000-8000-000000000008';
 PERFORM pg_temp.assert_access_conflict(s);
 UPDATE public.subscription_cache SET plan_code='freemium',organization_id='10000000-0000-4000-8000-000000000020' WHERE id='10000000-0000-4000-8000-000000000008';
 PERFORM pg_temp.assert_access_conflict(s);
 UPDATE public.subscription_cache SET organization_id=NULL,is_organization_subscription=true WHERE id='10000000-0000-4000-8000-000000000008';
 PERFORM pg_temp.assert_access_conflict(s);
 UPDATE public.subscription_cache SET is_organization_subscription=false,plan_id='10000000-0000-4000-8000-000000000099' WHERE id='10000000-0000-4000-8000-000000000008';
 PERFORM pg_temp.assert_access_conflict(s);
 -- The matching-label case also succeeds and remains idempotent.
 UPDATE public.subscription_cache SET plan_id='10000000-0000-4000-8000-000000000003',plan_type='Discover',plan_name='Discover'
  WHERE id='10000000-0000-4000-8000-000000000008';
 b:=jsonb_set(jsonb_set(b,'{subscriptions,0,plan_type}','"Discover"'),'{operationId}','"10000000-0000-4000-8000-000000000010"');
 s:=b::text;
 receipt:=public.zoho_apply_candidate_projection(s,encode(sha256(convert_to(s,'UTF8')),'hex'));
 ASSERT public.zoho_apply_candidate_projection(s,encode(sha256(convert_to(s,'UTF8')),'hex'))=receipt;
END $$;
