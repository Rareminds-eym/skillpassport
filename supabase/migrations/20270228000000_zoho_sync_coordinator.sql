BEGIN;

-- Capture is independent from approval/execution. Schema-invalid rows have not
-- been captured and MUST prevent advancement; normalized deferred rows are durable.
ALTER TABLE public.zoho_discovery_runs
 ADD COLUMN capture_complete boolean NOT NULL DEFAULT false,
 ADD COLUMN capture_had_schema_issues boolean NOT NULL DEFAULT false,
 ADD COLUMN new_count integer NOT NULL DEFAULT 0,
 ADD COLUMN changed_count integer NOT NULL DEFAULT 0,
 ADD COLUMN unchanged_count integer NOT NULL DEFAULT 0,
 ADD COLUMN suppressed_count integer NOT NULL DEFAULT 0,
 ADD COLUMN transport_phase text,
 ADD COLUMN transport text NOT NULL DEFAULT 'rest' CHECK(transport IN ('rest','bulk')),
 ADD COLUMN bulk_run_id uuid REFERENCES public.zoho_bulk_read_runs(id);
UPDATE public.zoho_discovery_runs SET capture_complete=true WHERE state='completed' AND NOT scan_had_exceptions;
CREATE INDEX zoho_discovery_capture ON public.zoho_discovery_runs(connection_id,module,config_revision,scan_started_at DESC) WHERE capture_complete;

CREATE TABLE public.zoho_sync_policies (
 connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
 module text NOT NULL CHECK(module IN ('Candidates','Job_Openings')),
 enabled boolean NOT NULL DEFAULT true, interval_minutes integer NOT NULL DEFAULT 15 CHECK(interval_minutes BETWEEN 5 AND 1440),
 reconciliation_days integer NOT NULL DEFAULT 7 CHECK(reconciliation_days BETWEEN 1 AND 30),
 prefer_bulk boolean NOT NULL DEFAULT true, updated_by uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(connection_id,module)
);
CREATE TABLE public.zoho_webhook_credentials (
 connection_id uuid PRIMARY KEY REFERENCES public.zoho_connections(id),
 secret_hash text NOT NULL CHECK(secret_hash ~ '^[0-9a-f]{64}$'), config_revision integer NOT NULL,
 rotated_by uuid NOT NULL, rotated_at timestamptz NOT NULL DEFAULT now()
);
-- One bounded hint per source/module; no provider payloads, PII or growing inbox.
CREATE TABLE public.zoho_sync_hints (
 connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
 module text NOT NULL CHECK(module IN ('Candidates','Job_Openings')),
 received_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(connection_id,module)
);
ALTER TABLE public.zoho_sync_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoho_webhook_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoho_sync_hints ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.zoho_sync_policies,public.zoho_webhook_credentials,public.zoho_sync_hints FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
GRANT SELECT ON public.zoho_sync_policies,public.zoho_sync_hints TO service_role;

