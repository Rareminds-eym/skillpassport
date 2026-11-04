BEGIN;
ALTER TABLE public.zoho_approved_operations ADD COLUMN payload_captured_at timestamptz;
CREATE INDEX zoho_operation_payload_retention ON public.zoho_approved_operations(payload_captured_at,created_at,id)
 WHERE state<>'processing' AND approved_data<>'{}'::jsonb;

CREATE FUNCTION public.zoho_stamp_approved_payload() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 SELECT payload_staged_at INTO STRICT NEW.payload_captured_at FROM public.zoho_staged_records
   WHERE id=NEW.record_id AND revision=NEW.record_revision;
 RETURN NEW;
END;
$$;
CREATE TRIGGER zoho_approved_payload_stamp BEFORE INSERT ON public.zoho_approved_operations
 FOR EACH ROW EXECUTE FUNCTION public.zoho_stamp_approved_payload();
REVOKE ALL ON FUNCTION public.zoho_stamp_approved_payload() FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

CREATE FUNCTION public.zoho_review_payload_current(p_connection uuid,p_record uuid) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS(SELECT 1 FROM public.zoho_staged_records r JOIN public.zoho_connections c ON c.id=r.connection_id
   WHERE r.id=p_record AND c.id=p_connection AND r.payload_redacted_at IS NULL
     AND r.payload_staged_at+make_interval(days=>c.retention_days)>clock_timestamp());
$$;

CREATE OR REPLACE FUNCTION public.zoho_guard_private_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE days integer;
BEGIN
 IF NEW.decision IN ('approved','processing') THEN
   SELECT retention_days INTO STRICT days FROM public.zoho_connections WHERE id=NEW.connection_id;
   IF NEW.payload_redacted_at IS NOT NULL OR NEW.payload_staged_at+make_interval(days=>days)<=clock_timestamp()
     OR public.zoho_is_source_suppressed(NEW.connection_id,NEW.module,NEW.external_id) THEN
     RAISE EXCEPTION 'Source requires a fresh permitted review' USING ERRCODE='22023'; END IF;
 END IF;
 RETURN NEW;
END;
$$;

ALTER FUNCTION public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid) RENAME TO zoho_decide_records_before_retention;
CREATE FUNCTION public.zoho_decide_records(p_connection uuid,p_items jsonb,p_decision text,p_reason text,p_request uuid,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item jsonb;
BEGIN
 PERFORM 1 FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 -- Exact replay remains a read of the original decision, never a new approval.
 IF p_decision='approve' AND NOT EXISTS(SELECT 1 FROM public.zoho_approval_batches WHERE connection_id=p_connection AND request_id=p_request) THEN
   IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid selection' USING ERRCODE='22023'; END IF;
   FOR item IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'id' LOOP
     PERFORM 1 FROM public.zoho_staged_records WHERE id=(item->>'id')::uuid AND connection_id=p_connection FOR UPDATE;
     IF NOT public.zoho_review_payload_current(p_connection,(item->>'id')::uuid) THEN
       RAISE EXCEPTION 'Source payload expired; refetch required' USING ERRCODE='22023'; END IF;
   END LOOP;
 END IF;
 RETURN public.zoho_decide_records_before_retention(p_connection,p_items,p_decision,p_reason,p_request,p_actor);
END;
$$;

-- A genuine fresh fetch of identical content still needs a new review after TTL.
ALTER FUNCTION public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb) RENAME TO zoho_stage_record_before_retention;
CREATE FUNCTION public.zoho_stage_record(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb) RETURNS jsonb
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

