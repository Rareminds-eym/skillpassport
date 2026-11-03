DO $$
DECLARE c uuid; actor uuid:=gen_random_uuid(); request uuid:=gen_random_uuid(); record uuid; op uuid; lease uuid;
  items jsonb; changed jsonb; created jsonb; result jsonb; manifest_before jsonb; state text; expires_before timestamptz; run uuid; claim jsonb;
BEGIN
  c:=(public.zoho_register_connection('Exact command recovery fixture','88888888888888888882','in',
    '10000000-0000-4000-8000-000000000001',actor)->>'id')::uuid;
  PERFORM public.zoho_complete_connection(c,jsonb_build_object('version',1,'iv',repeat('A',16),'ciphertext',repeat('A',24)),actor);
  record:=(public.zoho_stage_record(c,'Candidates','1',now(),'{"name":"Reviewed Fixture","email":"fixture@example.com"}','[]')->>'id')::uuid;
  SELECT jsonb_build_array(jsonb_build_object('id',r.id,'revision',r.revision,'sourceHash',r.source_hash,'configRevision',r.config_revision,'targetId',r.target_id))
    INTO items FROM public.zoho_staged_records r WHERE r.id=record;
  ASSERT public.zoho_lookup_decision(c,items,'approve','Reviewed recovery fixture',request,actor)->>'found'='false';
  created:=public.zoho_decide_records(c,items,'approve','Reviewed recovery fixture',request,actor);
  SELECT id INTO STRICT op FROM public.zoho_approved_operations WHERE record_id=record;
  SELECT manifest INTO manifest_before FROM public.zoho_approval_batches WHERE id=(created->>'approvalId')::uuid;
  FOREACH state IN ARRAY ARRAY['queued','processing','completed','source_advanced','expired_approval','paused_source'] LOOP
    IF state='processing' THEN
      lease:=gen_random_uuid(); PERFORM public.zoho_claim_operation(op,lease);
    ELSIF state='completed' THEN
      PERFORM public.zoho_complete_operation(op,lease,gen_random_uuid(),gen_random_uuid());
    ELSIF state='source_advanced' THEN
      PERFORM public.zoho_stage_record(c,'Candidates','1',now()+interval '1 second','{"name":"Next Revision","email":"fixture@example.com"}','[]');
    ELSIF state='expired_approval' THEN
      UPDATE public.zoho_approved_operations SET expires_at=now()-interval '1 second' WHERE id=op;
    ELSIF state='paused_source' THEN
      UPDATE public.zoho_connections SET status='paused' WHERE id=c;
    END IF;
    SELECT expires_at INTO expires_before FROM public.zoho_approved_operations WHERE id=op;
    result:=public.zoho_lookup_decision(c,items,'approve','Reviewed recovery fixture',request,actor);
    ASSERT result->>'found'='true' AND result->'result'->>'replayed'='true';
    ASSERT result->'result'->>'approvalId'=created->>'approvalId';
    ASSERT (SELECT count(*)=1 FROM public.zoho_approved_operations WHERE record_id=record);
    ASSERT (SELECT manifest=manifest_before FROM public.zoho_approval_batches WHERE id=(created->>'approvalId')::uuid);
    ASSERT (SELECT expires_at=expires_before FROM public.zoho_approved_operations WHERE id=op);
  END LOOP;
  FOR changed IN SELECT value FROM jsonb_array_elements(jsonb_build_array(
    jsonb_set(items,'{0,revision}','2'),jsonb_set(items,'{0,sourceHash}',to_jsonb(repeat('b',64))),
    jsonb_set(items,'{0,targetId}',to_jsonb(gen_random_uuid())),jsonb_set(items,'{0,configRevision}','2')
  )) LOOP
    BEGIN
      PERFORM public.zoho_lookup_decision(c,changed,'approve','Reviewed recovery fixture',request,actor);
      RAISE EXCEPTION 'Changed immutable manifest accepted';
    EXCEPTION WHEN serialization_failure THEN NULL; END;
  END LOOP;
  BEGIN
    PERFORM public.zoho_lookup_decision(c,items,'approve','Reviewed recovery fixture',request,gen_random_uuid());
    RAISE EXCEPTION 'Changed actor accepted';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  BEGIN
    PERFORM public.zoho_lookup_decision(c,items,'reject','Reviewed recovery fixture',request,actor);
    RAISE EXCEPTION 'Changed decision accepted';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  BEGIN
    PERFORM public.zoho_lookup_decision(c,items,'approve','Different reason',request,actor);
    RAISE EXCEPTION 'Changed reason accepted';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  ASSERT public.zoho_lookup_decision(c,items,'approve','Reviewed recovery fixture',gen_random_uuid(),actor)->>'found'='false';
  ASSERT (SELECT revision=2 AND decision='pending_approval' FROM public.zoho_staged_records WHERE id=record);
  ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_lookup_decision(uuid,jsonb,text,text,uuid,uuid)','EXECUTE');
  ASSERT NOT has_function_privilege('authenticated','public.zoho_lookup_decision(uuid,jsonb,text,text,uuid,uuid)','EXECUTE');
  ASSERT NOT has_function_privilege('anon','public.zoho_lookup_decision(uuid,jsonb,text,text,uuid,uuid)','EXECUTE');
  -- The JSON shape produced for unsafe IDs is safe at the actual PostgreSQL boundary:
  -- four bad source IDs receive null/code outcomes, while a healthy record progresses.
  UPDATE public.zoho_connections SET status='connected' WHERE id=c;
  run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
  claim:=public.zoho_claim_discovery(run);
  result:=public.zoho_commit_claimed_discovery(run,(claim->>'lease')::uuid,1,
    '[{"externalId":"2","modified":"2026-10-29T08:00:00Z","data":{"name":"Healthy Fixture","email":"healthy@fixture.example"},"errors":[]}]'::jsonb,
    '[{"externalId":null,"code":"SOURCE_SCHEMA_INVALID"},{"externalId":null,"code":"SOURCE_SCHEMA_INVALID"},{"externalId":null,"code":"SOURCE_SCHEMA_INVALID"},{"externalId":null,"code":"SOURCE_SCHEMA_INVALID"}]'::jsonb,false);
  ASSERT result->>'done'='true';
  ASSERT (SELECT next_page=2 AND received_count=5 AND staged_count=1 AND d.state='completed_with_exceptions' AND jsonb_array_length(issues)=4
    FROM public.zoho_discovery_runs d WHERE d.id=run);
  ASSERT EXISTS(SELECT 1 FROM public.zoho_staged_records WHERE connection_id=c AND external_id='2');
END;
$$;
