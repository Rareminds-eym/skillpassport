CREATE OR REPLACE FUNCTION pg_temp.snapshot() RETURNS text LANGUAGE sql AS $$
 SELECT jsonb_build_object('version',1,'operationId','10000000-0000-4000-8000-000000000001','sourceHash',repeat('a',64),
  'targetId','10000000-0000-4000-8000-000000000002','identityOutcome','created','emailPolicy','forbidden',
  'user',jsonb_build_object('id','10000000-0000-4000-8000-000000000002','email','projection@fixture.example','primaryRole','learner','name','Synthetic Learner'),
  'plans',jsonb_build_array(jsonb_build_object('id','10000000-0000-4000-8000-000000000003','plan_code','freemium','name','Discover','business_type','b2c',
    'applicable_entities',jsonb_build_array('all'),'pricing_matrix','{"all":{"monthly":0.00}}'::jsonb,'base_features','[]'::jsonb,'entity_config','{}'::jsonb,
    'display_order',0,'is_active',true,'product_id','10000000-0000-4000-8000-000000000005','updated_at','2026-10-30T00:00:00+00:00')),
  'subscriptions',jsonb_build_array(jsonb_build_object('id','10000000-0000-4000-8000-000000000004','user_id','10000000-0000-4000-8000-000000000002',
    'plan_id','10000000-0000-4000-8000-000000000003','plan_code','freemium','plan_type','Discover','plan_amount',0.00,'billing_cycle','lifetime',
    'features','[]'::jsonb,'status','active','subscription_start_date','2026-10-30T00:00:00+00:00','subscription_end_date',NULL,
    'product_id','10000000-0000-4000-8000-000000000005','updated_at','2026-10-30T00:00:00+00:00')))::text;
$$;
DO $$
DECLARE s text:=pg_temp.snapshot(); h text; bad text; result jsonb; replay jsonb; uid uuid:='10000000-0000-4000-8000-000000000002'; l uuid; before_user jsonb; before_learner jsonb;
BEGIN
 h:=encode(sha256(convert_to(s,'UTF8')),'hex');
 BEGIN
  PERFORM public.zoho_apply_candidate_projection(s,repeat('b',64)); RAISE EXCEPTION 'Invalid digest accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 ASSERT NOT EXISTS(SELECT 1 FROM public.users);
 bad:=jsonb_set(s::jsonb,'{subscriptions,0,status}','"cancelled"')::text;
 BEGIN
  PERFORM public.zoho_apply_candidate_projection(bad,encode(sha256(convert_to(bad,'UTF8')),'hex'));
  RAISE EXCEPTION 'Projection without effective access succeeded';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 ASSERT NOT EXISTS(SELECT 1 FROM public.users);
 ASSERT NOT EXISTS(SELECT 1 FROM public.learners);
 ASSERT NOT EXISTS(SELECT 1 FROM public.users_shadow);
 ASSERT NOT EXISTS(SELECT 1 FROM public.plans_cache);
 ASSERT NOT EXISTS(SELECT 1 FROM public.subscription_cache);
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_candidate_projections);
 result:=public.zoho_apply_candidate_projection(s,h);
 ASSERT public.zoho_check_candidate_projection((result->>'operationId')::uuid,result->>'sourceHash',h,(result->>'projectionReceiptId')::uuid);
 ASSERT NOT public.zoho_check_candidate_projection((result->>'operationId')::uuid,repeat('b',64),h,(result->>'projectionReceiptId')::uuid);
 SELECT id INTO l FROM public.learners WHERE user_id=uid;
 ASSERT EXISTS(SELECT 1 FROM public.users WHERE id=uid AND role='learner' AND "organizationId" IS NULL AND temporary_password IS NULL);
 ASSERT EXISTS(SELECT 1 FROM public.learners WHERE id=l AND school_id IS NULL AND college_id IS NULL AND "universityId" IS NULL
  AND notification_settings->>'emailNotifications'='false' AND learner_id IS NOT NULL);
 replay:=public.zoho_apply_candidate_projection(s,h); ASSERT replay=result;
 ASSERT (SELECT count(*)=1 FROM public.zoho_candidate_projections);
 SELECT to_jsonb(u) INTO before_user FROM public.users u WHERE id=uid;
 UPDATE public.learners SET notification_settings='{"emailNotifications":true,"explicitPreference":false}',bio='Retain independent activity' WHERE id=l;
 SELECT to_jsonb(p) INTO before_learner FROM public.learners p WHERE id=l;
 ASSERT NOT public.zoho_check_candidate_projection((result->>'operationId')::uuid,result->>'sourceHash',h,(result->>'projectionReceiptId')::uuid);
 PERFORM public.zoho_apply_candidate_projection(s,h);
 ASSERT (SELECT to_jsonb(u)=before_user FROM public.users u WHERE id=uid);
 ASSERT (SELECT to_jsonb(p)=before_learner FROM public.learners p WHERE id=l);
 -- A newer paid cache version cannot be overwritten by an old free snapshot.
 UPDATE public.subscription_cache SET plan_code='paid_fixture',plan_amount=100.50,auth_updated_at='2026-10-31T00:00:00Z' WHERE user_id=uid;
 BEGIN
  PERFORM public.zoho_apply_candidate_projection(s,h); RAISE EXCEPTION 'Stale projection overwrote paid state';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 ASSERT EXISTS(SELECT 1 FROM public.subscription_cache WHERE user_id=uid AND plan_code='paid_fixture' AND plan_amount=100.50);
 ASSERT NOT public.zoho_check_candidate_projection((result->>'operationId')::uuid,result->>'sourceHash',h,(result->>'projectionReceiptId')::uuid);
 ASSERT NOT has_function_privilege('anon','public.zoho_apply_candidate_projection(text,text)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_check_candidate_projection(uuid,text,text,uuid)','EXECUTE');
 ASSERT NOT has_table_privilege('service_role','public.zoho_candidate_projections','UPDATE');
END $$;
-- No built-in auth identity or RLS is involved; browsers have no direct access.
SET ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM * FROM public.learners; RAISE EXCEPTION 'Browser read accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM * FROM public.zoho_recruiter_learners; RAISE EXCEPTION 'Private view exposed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE service_role;
DO $$ BEGIN
 ASSERT (SELECT count(*)=0 FROM public.zoho_recruiter_learners);
 ASSERT (SELECT count(*)=1 FROM public.learners);
 BEGIN
  UPDATE public.learners SET user_id=NULL; RAISE EXCEPTION 'Private learner owner reassigned';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
  UPDATE public.users_shadow SET id='10000000-0000-4000-8000-000000000099'; RAISE EXCEPTION 'Private shadow owner reassigned';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
RESET ROLE;
DO $$
DECLARE s text:=pg_temp.snapshot(); h text;
BEGIN
 h:=encode(sha256(convert_to(s,'UTF8')),'hex');
 DELETE FROM public.learners WHERE user_id='10000000-0000-4000-8000-000000000002';
 BEGIN
  PERFORM public.zoho_apply_candidate_projection(s,h); RAISE EXCEPTION 'Deleted learner resurrected';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 ASSERT NOT EXISTS(SELECT 1 FROM public.learners);
END $$;
