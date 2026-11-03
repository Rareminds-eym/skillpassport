BEGIN;

-- Private administration state only. No identity, learner, subscription or opportunity
-- mutation and no notification/HTTP/email side effect exists in these functions.
CREATE TABLE public.zoho_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 100),
  source_org_id text NOT NULL UNIQUE CHECK (source_org_id ~ '^[0-9]{1,40}$'),
  region text NOT NULL CHECK (region IN ('us','in','eu','au','jp','ca','sa','cn')),
  publisher_organization_id uuid NOT NULL REFERENCES public.organizations(id),
  status text NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected','connected','paused','reauth_required')),
  config_revision integer NOT NULL DEFAULT 1 CHECK (config_revision > 0),
  credential_generation integer NOT NULL DEFAULT 0 CHECK(credential_generation>=0),
  email_policy text NOT NULL DEFAULT 'forbidden' CHECK (email_policy = 'forbidden'),
  created_by uuid NOT NULL,
  last_discovered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.zoho_staged_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
  module text NOT NULL CHECK (module IN ('Candidates','Job_Openings')),
  external_id text NOT NULL CHECK (external_id ~ '^[0-9]{1,40}$'),
  source_modified_at timestamptz NOT NULL,
  source_hash text NOT NULL,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  config_revision integer NOT NULL,
  proposed_data jsonb NOT NULL CHECK (jsonb_typeof(proposed_data) = 'object'),
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(validation_errors) = 'array'),
  decision text NOT NULL DEFAULT 'pending_approval' CHECK (decision IN ('pending_approval','held','rejected','approved','approval_stale','processing','completed','failed')),
  execution_state text NOT NULL DEFAULT 'not_approved',
  target_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id,module,external_id)
);
CREATE TABLE public.zoho_approval_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
  request_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approve','hold','reject')),
  reason text NOT NULL CHECK (length(reason) BETWEEN 3 AND 500),
  manifest jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id,request_id)
);
CREATE TABLE public.zoho_approved_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.zoho_approval_batches(id),
  record_id uuid NOT NULL REFERENCES public.zoho_staged_records(id),
  record_revision integer NOT NULL,
  source_hash text NOT NULL,
  config_revision integer NOT NULL,
  approved_data jsonb NOT NULL,
  expected_target_id uuid,
  action text NOT NULL CHECK (action IN ('provision_candidate','apply_job')),
  state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','processing','completed','failed','approval_stale','revoked')),
  email_policy text NOT NULL DEFAULT 'forbidden' CHECK (email_policy = 'forbidden'),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(record_id,record_revision)
);
CREATE INDEX zoho_staged_review ON public.zoho_staged_records(connection_id,module,decision,created_at DESC,id DESC);
CREATE INDEX zoho_operations_pending ON public.zoho_approved_operations(created_at,id) WHERE state = 'queued';

REVOKE ALL ON public.zoho_connections,public.zoho_staged_records,public.zoho_approval_batches,public.zoho_approved_operations FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.zoho_connections,public.zoho_staged_records,public.zoho_approval_batches,public.zoho_approved_operations TO service_role;