ALTER FUNCTION public.zoho_claim_operation(uuid,uuid) RENAME TO zoho_claim_operation_before_retention;
CREATE FUNCTION public.zoho_claim_operation(p_operation uuid,p_lease uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE o public.zoho_approved_operations; r public.zoho_staged_records; result jsonb; deadline timestamptz;
BEGIN
 o:=public.zoho_lock_operation(p_operation);
 SELECT * INTO STRICT r FROM public.zoho_staged_records WHERE id=o.record_id;
 IF NOT public.zoho_review_payload_current(r.connection_id,r.id) THEN
   IF o.state='processing' OR o.last_error='OUTCOME_UNKNOWN' THEN
     RETURN jsonb_build_object('claimed',false,'reason','IN_FLIGHT_OR_RECONCILIATION_REQUIRED'); END IF;
   IF o.state IN ('queued','failed') THEN
     UPDATE public.zoho_approved_operations SET state='approval_stale' WHERE id=o.id;
     IF r.revision=o.record_revision THEN
       UPDATE public.zoho_staged_records SET revision=revision+1,decision='rejected',execution_state='not_approved',
         validation_errors='["PAYLOAD_EXPIRED_REFETCH_REQUIRED"]'::jsonb WHERE id=r.id;
     END IF;
   END IF;
   RETURN jsonb_build_object('claimed',false,'reason','PAYLOAD_EXPIRED');
 END IF;
 result:=public.zoho_claim_operation_before_retention(p_operation,p_lease);
 IF result->>'claimed'='true' THEN
   SELECT least(o2.lease_expires_at,r.payload_staged_at+make_interval(days=>c.retention_days)) INTO deadline
     FROM public.zoho_approved_operations o2 JOIN public.zoho_connections c ON c.id=r.connection_id WHERE o2.id=o.id;
   IF deadline<=clock_timestamp() THEN RAISE EXCEPTION 'Source payload expired' USING ERRCODE='22023'; END IF;
   UPDATE public.zoho_approved_operations SET lease_expires_at=deadline WHERE id=o.id;
   UPDATE public.zoho_execution_attempts SET lease_expires_at=deadline WHERE id=p_lease AND operation_id=o.id;
   result:=jsonb_set(result,'{leaseExpiresAt}',to_jsonb(deadline));
 END IF;
 RETURN result;
END;
$$;

ALTER FUNCTION public.zoho_is_live_approved_operation(jsonb) RENAME TO zoho_is_live_approved_operation_before_retention;
CREATE FUNCTION public.zoho_is_live_approved_operation(p_grant jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT public.zoho_review_payload_current((p_grant->>'connectionId')::uuid,(p_grant->>'recordId')::uuid) THEN RETURN false; END IF;
 RETURN public.zoho_is_live_approved_operation_before_retention(p_grant);
EXCEPTION WHEN invalid_text_representation THEN RETURN false;
END;
$$;

ALTER TABLE public.zoho_privacy_audit DROP CONSTRAINT zoho_privacy_audit_event_check;
ALTER TABLE public.zoho_privacy_audit ADD CONSTRAINT zoho_privacy_audit_event_check CHECK(event IN
 ('suppressed','unsuppressed','payload_expired','retention_configured','connection_paused','connection_resumed','connection_disconnected','operation_payload_expired'));
ALTER FUNCTION public.zoho_cleanup_source_payloads() RENAME TO zoho_cleanup_source_payloads_before_retention;
CREATE FUNCTION public.zoho_cleanup_source_payloads() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; r public.zoho_staged_records; o public.zoho_approved_operations; result jsonb; removed integer:=0;
BEGIN
 <<connections>>
 FOR c IN SELECT * FROM public.zoho_connections connection WHERE EXISTS(
   SELECT 1 FROM public.zoho_approved_operations op JOIN public.zoho_staged_records record ON record.id=op.record_id
   WHERE record.connection_id=connection.id AND op.state IN ('queued','failed','completed','approval_stale','revoked')
     AND op.last_error IS DISTINCT FROM 'OUTCOME_UNKNOWN' AND op.approved_data<>'{}'::jsonb
     AND coalesce(op.payload_captured_at,op.created_at)+make_interval(days=>connection.retention_days)<=clock_timestamp())
   ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 20 LOOP
   FOR r IN SELECT * FROM public.zoho_staged_records record WHERE connection_id=c.id AND EXISTS(
     SELECT 1 FROM public.zoho_approved_operations op WHERE op.record_id=record.id AND op.state IN ('queued','failed','completed','approval_stale','revoked')
       AND op.last_error IS DISTINCT FROM 'OUTCOME_UNKNOWN' AND op.approved_data<>'{}'::jsonb
       AND coalesce(op.payload_captured_at,op.created_at)+make_interval(days=>c.retention_days)<=clock_timestamp())
     ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 100 LOOP
     FOR o IN SELECT * FROM public.zoho_approved_operations WHERE record_id=r.id AND state IN ('queued','failed','completed','approval_stale','revoked')
       AND last_error IS DISTINCT FROM 'OUTCOME_UNKNOWN' AND approved_data<>'{}'::jsonb
       AND coalesce(payload_captured_at,created_at)+make_interval(days=>c.retention_days)<=clock_timestamp()
       ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 100 LOOP
       UPDATE public.zoho_approved_operations SET approved_data='{}'::jsonb,
         state=CASE WHEN state IN ('queued','failed') THEN 'approval_stale' ELSE state END WHERE id=o.id;
       IF o.state IN ('queued','failed') AND r.revision=o.record_revision THEN
         UPDATE public.zoho_staged_records SET decision='rejected',revision=revision+1,execution_state='not_approved',
           validation_errors='["PAYLOAD_EXPIRED_REFETCH_REQUIRED"]'::jsonb WHERE id=r.id;
       END IF;
       INSERT INTO public.zoho_privacy_audit(connection_id,record_id,module,external_id,event,source_hash)
         VALUES(c.id,r.id,r.module,r.external_id,'operation_payload_expired',o.source_hash);
       removed:=removed+1;
       EXIT connections WHEN removed>=500;
     END LOOP;
   END LOOP;
 END LOOP;
 result:=public.zoho_cleanup_source_payloads_before_retention();
 RETURN result||jsonb_build_object('redacted',coalesce((result->>'redacted')::integer,0)+removed,'operationPayloadsRedacted',removed);
END;
$$;

REVOKE ALL ON FUNCTION public.zoho_decide_records_before_retention(uuid,jsonb,text,text,uuid,uuid),
 public.zoho_stage_record_before_retention(uuid,text,text,timestamptz,jsonb,jsonb),public.zoho_claim_operation_before_retention(uuid,uuid),
 public.zoho_is_live_approved_operation_before_retention(jsonb),public.zoho_cleanup_source_payloads_before_retention()
 FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
REVOKE ALL ON FUNCTION public.zoho_review_payload_current(uuid,uuid),public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid),
 public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb),public.zoho_claim_operation(uuid,uuid),
 public.zoho_is_live_approved_operation(jsonb),public.zoho_cleanup_source_payloads()
 FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_review_payload_current(uuid,uuid),public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid),
 public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb),public.zoho_claim_operation(uuid,uuid),
 public.zoho_is_live_approved_operation(jsonb),public.zoho_cleanup_source_payloads() TO service_role;
GRANT EXECUTE ON FUNCTION public.zoho_cleanup_source_payloads() TO zoho_discovery;
NOTIFY pgrst, 'reload schema';
COMMIT;
