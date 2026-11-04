BEGIN;
ALTER TABLE public.zoho_candidate_administration_progress ADD COLUMN administration_version bigint NOT NULL DEFAULT 0 CHECK(administration_version BETWEEN 0 AND 9007199254740991);
CREATE TABLE public.zoho_candidate_administration_watermarks (
 source_org_id text NOT NULL, external_id text NOT NULL, target_id uuid NOT NULL,
 administration_version bigint NOT NULL CHECK(administration_version BETWEEN 1 AND 9007199254740991), request_id uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(), PRIMARY KEY(source_org_id,external_id)
);
CREATE TABLE public.zoho_candidate_administration_recovery_audit (
 request_id uuid NOT NULL, recovering_actor_id uuid NOT NULL, original_actor_id uuid NOT NULL,
 administration_version bigint NOT NULL, action text NOT NULL, recovered_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(request_id,recovering_actor_id,action)
);
REVOKE ALL ON public.zoho_candidate_administration_watermarks,public.zoho_candidate_administration_recovery_audit FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.zoho_apply_candidate_administration(uuid,jsonb,uuid,uuid) RENAME TO zoho_apply_candidate_administration_before_ordering;
CREATE FUNCTION public.zoho_apply_candidate_administration(p_connection uuid,p_receipt jsonb,p_actor uuid,p_after uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE connection public.zoho_connections; progress public.zoho_candidate_administration_progress;
 watermark public.zoho_candidate_administration_watermarks; version bigint; request uuid; target uuid; original_actor uuid; result jsonb;
 source_org text; external text;
BEGIN
 IF p_actor IS NULL OR p_receipt->>'administrationVersion' IS NULL OR p_receipt->>'administrationVersion' !~ '^[1-9][0-9]{0,15}$'
  OR p_receipt->'currentAdministration' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Current canonical administration required' USING ERRCODE='22023'; END IF;
 version:=(p_receipt->>'administrationVersion')::bigint;
 IF version>9007199254740991 THEN RAISE EXCEPTION 'Invalid administration version' USING ERRCODE='22023'; END IF;
 request:=(p_receipt->>'requestId')::uuid;target:=(p_receipt->>'targetId')::uuid;source_org:=p_receipt->>'sourceOrgId';external:=p_receipt->>'externalId';
 SELECT * INTO STRICT connection FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF connection.source_org_id IS DISTINCT FROM source_org OR coalesce(external,'') !~ '^[0-9]{1,40}$' OR request IS NULL OR target IS NULL THEN RAISE EXCEPTION 'Administration source mismatch' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('zoho-administration-application:'||source_org||':'||external,0));
 SELECT * INTO watermark FROM public.zoho_candidate_administration_watermarks WHERE source_org_id=source_org AND external_id=external FOR UPDATE;
 IF FOUND AND (watermark.administration_version>version OR (watermark.administration_version=version AND (watermark.request_id<>request OR watermark.target_id<>target))) THEN
  RAISE EXCEPTION 'Stale administration receipt' USING ERRCODE='40001'; END IF;
 IF FOUND AND watermark.administration_version<version AND EXISTS(SELECT 1 FROM public.zoho_candidate_administration_progress
  WHERE request_id=watermark.request_id AND (NOT completed OR NOT artifacts_confirmed)) THEN RAISE EXCEPTION 'Previous administration is incomplete' USING ERRCODE='40001'; END IF;
 SELECT * INTO progress FROM public.zoho_candidate_administration_progress WHERE request_id=request FOR UPDATE;
 IF FOUND THEN
  IF progress.action IS DISTINCT FROM p_receipt->>'action' OR progress.target_id<>target OR progress.source_org_id<>source_org OR progress.external_id<>external
   OR progress.administration_version NOT IN(0,version) THEN RAISE EXCEPTION 'Administration replay scope changed' USING ERRCODE='40001'; END IF;
  original_actor:=progress.actor_id;
 ELSE original_actor:=(p_receipt->>'approvalActorId')::uuid;
  IF original_actor IS NULL THEN RAISE EXCEPTION 'Canonical approval actor required' USING ERRCODE='22023'; END IF;
 END IF;
 result:=public.zoho_apply_candidate_administration_before_ordering(p_connection,p_receipt,original_actor,p_after);
 UPDATE public.zoho_candidate_administration_progress SET administration_version=version WHERE request_id=request;
 INSERT INTO public.zoho_candidate_administration_watermarks(source_org_id,external_id,target_id,administration_version,request_id)
  VALUES(source_org,external,target,version,request)
  ON CONFLICT(source_org_id,external_id) DO UPDATE SET target_id=excluded.target_id,administration_version=excluded.administration_version,
   request_id=excluded.request_id,updated_at=clock_timestamp();
 -- A completed historical receipt may predate ordering and have been delivered
 -- in reverse order. Reconcile its CURRENT canonical suppression explicitly.
 -- These are connector-only changes; independent accounts/access are preserved.
 IF result->>'state'='completed' THEN
  IF p_receipt->>'action'='release_suppression' THEN
   UPDATE public.zoho_candidate_source_erasure SET suppressed=false,updated_at=clock_timestamp() WHERE source_org_id=source_org AND external_id=external AND target_id=target;
   DELETE FROM public.zoho_source_suppressions WHERE source_org_id=source_org AND module='Candidates' AND external_id=external;
  ELSIF p_receipt->>'action'='erase_connector' THEN
   INSERT INTO public.zoho_candidate_source_erasure(source_org_id,external_id,target_id,suppressed) VALUES(source_org,external,target,true)
    ON CONFLICT(source_org_id,external_id,target_id) DO UPDATE SET suppressed=true,updated_at=clock_timestamp();
   INSERT INTO public.zoho_source_suppressions(source_org_id,module,external_id,actor_id,reason_hash)
    VALUES(source_org,'Candidates',external,p_actor,encode(sha256(convert_to('canonical ordered connector erasure','UTF8')),'hex')) ON CONFLICT(source_org_id,module,external_id) DO NOTHING;
   UPDATE public.zoho_staged_records SET proposed_data='{}',validation_errors='[]',payload_redacted_at=clock_timestamp(),decision='rejected',execution_state='not_approved',revision=revision+1,updated_at=clock_timestamp()
    WHERE module='Candidates' AND external_id=external AND payload_redacted_at IS NULL AND connection_id IN(SELECT id FROM public.zoho_connections WHERE source_org_id=source_org);
   UPDATE public.zoho_approved_operations SET approved_data='{}',state=CASE WHEN state IN('queued','failed') THEN 'revoked' ELSE state END
    WHERE record_id IN(SELECT id FROM public.zoho_staged_records WHERE module='Candidates' AND external_id=external AND connection_id IN(SELECT id FROM public.zoho_connections WHERE source_org_id=source_org));
   DELETE FROM public.zoho_deferred_records WHERE module='Candidates' AND external_id=external AND connection_id IN(SELECT id FROM public.zoho_connections WHERE source_org_id=source_org);
  END IF;
 END IF;
 INSERT INTO public.zoho_candidate_administration_recovery_audit(request_id,recovering_actor_id,original_actor_id,administration_version,action)
  VALUES(request,p_actor,original_actor,version,'apply') ON CONFLICT DO NOTHING;
 RETURN result||jsonb_build_object('administrationVersion',version);