CREATE TABLE public.zoho_oauth_states (
  state_hash text PRIMARY KEY,
  connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
  actor_id uuid NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE public.zoho_connection_secrets (
  connection_id uuid PRIMARY KEY REFERENCES public.zoho_connections(id),
  envelope jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.zoho_oauth_states,public.zoho_connection_secrets FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.zoho_oauth_states,public.zoho_connection_secrets TO service_role;
CREATE INDEX zoho_oauth_expiry ON public.zoho_oauth_states(expires_at);

CREATE FUNCTION public.zoho_consume_oauth_state(p_hash text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v public.zoho_oauth_states;
BEGIN
  DELETE FROM public.zoho_oauth_states WHERE state_hash=p_hash AND actor_id=p_actor AND expires_at>now() RETURNING * INTO v;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid OAuth state' USING ERRCODE='22023'; END IF;
  RETURN jsonb_build_object('connectionId',v.connection_id);
END;
$$;
CREATE FUNCTION public.zoho_complete_connection(p_connection uuid,p_envelope jsonb,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  PERFORM 1 FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
  IF NOT FOUND OR p_actor IS NULL OR jsonb_typeof(p_envelope) IS DISTINCT FROM 'object'
    OR p_envelope->>'version' IS DISTINCT FROM '1'
    OR (length(coalesce(p_envelope->>'ciphertext','')) NOT BETWEEN 24 AND 32768 OR coalesce(p_envelope->>'ciphertext','') !~ '^[A-Za-z0-9+/=]+$')
    OR coalesce(p_envelope->>'iv','') !~ '^[A-Za-z0-9+/]{16}$' THEN
    RAISE EXCEPTION 'Invalid connection completion' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.zoho_connection_secrets(connection_id,envelope) VALUES(p_connection,p_envelope)
    ON CONFLICT(connection_id) DO UPDATE SET envelope=excluded.envelope,updated_at=now();
  -- OAuth verifies the same immutable source organization. Credential renewal is
  -- not a mapping/ownership change and never clears an unresolved destination effect.
  UPDATE public.zoho_connections SET status='connected',credential_generation=credential_generation+1 WHERE id=p_connection;
  RETURN jsonb_build_object('connectionId',p_connection,'status','connected','emailPolicy','forbidden');
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_consume_oauth_state(text,uuid),public.zoho_complete_connection(uuid,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_consume_oauth_state(text,uuid),public.zoho_complete_connection(uuid,jsonb,uuid) TO service_role;

CREATE FUNCTION public.zoho_register_connection(p_name text,p_source_org text,p_region text,p_publisher uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v public.zoho_connections;
BEGIN
  IF p_actor IS NULL THEN RAISE EXCEPTION 'Actor required' USING ERRCODE='22023'; END IF;
  INSERT INTO public.zoho_connections(name,source_org_id,region,publisher_organization_id,created_by)
  VALUES(p_name,p_source_org,p_region,p_publisher,p_actor) RETURNING * INTO v;
  RETURN jsonb_build_object('id',v.id,'status',v.status,'emailPolicy',v.email_policy);
END;
$$;

CREATE FUNCTION public.zoho_stage_record(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; v public.zoho_staged_records; h text;
BEGIN
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
  IF c.status <> 'connected' THEN RAISE EXCEPTION 'Connection is not active' USING ERRCODE='22023'; END IF;
  IF p_modified IS NULL OR p_modified > now()+interval '5 minutes' OR octet_length(p_data::text)>65536
    OR jsonb_typeof(p_data)<>'object' OR jsonb_typeof(p_errors)<>'array' THEN
    RAISE EXCEPTION 'Invalid staged record' USING ERRCODE='22023';
  END IF;
  h:=encode(sha256(convert_to(p_data::text,'UTF8')),'hex');
  SELECT * INTO v FROM public.zoho_staged_records WHERE connection_id=p_connection AND module=p_module AND external_id=p_external_id FOR UPDATE;
  IF FOUND THEN
    IF p_modified<v.source_modified_at THEN RETURN jsonb_build_object('id',v.id,'revision',v.revision,'unchanged',true); END IF;
    IF h=v.source_hash AND c.config_revision=v.config_revision AND p_errors=v.validation_errors THEN
      UPDATE public.zoho_staged_records SET source_modified_at=greatest(source_modified_at,p_modified) WHERE id=v.id;
      RETURN jsonb_build_object('id',v.id,'revision',v.revision,'unchanged',true);
    END IF;
    UPDATE public.zoho_approved_operations SET state='approval_stale' WHERE record_id=v.id AND state IN ('queued','failed');
    IF EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE record_id=v.id AND state='processing') THEN
      RAISE EXCEPTION 'Record execution is in flight; retry staging' USING ERRCODE='40001';
    END IF;
    UPDATE public.zoho_staged_records SET source_modified_at=p_modified,source_hash=h,revision=revision+1,
      config_revision=c.config_revision,proposed_data=p_data,validation_errors=p_errors,decision='pending_approval',
      execution_state='not_approved',updated_at=now() WHERE id=v.id RETURNING * INTO v;
  ELSE
    INSERT INTO public.zoho_staged_records(connection_id,module,external_id,source_modified_at,source_hash,config_revision,proposed_data,validation_errors)
    VALUES(p_connection,p_module,p_external_id,p_modified,h,c.config_revision,p_data,p_errors) RETURNING * INTO v;
  END IF;
  RETURN jsonb_build_object('id',v.id,'revision',v.revision,'decision',v.decision);
END;
$$;

CREATE FUNCTION public.zoho_decide_records(p_connection uuid,p_items jsonb,p_decision text,p_reason text,p_request uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; b public.zoho_approval_batches; v public.zoho_staged_records;
  item jsonb; manifest jsonb; n integer;
BEGIN
  IF p_actor IS NULL OR p_request IS NULL OR p_decision NOT IN ('approve','hold','reject') OR length(trim(p_reason)) NOT BETWEEN 3 AND 500
    OR jsonb_typeof(p_items)<>'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Invalid decision' USING ERRCODE='22023';
  END IF;
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
  SELECT jsonb_agg(value ORDER BY value->>'id') INTO manifest FROM jsonb_array_elements(p_items);
  SELECT * INTO b FROM public.zoho_approval_batches WHERE connection_id=p_connection AND request_id=p_request;
  IF FOUND THEN
    IF b.manifest<>manifest OR b.actor_id<>p_actor OR b.decision<>p_decision OR b.reason<>trim(p_reason) THEN
      RAISE EXCEPTION 'Idempotency conflict' USING ERRCODE='40001';
    END IF;
    RETURN jsonb_build_object('approvalId',b.id,'decision',b.decision,'count',jsonb_array_length(manifest),'replayed',true);
  END IF;
  SELECT count(DISTINCT value->>'id') INTO n FROM jsonb_array_elements(p_items);
  IF n<>jsonb_array_length(p_items) THEN RAISE EXCEPTION 'Duplicate selection' USING ERRCODE='22023'; END IF;
  IF p_decision='approve' AND c.status<>'connected' THEN RAISE EXCEPTION 'Connection unavailable' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(manifest) LOOP
    SELECT * INTO v FROM public.zoho_staged_records WHERE id=(item->>'id')::uuid AND connection_id=p_connection FOR UPDATE;
    IF NOT FOUND OR v.revision<>(item->>'revision')::integer OR v.config_revision<>c.config_revision THEN
      RAISE EXCEPTION 'Reviewed revision changed' USING ERRCODE='40001';
    END IF;
    IF v.decision NOT IN ('pending_approval','held','rejected') THEN
      RAISE EXCEPTION 'Record cannot be decided in this state' USING ERRCODE='22023';
    END IF;
    IF p_decision='approve' AND jsonb_array_length(v.validation_errors)>0 THEN
      RAISE EXCEPTION 'Record has validation errors' USING ERRCODE='22023';
    END IF;
  END LOOP;
  INSERT INTO public.zoho_approval_batches(connection_id,request_id,actor_id,decision,reason,manifest)
  VALUES(p_connection,p_request,p_actor,p_decision,trim(p_reason),manifest) RETURNING * INTO b;
  FOR item IN SELECT value FROM jsonb_array_elements(manifest) LOOP
    SELECT * INTO STRICT v FROM public.zoho_staged_records WHERE id=(item->>'id')::uuid;
    IF p_decision='approve' THEN
      INSERT INTO public.zoho_approved_operations(batch_id,record_id,record_revision,source_hash,config_revision,approved_data,expected_target_id,action,expires_at)
      VALUES(b.id,v.id,v.revision,v.source_hash,v.config_revision,v.proposed_data,v.target_id,
        CASE WHEN v.module='Candidates' THEN 'provision_candidate' ELSE 'apply_job' END,now()+interval '24 hours');
    END IF;
    UPDATE public.zoho_staged_records SET decision=CASE p_decision WHEN 'approve' THEN 'approved' WHEN 'hold' THEN 'held' ELSE 'rejected' END,
      execution_state=CASE WHEN p_decision='approve' THEN 'queued' ELSE 'not_approved' END,updated_at=now() WHERE id=v.id;
  END LOOP;
  RETURN jsonb_build_object('approvalId',b.id,'decision',p_decision,'count',n,'emailPolicy','forbidden');
END;
$$;

CREATE FUNCTION public.zoho_admin_snapshot() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
SELECT jsonb_build_object(
  'connections',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'sourceOrgId',c.source_org_id,
    'region',c.region,'status',c.status,'publisherOrganizationId',c.publisher_organization_id,'configRevision',c.config_revision,
    'lastDiscoveredAt',c.last_discovered_at,'createdAt',c.created_at) ORDER BY c.created_at) FROM public.zoho_connections c),'[]'::jsonb),
  'countsByConnection',coalesce((SELECT jsonb_object_agg(connection_id,totals) FROM (SELECT connection_id,jsonb_object_agg(decision,n) totals FROM (SELECT connection_id,decision,count(*) n FROM public.zoho_staged_records GROUP BY connection_id,decision) grouped GROUP BY connection_id) per_connection),'{}'::jsonb),
  'counts',coalesce((SELECT jsonb_object_agg(decision,n) FROM (SELECT decision,count(*) n FROM public.zoho_staged_records GROUP BY decision) x),'{}'::jsonb),
  'emailPolicy','forbidden');
$$;
REVOKE ALL ON FUNCTION public.zoho_register_connection(text,text,text,uuid,uuid),public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb),
  public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid),public.zoho_admin_snapshot() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_register_connection(text,text,text,uuid,uuid),public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb),
  public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid),public.zoho_admin_snapshot() TO service_role;
