BEGIN;
-- Explicit text prevents UNION from truncating catalog object names to PostgreSQL name(63).
-- A deterministic definition tie-breaker keeps identical snapshots comparable.
CREATE OR REPLACE FUNCTION public.zoho_job_executable_surface()
RETURNS TABLE(kind text,name text,definition text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH app_namespaces AS (
  SELECT oid,nspname FROM pg_namespace WHERE nspname !~ '^pg_' AND nspname<>'information_schema'
 ), app_relations AS (
  SELECT c.* FROM pg_class c JOIN app_namespaces n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p','v','m','f')
 )
 SELECT 'namespace',n.nspname::text,jsonb_build_object('owner',n.nspowner,'acl',n.nspacl)::text
 FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM app_namespaces)
 UNION ALL
 SELECT 'routine',p.oid::regprocedure::text,
  jsonb_build_object('owner',p.proowner,'acl',p.proacl,'definition',pg_get_functiondef(p.oid))::text
 FROM pg_proc p JOIN app_namespaces n ON n.oid=p.pronamespace WHERE p.prokind IN ('f','p','w')
 UNION ALL
 SELECT 'aggregate',p.oid::regprocedure::text,(to_jsonb(p)||to_jsonb(a))::text
 FROM pg_proc p JOIN app_namespaces n ON n.oid=p.pronamespace JOIN pg_aggregate a ON a.aggfnoid=p.oid
 UNION ALL
 SELECT 'index',i.indexrelid::regclass::text,
  jsonb_build_object('definition',pg_get_indexdef(i.indexrelid),'valid',i.indisvalid,'ready',i.indisready,'live',i.indislive)::text
 FROM pg_index i JOIN app_relations c ON c.oid=i.indrelid
 UNION ALL
 SELECT 'type',t.oid::regtype::text,to_jsonb(t)::text FROM pg_type t JOIN app_namespaces n ON n.oid=t.typnamespace
 UNION ALL
 SELECT 'enum',e.enumtypid::regtype::text||'.'||e.enumlabel,to_jsonb(e)::text
 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN app_namespaces n ON n.oid=t.typnamespace
 UNION ALL
 SELECT 'trigger',t.tgrelid::regclass::text||'.'||t.tgname,
  jsonb_build_object('mode',t.tgenabled,'definition',pg_get_triggerdef(t.oid),'routine',t.tgfoid::regprocedure::text)::text
 FROM pg_trigger t JOIN app_relations c ON c.oid=t.tgrelid
 UNION ALL
 SELECT 'default',d.adrelid::regclass::text||'.'||a.attname,pg_get_expr(d.adbin,d.adrelid)
 FROM pg_attrdef d JOIN app_relations c ON c.oid=d.adrelid JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
 UNION ALL
 SELECT 'rule',r.ev_class::regclass::text||'.'||r.rulename,
  jsonb_build_object('mode',r.ev_enabled,'definition',pg_get_ruledef(r.oid))::text
 FROM pg_rewrite r JOIN app_relations c ON c.oid=r.ev_class
 UNION ALL
 SELECT 'constraint',c.connamespace::regnamespace::text||'.'||c.conname||':'||c.oid::text,
  jsonb_build_object('validated',c.convalidated,'definition',pg_get_constraintdef(c.oid))::text
 FROM pg_constraint c JOIN app_namespaces n ON n.oid=c.connamespace
 UNION ALL
 SELECT 'relation',c.oid::regclass::text,
  jsonb_build_object('kind',c.relkind,'owner',c.relowner,'acl',c.relacl,'rowSecurity',c.relrowsecurity,
   'forceRowSecurity',c.relforcerowsecurity,'replicaIdentity',c.relreplident,'partition',pg_get_expr(c.relpartbound,c.oid))::text
 FROM app_relations c
 UNION ALL
 SELECT 'column',a.attrelid::regclass::text||'.'||a.attname,
  jsonb_build_object('position',a.attnum,'type',format_type(a.atttypid,a.atttypmod),'collation',a.attcollation,
   'notNull',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,'acl',a.attacl)::text
 FROM pg_attribute a JOIN app_relations c ON c.oid=a.attrelid WHERE a.attnum>0 AND NOT a.attisdropped
 UNION ALL
 SELECT 'operator',o.oid::regoperator::text,to_jsonb(o)::text
 FROM pg_operator o JOIN app_namespaces n ON n.oid=o.oprnamespace
 UNION ALL
 SELECT 'cast',c.castsource::regtype::text||' -> '||c.casttarget::regtype::text,to_jsonb(c)::text
 FROM pg_cast c JOIN pg_type source_type ON source_type.oid=c.castsource JOIN pg_type target_type ON target_type.oid=c.casttarget
 WHERE source_type.typnamespace IN (SELECT oid FROM app_namespaces) OR target_type.typnamespace IN (SELECT oid FROM app_namespaces)
  OR c.castfunc IN (SELECT p.oid FROM pg_proc p JOIN app_namespaces n ON n.oid=p.pronamespace)
