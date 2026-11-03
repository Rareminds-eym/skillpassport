BEGIN;

-- Saved records only; source absence never implies deletion. Writes remain
-- staging-only, with separate explicit human approval for destination mutations.
ALTER TABLE public.zoho_discovery_runs
 ADD COLUMN modified_since timestamptz,
 ADD COLUMN scan_started_at timestamptz,
 ADD COLUMN scan_had_exceptions boolean NOT NULL DEFAULT false;
ALTER TABLE public.zoho_discovery_runs ALTER COLUMN scan_started_at SET DEFAULT now();
CREATE INDEX zoho_discovery_recent_module ON public.zoho_discovery_runs(connection_id,module,created_at DESC);

-- Advance only from a clean completed scan, using scan START minus ten minutes
-- to replay timestamp boundaries/provider delay. Daily full scans reconcile drift.
CREATE OR REPLACE FUNCTION public.zoho_start_discovery(p_connection uuid,p_module text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; r public.zoho_discovery_runs; previous public.zoho_discovery_runs;
 watermark timestamptz; last_full timestamptz; checkpoint integer:=1; had_exceptions boolean:=false; scan_start timestamptz:=clock_timestamp();
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
   checkpoint:=previous.next_page; watermark:=previous.modified_since; scan_start:=coalesce(previous.scan_started_at,previous.created_at);
   had_exceptions:=previous.scan_had_exceptions OR previous.deferred_count>0 OR jsonb_array_length(previous.issues)>0;
  ELSE
   SELECT max(scan_started_at) INTO last_full FROM public.zoho_discovery_runs WHERE connection_id=c.id AND module=p_module
    AND config_revision=c.config_revision AND state='completed' AND modified_since IS NULL;
   IF last_full>clock_timestamp()-interval '24 hours' THEN
    SELECT max(scan_started_at)-interval '10 minutes' INTO watermark FROM public.zoho_discovery_runs
     WHERE connection_id=c.id AND module=p_module AND config_revision=c.config_revision AND state='completed';
   END IF;
  END IF;
  INSERT INTO public.zoho_discovery_runs(connection_id,config_revision,module,actor_id,next_page,modified_since,scan_started_at,scan_had_exceptions,created_at)
   VALUES(c.id,c.config_revision,p_module,p_actor,checkpoint,watermark,scan_start,had_exceptions,clock_timestamp()) RETURNING * INTO r;
 END IF;
 RETURN jsonb_build_object('runId',r.id,'state',r.state,'emailPolicy','forbidden',
  'mode',CASE WHEN r.modified_since IS NULL THEN 'reconciliation' ELSE 'incremental' END,'nextPage',r.next_page);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_claim_discovery(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; c public.zoho_connections; envelope jsonb; token uuid;
BEGIN
  r:=public.zoho_lock_discovery_run(p_run);
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=r.connection_id;
  IF r.state NOT IN ('queued','running') OR r.next_attempt_at>clock_timestamp()
    OR r.lease_expires_at>clock_timestamp() THEN RETURN jsonb_build_object('claimed',false); END IF;
  IF r.lease_token IS NOT NULL THEN
    r.failure_count:=least(8,r.failure_count+1);
    UPDATE public.zoho_discovery_runs SET failure_count=r.failure_count,last_error='WORKER_LOST' WHERE id=r.id;
  END IF;
  IF r.failure_count>=8 OR r.budget_expires_at<=clock_timestamp() OR r.next_page>500000 THEN
    UPDATE public.zoho_discovery_runs SET state='failed',last_error='BUDGET_EXHAUSTED',lease_token=NULL,lease_expires_at=NULL WHERE id=r.id;
    RETURN jsonb_build_object('claimed',false);
  END IF;
  IF c.status<>'connected' OR c.config_revision<>r.config_revision THEN
    UPDATE public.zoho_discovery_runs SET state='failed',last_error='CONNECTION_CHANGED' WHERE id=r.id;
    RETURN jsonb_build_object('claimed',false);
  END IF;
  SELECT s.envelope INTO envelope FROM public.zoho_connection_secrets s WHERE s.connection_id=c.id;
  IF envelope IS NULL THEN
    UPDATE public.zoho_discovery_runs SET state='failed',last_error='CREDENTIALS_UNAVAILABLE' WHERE id=r.id;
    RETURN jsonb_build_object('claimed',false);
  END IF;
  token:=gen_random_uuid();
  UPDATE public.zoho_discovery_runs SET state='running',lease_token=token,lease_expires_at=clock_timestamp()+interval '3 minutes',
    lease_page=next_page,lease_credential_generation=c.credential_generation WHERE id=r.id;
  RETURN jsonb_build_object('claimed',true,'lease',token,
    'run',jsonb_build_object('id',r.id,'module',r.module,'next_page',r.next_page,'config_revision',r.config_revision,'modified_since',r.modified_since),
    'source',jsonb_build_object('id',c.id,'region',c.region,'credential_generation',c.credential_generation),
    'envelope',envelope);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_commit_discovery_page(p_run uuid,p_page integer,p_records jsonb,p_issues jsonb,p_more boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; c public.zoho_connections; item jsonb; d public.zoho_deferred_records;
  staged integer:=0; deferred integer:=0; count_issues integer; final_state text; why text; stage_result jsonb;
BEGIN
  r:=public.zoho_lock_discovery_run(p_run);
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=r.connection_id;
  IF r.state NOT IN ('queued','running') OR r.next_page<>p_page THEN
    RETURN jsonb_build_object('runId',r.id,'done',r.state NOT IN ('queued','running'),'unchanged',true);
  END IF;
  IF c.status<>'connected' OR c.config_revision<>r.config_revision THEN RAISE EXCEPTION 'Connection changed' USING ERRCODE='40001'; END IF;
  IF p_page IS NULL OR p_more IS NULL OR jsonb_typeof(p_records) IS DISTINCT FROM 'array' OR jsonb_typeof(p_issues) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_records)+jsonb_array_length(p_issues)>20 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_records) LOOP
    why:=NULL;
    SELECT * INTO d FROM public.zoho_deferred_records WHERE connection_id=c.id AND module=r.module AND external_id=item->>'externalId';
    IF FOUND AND d.state='waiting_execution' AND d.source_modified_at>(item->>'modified')::timestamptz THEN
      -- An older source delivery cannot replace a newer captured pending revision.
      deferred:=deferred+1;
      CONTINUE;
    END IF;
    BEGIN
      stage_result:=public.zoho_stage_record(c.id,r.module,item->>'externalId',(item->>'modified')::timestamptz,item->'data',item->'errors');
    EXCEPTION
      WHEN serialization_failure THEN
        IF NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations o JOIN public.zoho_staged_records s ON s.id=o.record_id
          WHERE s.connection_id=c.id AND s.module=r.module AND s.external_id=item->>'externalId' AND o.state='processing') THEN RAISE; END IF;
        why:='EXECUTION_IN_FLIGHT';
      WHEN invalid_parameter_value OR check_violation OR string_data_right_truncation THEN why:='SOURCE_INVALID';
    END;
    IF why IS NULL THEN
      IF stage_result->>'suppressed' IS DISTINCT FROM 'true' THEN staged:=staged+1; END IF;
      UPDATE public.zoho_deferred_records SET state='staged',reason='STAGED',proposed_data=NULL,validation_errors=NULL,updated_at=now()
        WHERE connection_id=c.id AND module=r.module AND external_id=item->>'externalId';
    ELSE
      INSERT INTO public.zoho_deferred_records(connection_id,run_id,module,external_id,source_modified_at,config_revision,
        proposed_data,validation_errors,state,reason,next_attempt_at,expires_at)
      VALUES(c.id,r.id,r.module,item->>'externalId',(item->>'modified')::timestamptz,c.config_revision,item->'data',item->'errors',
        CASE WHEN why='EXECUTION_IN_FLIGHT' THEN 'waiting_execution' ELSE 'blocked_invalid' END,why,now()+interval '2 minutes',now()+interval '30 days')
      ON CONFLICT(connection_id,module,external_id) DO UPDATE SET run_id=excluded.run_id,source_modified_at=excluded.source_modified_at,
        config_revision=excluded.config_revision,proposed_data=excluded.proposed_data,validation_errors=excluded.validation_errors,
        state=excluded.state,reason=excluded.reason,next_attempt_at=excluded.next_attempt_at,expires_at=excluded.expires_at,updated_at=now();
      deferred:=deferred+1;
    END IF;
  END LOOP;
  count_issues:=jsonb_array_length(r.issues)+jsonb_array_length(p_issues)+r.deferred_count+deferred+CASE WHEN r.scan_had_exceptions THEN 1 ELSE 0 END;
  final_state:=CASE WHEN p_more AND p_page%500=0 THEN 'incomplete' WHEN p_more THEN 'running'
    WHEN count_issues>0 THEN 'completed_with_exceptions' ELSE 'completed' END;
  UPDATE public.zoho_discovery_runs SET state=final_state,next_page=next_page+1,next_attempt_at=now(),last_error=CASE WHEN final_state='incomplete' THEN
    CASE WHEN p_page>=500000 THEN 'INVENTORY_LIMIT' ELSE 'CHECKPOINT_AVAILABLE' END ELSE NULL END,
    received_count=received_count+jsonb_array_length(p_records)+jsonb_array_length(p_issues),staged_count=staged_count+staged,
    deferred_count=deferred_count+deferred,issues=issues||p_issues,completed_at=CASE WHEN final_state<>'running' THEN now() ELSE NULL END WHERE id=r.id;
  IF final_state IN ('completed','completed_with_exceptions') THEN
    UPDATE public.zoho_connections SET last_discovered_at=now() WHERE id=c.id;
  END IF;
  RETURN jsonb_build_object('runId',r.id,'done',final_state<>'running','state',final_state,'deferred',deferred);
