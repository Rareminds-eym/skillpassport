BEGIN;

-- An atomic replacement is still a write. Keep its original tracked key and
-- fence cleanup until the exact replacement write is known to have finished.
ALTER TABLE public.zoho_bulk_read_runs ADD COLUMN artifact_index_upgrade boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.zoho_begin_bulk_index_upgrade(p_run uuid,p_lease uuid,p_key text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_bulk_read_runs; c public.zoho_connections;
BEGIN
 SELECT c0.* INTO STRICT c FROM public.zoho_connections c0 JOIN public.zoho_bulk_read_runs b ON b.connection_id=c0.id WHERE b.id=p_run FOR UPDATE OF c0;
 SELECT * INTO STRICT r FROM public.zoho_bulk_read_runs WHERE id=p_run FOR UPDATE;
 IF p_lease IS NULL OR r.lease_token IS DISTINCT FROM p_lease OR r.lease_expires_at<=clock_timestamp()
 OR r.state NOT IN ('polling','staging') OR c.status<>'connected' OR r.config_revision<>c.config_revision OR r.credential_generation<>c.credential_generation
 OR r.artifact_key IS DISTINCT FROM p_key OR p_key IS NULL OR NOT r.artifact_ready OR r.artifact_write_pending OR r.artifact_cleanup_pending
 OR r.artifact_expires_at<=clock_timestamp() OR EXISTS(SELECT 1 FROM public.zoho_discovery_runs d WHERE d.bulk_run_id=r.id AND (d.control_state<>'active' OR d.state NOT IN ('queued','running')))
 THEN RAISE EXCEPTION 'Index upgrade grant stale' USING ERRCODE='40001'; END IF;
 UPDATE public.zoho_bulk_read_runs SET artifact_index_upgrade=true,artifact_write_pending=true,artifact_write_token=p_lease,artifact_ready=false WHERE id=r.id;
 RETURN jsonb_build_object('started',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.zoho_claim_bulk_read(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; upgrading boolean;
BEGIN
 PERFORM 1 FROM public.zoho_connections c JOIN public.zoho_bulk_read_runs b ON b.connection_id=c.id WHERE b.id=p_run FOR UPDATE OF c;
 IF EXISTS(SELECT 1 FROM public.zoho_discovery_runs WHERE bulk_run_id=p_run AND (control_state<>'active' OR state NOT IN ('queued','running')))
 THEN RETURN jsonb_build_object('claimed',false); END IF;
 result:=public.zoho_claim_bulk_before_sync(p_run);
 IF result->>'claimed'='true' THEN
  SELECT artifact_index_upgrade INTO upgrading FROM public.zoho_bulk_read_runs WHERE id=p_run;
  result:=jsonb_set(result,'{run,artifact_index_upgrade}',to_jsonb(upgrading));
 END IF;
 RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.zoho_finish_bulk_artifact_write(p_run uuid,p_key text,p_write_token uuid,p_success boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_bulk_read_runs;
BEGIN
 UPDATE public.zoho_bulk_read_runs SET artifact_write_pending=false,artifact_write_token=NULL,artifact_ready=p_success,
  artifact_cleanup_pending=artifact_cleanup_pending OR NOT p_success
 WHERE id=p_run AND artifact_key=p_key AND artifact_write_token=p_write_token AND p_write_token IS NOT NULL AND NOT artifact_index_upgrade RETURNING * INTO r;
 IF NOT FOUND THEN RAISE EXCEPTION 'Artifact write stale' USING ERRCODE='40001'; END IF;
 RETURN jsonb_build_object('ready',r.artifact_ready AND r.state IN ('polling','staging') AND NOT r.artifact_cleanup_pending);
END;
$$;
CREATE FUNCTION public.zoho_finish_bulk_index_write(p_run uuid,p_key text,p_write_token uuid,p_success boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_bulk_read_runs;
BEGIN
 UPDATE public.zoho_bulk_read_runs SET artifact_index_upgrade=false,artifact_write_pending=false,artifact_write_token=NULL,artifact_ready=p_success,
  artifact_cleanup_pending=artifact_cleanup_pending OR NOT p_success
 WHERE id=p_run AND artifact_key=p_key AND artifact_write_token=p_write_token AND p_write_token IS NOT NULL AND artifact_index_upgrade RETURNING * INTO r;
 IF NOT FOUND THEN RAISE EXCEPTION 'Index write stale' USING ERRCODE='40001'; END IF;
 RETURN jsonb_build_object('ready',r.artifact_ready AND r.state IN ('polling','staging') AND NOT r.artifact_cleanup_pending);
END;
$$;
CREATE OR REPLACE FUNCTION public.zoho_due_bulk_artifact_writes() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('runId',id,'key',artifact_key,'jobId',provider_job_id,'digest',archive_hash,'expiresAt',artifact_expires_at,
 'writeToken',artifact_write_token,'indexUpgrade',artifact_index_upgrade,'module',module)),'[]'::jsonb)
 FROM(SELECT * FROM public.zoho_bulk_read_runs WHERE artifact_key IS NOT NULL AND artifact_write_pending
 AND (lease_expires_at IS NULL OR lease_expires_at<=now() OR state='failed') ORDER BY created_at,id LIMIT 50) due;
$$;
REVOKE ALL ON FUNCTION public.zoho_begin_bulk_index_upgrade(uuid,uuid,text),public.zoho_finish_bulk_index_write(uuid,text,uuid,boolean)
 FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_begin_bulk_index_upgrade(uuid,uuid,text),public.zoho_finish_bulk_index_write(uuid,text,uuid,boolean) TO service_role;
COMMIT;
