DO $$
DECLARE connection uuid:=gen_random_uuid(); other_connection uuid:=gen_random_uuid(); publisher uuid:=gen_random_uuid();
 actor uuid:=gen_random_uuid(); old_actor uuid:=gen_random_uuid(); page jsonb; following jsonb; history jsonb;
BEGIN
 INSERT INTO public.organizations(id) VALUES(publisher);
 INSERT INTO public.zoho_connections(id,name,source_org_id,region,publisher_organization_id,created_by)
 VALUES(connection,'History page fixture','818181','in',publisher,actor),(other_connection,'Other history source','929292','in',publisher,actor);
 -- Newer completed history must never consume the pending-work page limit.
 INSERT INTO public.zoho_source_lifecycle_proposals(connection_id,module,external_id,kind,observed_at,evidence_hash,config_revision,decision,created_at)
 SELECT connection,'Candidates',n::text,'permanent',now()+make_interval(secs=>n),repeat('a',64),1,'approved','2026-11-01'::timestamptz+make_interval(secs=>n)
 FROM generate_series(101,230) n;
 INSERT INTO public.zoho_source_lifecycle_proposals(id,connection_id,module,external_id,kind,observed_at,evidence_hash,config_revision,decision,created_at)
 SELECT ('60000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,connection,'Candidates',n::text,'permanent',now()+make_interval(secs=>n),repeat('a',64),1,
 CASE WHEN n=1 THEN 'held' ELSE 'pending_approval' END,'2026-10-01' FROM generate_series(1,30) n;
 page:=public.zoho_operator_history_page(connection,actor,'lifecycle','pending',NULL,NULL);
 ASSERT jsonb_array_length(page->'items')=25 AND page->'nextCursor' IS NOT NULL AND page->'nextCursor'<>'null';
 ASSERT page->'items'->0->>'external_id'='30';
 following:=public.zoho_operator_history_page(connection,actor,'lifecycle','pending',(page->'nextCursor'->>'timestamp')::timestamptz,(page->'nextCursor'->>'id')::uuid);
 ASSERT jsonb_array_length(following->'items')=5 AND following->'nextCursor'='null';
 ASSERT following->'items'->4->>'external_id'='1' AND following->'items'->4->>'decision'='held';
 ASSERT public.zoho_operator_history_page(other_connection,actor,'lifecycle','pending',NULL,NULL)->'items'='[]';
 history:=public.zoho_operator_history_page(connection,actor,'lifecycle','history',NULL,NULL);
 ASSERT jsonb_array_length(history->'items')=25 AND history->'items'->0->>'decision'='approved';

 INSERT INTO public.zoho_candidate_administration_progress(request_id,actor_id,action,target_id,source_org_id,external_id,completed,artifacts_confirmed,created_at)
 SELECT gen_random_uuid(),actor,'erase_connector',gen_random_uuid(),'818181',n::text,true,true,'2026-11-01'::timestamptz+make_interval(secs=>n)
 FROM generate_series(101,230) n;
 -- Committed app pages with unfinished artifacts remain pending; a different
 -- live admin can find another actor's already approved source cleanup.
 INSERT INTO public.zoho_candidate_administration_progress(request_id,actor_id,action,target_id,source_org_id,external_id,completed,artifacts_confirmed,created_at)
 SELECT ('70000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,old_actor,'erase_connector',gen_random_uuid(),'818181',n::text,n%2=0,false,'2026-10-01'
 FROM generate_series(1,30) n;
 page:=public.zoho_operator_history_page(connection,actor,'administration','pending',NULL,NULL);
 ASSERT jsonb_array_length(page->'items')=25 AND page->'items'->0->>'external_id'='30';
 ASSERT page->'items'->0->'completed'='true' AND page->'items'->0->'artifacts_confirmed'='false';
 UPDATE public.zoho_candidate_administration_progress SET updated_at=clock_timestamp() WHERE source_org_id='818181' AND actor_id=old_actor;
 following:=public.zoho_operator_history_page(connection,actor,'administration','pending',(page->'nextCursor'->>'timestamp')::timestamptz,(page->'nextCursor'->>'id')::uuid);
 ASSERT jsonb_array_length(following->'items')=5 AND following->'items'->4->>'external_id'='1';
 ASSERT public.zoho_operator_history_page(other_connection,actor,'administration','pending',NULL,NULL)->'items'='[]';
 history:=public.zoho_operator_history_page(connection,old_actor,'administration','history',NULL,NULL);
 ASSERT history->'items'='[]'; -- Completed history remains actor-bound.
 ASSERT jsonb_array_length(public.zoho_operator_history_page(connection,actor,'administration','history',NULL,NULL)->'items')=25;
 BEGIN
  PERFORM public.zoho_operator_history_page(connection,actor,'administration','pending',now(),NULL);
  RAISE EXCEPTION 'Half-key cursor accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 ASSERT NOT has_function_privilege('anon','public.zoho_operator_history_page(uuid,uuid,text,text,timestamptz,uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_operator_history_page(uuid,uuid,text,text,timestamptz,uuid)','EXECUTE');
END $$;
