DO $$
DECLARE c uuid; org uuid; actor uuid:=gen_random_uuid(); record uuid; op uuid; run uuid; job_run uuid;
  claim jsonb; job_claim jsonb; result jsonb; lease uuid; target uuid:=gen_random_uuid();
  envelope jsonb:=jsonb_build_object('version',1,'iv',repeat('A',16),'ciphertext',repeat('A',24));
  renewed jsonb:=jsonb_build_object('version',1,'iv',repeat('B',16),'ciphertext',repeat('B',24));
  canonical_users bigint; canonical_learners bigint; canonical_jobs bigint;
BEGIN
  SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
  SELECT count(*) INTO canonical_users FROM public.users;
  SELECT count(*) INTO canonical_learners FROM public.learners;
  SELECT count(*) INTO canonical_jobs FROM public.opportunities;
  c:=(public.zoho_register_connection('Recovery synthetic fixture','99999999999999999994','in',org,actor)->>'id')::uuid;
  PERFORM public.zoho_complete_connection(c,envelope,actor);
  record:=(public.zoho_stage_record(c,'Candidates','1',now(),'{"name":"Old Fixture","email":"fixture@example.com"}','[]')->>'id')::uuid;
  PERFORM public.zoho_decide_records(c,jsonb_build_array(jsonb_build_object('id',record,'revision',1)),
    'approve','Synthetic recovery approval',gen_random_uuid(),actor);
  SELECT id INTO STRICT op FROM public.zoho_approved_operations WHERE record_id=record;
  lease:=gen_random_uuid();
  PERFORM public.zoho_claim_operation(op,lease);
  PERFORM public.zoho_record_execution_outcome(op,lease,'OUTCOME_UNKNOWN');
  run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
  claim:=public.zoho_claim_discovery(run);
  result:=public.zoho_commit_claimed_discovery(run,(claim->>'lease')::uuid,1,jsonb_build_array(
    jsonb_build_object('externalId','1','modified',now()+interval '1 second','data',jsonb_build_object('name','Changed Fixture','email','fixture@example.com'),'errors','[]'::jsonb),
    jsonb_build_object('externalId','2','modified',now(),'data',jsonb_build_object('name','Unrelated Fixture','email','other@example.com'),'errors','[]'::jsonb),
    jsonb_build_object('externalId','3','modified',now()+interval '1 day','data',jsonb_build_object('name','Invalid Future Date','email','invalid@example.com'),'errors','[]'::jsonb),
    jsonb_build_object('externalId','4','modified',now(),'data',jsonb_build_object('name','After Poison Row','email','last@example.com'),'errors','[]'::jsonb)
  ),'[]',false);
  ASSERT result->>'done'='true' AND result->>'deferred'='2';
  ASSERT (SELECT received_count=4 AND staged_count=2 AND deferred_count=2 AND next_page=2 AND state='completed_with_exceptions' FROM public.zoho_discovery_runs WHERE id=run);
  ASSERT (SELECT count(*)=2 FROM public.zoho_staged_records WHERE connection_id=c AND external_id IN ('2','4') AND decision='pending_approval');
  ASSERT (SELECT proposed_data->>'name'='Old Fixture' AND revision=1 AND decision='processing' FROM public.zoho_staged_records WHERE id=record);
  ASSERT (SELECT state='processing' AND last_error='OUTCOME_UNKNOWN' FROM public.zoho_approved_operations WHERE id=op);
  ASSERT (SELECT state='waiting_execution' AND proposed_data->>'name'='Changed Fixture' FROM public.zoho_deferred_records WHERE connection_id=c AND external_id='1');
  ASSERT (SELECT state='blocked_invalid' AND reason='SOURCE_INVALID' FROM public.zoho_deferred_records WHERE connection_id=c AND external_id='3');
  ASSERT public.zoho_claim_discovery(run)->>'claimed'='false';
  -- Safe replay neither duplicates accounting nor creates a new operation.
  ASSERT public.zoho_commit_discovery_page(run,1,'[]','[]',false)->>'unchanged'='true';
  ASSERT (SELECT received_count=4 FROM public.zoho_discovery_runs WHERE id=run);
  -- Repeated pages keep the newest deferred version and never resurrect an older one.
  run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
  claim:=public.zoho_claim_discovery(run);
  PERFORM public.zoho_commit_claimed_discovery(run,(claim->>'lease')::uuid,1,jsonb_build_array(
    jsonb_build_object('externalId','1','modified',now()+interval '2 seconds','data',jsonb_build_object('name','Latest Fixture','email','fixture@example.com'),'errors','[]'::jsonb)
  ),'[]',true);
  claim:=public.zoho_claim_discovery(run);
  PERFORM public.zoho_commit_claimed_discovery(run,(claim->>'lease')::uuid,2,jsonb_build_array(
    jsonb_build_object('externalId','1','modified',now()+interval '1 second','data',jsonb_build_object('name','Stale Fixture','email','fixture@example.com'),'errors','[]'::jsonb)
  ),'[]',false);
  ASSERT (SELECT proposed_data->>'name'='Latest Fixture' FROM public.zoho_deferred_records WHERE connection_id=c AND external_id='1');
  UPDATE public.zoho_deferred_records SET next_attempt_at=now()-interval '1 second' WHERE connection_id=c;
  PERFORM public.zoho_recover_deferred();
  ASSERT (SELECT state='waiting_execution' FROM public.zoho_deferred_records WHERE connection_id=c AND external_id='1');
  ASSERT (SELECT state='processing' FROM public.zoho_approved_operations WHERE id=op);
  PERFORM public.zoho_complete_operation(op,lease,target,gen_random_uuid());
  UPDATE public.zoho_deferred_records SET next_attempt_at=now()-interval '1 second' WHERE connection_id=c;
  PERFORM public.zoho_recover_deferred();
  ASSERT (SELECT revision=2 AND decision='pending_approval' AND target_id=target AND proposed_data->>'name'='Latest Fixture' FROM public.zoho_staged_records WHERE id=record);
  ASSERT (SELECT state='staged' AND proposed_data IS NULL AND validation_errors IS NULL FROM public.zoho_deferred_records WHERE connection_id=c AND external_id='1');
  ASSERT (SELECT count(*)=1 FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=c);
  -- Expiry removes the duplicate PII snapshot and requires an authoritative read.
  UPDATE public.zoho_deferred_records SET expires_at=now()-interval '1 second' WHERE connection_id=c AND external_id='3';
  PERFORM public.zoho_recover_deferred();
  ASSERT (SELECT proposed_data IS NULL AND reason='REFETCH_REQUIRED' FROM public.zoho_deferred_records WHERE connection_id=c AND external_id='3');
  -- Correcting an invalid future timestamp is allowed; it is not a trusted version.
  run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
  claim:=public.zoho_claim_discovery(run);
  PERFORM public.zoho_commit_claimed_discovery(run,(claim->>'lease')::uuid,1,jsonb_build_array(
    jsonb_build_object('externalId','3','modified',now(),'data',jsonb_build_object('name','Corrected Fixture','email','corrected@example.com'),'errors','[]'::jsonb)
  ),'[]',false);
  ASSERT (SELECT state='staged' AND proposed_data IS NULL FROM public.zoho_deferred_records WHERE connection_id=c AND external_id='3');

  -- Two module leases share a connection-level refresh reservation.
  run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
  job_run:=(public.zoho_start_discovery(c,'Job_Openings',actor)->>'runId')::uuid;
  claim:=public.zoho_claim_discovery(run); job_claim:=public.zoho_claim_discovery(job_run);
  BEGIN
    PERFORM public.zoho_refresh_discovery_tokens(run,(claim->>'lease')::uuid,renewed);
    RAISE EXCEPTION 'Unreserved refresh was accepted';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  ASSERT public.zoho_begin_discovery_refresh(run,(claim->>'lease')::uuid,envelope)->>'acquired'='true';
  ASSERT public.zoho_begin_discovery_refresh(job_run,(job_claim->>'lease')::uuid,envelope)->>'acquired'='false';
  UPDATE public.zoho_connection_secrets SET refresh_expires_at=clock_timestamp()-interval '1 second' WHERE connection_id=c;
  ASSERT public.zoho_begin_discovery_refresh(job_run,(job_claim->>'lease')::uuid,envelope)->>'acquired'='true';
  BEGIN
    PERFORM public.zoho_refresh_discovery_tokens(run,(claim->>'lease')::uuid,renewed);
    RAISE EXCEPTION 'Old refresh owner overwrote newer reservation';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  PERFORM public.zoho_refresh_discovery_tokens(job_run,(job_claim->>'lease')::uuid,renewed);
  result:=public.zoho_begin_discovery_refresh(run,(claim->>'lease')::uuid,envelope);
  ASSERT result->>'changed'='true' AND result->'envelope'=renewed;
  ASSERT public.zoho_begin_discovery_refresh(run,(claim->>'lease')::uuid,renewed)->>'acquired'='true';
  PERFORM public.zoho_complete_connection(c,envelope,actor);
  ASSERT (SELECT refresh_lease IS NULL FROM public.zoho_connection_secrets WHERE connection_id=c);
  BEGIN
    PERFORM public.zoho_refresh_discovery_tokens(run,(claim->>'lease')::uuid,renewed);
    RAISE EXCEPTION 'Refresh completed across credential renewal';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  ASSERT NOT has_table_privilege('zoho_discovery','public.zoho_deferred_records','SELECT');
  ASSERT NOT has_table_privilege('authenticated','public.zoho_deferred_records','SELECT');
  ASSERT NOT has_table_privilege('service_role','public.zoho_deferred_records','UPDATE');
  ASSERT NOT has_function_privilege('anon','public.zoho_recover_deferred()','EXECUTE');
  ASSERT (SELECT count(*) FROM public.users)=canonical_users;
  ASSERT (SELECT count(*) FROM public.learners)=canonical_learners;
  ASSERT (SELECT count(*) FROM public.opportunities)=canonical_jobs;
END $$;
