-- Append after both Zoho migrations inside one rollback-only transaction.
DO $$
DECLARE org uuid; connection uuid; actor uuid:=gen_random_uuid(); record uuid;
  op uuid; next_op uuid; lease uuid:=gen_random_uuid(); next_lease uuid:=gen_random_uuid();
  target uuid:=gen_random_uuid(); receipt uuid:=gen_random_uuid(); result jsonb;
  selected jsonb:='[]'; i integer; users_before bigint; learners_before bigint; jobs_before bigint;
BEGIN
  SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
  SELECT count(*) INTO users_before FROM public.users;
  SELECT count(*) INTO learners_before FROM public.learners;
  SELECT count(*) INTO jobs_before FROM public.opportunities;
  result:=public.zoho_register_connection('Execution rollback fixture','99999999999999999998','in',org,actor);
  connection:=(result->>'id')::uuid;
  UPDATE public.zoho_connections SET status='connected' WHERE id=connection;
  FOR i IN 1..10 LOOP
    result:=public.zoho_stage_record(connection,'Candidates',i::text,now(),
      jsonb_build_object('email','fixture'||i||'@example.com','name','Fixture Learner'),'[]');
    selected:=selected||jsonb_build_array(jsonb_build_object('id',result->>'id','revision',1));
  END LOOP;
  PERFORM public.zoho_decide_records(connection,selected,'approve','Execution fixtures reviewed',gen_random_uuid(),actor);

  -- A claim is bounded by both the grant and lease, and a duplicate lease does not
  -- consume another attempt. Another worker cannot claim the same operation.
  SELECT id INTO STRICT record FROM public.zoho_staged_records WHERE connection_id=connection AND external_id='1';
  SELECT id INTO STRICT op FROM public.zoho_approved_operations WHERE record_id=record;
  result:=public.zoho_claim_operation(op,lease);
  ASSERT result->>'claimed'='true';
  ASSERT result->>'emailPolicy'='forbidden';
  ASSERT result->>'actorId'=actor::text;
  ASSERT result->'data'=jsonb_build_object('email','fixture1@example.com','name','Fixture Learner');
  ASSERT (result->>'leaseExpiresAt')::timestamptz<=(result->>'approvalExpiresAt')::timestamptz;
  ASSERT public.zoho_claim_operation(op,next_lease)->>'claimed'='false';
  ASSERT public.zoho_claim_operation(op,lease)->>'claimed'='true';
  ASSERT (SELECT execution_attempts=1 FROM public.zoho_approved_operations WHERE id=op);
  BEGIN
    PERFORM public.zoho_stage_record(connection,'Candidates','1',now(),'{"name":"Changed"}','[]');
    RAISE EXCEPTION 'In-flight source mutation was accepted';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  BEGIN
    PERFORM public.zoho_complete_operation(op,next_lease,target,receipt);
    RAISE EXCEPTION 'Wrong lease completed an operation';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  UPDATE public.zoho_approved_operations SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE id=op;
  ASSERT public.zoho_claim_operation(op,lease)->>'claimed'='false';
  -- Late acknowledgements record facts, without authorizing another destination call.
  ASSERT public.zoho_complete_operation(op,lease,target,receipt)->>'completed'='true';
  ASSERT public.zoho_complete_operation(op,lease,target,receipt)->>'replayed'='true';
  ASSERT (SELECT target_id=target AND decision='completed' FROM public.zoho_staged_records WHERE id=record);
  BEGIN
    PERFORM public.zoho_complete_operation(op,lease,gen_random_uuid(),receipt);
    RAISE EXCEPTION 'Conflicting completion receipt was accepted';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;

  -- An unknown effect must not become an automatic retry, including with the same
  -- lease, after timeout, or by relabelling it as a definitive no-write response.
  SELECT o.id INTO STRICT op FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=connection AND r.external_id='2';
  lease:=gen_random_uuid(); next_lease:=gen_random_uuid();
  PERFORM public.zoho_claim_operation(op,lease);
  ASSERT public.zoho_record_execution_outcome(op,lease,'OUTCOME_UNKNOWN')->>'retryPermitted'='false';
  ASSERT public.zoho_admin_snapshot()->'countsByConnection'->(connection::text)->>'reconciliation_required'='1';
  ASSERT public.zoho_claim_operation(op,lease)->>'claimed'='false';
  ASSERT public.zoho_claim_operation(op,next_lease)->>'claimed'='false';
  BEGIN
    PERFORM public.zoho_record_execution_outcome(op,lease,'NOT_APPLIED');
    RAISE EXCEPTION 'Unknown effect was reclassified as safe to retry';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  ASSERT public.zoho_complete_operation(op,lease,target,gen_random_uuid())->>'completed'='true';

  -- Only an explicit no-write response permits bounded retry of the same intent.
  SELECT o.id INTO STRICT op FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=connection AND r.external_id='3';
  lease:=gen_random_uuid(); next_lease:=gen_random_uuid();
  PERFORM public.zoho_claim_operation(op,lease);
  ASSERT public.zoho_record_execution_outcome(op,lease,'NOT_APPLIED')->>'retryPermitted'='true';
  ASSERT (SELECT r.decision='failed' AND r.execution_state='failed' FROM public.zoho_staged_records r
    JOIN public.zoho_approved_operations o ON o.record_id=r.id WHERE o.id=op);
  ASSERT public.zoho_admin_snapshot()->'countsByConnection'->(connection::text)->>'failed'='1';
  ASSERT public.zoho_claim_operation(op,next_lease)->>'claimed'='false';
  UPDATE public.zoho_approved_operations SET next_attempt_at=clock_timestamp()-interval '1 second' WHERE id=op;
  ASSERT public.zoho_claim_operation(op,lease)->>'reason'='LEASE_ALREADY_USED';
  ASSERT public.zoho_claim_operation(op,next_lease)->>'claimed'='true';
  ASSERT (SELECT execution_attempts=2 FROM public.zoho_approved_operations WHERE id=op);
  BEGIN
    PERFORM public.zoho_complete_operation(op,lease,target,receipt);
    RAISE EXCEPTION 'Old lease completed a retried operation';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  PERFORM public.zoho_complete_operation(op,next_lease,target,gen_random_uuid());

  -- Expiry creates a fresh review revision instead of a dead-end unique-key clash.
  SELECT r.id,o.id INTO STRICT record,op FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=connection AND r.external_id='4';
  UPDATE public.zoho_approved_operations SET expires_at=clock_timestamp()-interval '1 second' WHERE id=op;
  ASSERT public.zoho_claim_operation(op,lease)->>'reason'='APPROVAL_STALE';
  ASSERT (SELECT revision=2 AND decision='pending_approval' FROM public.zoho_staged_records WHERE id=record);
  PERFORM public.zoho_decide_records(connection,jsonb_build_array(jsonb_build_object('id',record,'revision',2)),'approve','Fresh expired intent review',gen_random_uuid(),actor);
  SELECT id INTO STRICT next_op FROM public.zoho_approved_operations WHERE record_id=record AND record_revision=2;
  ASSERT next_op<>op;
  next_lease:=gen_random_uuid();
  ASSERT public.zoho_claim_operation(next_op,next_lease)->>'claimed'='true';

  -- Source/config/policy changes fence dispatch before it gets a grant.
  SELECT o.id INTO STRICT op FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=connection AND r.external_id='5';
  PERFORM public.zoho_stage_record(connection,'Candidates','5',now(),'{"name":"Updated source"}','[]');
  ASSERT public.zoho_claim_operation(op,lease)->>'claimed'='false';
  SELECT o.id INTO STRICT op FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=connection AND r.external_id='6';
  UPDATE public.zoho_connections SET status='paused' WHERE id=connection;
  ASSERT public.zoho_claim_operation(op,lease)->>'reason'='APPROVAL_STALE';
  UPDATE public.zoho_connections SET status='connected' WHERE id=connection;
  SELECT o.id INTO STRICT op FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=connection AND r.external_id='7';
  UPDATE public.zoho_approved_operations SET execution_attempts=8 WHERE id=op;
  ASSERT public.zoho_claim_operation(op,lease)->>'claimed'='false';
  SELECT r.id,o.id INTO STRICT record,op FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=connection AND r.external_id='8';
  BEGIN
    PERFORM public.zoho_claim_operation(op,NULL);
    RAISE EXCEPTION 'Null lease was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  UPDATE public.zoho_staged_records SET proposed_data='{"name":"Unexpected change"}' WHERE id=record;
  ASSERT public.zoho_claim_operation(op,lease)->>'reason'='APPROVAL_STALE';
  SELECT r.id,o.id INTO STRICT record,op FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=connection AND r.external_id='9';
  UPDATE public.zoho_staged_records SET validation_errors='["Invalid mapping"]' WHERE id=record;
  ASSERT public.zoho_claim_operation(op,lease)->>'reason'='APPROVAL_STALE';
  SELECT o.id INTO STRICT op FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=connection AND r.external_id='10';
  UPDATE public.zoho_connections SET config_revision=config_revision+1 WHERE id=connection;
  ASSERT public.zoho_claim_operation(op,lease)->>'reason'='APPROVAL_STALE';

  ASSERT NOT has_function_privilege('authenticated','public.zoho_claim_operation(uuid,uuid)','EXECUTE');
  ASSERT NOT has_table_privilege('authenticated','public.zoho_execution_attempts','SELECT');
  ASSERT NOT has_table_privilege('service_role','public.zoho_execution_attempts','UPDATE');
  ASSERT NOT has_function_privilege('anon','public.zoho_complete_operation(uuid,uuid,uuid,uuid)','EXECUTE');
  ASSERT users_before=(SELECT count(*) FROM public.users);
  ASSERT learners_before=(SELECT count(*) FROM public.learners);
  ASSERT jobs_before=(SELECT count(*) FROM public.opportunities);
END $$;
