BEGIN;
CREATE TABLE public.zoho_bulk_read_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
 module text NOT NULL CHECK(module IN ('Candidates','Job_Openings')), request_id uuid NOT NULL, actor_id uuid NOT NULL,
 config_revision integer NOT NULL, credential_generation integer NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','creating','polling','staging','completed','completed_with_exceptions','failed')),
 export_page integer NOT NULL DEFAULT 1 CHECK(export_page BETWEEN 1 AND 1000),
 provider_job_id text CHECK(provider_job_id ~ '^[0-9]{1,40}$'), row_offset integer NOT NULL DEFAULT 0 CHECK(row_offset BETWEEN 0 AND 200000),
 artifact_key text,artifact_expires_at timestamptz,artifact_ready boolean NOT NULL DEFAULT false,artifact_write_pending boolean NOT NULL DEFAULT false,artifact_write_token uuid,
 artifact_count integer,artifact_more boolean,artifact_cleanup_pending boolean NOT NULL DEFAULT false,
 archive_hash text CHECK(archive_hash ~ '^[0-9a-f]{64}$'), staged_count bigint NOT NULL DEFAULT 0, issue_count bigint NOT NULL DEFAULT 0,
 lease_token uuid, lease_expires_at timestamptz, next_attempt_at timestamptz NOT NULL DEFAULT now(),
 failure_count integer NOT NULL DEFAULT 0 CHECK(failure_count BETWEEN 0 AND 8), last_error text, budget_expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
 created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
 UNIQUE(connection_id,request_id)
);
CREATE UNIQUE INDEX zoho_bulk_active_module ON public.zoho_bulk_read_runs(connection_id,module) WHERE state IN ('queued','creating','polling','staging');
CREATE INDEX zoho_bulk_due ON public.zoho_bulk_read_runs(next_attempt_at,id) WHERE state IN ('queued','creating','polling','staging');
REVOKE ALL ON public.zoho_bulk_read_runs FROM PUBLIC,anon,authenticated,zoho_discovery,service_role;
GRANT SELECT ON public.zoho_bulk_read_runs TO service_role;
CREATE FUNCTION public.zoho_start_bulk_read(p_connection uuid,p_module text,p_request uuid,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; r public.zoho_bulk_read_runs;
BEGIN
 IF p_actor IS NULL OR p_request IS NULL OR p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings') THEN RAISE EXCEPTION 'Invalid bulk request' USING ERRCODE='22023'; END IF;
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 SELECT * INTO r FROM public.zoho_bulk_read_runs WHERE connection_id=c.id AND request_id=p_request;
 IF FOUND THEN
  IF r.actor_id<>p_actor OR r.module<>p_module THEN RAISE EXCEPTION 'Idempotency conflict' USING ERRCODE='40001'; END IF;
  RETURN jsonb_build_object('runId',r.id,'state',r.state,'replayed',true);
 END IF;
 IF c.status<>'connected' THEN RAISE EXCEPTION 'Source unavailable' USING ERRCODE='22023'; END IF;
 INSERT INTO public.zoho_bulk_read_runs(connection_id,module,request_id,actor_id,config_revision,credential_generation)
 VALUES(c.id,p_module,p_request,p_actor,c.config_revision,c.credential_generation) RETURNING * INTO r;
 RETURN jsonb_build_object('runId',r.id,'state',r.state,'stagingOnly',true,'emailPolicy','forbidden');
END;
$$;
CREATE FUNCTION public.zoho_bulk_read_snapshot(p_connection uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC,r.id DESC),'[]'::jsonb) FROM (
 SELECT id,module,state,export_page,row_offset,staged_count,issue_count,last_error,artifact_cleanup_pending,artifact_write_pending,artifact_expires_at,created_at,completed_at FROM public.zoho_bulk_read_runs
 WHERE connection_id=p_connection ORDER BY created_at DESC,id DESC LIMIT 100) r;
$$;
CREATE FUNCTION public.zoho_due_bulk_reads() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'connectionId',connection_id)),'[]'::jsonb) FROM (
 SELECT r.id,r.connection_id FROM public.zoho_bulk_read_runs r JOIN public.zoho_connections c ON c.id=r.connection_id
 WHERE r.state IN ('queued','creating','polling','staging') AND r.next_attempt_at<=now()
 AND (r.lease_token IS NULL OR r.lease_expires_at<=now()) AND c.status='connected'
 ORDER BY r.next_attempt_at,r.id LIMIT 10) due;
