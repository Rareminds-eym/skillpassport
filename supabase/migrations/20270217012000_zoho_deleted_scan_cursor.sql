BEGIN;
CREATE TABLE public.zoho_deleted_scans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
 module text NOT NULL CHECK(module IN ('Candidates','Job_Openings')),actor_id uuid NOT NULL,config_revision integer NOT NULL,
 credential_generation integer NOT NULL,state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','running','completed','failed')),
 next_page integer NOT NULL DEFAULT 1 CHECK(next_page BETWEEN 1 AND 500001),modified_since timestamptz,
 scan_started_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz,next_attempt_at timestamptz NOT NULL DEFAULT now(),
 lease_token uuid,lease_expires_at timestamptz,failure_count integer NOT NULL DEFAULT 0 CHECK(failure_count BETWEEN 0 AND 8),
 last_error text,budget_expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours'
);
CREATE UNIQUE INDEX zoho_deleted_one_active ON public.zoho_deleted_scans(connection_id,module) WHERE state IN ('queued','running');
CREATE INDEX zoho_deleted_due ON public.zoho_deleted_scans(next_attempt_at,id) WHERE state IN ('queued','running');
CREATE INDEX zoho_deleted_history ON public.zoho_deleted_scans(connection_id,module,scan_started_at DESC,id DESC);
REVOKE ALL ON public.zoho_deleted_scans FROM PUBLIC,anon,authenticated,zoho_discovery,service_role;
GRANT SELECT ON public.zoho_deleted_scans TO service_role;
CREATE FUNCTION public.zoho_start_deleted_scan(p_connection uuid,p_module text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections;r public.zoho_deleted_scans;watermark timestamptz;
BEGIN
 IF p_actor IS NULL OR p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings') THEN RAISE EXCEPTION 'Invalid source scan' USING ERRCODE='22023'; END IF;
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.status<>'connected' THEN RAISE EXCEPTION 'Source unavailable' USING ERRCODE='22023'; END IF;
 SELECT * INTO r FROM public.zoho_deleted_scans WHERE connection_id=c.id AND module=p_module AND state IN ('queued','running');
 IF NOT FOUND THEN
  SELECT max(scan_started_at)-interval '10 minutes' INTO watermark FROM public.zoho_deleted_scans WHERE connection_id=c.id AND module=p_module
   AND config_revision=c.config_revision AND state='completed';
  INSERT INTO public.zoho_deleted_scans(connection_id,module,actor_id,config_revision,credential_generation,modified_since)
  VALUES(c.id,p_module,p_actor,c.config_revision,c.credential_generation,watermark) RETURNING * INTO r;
 END IF;
 RETURN jsonb_build_object('scanId',r.id,'state',r.state);
END;
$$;
CREATE FUNCTION public.zoho_due_deleted_scans() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE candidate record;
BEGIN
 FOR candidate IN SELECT c.id,c.created_by,h.module FROM public.zoho_connections c
 CROSS JOIN LATERAL(SELECT DISTINCT ON(module) module,state,completed_at FROM public.zoho_deleted_scans WHERE connection_id=c.id AND config_revision=c.config_revision ORDER BY module,scan_started_at DESC,id DESC) h
 WHERE c.status='connected' AND h.state='completed' AND h.completed_at<now()-interval '15 minutes' LIMIT 10 LOOP
  PERFORM public.zoho_start_deleted_scan(candidate.id,candidate.module,candidate.created_by);
 END LOOP;
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'connectionId',connection_id)),'[]'::jsonb) FROM(
 SELECT s.id,s.connection_id FROM public.zoho_deleted_scans s JOIN public.zoho_connections c ON c.id=s.connection_id
 WHERE s.state IN ('queued','running') AND s.next_attempt_at<=now() AND (s.lease_token IS NULL OR s.lease_expires_at<=now())
 AND c.status='connected' ORDER BY s.next_attempt_at,s.id LIMIT 10) due);
