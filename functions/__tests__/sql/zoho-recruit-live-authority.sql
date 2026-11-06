DO $$
DECLARE connection uuid; record jsonb; operation uuid; grant_value jsonb; actor uuid:=gen_random_uuid(); key text;
BEGIN
  connection:=(public.zoho_register_connection('Live authority fixture','88888888888888888881','in',
    '10000000-0000-4000-8000-000000000001',actor)->>'id')::uuid;
  UPDATE public.zoho_connections SET status='connected' WHERE id=connection;
  record:=public.zoho_stage_record(connection,'Candidates','1',now(),'{"email":"fixture@example.com","name":"Fixture"}','[]');
  PERFORM public.zoho_decide_records(connection,jsonb_build_array(jsonb_build_object('id',record->>'id','revision',1)),
    'approve','Reviewed live authority fixture',gen_random_uuid(),actor);
  SELECT id INTO STRICT operation FROM public.zoho_approved_operations WHERE record_id=(record->>'id')::uuid;
  grant_value:=public.zoho_claim_operation(operation,gen_random_uuid());
  ASSERT public.zoho_is_live_approved_operation(grant_value);
  FOREACH key IN ARRAY ARRAY['claimed','operationId','lease','leaseExpiresAt','approvalExpiresAt','actorId','connectionId','sourceOrgId','publisherOrganizationId','recordId','revision','configRevision','sourceHash','action','module','externalId','targetId','emailPolicy','data'] LOOP
    ASSERT NOT public.zoho_is_live_approved_operation(grant_value-key), 'missing live grant field accepted: '||key;
  END LOOP;
  ASSERT NOT public.zoho_is_live_approved_operation(jsonb_set(grant_value,'{operationId}',to_jsonb(gen_random_uuid())));
  ASSERT NOT public.zoho_is_live_approved_operation(jsonb_set(grant_value,'{lease}',to_jsonb(gen_random_uuid())));
  ASSERT NOT public.zoho_is_live_approved_operation(jsonb_set(grant_value,'{data,name}','"Changed"'));
  ASSERT NOT public.zoho_is_live_approved_operation(jsonb_set(grant_value,'{targetId}',to_jsonb(gen_random_uuid())));
  UPDATE public.zoho_connections SET status='paused' WHERE id=connection;
  ASSERT NOT public.zoho_is_live_approved_operation(grant_value);
  UPDATE public.zoho_connections SET status='connected' WHERE id=connection;
  ASSERT public.zoho_is_live_approved_operation(grant_value);
  UPDATE public.zoho_approved_operations SET last_error='OUTCOME_UNKNOWN' WHERE id=operation;
  ASSERT NOT public.zoho_is_live_approved_operation(grant_value);
  UPDATE public.zoho_approved_operations SET last_error=NULL,lease_expires_at=now()-interval '1 second' WHERE id=operation;
  ASSERT NOT public.zoho_is_live_approved_operation(grant_value);
  ASSERT NOT public.zoho_is_live_approved_operation(NULL);
  ASSERT NOT public.zoho_is_live_approved_operation('{}');
  ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_is_live_approved_operation(jsonb)','EXECUTE');
  ASSERT NOT has_function_privilege('anon','public.zoho_is_live_approved_operation(jsonb)','EXECUTE');
  ASSERT NOT has_function_privilege('authenticated','public.zoho_is_live_approved_operation(jsonb)','EXECUTE');
  ASSERT has_function_privilege('service_role','public.zoho_is_live_approved_operation(jsonb)','EXECUTE');
END $$;
