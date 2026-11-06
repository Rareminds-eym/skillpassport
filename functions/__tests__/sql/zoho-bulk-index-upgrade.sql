DO $$
DECLARE c uuid; org uuid; actor uuid:=gen_random_uuid(); planned jsonb; b uuid; claim jsonb; pointer jsonb; writes jsonb;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Index write fencing fixture','77777777777777777001','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 planned:=public.zoho_plan_discovery(c,'Candidates',actor,true);b:=(planned->>'bulkRunId')::uuid;
 claim:=public.zoho_claim_bulk_read(b);
 PERFORM public.zoho_advance_bulk_read(b,(claim->>'lease')::uuid,'created','{"jobId":"123"}');
 UPDATE public.zoho_bulk_read_runs SET next_attempt_at=now() WHERE id=b;
 claim:=public.zoho_claim_bulk_read(b);
 pointer:=public.zoho_advance_bulk_read(b,(claim->>'lease')::uuid,'artifact-plan',jsonb_build_object('archiveHash',repeat('a',64),'count',201,'more',false))->'artifact';
 PERFORM public.zoho_finish_bulk_artifact_write(b,pointer->>'key',(claim->>'lease')::uuid,true);
 BEGIN
  PERFORM public.zoho_begin_bulk_index_upgrade(b,gen_random_uuid(),pointer->>'key');
  RAISE EXCEPTION 'Wrong upgrade lease accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 PERFORM public.zoho_begin_bulk_index_upgrade(b,(claim->>'lease')::uuid,pointer->>'key');
 ASSERT (SELECT artifact_index_upgrade AND artifact_write_pending AND NOT artifact_ready FROM public.zoho_bulk_read_runs WHERE id=b);
 -- Simulate an erasure while the replacement is in flight. No cleanup success
 -- or legacy-writer ACK can discard its durable pointer.
 UPDATE public.zoho_bulk_read_runs SET state='failed',artifact_cleanup_pending=true,lease_token=NULL,lease_expires_at=NULL WHERE id=b;
 BEGIN
  PERFORM public.zoho_finish_bulk_artifact_write(b,pointer->>'key',(claim->>'lease')::uuid,true);
  RAISE EXCEPTION 'Legacy ACK accepted an index replacement';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 writes:=public.zoho_due_bulk_artifact_writes();
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(writes) item WHERE (item->>'runId')::uuid=b AND item->>'indexUpgrade'='true' AND item->>'writeToken'=claim->>'lease');
 ASSERT NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.zoho_due_bulk_artifact_cleanup()) item WHERE (item->>'runId')::uuid=b);
 ASSERT public.zoho_finish_bulk_artifact_cleanup(b,pointer->>'key')->>'removed'='false';
 ASSERT (SELECT artifact_key IS NOT NULL FROM public.zoho_bulk_read_runs WHERE id=b);
 BEGIN
  PERFORM public.zoho_finish_bulk_index_write(b,pointer->>'key',gen_random_uuid(),true);
  RAISE EXCEPTION 'Wrong replacement token accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 ASSERT public.zoho_finish_bulk_index_write(b,pointer->>'key',(claim->>'lease')::uuid,true)->>'ready'='false';
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(public.zoho_due_bulk_artifact_cleanup()) item WHERE (item->>'runId')::uuid=b);
 ASSERT public.zoho_finish_bulk_artifact_cleanup(b,pointer->>'key')->>'removed'='true';
 ASSERT (SELECT artifact_key IS NULL AND NOT artifact_index_upgrade AND NOT artifact_write_pending FROM public.zoho_bulk_read_runs WHERE id=b);
 ASSERT NOT has_function_privilege('anon','public.zoho_begin_bulk_index_upgrade(uuid,uuid,text)','EXECUTE');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_finish_bulk_index_write(uuid,text,uuid,boolean)','EXECUTE');
END $$;
