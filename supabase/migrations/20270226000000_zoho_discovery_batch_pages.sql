BEGIN;

-- Persist pagination geometry: existing/resumed scans retain their original offset.
ALTER TABLE public.zoho_discovery_runs ADD COLUMN page_size integer NOT NULL DEFAULT 10
 CHECK(page_size BETWEEN 1 AND 200);

CREATE OR REPLACE FUNCTION public.zoho_start_discovery_before_controls(p_connection uuid,p_module text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; r public.zoho_discovery_runs; previous public.zoho_discovery_runs;
 watermark timestamptz; last_full timestamptz; checkpoint integer:=1; saved_page_size integer:=10; had_exceptions boolean:=false; scan_start timestamptz:=clock_timestamp();
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
   saved_page_size:=previous.page_size; checkpoint:=previous.next_page; watermark:=previous.modified_since; scan_start:=coalesce(previous.scan_started_at,previous.created_at);
   had_exceptions:=previous.scan_had_exceptions OR previous.deferred_count>0 OR jsonb_array_length(previous.issues)>0;
  ELSE
   SELECT max(scan_started_at) INTO last_full FROM public.zoho_discovery_runs WHERE connection_id=c.id AND module=p_module
    AND config_revision=c.config_revision AND state='completed' AND modified_since IS NULL;
   IF last_full>clock_timestamp()-interval '24 hours' THEN
    SELECT max(scan_started_at)-interval '10 minutes' INTO watermark FROM public.zoho_discovery_runs
     WHERE connection_id=c.id AND module=p_module AND config_revision=c.config_revision AND state='completed';
   END IF;
  END IF;
  INSERT INTO public.zoho_discovery_runs(connection_id,config_revision,module,actor_id,next_page,modified_since,scan_started_at,scan_had_exceptions,created_at,page_size)
   VALUES(c.id,c.config_revision,p_module,p_actor,checkpoint,watermark,scan_start,had_exceptions,clock_timestamp(),saved_page_size) RETURNING * INTO r;
 END IF;
 RETURN jsonb_build_object('runId',r.id,'state',r.state,'emailPolicy','forbidden',
  'mode',CASE WHEN r.modified_since IS NULL THEN 'reconciliation' ELSE 'incremental' END,'nextPage',r.next_page);
END;
$$;


-- Old workers cannot consume a run that opted into larger pages. The new private
-- claim opts in only before the first committed page, under the existing run lock.
ALTER FUNCTION public.zoho_claim_discovery(uuid) RENAME TO zoho_claim_discovery_before_batching;
CREATE FUNCTION public.zoho_claim_discovery(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
 r:=public.zoho_lock_discovery_run(p_run);
 IF r.page_size<>10 THEN RETURN jsonb_build_object('claimed',false); END IF;
 RETURN public.zoho_claim_discovery_before_batching(p_run);
END;
$$;
CREATE FUNCTION public.zoho_claim_discovery_batch(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; result jsonb; size integer;
BEGIN
 r:=public.zoho_lock_discovery_run(p_run);
 result:=public.zoho_claim_discovery_before_batching(p_run);
 IF result->>'claimed' IS DISTINCT FROM 'true' THEN RETURN result; END IF;
 size:=r.page_size;
 IF r.next_page=1 AND r.received_count=0 THEN
  -- Job descriptions are large. Bound their page memory independently of candidates.
  size:=CASE r.module WHEN 'Candidates' THEN 200 ELSE 20 END;
  UPDATE public.zoho_discovery_runs SET page_size=size WHERE id=r.id;
 END IF;
 RETURN jsonb_set(result,'{run,page_size}',to_jsonb(size));
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
    OR jsonb_array_length(p_records)+jsonb_array_length(p_issues)>2*r.page_size THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
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


REVOKE ALL ON FUNCTION public.zoho_claim_discovery_before_batching(uuid) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
REVOKE ALL ON FUNCTION public.zoho_start_discovery_before_controls(uuid,text,uuid) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
REVOKE ALL ON FUNCTION public.zoho_claim_discovery_batch(uuid),public.zoho_claim_discovery(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_claim_discovery_batch(uuid),public.zoho_claim_discovery(uuid) TO service_role,zoho_discovery;

COMMIT;
