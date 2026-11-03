BEGIN;

ALTER TABLE public.zoho_discovery_runs
 ADD COLUMN control_state text NOT NULL DEFAULT 'active' CHECK(control_state IN ('active','paused','cancelled')),
 ADD COLUMN control_changed_at timestamptz;
CREATE TABLE public.zoho_discovery_control_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES public.zoho_discovery_runs(id),
 actor_id uuid NOT NULL, action text NOT NULL CHECK(action IN ('pause','resume','cancel')),
 reason_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.zoho_discovery_control_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.zoho_discovery_control_audit TO service_role;

CREATE FUNCTION public.zoho_control_discovery(p_connection uuid,p_run uuid,p_action text,p_reason text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; c public.zoho_connections;
BEGIN
 IF p_actor IS NULL OR p_action IS NULL OR p_action NOT IN ('pause','resume','cancel') OR length(trim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 500
 THEN RAISE EXCEPTION 'Invalid discovery control' USING ERRCODE='22023'; END IF;
 r:=public.zoho_lock_discovery_run(p_run);
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=r.connection_id;
 IF r.connection_id IS DISTINCT FROM p_connection OR c.status<>'connected' OR r.config_revision<>c.config_revision OR r.state NOT IN ('queued','running')
 THEN RAISE EXCEPTION 'Discovery changed; refresh before controlling it' USING ERRCODE='40001'; END IF;
 IF (p_action='pause' AND r.control_state<>'active') OR (p_action='resume' AND r.control_state<>'paused') OR r.control_state='cancelled'
 THEN RAISE EXCEPTION 'Discovery control changed' USING ERRCODE='40001'; END IF;
 UPDATE public.zoho_discovery_runs SET
  control_state=CASE p_action WHEN 'pause' THEN 'paused' WHEN 'resume' THEN 'active' ELSE 'cancelled' END,
  state=CASE WHEN p_action='cancel' THEN 'failed' ELSE 'queued' END,
  last_error=CASE WHEN p_action='cancel' THEN 'CANCELLED_BY_OPERATOR' ELSE NULL END,
  budget_expires_at=CASE WHEN p_action='resume' THEN budget_expires_at+(clock_timestamp()-coalesce(control_changed_at,clock_timestamp())) ELSE budget_expires_at END,
  control_changed_at=clock_timestamp(),next_attempt_at=clock_timestamp(),
  lease_token=NULL,lease_expires_at=NULL,lease_page=NULL,lease_credential_generation=NULL,
  completed_at=CASE WHEN p_action='cancel' THEN clock_timestamp() ELSE NULL END WHERE id=r.id;
 INSERT INTO public.zoho_discovery_control_audit(run_id,actor_id,action,reason_hash)
 VALUES(r.id,p_actor,p_action,encode(sha256(convert_to(trim(p_reason),'UTF8')),'hex'));
 RETURN jsonb_build_object('runId',r.id,'controlState',CASE p_action WHEN 'pause' THEN 'paused' WHEN 'resume' THEN 'active' ELSE 'cancelled' END,'nextPage',r.next_page);
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_control_discovery(uuid,uuid,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_control_discovery(uuid,uuid,text,text,uuid) TO service_role;

ALTER FUNCTION public.zoho_claim_discovery(uuid) RENAME TO zoho_claim_discovery_before_controls;
CREATE FUNCTION public.zoho_claim_discovery(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
 r:=public.zoho_lock_discovery_run(p_run);
 IF r.control_state<>'active' THEN RETURN jsonb_build_object('claimed',false); END IF;
 RETURN public.zoho_claim_discovery_before_controls(p_run);
END;
$$;
ALTER FUNCTION public.zoho_verify_discovery_lease(uuid,uuid) RENAME TO zoho_verify_discovery_lease_before_controls;
CREATE FUNCTION public.zoho_verify_discovery_lease(p_run uuid,p_lease uuid) RETURNS public.zoho_discovery_runs
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
 r:=public.zoho_verify_discovery_lease_before_controls(p_run,p_lease);
 IF r.control_state<>'active' THEN RAISE EXCEPTION 'Discovery is inactive' USING ERRCODE='40001'; END IF;
 RETURN r;
END;
$$;
ALTER FUNCTION public.zoho_start_discovery(uuid,text,uuid) RENAME TO zoho_start_discovery_before_controls;
CREATE FUNCTION public.zoho_start_discovery(p_connection uuid,p_module text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM 1 FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE connection_id=p_connection AND module=p_module AND state IN ('queued','running') AND control_state='paused')
 THEN RAISE EXCEPTION 'Resume or cancel paused discovery first' USING ERRCODE='40001'; END IF;
 RETURN public.zoho_start_discovery_before_controls(p_connection,p_module,p_actor);
END;
$$;
ALTER FUNCTION public.zoho_due_discovery() RENAME TO zoho_due_discovery_before_controls;
CREATE FUNCTION public.zoho_due_discovery() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 -- Preserve automatic inventory scheduling, but paused runs must not consume
 -- the scheduler's bounded due-page slots.
 PERFORM public.zoho_due_discovery_before_controls();
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id)),'[]'::jsonb) FROM (
  SELECT r.id FROM public.zoho_discovery_runs r JOIN public.zoho_connections c ON c.id=r.connection_id
  WHERE r.control_state='active' AND r.state IN ('queued','running') AND c.status='connected'
   AND r.next_attempt_at<=now() AND (r.lease_token IS NULL OR r.lease_expires_at<=now())
  ORDER BY r.next_attempt_at,r.id LIMIT 10
 ) due);
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_claim_discovery_before_controls(uuid),public.zoho_verify_discovery_lease_before_controls(uuid,uuid),
 public.zoho_start_discovery_before_controls(uuid,text,uuid),public.zoho_due_discovery_before_controls() FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
