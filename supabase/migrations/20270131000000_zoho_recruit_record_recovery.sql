BEGIN;

-- Private source snapshots only. No identity, subscription or opportunity writes.
ALTER TABLE public.zoho_discovery_runs ADD COLUMN deferred_count integer NOT NULL DEFAULT 0 CHECK(deferred_count>=0);
CREATE TABLE public.zoho_deferred_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
  run_id uuid NOT NULL REFERENCES public.zoho_discovery_runs(id),
  module text NOT NULL CHECK(module IN ('Candidates','Job_Openings')),
  external_id text NOT NULL CHECK(external_id ~ '^[0-9]{1,40}$'),
  source_modified_at timestamptz NOT NULL,
  config_revision integer NOT NULL,
  proposed_data jsonb CHECK(proposed_data IS NULL OR (jsonb_typeof(proposed_data)='object' AND octet_length(proposed_data::text)<=262144)),
  validation_errors jsonb CHECK(validation_errors IS NULL OR jsonb_typeof(validation_errors)='array'),
  state text NOT NULL CHECK(state IN ('waiting_execution','blocked_invalid','staged','superseded')),
  reason text NOT NULL CHECK(reason IN ('EXECUTION_IN_FLIGHT','SOURCE_INVALID','REFETCH_REQUIRED','STAGED','SUPERSEDED')),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now()+interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(state<>'waiting_execution' OR (proposed_data IS NOT NULL AND validation_errors IS NOT NULL)),
  UNIQUE(connection_id,module,external_id)
);
CREATE INDEX zoho_deferred_due ON public.zoho_deferred_records(next_attempt_at,id) WHERE state='waiting_execution';
CREATE INDEX zoho_deferred_source ON public.zoho_deferred_records(connection_id,updated_at DESC,id DESC) WHERE state IN ('waiting_execution','blocked_invalid');
CREATE INDEX zoho_deferred_expiry ON public.zoho_deferred_records(expires_at,id) WHERE proposed_data IS NOT NULL AND state IN ('waiting_execution','blocked_invalid');
REVOKE ALL ON public.zoho_deferred_records FROM PUBLIC,anon,authenticated,zoho_discovery,service_role;
GRANT SELECT ON public.zoho_deferred_records TO service_role;

-- A page commits each successful stage or durable deferral together with its cursor.
-- The processing guard in zoho_stage_record is intentionally preserved.
CREATE OR REPLACE FUNCTION public.zoho_commit_discovery_page(p_run uuid,p_page integer,p_records jsonb,p_issues jsonb,p_more boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; c public.zoho_connections; item jsonb; d public.zoho_deferred_records;
  staged integer:=0; deferred integer:=0; count_issues integer; final_state text; why text;
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
      PERFORM public.zoho_stage_record(c.id,r.module,item->>'externalId',(item->>'modified')::timestamptz,item->'data',item->'errors');
    EXCEPTION
      WHEN serialization_failure THEN
        IF NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations o JOIN public.zoho_staged_records s ON s.id=o.record_id
          WHERE s.connection_id=c.id AND s.module=r.module AND s.external_id=item->>'externalId' AND o.state='processing') THEN RAISE; END IF;
        why:='EXECUTION_IN_FLIGHT';
      WHEN invalid_parameter_value OR check_violation OR string_data_right_truncation THEN why:='SOURCE_INVALID';
    END;
    IF why IS NULL THEN
      staged:=staged+1;
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
  count_issues:=jsonb_array_length(r.issues)+jsonb_array_length(p_issues)+r.deferred_count+deferred;
  final_state:=CASE WHEN p_more AND p_page>=500 THEN 'incomplete' WHEN p_more THEN 'running'
    WHEN count_issues>0 THEN 'completed_with_exceptions' ELSE 'completed' END;
  UPDATE public.zoho_discovery_runs SET state=final_state,next_page=next_page+1,next_attempt_at=now(),last_error=NULL,
    received_count=received_count+jsonb_array_length(p_records)+jsonb_array_length(p_issues),staged_count=staged_count+staged,
    deferred_count=deferred_count+deferred,issues=issues||p_issues,completed_at=CASE WHEN final_state<>'running' THEN now() ELSE NULL END WHERE id=r.id;
  IF final_state IN ('completed','completed_with_exceptions') THEN
    UPDATE public.zoho_connections SET last_discovered_at=now() WHERE id=c.id;
  END IF;
  RETURN jsonb_build_object('runId',r.id,'done',final_state<>'running','state',final_state,'deferred',deferred);
END;
$$;

