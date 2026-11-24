-- Runs exclusively in the disposable publisher fixture DB.
UPDATE public.zoho_connections SET status='paused';
DO $$
DECLARE c uuid; other_source uuid; org uuid; actor uuid:=gen_random_uuid(); r uuid; fresh uuid; claim jsonb; planned jsonb;
 b uuid; due jsonb; n integer; ready uuid; cancelled jsonb;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Pinned transport fixture','88888888888888888001','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 r:=(public.zoho_plan_discovery(c,'Candidates',actor,false)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery_batch(r);
 ASSERT claim->>'claimed'='true';
 planned:=public.zoho_plan_discovery(c,'Candidates',actor,true);
 ASSERT planned->>'transport'='rest' AND (planned->>'runId')::uuid=r;
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_bulk_read_runs WHERE connection_id=c);
 -- Even a transport change outside the planner cannot authorize the old lease.
 UPDATE public.zoho_discovery_runs SET transport='bulk' WHERE id=r;
 BEGIN
  PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,'[]','[]',false);
  RAISE EXCEPTION 'REST lease crossed transport boundary';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 UPDATE public.zoho_discovery_runs SET transport='rest' WHERE id=r;
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,'[]','[]',false);

 c:=(public.zoho_register_connection('Busy manual bulk fixture','88888888888888888002','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 r:=(public.zoho_plan_discovery(c,'Candidates',actor,false)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery_batch(r);
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,'[]','[]',false);
 UPDATE public.zoho_discovery_runs SET completed_at=now()-interval '1 day' WHERE id=r;
 b:=(public.zoho_start_bulk_read(c,'Candidates',gen_random_uuid(),actor)->>'runId')::uuid;
 other_source:=(public.zoho_register_connection('Independent ready fixture','88888888888888888004','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(other_source,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 ready:=(public.zoho_plan_discovery(other_source,'Candidates',actor,false)->>'runId')::uuid;
 due:=public.zoho_due_sync(true);
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(due) item WHERE (item->>'id')::uuid=ready);
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE connection_id=c AND state IN ('queued','running'));

 FOR n IN 1..10 LOOP
  c:=(public.zoho_register_connection('Busy lease fixture '||n,('88888888888888888100'::numeric+n)::text,'in',org,actor)->>'id')::uuid;
  PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
  planned:=public.zoho_plan_discovery(c,'Candidates',actor,true);
  claim:=public.zoho_claim_bulk_read((planned->>'bulkRunId')::uuid);
  ASSERT claim->>'claimed'='true';
 END LOOP;
 UPDATE public.zoho_discovery_runs SET next_attempt_at=clock_timestamp() WHERE id=ready;
 due:=public.zoho_due_sync(true);
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(due) item WHERE (item->>'id')::uuid=ready);
 ASSERT NOT EXISTS(SELECT 1 FROM jsonb_array_elements(due) item JOIN public.zoho_bulk_read_runs br ON br.id=(item->>'bulkRunId')::uuid WHERE br.lease_expires_at>clock_timestamp());

 SELECT br.id INTO STRICT b FROM public.zoho_bulk_read_runs br JOIN public.zoho_connections source ON source.id=br.connection_id WHERE source.source_org_id='88888888888888888101';
 UPDATE public.zoho_bulk_read_runs SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE id=b;
 due:=public.zoho_due_sync(true);
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(due) item WHERE (item->>'bulkRunId')::uuid=b);

 c:=(public.zoho_register_connection('Mapping recovery fixture','88888888888888888003','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 r:=(public.zoho_plan_discovery(c,'Candidates',actor,false)->>'runId')::uuid;
 UPDATE public.zoho_connections SET config_revision=config_revision+1 WHERE id=c;
 cancelled:=public.zoho_control_discovery(c,r,'cancel','Cancel obsolete scan',actor);
 ASSERT cancelled->>'controlState'='cancelled';
 ASSERT (SELECT state='failed' AND last_error='CONNECTION_CHANGED' FROM public.zoho_discovery_runs WHERE id=r);
 fresh:=(public.zoho_plan_discovery(c,'Candidates',actor,false)->>'runId')::uuid;
 ASSERT fresh<>r AND (SELECT config_revision=2 FROM public.zoho_discovery_runs WHERE id=fresh);
 -- A source change with no remaining queue delivery is cleaned by recovery.
 UPDATE public.zoho_connections SET config_revision=config_revision+1 WHERE id=c;
 PERFORM public.zoho_due_sync(false);
 ASSERT (SELECT state='failed' AND lease_token IS NULL AND last_error='CONNECTION_CHANGED' FROM public.zoho_discovery_runs WHERE id=fresh);
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE connection_id=c AND config_revision=3);
 r:=(public.zoho_plan_discovery(c,'Candidates',actor,false)->>'runId')::uuid;
 ASSERT r<>fresh AND (SELECT config_revision=3 FROM public.zoho_discovery_runs WHERE id=r);
 ASSERT NOT has_function_privilege('service_role','public.zoho_retire_stale_discoveries(uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_retire_stale_discoveries(uuid)','EXECUTE');
 -- Same-configuration pauses retain their authority after the repair.
 PERFORM public.zoho_control_discovery(c,r,'pause','Pause current scan',actor);
 PERFORM public.zoho_due_sync(false);
 ASSERT (SELECT state='queued' AND control_state='paused' FROM public.zoho_discovery_runs WHERE id=r);
END $$;

CREATE TABLE public.zoho_sync_recovery_race_fixture(connection_id uuid,actor_id uuid);
DO $$ DECLARE c uuid; org uuid; actor uuid:=gen_random_uuid(); BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Repaired planner race fixture','88888888888888888500','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 INSERT INTO public.zoho_sync_recovery_race_fixture VALUES(c,actor);
END $$;