REVOKE ALL ON FUNCTION public.zoho_claim_discovery(uuid),public.zoho_verify_discovery_lease(uuid,uuid),public.zoho_start_discovery(uuid,text,uuid),public.zoho_due_discovery() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_claim_discovery(uuid),public.zoho_due_discovery() TO service_role,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_start_discovery(uuid,text,uuid) TO service_role;

CREATE FUNCTION public.zoho_review_page(p_connection uuid,p_module text,p_state text DEFAULT NULL,p_search text DEFAULT '',p_before timestamptz DEFAULT NULL,p_before_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE items jsonb; total bigint; pattern text;
BEGIN
 IF p_connection IS NULL OR p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings') OR length(coalesce(p_search,''))>100
  OR (p_before IS NULL)<>(p_before_id IS NULL)
  OR (p_state IS NOT NULL AND p_state NOT IN ('pending_approval','held','rejected','approved','approval_stale','processing','completed','failed'))
 THEN RAISE EXCEPTION 'Invalid review filters' USING ERRCODE='22023'; END IF;
 pattern:='%'||replace(replace(replace(coalesce(trim(p_search),''),'\','\\'),'%','\%'),'_','\_')||'%';
 SELECT count(*) INTO total FROM public.zoho_staged_records r WHERE r.connection_id=p_connection AND r.module=p_module
  AND (p_state IS NULL OR r.decision=p_state) AND (coalesce(trim(p_search),'')='' OR r.external_id ILIKE pattern
   OR r.proposed_data->>'name' ILIKE pattern OR r.proposed_data->>'email' ILIKE pattern OR r.proposed_data->>'title' ILIKE pattern);
 SELECT coalesce(jsonb_agg(to_jsonb(page) ORDER BY page.created_at DESC,page.id DESC),'[]'::jsonb) INTO items FROM (
  SELECT r.id,r.connection_id,r.module,r.external_id,r.source_modified_at,r.revision,r.source_hash,r.config_revision,r.proposed_data,r.validation_errors,r.decision,r.execution_state,r.target_id,r.created_at,r.updated_at,r.payload_redacted_at
  FROM public.zoho_staged_records r WHERE r.connection_id=p_connection AND r.module=p_module
   AND (p_state IS NULL OR r.decision=p_state) AND (coalesce(trim(p_search),'')='' OR r.external_id ILIKE pattern
    OR r.proposed_data->>'name' ILIKE pattern OR r.proposed_data->>'email' ILIKE pattern OR r.proposed_data->>'title' ILIKE pattern)
   AND (p_before IS NULL OR (r.created_at,r.id)<(p_before,p_before_id)) ORDER BY r.created_at DESC,r.id DESC LIMIT 50
 ) page;
 RETURN jsonb_build_object('records',items,'total',total);
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_review_page(uuid,text,text,text,timestamptz,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_review_page(uuid,text,text,text,timestamptz,uuid) TO service_role;
CREATE INDEX IF NOT EXISTS zoho_review_filter_cursor ON public.zoho_staged_records(connection_id,module,decision,created_at DESC,id DESC);
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
DO $$
DECLARE extension_schema text;
BEGIN
 SELECT n.nspname INTO STRICT extension_schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_trgm';
 EXECUTE format('CREATE INDEX zoho_review_name_search ON public.zoho_staged_records USING gin ((proposed_data->>''name'') %I.gin_trgm_ops)',extension_schema);
 EXECUTE format('CREATE INDEX zoho_review_email_search ON public.zoho_staged_records USING gin ((proposed_data->>''email'') %I.gin_trgm_ops)',extension_schema);
 EXECUTE format('CREATE INDEX zoho_review_title_search ON public.zoho_staged_records USING gin ((proposed_data->>''title'') %I.gin_trgm_ops)',extension_schema);
 EXECUTE format('CREATE INDEX zoho_review_source_search ON public.zoho_staged_records USING gin (external_id %I.gin_trgm_ops)',extension_schema);
END $$;

COMMIT;