CREATE OR REPLACE FUNCTION public.zoho_start_discovery_before_controls(p_connection uuid,p_module text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; r public.zoho_discovery_runs; previous public.zoho_discovery_runs;
 watermark timestamptz; last_full timestamptz; checkpoint integer:=1; saved_page_size integer:=10; schema_issues boolean:=false; had_exceptions boolean:=false; scan_start timestamptz:=clock_timestamp();
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.status<>'connected' OR p_actor IS NULL OR p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings') THEN
  RAISE EXCEPTION 'Source unavailable' USING ERRCODE='22023';
 END IF;
 SELECT * INTO r FROM public.zoho_discovery_runs WHERE connection_id=c.id AND module=p_module AND state IN ('queued','running');
 IF NOT FOUND THEN
  SELECT * INTO previous FROM public.zoho_discovery_runs WHERE connection_id=c.id AND module=p_module
   AND config_revision=c.config_revision ORDER BY created_at DESC,id DESC LIMIT 1;
  IF previous.state='incomplete' AND previous.next_page<=500000 THEN
   schema_issues:=previous.capture_had_schema_issues OR jsonb_array_length(previous.issues)>0; saved_page_size:=previous.page_size; checkpoint:=previous.next_page; watermark:=previous.modified_since; scan_start:=coalesce(previous.scan_started_at,previous.created_at);
   had_exceptions:=previous.scan_had_exceptions OR previous.deferred_count>0 OR jsonb_array_length(previous.issues)>0;
  ELSE
   SELECT max(scan_started_at) INTO last_full FROM public.zoho_discovery_runs WHERE connection_id=c.id AND module=p_module
    AND config_revision=c.config_revision AND capture_complete AND modified_since IS NULL;
   IF last_full>clock_timestamp()-make_interval(days=>least(c.retention_days,coalesce((SELECT reconciliation_days FROM public.zoho_sync_policies WHERE connection_id=c.id AND module=p_module),7))) THEN
    SELECT max(scan_started_at)-interval '10 minutes' INTO watermark FROM public.zoho_discovery_runs
     WHERE connection_id=c.id AND module=p_module AND config_revision=c.config_revision AND capture_complete;
   END IF;
  END IF;
  INSERT INTO public.zoho_discovery_runs(connection_id,config_revision,module,actor_id,next_page,modified_since,scan_started_at,scan_had_exceptions,created_at,page_size,capture_had_schema_issues)
   VALUES(c.id,c.config_revision,p_module,p_actor,checkpoint,watermark,scan_start,had_exceptions,clock_timestamp(),saved_page_size,schema_issues) RETURNING * INTO r;
  IF checkpoint>1 THEN
   UPDATE public.zoho_discovery_runs SET received_count=previous.received_count,staged_count=previous.staged_count,
    deferred_count=previous.deferred_count,issues=previous.issues,new_count=previous.new_count,changed_count=previous.changed_count,
    unchanged_count=previous.unchanged_count,suppressed_count=previous.suppressed_count WHERE id=r.id RETURNING * INTO r;
  END IF;
 END IF;
 RETURN jsonb_build_object('runId',r.id,'state',r.state,'emailPolicy','forbidden',
  'mode',CASE WHEN r.modified_since IS NULL THEN 'reconciliation' ELSE 'incremental' END,'nextPage',r.next_page);
END;
$$;



ALTER FUNCTION public.zoho_commit_discovery_page(uuid,integer,jsonb,jsonb,boolean) RENAME TO zoho_commit_discovery_before_capture;
CREATE FUNCTION public.zoho_commit_discovery_page(p_run uuid,p_page integer,p_records jsonb,p_issues jsonb,p_more boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; result jsonb; before_rows jsonb; n integer; ch integer; same integer; suppressed integer;
BEGIN
 r:=public.zoho_lock_discovery_run(p_run);
 IF r.state NOT IN ('queued','running') OR r.next_page IS DISTINCT FROM p_page THEN
  RETURN public.zoho_commit_discovery_before_capture(p_run,p_page,p_records,p_issues,p_more);
 END IF;
 SELECT coalesce(jsonb_object_agg(s.external_id,to_jsonb(s.revision)),'{}') INTO before_rows
 FROM public.zoho_staged_records s WHERE s.connection_id=r.connection_id AND s.module=r.module
 AND s.external_id IN (SELECT value->>'externalId' FROM jsonb_array_elements(p_records));
 result:=public.zoho_commit_discovery_before_capture(p_run,p_page,p_records,p_issues,p_more);
 SELECT count(*) FILTER(WHERE NOT before_rows ? s.external_id),
 count(*) FILTER(WHERE before_rows ? s.external_id AND s.revision>(before_rows->>s.external_id)::integer),
 count(*) FILTER(WHERE before_rows ? s.external_id AND s.revision=(before_rows->>s.external_id)::integer)
 INTO n,ch,same FROM public.zoho_staged_records s
 WHERE s.connection_id=r.connection_id AND s.module=r.module
 AND s.external_id IN(SELECT value->>'externalId' FROM jsonb_array_elements(p_records))
 AND NOT EXISTS(SELECT 1 FROM public.zoho_deferred_records d WHERE d.connection_id=r.connection_id AND d.module=r.module
 AND d.external_id=s.external_id AND d.state IN ('waiting_execution','blocked_invalid'))
 AND NOT EXISTS(SELECT 1 FROM public.zoho_source_suppressions x JOIN public.zoho_connections c ON c.source_org_id=x.source_org_id
 WHERE c.id=r.connection_id AND x.module=r.module AND x.external_id=s.external_id);
 SELECT count(*) INTO suppressed FROM jsonb_array_elements(p_records) item
 WHERE EXISTS(SELECT 1 FROM public.zoho_source_suppressions x JOIN public.zoho_connections c ON c.source_org_id=x.source_org_id
 WHERE c.id=r.connection_id AND x.module=r.module AND x.external_id=item->>'externalId');
 UPDATE public.zoho_discovery_runs SET new_count=new_count+n,changed_count=changed_count+ch,unchanged_count=unchanged_count+same,
 suppressed_count=suppressed_count+suppressed,
 capture_had_schema_issues=capture_had_schema_issues OR jsonb_array_length(p_issues)>0,
 capture_complete=NOT p_more AND NOT capture_had_schema_issues AND jsonb_array_length(p_issues)=0 WHERE id=r.id;
 RETURN result;
END;
$$;

-- The old worker must never read a page owned by the bulk transport.
ALTER FUNCTION public.zoho_claim_discovery_batch(uuid) RENAME TO zoho_claim_discovery_before_transport;
CREATE FUNCTION public.zoho_claim_discovery_batch(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
 r:=public.zoho_lock_discovery_run(p_run);
 IF r.transport<>'rest' THEN RETURN jsonb_build_object('claimed',false); END IF;
 RETURN public.zoho_claim_discovery_before_transport(p_run);
END;
$$;

CREATE FUNCTION public.zoho_plan_discovery(p_connection uuid,p_module text,p_actor uuid,p_bulk_available boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; r public.zoho_discovery_runs; b jsonb; c public.zoho_connections;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 -- Existing manual bulk work must finish before a REST scan starts.
 IF EXISTS(SELECT 1 FROM public.zoho_bulk_read_runs x WHERE x.connection_id=c.id AND x.module=p_module
  AND x.state IN ('queued','creating','polling','staging') AND NOT EXISTS(SELECT 1 FROM public.zoho_discovery_runs d WHERE d.bulk_run_id=x.id))
 THEN RAISE EXCEPTION 'Bulk inventory already active' USING ERRCODE='40001'; END IF;
 result:=public.zoho_start_discovery(p_connection,p_module,p_actor);
 SELECT * INTO STRICT r FROM public.zoho_discovery_runs WHERE id=(result->>'runId')::uuid;
 INSERT INTO public.zoho_sync_policies(connection_id,module,updated_by) VALUES(c.id,p_module,p_actor) ON CONFLICT DO NOTHING;
 IF p_bulk_available AND r.transport='rest' AND r.next_page=1 AND r.received_count=0 AND r.modified_since IS NULL
 AND coalesce((SELECT prefer_bulk FROM public.zoho_sync_policies WHERE connection_id=c.id AND module=p_module),true)
 AND NOT EXISTS(SELECT 1 FROM public.zoho_bulk_read_runs x WHERE x.connection_id=c.id AND x.module=p_module AND x.config_revision=c.config_revision)
 AND NOT EXISTS(SELECT 1 FROM public.zoho_source_suppressions WHERE source_org_id=c.source_org_id AND module=p_module)
 THEN
  UPDATE public.zoho_discovery_runs SET transport='bulk' WHERE id=r.id;
  b:=public.zoho_start_bulk_read(c.id,p_module,r.id,p_actor);
  UPDATE public.zoho_discovery_runs SET transport='bulk',bulk_run_id=(b->>'runId')::uuid WHERE id=r.id RETURNING * INTO r;
 END IF;
 RETURN result||jsonb_build_object('transport',r.transport,'bulkRunId',r.bulk_run_id);
END;
$$;

-- Manual bulk inventory cannot race an existing REST scan.
ALTER FUNCTION public.zoho_start_bulk_read(uuid,text,uuid,uuid) RENAME TO zoho_start_bulk_before_sync;
CREATE FUNCTION public.zoho_start_bulk_read(p_connection uuid,p_module text,p_request uuid,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM 1 FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE connection_id=p_connection AND module=p_module
 AND state IN ('queued','running') AND transport='rest') THEN
  RAISE EXCEPTION 'REST inventory already active' USING ERRCODE='40001'; END IF;
 RETURN public.zoho_start_bulk_before_sync(p_connection,p_module,p_request,p_actor);
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_start_bulk_before_sync(uuid,text,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
REVOKE ALL ON FUNCTION public.zoho_start_bulk_read(uuid,text,uuid,uuid) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_start_bulk_read(uuid,text,uuid,uuid) TO service_role;

-- Bulk and REST share pause/cancel authority; stale leases cannot stage after stop.
ALTER FUNCTION public.zoho_claim_bulk_read(uuid) RENAME TO zoho_claim_bulk_before_sync;
CREATE FUNCTION public.zoho_claim_bulk_read(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM 1 FROM public.zoho_connections c JOIN public.zoho_bulk_read_runs b ON b.connection_id=c.id WHERE b.id=p_run FOR UPDATE OF c;
 IF EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE bulk_run_id=p_run AND (control_state<>'active' OR state NOT IN ('queued','running')))
 THEN RETURN jsonb_build_object('claimed',false); END IF;
 RETURN public.zoho_claim_bulk_before_sync(p_run);
END;
$$;
ALTER FUNCTION public.zoho_advance_bulk_read(uuid,uuid,text,jsonb) RENAME TO zoho_advance_bulk_before_sync;
CREATE FUNCTION public.zoho_advance_bulk_read(p_run uuid,p_lease uuid,p_command text,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM 1 FROM public.zoho_connections c JOIN public.zoho_bulk_read_runs b ON b.connection_id=c.id WHERE b.id=p_run FOR UPDATE OF c;
 IF EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE bulk_run_id=p_run AND (control_state<>'active' OR state NOT IN ('queued','running')))
 THEN RAISE EXCEPTION 'Discovery stopped' USING ERRCODE='40001'; END IF;
 RETURN public.zoho_advance_bulk_before_sync(p_run,p_lease,p_command,p_payload);
END;
$$;
CREATE FUNCTION public.zoho_bulk_sync_progress() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 -- A failed staging-only export can safely fall back to idempotent REST reads.
 -- Never retry an uncertain export POST; the original bulk job remains audited.
 UPDATE public.zoho_discovery_runs SET
 transport=CASE WHEN NEW.state='failed' THEN 'rest' ELSE transport END,
 transport_phase=CASE WHEN NEW.state='failed' THEN NULL ELSE NEW.state END,
 state=CASE WHEN NEW.state='failed' THEN 'queued' WHEN NEW.state IN ('completed','completed_with_exceptions') THEN NEW.state ELSE 'running' END,
 capture_complete=NEW.state='completed',
 received_count=CASE WHEN NEW.state='failed' THEN 0 ELSE least(2147483647,NEW.staged_count+NEW.issue_count)::integer END,
 staged_count=CASE WHEN NEW.state='failed' THEN 0 ELSE least(2147483647,NEW.staged_count)::integer END,
 next_page=CASE WHEN NEW.state='failed' THEN 1 ELSE 1+ceil((NEW.staged_count+NEW.issue_count)::numeric/(CASE NEW.module WHEN 'Job_Openings' THEN 20 ELSE 200 END))::integer END,
 next_attempt_at=greatest(clock_timestamp(),NEW.next_attempt_at),
 last_error=CASE WHEN NEW.state='failed' THEN 'BULK_FALLBACK_REST' ELSE NEW.last_error END,
 completed_at=NEW.completed_at
 WHERE bulk_run_id=NEW.id AND transport='bulk' AND control_state='active' AND state IN ('queued','running');
 RETURN NEW;
END;
$$;
CREATE TRIGGER zoho_bulk_sync_progress AFTER UPDATE ON public.zoho_bulk_read_runs FOR EACH ROW EXECUTE FUNCTION public.zoho_bulk_sync_progress();

ALTER FUNCTION public.zoho_control_discovery(uuid,uuid,text,text,uuid) RENAME TO zoho_control_discovery_before_sync;
CREATE FUNCTION public.zoho_control_discovery(p_connection uuid,p_run uuid,p_action text,p_reason text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
 result:=public.zoho_control_discovery_before_sync(p_connection,p_run,p_action,p_reason,p_actor);
 UPDATE public.zoho_bulk_read_runs b SET lease_token=NULL,lease_expires_at=NULL,
 state=CASE WHEN p_action='cancel' THEN 'failed' ELSE b.state END,
 last_error=CASE WHEN p_action='cancel' THEN 'CANCELLED_BY_OPERATOR' ELSE b.last_error END,
 artifact_cleanup_pending=b.artifact_cleanup_pending OR (p_action='cancel' AND b.artifact_key IS NOT NULL)
 FROM public.zoho_discovery_runs r WHERE r.id=p_run AND r.bulk_run_id=b.id;
 RETURN result||(SELECT jsonb_build_object('transport',transport,'bulkRunId',bulk_run_id) FROM public.zoho_discovery_runs WHERE id=p_run);
END;
$$;

CREATE FUNCTION public.zoho_sync_snapshot(p_connection uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('policies',(SELECT jsonb_agg(jsonb_build_object('module',m.module,'enabled',coalesce(p.enabled,true),
 'intervalMinutes',coalesce(p.interval_minutes,15),'reconciliationDays',coalesce(p.reconciliation_days,7),'preferBulk',coalesce(p.prefer_bulk,true),
 'capturedThrough',(SELECT max(r.scan_started_at) FROM public.zoho_discovery_runs r WHERE r.connection_id=c.id AND r.module=m.module AND r.config_revision=c.config_revision AND r.capture_complete),
 'lastWebhookAt',(SELECT h.received_at FROM public.zoho_sync_hints h WHERE h.connection_id=c.id AND h.module=m.module)))
 FROM (VALUES('Candidates'),('Job_Openings')) m(module) LEFT JOIN public.zoho_sync_policies p ON p.connection_id=c.id AND p.module=m.module),
 'webhookConfigured',EXISTS(SELECT 1 FROM public.zoho_webhook_credentials w WHERE w.connection_id=c.id AND w.config_revision=c.config_revision),
 'configRevision',c.config_revision,'emailPolicy','forbidden') FROM public.zoho_connections c WHERE c.id=p_connection;
$$;
CREATE FUNCTION public.zoho_configure_sync(p_connection uuid,p_module text,p_config integer,p_enabled boolean,p_interval integer,p_reconciliation integer,p_bulk boolean,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.config_revision IS DISTINCT FROM p_config THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001'; END IF;
 IF p_actor IS NULL OR p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings') OR p_enabled IS NULL OR p_bulk IS NULL
 OR p_interval IS NULL OR p_interval NOT BETWEEN 5 AND 1440 OR p_reconciliation IS NULL OR p_reconciliation NOT BETWEEN 1 AND 30
 THEN RAISE EXCEPTION 'Invalid sync policy' USING ERRCODE='22023'; END IF;
 INSERT INTO public.zoho_sync_policies(connection_id,module,enabled,interval_minutes,reconciliation_days,prefer_bulk,updated_by)
 VALUES(c.id,p_module,p_enabled,p_interval,p_reconciliation,p_bulk,p_actor)
 ON CONFLICT(connection_id,module) DO UPDATE SET enabled=excluded.enabled,interval_minutes=excluded.interval_minutes,
 reconciliation_days=excluded.reconciliation_days,prefer_bulk=excluded.prefer_bulk,updated_by=excluded.updated_by,updated_at=clock_timestamp();
 RETURN public.zoho_sync_snapshot(c.id);
END;
$$;
CREATE FUNCTION public.zoho_rotate_webhook(p_connection uuid,p_config integer,p_hash text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.config_revision IS DISTINCT FROM p_config THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001'; END IF;
 IF p_actor IS NULL OR p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid webhook credential' USING ERRCODE='22023'; END IF;
 INSERT INTO public.zoho_webhook_credentials(connection_id,secret_hash,config_revision,rotated_by) VALUES(c.id,p_hash,c.config_revision,p_actor)
 ON CONFLICT(connection_id) DO UPDATE SET secret_hash=excluded.secret_hash,config_revision=excluded.config_revision,rotated_by=excluded.rotated_by,rotated_at=clock_timestamp();
 RETURN jsonb_build_object('configured',true);
END;
$$;
CREATE FUNCTION public.zoho_accept_sync_hint(p_connection uuid,p_module text,p_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections;
BEGIN
 IF p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings') OR p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
 -- Credential rows are private; caller never receives token hashes or source details.
 SELECT c0.* INTO c FROM public.zoho_connections c0 JOIN public.zoho_webhook_credentials w ON w.connection_id=c0.id
 WHERE c0.id=p_connection AND c0.status='connected' AND w.config_revision=c0.config_revision AND w.secret_hash=p_hash FOR UPDATE OF c0;
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO public.zoho_sync_hints(connection_id,module) VALUES(c.id,p_module)
 ON CONFLICT(connection_id,module) DO UPDATE SET received_at=excluded.received_at
 WHERE public.zoho_sync_hints.received_at<clock_timestamp()-interval '30 seconds';
 RETURN true;
END;
$$;

-- Existing recovery cron is the durable dispatcher; no second scheduler.
-- Hints coalesce at module granularity: one conditional collection scan instead
-- of one provider call for every webhook. Polling recovers lost notifications.
CREATE FUNCTION public.zoho_due_sync(p_bulk_available boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE candidate record;
BEGIN
 FOR candidate IN
 SELECT c.id,c.created_by,h.module FROM public.zoho_connections c
 CROSS JOIN LATERAL (SELECT DISTINCT ON(r.module) r.* FROM public.zoho_discovery_runs r
 WHERE r.connection_id=c.id AND r.config_revision=c.config_revision ORDER BY r.module,r.created_at DESC,r.id DESC) h
 LEFT JOIN public.zoho_sync_policies p ON p.connection_id=c.id AND p.module=h.module
 LEFT JOIN public.zoho_sync_hints hint ON hint.connection_id=c.id AND hint.module=h.module
 WHERE c.status='connected' AND coalesce(p.enabled,true) AND h.control_state='active'
 AND h.state IN ('completed','completed_with_exceptions','incomplete') AND h.next_page<=500000
 AND (h.state='incomplete' OR h.completed_at<clock_timestamp()-make_interval(mins=>coalesce(p.interval_minutes,15))
 OR (hint.received_at>h.scan_started_at AND h.completed_at<clock_timestamp()-interval '1 minute'))
 ORDER BY h.completed_at,c.id,h.module LIMIT 10 FOR UPDATE OF c SKIP LOCKED
 LOOP
  -- All start paths lock the source before inspecting active runs. Never restart
  -- a paused, failed or cancelled run; reconnect/config changes require review.
  PERFORM public.zoho_plan_discovery(candidate.id,candidate.module,candidate.created_by,p_bulk_available);
 END LOOP;
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'transport',transport,'bulkRunId',bulk_run_id)),'[]') FROM(
 SELECT r.id,r.transport,r.bulk_run_id FROM public.zoho_discovery_runs r JOIN public.zoho_connections c ON c.id=r.connection_id
 WHERE r.control_state='active' AND r.state IN ('queued','running') AND r.config_revision=c.config_revision AND c.status='connected'
 AND r.next_attempt_at<=clock_timestamp() AND (r.lease_token IS NULL OR r.lease_expires_at<=clock_timestamp())
 ORDER BY r.next_attempt_at,r.id LIMIT 10) due);
END;
$$;
CREATE OR REPLACE FUNCTION public.zoho_due_discovery() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 -- Legacy workers may recover REST runs but cannot claim linked bulk work.
 PERFORM public.zoho_due_sync(false);
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id)),'[]') FROM(
 SELECT r.id FROM public.zoho_discovery_runs r JOIN public.zoho_connections c ON c.id=r.connection_id
 WHERE r.transport='rest' AND r.control_state='active' AND r.state IN ('queued','running') AND c.status='connected'
 AND r.config_revision=c.config_revision AND r.next_attempt_at<=now() AND (r.lease_token IS NULL OR r.lease_expires_at<=now())
 ORDER BY r.next_attempt_at,r.id LIMIT 10) due);
END;
$$;
-- Reconcile provider deletion evidence independently. Absence from a scan is
-- never deletion. Failed deletion scans need operator attention, not blind loops.
CREATE OR REPLACE FUNCTION public.zoho_due_deleted_scans() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE candidate record;
BEGIN
 FOR candidate IN SELECT c.id,c.created_by,h.module FROM public.zoho_connections c
 CROSS JOIN LATERAL(SELECT DISTINCT ON(r.module) r.* FROM public.zoho_discovery_runs r WHERE r.connection_id=c.id
 AND r.config_revision=c.config_revision ORDER BY r.module,r.created_at DESC,r.id DESC) h
 LEFT JOIN public.zoho_sync_policies p ON p.connection_id=c.id AND p.module=h.module
 LEFT JOIN LATERAL(SELECT s.* FROM public.zoho_deleted_scans s WHERE s.connection_id=c.id AND s.module=h.module
 AND s.config_revision=c.config_revision ORDER BY s.scan_started_at DESC,s.id DESC LIMIT 1) d ON true
 LEFT JOIN public.zoho_sync_hints hint ON hint.connection_id=c.id AND hint.module=h.module
 WHERE c.status='connected' AND coalesce(p.enabled,true) AND h.control_state='active' AND h.state<>'failed'
 AND (d.id IS NULL OR (d.state='completed' AND (d.completed_at<clock_timestamp()-interval '1 day'
 OR (hint.received_at>d.scan_started_at AND d.completed_at<clock_timestamp()-interval '1 minute'))))
 ORDER BY d.completed_at NULLS FIRST,c.id,h.module LIMIT 10 FOR UPDATE OF c SKIP LOCKED
 LOOP
  PERFORM public.zoho_start_deleted_scan(candidate.id,candidate.module,candidate.created_by);
 END LOOP;
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'connectionId',connection_id)),'[]') FROM(
 SELECT s.id,s.connection_id FROM public.zoho_deleted_scans s JOIN public.zoho_connections c ON c.id=s.connection_id
 WHERE s.state IN ('queued','running') AND s.next_attempt_at<=now() AND (s.lease_token IS NULL OR s.lease_expires_at<=now())
 AND c.status='connected' AND s.config_revision=c.config_revision ORDER BY s.next_attempt_at,s.id LIMIT 10) due);
