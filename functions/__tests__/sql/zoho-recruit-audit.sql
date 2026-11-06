-- Synthetic audit regressions; run in the runner's rollback-only transaction.
DO $$
DECLARE c uuid; org uuid; actor uuid:=gen_random_uuid(); r jsonb; op uuid; record uuid;
  expected uuid:=gen_random_uuid(); lease uuid; run uuid; claim jsonb; i integer; n integer;
  envelope jsonb:=jsonb_build_object('version',1,'iv',repeat('A',16),'ciphertext',repeat('A',24));
  config integer; generation integer; all_ops uuid[];
BEGIN
  SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
  c:=(public.zoho_register_connection('Audit synthetic fixture','99999999999999999996','in',org,actor)->>'id')::uuid;
  PERFORM public.zoho_complete_connection(c,envelope,actor);
  -- Existing target is frozen at approval, rather than trusting a receipt UUID.
  r:=public.zoho_stage_record(c,'Candidates','1',now(),'{"name":"Fixture","email":"fixture@example.com"}','[]');
  record:=(r->>'id')::uuid;
  UPDATE public.zoho_staged_records SET target_id=expected WHERE id=record;
  PERFORM public.zoho_decide_records(c,jsonb_build_array(jsonb_build_object('id',record,'revision',1)),'approve','Audit target review',gen_random_uuid(),actor);
  SELECT id INTO STRICT op FROM public.zoho_approved_operations WHERE record_id=record;
  UPDATE public.zoho_staged_records SET target_id=gen_random_uuid() WHERE id=record;
  lease:=gen_random_uuid();
  ASSERT public.zoho_claim_operation(op,lease)->>'targetId'=expected::text;
  BEGIN
    PERFORM public.zoho_complete_operation(op,lease,gen_random_uuid(),gen_random_uuid());
    RAISE EXCEPTION 'Wrong existing target receipt accepted';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  ASSERT public.zoho_complete_operation(op,lease,expected,gen_random_uuid())->>'completed'='true';

  -- More than one scheduler batch: reserving the oldest 25 lets the 26th progress.
  UPDATE public.zoho_approved_operations SET next_reconcile_at=clock_timestamp()+interval '1 day';
  FOR i IN 2..27 LOOP
    r:=public.zoho_stage_record(c,'Candidates',i::text,now(),jsonb_build_object('name','Fixture','email','fixture'||i||'@example.com'),'[]');
    record:=(r->>'id')::uuid;
    PERFORM public.zoho_decide_records(c,jsonb_build_array(jsonb_build_object('id',record,'revision',1)),'approve','Audit fairness review',gen_random_uuid(),actor);
    SELECT id INTO STRICT op FROM public.zoho_approved_operations WHERE record_id=record;
    lease:=gen_random_uuid();
    PERFORM public.zoho_claim_operation(op,lease);
    PERFORM public.zoho_record_execution_outcome(op,lease,'OUTCOME_UNKNOWN');
    all_ops:=array_append(all_ops,op);
  END LOOP;
  SELECT count(*) INTO n FROM public.zoho_schedule_reconciliation(ARRAY['provision_candidate']); ASSERT n=25;
  SELECT count(*) INTO n FROM public.zoho_schedule_reconciliation(ARRAY['provision_candidate']); ASSERT n=1;
  SELECT count(*) INTO n FROM public.zoho_schedule_reconciliation(ARRAY['provision_candidate']); ASSERT n=0;
  ASSERT (SELECT count(*)=26 FROM public.zoho_approved_operations WHERE id=ANY(all_ops) AND state='processing');

  -- An OAuth credential renewal must preserve unknown effects and mapping grants.
  run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
  claim:=public.zoho_claim_discovery(run); lease:=(claim->>'lease')::uuid;
  ASSERT claim->>'claimed'='true';
  SELECT config_revision,credential_generation INTO config,generation FROM public.zoho_connections WHERE id=c;
  PERFORM public.zoho_complete_connection(c,envelope,actor);
  ASSERT (SELECT config_revision=config AND credential_generation=generation+1 FROM public.zoho_connections WHERE id=c);
  ASSERT (SELECT count(*)=26 FROM public.zoho_approved_operations WHERE id=ANY(all_ops) AND state='processing' AND last_error='OUTCOME_UNKNOWN');
  BEGIN
    PERFORM public.zoho_refresh_discovery_tokens(run,lease,envelope);
    RAISE EXCEPTION 'Credential renewal did not fence old discovery lease';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  BEGIN
    PERFORM public.zoho_commit_claimed_discovery(run,lease,1,'[]','[]',false);
    RAISE EXCEPTION 'Old discovery lease committed after reconnect';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;

  -- Fresh queue deliveries share one persisted failure budget. Duplicate failure
  -- reports do not count twice, and Retry-After cannot be shortened by redelivery.
  claim:=public.zoho_claim_discovery(run); lease:=(claim->>'lease')::uuid;
  ASSERT public.zoho_fail_discovery(run,lease,'RATE_LIMITED',120)->>'terminal'='false';
  ASSERT public.zoho_fail_discovery(run,lease,'RATE_LIMITED',120)->>'recorded'='false';
  ASSERT (SELECT failure_count=1 AND next_attempt_at>=clock_timestamp()+interval '119 seconds' FROM public.zoho_discovery_runs WHERE id=run);
  ASSERT public.zoho_claim_discovery(run)->>'claimed'='false';
  FOR i IN 2..8 LOOP
    UPDATE public.zoho_discovery_runs SET next_attempt_at=clock_timestamp()-interval '1 second' WHERE id=run;
    claim:=public.zoho_claim_discovery(run); ASSERT claim->>'claimed'='true';
    lease:=(claim->>'lease')::uuid;
    PERFORM public.zoho_fail_discovery(run,lease,'SOURCE_UNAVAILABLE',0);
  END LOOP;
  ASSERT (SELECT failure_count=8 AND state='failed' FROM public.zoho_discovery_runs WHERE id=run);
  ASSERT public.zoho_claim_discovery(run)->>'claimed'='false';

  -- Crashed read workers also consume the run's budget, across new messages.
  run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
  FOR i IN 1..8 LOOP
    claim:=public.zoho_claim_discovery(run); ASSERT claim->>'claimed'='true';
    UPDATE public.zoho_discovery_runs SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE id=run;
  END LOOP;
  ASSERT public.zoho_claim_discovery(run)->>'claimed'='false';
  ASSERT (SELECT state='failed' AND failure_count=8 FROM public.zoho_discovery_runs WHERE id=run);
  run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
  UPDATE public.zoho_discovery_runs SET budget_expires_at=clock_timestamp()-interval '1 second' WHERE id=run;
  ASSERT public.zoho_claim_discovery(run)->>'claimed'='false';
  ASSERT (SELECT state='failed' FROM public.zoho_discovery_runs WHERE id=run);

  -- Authentication revocation is terminal and visibly requests reconnect.
  run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
  claim:=public.zoho_claim_discovery(run); lease:=(claim->>'lease')::uuid;
  ASSERT public.zoho_fail_discovery(run,lease,'AUTH_REVOKED',0)->>'terminal'='true';
  ASSERT (SELECT status='reauth_required' FROM public.zoho_connections WHERE id=c);
  PERFORM public.zoho_complete_connection(c,envelope,actor);
  run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
  claim:=public.zoho_claim_discovery(run); lease:=(claim->>'lease')::uuid;
  BEGIN
    PERFORM public.zoho_commit_claimed_discovery(run,lease,2,'[]','[]',false);
    RAISE EXCEPTION 'Wrong discovery page committed';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  ASSERT public.zoho_commit_claimed_discovery(run,lease,1,'[]','[]',false)->>'done'='true';
  ASSERT (SELECT inventory_scope='saved' AND state='completed' FROM public.zoho_discovery_runs WHERE id=run);
  ASSERT NOT has_function_privilege('authenticated','public.zoho_claim_discovery(uuid)','EXECUTE');
  ASSERT NOT has_function_privilege('anon','public.zoho_schedule_reconciliation(text[])','EXECUTE');
  ASSERT has_function_privilege('zoho_discovery','public.zoho_claim_discovery(uuid)','EXECUTE');
  ASSERT NOT has_table_privilege('zoho_discovery','public.zoho_approved_operations','INSERT');
  ASSERT NOT has_table_privilege('zoho_discovery','public.zoho_approved_operations','UPDATE');
  ASSERT NOT has_table_privilege('zoho_discovery','public.zoho_approval_batches','INSERT');
  ASSERT NOT has_table_privilege('zoho_discovery','public.zoho_connection_secrets','SELECT');
  ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid)','EXECUTE');
  ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_claim_operation(uuid,uuid)','EXECUTE');
  ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_complete_operation(uuid,uuid,uuid,uuid)','EXECUTE');
  SET LOCAL ROLE zoho_discovery;
  PERFORM public.zoho_due_discovery();
  RESET ROLE;
  -- Exercise actual permission denial, not just metadata assertions.
  BEGIN
    SET LOCAL ROLE zoho_discovery;
    PERFORM public.zoho_decide_records(c,'[]','approve','Forged discovery decision',gen_random_uuid(),actor);
    RAISE EXCEPTION 'Discovery role minted approval';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
  BEGIN
    SET LOCAL ROLE zoho_discovery;
    UPDATE public.zoho_approved_operations SET state='completed' WHERE id=op;
    RAISE EXCEPTION 'Discovery role edited approval';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
END $$;
