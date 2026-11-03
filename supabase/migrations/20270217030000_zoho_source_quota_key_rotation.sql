BEGIN;

ALTER TABLE public.zoho_connection_secrets ADD COLUMN refresh_uncertain boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.zoho_reset_replaced_token_state() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.envelope IS DISTINCT FROM OLD.envelope THEN
  NEW.refresh_uncertain:=false; NEW.refresh_lease:=NULL; NEW.refresh_run:=NULL; NEW.refresh_expires_at:=NULL;
 ELSIF OLD.refresh_uncertain AND NEW.refresh_lease IS NOT NULL AND NEW.refresh_lease IS DISTINCT FROM OLD.refresh_lease THEN
  RAISE EXCEPTION 'Operator credential recovery required' USING ERRCODE='40001';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zoho_replaced_token_state BEFORE UPDATE OF envelope,refresh_lease ON public.zoho_connection_secrets
 FOR EACH ROW EXECUTE FUNCTION public.zoho_reset_replaced_token_state();

-- Integration allocations are deliberately below Recruit's smallest edition
-- limits. These counters do not represent the provider account's remaining
-- credits: other applications/user activity is outside this database.
CREATE TABLE public.zoho_source_quota (
 region text NOT NULL, source_org_id text NOT NULL,
 rolling_budget integer NOT NULL DEFAULT 1000 CHECK(rolling_budget BETWEEN 1 AND 1000000),
 concurrent_limit integer NOT NULL DEFAULT 2 CHECK(concurrent_limit BETWEEN 1 AND 5),
 blocked_until timestamptz NOT NULL DEFAULT '-infinity',
 PRIMARY KEY(region,source_org_id)
);
CREATE TABLE public.zoho_source_reservations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
 region text NOT NULL, source_org_id text NOT NULL,
 kind text NOT NULL CHECK(kind IN('read','oauth','bulk')),
 cost integer NOT NULL CHECK(cost>0),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '45 seconds',
 settled_at timestamptz, response_status integer,
 FOREIGN KEY(region,source_org_id) REFERENCES public.zoho_source_quota(region,source_org_id)
);
CREATE INDEX zoho_source_reservation_window ON public.zoho_source_reservations(region,source_org_id,created_at);
CREATE INDEX zoho_source_reservation_active ON public.zoho_source_reservations(region,source_org_id,expires_at) WHERE settled_at IS NULL;
CREATE TABLE public.zoho_security_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
 actor_id uuid NOT NULL, action text NOT NULL CHECK(action IN('rotate_tokens','configure_quota')),
 reason text NOT NULL CHECK(length(reason) BETWEEN 3 AND 500), metadata jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON public.zoho_source_quota,public.zoho_source_reservations,public.zoho_security_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.zoho_source_quota,public.zoho_source_reservations,public.zoho_security_events TO service_role;