$$;
REVOKE ALL ON FUNCTION public.zoho_job_executable_surface() FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

CREATE OR REPLACE FUNCTION public.zoho_job_trigger_fingerprint() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 -- Bounds are database-local review limits, not authorization to omit objects.
 -- Oversized surfaces return NULL: readiness denies and policy CAS rejects it.
 WITH surface AS MATERIALIZED (SELECT * FROM public.zoho_job_executable_surface()),
 bounds AS (SELECT count(*) AS objects,coalesce(sum(octet_length(definition)),0) AS bytes FROM surface)
 SELECT CASE WHEN bounds.objects<=50000 AND bounds.bytes<=33554432 THEN (
  SELECT encode(sha256(convert_to(coalesce(jsonb_agg(jsonb_build_array(kind,name,definition) ORDER BY kind,name,definition)::text,'[]'),'UTF8')),'hex') FROM surface
 ) ELSE NULL END FROM bounds;
$$;

-- Keep the complete executable safety boundary on the server. Browser reads are bounded.
CREATE OR REPLACE FUNCTION public.zoho_read_job_policy(p_connection uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE revision_value integer; policy public.zoho_job_publisher_policies; fingerprint text; objects bigint; bytes bigint; kinds jsonb;
BEGIN
 SELECT config_revision INTO STRICT revision_value FROM public.zoho_connections WHERE id=p_connection;
 SELECT * INTO policy FROM public.zoho_job_publisher_policies WHERE connection_id=p_connection;
 WITH surface AS MATERIALIZED (SELECT * FROM public.zoho_job_executable_surface()),
 stats AS (SELECT kind,count(*) AS entries FROM surface GROUP BY kind)
 SELECT count(*),coalesce(sum(octet_length(definition)),0),
 encode(sha256(convert_to(coalesce(jsonb_agg(jsonb_build_array(kind,name,definition) ORDER BY kind,name,definition)::text,'[]'),'UTF8')),'hex'),
 (SELECT jsonb_object_agg(kind,entries) FROM stats) INTO objects,bytes,fingerprint,kinds FROM surface;
 IF objects>50000 OR bytes>33554432 THEN RAISE EXCEPTION 'Executable review surface exceeds supported bounds'; END IF;
 RETURN jsonb_build_object('connectionId',p_connection,'configRevision',revision_value,
 'policy',CASE WHEN policy.connection_id IS NULL THEN NULL ELSE jsonb_build_object('statusMap',policy.status_map,
 'employmentMap',policy.employment_map,'enabled',policy.enabled,'noEmailReviewed',policy.no_email_reviewed,'triggerFingerprint',policy.trigger_fingerprint) END,
 'triggerFingerprint',fingerprint,'surfaceCount',objects,'surfaceKinds',coalesce(kinds,'{}'::jsonb),'emailPolicy','forbidden');
END $$;

CREATE FUNCTION public.zoho_job_surface_page(p_connection uuid,p_fingerprint text,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE fingerprint text; objects bigint; bytes bigint; items jsonb;
BEGIN
 IF p_offset IS NULL OR p_offset<0 OR p_offset>50000 OR p_fingerprint IS NULL OR p_fingerprint!~'^[a-f0-9]{64}$'
 THEN RAISE EXCEPTION 'Invalid surface page' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.zoho_connections WHERE id=p_connection;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown source' USING ERRCODE='22023'; END IF;
 WITH surface AS MATERIALIZED (SELECT * FROM public.zoho_job_executable_surface()),
 page AS (SELECT kind,name,definition FROM surface ORDER BY kind,name,definition OFFSET p_offset LIMIT 10)
 SELECT count(*),coalesce(sum(octet_length(definition)),0),
 encode(sha256(convert_to(coalesce(jsonb_agg(jsonb_build_array(kind,name,definition) ORDER BY kind,name,definition)::text,'[]'),'UTF8')),'hex'),
 (SELECT coalesce(jsonb_agg(jsonb_build_object('kind',kind,'name',left(name,500),'definition',left(definition,8000),
 'truncated',length(definition)>8000) ORDER BY kind,name),'[]'::jsonb) FROM page)
 INTO objects,bytes,fingerprint,items FROM surface;
 IF objects>50000 OR bytes>33554432 THEN RAISE EXCEPTION 'Executable review surface exceeds supported bounds'; END IF;
 IF fingerprint IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'Catalog changed' USING ERRCODE='40001'; END IF;
 RETURN jsonb_build_object('items',items,'total',objects,'offset',p_offset,'nextOffset',CASE WHEN p_offset+10<objects THEN p_offset+10 ELSE NULL END,'triggerFingerprint',fingerprint);
END $$;
REVOKE ALL ON FUNCTION public.zoho_read_job_policy(uuid), public.zoho_job_surface_page(uuid,text,integer) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_read_job_policy(uuid), public.zoho_job_surface_page(uuid,text,integer) TO service_role;

-- One conditional snapshot replaces N sequential page reads during background refresh.
-- Keep the entire loaded window current, including rows that leave the filter.
CREATE FUNCTION public.zoho_review_window(p_connection uuid,p_module text,p_state text DEFAULT NULL,p_search text DEFAULT '',p_limit integer DEFAULT 50,p_fingerprint text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE items jsonb; total bigint; pattern text; fingerprint text;
BEGIN
 IF p_connection IS NULL OR p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings') OR length(coalesce(p_search,''))>100
 OR p_limit IS NULL OR p_limit NOT BETWEEN 50 AND 100000
 OR (p_state IS NOT NULL AND p_state NOT IN ('pending_approval','held','rejected','approved','approval_stale','processing','completed','failed'))
 OR (p_fingerprint IS NOT NULL AND p_fingerprint!~'^[a-f0-9]{64}$')
 THEN RAISE EXCEPTION 'Invalid review filters' USING ERRCODE='22023'; END IF;
 pattern:='%'||replace(replace(replace(coalesce(trim(p_search),''),'\','\\'),'%','\%'),'_','\_')||'%';
 WITH matching AS MATERIALIZED (
  SELECT r.id,r.connection_id,r.module,r.external_id,r.source_modified_at,r.revision,r.source_hash,r.config_revision,r.proposed_data,r.validation_errors,r.decision,r.execution_state,r.target_id,r.created_at,r.updated_at,r.payload_redacted_at
  FROM public.zoho_staged_records r WHERE r.connection_id=p_connection AND r.module=p_module
  AND (p_state IS NULL OR r.decision=p_state) AND (coalesce(trim(p_search),'')='' OR r.external_id ILIKE pattern
   OR r.proposed_data->>'name' ILIKE pattern OR r.proposed_data->>'email' ILIKE pattern OR r.proposed_data->>'title' ILIKE pattern)
 ), page AS (SELECT * FROM matching ORDER BY created_at DESC,id DESC LIMIT p_limit)
 SELECT coalesce(jsonb_agg(to_jsonb(page) ORDER BY created_at DESC,id DESC),'[]'::jsonb),(SELECT count(*) FROM matching) INTO items,total FROM page;
 fingerprint:=encode(sha256(convert_to(items::text,'UTF8')),'hex');
 RETURN jsonb_build_object('total',total,'fingerprint',fingerprint,'unchanged',fingerprint IS NOT DISTINCT FROM p_fingerprint,
 'records',CASE WHEN fingerprint IS NOT DISTINCT FROM p_fingerprint THEN '[]'::jsonb ELSE items END);
END $$;
REVOKE ALL ON FUNCTION public.zoho_review_window(uuid,text,text,text,integer,text) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_review_window(uuid,text,text,text,integer,text) TO service_role;

-- Manual global retention cleanup records the initiator; automated retention stays independent.
CREATE TABLE public.zoho_payload_cleanup_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor_id uuid NOT NULL,reason_hash text NOT NULL,
 result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.zoho_payload_cleanup_audit FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
GRANT SELECT ON public.zoho_payload_cleanup_audit TO service_role;
CREATE FUNCTION public.zoho_cleanup_payloads_by_operator(p_actor uuid,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
 IF p_actor IS NULL OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500
 THEN RAISE EXCEPTION 'Operator and reason required' USING ERRCODE='22023'; END IF;
 result:=public.zoho_cleanup_source_payloads();
 INSERT INTO public.zoho_payload_cleanup_audit(actor_id,reason_hash,result)
 VALUES(p_actor,encode(sha256(convert_to(trim(p_reason),'UTF8')),'hex'),result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.zoho_cleanup_payloads_by_operator(uuid,text) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_cleanup_payloads_by_operator(uuid,text) TO service_role;

COMMIT;
