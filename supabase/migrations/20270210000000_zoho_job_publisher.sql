BEGIN;
-- This is hosted by the existing application/database. Nothing here sends mail,
-- calls HTTP, enables an integration or relies on RLS.
CREATE TABLE public.zoho_job_publisher_policies (
 connection_id uuid PRIMARY KEY REFERENCES public.zoho_connections(id),
 config_revision integer NOT NULL CHECK(config_revision>0),
 status_map jsonb NOT NULL CHECK(jsonb_typeof(status_map)='object'),
 employment_map jsonb NOT NULL CHECK(jsonb_typeof(employment_map)='object'),
 enabled boolean NOT NULL DEFAULT false,
 -- Deployment review covers transitive trigger effects, not merely function names.
 no_email_reviewed boolean NOT NULL DEFAULT false,
 trigger_fingerprint text NOT NULL CHECK(trigger_fingerprint ~ '^[a-f0-9]{64}$')
);
CREATE TABLE public.zoho_job_links (
 record_id uuid PRIMARY KEY REFERENCES public.zoho_staged_records(id),
 target_id uuid NOT NULL UNIQUE REFERENCES public.opportunities(id),
 publisher_id uuid NOT NULL REFERENCES public.organizations(id),
 source_revision integer NOT NULL CHECK(source_revision>0),
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
 target_fingerprint text NOT NULL CHECK(target_fingerprint ~ '^[a-f0-9]{64}$')
);
CREATE TABLE public.zoho_job_receipts (
 operation_id uuid PRIMARY KEY REFERENCES public.zoho_approved_operations(id),
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
 target_id uuid NOT NULL REFERENCES public.opportunities(id),
 receipt_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.zoho_job_publisher_policies,public.zoho_job_links,public.zoho_job_receipts FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE ON public.zoho_job_publisher_policies TO service_role;
GRANT SELECT ON public.zoho_job_links,public.zoho_job_receipts TO service_role;

-- Conservative database-local executable surface. Do not infer external provider
-- automation or delivery behavior from this inventory. Non-system schemas are
-- included because SQL/PLpgSQL helper dependencies are not completely tracked.
CREATE FUNCTION public.zoho_job_executable_surface()
RETURNS TABLE(kind text,name text,definition text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH app_namespaces AS (
  SELECT oid,nspname FROM pg_namespace WHERE nspname !~ '^pg_' AND nspname<>'information_schema'
 ), app_relations AS (
  SELECT c.* FROM pg_class c JOIN app_namespaces n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p','v','m','f')
 )
 SELECT 'namespace',n.nspname,jsonb_build_object('owner',n.nspowner,'acl',n.nspacl)::text
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

CREATE FUNCTION public.zoho_job_trigger_fingerprint() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 -- Bounds are database-local review limits, not authorization to omit objects.
 -- Oversized surfaces return NULL: readiness denies and policy CAS rejects it.
 WITH surface AS MATERIALIZED (SELECT * FROM public.zoho_job_executable_surface()),
 bounds AS (SELECT count(*) AS objects,coalesce(sum(octet_length(definition)),0) AS bytes FROM surface)
 SELECT CASE WHEN bounds.objects<=50000 AND bounds.bytes<=33554432 THEN (
  SELECT encode(sha256(convert_to(coalesce(jsonb_agg(jsonb_build_array(kind,name,definition) ORDER BY kind,name)::text,'[]'),'UTF8')),'hex') FROM surface
 ) ELSE NULL END FROM bounds;
$$;
CREATE FUNCTION public.zoho_job_policy_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 -- A mapping, quota policy or no-email attestation change invalidates every old
 -- staged approval through the existing configuration revision fence.
 UPDATE public.zoho_connections SET config_revision=config_revision+1 WHERE id=NEW.connection_id
 RETURNING config_revision INTO NEW.config_revision;
 IF NOT FOUND THEN RAISE EXCEPTION 'Connection unavailable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zoho_job_policy_revision BEFORE INSERT OR UPDATE ON public.zoho_job_publisher_policies
 FOR EACH ROW EXECUTE FUNCTION public.zoho_job_policy_revision();

CREATE FUNCTION public.zoho_job_target_fingerprint(p_job public.opportunities) RETURNS text
LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT encode(sha256(convert_to(jsonb_build_object('title',p_job.title,'job_title',p_job.job_title,
 'company_name',p_job.company_name,'department',p_job.department,'location',p_job.location,
 'employment_type',p_job.employment_type,'description',p_job.description,'application_link',p_job.application_link,
 'status',p_job.status,'is_active',p_job.is_active,'organization_id',p_job.organization_id,'learning_requirements',p_job.learning_requirements)::text,'UTF8')),'hex');
$$;
CREATE FUNCTION public.zoho_job_publisher_ready() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT NOT EXISTS(
 WITH RECURSIVE protected(oid) AS (
 SELECT 'public.opportunities'::regclass::oid UNION
 SELECT r.ev_class FROM protected p JOIN pg_depend d ON d.refobjid=p.oid AND d.refclassid='pg_class'::regclass
 AND d.classid='pg_rewrite'::regclass JOIN pg_rewrite r ON r.oid=d.objid WHERE r.ev_class<>p.oid)
 SELECT 1 FROM protected p CROSS JOIN (VALUES('anon'),('authenticated')) AS browser(role)
 WHERE has_table_privilege(browser.role,p.oid,'INSERT,UPDATE,DELETE')
 OR has_any_column_privilege(browser.role,p.oid,'INSERT,UPDATE'))
 AND EXISTS(SELECT 1 FROM public.zoho_job_publisher_policies p JOIN public.zoho_connections c ON c.id=p.connection_id
 WHERE p.enabled AND p.no_email_reviewed AND p.config_revision=c.config_revision
 AND p.trigger_fingerprint=public.zoho_job_trigger_fingerprint());
$$;
CREATE FUNCTION public.zoho_find_job_operation_receipt(p_operation uuid,p_source_hash text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('state','completed','operationId',r.operation_id,'sourceHash',r.source_hash,
 'targetId',r.target_id,'receiptId',r.receipt_id,'emailPolicy','forbidden')
 FROM public.zoho_job_receipts r WHERE r.operation_id=p_operation AND r.source_hash=p_source_hash;
$$;

CREATE FUNCTION public.zoho_apply_job_operation_effect(p_grant jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE op public.zoho_approved_operations; policy public.zoho_job_publisher_policies;
 link public.zoho_job_links; job public.opportunities; d jsonb; status_value text; employment_value text;
 target uuid; receipt jsonb; feature uuid; numeric_limit numeric; enabled_value boolean; plan uuid;
 addon numeric:=0; count_value bigint; field text; publisher uuid; mapped boolean;
BEGIN
 IF p_grant->>'module' IS DISTINCT FROM 'Job_Openings' OR p_grant->>'action' IS DISTINCT FROM 'apply_job'
 OR p_grant->>'emailPolicy' IS DISTINCT FROM 'forbidden' OR octet_length(p_grant::text)>131072 THEN
  RAISE EXCEPTION 'Job approval unavailable' USING ERRCODE='22023'; END IF;
 -- Match the control-plane lock order; source/config/approval cannot change
 -- between the final authority check and the target write.
 op:=public.zoho_lock_operation((p_grant->>'operationId')::uuid);
 receipt:=public.zoho_find_job_operation_receipt(op.id,p_grant->>'sourceHash');
 IF receipt IS NOT NULL THEN
  IF op.source_hash IS DISTINCT FROM p_grant->>'sourceHash' THEN RAISE EXCEPTION 'Receipt mismatch'; END IF;
  RETURN receipt; -- Read-only repair remains possible after lease/approval expiry.
 END IF;
 IF NOT public.zoho_is_live_approved_operation(p_grant) THEN RAISE EXCEPTION 'Job approval unavailable'; END IF;
 publisher:=(p_grant->>'publisherOrganizationId')::uuid;
 -- All integrations for this publisher share the same quota lock.
 PERFORM 1 FROM public.organizations WHERE id=publisher FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Publisher unavailable' USING ERRCODE='ZJ001'; END IF;
 -- Hold the target relation's DML lock before reviewing metadata, including
 -- for draft creates that do not run the quota count. Conflicting table DDL
 -- (DEFAULT/rule/trigger installation) cannot slip between review and INSERT.
 LOCK TABLE public.opportunities IN ROW EXCLUSIVE MODE;
 SELECT * INTO policy FROM public.zoho_job_publisher_policies WHERE connection_id=(p_grant->>'connectionId')::uuid;
 IF NOT FOUND OR NOT policy.enabled OR NOT policy.no_email_reviewed OR policy.config_revision<>op.config_revision
 OR policy.trigger_fingerprint<>public.zoho_job_trigger_fingerprint() OR NOT public.zoho_job_publisher_ready() THEN
  RAISE EXCEPTION 'Job publisher safety review unavailable' USING ERRCODE='ZJ001'; END IF;
 d:=op.approved_data;
 IF jsonb_typeof(d)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(d))<>8
 OR NOT d ?& ARRAY['title','company_name','department','location','employment_type','description','source_status','application_link'] THEN
  RAISE EXCEPTION 'Reviewed job mapping unavailable' USING ERRCODE='ZJ001'; END IF;
 FOREACH field IN ARRAY ARRAY['title','company_name','department','location','employment_type'] LOOP
  IF jsonb_typeof(d->field) IS DISTINCT FROM 'string' OR length(trim(d->>field)) NOT BETWEEN 1 AND 500 THEN
   RAISE EXCEPTION 'Invalid job field' USING ERRCODE='ZJ001'; END IF;
 END LOOP;
 IF jsonb_typeof(d->'description') IS DISTINCT FROM 'string' OR length(d->>'description')>32000
 OR jsonb_typeof(d->'source_status') IS DISTINCT FROM 'string' OR jsonb_typeof(d->'application_link') IS DISTINCT FROM 'string'
 OR length(d->>'application_link')>2048 OR ((d->>'application_link')<>'' AND (d->>'application_link') !~ '^https://[^[:space:]]+$') THEN
  RAISE EXCEPTION 'Invalid job content' USING ERRCODE='ZJ001'; END IF;
 status_value:=policy.status_map->>(d->>'source_status');
 employment_value:=policy.employment_map->>(d->>'employment_type');
 IF status_value NOT IN ('open','closed','draft') OR status_value IS NULL OR employment_value NOT IN ('job','internship','contract') OR employment_value IS NULL THEN
  RAISE EXCEPTION 'Job status or employment mapping unavailable' USING ERRCODE='ZJ001'; END IF;
 SELECT * INTO link FROM public.zoho_job_links WHERE record_id=op.record_id FOR UPDATE;
 mapped:=FOUND;
 IF mapped THEN
  IF op.expected_target_id IS DISTINCT FROM link.target_id OR link.publisher_id<>publisher OR link.source_revision>=op.record_revision THEN
   RAISE EXCEPTION 'Job target or version conflict' USING ERRCODE='ZJ001'; END IF;
  target:=link.target_id;
  SELECT * INTO STRICT job FROM public.opportunities WHERE id=target FOR UPDATE;
  IF job.organization_id IS DISTINCT FROM publisher OR public.zoho_job_target_fingerprint(job)<>link.target_fingerprint
   OR job.learning_requirements IS DISTINCT FROM '[]'::jsonb THEN
   RAISE EXCEPTION 'Job ownership or destination changed' USING ERRCODE='ZJ001'; END IF;
 ELSE
  -- No heuristic/title/email matching or takeover of an existing local job.
  IF op.expected_target_id IS NOT NULL THEN RAISE EXCEPTION 'Unmanaged job target' USING ERRCODE='ZJ001'; END IF;
  IF status_value='closed' THEN RAISE EXCEPTION 'Cannot create a closed job' USING ERRCODE='ZJ001'; END IF;
  target:=gen_random_uuid();
 END IF;
 IF status_value='open' AND (NOT mapped OR NOT coalesce(job.is_active,false) OR job.status IS DISTINCT FROM 'open') THEN
  SELECT id INTO feature FROM public.features WHERE feature_key='active_job_posts';
  IF feature IS NULL THEN RAISE EXCEPTION 'Publishing entitlement unavailable' USING ERRCODE='ZJ001'; END IF;
  SELECT value_numeric,coalesce(is_enabled,false) INTO numeric_limit,enabled_value FROM public.tenant_entitlement_overrides
   WHERE tenant_id=publisher AND feature_id=feature AND (expires_at IS NULL OR expires_at>clock_timestamp()) ORDER BY updated_at DESC LIMIT 1;
  IF NOT FOUND THEN
   SELECT coalesce(s.plan_id,p.id) INTO plan FROM public.subscription_cache s LEFT JOIN public.plans_cache p ON p.plan_code=s.plan_code
    WHERE (s.organization_id=publisher OR s.user_id=publisher) AND s.status='active' ORDER BY s.created_at DESC LIMIT 1;
   SELECT value_numeric,coalesce(is_enabled,false) INTO numeric_limit,enabled_value FROM public.plan_entitlements
    WHERE (plan_id=plan OR plan_id=(SELECT parent_plan_id FROM public.plans_cache WHERE id=plan)) AND feature_id=feature
    ORDER BY (plan_id=plan) DESC LIMIT 1;
  END IF;
  IF NOT coalesce(enabled_value,false) THEN RAISE EXCEPTION 'Publishing entitlement unavailable' USING ERRCODE='ZJ001'; END IF;
  SELECT coalesce(sum(quantity),0) INTO addon FROM public.get_addon_numeric_grants(publisher) WHERE feature_key='active_job_posts';
  SELECT count(*) INTO count_value FROM public.opportunities WHERE organization_id=publisher AND (is_active OR status='open') AND id<>target;
  IF numeric_limit IS NOT NULL AND (numeric_limit<0 OR count_value>=numeric_limit+addon) THEN RAISE EXCEPTION 'Publishing quota exceeded' USING ERRCODE='ZJ001'; END IF;
 END IF;
 IF op.lease_expires_at<=clock_timestamp() OR op.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Job lease expired' USING ERRCODE='ZJ001'; END IF;
 IF NOT mapped THEN
  INSERT INTO public.opportunities(id,title,job_title,company_name,department,location,employment_type,description,application_link,status,is_active,organization_id)
  VALUES(target,d->>'title',d->>'title',d->>'company_name',d->>'department',d->>'location',employment_value,d->>'description',nullif(d->>'application_link',''),status_value,status_value='open',publisher)
  RETURNING * INTO job;
 ELSE
  UPDATE public.opportunities SET title=d->>'title',job_title=d->>'title',company_name=d->>'company_name',department=d->>'department',location=d->>'location',
   employment_type=employment_value,description=d->>'description',embedding=NULL,application_link=nullif(d->>'application_link',''),status=status_value,is_active=status_value='open'
   WHERE id=target RETURNING * INTO job;
 END IF;
 IF public.zoho_job_target_fingerprint(job) IS DISTINCT FROM public.zoho_job_target_fingerprint((SELECT j FROM public.opportunities j WHERE j.id=target))
 OR job.organization_id IS DISTINCT FROM publisher OR job.status IS DISTINCT FROM status_value OR job.is_active IS DISTINCT FROM (status_value='open')
 OR job.title IS DISTINCT FROM d->>'title' OR job.job_title IS DISTINCT FROM d->>'title' OR job.company_name IS DISTINCT FROM d->>'company_name'
 OR job.department IS DISTINCT FROM d->>'department' OR job.location IS DISTINCT FROM d->>'location' OR job.employment_type IS DISTINCT FROM employment_value
 OR job.description IS DISTINCT FROM d->>'description' OR job.application_link IS DISTINCT FROM nullif(d->>'application_link','')
 OR job.learning_requirements IS DISTINCT FROM '[]'::jsonb THEN
  RAISE EXCEPTION 'Job postcondition failed'; END IF;
 INSERT INTO public.zoho_job_links(record_id,target_id,publisher_id,source_revision,source_hash,target_fingerprint)
 VALUES(op.record_id,target,publisher,op.record_revision,op.source_hash,public.zoho_job_target_fingerprint(job))
 ON CONFLICT(record_id) DO UPDATE SET source_revision=excluded.source_revision,source_hash=excluded.source_hash,target_fingerprint=excluded.target_fingerprint;
 IF op.lease_expires_at<=clock_timestamp() OR op.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Job lease expired'; END IF;
 INSERT INTO public.zoho_job_receipts(operation_id,source_hash,target_id) VALUES(op.id,op.source_hash,target);
 RETURN public.zoho_find_job_operation_receipt(op.id,op.source_hash);
END $$;
REVOKE ALL ON FUNCTION public.zoho_job_trigger_fingerprint(),public.zoho_job_policy_revision(),public.zoho_job_target_fingerprint(public.opportunities),public.zoho_job_publisher_ready(),public.zoho_find_job_operation_receipt(uuid,text),public.zoho_apply_job_operation_effect(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_job_trigger_fingerprint(),public.zoho_job_publisher_ready(),public.zoho_find_job_operation_receipt(uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.zoho_apply_job_operation_effect(jsonb) FROM service_role;
-- Discovery never decides publication from provider status alone. Only the
-- reviewed, revision-bound policy can clear its explicit mapping blocker.
CREATE OR REPLACE FUNCTION public.zoho_stage_record(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; v public.zoho_staged_records; h text; policy public.zoho_job_publisher_policies; errors_value jsonb:=p_errors;
BEGIN
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;

  IF p_module='Job_Openings' THEN
    SELECT * INTO policy FROM public.zoho_job_publisher_policies WHERE connection_id=p_connection;
    IF FOUND AND policy.enabled AND policy.no_email_reviewed AND policy.config_revision=c.config_revision
      AND policy.trigger_fingerprint=public.zoho_job_trigger_fingerprint()
      AND policy.status_map->>(p_data->>'source_status') IN ('open','closed','draft')
      AND policy.employment_map->>(p_data->>'employment_type') IN ('job','internship','contract') THEN
      SELECT coalesce(jsonb_agg(value),'[]'::jsonb) INTO errors_value FROM jsonb_array_elements(p_errors)
        WHERE value IS DISTINCT FROM to_jsonb('Job publication and status mapping requires review.'::text);
    ELSIF jsonb_typeof(errors_value)='array' AND NOT errors_value @> '["Job publication and status mapping requires review."]'::jsonb THEN
      errors_value:=errors_value||'["Job publication and status mapping requires review."]'::jsonb;
    END IF;
  END IF;
  IF c.status <> 'connected' THEN RAISE EXCEPTION 'Connection is not active' USING ERRCODE='22023'; END IF;
  IF p_modified IS NULL OR p_modified > now()+interval '5 minutes' OR octet_length(p_data::text)>65536
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

CREATE TABLE public.zoho_job_policy_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
 actor_id uuid NOT NULL, config_revision integer NOT NULL, reason text NOT NULL,
 policy jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.zoho_job_policy_audit FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.zoho_job_policy_audit TO service_role;
REVOKE INSERT,UPDATE ON public.zoho_job_publisher_policies FROM service_role;
CREATE FUNCTION public.zoho_read_job_policy(p_connection uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE revision_value integer; policy public.zoho_job_publisher_policies; surface jsonb;
BEGIN
 SELECT config_revision INTO STRICT revision_value FROM public.zoho_connections WHERE id=p_connection;
 SELECT * INTO policy FROM public.zoho_job_publisher_policies WHERE connection_id=p_connection;
 IF public.zoho_job_trigger_fingerprint() IS NULL THEN RAISE EXCEPTION 'Executable review surface exceeds supported bounds'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('name',kind||': '||name,'definition',definition,
 'functionDefinition','') ORDER BY kind,name),'[]'::jsonb) INTO surface
 FROM public.zoho_job_executable_surface();
 RETURN jsonb_build_object('connectionId',p_connection,'configRevision',revision_value,
 'policy',CASE WHEN policy.connection_id IS NULL THEN NULL ELSE jsonb_build_object('statusMap',policy.status_map,
 'employmentMap',policy.employment_map,'enabled',policy.enabled,'noEmailReviewed',policy.no_email_reviewed,'triggerFingerprint',policy.trigger_fingerprint) END,
 'triggerFingerprint',public.zoho_job_trigger_fingerprint(),'triggerSurface',surface,'emailPolicy','forbidden');
END $$;
CREATE FUNCTION public.zoho_configure_job_policy(p_connection uuid,p_actor uuid,p_expected_config integer,p_status_map jsonb,p_employment_map jsonb,
 p_enabled boolean,p_no_email_reviewed boolean,p_trigger_fingerprint text,p_reason text) RETURNS jsonb
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
 IF revision_value IS DISTINCT FROM p_expected_config OR p_trigger_fingerprint IS DISTINCT FROM public.zoho_job_trigger_fingerprint() THEN
  RAISE EXCEPTION 'Reviewed publisher context changed' USING ERRCODE='40001'; END IF;
 IF p_enabled AND NOT p_no_email_reviewed THEN RAISE EXCEPTION 'No-email review required'; END IF;
 IF EXISTS(SELECT 1 FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id
 WHERE r.connection_id=p_connection AND o.state='processing') THEN RAISE EXCEPTION 'Reconcile in-flight operations before policy changes' USING ERRCODE='40001'; END IF;
 IF EXISTS(SELECT 1 FROM public.zoho_job_publisher_policies WHERE connection_id=p_connection) THEN
  UPDATE public.zoho_job_publisher_policies SET status_map=p_status_map,employment_map=p_employment_map,enabled=p_enabled,
   no_email_reviewed=p_no_email_reviewed,trigger_fingerprint=p_trigger_fingerprint WHERE connection_id=p_connection RETURNING * INTO policy;
 ELSE
  INSERT INTO public.zoho_job_publisher_policies(connection_id,config_revision,status_map,employment_map,enabled,no_email_reviewed,trigger_fingerprint)
  VALUES(p_connection,revision_value,p_status_map,p_employment_map,p_enabled,p_no_email_reviewed,p_trigger_fingerprint) RETURNING * INTO policy;
 END IF;
 INSERT INTO public.zoho_job_policy_audit(connection_id,actor_id,config_revision,reason,policy)
 VALUES(p_connection,p_actor,policy.config_revision,trim(p_reason),jsonb_build_object('statusMap',policy.status_map,'employmentMap',policy.employment_map,
 'enabled',policy.enabled,'noEmailReviewed',policy.no_email_reviewed,'triggerFingerprint',policy.trigger_fingerprint));
 RETURN jsonb_build_object('connectionId',p_connection,'configRevision',policy.config_revision,'requiresRediscovery',true,'emailPolicy','forbidden');
END $$;
REVOKE ALL ON FUNCTION public.zoho_read_job_policy(uuid),public.zoho_configure_job_policy(uuid,uuid,integer,jsonb,jsonb,boolean,boolean,text,text) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_read_job_policy(uuid),public.zoho_configure_job_policy(uuid,uuid,integer,jsonb,jsonb,boolean,boolean,text,text) TO service_role;

COMMIT;