CREATE FUNCTION public.zoho_reserve_source_quota(p_connection uuid,p_kind text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; q public.zoho_source_quota; charged bigint; active_count bigint;
 earliest timestamptz; delay integer; reservation uuid; request_cost integer;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF p_kind IS NULL OR p_kind NOT IN('read','oauth','bulk') THEN RAISE EXCEPTION 'Invalid source request kind' USING ERRCODE='22023'; END IF;
 -- This service-only primitive also budgets the organization identity check
 -- before initial OAuth completion. Restricted discovery callers use the
 -- lease-verifying wrapper below, which requires a connected current source.
 -- Three is a conservative read allocation: the Recruit credit documentation
 -- gives conflicting one/three-credit examples for Get Records. Bulk init is50.
 request_cost:=CASE p_kind WHEN 'bulk' THEN 50 WHEN 'read' THEN 3 ELSE 1 END;
 INSERT INTO public.zoho_source_quota(region,source_org_id) VALUES(c.region,c.source_org_id) ON CONFLICT DO NOTHING;
 SELECT * INTO STRICT q FROM public.zoho_source_quota WHERE region=c.region AND source_org_id=c.source_org_id FOR UPDATE;
 IF q.blocked_until>clock_timestamp() THEN
  RETURN jsonb_build_object('granted',false,'retryAfterSeconds',least(86400,greatest(1,ceil(extract(epoch FROM q.blocked_until-clock_timestamp()))::integer)));
 END IF;
 SELECT coalesce(sum(cost),0),min(created_at) INTO charged,earliest FROM public.zoho_source_reservations
  WHERE region=c.region AND source_org_id=c.source_org_id AND created_at>clock_timestamp()-interval '24 hours';
 IF charged+request_cost>q.rolling_budget THEN
  delay:=least(86400,greatest(1,ceil(extract(epoch FROM earliest+interval '24 hours'-clock_timestamp()))::integer));
  RETURN jsonb_build_object('granted',false,'retryAfterSeconds',coalesce(delay,86400));
 END IF;
 SELECT count(*),min(expires_at) INTO active_count,earliest FROM public.zoho_source_reservations
  WHERE region=c.region AND source_org_id=c.source_org_id AND settled_at IS NULL AND expires_at>clock_timestamp();
 IF active_count>=q.concurrent_limit THEN
  RETURN jsonb_build_object('granted',false,'retryAfterSeconds',greatest(1,ceil(extract(epoch FROM earliest-clock_timestamp()))::integer));
 END IF;
 INSERT INTO public.zoho_source_reservations(connection_id,region,source_org_id,kind,cost)
  VALUES(c.id,c.region,c.source_org_id,p_kind,request_cost) RETURNING id INTO reservation;
 -- Keep only the rolling-window accounting plus one hour of recovery margin.
 DELETE FROM public.zoho_source_reservations WHERE id IN(SELECT id FROM public.zoho_source_reservations
  WHERE region=c.region AND source_org_id=c.source_org_id AND created_at<clock_timestamp()-interval '25 hours' LIMIT 1000);
 RETURN jsonb_build_object('granted',true,'reservationId',reservation);
END $$;

CREATE FUNCTION public.zoho_settle_source_quota(p_connection uuid,p_reservation uuid,p_status integer,p_retry_after integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; r public.zoho_source_reservations;
BEGIN
 IF p_status IS NULL OR p_status NOT BETWEEN 0 AND 599 OR p_retry_after IS NULL OR p_retry_after NOT BETWEEN 0 AND 86400 THEN
  RAISE EXCEPTION 'Invalid source response' USING ERRCODE='22023'; END IF;
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection;
 -- Same lock order as reserve; an expired or revoked caller may release only
 -- its own reservation, never reserve another call or rewrite credentials.
 PERFORM 1 FROM public.zoho_source_quota WHERE region=c.region AND source_org_id=c.source_org_id FOR UPDATE;
 SELECT * INTO r FROM public.zoho_source_reservations WHERE id=p_reservation AND connection_id=c.id FOR UPDATE;
 IF NOT FOUND OR r.settled_at IS NOT NULL THEN RETURN jsonb_build_object('settled',false); END IF;
 UPDATE public.zoho_source_reservations SET settled_at=clock_timestamp(),response_status=p_status WHERE id=r.id;
 IF p_status=429 OR (p_status>=500 AND p_retry_after>0) THEN
  UPDATE public.zoho_source_quota SET blocked_until=greatest(blocked_until,
   clock_timestamp()+make_interval(secs=>greatest(60,p_retry_after))) WHERE region=r.region AND source_org_id=r.source_org_id;
 END IF;
 RETURN jsonb_build_object('settled',true);
END $$;

CREATE FUNCTION public.zoho_reserve_discovery_quota(p_run uuid,p_lease uuid,p_kind text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
 r:=public.zoho_verify_discovery_lease(p_run,p_lease);
 RETURN public.zoho_reserve_source_quota(r.connection_id,p_kind);
END $$;
CREATE FUNCTION public.zoho_settle_discovery_quota(p_run uuid,p_lease uuid,p_reservation uuid,p_status integer,p_retry_after integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs;
BEGIN
 r:=public.zoho_verify_discovery_lease(p_run,p_lease);
 RETURN public.zoho_settle_source_quota(r.connection_id,p_reservation,p_status,p_retry_after);
END $$;

CREATE FUNCTION public.zoho_configure_source_quota(p_connection uuid,p_budget integer,p_concurrency integer,p_actor uuid,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections;
BEGIN
 IF p_actor IS NULL OR p_budget IS NULL OR p_budget NOT BETWEEN 1 AND 1000000 OR p_concurrency IS NULL OR p_concurrency NOT BETWEEN 1 AND 5
  OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'Invalid quota confirmation' USING ERRCODE='22023'; END IF;
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection;
 INSERT INTO public.zoho_source_quota(region,source_org_id,rolling_budget,concurrent_limit) VALUES(c.region,c.source_org_id,p_budget,p_concurrency)
 ON CONFLICT(region,source_org_id) DO UPDATE SET rolling_budget=excluded.rolling_budget,concurrent_limit=excluded.concurrent_limit;
 INSERT INTO public.zoho_security_events(connection_id,actor_id,action,reason,metadata)
 VALUES(c.id,p_actor,'configure_quota',trim(p_reason),jsonb_build_object('rollingBudget',p_budget,'concurrentLimit',p_concurrency));
 RETURN jsonb_build_object('connectionId',c.id,'rollingBudget',p_budget,'concurrentLimit',p_concurrency);
END $$;

CREATE FUNCTION public.zoho_rotate_connection_tokens(p_connection uuid,p_generation integer,p_expected jsonb,p_envelope jsonb,p_actor uuid,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; s public.zoho_connection_secrets;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.status<>'paused' OR c.credential_generation IS DISTINCT FROM p_generation OR p_actor IS NULL
  OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500 THEN
  RAISE EXCEPTION 'Connection changed or rotation was not confirmed' USING ERRCODE='40001'; END IF;
 SELECT * INTO STRICT s FROM public.zoho_connection_secrets WHERE connection_id=c.id FOR UPDATE;
 IF s.envelope IS DISTINCT FROM p_expected OR s.refresh_uncertain OR (s.refresh_lease IS NOT NULL AND s.refresh_expires_at>clock_timestamp()) THEN
  RAISE EXCEPTION 'Credentials changed during rotation' USING ERRCODE='40001'; END IF;
 IF p_envelope->>'version' IS DISTINCT FROM '1' OR coalesce(p_envelope->>'keyId','') !~ '^[A-Za-z0-9_-]{1,80}$'
  OR coalesce(p_envelope->>'iv','') !~ '^[A-Za-z0-9+/]{16}$'
  OR length(coalesce(p_envelope->>'ciphertext','')) NOT BETWEEN 24 AND 32768 OR coalesce(p_envelope->>'ciphertext','') !~ '^[A-Za-z0-9+/=]+$' THEN
  RAISE EXCEPTION 'Invalid rotated envelope' USING ERRCODE='22023'; END IF;
 UPDATE public.zoho_connection_secrets SET envelope=p_envelope,updated_at=clock_timestamp(),refresh_lease=NULL,refresh_run=NULL,refresh_expires_at=NULL WHERE connection_id=c.id;
 UPDATE public.zoho_connections SET credential_generation=credential_generation+1 WHERE id=c.id;
 INSERT INTO public.zoho_security_events(connection_id,actor_id,action,reason,metadata)
 VALUES(c.id,p_actor,'rotate_tokens',trim(p_reason),jsonb_build_object('previousKeyId',s.envelope->>'keyId','keyId',p_envelope->>'keyId','credentialGeneration',p_generation+1));
 RETURN jsonb_build_object('connectionId',c.id,'credentialGeneration',p_generation+1,'keyId',p_envelope->>'keyId','status','paused');
END $$;

CREATE FUNCTION public.zoho_begin_connection_refresh(p_connection uuid,p_generation integer,p_expected jsonb,p_lease uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; s public.zoho_connection_secrets;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF p_lease IS NULL OR c.status<>'connected' OR c.credential_generation IS DISTINCT FROM p_generation THEN
  RAISE EXCEPTION 'Connection changed' USING ERRCODE='40001'; END IF;
 SELECT * INTO STRICT s FROM public.zoho_connection_secrets WHERE connection_id=c.id FOR UPDATE;
 IF s.refresh_uncertain THEN RETURN jsonb_build_object('acquired',false,'recoveryRequired',true); END IF;
 IF s.envelope IS DISTINCT FROM p_expected THEN RETURN jsonb_build_object('acquired',false,'changed',true,'envelope',s.envelope); END IF;
 IF s.refresh_lease IS NOT NULL AND s.refresh_expires_at>clock_timestamp() THEN RETURN jsonb_build_object('acquired',false); END IF;
 UPDATE public.zoho_connection_secrets SET refresh_lease=p_lease,refresh_run=NULL,refresh_expires_at=clock_timestamp()+interval '45 seconds' WHERE connection_id=c.id;
 RETURN jsonb_build_object('acquired',true);
END $$;
CREATE FUNCTION public.zoho_verify_connection_refresh(p_connection uuid,p_generation integer,p_lease uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; s public.zoho_connection_secrets;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 SELECT * INTO STRICT s FROM public.zoho_connection_secrets WHERE connection_id=c.id FOR UPDATE;
 IF p_lease IS NULL OR c.status<>'connected' OR c.credential_generation IS DISTINCT FROM p_generation
  OR s.refresh_lease IS DISTINCT FROM p_lease OR s.refresh_run IS NOT NULL OR s.refresh_expires_at<=clock_timestamp() THEN
  RAISE EXCEPTION 'Credential lease changed' USING ERRCODE='40001'; END IF;
END $$;
CREATE FUNCTION public.zoho_mark_connection_refresh(p_connection uuid,p_generation integer,p_lease uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM public.zoho_verify_connection_refresh(p_connection,p_generation,p_lease);
 UPDATE public.zoho_connection_secrets SET refresh_uncertain=true WHERE connection_id=p_connection AND NOT refresh_uncertain;
 IF NOT FOUND THEN RAISE EXCEPTION 'Refresh already started' USING ERRCODE='40001'; END IF;
 RETURN jsonb_build_object('started',true);
END $$;
CREATE FUNCTION public.zoho_cancel_connection_refresh(p_connection uuid,p_generation integer,p_lease uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM public.zoho_verify_connection_refresh(p_connection,p_generation,p_lease);
 UPDATE public.zoho_connection_secrets SET refresh_lease=NULL,refresh_run=NULL,refresh_expires_at=NULL WHERE connection_id=p_connection AND NOT refresh_uncertain;
 IF NOT FOUND THEN RAISE EXCEPTION 'Refresh outcome requires operator recovery' USING ERRCODE='40001'; END IF;
 RETURN jsonb_build_object('cancelled',true);
END $$;
CREATE FUNCTION public.zoho_finish_connection_refresh(p_connection uuid,p_generation integer,p_lease uuid,p_envelope jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM public.zoho_verify_connection_refresh(p_connection,p_generation,p_lease);
 IF p_envelope->>'version' IS DISTINCT FROM '1' OR (p_envelope ? 'keyId' AND coalesce(p_envelope->>'keyId','') !~ '^[A-Za-z0-9_-]{1,80}$')
  OR coalesce(p_envelope->>'iv','') !~ '^[A-Za-z0-9+/]{16}$'
  OR length(coalesce(p_envelope->>'ciphertext','')) NOT BETWEEN 24 AND 32768 OR coalesce(p_envelope->>'ciphertext','') !~ '^[A-Za-z0-9+/=]+$' THEN
  RAISE EXCEPTION 'Invalid token envelope' USING ERRCODE='22023'; END IF;
 UPDATE public.zoho_connection_secrets SET envelope=p_envelope,updated_at=clock_timestamp(),refresh_uncertain=false,
  refresh_lease=NULL,refresh_run=NULL,refresh_expires_at=NULL WHERE connection_id=p_connection AND refresh_uncertain;
 IF NOT FOUND THEN RAISE EXCEPTION 'Refresh did not start' USING ERRCODE='40001'; END IF;
 RETURN jsonb_build_object('refreshed',true);
END $$;

REVOKE ALL ON FUNCTION public.zoho_reset_replaced_token_state(),public.zoho_begin_connection_refresh(uuid,integer,jsonb,uuid),
 public.zoho_verify_connection_refresh(uuid,integer,uuid),public.zoho_mark_connection_refresh(uuid,integer,uuid),
 public.zoho_cancel_connection_refresh(uuid,integer,uuid),public.zoho_finish_connection_refresh(uuid,integer,uuid,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_begin_connection_refresh(uuid,integer,jsonb,uuid),public.zoho_mark_connection_refresh(uuid,integer,uuid),
 public.zoho_cancel_connection_refresh(uuid,integer,uuid),public.zoho_finish_connection_refresh(uuid,integer,uuid,jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.zoho_reserve_source_quota(uuid,text),public.zoho_settle_source_quota(uuid,uuid,integer,integer),
 public.zoho_reserve_discovery_quota(uuid,uuid,text),public.zoho_settle_discovery_quota(uuid,uuid,uuid,integer,integer),
 public.zoho_configure_source_quota(uuid,integer,integer,uuid,text),public.zoho_rotate_connection_tokens(uuid,integer,jsonb,jsonb,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_reserve_source_quota(uuid,text),public.zoho_settle_source_quota(uuid,uuid,integer,integer),
 public.zoho_reserve_discovery_quota(uuid,uuid,text),public.zoho_settle_discovery_quota(uuid,uuid,uuid,integer,integer),
 public.zoho_configure_source_quota(uuid,integer,integer,uuid,text),public.zoho_rotate_connection_tokens(uuid,integer,jsonb,jsonb,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.zoho_reserve_discovery_quota(uuid,uuid,text),public.zoho_settle_discovery_quota(uuid,uuid,uuid,integer,integer) TO zoho_discovery;

COMMIT;
