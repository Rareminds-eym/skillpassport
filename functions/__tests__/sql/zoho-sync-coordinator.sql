-- Synthetic records only. All assertions execute against real functions/locks.
DO $$
DECLARE c uuid; actor uuid:=gen_random_uuid(); org uuid; r uuid; run2 uuid; claim jsonb; planned jsonb; b uuid; snapshot jsonb; rec jsonb;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Durable sync fixture','99999999999999999988','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 planned:=public.zoho_plan_discovery(c,'Candidates',actor,false);r:=(planned->>'runId')::uuid;
 ASSERT planned->>'transport'='rest';
 claim:=public.zoho_claim_discovery_batch(r);
 rec:='[{"externalId":"111","modified":"2026-11-06T00:00:00Z","data":{"name":"Synthetic Candidate","email":"sync@example.invalid"},"errors":[]}]';
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,rec,'[]',false);
 ASSERT (SELECT capture_complete AND new_count=1 AND unchanged_count=0 FROM public.zoho_discovery_runs WHERE id=r);
 run2:=(public.zoho_plan_discovery(c,'Candidates',actor,false)->>'runId')::uuid;
 ASSERT (SELECT modified_since IS NOT NULL FROM public.zoho_discovery_runs WHERE id=run2);
 claim:=public.zoho_claim_discovery_batch(run2);
 PERFORM public.zoho_commit_claimed_discovery(run2,(claim->>'lease')::uuid,1,rec,'[]',false);
 ASSERT (SELECT unchanged_count=1 AND new_count=0 AND capture_complete FROM public.zoho_discovery_runs WHERE id=run2);
 -- Timestamp/version changed: one new review revision, no identity creation.
 r:=(public.zoho_plan_discovery(c,'Candidates',actor,false)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery_batch(r);
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,replace(replace(rec::text,'Synthetic Candidate','Updated Candidate'),'2026-11-06T00:00:00Z','2026-11-06T01:00:00Z')::jsonb,'[]',false);
 ASSERT (SELECT changed_count=1 AND new_count=0 FROM public.zoho_discovery_runs WHERE id=r);
 -- Schema-invalid records cannot advance a capture watermark, including after checkpoint rollover.
 r:=(public.zoho_plan_discovery(c,'Candidates',actor,false)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery_batch(r);
 UPDATE public.zoho_discovery_runs SET next_page=500,lease_page=500 WHERE id=r;
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,500,'[]','[{"externalId":"999","code":"SOURCE_SCHEMA_INVALID"}]',true);
 r:=(public.zoho_plan_discovery(c,'Candidates',actor,false)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery_batch(r);
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,501,'[]','[]',false);
 ASSERT (SELECT NOT capture_complete AND capture_had_schema_issues FROM public.zoho_discovery_runs WHERE id=r);
 -- Durable normalized quarantines may finish source capture independently of review.
 r:=(public.zoho_plan_discovery(c,'Candidates',actor,false)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery_batch(r);
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,
 jsonb_build_array(jsonb_build_object('externalId','222','modified',now(),'data',jsonb_build_object('name',repeat('x',70000),'email','large@example.invalid'),'errors','[]'::jsonb)),'[]',false);
 ASSERT (SELECT capture_complete AND state='completed_with_exceptions' AND deferred_count=1 FROM public.zoho_discovery_runs WHERE id=r);
 ASSERT EXISTS(SELECT 1 FROM public.zoho_deferred_records WHERE connection_id=c AND external_id='222' AND proposed_data IS NOT NULL);
 -- Authenticated webhook hints contain no candidate payload and collapse to one module row.
 PERFORM public.zoho_rotate_webhook(c,1,repeat('a',64),actor);
 ASSERT NOT public.zoho_accept_sync_hint(c,'Candidates',repeat('b',64));
 ASSERT public.zoho_accept_sync_hint(c,'Candidates',repeat('a',64));
 ASSERT public.zoho_accept_sync_hint(c,'Candidates',repeat('a',64));
 ASSERT (SELECT count(*)=1 FROM public.zoho_sync_hints WHERE connection_id=c);
 snapshot:=public.zoho_sync_snapshot(c);
 ASSERT snapshot->>'webhookConfigured'='true' AND jsonb_array_length(snapshot->'policies')=2;
 ASSERT snapshot::text NOT LIKE '%'||repeat('a',64)||'%';
 -- Policy edits do not invalidate existing source reviews or bypass pause.
 PERFORM public.zoho_configure_sync(c,'Candidates',1,false,30,14,false,actor);
 UPDATE public.zoho_discovery_runs SET completed_at=now()-interval '2 days' WHERE id=r;
 PERFORM public.zoho_due_sync(false);
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE connection_id=c AND state IN ('queued','running'));
 PERFORM public.zoho_configure_sync(c,'Candidates',1,true,15,7,false,actor);
 PERFORM public.zoho_due_sync(false);
 SELECT id INTO STRICT r FROM public.zoho_discovery_runs WHERE connection_id=c AND module='Candidates' AND state IN ('queued','running');
 PERFORM public.zoho_control_discovery(c,r,'pause','Synthetic pause',actor);
 ASSERT public.zoho_claim_discovery_batch(r)->>'claimed'='false';
 PERFORM public.zoho_due_sync(false);
 ASSERT (SELECT count(*)=1 FROM public.zoho_discovery_runs WHERE connection_id=c AND state IN ('queued','running'));
 PERFORM public.zoho_control_discovery(c,r,'cancel','Synthetic cancel',actor);
 PERFORM public.zoho_due_sync(false);
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE connection_id=c AND state IN ('queued','running'));
 -- Automatic bulk baseline uses a single durable job; legacy workers cannot read it.
 planned:=public.zoho_plan_discovery(c,'Job_Openings',actor,true); r:=(planned->>'runId')::uuid; b:=(planned->>'bulkRunId')::uuid;
 ASSERT planned->>'transport'='bulk' AND b IS NOT NULL;
 ASSERT public.zoho_claim_discovery_batch(r)->>'claimed'='false';
 ASSERT public.zoho_claim_discovery(r)->>'claimed'='false';
 ASSERT public.zoho_plan_discovery(c,'Job_Openings',actor,true)->>'bulkRunId'=b::text;
 PERFORM public.zoho_control_discovery(c,r,'pause','Pause bulk baseline',actor);
 ASSERT public.zoho_claim_bulk_read(b)->>'claimed'='false';
 PERFORM public.zoho_control_discovery(c,r,'resume','Resume bulk baseline',actor);
 claim:=public.zoho_claim_bulk_read(b);
 ASSERT claim->>'claimed'='true';
 PERFORM public.zoho_advance_bulk_read(b,(claim->>'lease')::uuid,'failed','{}');
 ASSERT (SELECT transport='rest' AND state='queued' AND last_error='BULK_FALLBACK_REST' FROM public.zoho_discovery_runs WHERE id=r);
 claim:=public.zoho_claim_discovery_batch(r);
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,'[]','[]',false);
 ASSERT (SELECT capture_complete FROM public.zoho_discovery_runs WHERE id=r);
 ASSERT public.zoho_plan_discovery(c,'Job_Openings',actor,true)->>'transport'='rest';
 -- No browser/discovery role may rotate secrets, modify policy, or read hashes.
 ASSERT NOT has_table_privilege('service_role','public.zoho_webhook_credentials','SELECT');
 ASSERT NOT has_table_privilege('authenticated','public.zoho_sync_hints','INSERT');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_rotate_webhook(uuid,integer,text,uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('anon','public.zoho_accept_sync_hint(uuid,text,text)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.zoho_commit_discovery_before_capture(uuid,integer,jsonb,jsonb,boolean)','EXECUTE');
END $$;

DO $$
DECLARE c uuid; org uuid; actor uuid:=gen_random_uuid(); planned jsonb; r uuid; b uuid; claim jsonb; before_count integer;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Bulk completion fixture','99999999999999999987','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 planned:=public.zoho_plan_discovery(c,'Candidates',actor,true);r:=(planned->>'runId')::uuid;b:=(planned->>'bulkRunId')::uuid;
 claim:=public.zoho_claim_bulk_read(b);
 PERFORM public.zoho_advance_bulk_read(b,(claim->>'lease')::uuid,'created','{"jobId":"123"}');
 UPDATE public.zoho_bulk_read_runs SET next_attempt_at=now() WHERE id=b;
 claim:=public.zoho_claim_bulk_read(b);
 -- A pause revokes the exact previously issued lease, including staging commits.
 PERFORM public.zoho_control_discovery(c,r,'pause','Fence stale bulk commit',actor);
 BEGIN
  PERFORM public.zoho_advance_bulk_read(b,(claim->>'lease')::uuid,'waiting','{}');
  RAISE EXCEPTION 'Stale bulk lease accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 PERFORM public.zoho_control_discovery(c,r,'resume','Resume completed export',actor);
 claim:=public.zoho_claim_bulk_read(b);
 PERFORM public.zoho_advance_bulk_read(b,(claim->>'lease')::uuid,'rows',jsonb_build_object('records','[]'::jsonb,'issues','[]'::jsonb,
 'done',true,'more',false,'total',0,'nextOffset',0,'archiveHash',repeat('a',64)));
 ASSERT (SELECT state='queued' AND transport='rest' AND NOT capture_complete AND last_error='BULK_COVERAGE_VERIFY' FROM public.zoho_discovery_runs WHERE id=r);
 claim:=public.zoho_claim_discovery_batch(r);
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,'[]','[]',false);
 ASSERT (SELECT state='completed' AND capture_complete FROM public.zoho_discovery_runs WHERE id=r);
 planned:=public.zoho_plan_discovery(c,'Candidates',actor,true);r:=(planned->>'runId')::uuid;
 ASSERT planned->>'transport'='rest';
 ASSERT (SELECT modified_since IS NOT NULL FROM public.zoho_discovery_runs WHERE id=r);
 -- A manual bulk export cannot race the active REST scan.
 BEGIN
  PERFORM public.zoho_start_bulk_read(c,'Candidates',gen_random_uuid(),actor);
  RAISE EXCEPTION 'Concurrent transport accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 -- Credentials are invalid after relevant configuration changes.
 PERFORM public.zoho_rotate_webhook(c,1,repeat('a',64),actor);
 UPDATE public.zoho_connections SET config_revision=2 WHERE id=c;
 ASSERT NOT public.zoho_accept_sync_hint(c,'Candidates',repeat('a',64));
END $$;

CREATE TABLE public.zoho_sync_race_fixture(connection_id uuid,actor_id uuid);
DO $$ DECLARE c uuid; org uuid; actor uuid:=gen_random_uuid(); BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Sync planner race fixture','99999999999999999986','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 INSERT INTO public.zoho_sync_race_fixture VALUES(c,actor);
END $$;
