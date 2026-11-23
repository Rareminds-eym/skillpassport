BEGIN;

-- One live review belongs to a bounded, connection-locked staging batch.
-- No GUC, temporary table, caller-provided cache or persisted fingerprint can
-- authorize the private seven-argument path. Existing six-argument entrypoints
-- independently obtain a fresh fingerprint; execution keeps its live checks.

CREATE FUNCTION public.zoho_stage_record_before_privacy(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb,p_trigger_fingerprint text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; v public.zoho_staged_records; h text; policy public.zoho_job_publisher_policies; errors_value jsonb:=p_errors;
BEGIN
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;

  IF p_module='Job_Openings' THEN
    SELECT * INTO policy FROM public.zoho_job_publisher_policies WHERE connection_id=p_connection;
    IF FOUND AND policy.enabled AND policy.no_email_reviewed AND policy.config_revision=c.config_revision
      AND policy.trigger_fingerprint=p_trigger_fingerprint
      AND policy.status_map->>(p_data->>'source_status') IN ('open','closed','draft')
      AND policy.employment_map->>(p_data->>'employment_type') IN ('job','internship','contract') THEN
      SELECT coalesce(jsonb_agg(value),'[]'::jsonb) INTO errors_value FROM jsonb_array_elements(p_errors)
        WHERE value IS DISTINCT FROM to_jsonb('Job publication and status mapping requires review.'::text);
    ELSIF jsonb_typeof(errors_value)='array' AND NOT errors_value @> '["Job publication and status mapping requires review."]'::jsonb THEN
      errors_value:=errors_value||'["Job publication and status mapping requires review."]'::jsonb;
    END IF;
  END IF;
  IF c.status <> 'connected' THEN RAISE EXCEPTION 'Connection is not active' USING ERRCODE='22023'; END IF;
  IF p_modified IS NULL OR p_modified > now()+interval '5 minutes' OR octet_length(p_data::text)>(CASE WHEN p_module='Job_Openings' THEN 131072 ELSE 65536 END)
    OR jsonb_typeof(p_data)<>'object' OR jsonb_typeof(errors_value)<>'array' THEN
    RAISE EXCEPTION 'Invalid staged record' USING ERRCODE='22023';
  END IF;
  h:=encode(sha256(convert_to(p_data::text,'UTF8')),'hex');
  SELECT * INTO v FROM public.zoho_staged_records WHERE connection_id=p_connection AND module=p_module AND external_id=p_external_id FOR UPDATE;
  IF FOUND THEN
    IF p_modified<v.source_modified_at THEN RETURN jsonb_build_object('id',v.id,'revision',v.revision,'unchanged',true); END IF;
    IF h=v.source_hash AND c.config_revision=v.config_revision AND errors_value=v.validation_errors THEN
      UPDATE public.zoho_staged_records SET source_modified_at=greatest(source_modified_at,p_modified) WHERE id=v.id;
      RETURN jsonb_build_object('id',v.id,'revision',v.revision,'unchanged',true);
    END IF;
    UPDATE public.zoho_approved_operations SET state='approval_stale' WHERE record_id=v.id AND state IN ('queued','failed');
    IF EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE record_id=v.id AND state='processing') THEN
      RAISE EXCEPTION 'Record execution is in flight; retry staging' USING ERRCODE='40001';
    END IF;
    UPDATE public.zoho_staged_records SET source_modified_at=p_modified,source_hash=h,revision=revision+1,
      config_revision=c.config_revision,proposed_data=p_data,validation_errors=errors_value,decision='pending_approval',
      execution_state='not_approved',updated_at=now() WHERE id=v.id RETURNING * INTO v;
  ELSE
    INSERT INTO public.zoho_staged_records(connection_id,module,external_id,source_modified_at,source_hash,config_revision,proposed_data,validation_errors)
    VALUES(p_connection,p_module,p_external_id,p_modified,h,c.config_revision,p_data,errors_value) RETURNING * INTO v;
  END IF;
  RETURN jsonb_build_object('id',v.id,'revision',v.revision,'decision',v.decision);
END;
$$;

CREATE FUNCTION public.zoho_stage_record_before_retention(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb,p_trigger_fingerprint text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; v public.zoho_staged_records; result jsonb;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.status<>'connected' THEN RAISE EXCEPTION 'Connection is not active' USING ERRCODE='22023'; END IF;
 IF public.zoho_is_source_suppressed(c.id,p_module,p_external_id) THEN
   RETURN jsonb_build_object('suppressed',true,'unchanged',true);
 END IF;
 IF p_data IS NULL OR p_errors IS NULL OR jsonb_typeof(p_data) IS DISTINCT FROM 'object'
   OR jsonb_typeof(p_errors) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid staged record' USING ERRCODE='22023'; END IF;
 SELECT * INTO v FROM public.zoho_staged_records WHERE connection_id=c.id AND module=p_module AND external_id=p_external_id FOR UPDATE;
 IF v.id IS NOT NULL AND EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE record_id=v.id AND
   (state='processing' OR last_error='OUTCOME_UNKNOWN')) THEN
   RAISE EXCEPTION 'Record execution is in flight; retry staging' USING ERRCODE='40001';
 END IF;
 -- Preserve all previously installed staging behavior, including reviewed job
 -- mappings. A copied implementation here would silently remove those guards.
 result:=public.zoho_stage_record_before_privacy(p_connection,p_module,p_external_id,p_modified,p_data,p_errors,p_trigger_fingerprint);
 IF result->>'unchanged' IS DISTINCT FROM 'true' THEN
   UPDATE public.zoho_staged_records SET payload_staged_at=now(),payload_redacted_at=NULL WHERE id=(result->>'id')::uuid;
 END IF;
 RETURN result;