END;
$$;
CREATE FUNCTION public.zoho_claim_deleted_scan(p_scan uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections;s public.zoho_deleted_scans;token uuid;
BEGIN
 SELECT c0.* INTO STRICT c FROM public.zoho_connections c0 JOIN public.zoho_deleted_scans s0 ON s0.connection_id=c0.id WHERE s0.id=p_scan FOR UPDATE OF c0;
 SELECT * INTO STRICT s FROM public.zoho_deleted_scans WHERE id=p_scan FOR UPDATE;
 IF s.state NOT IN ('queued','running') OR s.next_attempt_at>now() OR s.lease_expires_at>now() THEN RETURN jsonb_build_object('claimed',false); END IF;
 IF s.lease_token IS NOT NULL THEN s.failure_count:=least(8,s.failure_count+1); END IF;
 IF c.status<>'connected' OR c.config_revision<>s.config_revision OR c.credential_generation<>s.credential_generation
 OR s.failure_count>=8 OR s.budget_expires_at<=now() OR s.next_page>500000 THEN
 UPDATE public.zoho_deleted_scans SET state='failed',last_error='SOURCE_CHANGED_OR_BUDGET_EXPIRED',lease_token=NULL,lease_expires_at=NULL WHERE id=s.id;RETURN jsonb_build_object('claimed',false);END IF;
 token:=gen_random_uuid();UPDATE public.zoho_deleted_scans SET state='running',lease_token=token,lease_expires_at=now()+interval '3 minutes',failure_count=s.failure_count WHERE id=s.id;
 RETURN jsonb_build_object('claimed',true,'lease',token,'scan',jsonb_build_object('connectionId',c.id,'region',c.region,'module',s.module,'next_page',s.next_page,'modified_since',s.modified_since));
END;
$$;
CREATE FUNCTION public.zoho_commit_deleted_scan(p_scan uuid,p_lease uuid,p_records jsonb,p_more boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections;s public.zoho_deleted_scans;
BEGIN
 SELECT c0.* INTO STRICT c FROM public.zoho_connections c0 JOIN public.zoho_deleted_scans s0 ON s0.connection_id=c0.id WHERE s0.id=p_scan FOR UPDATE OF c0;
 SELECT * INTO STRICT s FROM public.zoho_deleted_scans WHERE id=p_scan FOR UPDATE;
 IF p_lease IS NULL OR s.lease_token IS DISTINCT FROM p_lease OR s.lease_expires_at<=now() OR s.state<>'running'
 OR c.status<>'connected' OR c.config_revision<>s.config_revision OR c.credential_generation<>s.credential_generation THEN RAISE EXCEPTION 'Source scan stale' USING ERRCODE='40001'; END IF;
 PERFORM public.zoho_stage_source_deletions(c.id,s.module,s.next_page,p_records,p_more);
 UPDATE public.zoho_deleted_scans SET next_page=next_page+1,state=CASE WHEN p_more THEN 'running' ELSE 'completed' END,
  lease_token=NULL,lease_expires_at=NULL,next_attempt_at=now()+interval '15 seconds',completed_at=CASE WHEN NOT p_more THEN now() END WHERE id=s.id;
 RETURN jsonb_build_object('scanId',s.id,'done',NOT p_more,'destinationEffect',false);
END;
$$;
CREATE FUNCTION public.zoho_fail_deleted_scan(p_scan uuid,p_lease uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 UPDATE public.zoho_deleted_scans SET failure_count=least(8,failure_count+1),state=CASE WHEN failure_count>=7 THEN 'failed' ELSE 'running' END,
 lease_token=NULL,lease_expires_at=NULL,next_attempt_at=now()+interval '5 minutes',last_error='SOURCE_READ_FAILED'
 WHERE id=p_scan AND lease_token=p_lease AND lease_expires_at>now();
 RETURN jsonb_build_object('recorded',FOUND);
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_start_deleted_scan(uuid,text,uuid),public.zoho_due_deleted_scans(),public.zoho_claim_deleted_scan(uuid),
 public.zoho_commit_deleted_scan(uuid,uuid,jsonb,boolean),public.zoho_fail_deleted_scan(uuid,uuid) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_start_deleted_scan(uuid,text,uuid),public.zoho_due_deleted_scans(),public.zoho_claim_deleted_scan(uuid),
 public.zoho_commit_deleted_scan(uuid,uuid,jsonb,boolean),public.zoho_fail_deleted_scan(uuid,uuid) TO service_role;
COMMIT;
