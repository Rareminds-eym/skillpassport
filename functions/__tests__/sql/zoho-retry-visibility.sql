BEGIN;
DO $$
DECLARE c public.zoho_connections; status jsonb; first_at timestamptz:=clock_timestamp()-interval '23 hours';
 second_at timestamptz:=clock_timestamp()-interval '20 hours'; cooldown timestamptz:=clock_timestamp()+interval '8 hours'; snapshot jsonb;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections LIMIT 1;
 DELETE FROM public.zoho_source_reservations WHERE region=c.region AND source_org_id=c.source_org_id;
 INSERT INTO public.zoho_source_quota(region,source_org_id,rolling_budget,concurrent_limit,allocation_mode)
 VALUES(c.region,c.source_org_id,6,2,'manual') ON CONFLICT(region,source_org_id) DO UPDATE SET rolling_budget=6,allocation_mode='manual',blocked_until='-infinity';
 INSERT INTO public.zoho_source_reservations(connection_id,region,source_org_id,kind,cost,created_at,settled_at,response_status)
 VALUES(c.id,c.region,c.source_org_id,'oauth',1,first_at,first_at,200),
 (c.id,c.region,c.source_org_id,'read',3,second_at,second_at,204),
 (c.id,c.region,c.source_org_id,'oauth',2,second_at+interval '1 second',second_at,200);
 status:=public.zoho_source_quota_status(c.id);
 ASSERT (status->>'used_units')::integer=6 AND (status->>'remaining_units')::integer=0;
 ASSERT (status->>'next_replenishment_at')::timestamptz=first_at+interval '24 hours';
 -- The earliest 1-unit expiry cannot admit a 3-unit read.
 ASSERT (status->>'read_available_at')::timestamptz=second_at+interval '24 hours';
 ASSERT status->>'allocation_mode'='manual';
 ASSERT (SELECT count(*)=3 FROM public.zoho_source_reservations WHERE region=c.region AND source_org_id=c.source_org_id);
 UPDATE public.zoho_source_quota SET rolling_budget=4 WHERE region=c.region AND source_org_id=c.source_org_id;
 status:=public.zoho_source_quota_status(c.id);
 -- After reducing a budget, enough old cost must age out to cover the full deficit.
 ASSERT (status->>'read_available_at')::timestamptz=second_at+interval '24 hours 1 second';
 UPDATE public.zoho_source_quota SET blocked_until=cooldown WHERE region=c.region AND source_org_id=c.source_org_id;
 status:=public.zoho_source_quota_status(c.id);
 ASSERT (status->>'read_available_at')::timestamptz=cooldown;
 UPDATE public.zoho_source_quota SET rolling_budget=2 WHERE region=c.region AND source_org_id=c.source_org_id;
 status:=public.zoho_source_quota_status(c.id);
 ASSERT NOT (status->>'read_request_possible')::boolean AND status->'read_available_at'='null'::jsonb;
 UPDATE public.zoho_source_reservations SET created_at=clock_timestamp()-interval '25 hours' WHERE region=c.region AND source_org_id=c.source_org_id;
 UPDATE public.zoho_source_quota SET rolling_budget=6,blocked_until='-infinity' WHERE region=c.region AND source_org_id=c.source_org_id;
 status:=public.zoho_source_quota_status(c.id);
 ASSERT (status->>'used_units')::integer=0 AND status->'next_replenishment_at'='null'::jsonb;
 ASSERT (status->>'remaining_units')::integer=6;
 snapshot:=public.zoho_bulk_read_snapshot(c.id);
 ASSERT NOT EXISTS(SELECT 1 FROM jsonb_array_elements(snapshot) item WHERE item?'lease_token' OR item?'provider_job_id' OR item?'artifact_key');
 ASSERT NOT has_function_privilege('service_role','public.zoho_source_quota_status_before_retry_visibility(uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_source_quota_status(uuid)','EXECUTE');
END $$;
ROLLBACK;