END $$;
ALTER FUNCTION public.zoho_confirm_candidate_administration(uuid,uuid) RENAME TO zoho_confirm_candidate_administration_before_ordering;
CREATE FUNCTION public.zoho_confirm_candidate_administration(p_request uuid,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE progress public.zoho_candidate_administration_progress; watermark public.zoho_candidate_administration_watermarks; result jsonb;
BEGIN
 IF p_actor IS NULL THEN RAISE EXCEPTION 'Recovery actor required' USING ERRCODE='22023'; END IF;
 SELECT * INTO progress FROM public.zoho_candidate_administration_progress WHERE request_id=p_request;
 IF NOT FOUND THEN RAISE EXCEPTION 'Administration progress unavailable' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('zoho-administration-application:'||progress.source_org_id||':'||progress.external_id,0));
 SELECT * INTO watermark FROM public.zoho_candidate_administration_watermarks WHERE source_org_id=progress.source_org_id AND external_id=progress.external_id FOR UPDATE;
 IF NOT FOUND OR watermark.request_id<>p_request OR watermark.administration_version<>progress.administration_version OR watermark.target_id<>progress.target_id THEN RAISE EXCEPTION 'Administration is no longer current' USING ERRCODE='40001'; END IF;
 result:=public.zoho_confirm_candidate_administration_before_ordering(p_request,progress.actor_id);
 INSERT INTO public.zoho_candidate_administration_recovery_audit(request_id,recovering_actor_id,original_actor_id,administration_version,action)
  VALUES(p_request,p_actor,progress.actor_id,progress.administration_version,'confirm') ON CONFLICT DO NOTHING;
 RETURN result||jsonb_build_object('administrationVersion',progress.administration_version);