END;
$$;

CREATE FUNCTION public.zoho_stage_record(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb,p_trigger_fingerprint text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_staged_records;
BEGIN
 PERFORM 1 FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 SELECT * INTO r FROM public.zoho_staged_records WHERE connection_id=p_connection AND module=p_module AND external_id=p_external_id FOR UPDATE;
 IF r.id IS NOT NULL AND p_modified>=r.source_modified_at AND NOT public.zoho_review_payload_current(p_connection,r.id)
   AND NOT public.zoho_is_source_suppressed(p_connection,p_module,p_external_id)
   AND NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE record_id=r.id AND (state='processing' OR last_error='OUTCOME_UNKNOWN')) THEN
   UPDATE public.zoho_approved_operations SET state='approval_stale' WHERE record_id=r.id AND state IN ('queued','failed');
   UPDATE public.zoho_staged_records SET decision='rejected',execution_state='not_approved',
     validation_errors='["PAYLOAD_EXPIRED_REFETCH_REQUIRED"]'::jsonb WHERE id=r.id;
 END IF;
 RETURN public.zoho_stage_record_before_retention(p_connection,p_module,p_external_id,p_modified,p_data,p_errors,p_trigger_fingerprint);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_stage_record_before_privacy(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE fingerprint text;
BEGIN
 PERFORM 1 FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF p_module='Job_Openings' THEN fingerprint:=public.zoho_job_trigger_fingerprint(); END IF;
 RETURN public.zoho_stage_record_before_privacy(p_connection,p_module,p_external_id,p_modified,p_data,p_errors,fingerprint);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_stage_record_before_retention(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE fingerprint text;
BEGIN
 PERFORM 1 FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF p_module='Job_Openings' THEN fingerprint:=public.zoho_job_trigger_fingerprint(); END IF;
 RETURN public.zoho_stage_record_before_retention(p_connection,p_module,p_external_id,p_modified,p_data,p_errors,fingerprint);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_stage_record(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE fingerprint text;
BEGIN
 PERFORM 1 FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF p_module='Job_Openings' THEN fingerprint:=public.zoho_job_trigger_fingerprint(); END IF;
 RETURN public.zoho_stage_record(p_connection,p_module,p_external_id,p_modified,p_data,p_errors,fingerprint);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_commit_discovery_before_capture(p_run uuid,p_page integer,p_records jsonb,p_issues jsonb,p_more boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; c public.zoho_connections; item jsonb; d public.zoho_deferred_records;
  staged integer:=0; deferred integer:=0; count_issues integer; final_state text; why text; stage_result jsonb; fingerprint text;
BEGIN
  r:=public.zoho_lock_discovery_run(p_run);
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=r.connection_id;
  IF r.state NOT IN ('queued','running') OR r.next_page<>p_page THEN
    RETURN jsonb_build_object('runId',r.id,'done',r.state NOT IN ('queued','running'),'unchanged',true);
  END IF;
  IF c.status<>'connected' OR c.config_revision<>r.config_revision THEN RAISE EXCEPTION 'Connection changed' USING ERRCODE='40001'; END IF;
  IF p_page IS NULL OR p_more IS NULL OR jsonb_typeof(p_records) IS DISTINCT FROM 'array' OR jsonb_typeof(p_issues) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_records)+jsonb_array_length(p_issues)>2*r.page_size THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
  IF r.module='Job_Openings' AND jsonb_array_length(p_records)>0 THEN
    fingerprint:=public.zoho_job_trigger_fingerprint();
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_records) LOOP
    why:=NULL;
    SELECT * INTO d FROM public.zoho_deferred_records WHERE connection_id=c.id AND module=r.module AND external_id=item->>'externalId';
    IF FOUND AND d.state='waiting_execution' AND d.source_modified_at>(item->>'modified')::timestamptz THEN
      -- An older source delivery cannot replace a newer captured pending revision.
      deferred:=deferred+1;
      CONTINUE;
    END IF;
    BEGIN
      stage_result:=public.zoho_stage_record(c.id,r.module,item->>'externalId',(item->>'modified')::timestamptz,item->'data',item->'errors',fingerprint);
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

REVOKE ALL ON FUNCTION public.zoho_stage_record_before_privacy(uuid,text,text,timestamptz,jsonb,jsonb,text) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

REVOKE ALL ON FUNCTION public.zoho_stage_record_before_retention(uuid,text,text,timestamptz,jsonb,jsonb,text) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

REVOKE ALL ON FUNCTION public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb,text) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

COMMIT;
