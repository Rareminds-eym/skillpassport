-- Synthetic local fixture only. No target data, HTTP, source credential or email.
DO $$
DECLARE c uuid; actor uuid:=gen_random_uuid(); org uuid; run_id uuid; claim jsonb; lease uuid;
 a jsonb; b jsonb; denied jsonb; envelope jsonb:='{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}';
 rotated jsonb:='{"version":1,"keyId":"current","iv":"BBBBBBBBBBBBBBBB","ciphertext":"BBBBBBBBBBBBBBBBBBBBBBBB"}'; generation integer;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Quota synthetic fixture','99999999999999999001','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,envelope,actor);
 PERFORM public.zoho_configure_source_quota(c,6,1,actor,'Synthetic strict budget');
 run_id:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery(run_id); lease:=(claim->>'lease')::uuid;
 a:=public.zoho_reserve_discovery_quota(run_id,lease,'read'); ASSERT (a->>'granted')::boolean;
 denied:=public.zoho_reserve_discovery_quota(run_id,lease,'read'); ASSERT NOT (denied->>'granted')::boolean;
 ASSERT public.zoho_settle_discovery_quota(run_id,lease,(a->>'reservationId')::uuid,200,0)->>'settled'='true';
 ASSERT public.zoho_settle_discovery_quota(run_id,lease,(a->>'reservationId')::uuid,200,0)->>'settled'='false';
 b:=public.zoho_reserve_discovery_quota(run_id,lease,'read'); ASSERT (b->>'granted')::boolean;
 PERFORM public.zoho_settle_discovery_quota(run_id,lease,(b->>'reservationId')::uuid,0,0);
 -- Ambiguous transport failures and duplicate deliveries cannot refund budget.
 denied:=public.zoho_reserve_discovery_quota(run_id,lease,'read'); ASSERT NOT (denied->>'granted')::boolean;
 PERFORM public.zoho_configure_source_quota(c,1000,2,actor,'Synthetic backoff test');
 b:=public.zoho_reserve_discovery_quota(run_id,lease,'read');
 PERFORM public.zoho_settle_discovery_quota(run_id,lease,(b->>'reservationId')::uuid,429,180);
 ASSERT (SELECT blocked_until>clock_timestamp()+interval '170 seconds' FROM public.zoho_source_quota WHERE source_org_id='99999999999999999001');
 denied:=public.zoho_reserve_discovery_quota(run_id,lease,'oauth'); ASSERT NOT (denied->>'granted')::boolean;
 -- Provider backoff is shared across modules and queue deliveries.
 ASSERT (denied->>'retryAfterSeconds')::integer>=170;
 BEGIN
  PERFORM public.zoho_reserve_discovery_quota(run_id,gen_random_uuid(),'read');
  RAISE EXCEPTION 'Stale discovery lease accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 SELECT credential_generation INTO generation FROM public.zoho_connections WHERE id=c;
 BEGIN
  PERFORM public.zoho_rotate_connection_tokens(c,generation,envelope,rotated,actor,'Approved synthetic rotation');
  RAISE EXCEPTION 'Unpaused rotation accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 UPDATE public.zoho_connections SET status='paused' WHERE id=c;
 BEGIN
  PERFORM public.zoho_rotate_connection_tokens(c,generation+1,envelope,rotated,actor,'Approved synthetic rotation');
  RAISE EXCEPTION 'Stale generation accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 UPDATE public.zoho_connection_secrets SET refresh_lease=gen_random_uuid(),refresh_expires_at=clock_timestamp()+interval '30 seconds' WHERE connection_id=c;
 BEGIN
  PERFORM public.zoho_rotate_connection_tokens(c,generation,envelope,rotated,actor,'Approved synthetic rotation');
  RAISE EXCEPTION 'Active refresh lease accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 UPDATE public.zoho_connection_secrets SET refresh_expires_at=clock_timestamp()-interval '1 second' WHERE connection_id=c;
 b:=public.zoho_rotate_connection_tokens(c,generation,envelope,rotated,actor,'Approved synthetic rotation');
 ASSERT b->>'status'='paused'; ASSERT b->>'keyId'='current'; ASSERT (b->>'credentialGeneration')::integer=generation+1;
 ASSERT (SELECT s.envelope=rotated FROM public.zoho_connection_secrets s WHERE s.connection_id=c);
 ASSERT (SELECT count(*)=1 FROM public.zoho_security_events WHERE connection_id=c AND action='rotate_tokens');
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_security_events WHERE metadata::text LIKE '%ciphertext%');
 BEGIN
  PERFORM public.zoho_rotate_connection_tokens(c,generation,envelope,rotated,actor,'Replayed synthetic rotation');
  RAISE EXCEPTION 'Replayed rotation accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 ASSERT NOT has_table_privilege('anon','public.zoho_source_quota','SELECT');
 ASSERT NOT has_table_privilege('authenticated','public.zoho_security_events','SELECT');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_rotate_connection_tokens(uuid,integer,jsonb,jsonb,uuid,text)','EXECUTE');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_reserve_source_quota(uuid,text)','EXECUTE');
 ASSERT has_function_privilege('zoho_discovery','public.zoho_reserve_discovery_quota(uuid,uuid,text)','EXECUTE');
 ASSERT NOT EXISTS(SELECT 1 FROM pg_class WHERE oid IN('public.zoho_source_quota'::regclass,'public.zoho_source_reservations'::regclass,'public.zoho_security_events'::regclass) AND relrowsecurity);