END;
$$;
-- Legacy single-page consumers also honor transport ownership.
CREATE OR REPLACE FUNCTION public.zoho_claim_discovery(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
 r:=public.zoho_lock_discovery_run(p_run);
 IF r.transport<>'rest' OR r.page_size<>10 THEN RETURN jsonb_build_object('claimed',false); END IF;
 RETURN public.zoho_claim_discovery_before_batching(p_run);
END;
$$;

REVOKE ALL ON FUNCTION public.zoho_commit_discovery_before_capture(uuid,integer,jsonb,jsonb,boolean),public.zoho_claim_discovery_before_transport(uuid),
 public.zoho_claim_bulk_before_sync(uuid),public.zoho_advance_bulk_before_sync(uuid,uuid,text,jsonb),public.zoho_control_discovery_before_sync(uuid,uuid,text,text,uuid),public.zoho_bulk_sync_progress()
 FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
REVOKE ALL ON FUNCTION public.zoho_sync_snapshot(uuid),public.zoho_configure_sync(uuid,text,integer,boolean,integer,integer,boolean,uuid),
 public.zoho_rotate_webhook(uuid,integer,text,uuid),public.zoho_accept_sync_hint(uuid,text,text),public.zoho_plan_discovery(uuid,text,uuid,boolean),
 public.zoho_due_sync(boolean),public.zoho_commit_discovery_page(uuid,integer,jsonb,jsonb,boolean),public.zoho_claim_discovery_batch(uuid),
 public.zoho_claim_bulk_read(uuid),public.zoho_advance_bulk_read(uuid,uuid,text,jsonb),public.zoho_control_discovery(uuid,uuid,text,text,uuid)
 FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_sync_snapshot(uuid),public.zoho_configure_sync(uuid,text,integer,boolean,integer,integer,boolean,uuid),
 public.zoho_rotate_webhook(uuid,integer,text,uuid),public.zoho_accept_sync_hint(uuid,text,text),public.zoho_plan_discovery(uuid,text,uuid,boolean),
 public.zoho_claim_bulk_read(uuid),public.zoho_advance_bulk_read(uuid,uuid,text,jsonb),public.zoho_control_discovery(uuid,uuid,text,text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.zoho_due_sync(boolean),public.zoho_claim_discovery_batch(uuid) TO service_role,zoho_discovery;
COMMIT;
