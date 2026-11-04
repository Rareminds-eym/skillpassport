BEGIN;
-- Source staging privacy only. No identity/job deletion, notification, or RLS.
ALTER TABLE public.zoho_connections ADD COLUMN retention_days integer NOT NULL DEFAULT 30 CHECK(retention_days BETWEEN 1 AND 365);
ALTER TABLE public.zoho_staged_records
  ADD COLUMN payload_staged_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN payload_redacted_at timestamptz;
CREATE INDEX zoho_payload_retention ON public.zoho_staged_records(payload_staged_at,id) WHERE payload_redacted_at IS NULL;
ALTER TABLE public.zoho_deferred_records ADD COLUMN payload_staged_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX zoho_deferred_payload_retention ON public.zoho_deferred_records(payload_staged_at,id) WHERE proposed_data IS NOT NULL;
CREATE FUNCTION public.zoho_stamp_deferred_payload() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.proposed_data IS NOT NULL THEN
   IF TG_OP='INSERT' THEN NEW.payload_staged_at:=clock_timestamp();
   ELSIF NEW.proposed_data IS DISTINCT FROM OLD.proposed_data OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
     NEW.payload_staged_at:=clock_timestamp(); END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_stamp_deferred_payload() FROM PUBLIC,anon,authenticated,zoho_discovery,service_role;
CREATE TRIGGER zoho_deferred_payload_stamp BEFORE INSERT OR UPDATE OF proposed_data,expires_at ON public.zoho_deferred_records
 FOR EACH ROW EXECUTE FUNCTION public.zoho_stamp_deferred_payload();