$$;
CREATE FUNCTION public.zoho_claim_bulk_read(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_bulk_read_runs; c public.zoho_connections; token uuid;
BEGIN
 SELECT c0.* INTO STRICT c FROM public.zoho_connections c0 JOIN public.zoho_bulk_read_runs r0 ON r0.connection_id=c0.id WHERE r0.id=p_run FOR UPDATE OF c0;
 SELECT * INTO STRICT r FROM public.zoho_bulk_read_runs WHERE id=p_run FOR UPDATE;
 IF r.artifact_cleanup_pending OR r.state IN ('completed','completed_with_exceptions','failed') OR r.lease_expires_at>clock_timestamp() OR r.next_attempt_at>clock_timestamp() THEN RETURN jsonb_build_object('claimed',false); END IF;
 IF r.state='creating' OR c.status<>'connected' OR c.config_revision<>r.config_revision OR c.credential_generation<>r.credential_generation OR r.budget_expires_at<=clock_timestamp() THEN
  UPDATE public.zoho_bulk_read_runs SET state='failed',last_error=CASE WHEN r.state='creating' THEN 'CREATE_OUTCOME_UNKNOWN' ELSE 'SOURCE_CHANGED_OR_BUDGET_EXPIRED' END,lease_token=NULL,lease_expires_at=NULL WHERE id=r.id;
  RETURN jsonb_build_object('claimed',false);
 END IF;
 token:=gen_random_uuid();
 UPDATE public.zoho_bulk_read_runs SET state=CASE WHEN r.state='queued' THEN 'creating' ELSE state END,lease_token=token,lease_expires_at=clock_timestamp()+interval '3 minutes' WHERE id=r.id RETURNING * INTO r;
 RETURN jsonb_build_object('claimed',true,'lease',token,'run',jsonb_build_object('id',r.id,'connectionId',c.id,'region',c.region,'module',r.module,'state',r.state,
  'export_page',r.export_page,'provider_job_id',r.provider_job_id,'row_offset',r.row_offset,
  'artifact',CASE WHEN r.artifact_key IS NOT NULL THEN jsonb_build_object('key',r.artifact_key,'runId',r.id,'jobId',r.provider_job_id,'digest',r.archive_hash,'expiresAt',to_char(r.artifact_expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) END,
  'artifact_write_pending',r.artifact_write_pending,'artifact_write_token',r.artifact_write_token,'artifact_ready',r.artifact_ready,'artifact_count',r.artifact_count,'artifact_more',r.artifact_more));
END;
$$;
CREATE FUNCTION public.zoho_advance_bulk_read(p_run uuid,p_lease uuid,p_command text,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_bulk_read_runs; c public.zoho_connections; item jsonb; outcome jsonb; n integer; staged integer:=0; target_state text;
BEGIN
 SELECT c0.* INTO STRICT c FROM public.zoho_connections c0 JOIN public.zoho_bulk_read_runs r0 ON r0.connection_id=c0.id WHERE r0.id=p_run FOR UPDATE OF c0;
 SELECT * INTO STRICT r FROM public.zoho_bulk_read_runs WHERE id=p_run FOR UPDATE;
 IF r.lease_token IS DISTINCT FROM p_lease OR r.lease_expires_at<=clock_timestamp() OR p_lease IS NULL OR c.config_revision<>r.config_revision
  OR c.credential_generation<>r.credential_generation OR c.status<>'connected' OR r.state NOT IN ('creating','polling','staging') THEN
  RAISE EXCEPTION 'Bulk grant stale' USING ERRCODE='40001'; END IF;
 IF p_command='artifact-plan' AND r.state IN ('polling','staging') THEN
  IF r.artifact_key IS NOT NULL OR coalesce(p_payload->>'archiveHash','') !~ '^[0-9a-f]{64}$'
   OR jsonb_typeof(p_payload->'count') IS DISTINCT FROM 'number' OR (p_payload->>'count')::integer NOT BETWEEN 0 AND 200000 OR jsonb_typeof(p_payload->'more') IS DISTINCT FROM 'boolean'
   OR EXISTS(SELECT 1 FROM public.zoho_source_suppressions WHERE source_org_id=c.source_org_id AND module=r.module) THEN
   RAISE EXCEPTION 'Private export cache unavailable; use REST inventory' USING ERRCODE='22023';END IF;
  UPDATE public.zoho_bulk_read_runs SET artifact_key='__private_zoho_bulk/v1/'||id::text||'/'||provider_job_id||'/'||(p_payload->>'archiveHash')||'.bin',
   archive_hash=p_payload->>'archiveHash',artifact_expires_at=least(budget_expires_at,now()+make_interval(days=>least(7,c.retention_days))),
   artifact_write_pending=true,artifact_write_token=p_lease,artifact_count=(p_payload->>'count')::integer,artifact_more=(p_payload->>'more')::boolean WHERE id=r.id RETURNING * INTO r;
  RETURN jsonb_build_object('artifact',jsonb_build_object('key',r.artifact_key,'runId',r.id,'jobId',r.provider_job_id,'digest',r.archive_hash,'expiresAt',to_char(r.artifact_expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
 ELSIF p_command='created' AND r.state='creating' AND coalesce(p_payload->>'jobId','') ~ '^[0-9]{1,40}$' THEN
  UPDATE public.zoho_bulk_read_runs SET state='polling',provider_job_id=p_payload->>'jobId',next_attempt_at=now()+interval '30 seconds' WHERE id=r.id;
 ELSIF p_command='waiting' AND r.state IN ('polling','staging') THEN
  UPDATE public.zoho_bulk_read_runs SET next_attempt_at=now()+interval '30 seconds' WHERE id=r.id;
 ELSIF p_command='deferred' AND r.state IN ('polling','staging') THEN
  UPDATE public.zoho_bulk_read_runs SET failure_count=least(8,failure_count+1),state=CASE WHEN failure_count>=7 THEN 'failed' ELSE state END,
   next_attempt_at=now()+make_interval(secs=>greatest(30,least(86400,coalesce((p_payload->>'retryAfterSeconds')::integer,60)))),last_error='SOURCE_RETRY_DEFERRED' WHERE id=r.id;
 ELSIF p_command='failed' THEN
  UPDATE public.zoho_bulk_read_runs SET state='failed',last_error=CASE WHEN p_payload->>'code'='ARTIFACT_WRITE_OUTCOME_UNKNOWN' THEN 'ARTIFACT_WRITE_OUTCOME_UNKNOWN' ELSE 'BULK_SOURCE_OR_VALIDATION_FAILED' END,completed_at=now(),artifact_cleanup_pending=artifact_key IS NOT NULL WHERE id=r.id;
 ELSIF p_command='rows' AND r.state IN ('polling','staging') THEN
  IF jsonb_typeof(p_payload->'records') IS DISTINCT FROM 'array' OR jsonb_typeof(p_payload->'issues') IS DISTINCT FROM 'array'
   OR jsonb_typeof(p_payload->'done') IS DISTINCT FROM 'boolean' OR jsonb_typeof(p_payload->'more') IS DISTINCT FROM 'boolean'
   OR coalesce(p_payload->>'archiveHash','') !~ '^[0-9a-f]{64}$' OR (r.archive_hash IS NOT NULL AND r.archive_hash<>p_payload->>'archiveHash') THEN
   RAISE EXCEPTION 'Invalid bulk chunk' USING ERRCODE='22023'; END IF;
  n:=jsonb_array_length(p_payload->'records')+jsonb_array_length(p_payload->'issues');
  IF r.artifact_key IS NOT NULL AND (r.artifact_write_pending OR NOT r.artifact_ready OR r.artifact_expires_at<=now() OR r.artifact_cleanup_pending) THEN RAISE EXCEPTION 'Export cache not ready' USING ERRCODE='40001';END IF;
  IF r.artifact_key IS NULL AND ((p_payload->>'total')::integer>200 OR r.row_offset>0) THEN RAISE EXCEPTION 'Private export cache required' USING ERRCODE='22023';END IF;
  IF n>200 OR (p_payload->>'nextOffset')::integer<>r.row_offset+n OR (p_payload->>'total')::integer NOT BETWEEN r.row_offset+n AND 200000
   OR (p_payload->>'done')::boolean IS DISTINCT FROM ((p_payload->>'nextOffset')::integer=(p_payload->>'total')::integer)
   OR (n=0 AND NOT (p_payload->>'done')::boolean) THEN RAISE EXCEPTION 'Invalid bulk cursor' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'records') LOOP
   outcome:=public.zoho_stage_record(c.id,r.module,item->>'externalId',(item->>'modified')::timestamptz,item->'data',item->'errors');
   IF outcome->>'suppressed' IS DISTINCT FROM 'true' THEN staged:=staged+1; END IF;
  END LOOP;
  target_state:=CASE WHEN (p_payload->>'done')::boolean AND NOT (p_payload->>'more')::boolean THEN
    CASE WHEN r.issue_count+jsonb_array_length(p_payload->'issues')>0 THEN 'completed_with_exceptions' ELSE 'completed' END
   WHEN (p_payload->>'done')::boolean THEN 'queued' ELSE 'staging' END;
  IF target_state='queued' AND r.export_page=1000 THEN target_state:='failed'; END IF;
  UPDATE public.zoho_bulk_read_runs SET state=target_state,staged_count=staged_count+staged,issue_count=issue_count+jsonb_array_length(p_payload->'issues'),
   export_page=CASE WHEN target_state='queued' THEN export_page+1 ELSE export_page END,
   provider_job_id=CASE WHEN target_state='queued' AND artifact_key IS NULL THEN NULL ELSE provider_job_id END,
   row_offset=CASE WHEN target_state='queued' THEN 0 ELSE (p_payload->>'nextOffset')::integer END,
   archive_hash=CASE WHEN target_state='queued' AND artifact_key IS NULL THEN NULL ELSE p_payload->>'archiveHash' END,artifact_cleanup_pending=artifact_key IS NOT NULL AND (p_payload->>'done')::boolean,
   next_attempt_at=now()+interval '15 seconds',last_error=CASE WHEN target_state='failed' THEN 'EXPORT_PAGE_LIMIT' END,
   completed_at=CASE WHEN target_state IN ('completed','completed_with_exceptions','failed') THEN now() END WHERE id=r.id;
 ELSE RAISE EXCEPTION 'Invalid bulk transition' USING ERRCODE='22023'; END IF;
 UPDATE public.zoho_bulk_read_runs SET lease_token=NULL,lease_expires_at=NULL WHERE id=r.id RETURNING * INTO r;
 RETURN jsonb_build_object('runId',r.id,'done',r.state IN ('completed','completed_with_exceptions','failed'),'state',r.state,'stagingOnly',true);
END;
$$;
CREATE FUNCTION public.zoho_finish_bulk_artifact_write(p_run uuid,p_key text,p_write_token uuid,p_success boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_bulk_read_runs;
BEGIN
 UPDATE public.zoho_bulk_read_runs SET artifact_write_pending=false,artifact_write_token=NULL,artifact_ready=p_success,
  artifact_cleanup_pending=artifact_cleanup_pending OR NOT p_success
 WHERE id=p_run AND artifact_key=p_key AND artifact_write_token=p_write_token AND p_write_token IS NOT NULL
 RETURNING * INTO r;
 IF NOT FOUND THEN RAISE EXCEPTION 'Artifact write stale' USING ERRCODE='40001';END IF;
 RETURN jsonb_build_object('ready',r.artifact_ready AND r.state IN ('polling','staging') AND NOT r.artifact_cleanup_pending);
END;
$$;
CREATE FUNCTION public.zoho_due_bulk_artifact_writes() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('runId',id,'key',artifact_key,'jobId',provider_job_id,'digest',archive_hash,'expiresAt',artifact_expires_at,'writeToken',artifact_write_token)),'[]'::jsonb)
 FROM(SELECT * FROM public.zoho_bulk_read_runs WHERE artifact_key IS NOT NULL AND artifact_write_pending
 AND (lease_expires_at IS NULL OR lease_expires_at<=now() OR state='failed') ORDER BY created_at,id LIMIT 50) due;
$$;
CREATE FUNCTION public.zoho_due_bulk_artifact_cleanup() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 UPDATE public.zoho_bulk_read_runs r SET state='failed',last_error='PRIVATE_EXPORT_INVALIDATED',artifact_cleanup_pending=true
 FROM public.zoho_connections c WHERE c.id=r.connection_id AND r.artifact_key IS NOT NULL AND
 (r.artifact_expires_at<=now() OR r.budget_expires_at<=now() OR c.status<>'connected' OR c.config_revision<>r.config_revision
 OR c.credential_generation<>r.credential_generation OR EXISTS(SELECT 1 FROM public.zoho_source_suppressions x WHERE x.source_org_id=c.source_org_id AND x.module=r.module));
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('runId',id,'key',artifact_key,'jobId',provider_job_id,'digest',archive_hash,'expiresAt',artifact_expires_at)),'[]'::jsonb)
 FROM(SELECT * FROM public.zoho_bulk_read_runs WHERE artifact_key IS NOT NULL AND NOT artifact_write_pending AND
 (artifact_cleanup_pending OR state IN ('completed','completed_with_exceptions','failed')) ORDER BY created_at,id LIMIT 50) due);
END;
$$;
CREATE FUNCTION public.zoho_finish_bulk_artifact_cleanup(p_run uuid,p_key text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 UPDATE public.zoho_bulk_read_runs SET artifact_key=NULL,artifact_expires_at=NULL,artifact_ready=false,artifact_cleanup_pending=false,
  artifact_count=NULL,artifact_more=NULL,archive_hash=CASE WHEN state='queued' THEN NULL ELSE archive_hash END,
  provider_job_id=CASE WHEN state='queued' THEN NULL ELSE provider_job_id END
 WHERE id=p_run AND artifact_key=p_key AND NOT artifact_write_pending AND (artifact_cleanup_pending OR state IN ('completed','completed_with_exceptions','failed'));
 RETURN jsonb_build_object('removed',FOUND);
END;
$$;
CREATE FUNCTION public.zoho_erase_bulk_source_artifacts(p_connection uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE source_org text;remaining integer;
BEGIN
 SELECT source_org_id INTO STRICT source_org FROM public.zoho_connections WHERE id=p_connection;
 UPDATE public.zoho_bulk_read_runs r SET state='failed',last_error='SOURCE_ERASURE',artifact_cleanup_pending=artifact_key IS NOT NULL,
  lease_token=NULL,lease_expires_at=NULL FROM public.zoho_connections c WHERE c.id=r.connection_id AND c.source_org_id=source_org
  AND r.module='Candidates' AND (r.artifact_key IS NOT NULL OR r.state IN ('queued','creating','polling','staging'));
 SELECT count(*) INTO remaining FROM public.zoho_bulk_read_runs r JOIN public.zoho_connections c ON c.id=r.connection_id
 WHERE c.source_org_id=source_org AND r.module='Candidates' AND r.artifact_key IS NOT NULL;
 RETURN jsonb_build_object('complete',remaining=0,'remaining',remaining);
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_start_bulk_read(uuid,text,uuid,uuid),public.zoho_bulk_read_snapshot(uuid),public.zoho_due_bulk_reads(),public.zoho_due_bulk_artifact_cleanup(),public.zoho_due_bulk_artifact_writes(),public.zoho_finish_bulk_artifact_write(uuid,text,uuid,boolean),public.zoho_finish_bulk_artifact_cleanup(uuid,text),public.zoho_erase_bulk_source_artifacts(uuid),public.zoho_claim_bulk_read(uuid),
 public.zoho_advance_bulk_read(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_start_bulk_read(uuid,text,uuid,uuid),public.zoho_bulk_read_snapshot(uuid),public.zoho_due_bulk_reads(),public.zoho_due_bulk_artifact_cleanup(),public.zoho_due_bulk_artifact_writes(),public.zoho_finish_bulk_artifact_write(uuid,text,uuid,boolean),public.zoho_finish_bulk_artifact_cleanup(uuid,text),public.zoho_erase_bulk_source_artifacts(uuid),public.zoho_claim_bulk_read(uuid),
 public.zoho_advance_bulk_read(uuid,uuid,text,jsonb) TO service_role;
COMMIT;
