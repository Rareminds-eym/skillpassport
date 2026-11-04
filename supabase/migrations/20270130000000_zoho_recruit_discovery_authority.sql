BEGIN;

-- Dedicated PostgREST role: no login, table access, approval or execution grants.
-- Provision a short-lived signed JWT for this role outside migrations/source control.
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='zoho_discovery') THEN
    CREATE ROLE zoho_discovery NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='zoho_discovery' AND
      (rolcanlogin OR rolinherit OR rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication))
    OR EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='zoho_discovery') THEN
    RAISE EXCEPTION 'Discovery role has unsafe existing authority';
  END IF;
END $$;
GRANT zoho_discovery TO authenticator;
GRANT USAGE ON SCHEMA public TO zoho_discovery;

ALTER TABLE public.zoho_discovery_runs
  ADD COLUMN failure_count integer NOT NULL DEFAULT 0 CHECK(failure_count BETWEEN 0 AND 8),
  ADD COLUMN budget_expires_at timestamptz NOT NULL DEFAULT (now()+interval '24 hours'),
  ADD COLUMN lease_token uuid,
  ADD COLUMN lease_expires_at timestamptz,
  ADD COLUMN lease_page integer,
  ADD COLUMN lease_credential_generation integer,
  ADD COLUMN inventory_scope text NOT NULL DEFAULT 'saved' CHECK(inventory_scope='saved');
CREATE INDEX zoho_discovery_due ON public.zoho_discovery_runs(next_attempt_at,id) WHERE state IN ('queued','running');