CREATE TABLE public.zoho_discovery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
  config_revision integer NOT NULL,
  module text NOT NULL CHECK(module IN ('Candidates','Job_Openings')),
  actor_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','running','completed','completed_with_exceptions','failed','incomplete')),
  next_page integer NOT NULL DEFAULT 1,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  received_count integer NOT NULL DEFAULT 0,
  staged_count integer NOT NULL DEFAULT 0,
  issues jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE UNIQUE INDEX zoho_discovery_active ON public.zoho_discovery_runs(connection_id,module) WHERE state IN ('queued','running');
REVOKE ALL ON public.zoho_discovery_runs FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.zoho_discovery_runs TO service_role;

CREATE FUNCTION public.zoho_start_discovery(p_connection uuid,p_module text,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; r public.zoho_discovery_runs;
BEGIN
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
  IF c.status<>'connected' OR p_actor IS NULL OR p_module NOT IN ('Candidates','Job_Openings') THEN
    RAISE EXCEPTION 'Source unavailable' USING ERRCODE='22023';
  END IF;
  SELECT * INTO r FROM public.zoho_discovery_runs WHERE connection_id=c.id AND module=p_module AND state IN ('queued','running');
  IF NOT FOUND THEN
    INSERT INTO public.zoho_discovery_runs(connection_id,config_revision,module,actor_id)
    VALUES(c.id,c.config_revision,p_module,p_actor) RETURNING * INTO r;
  END IF;
  RETURN jsonb_build_object('runId',r.id,'state',r.state,'emailPolicy','forbidden');
END;
$$;
CREATE FUNCTION public.zoho_refresh_tokens(p_connection uuid,p_config integer,p_envelope jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  PERFORM 1 FROM public.zoho_connections WHERE id=p_connection AND config_revision=p_config AND status='connected' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Connection changed' USING ERRCODE='40001'; END IF;
  UPDATE public.zoho_connection_secrets SET envelope=p_envelope,updated_at=now() WHERE connection_id=p_connection;
END;
$$;
CREATE FUNCTION public.zoho_commit_discovery_page(p_run uuid,p_page integer,p_records jsonb,p_issues jsonb,p_more boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; c public.zoho_connections; item jsonb; count_issues integer; final_state text;
BEGIN
  SELECT * INTO STRICT r FROM public.zoho_discovery_runs WHERE id=p_run;
  -- Lock connection first, consistently with staging, decisions and reconnection.
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=r.connection_id FOR UPDATE;
  SELECT * INTO STRICT r FROM public.zoho_discovery_runs WHERE id=p_run FOR UPDATE;
  IF r.state NOT IN ('queued','running') OR r.next_page<>p_page THEN
    RETURN jsonb_build_object('runId',r.id,'done',r.state NOT IN ('queued','running'),'unchanged',true);
  END IF;
  IF c.status<>'connected' OR c.config_revision<>r.config_revision THEN RAISE EXCEPTION 'Connection changed' USING ERRCODE='40001'; END IF;
  IF p_page IS NULL OR p_more IS NULL OR jsonb_typeof(p_records)<>'array' OR jsonb_typeof(p_issues)<>'array'
    OR jsonb_array_length(p_records)+jsonb_array_length(p_issues)>20 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_records) LOOP
    PERFORM public.zoho_stage_record(c.id,r.module,item->>'externalId',(item->>'modified')::timestamptz,item->'data',item->'errors');
  END LOOP;
  count_issues:=jsonb_array_length(r.issues)+jsonb_array_length(p_issues);
  final_state:=CASE WHEN p_more AND p_page>=500 THEN 'incomplete' WHEN p_more THEN 'running'
    WHEN count_issues>0 THEN 'completed_with_exceptions' ELSE 'completed' END;
  UPDATE public.zoho_discovery_runs SET state=final_state,next_page=next_page+1,next_attempt_at=now(),last_error=NULL,
    received_count=received_count+jsonb_array_length(p_records)+jsonb_array_length(p_issues),
    staged_count=staged_count+jsonb_array_length(p_records),issues=issues||p_issues,
    completed_at=CASE WHEN final_state<>'running' THEN now() ELSE NULL END WHERE id=r.id;
  IF final_state IN ('completed','completed_with_exceptions') THEN
    UPDATE public.zoho_connections SET last_discovered_at=now() WHERE id=c.id;
  END IF;
  RETURN jsonb_build_object('runId',r.id,'done',final_state<>'running','state',final_state);
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_start_discovery(uuid,text,uuid),public.zoho_refresh_tokens(uuid,integer,jsonb),
 public.zoho_commit_discovery_page(uuid,integer,jsonb,jsonb,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_start_discovery(uuid,text,uuid),public.zoho_refresh_tokens(uuid,integer,jsonb),
 public.zoho_commit_discovery_page(uuid,integer,jsonb,jsonb,boolean) TO service_role;
COMMIT;