CREATE FUNCTION public.zoho_recover_deferred() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE candidate record; d public.zoho_deferred_records; c public.zoho_connections; result jsonb; recovered integer:=0;
BEGIN
  FOR candidate IN SELECT id,connection_id FROM public.zoho_deferred_records
    WHERE state IN ('waiting_execution','blocked_invalid') AND
      ((state='waiting_execution' AND next_attempt_at<=now()) OR (proposed_data IS NOT NULL AND expires_at<=now()))
    ORDER BY next_attempt_at,id LIMIT 20 LOOP
    -- Connection first, then snapshot, staged record and operation, consistently.
    SELECT * INTO c FROM public.zoho_connections WHERE id=candidate.connection_id FOR UPDATE SKIP LOCKED;
    IF NOT FOUND THEN CONTINUE; END IF;
    SELECT * INTO d FROM public.zoho_deferred_records WHERE id=candidate.id FOR UPDATE SKIP LOCKED;
    IF NOT FOUND OR d.state NOT IN ('waiting_execution','blocked_invalid') THEN CONTINUE; END IF;
    IF d.expires_at<=now() OR d.config_revision<>c.config_revision THEN
      UPDATE public.zoho_deferred_records SET state='blocked_invalid',reason='REFETCH_REQUIRED',
        proposed_data=NULL,validation_errors=NULL,updated_at=now() WHERE id=d.id;
      CONTINUE;
    END IF;
    IF d.state='blocked_invalid' THEN CONTINUE; END IF;
    IF c.status<>'connected' THEN
      UPDATE public.zoho_deferred_records SET next_attempt_at=now()+interval '2 minutes' WHERE id=d.id;
      CONTINUE;
    END IF;
    BEGIN
      result:=public.zoho_stage_record(c.id,d.module,d.external_id,d.source_modified_at,d.proposed_data,d.validation_errors);
      UPDATE public.zoho_deferred_records SET state=CASE WHEN result->>'unchanged'='true' THEN 'superseded' ELSE 'staged' END,
        reason=CASE WHEN result->>'unchanged'='true' THEN 'SUPERSEDED' ELSE 'STAGED' END,
        proposed_data=NULL,validation_errors=NULL,updated_at=now() WHERE id=d.id;
      recovered:=recovered+1;
    EXCEPTION
      WHEN serialization_failure THEN
        UPDATE public.zoho_deferred_records SET next_attempt_at=now()+interval '2 minutes' WHERE id=d.id;
      WHEN invalid_parameter_value OR check_violation OR string_data_right_truncation THEN
        UPDATE public.zoho_deferred_records SET state='blocked_invalid',reason='SOURCE_INVALID',updated_at=now() WHERE id=d.id;
    END;
  END LOOP;
  RETURN jsonb_build_object('recovered',recovered);
END;
$$;

ALTER TABLE public.zoho_connection_secrets ADD COLUMN refresh_lease uuid,ADD COLUMN refresh_run uuid,
  ADD COLUMN refresh_expires_at timestamptz;

CREATE FUNCTION public.zoho_begin_discovery_refresh(p_run uuid,p_lease uuid,p_expected jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; s public.zoho_connection_secrets;
BEGIN
  r:=public.zoho_verify_discovery_lease(p_run,p_lease);
  SELECT * INTO STRICT s FROM public.zoho_connection_secrets WHERE connection_id=r.connection_id FOR UPDATE;
  IF s.envelope IS DISTINCT FROM p_expected THEN
    RETURN jsonb_build_object('acquired',false,'changed',true,'envelope',s.envelope);
  END IF;
  IF s.refresh_lease IS NOT NULL AND s.refresh_expires_at>clock_timestamp() THEN
    RETURN jsonb_build_object('acquired',false,'changed',false);
  END IF;
  UPDATE public.zoho_connection_secrets SET refresh_lease=p_lease,refresh_run=r.id,
    refresh_expires_at=least(r.lease_expires_at,clock_timestamp()+interval '45 seconds') WHERE connection_id=r.connection_id;
  RETURN jsonb_build_object('acquired',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_refresh_discovery_tokens(p_run uuid,p_lease uuid,p_envelope jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
  r:=public.zoho_verify_discovery_lease(p_run,p_lease);
  IF p_envelope->>'version' IS DISTINCT FROM '1' OR coalesce(p_envelope->>'iv','') !~ '^[A-Za-z0-9+/]{16}$'
    OR (length(coalesce(p_envelope->>'ciphertext','')) NOT BETWEEN 24 AND 32768 OR coalesce(p_envelope->>'ciphertext','') !~ '^[A-Za-z0-9+/=]+$') THEN
    RAISE EXCEPTION 'Invalid token envelope' USING ERRCODE='22023';
  END IF;
  UPDATE public.zoho_connection_secrets SET envelope=p_envelope,updated_at=now(),refresh_lease=NULL,refresh_run=NULL,refresh_expires_at=NULL
    WHERE connection_id=r.connection_id AND refresh_lease=p_lease AND refresh_run=p_run AND refresh_expires_at>clock_timestamp();
  IF NOT FOUND THEN RAISE EXCEPTION 'Refresh lease changed' USING ERRCODE='40001'; END IF;
  RETURN jsonb_build_object('refreshed',true);
END;
$$;

CREATE FUNCTION public.zoho_release_discovery_refresh() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  UPDATE public.zoho_connection_secrets SET refresh_lease=NULL,refresh_run=NULL,refresh_expires_at=NULL
    WHERE connection_id=OLD.connection_id AND refresh_run=OLD.id AND refresh_lease=OLD.lease_token;
  RETURN NEW;
END;
$$;
CREATE TRIGGER zoho_release_discovery_refresh AFTER UPDATE OF lease_token ON public.zoho_discovery_runs
FOR EACH ROW WHEN(OLD.lease_token IS NOT NULL AND OLD.lease_token IS DISTINCT FROM NEW.lease_token)
EXECUTE FUNCTION public.zoho_release_discovery_refresh();

REVOKE ALL ON FUNCTION public.zoho_recover_deferred(),public.zoho_begin_discovery_refresh(uuid,uuid,jsonb),public.zoho_release_discovery_refresh()
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_recover_deferred(),public.zoho_begin_discovery_refresh(uuid,uuid,jsonb)
  TO service_role,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_release_discovery_refresh() TO service_role;
COMMIT;