CREATE FUNCTION public.zoho_schedule_reconciliation(p_actions text[]) RETURNS TABLE(id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF p_actions IS NULL OR cardinality(p_actions) NOT BETWEEN 1 AND 2 OR
    EXISTS(SELECT 1 FROM unnest(p_actions) a WHERE a IS NULL OR a NOT IN ('provision_candidate','apply_job')) THEN
    RAISE EXCEPTION 'Invalid reconciliation scope' USING ERRCODE='22023';
  END IF;
  RETURN QUERY WITH due AS (
    SELECT o.id FROM public.zoho_approved_operations o WHERE o.state='processing' AND o.action=ANY(p_actions)
      AND o.next_reconcile_at<=clock_timestamp()
      AND (o.last_error='OUTCOME_UNKNOWN' OR o.lease_expires_at<=clock_timestamp())
    ORDER BY o.next_reconcile_at,o.id LIMIT 25 FOR UPDATE SKIP LOCKED
  ) UPDATE public.zoho_approved_operations o SET next_reconcile_at=clock_timestamp()+interval '2 minutes'
    FROM due WHERE o.id=due.id RETURNING o.id;
END;
$$;

CREATE FUNCTION public.zoho_invalidate_discovery_credentials() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  UPDATE public.zoho_discovery_runs SET lease_token=NULL,lease_expires_at=NULL,lease_page=NULL,
    lease_credential_generation=NULL,next_attempt_at=now(),last_error='CREDENTIALS_CHANGED'
    WHERE connection_id=NEW.id AND state IN ('queued','running');
  RETURN NEW;
END;
$$;
CREATE TRIGGER zoho_discovery_credentials_changed AFTER UPDATE OF credential_generation ON public.zoho_connections
FOR EACH ROW WHEN(OLD.credential_generation IS DISTINCT FROM NEW.credential_generation)
EXECUTE FUNCTION public.zoho_invalidate_discovery_credentials();

CREATE FUNCTION public.zoho_lock_discovery_run(p_run uuid) RETURNS public.zoho_discovery_runs
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
  SELECT * INTO STRICT r FROM public.zoho_discovery_runs WHERE id=p_run;
  PERFORM 1 FROM public.zoho_connections WHERE id=r.connection_id FOR UPDATE;
  SELECT * INTO STRICT r FROM public.zoho_discovery_runs WHERE id=p_run FOR UPDATE;
  RETURN r;
END;
$$;

CREATE FUNCTION public.zoho_claim_discovery(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; c public.zoho_connections; envelope jsonb; token uuid;
BEGIN
  r:=public.zoho_lock_discovery_run(p_run);
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=r.connection_id;
  IF r.state NOT IN ('queued','running') OR r.next_attempt_at>clock_timestamp()
    OR r.lease_expires_at>clock_timestamp() THEN RETURN jsonb_build_object('claimed',false); END IF;
  IF r.lease_token IS NOT NULL THEN
    r.failure_count:=least(8,r.failure_count+1);
    UPDATE public.zoho_discovery_runs SET failure_count=r.failure_count,last_error='WORKER_LOST' WHERE id=r.id;
  END IF;
  IF r.failure_count>=8 OR r.budget_expires_at<=clock_timestamp() OR r.next_page>500 THEN
    UPDATE public.zoho_discovery_runs SET state='failed',last_error='BUDGET_EXHAUSTED',lease_token=NULL,lease_expires_at=NULL WHERE id=r.id;
    RETURN jsonb_build_object('claimed',false);
  END IF;
  IF c.status<>'connected' OR c.config_revision<>r.config_revision THEN
    UPDATE public.zoho_discovery_runs SET state='failed',last_error='CONNECTION_CHANGED' WHERE id=r.id;
    RETURN jsonb_build_object('claimed',false);
  END IF;
  SELECT s.envelope INTO envelope FROM public.zoho_connection_secrets s WHERE s.connection_id=c.id;
  IF envelope IS NULL THEN
    UPDATE public.zoho_discovery_runs SET state='failed',last_error='CREDENTIALS_UNAVAILABLE' WHERE id=r.id;
    RETURN jsonb_build_object('claimed',false);
  END IF;
  token:=gen_random_uuid();
  UPDATE public.zoho_discovery_runs SET state='running',lease_token=token,lease_expires_at=clock_timestamp()+interval '3 minutes',
    lease_page=next_page,lease_credential_generation=c.credential_generation WHERE id=r.id;
  RETURN jsonb_build_object('claimed',true,'lease',token,
    'run',jsonb_build_object('id',r.id,'module',r.module,'next_page',r.next_page,'config_revision',r.config_revision),
    'source',jsonb_build_object('id',c.id,'region',c.region,'credential_generation',c.credential_generation),
    'envelope',envelope);
END;
$$;

CREATE FUNCTION public.zoho_verify_discovery_lease(p_run uuid,p_lease uuid) RETURNS public.zoho_discovery_runs
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; c public.zoho_connections;
BEGIN
  r:=public.zoho_lock_discovery_run(p_run);
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=r.connection_id;
  IF p_lease IS NULL OR r.lease_token IS DISTINCT FROM p_lease OR r.state NOT IN ('queued','running')
    OR r.lease_expires_at<=clock_timestamp() OR r.lease_page<>r.next_page OR c.status<>'connected'
    OR c.config_revision<>r.config_revision OR c.credential_generation<>r.lease_credential_generation THEN
    RAISE EXCEPTION 'Discovery lease changed' USING ERRCODE='40001';
  END IF;
  RETURN r;
END;
$$;

CREATE FUNCTION public.zoho_refresh_discovery_tokens(p_run uuid,p_lease uuid,p_envelope jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
  r:=public.zoho_verify_discovery_lease(p_run,p_lease);
  IF p_envelope->>'version' IS DISTINCT FROM '1' OR coalesce(p_envelope->>'iv','') !~ '^[A-Za-z0-9+/]{16}$'
    OR (length(coalesce(p_envelope->>'ciphertext','')) NOT BETWEEN 24 AND 32768 OR coalesce(p_envelope->>'ciphertext','') !~ '^[A-Za-z0-9+/=]+$') THEN
    RAISE EXCEPTION 'Invalid token envelope' USING ERRCODE='22023';
  END IF;
  UPDATE public.zoho_connection_secrets SET envelope=p_envelope,updated_at=now() WHERE connection_id=r.connection_id;
  RETURN jsonb_build_object('refreshed',true);
END;
$$;

CREATE FUNCTION public.zoho_commit_claimed_discovery(p_run uuid,p_lease uuid,p_page integer,p_records jsonb,p_issues jsonb,p_more boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; result jsonb;
BEGIN
  r:=public.zoho_verify_discovery_lease(p_run,p_lease);
  IF p_page IS DISTINCT FROM r.next_page THEN RAISE EXCEPTION 'Discovery page changed' USING ERRCODE='40001'; END IF;
  result:=public.zoho_commit_discovery_page(p_run,p_page,p_records,p_issues,p_more);
  UPDATE public.zoho_discovery_runs SET lease_token=NULL,lease_expires_at=NULL,lease_page=NULL,lease_credential_generation=NULL WHERE id=r.id;
  RETURN result;
END;
$$;

CREATE FUNCTION public.zoho_fail_discovery(p_run uuid,p_lease uuid,p_code text,p_retry_after integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; failures integer; terminal boolean; delay_seconds integer;
BEGIN
  IF p_code IS NULL OR p_code NOT IN ('SOURCE_UNAVAILABLE','RATE_LIMITED','AUTH_REVOKED','PERMISSION_DENIED','SOURCE_INVALID')
    OR p_retry_after IS NULL OR p_retry_after NOT BETWEEN 0 AND 86400 THEN RAISE EXCEPTION 'Invalid failure' USING ERRCODE='22023'; END IF;
  r:=public.zoho_lock_discovery_run(p_run);
  IF p_lease IS NULL OR r.lease_token IS DISTINCT FROM p_lease OR r.state NOT IN ('queued','running') THEN
    RETURN jsonb_build_object('recorded',false);
  END IF;
  failures:=least(8,r.failure_count+1);
  terminal:=failures>=8 OR r.budget_expires_at<=clock_timestamp() OR p_code IN ('AUTH_REVOKED','PERMISSION_DENIED','SOURCE_INVALID');
  delay_seconds:=greatest(p_retry_after,1,floor(random()*least(3600,30*power(2,failures-1)))::integer);
  UPDATE public.zoho_discovery_runs SET failure_count=failures,state=CASE WHEN terminal THEN 'failed' ELSE 'queued' END,
    last_error=p_code,next_attempt_at=clock_timestamp()+make_interval(secs=>delay_seconds),lease_token=NULL,lease_expires_at=NULL,
    lease_page=NULL,lease_credential_generation=NULL WHERE id=r.id;
  IF p_code IN ('AUTH_REVOKED','PERMISSION_DENIED') THEN
    UPDATE public.zoho_connections SET status='reauth_required' WHERE id=r.connection_id;
  END IF;
  RETURN jsonb_build_object('recorded',true,'terminal',terminal);
END;
$$;

CREATE FUNCTION public.zoho_due_discovery() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id)),'[]'::jsonb) FROM (
    SELECT id FROM public.zoho_discovery_runs WHERE state IN ('queued','running') AND next_attempt_at<=now()
      AND (lease_token IS NULL OR lease_expires_at<=now()) ORDER BY next_attempt_at,id LIMIT 10
  ) due;
$$;

REVOKE ALL ON FUNCTION public.zoho_schedule_reconciliation(text[]),public.zoho_invalidate_discovery_credentials(),
 public.zoho_lock_discovery_run(uuid),public.zoho_claim_discovery(uuid),public.zoho_verify_discovery_lease(uuid,uuid),
 public.zoho_refresh_discovery_tokens(uuid,uuid,jsonb),public.zoho_commit_claimed_discovery(uuid,uuid,integer,jsonb,jsonb,boolean),
 public.zoho_fail_discovery(uuid,uuid,text,integer),public.zoho_due_discovery() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_schedule_reconciliation(text[]),public.zoho_invalidate_discovery_credentials(),
 public.zoho_lock_discovery_run(uuid),public.zoho_claim_discovery(uuid),public.zoho_verify_discovery_lease(uuid,uuid),
 public.zoho_refresh_discovery_tokens(uuid,uuid,jsonb),public.zoho_commit_claimed_discovery(uuid,uuid,integer,jsonb,jsonb,boolean),
 public.zoho_fail_discovery(uuid,uuid,text,integer),public.zoho_due_discovery() TO service_role;
GRANT EXECUTE ON FUNCTION public.zoho_claim_discovery(uuid),
 public.zoho_refresh_discovery_tokens(uuid,uuid,jsonb),public.zoho_commit_claimed_discovery(uuid,uuid,integer,jsonb,jsonb,boolean),
 public.zoho_fail_discovery(uuid,uuid,text,integer),public.zoho_due_discovery() TO zoho_discovery;
COMMIT;
