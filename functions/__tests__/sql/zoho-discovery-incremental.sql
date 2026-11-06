-- All source data is synthetic. No canonical destination writes occur.
DO $$
DECLARE c uuid; actor uuid:=gen_random_uuid(); org uuid; r uuid; next_run uuid; claim jsonb; first_start timestamptz; watermark timestamptz;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Incremental synthetic fixture','99999999999999999991','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 r:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
 ASSERT (SELECT modified_since IS NULL AND next_page=1 FROM public.zoho_discovery_runs WHERE id=r);
 SELECT scan_started_at INTO first_start FROM public.zoho_discovery_runs WHERE id=r;
 claim:=public.zoho_claim_discovery(r);
 ASSERT claim->'run'->>'modified_since' IS NULL;
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,'[]','[]',false);
 next_run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
 watermark:=first_start-interval '10 minutes';
 ASSERT (SELECT modified_since=watermark FROM public.zoho_discovery_runs WHERE id=next_run);
 -- Staging exceptions never advance a watermark.
 claim:=public.zoho_claim_discovery(next_run);
 PERFORM public.zoho_commit_claimed_discovery(next_run,(claim->>'lease')::uuid,1,'[]','[{"externalId":null,"code":"SOURCE_SCHEMA_INVALID"}]',false);
 r:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
 ASSERT (SELECT modified_since=watermark FROM public.zoho_discovery_runs WHERE id=r);
 -- A checkpoint starts at page 501, carries original scan start and any earlier
 -- exceptions, and remains resumable without authorizing any account/job mutation.
 UPDATE public.zoho_discovery_runs SET next_page=500,issues='[{"externalId":null,"code":"SOURCE_SCHEMA_INVALID"}]' WHERE id=r;
 SELECT scan_started_at INTO first_start FROM public.zoho_discovery_runs WHERE id=r;
 claim:=public.zoho_claim_discovery(r);
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,500,'[]','[]',true);
 ASSERT (SELECT state='incomplete' AND next_page=501 AND last_error='CHECKPOINT_AVAILABLE' FROM public.zoho_discovery_runs WHERE id=r);
 next_run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
 ASSERT (SELECT next_page=501 AND scan_started_at=first_start AND modified_since=watermark AND scan_had_exceptions FROM public.zoho_discovery_runs WHERE id=next_run);
 claim:=public.zoho_claim_discovery(next_run);
 ASSERT claim->'run'->>'next_page'='501';
 PERFORM public.zoho_commit_claimed_discovery(next_run,(claim->>'lease')::uuid,501,'[]','[]',false);
 ASSERT (SELECT state='completed_with_exceptions' FROM public.zoho_discovery_runs WHERE id=next_run);
 -- Scheduling only resumes previously enrolled modules and honors pause.
 UPDATE public.zoho_discovery_runs SET completed_at=clock_timestamp()-interval '16 minutes' WHERE id=next_run;
 UPDATE public.zoho_connections SET status='paused' WHERE id=c;
 PERFORM public.zoho_due_discovery();
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE connection_id=c AND state IN ('queued','running'));
 UPDATE public.zoho_connections SET status='connected' WHERE id=c;
 PERFORM public.zoho_due_discovery();
 ASSERT (SELECT count(*)=1 FROM public.zoho_discovery_runs WHERE connection_id=c AND module='Candidates' AND state='queued');
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE connection_id=c AND module='Job_Openings');
 -- Existing active scans are reused, including duplicate scheduler executions.
 PERFORM public.zoho_due_discovery();
 ASSERT (SELECT count(*)=1 FROM public.zoho_discovery_runs WHERE connection_id=c AND state='queued');
 ASSERT NOT has_function_privilege('anon','public.zoho_due_discovery()','EXECUTE');
 ASSERT has_function_privilege('zoho_discovery','public.zoho_due_discovery()','EXECUTE');
END $$;
