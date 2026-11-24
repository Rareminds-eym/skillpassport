BEGIN;
SET LOCAL lock_timeout='5s';

-- Jobs share the existing staged discovery, approval, queue and receipt pipeline.
-- Remove runtime SQL dependency traversal, not data, grants or human approvals.
-- Existing source mappings and their configuration revisions remain authoritative.

CREATE OR REPLACE FUNCTION public.zoho_job_publisher_ready() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT NOT EXISTS(SELECT 1 FROM (VALUES('anon'),('authenticated')) browser(role)
  WHERE has_table_privilege(browser.role,'public.opportunities','INSERT,UPDATE,DELETE')
     OR has_any_column_privilege(browser.role,'public.opportunities','INSERT,UPDATE'))
 AND EXISTS(SELECT 1 FROM public.zoho_job_publisher_policies p JOIN public.zoho_connections c ON c.id=p.connection_id
  WHERE c.status='connected' AND p.enabled AND p.no_email_reviewed AND p.config_revision=c.config_revision);
$$;

CREATE OR REPLACE FUNCTION public.zoho_read_job_policy(p_connection uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE revision_value integer; policy public.zoho_job_publisher_policies;
BEGIN
 SELECT config_revision INTO STRICT revision_value FROM public.zoho_connections WHERE id=p_connection;
 SELECT * INTO policy FROM public.zoho_job_publisher_policies WHERE connection_id=p_connection;
 RETURN jsonb_build_object('connectionId',p_connection,'configRevision',revision_value,
 'policy',CASE WHEN policy.connection_id IS NULL THEN NULL ELSE jsonb_build_object('statusMap',policy.status_map,
 'employmentMap',policy.employment_map,'enabled',policy.enabled,'noEmailReviewed',policy.no_email_reviewed) END,
 'emailPolicy','forbidden');
END $$;

CREATE OR REPLACE FUNCTION public.zoho_stage_record_before_privacy(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; v public.zoho_staged_records; h text; policy public.zoho_job_publisher_policies; errors_value jsonb:=p_errors;
BEGIN
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;

  IF p_module='Job_Openings' THEN
    IF jsonb_typeof(errors_value)='array' THEN
      SELECT coalesce(jsonb_agg(value),'[]'::jsonb) INTO errors_value FROM jsonb_array_elements(errors_value)
      WHERE value IS DISTINCT FROM to_jsonb('department mapping is required.'::text);
    END IF;
    SELECT * INTO policy FROM public.zoho_job_publisher_policies WHERE connection_id=p_connection;
    IF FOUND AND policy.enabled AND policy.no_email_reviewed AND policy.config_revision=c.config_revision
      AND policy.status_map->>(p_data->>'source_status') IN ('open','closed','draft')
      AND policy.employment_map->>(p_data->>'employment_type') IN ('job','internship','contract') THEN
      SELECT coalesce(jsonb_agg(value),'[]'::jsonb) INTO errors_value FROM jsonb_array_elements(errors_value)
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

CREATE OR REPLACE FUNCTION public.zoho_stage_record_before_retention(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb)
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
 -- Keep source mappings and row-version checks in the shared staging core.
 result:=public.zoho_stage_record_before_privacy(p_connection,p_module,p_external_id,p_modified,p_data,p_errors);
 IF result->>'unchanged' IS DISTINCT FROM 'true' THEN
   UPDATE public.zoho_staged_records SET payload_staged_at=now(),payload_redacted_at=NULL WHERE id=(result->>'id')::uuid;
 END IF;
 RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_stage_record(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb) RETURNS jsonb
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
 RETURN public.zoho_stage_record_before_retention(p_connection,p_module,p_external_id,p_modified,p_data,p_errors);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_commit_discovery_before_capture(p_run uuid,p_page integer,p_records jsonb,p_issues jsonb,p_more boolean) RETURNS jsonb
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

-- Preserve the current optional-department writer, target ownership, capacity,
-- live grant, immutable source payload, postconditions and atomic receipt.
DO $migration$
DECLARE definition text;
 old_check text := ' OR policy.trigger_fingerprint<>public.zoho_job_trigger_fingerprint() OR NOT public.zoho_job_publisher_ready() THEN';
BEGIN
 definition:=pg_get_functiondef('public.zoho_apply_job_operation_effect(jsonb)'::regprocedure);
 IF position(old_check IN definition)=0 THEN RAISE EXCEPTION 'Unexpected job publisher definition'; END IF;
 definition:=replace(definition,old_check,' OR NOT public.zoho_job_publisher_ready() THEN');
 definition:=replace(definition,'Job publisher safety review unavailable','Job publication policy unavailable');
 EXECUTE definition;
END $migration$;

CREATE FUNCTION public.zoho_configure_job_policy(p_connection uuid,p_actor uuid,p_expected_config integer,p_status_map jsonb,p_employment_map jsonb,
 p_enabled boolean,p_no_email_reviewed boolean,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE revision_value integer; policy public.zoho_job_publisher_policies; item record;
BEGIN
 IF p_actor IS NULL OR p_enabled IS NULL OR p_no_email_reviewed IS NULL OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500
 OR jsonb_typeof(p_status_map) IS DISTINCT FROM 'object' OR jsonb_typeof(p_employment_map) IS DISTINCT FROM 'object'
 OR octet_length(p_status_map::text)>8192 OR octet_length(p_employment_map::text)>8192 THEN RAISE EXCEPTION 'Invalid publisher policy'; END IF;
 IF (SELECT count(*) FROM jsonb_object_keys(p_status_map)) NOT BETWEEN 1 AND 50
 OR (SELECT count(*) FROM jsonb_object_keys(p_employment_map)) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid publisher mappings'; END IF;
 FOR item IN SELECT key,value FROM jsonb_each(p_status_map) LOOP
  IF length(trim(item.key)) NOT BETWEEN 1 AND 100 OR jsonb_typeof(item.value)<>'string' OR item.value#>>'{}' NOT IN ('open','closed','draft') THEN
   RAISE EXCEPTION 'Invalid publisher status mapping'; END IF;
 END LOOP;
 FOR item IN SELECT key,value FROM jsonb_each(p_employment_map) LOOP
  IF length(trim(item.key)) NOT BETWEEN 1 AND 100 OR jsonb_typeof(item.value)<>'string' OR item.value#>>'{}' NOT IN ('job','internship','contract') THEN
   RAISE EXCEPTION 'Invalid publisher employment mapping'; END IF;
 END LOOP;
 SELECT config_revision INTO STRICT revision_value FROM public.zoho_connections WHERE id=p_connection AND status='connected' FOR UPDATE;
 IF revision_value IS DISTINCT FROM p_expected_config THEN
  RAISE EXCEPTION 'Reviewed publisher context changed' USING ERRCODE='40001'; END IF;
 IF p_enabled AND NOT p_no_email_reviewed THEN RAISE EXCEPTION 'No-email review required'; END IF;
 IF EXISTS(SELECT 1 FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id
 WHERE r.connection_id=p_connection AND o.state='processing') THEN RAISE EXCEPTION 'Reconcile in-flight operations before policy changes' USING ERRCODE='40001'; END IF;
 IF EXISTS(SELECT 1 FROM public.zoho_job_publisher_policies WHERE connection_id=p_connection) THEN
  UPDATE public.zoho_job_publisher_policies SET status_map=p_status_map,employment_map=p_employment_map,enabled=p_enabled,
   no_email_reviewed=p_no_email_reviewed WHERE connection_id=p_connection RETURNING * INTO policy;
 ELSE
  INSERT INTO public.zoho_job_publisher_policies(connection_id,config_revision,status_map,employment_map,enabled,no_email_reviewed)
  VALUES(p_connection,revision_value,p_status_map,p_employment_map,p_enabled,p_no_email_reviewed) RETURNING * INTO policy;
 END IF;
 INSERT INTO public.zoho_job_policy_audit(connection_id,actor_id,config_revision,reason,policy)
 VALUES(p_connection,p_actor,policy.config_revision,trim(p_reason),jsonb_build_object('statusMap',policy.status_map,'employmentMap',policy.employment_map,
 'enabled',policy.enabled,'noEmailReviewed',policy.no_email_reviewed));
 RETURN jsonb_build_object('connectionId',p_connection,'configRevision',policy.config_revision,'requiresRediscovery',true,'emailPolicy','forbidden');
END $$;

DROP FUNCTION public.zoho_configure_job_policy(uuid,uuid,integer,jsonb,jsonb,boolean,boolean,text,text);
ALTER TABLE public.zoho_job_publisher_policies DROP COLUMN trigger_fingerprint;

REVOKE ALL ON FUNCTION public.zoho_configure_job_policy(uuid,uuid,integer,jsonb,jsonb,boolean,boolean,text) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_configure_job_policy(uuid,uuid,integer,jsonb,jsonb,boolean,boolean,text) TO service_role;

DROP FUNCTION public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb,text);
DROP FUNCTION public.zoho_stage_record_before_retention(uuid,text,text,timestamptz,jsonb,jsonb,text);
DROP FUNCTION public.zoho_stage_record_before_privacy(uuid,text,text,timestamptz,jsonb,jsonb,text);
DROP FUNCTION public.zoho_job_surface_page(uuid,text,integer);
DROP FUNCTION public.zoho_job_trigger_fingerprint();
DROP FUNCTION public.zoho_job_executable_surface();
DROP FUNCTION public.zoho_job_dependency_objects();
DROP FUNCTION public.zoho_job_body_references(oid);
DROP FUNCTION public.zoho_job_write_targets(oid);
DROP FUNCTION public.zoho_job_write_targets(text[]);
DROP FUNCTION public.zoho_job_has_dynamic_sql(text);
DROP FUNCTION public.zoho_job_sql_tokens(text);

NOTIFY pgrst,'reload schema';
COMMIT;
