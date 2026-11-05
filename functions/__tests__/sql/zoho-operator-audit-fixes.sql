BEGIN;
DO $$
DECLARE connection uuid; snapshot jsonb; page jsonb; review_window jsonb; same_window jsonb; cleanup_result jsonb;
BEGIN
 SELECT id INTO STRICT connection FROM public.zoho_connections LIMIT 1;
 snapshot:=public.zoho_read_job_policy(connection);
 ASSERT NOT snapshot?'triggerSurface';
 ASSERT octet_length(snapshot::text)<10000;
 ASSERT (snapshot->>'surfaceCount')::integer>0;
 ASSERT snapshot->>'triggerFingerprint'=public.zoho_job_trigger_fingerprint();
 page:=public.zoho_job_surface_page(connection,snapshot->>'triggerFingerprint',0);
 ASSERT jsonb_array_length(page->'items')<=10;
 ASSERT octet_length(page::text)<400000;
 BEGIN
  PERFORM public.zoho_job_surface_page(connection,repeat('0',64),0);
  RAISE EXCEPTION 'Changed catalog accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 review_window:=public.zoho_review_window(connection,'Candidates',NULL,'',50,NULL);
 same_window:=public.zoho_review_window(connection,'Candidates',NULL,'',50,review_window->>'fingerprint');
 ASSERT (same_window->>'unchanged')::boolean;
 ASSERT same_window->'records'='[]'::jsonb;
 ASSERT same_window->'total'=review_window->'total';
 BEGIN
  PERFORM public.zoho_review_window(connection,'Candidates',NULL,'',100001,NULL);
  RAISE EXCEPTION 'Unbounded snapshot accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
  PERFORM public.zoho_cleanup_payloads_by_operator(NULL,'Valid reason');
  RAISE EXCEPTION 'Missing actor accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 cleanup_result:=public.zoho_cleanup_payloads_by_operator('10000000-0000-4000-8000-000000000001','Synthetic retention audit');
 ASSERT EXISTS(SELECT 1 FROM public.zoho_payload_cleanup_audit WHERE actor_id='10000000-0000-4000-8000-000000000001'
   AND reason_hash=encode(sha256(convert_to('Synthetic retention audit','UTF8')),'hex') AND zoho_payload_cleanup_audit.result=cleanup_result);
 ASSERT NOT has_function_privilege('anon','public.zoho_job_surface_page(uuid,text,integer)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_review_window(uuid,text,text,text,integer,text)','EXECUTE');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_cleanup_payloads_by_operator(uuid,text)','EXECUTE');
 ASSERT has_function_privilege('service_role','public.zoho_job_surface_page(uuid,text,integer)','EXECUTE');
END $$;
ROLLBACK;