END $$;
REVOKE ALL ON FUNCTION public.zoho_apply_candidate_administration_before_ordering(uuid,jsonb,uuid,uuid),public.zoho_confirm_candidate_administration_before_ordering(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.zoho_apply_candidate_administration(uuid,jsonb,uuid,uuid),public.zoho_confirm_candidate_administration(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_apply_candidate_administration(uuid,jsonb,uuid,uuid),public.zoho_confirm_candidate_administration(uuid,uuid) TO service_role;
-- Artifact invalidation is itself a mutation and must share the receipt fence.
-- Otherwise a delayed old erasure could invalidate runs started after release.
CREATE FUNCTION public.zoho_erase_bulk_source_artifacts(p_connection uuid,p_request uuid,p_administration_version bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE progress public.zoho_candidate_administration_progress; watermark public.zoho_candidate_administration_watermarks; source_org text;
BEGIN
 SELECT * INTO progress FROM public.zoho_candidate_administration_progress WHERE request_id=p_request;
 IF NOT FOUND OR progress.action<>'erase_connector' OR p_administration_version IS NULL OR p_administration_version<1 THEN
  RAISE EXCEPTION 'Current erasure required' USING ERRCODE='40001'; END IF;
 SELECT source_org_id INTO source_org FROM public.zoho_connections WHERE id=p_connection;
 IF source_org IS DISTINCT FROM progress.source_org_id THEN RAISE EXCEPTION 'Erasure source mismatch' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('zoho-administration-application:'||progress.source_org_id||':'||progress.external_id,0));
 SELECT * INTO watermark FROM public.zoho_candidate_administration_watermarks WHERE source_org_id=progress.source_org_id AND external_id=progress.external_id FOR UPDATE;
 IF NOT FOUND OR watermark.request_id<>p_request OR watermark.administration_version<>p_administration_version
  OR progress.administration_version<>p_administration_version OR watermark.target_id<>progress.target_id THEN
  RAISE EXCEPTION 'Erasure is no longer current' USING ERRCODE='40001'; END IF;
 RETURN public.zoho_erase_bulk_source_artifacts(p_connection);
END $$;
REVOKE ALL ON FUNCTION public.zoho_erase_bulk_source_artifacts(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.zoho_erase_bulk_source_artifacts(uuid,uuid,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_erase_bulk_source_artifacts(uuid,uuid,bigint) TO service_role;
ALTER FUNCTION public.zoho_assert_private_projection_boundary() RENAME TO zoho_assert_private_projection_boundary_before_ordering;
CREATE FUNCTION public.zoho_assert_private_projection_boundary() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM public.zoho_assert_private_projection_boundary_before_ordering();
 IF EXISTS(WITH RECURSIVE protected(oid) AS(
  SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
   AND c.relname IN('zoho_candidate_administration_watermarks','zoho_candidate_administration_recovery_audit')
  UNION SELECT r.ev_class FROM protected p JOIN pg_depend d ON d.refobjid=p.oid AND d.refclassid='pg_class'::regclass
   AND d.classid='pg_rewrite'::regclass JOIN pg_rewrite r ON r.oid=d.objid WHERE r.ev_class<>p.oid)
  SELECT 1 FROM protected p CROSS JOIN(VALUES('anon'),('authenticated')) browser(role)
  WHERE has_table_privilege(browser.role,p.oid,'SELECT,INSERT,UPDATE,DELETE') OR has_any_column_privilege(browser.role,p.oid,'SELECT,INSERT,UPDATE')) THEN
  RAISE EXCEPTION 'Administration ordering requires private watermarks' USING ERRCODE='42501'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.zoho_assert_private_projection_boundary_before_ordering(),public.zoho_assert_private_projection_boundary() FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.zoho_candidate_projection_ready() RENAME TO zoho_candidate_projection_ready_before_ordering;
CREATE FUNCTION public.zoho_candidate_projection_ready() RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF public.zoho_candidate_projection_ready_before_ordering() IS DISTINCT FROM true THEN RETURN false; END IF;
 PERFORM public.zoho_assert_private_projection_boundary();
 RETURN has_function_privilege('service_role','public.zoho_erase_bulk_source_artifacts(uuid,uuid,bigint)','EXECUTE')
  AND NOT has_function_privilege('service_role','public.zoho_erase_bulk_source_artifacts(uuid)','EXECUTE')
  AND NOT has_function_privilege('anon','public.zoho_erase_bulk_source_artifacts(uuid,uuid,bigint)','EXECUTE')
  AND NOT has_function_privilege('authenticated','public.zoho_erase_bulk_source_artifacts(uuid,uuid,bigint)','EXECUTE')
  AND EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.zoho_candidate_administration_progress'::regclass
  AND attname='administration_version' AND atttypid='bigint'::regtype AND attnotnull AND NOT attisdropped);
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.zoho_candidate_projection_ready_before_ordering(),public.zoho_candidate_projection_ready() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.zoho_candidate_projection_ready() TO service_role;
COMMIT;