CREATE TABLE public.zoho_source_suppressions (
  source_org_id text NOT NULL CHECK(source_org_id ~ '^[0-9]{1,40}$'),
  module text NOT NULL CHECK(module IN ('Candidates','Job_Openings')),
  external_id text NOT NULL CHECK(external_id ~ '^[0-9]{1,40}$'),
  actor_id uuid NOT NULL,
  reason_hash text NOT NULL CHECK(reason_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(source_org_id,module,external_id)
);
CREATE TABLE public.zoho_privacy_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL,
  record_id uuid,
  module text CHECK(module IN ('Candidates','Job_Openings')),
  external_id text CHECK(external_id ~ '^[0-9]{1,40}$'),
  event text NOT NULL CHECK(event IN ('suppressed','unsuppressed','payload_expired','retention_configured','connection_paused','connection_resumed','connection_disconnected')),
  actor_id uuid,
  source_hash text,
  reason_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX zoho_privacy_history ON public.zoho_privacy_audit(connection_id,created_at DESC,id DESC);
REVOKE ALL ON public.zoho_source_suppressions,public.zoho_privacy_audit FROM PUBLIC,anon,authenticated,zoho_discovery,service_role;
GRANT SELECT ON public.zoho_source_suppressions,public.zoho_privacy_audit TO service_role;

CREATE FUNCTION public.zoho_is_source_suppressed(p_connection uuid,p_module text,p_external text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS(SELECT 1 FROM public.zoho_source_suppressions s JOIN public.zoho_connections c ON c.source_org_id=s.source_org_id
 WHERE c.id=p_connection AND s.module=p_module AND s.external_id=p_external);
$$;

CREATE FUNCTION public.zoho_source_privacy_snapshot(p_connection uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('retentionDays',c.retention_days,'status',c.status,'configRevision',c.config_revision,'suppressed',coalesce((SELECT jsonb_agg(
   jsonb_build_object('module',s.module,'externalId',s.external_id,'createdAt',s.created_at) ORDER BY s.created_at DESC)
   FROM (SELECT * FROM public.zoho_source_suppressions WHERE source_org_id=c.source_org_id ORDER BY created_at DESC LIMIT 100) s),'[]'::jsonb),
   'suppressionCount',(SELECT count(*) FROM public.zoho_source_suppressions WHERE source_org_id=c.source_org_id),
   'redactedCount',(SELECT count(*) FROM public.zoho_staged_records WHERE connection_id=c.id AND payload_redacted_at IS NOT NULL),
   'emailPolicy','forbidden') FROM public.zoho_connections c WHERE c.id=p_connection;
$$;

CREATE FUNCTION public.zoho_control_connection(p_connection uuid,p_expected_config integer,p_action text,p_reason text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; unresolved boolean;
BEGIN
 IF p_actor IS NULL OR p_action IS NULL OR p_action NOT IN ('pause','resume','disconnect') OR p_expected_config IS NULL
   OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500 THEN
   RAISE EXCEPTION 'Invalid connection command' USING ERRCODE='22023'; END IF;
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.config_revision<>p_expected_config THEN RAISE EXCEPTION 'Connection changed' USING ERRCODE='40001'; END IF;
 IF p_action='resume' THEN
   IF c.status<>'paused' OR NOT EXISTS(SELECT 1 FROM public.zoho_connection_secrets WHERE connection_id=c.id) THEN
     RAISE EXCEPTION 'Connection requires authentication' USING ERRCODE='22023'; END IF;
 ELSIF p_action='pause' AND c.status<>'connected' THEN RAISE EXCEPTION 'Connection unavailable' USING ERRCODE='22023'; END IF;
 -- Do not erase or relabel ambiguous destination effects. Receipt recovery stays
 -- available after pause/disconnect; an in-flight external call may still finish.
 SELECT EXISTS(SELECT 1 FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id
   WHERE r.connection_id=c.id AND (o.state='processing' OR o.last_error='OUTCOME_UNKNOWN')) INTO unresolved;
 IF p_action<>'resume' THEN
   UPDATE public.zoho_approved_operations o SET state='revoked' FROM public.zoho_staged_records r WHERE r.id=o.record_id
     AND r.connection_id=c.id AND o.state IN ('queued','failed') AND o.last_error IS DISTINCT FROM 'OUTCOME_UNKNOWN';
   UPDATE public.zoho_staged_records r SET decision='approval_stale',execution_state='not_approved',revision=revision+1,updated_at=now()
     WHERE connection_id=c.id AND decision='approved' AND NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations o
       WHERE o.record_id=r.id AND (o.state='processing' OR o.last_error='OUTCOME_UNKNOWN'));
   UPDATE public.zoho_discovery_runs SET state='failed',last_error='CONNECTION_CHANGED',lease_token=NULL,lease_expires_at=NULL
     WHERE connection_id=c.id AND state IN ('queued','running');
 END IF;
 IF p_action='disconnect' THEN
   DELETE FROM public.zoho_connection_secrets WHERE connection_id=c.id;
   DELETE FROM public.zoho_oauth_states WHERE connection_id=c.id;
 END IF;
 UPDATE public.zoho_connections SET status=CASE p_action WHEN 'pause' THEN 'paused' WHEN 'resume' THEN 'connected' ELSE 'not_connected' END,
   config_revision=config_revision+1,credential_generation=credential_generation+CASE WHEN p_action='disconnect' THEN 1 ELSE 0 END WHERE id=c.id RETURNING * INTO c;
 INSERT INTO public.zoho_privacy_audit(connection_id,event,actor_id,reason_hash) VALUES(c.id,
   CASE p_action WHEN 'pause' THEN 'connection_paused' WHEN 'resume' THEN 'connection_resumed' ELSE 'connection_disconnected' END,
   p_actor,encode(sha256(convert_to(trim(p_reason),'UTF8')),'hex'));
 RETURN jsonb_build_object('status',c.status,'configRevision',c.config_revision,'reconciliationRequired',unresolved,'freshReviewRequired',true);
END;
$$;

CREATE FUNCTION public.zoho_guard_private_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.decision IN ('approved','processing') AND (NEW.payload_redacted_at IS NOT NULL
   OR public.zoho_is_source_suppressed(NEW.connection_id,NEW.module,NEW.external_id)) THEN
   RAISE EXCEPTION 'Source requires a fresh permitted review' USING ERRCODE='22023';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER zoho_private_review_guard BEFORE INSERT OR UPDATE OF decision ON public.zoho_staged_records
FOR EACH ROW EXECUTE FUNCTION public.zoho_guard_private_review();

-- Same source ownership, timestamp, hash, revision and in-flight fences as the
-- original staging function. Suppression is durable across credential renewal;
-- a redacted payload can be restored only by a new source fetch and review.
ALTER FUNCTION public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb) RENAME TO zoho_stage_record_before_privacy;
CREATE FUNCTION public.zoho_stage_record(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb)
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
 result:=public.zoho_stage_record_before_privacy(p_connection,p_module,p_external_id,p_modified,p_data,p_errors);
 IF result->>'unchanged' IS DISTINCT FROM 'true' THEN
   UPDATE public.zoho_staged_records SET payload_staged_at=now(),payload_redacted_at=NULL WHERE id=(result->>'id')::uuid;
 END IF;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_stage_record_before_privacy(uuid,text,text,timestamptz,jsonb,jsonb) FROM PUBLIC,anon,authenticated,zoho_discovery,service_role;
REVOKE ALL ON FUNCTION public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb) TO service_role;

CREATE FUNCTION public.zoho_set_source_suppression(p_connection uuid,p_module text,p_external text,p_suppressed boolean,p_reason text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; r public.zoho_staged_records; reason_digest text; unresolved boolean:=false;
BEGIN
 IF p_actor IS NULL OR p_suppressed IS NULL OR p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings')
   OR p_external IS NULL OR p_external !~ '^[0-9]{1,40}$' OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500 THEN
   RAISE EXCEPTION 'Invalid privacy decision' USING ERRCODE='22023';
 END IF;
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 reason_digest:=encode(sha256(convert_to(trim(p_reason),'UTF8')),'hex');
 IF p_suppressed THEN
   INSERT INTO public.zoho_source_suppressions(source_org_id,module,external_id,actor_id,reason_hash)
   VALUES(c.source_org_id,p_module,p_external,p_actor,reason_digest)
   ON CONFLICT(source_org_id,module,external_id) DO UPDATE SET actor_id=excluded.actor_id,reason_hash=excluded.reason_hash;
   -- Clear deferred copies even if canonical execution has an unresolved outcome.
   UPDATE public.zoho_deferred_records SET proposed_data=NULL,validation_errors=NULL,state='superseded',reason='SUPERSEDED',updated_at=now()
   WHERE connection_id=c.id AND module=p_module AND external_id=p_external;
   SELECT * INTO r FROM public.zoho_staged_records WHERE connection_id=c.id AND module=p_module AND external_id=p_external FOR UPDATE;
   IF FOUND THEN
     SELECT EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE record_id=r.id AND
       (state='processing' OR last_error='OUTCOME_UNKNOWN')) INTO unresolved;
     UPDATE public.zoho_approved_operations SET state=CASE WHEN state IN ('queued','failed') THEN 'revoked' ELSE state END,approved_data='{}'::jsonb
     WHERE record_id=r.id AND state IN ('queued','failed','completed','approval_stale','revoked') AND last_error IS DISTINCT FROM 'OUTCOME_UNKNOWN';
     IF NOT unresolved THEN
       UPDATE public.zoho_staged_records SET proposed_data='{}'::jsonb,validation_errors='["SOURCE_SUPPRESSED"]'::jsonb,
         decision='rejected',execution_state='not_approved',revision=revision+1,payload_redacted_at=now(),updated_at=now() WHERE id=r.id;
     END IF;
   END IF;
 ELSE
   DELETE FROM public.zoho_source_suppressions WHERE source_org_id=c.source_org_id AND module=p_module AND external_id=p_external;
   -- Removing suppression never restores payloads, approvals or canonical access.
 END IF;
 INSERT INTO public.zoho_privacy_audit(connection_id,record_id,module,external_id,event,actor_id,source_hash,reason_hash)
 VALUES(c.id,r.id,p_module,p_external,CASE WHEN p_suppressed THEN 'suppressed' ELSE 'unsuppressed' END,p_actor,r.source_hash,reason_digest);
 RETURN jsonb_build_object('suppressed',p_suppressed,'reconciliationRequired',unresolved,'freshDiscoveryRequired',NOT p_suppressed,'canonicalDeletion',false);
END;
$$;

CREATE FUNCTION public.zoho_configure_retention(p_connection uuid,p_days integer,p_reason text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF p_actor IS NULL OR p_days IS NULL OR p_days NOT BETWEEN 1 AND 365 OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500 THEN
   RAISE EXCEPTION 'Invalid retention policy' USING ERRCODE='22023';
 END IF;
 PERFORM 1 FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown source' USING ERRCODE='22023'; END IF;
 UPDATE public.zoho_connections SET retention_days=p_days WHERE id=p_connection;
 INSERT INTO public.zoho_privacy_audit(connection_id,event,actor_id,reason_hash)
 VALUES(p_connection,'retention_configured',p_actor,encode(sha256(convert_to(trim(p_reason),'UTF8')),'hex'));
 RETURN jsonb_build_object('retentionDays',p_days);
END;
$$;

CREATE FUNCTION public.zoho_cleanup_source_payloads() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; r public.zoho_staged_records; d public.zoho_deferred_records; redacted integer:=0;
BEGIN
 -- Bounded batches, connection -> record -> operation lock order matches claims.
 FOR c IN SELECT * FROM public.zoho_connections connection WHERE EXISTS(
   SELECT 1 FROM public.zoho_staged_records candidate WHERE candidate.connection_id=connection.id AND candidate.payload_redacted_at IS NULL
     AND (candidate.payload_staged_at<now()-make_interval(days=>connection.retention_days)
       OR public.zoho_is_source_suppressed(connection.id,candidate.module,candidate.external_id))
     AND NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations o WHERE o.record_id=candidate.id AND
       (o.state='processing' OR o.last_error='OUTCOME_UNKNOWN' OR (o.state IN ('queued','failed') AND o.expires_at>now()))))
   OR EXISTS(SELECT 1 FROM public.zoho_deferred_records deferred WHERE deferred.connection_id=connection.id AND deferred.proposed_data IS NOT NULL
     AND (deferred.expires_at<=now() OR deferred.payload_staged_at<now()-make_interval(days=>connection.retention_days)
       OR public.zoho_is_source_suppressed(connection.id,deferred.module,deferred.external_id)))
   ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 20 LOOP
   FOR d IN SELECT * FROM public.zoho_deferred_records WHERE connection_id=c.id AND proposed_data IS NOT NULL
     AND (expires_at<=now() OR payload_staged_at<now()-make_interval(days=>c.retention_days)
       OR public.zoho_is_source_suppressed(c.id,module,external_id))
     ORDER BY payload_staged_at,id FOR UPDATE SKIP LOCKED LIMIT 100 LOOP
     UPDATE public.zoho_deferred_records SET proposed_data=NULL,validation_errors=NULL,state='blocked_invalid',reason='REFETCH_REQUIRED',updated_at=now() WHERE id=d.id;
     INSERT INTO public.zoho_privacy_audit(connection_id,module,external_id,event,source_hash)
       VALUES(c.id,d.module,d.external_id,'payload_expired',encode(sha256(convert_to(d.proposed_data::text,'UTF8')),'hex'));
     redacted:=redacted+1;
   END LOOP;
   FOR r IN SELECT * FROM public.zoho_staged_records WHERE connection_id=c.id AND payload_redacted_at IS NULL
     AND (payload_staged_at<now()-make_interval(days=>c.retention_days)
       OR public.zoho_is_source_suppressed(c.id,module,external_id))
     AND NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations o WHERE o.record_id=zoho_staged_records.id AND
       (o.state='processing' OR o.last_error='OUTCOME_UNKNOWN' OR (o.state IN ('queued','failed') AND o.expires_at>now())))
     ORDER BY payload_staged_at,id FOR UPDATE SKIP LOCKED LIMIT 100 LOOP
     IF EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE record_id=r.id AND
       (state='processing' OR last_error='OUTCOME_UNKNOWN' OR (state IN ('queued','failed') AND expires_at>now()))) THEN CONTINUE; END IF;
     -- Expired unclaimed/known-not-applied approvals become terminal before scrub.
     UPDATE public.zoho_approved_operations SET state='approval_stale'
       WHERE record_id=r.id AND state IN ('queued','failed') AND expires_at<=now();
     UPDATE public.zoho_approved_operations SET approved_data='{}'::jsonb
       WHERE record_id=r.id AND state IN ('completed','approval_stale','revoked') AND last_error IS DISTINCT FROM 'OUTCOME_UNKNOWN';
     UPDATE public.zoho_staged_records SET proposed_data='{}'::jsonb,validation_errors='["PAYLOAD_EXPIRED_REFETCH_REQUIRED"]'::jsonb,
       decision=CASE WHEN decision='completed' THEN 'completed' ELSE 'rejected' END,
       execution_state=CASE WHEN decision='completed' THEN execution_state ELSE 'not_approved' END,
       revision=revision+1,payload_redacted_at=now(),updated_at=now() WHERE id=r.id;
     INSERT INTO public.zoho_privacy_audit(connection_id,record_id,module,external_id,event,source_hash)
       VALUES(c.id,r.id,r.module,r.external_id,'payload_expired',r.source_hash);
     redacted:=redacted+1;
   END LOOP;
 END LOOP;
 RETURN jsonb_build_object('redacted',redacted);