END;
$$;

-- Schedule only modules already inventoried by an administrator. Existing
-- connection pause/global discovery flag stop this. Failed runs need review.
CREATE OR REPLACE FUNCTION public.zoho_due_discovery() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE candidate record;
BEGIN
 FOR candidate IN
  SELECT c.id,c.created_by,h.module FROM public.zoho_connections c
  CROSS JOIN LATERAL (SELECT DISTINCT ON (r.module) r.module,r.state,r.completed_at,r.next_page
   FROM public.zoho_discovery_runs r WHERE r.connection_id=c.id AND r.config_revision=c.config_revision
   ORDER BY r.module,r.created_at DESC,r.id DESC) h
  WHERE c.status='connected' AND h.state IN ('completed','completed_with_exceptions','incomplete')
   AND h.completed_at<clock_timestamp()-interval '15 minutes' AND h.next_page<=500000
  ORDER BY h.completed_at,c.id,h.module LIMIT 10
 LOOP
  PERFORM public.zoho_start_discovery(candidate.id,candidate.module,candidate.created_by);
 END LOOP;
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id)),'[]'::jsonb) FROM (
  SELECT id FROM public.zoho_discovery_runs WHERE state IN ('queued','running') AND next_attempt_at<=now()
   AND (lease_token IS NULL OR lease_expires_at<=now()) ORDER BY next_attempt_at,id LIMIT 10
 ) due);
END;
$$;

REVOKE ALL ON FUNCTION public.zoho_start_discovery(uuid,text,uuid),public.zoho_claim_discovery(uuid),public.zoho_due_discovery()
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_start_discovery(uuid,text,uuid),public.zoho_claim_discovery(uuid),public.zoho_due_discovery() TO service_role;
GRANT EXECUTE ON FUNCTION public.zoho_claim_discovery(uuid),public.zoho_due_discovery() TO zoho_discovery;

COMMIT;
