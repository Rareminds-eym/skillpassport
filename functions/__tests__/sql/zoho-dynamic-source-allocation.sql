DO $$
DECLARE c uuid; actor uuid:=gen_random_uuid(); org uuid; lease uuid:=gen_random_uuid(); generation integer;
 q public.zoho_source_quota; status jsonb; result jsonb; before_count bigint;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('License fixture','99999999999999998001','in',org,actor)->>'id')::uuid;
 UPDATE public.zoho_connections SET status='connected' WHERE id=c RETURNING credential_generation INTO generation;
 result:=public.zoho_claim_license_refresh(c,lease,false); ASSERT (result->>'acquired')::boolean;
 ASSERT NOT (public.zoho_claim_license_refresh(c,gen_random_uuid(),true)->>'acquired')::boolean;
 PERFORM public.zoho_finish_license_refresh(c,lease,generation,'enterprise','enterprise',5);
 status:=public.zoho_source_quota_status(c);
 ASSERT status->>'estimated_base_allowance'='20000'; ASSERT status->>'rolling_budget'='4000';
 ASSERT status->>'allocation_mode'='automatic'; ASSERT status->>'concurrent_limit'='5';
 ASSERT NOT (public.zoho_claim_license_refresh(c,gen_random_uuid(),false)->>'acquired')::boolean;
 -- Staleness and unknown editions cannot grant a paid allowance.
 UPDATE public.zoho_source_quota SET license_checked_at=now()-interval '25 hours' WHERE source_org_id='99999999999999998001';
 status:=public.zoho_source_quota_status(c); ASSERT status->>'rolling_budget'='1000'; ASSERT (status->>'fallback')::boolean;
 -- Manual values remain operator-owned even across fresh observations.
 PERFORM public.zoho_configure_source_quota(c,7777,3,actor,'Approved manual allocation');
 ASSERT (public.zoho_claim_license_refresh(c,lease,true)->>'acquired')::boolean;
 PERFORM public.zoho_finish_license_refresh(c,lease,generation,'free','free',0);
 status:=public.zoho_source_quota_status(c); ASSERT status->>'rolling_budget'='7777'; ASSERT status->>'concurrent_limit'='3';
 ASSERT status->>'estimated_base_allowance'='5000';
 PERFORM public.zoho_configure_auto_allocation(c,20,actor,'Use automatic allowance');
 status:=public.zoho_source_quota_status(c); ASSERT status->>'rolling_budget'='1000'; ASSERT status->>'concurrent_limit'='2';
 -- Every reservation uses current automatic limits; usage is never reset.
 result:=public.zoho_reserve_source_quota(c,'read'); ASSERT (result->>'granted')::boolean;
 PERFORM public.zoho_settle_source_quota(c,(result->>'reservationId')::uuid,200,0);
 SELECT count(*) INTO before_count FROM public.zoho_source_reservations WHERE connection_id=c;
 ASSERT (public.zoho_claim_license_refresh(c,lease,true)->>'acquired')::boolean;
 PERFORM public.zoho_finish_license_refresh(c,lease,generation,'standard','standard',5);
 status:=public.zoho_source_quota_status(c); ASSERT status->>'rolling_budget'='1250'; ASSERT status->>'used_units'='3';
 ASSERT (SELECT count(*)=before_count FROM public.zoho_source_reservations WHERE connection_id=c);
 -- Provider cooldown remains authoritative after allocation changes.
 UPDATE public.zoho_source_quota SET blocked_until=now()+interval '1 hour' WHERE source_org_id='99999999999999998001';
 PERFORM public.zoho_configure_auto_allocation(c,80,actor,'Increase automatic share');
 ASSERT NOT (public.zoho_reserve_source_quota(c,'read')->>'granted')::boolean;
 -- A downgrade and unknown response clear the previous paid estimate.
 ASSERT (public.zoho_claim_license_refresh(c,lease,true)->>'acquired')::boolean;
 PERFORM public.zoho_finish_license_refresh(c,lease,generation,'future_plan','unknown',NULL);
 status:=public.zoho_source_quota_status(c); ASSERT status->'estimated_base_allowance'='null'::jsonb; ASSERT (status->>'fallback')::boolean;
 -- Reconnected credentials reject a late metadata response.
 ASSERT (public.zoho_claim_license_refresh(c,lease,true)->>'acquired')::boolean;
 UPDATE public.zoho_connections SET credential_generation=credential_generation+1 WHERE id=c;
 BEGIN
  PERFORM public.zoho_finish_license_refresh(c,lease,generation,'enterprise','enterprise',500);
  RAISE EXCEPTION 'Stale credential generation accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 PERFORM public.zoho_fail_license_refresh(c,lease,900);
 ASSERT NOT (public.zoho_claim_license_refresh(c,gen_random_uuid(),false)->>'acquired')::boolean;
 ASSERT NOT has_function_privilege('anon','public.zoho_source_quota_status(uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_configure_auto_allocation(uuid,integer,uuid,text)','EXECUTE');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_finish_license_refresh(uuid,uuid,integer,text,text,integer)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.zoho_reserve_source_quota_fixed(uuid,text)','EXECUTE');
 -- Formula caps are not mistaken for base entitlements.
 SELECT * INTO q FROM public.zoho_source_quota WHERE source_org_id='99999999999999998001';
 q.allocation_mode:='automatic';q.allocation_percent:=100;q.license_checked_at:=now();q.license_users:=1000000;
 q.license_edition:='standard';ASSERT public.zoho_effective_source_allocation(q)->>'estimated_base_allowance'='100000';
 q.license_edition:='professional';ASSERT public.zoho_effective_source_allocation(q)->>'estimated_base_allowance'='500000';
 q.license_edition:='enterprise';ASSERT public.zoho_effective_source_allocation(q)->>'estimated_base_allowance'='1000000';
END $$;
