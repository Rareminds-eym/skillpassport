BEGIN;

CREATE FUNCTION public.zoho_retire_stale_discoveries(p_connection uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE obsolete record; c public.zoho_connections;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 FOR obsolete IN UPDATE public.zoho_discovery_runs SET state='failed',last_error='CONNECTION_CHANGED',
  lease_token=NULL,lease_expires_at=NULL,lease_page=NULL,lease_credential_generation=NULL,completed_at=clock_timestamp()
  WHERE connection_id=c.id AND config_revision<>c.config_revision AND state IN ('queued','running') RETURNING bulk_run_id
 LOOP
  UPDATE public.zoho_bulk_read_runs SET state='failed',last_error='SOURCE_CHANGED_OR_BUDGET_EXPIRED',lease_token=NULL,lease_expires_at=NULL,
   artifact_cleanup_pending=artifact_key IS NOT NULL,completed_at=clock_timestamp() WHERE id=obsolete.bulk_run_id AND state IN ('queued','creating','polling','staging');
 END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_retire_stale_discoveries(uuid) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

CREATE OR REPLACE FUNCTION public.zoho_start_discovery(p_connection uuid,p_module text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM public.zoho_retire_stale_discoveries(p_connection);
 IF EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE connection_id=p_connection AND module=p_module
  AND state IN ('queued','running') AND control_state='paused')
 THEN RAISE EXCEPTION 'Resume or cancel paused discovery first' USING ERRCODE='40001'; END IF;
 RETURN public.zoho_start_discovery_before_controls(p_connection,p_module,p_actor);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_verify_discovery_lease(p_run uuid,p_lease uuid) RETURNS public.zoho_discovery_runs
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
 r:=public.zoho_verify_discovery_lease_before_controls(p_run,p_lease);
 IF r.control_state<>'active' OR r.transport<>'rest' THEN RAISE EXCEPTION 'Discovery transport or control changed' USING ERRCODE='40001'; END IF;
 RETURN r;
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_plan_discovery(p_connection uuid,p_module text,p_actor uuid,p_bulk_available boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; r public.zoho_discovery_runs; b jsonb; c public.zoho_connections; existing_id uuid;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 -- Existing manual bulk work must finish before a REST scan starts.
 IF EXISTS(SELECT 1 FROM public.zoho_bulk_read_runs x WHERE x.connection_id=c.id AND x.module=p_module
  AND x.state IN ('queued','creating','polling','staging') AND NOT EXISTS(SELECT 1 FROM public.zoho_discovery_runs d WHERE d.bulk_run_id=x.id))
 THEN RAISE EXCEPTION 'Bulk inventory already active' USING ERRCODE='40001'; END IF;
 SELECT id INTO existing_id FROM public.zoho_discovery_runs WHERE connection_id=c.id AND module=p_module AND state IN ('queued','running');
 result:=public.zoho_start_discovery(p_connection,p_module,p_actor);
 SELECT * INTO STRICT r FROM public.zoho_discovery_runs WHERE id=(result->>'runId')::uuid;
 INSERT INTO public.zoho_sync_policies(connection_id,module,updated_by) VALUES(c.id,p_module,p_actor) ON CONFLICT DO NOTHING;
 IF r.id IS DISTINCT FROM existing_id AND p_bulk_available AND r.state='queued' AND r.lease_token IS NULL AND r.transport='rest' AND r.next_page=1 AND r.received_count=0 AND r.modified_since IS NULL
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

CREATE OR REPLACE FUNCTION public.zoho_due_sync(p_bulk_available boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE candidate record;
BEGIN
 -- Retire obsolete intents even when no queue delivery remains to claim them.
 -- Do not invent new authority after a mapping change: the operator starts the
 -- new configuration's first discovery through the normal reviewed UI.
 FOR candidate IN SELECT c.id FROM public.zoho_connections c WHERE EXISTS(
  SELECT 1 FROM public.zoho_discovery_runs r WHERE r.connection_id=c.id AND r.state IN ('queued','running') AND r.config_revision<>c.config_revision)
 ORDER BY c.id LIMIT 10 FOR UPDATE OF c SKIP LOCKED LOOP
  PERFORM public.zoho_retire_stale_discoveries(candidate.id);
 END LOOP;
 FOR candidate IN
 SELECT c.id,c.created_by,h.module FROM public.zoho_connections c
 CROSS JOIN LATERAL (SELECT DISTINCT ON(r.module) r.* FROM public.zoho_discovery_runs r
 WHERE r.connection_id=c.id AND r.config_revision=c.config_revision ORDER BY r.module,r.created_at DESC,r.id DESC) h
 LEFT JOIN public.zoho_sync_policies p ON p.connection_id=c.id AND p.module=h.module
 LEFT JOIN public.zoho_sync_hints hint ON hint.connection_id=c.id AND hint.module=h.module
 WHERE c.status='connected' AND coalesce(p.enabled,true) AND h.control_state='active'
 AND NOT EXISTS(SELECT 1 FROM public.zoho_bulk_read_runs b WHERE b.connection_id=c.id AND b.module=h.module
 AND b.state IN ('queued','creating','polling','staging') AND NOT EXISTS(SELECT 1 FROM public.zoho_discovery_runs x WHERE x.bulk_run_id=b.id))
 AND h.state IN ('completed','completed_with_exceptions','incomplete') AND h.next_page<=500000
 AND (h.state='incomplete' OR h.completed_at<clock_timestamp()-make_interval(mins=>coalesce(p.interval_minutes,15))
 OR (hint.received_at>h.scan_started_at AND h.completed_at<clock_timestamp()-interval '1 minute'))
 ORDER BY h.completed_at,c.id,h.module LIMIT 10 FOR UPDATE OF c SKIP LOCKED
 LOOP
  -- All start paths lock the source before inspecting active runs. Never restart
  -- a paused, failed or cancelled run; reconnect/config changes require review.
  BEGIN
   PERFORM public.zoho_plan_discovery(candidate.id,candidate.module,candidate.created_by,p_bulk_available);
  EXCEPTION WHEN serialization_failure THEN
   -- A source-local control conflict cannot roll back other source dispatches.
   CONTINUE;
  END;
 END LOOP;
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'transport',transport,'bulkRunId',bulk_run_id)),'[]') FROM(
 SELECT r.id,r.transport,r.bulk_run_id FROM public.zoho_discovery_runs r JOIN public.zoho_connections c ON c.id=r.connection_id
 LEFT JOIN public.zoho_bulk_read_runs b ON b.id=r.bulk_run_id
 WHERE r.control_state='active' AND r.state IN ('queued','running') AND r.config_revision=c.config_revision AND c.status='connected'
 AND r.next_attempt_at<=clock_timestamp() AND (
 (r.transport='rest' AND (r.lease_token IS NULL OR r.lease_expires_at<=clock_timestamp())) OR
 (r.transport='bulk' AND b.state IN ('queued','creating','polling','staging') AND NOT b.artifact_cleanup_pending
 AND b.next_attempt_at<=clock_timestamp() AND (b.lease_token IS NULL OR b.lease_expires_at<=clock_timestamp())))
 ORDER BY r.next_attempt_at,r.id LIMIT 10) due);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_control_discovery(p_connection uuid,p_run uuid,p_action text,p_reason text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; c public.zoho_connections; r public.zoho_discovery_runs;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 SELECT * INTO STRICT r FROM public.zoho_discovery_runs WHERE id=p_run FOR UPDATE;
 IF r.connection_id IS DISTINCT FROM c.id THEN RAISE EXCEPTION 'Discovery source mismatch' USING ERRCODE='40001'; END IF;
 IF p_action='cancel' AND r.config_revision<>c.config_revision AND r.state IN ('queued','running') THEN
  IF p_actor IS NULL OR length(trim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'Invalid discovery control' USING ERRCODE='22023'; END IF;
  PERFORM public.zoho_retire_stale_discoveries(c.id);
  UPDATE public.zoho_discovery_runs SET control_state='cancelled',control_changed_at=clock_timestamp() WHERE id=r.id;
  INSERT INTO public.zoho_discovery_control_audit(run_id,actor_id,action,reason_hash)
   VALUES(r.id,p_actor,'cancel',encode(sha256(convert_to(trim(p_reason),'UTF8')),'hex'));
  RETURN jsonb_build_object('runId',r.id,'controlState','cancelled','transport',r.transport,'bulkRunId',r.bulk_run_id,'nextPage',r.next_page);
 END IF;
 result:=public.zoho_control_discovery_before_sync(p_connection,p_run,p_action,p_reason,p_actor);
 UPDATE public.zoho_bulk_read_runs b SET lease_token=NULL,lease_expires_at=NULL,
  state=CASE WHEN p_action='cancel' THEN 'failed' ELSE b.state END,
  last_error=CASE WHEN p_action='cancel' THEN 'CANCELLED_BY_OPERATOR' ELSE b.last_error END,
  artifact_cleanup_pending=b.artifact_cleanup_pending OR (p_action='cancel' AND b.artifact_key IS NOT NULL)
 FROM public.zoho_discovery_runs d WHERE d.id=p_run AND d.bulk_run_id=b.id;
 RETURN result||(SELECT jsonb_build_object('transport',transport,'bulkRunId',bulk_run_id) FROM public.zoho_discovery_runs WHERE id=p_run);
END;
$$;

COMMIT;
