-- Run after the schema migration in a rollback-only transaction.
DO $$
DECLARE org uuid; connection uuid; actor uuid:=gen_random_uuid(); record uuid; revision integer; result jsonb;
  request uuid:=gen_random_uuid(); discovery uuid; oauth_hash text:='rollback-fixture'; initial_users bigint; initial_learners bigint; initial_jobs bigint;
BEGIN
  SELECT id INTO org FROM public.organizations LIMIT 1;
  ASSERT org IS NOT NULL, 'Local fixture needs an existing organization';
  SELECT count(*) INTO initial_users FROM public.users;
  SELECT count(*) INTO initial_learners FROM public.learners;
  SELECT count(*) INTO initial_jobs FROM public.opportunities;
  result:=public.zoho_register_connection('SQL rollback fixture','99999999999999999999','in',org,actor);
  connection:=(result->>'id')::uuid;
  ASSERT result->>'status'='not_connected';
  BEGIN
    PERFORM public.zoho_stage_record(connection,'Candidates','123',now(),'{"email":"sample@example.com","name":"Sample Learner"}','[]');
    RAISE EXCEPTION 'Disconnected ingestion was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  INSERT INTO public.zoho_oauth_states(state_hash,connection_id,actor_id,expires_at) VALUES(oauth_hash,connection,actor,now()+interval '1 minute');
  BEGIN
    PERFORM public.zoho_consume_oauth_state(oauth_hash,gen_random_uuid());
    RAISE EXCEPTION 'Wrong actor consumed OAuth state';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  result:=public.zoho_consume_oauth_state(oauth_hash,actor);
  ASSERT result->>'connectionId'=connection::text;
  BEGIN
    PERFORM public.zoho_consume_oauth_state(oauth_hash,actor);
    RAISE EXCEPTION 'OAuth state replay was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    UPDATE public.zoho_connections SET email_policy='enabled' WHERE id=connection;
    RAISE EXCEPTION 'Email policy was overridden';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  UPDATE public.zoho_connections SET status='connected' WHERE id=connection;
  result:=public.zoho_stage_record(connection,'Candidates','123',now(),'{"email":"sample@example.com","name":"Sample Learner"}','[]');
  record:=(result->>'id')::uuid; revision:=(result->>'revision')::integer;
  ASSERT revision=1;
  ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE record_id=record);
  result:=public.zoho_stage_record(connection,'Candidates','123',now(),'{"name":"Sample Learner","email":"sample@example.com"}','[]');
  ASSERT result->>'unchanged'='true';
  ASSERT (result->>'revision')::integer=1;
  result:=public.zoho_decide_records(connection,jsonb_build_array(jsonb_build_object('id',record,'revision',revision)),'approve','Reviewed fixture',request,actor);
  ASSERT (result->>'count')::integer=1;
  ASSERT (SELECT count(*)=1 FROM public.zoho_approved_operations WHERE record_id=record AND email_policy='forbidden');
  result:=public.zoho_decide_records(connection,jsonb_build_array(jsonb_build_object('id',record,'revision',revision)),'approve','Reviewed fixture',request,actor);
  ASSERT result->>'replayed'='true';
  ASSERT (SELECT count(*)=1 FROM public.zoho_approved_operations WHERE record_id=record);
  BEGIN
    PERFORM public.zoho_decide_records(connection,jsonb_build_array(jsonb_build_object('id',record,'revision',revision)),'hold','Other decision',request,actor);
    RAISE EXCEPTION 'Changed request idempotency was accepted';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  result:=public.zoho_stage_record(connection,'Candidates','123',now(),'{"email":"sample@example.com","name":"Changed Learner"}','[]');
  ASSERT (result->>'revision')::integer=2;
  ASSERT (SELECT state='approval_stale' FROM public.zoho_approved_operations WHERE record_id=record);
  BEGIN
    PERFORM public.zoho_decide_records(connection,jsonb_build_array(jsonb_build_object('id',record,'revision',1)),'approve','Old source',gen_random_uuid(),actor);
    RAISE EXCEPTION 'Stale revision was approved';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  BEGIN
    PERFORM public.zoho_decide_records(connection,jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'revision',1),jsonb_build_object('id',record,'revision',2)),'approve','Atomic batch',gen_random_uuid(),actor);
    RAISE EXCEPTION 'Partial invalid batch was accepted';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  ASSERT (SELECT decision='pending_approval' FROM public.zoho_staged_records WHERE id=record);
  result:=public.zoho_stage_record(connection,'Candidates','456',now(),'{"name":"Missing Email"}','["Email is required"]');
  BEGIN
    PERFORM public.zoho_decide_records(connection,jsonb_build_array(jsonb_build_object('id',result->>'id','revision',1)),'approve','Invalid candidate',gen_random_uuid(),actor);
    RAISE EXCEPTION 'Invalid candidate approved';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  result:=public.zoho_start_discovery(connection,'Candidates',actor);
  discovery:=(result->>'runId')::uuid;
  ASSERT (public.zoho_start_discovery(connection,'Candidates',actor)->>'runId')::uuid=discovery;
  result:=public.zoho_commit_discovery_page(discovery,1,
    jsonb_build_array(jsonb_build_object('externalId','789','modified',now(),'data',jsonb_build_object('name','Discovery Learner','email','discover@example.com'),'errors','[]'::jsonb)),
    '[]'::jsonb,false);
  ASSERT result->>'state'='completed';
  ASSERT EXISTS(SELECT 1 FROM public.zoho_staged_records WHERE connection_id=connection AND external_id='789' AND decision='pending_approval');
  ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.external_id='789' AND r.connection_id=connection);
  result:=public.zoho_commit_discovery_page(discovery,1,'[]','[]',false);
  ASSERT result->>'unchanged'='true';
  ASSERT (SELECT received_count=1 FROM public.zoho_discovery_runs WHERE id=discovery);
  ASSERT NOT has_table_privilege('authenticated','public.zoho_staged_records','SELECT');
  ASSERT NOT has_function_privilege('anon','public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid)','EXECUTE');
  ASSERT initial_users=(SELECT count(*) FROM public.users);
  ASSERT initial_learners=(SELECT count(*) FROM public.learners);
  ASSERT initial_jobs=(SELECT count(*) FROM public.opportunities);
END $$;