END;
$$;

-- Existing recovery cron runs privacy cleanup; no new Worker or scheduler.
ALTER FUNCTION public.zoho_recover_deferred() RENAME TO zoho_recover_deferred_before_privacy;
CREATE FUNCTION public.zoho_recover_deferred() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE recovery jsonb; cleanup jsonb;
BEGIN
 cleanup:=public.zoho_cleanup_source_payloads();
 recovery:=public.zoho_recover_deferred_before_privacy();
 RETURN recovery||jsonb_build_object('privacy',cleanup);
END;
$$;
ALTER FUNCTION public.zoho_is_live_approved_operation(jsonb) RENAME TO zoho_is_live_approved_operation_before_privacy;
CREATE FUNCTION public.zoho_is_live_approved_operation(p_grant jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF public.zoho_is_source_suppressed((p_grant->>'connectionId')::uuid,p_grant->>'module',p_grant->>'externalId') THEN RETURN false; END IF;
 RETURN public.zoho_is_live_approved_operation_before_privacy(p_grant);
EXCEPTION WHEN invalid_text_representation THEN RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_recover_deferred_before_privacy(),public.zoho_is_live_approved_operation_before_privacy(jsonb)
 FROM PUBLIC,anon,authenticated,zoho_discovery,service_role;
REVOKE ALL ON FUNCTION public.zoho_guard_private_review(),public.zoho_is_source_suppressed(uuid,text,text),
 public.zoho_set_source_suppression(uuid,text,text,boolean,text,uuid),public.zoho_configure_retention(uuid,integer,text,uuid),
 public.zoho_control_connection(uuid,integer,text,text,uuid),
 public.zoho_source_privacy_snapshot(uuid),public.zoho_cleanup_source_payloads(),public.zoho_recover_deferred(),public.zoho_is_live_approved_operation(jsonb)
 FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_is_source_suppressed(uuid,text,text),
 public.zoho_set_source_suppression(uuid,text,text,boolean,text,uuid),public.zoho_configure_retention(uuid,integer,text,uuid),
 public.zoho_control_connection(uuid,integer,text,text,uuid),
 public.zoho_source_privacy_snapshot(uuid),public.zoho_cleanup_source_payloads(),public.zoho_recover_deferred(),public.zoho_is_live_approved_operation(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.zoho_recover_deferred() TO zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_cleanup_source_payloads() TO zoho_discovery;
COMMIT;
