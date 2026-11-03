-- Local PostgreSQL regression: every test change is rolled back.
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE u uuid; org uuid; member_id uuid; p jsonb; result jsonb; before_count bigint; after_count bigint; expiry timestamptz; feature_id_value uuid; id1 uuid:=gen_random_uuid(); id2 uuid:=gen_random_uuid();
BEGIN
 SELECT id INTO STRICT u FROM public.users LIMIT 1;
 SELECT organization_id,user_id INTO STRICT org,member_id FROM public.organization_members WHERE status='active' LIMIT 1;
 p:=jsonb_build_object('id',id1,'user_id',u,'feature_key','test_access','razorpay_order_id','order_regression_access','razorpay_payment_id','pay_regression_access','billing_period','quarterly','price_at_purchase',371,'start_date',now(),'end_date',now()+interval '3 months','offer',jsonb_build_object('fulfilment_kind','access','target_feature_key','test_access','quantity',1,'requires_organization',false));
 result:=public.fulfil_addon_purchase(p); expiry:=(result->'entitlement'->>'end_date')::timestamptz;
 IF (result->>'already_fulfilled')::boolean THEN RAISE EXCEPTION 'First delivery was skipped'; END IF;
 result:=public.fulfil_addon_purchase(p||jsonb_build_object('end_date',now()+interval '6 months'));
 IF NOT (result->>'already_fulfilled')::boolean OR (result->'entitlement'->>'end_date')::timestamptz<>expiry THEN RAISE EXCEPTION 'Replay duplicated or extended access'; END IF;
 BEGIN PERFORM public.fulfil_addon_purchase(p||jsonb_build_object('user_id',gen_random_uuid())); RAISE EXCEPTION 'Ownership mismatch was accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='Ownership mismatch was accepted' THEN RAISE; END IF; END;

 SELECT coalesce(sum(amount),0) INTO before_count FROM public.credit_ledger WHERE tenant_id=org AND feature_key='contact_unlocks';
 p:=jsonb_build_object('id',gen_random_uuid(),'user_id',member_id,'organization_id',org,'feature_key','test_credits','razorpay_order_id','order_regression_credit','razorpay_payment_id','pay_regression_credit','billing_period','monthly','price_at_purchase',1000,'start_date',now(),'end_date',now()+interval '1 month','offer',jsonb_build_object('fulfilment_kind','credits','target_feature_key','contact_unlocks','quantity',25,'requires_organization',true));
 PERFORM public.fulfil_addon_purchase(p); PERFORM public.fulfil_addon_purchase(p);
 SELECT coalesce(sum(amount),0) INTO after_count FROM public.credit_ledger WHERE tenant_id=org AND feature_key='contact_unlocks';
 IF after_count-before_count<>25 THEN RAISE EXCEPTION 'Credit replay allocated an incorrect amount'; END IF;
 p:=p||jsonb_build_object('id',gen_random_uuid(),'razorpay_order_id','order_regression_failure','razorpay_payment_id','pay_regression_failure','start_date','invalid-date');
 BEGIN PERFORM public.fulfil_addon_purchase(p); RAISE EXCEPTION 'Malformed marker unexpectedly committed'; EXCEPTION WHEN invalid_datetime_format THEN NULL; END;
 IF EXISTS(SELECT 1 FROM public.credit_ledger WHERE reference_id='pay_regression_failure') OR EXISTS(SELECT 1 FROM public.user_entitlements WHERE razorpay_payment_id='pay_regression_failure') THEN RAISE EXCEPTION 'Failed delivery left partial state'; END IF;

 SELECT id INTO STRICT feature_id_value FROM public.features WHERE feature_key='recruiter_seats';
 INSERT INTO public.tenant_entitlement_overrides(tenant_id,feature_id,is_enabled,value_numeric) VALUES(org,feature_id_value,true,2) ON CONFLICT(tenant_id,feature_id) DO UPDATE SET value_numeric=2,is_enabled=true,expires_at=NULL;
 p:=jsonb_build_object('id',id2,'user_id',member_id,'organization_id',org,'feature_key','test_seat','razorpay_order_id','order_regression_seat1','razorpay_payment_id','pay_regression_seat1','billing_period','annual','price_at_purchase',2500,'start_date',now(),'end_date',now()+interval '1 year','offer',jsonb_build_object('fulfilment_kind','numeric_limit','target_feature_key','recruiter_seats','quantity',1,'requires_organization',true));
 PERFORM public.fulfil_addon_purchase(p); PERFORM public.fulfil_addon_purchase(p);
 p:=p||jsonb_build_object('id',gen_random_uuid(),'razorpay_order_id','order_regression_seat2','razorpay_payment_id','pay_regression_seat2');PERFORM public.fulfil_addon_purchase(p);
 IF (SELECT quantity FROM public.get_addon_numeric_grants(org) WHERE feature_key='recruiter_seats')<>2 THEN RAISE EXCEPTION 'Seat grants did not aggregate independently'; END IF;
 UPDATE public.user_entitlements SET end_date=now()-interval '1 second' WHERE addon_purchase_id=id2;
 IF (SELECT quantity FROM public.get_addon_numeric_grants(org) WHERE feature_key='recruiter_seats')<>1 THEN RAISE EXCEPTION 'Expired seat remained available'; END IF;
 RAISE NOTICE 'PASS: access replay, ownership, credit replay, atomic failure, independent seat expiry';
END; $$;
ROLLBACK;