END $$;

DO $$
DECLARE c uuid; actor uuid:=gen_random_uuid(); org uuid; generation integer; lease uuid:=gen_random_uuid(); r jsonb;
 envelope jsonb:='{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}';
 renewed jsonb:='{"version":1,"keyId":"current","iv":"BBBBBBBBBBBBBBBB","ciphertext":"BBBBBBBBBBBBBBBBBBBBBBBB"}';
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Generic refresh fixture','99999999999999999003','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,envelope,actor);
 SELECT credential_generation INTO generation FROM public.zoho_connections WHERE id=c;
 ASSERT public.zoho_begin_connection_refresh(c,generation,envelope,lease)->>'acquired'='true';
 ASSERT public.zoho_begin_connection_refresh(c,generation,envelope,gen_random_uuid())->>'acquired'='false';
 ASSERT public.zoho_mark_connection_refresh(c,generation,lease)->>'started'='true';
 -- A worker crash after POST does not authorize another refresh after expiry.
 UPDATE public.zoho_connection_secrets SET refresh_expires_at=clock_timestamp()-interval '1 second' WHERE connection_id=c;
 r:=public.zoho_begin_connection_refresh(c,generation,envelope,gen_random_uuid());
 ASSERT r->>'acquired'='false' AND r->>'recoveryRequired'='true';
 UPDATE public.zoho_connections SET status='paused' WHERE id=c;
 BEGIN
  PERFORM public.zoho_rotate_connection_tokens(c,generation,envelope,renewed,actor,'Do not clear uncertain refresh');
  RAISE EXCEPTION 'Rotation cleared ambiguous POST';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 -- Explicit successful OAuth reconnect replaces credentials and resets marker.
 PERFORM public.zoho_complete_connection(c,renewed,actor);
 ASSERT (SELECT NOT refresh_uncertain AND refresh_lease IS NULL FROM public.zoho_connection_secrets WHERE connection_id=c);
 SELECT credential_generation INTO generation FROM public.zoho_connections WHERE id=c;
 lease:=gen_random_uuid();
 ASSERT public.zoho_begin_connection_refresh(c,generation,renewed,lease)->>'acquired'='true';
 ASSERT public.zoho_cancel_connection_refresh(c,generation,lease)->>'cancelled'='true';
 lease:=gen_random_uuid();
 PERFORM public.zoho_begin_connection_refresh(c,generation,renewed,lease);
 PERFORM public.zoho_mark_connection_refresh(c,generation,lease);
 UPDATE public.zoho_connections SET status='paused' WHERE id=c;
 BEGIN
  PERFORM public.zoho_finish_connection_refresh(c,generation,lease,envelope);
  RAISE EXCEPTION 'Paused refresh completion accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 UPDATE public.zoho_connections SET status='connected' WHERE id=c;
 ASSERT public.zoho_finish_connection_refresh(c,generation,lease,envelope)->>'refreshed'='true';
 ASSERT (SELECT NOT s.refresh_uncertain AND s.refresh_lease IS NULL AND s.envelope->>'iv'='AAAAAAAAAAAAAAAA' FROM public.zoho_connection_secrets s WHERE s.connection_id=c);
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_begin_connection_refresh(uuid,integer,jsonb,uuid)','EXECUTE');
END $$;
