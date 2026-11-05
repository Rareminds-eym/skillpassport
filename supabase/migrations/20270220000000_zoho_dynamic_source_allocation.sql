BEGIN;
-- Existing rows are operator-owned overrides. New sources default to automatic.
ALTER TABLE public.zoho_source_quota
 ADD COLUMN allocation_mode text NOT NULL DEFAULT 'manual' CHECK(allocation_mode IN('manual','automatic')),
 ADD COLUMN allocation_percent integer NOT NULL DEFAULT 20 CHECK(allocation_percent BETWEEN 1 AND 100),
 ADD COLUMN license_plan_type text,
 ADD COLUMN license_edition text CHECK(license_edition IN('free','standard','professional','enterprise','unknown')),
 ADD COLUMN license_users integer CHECK(license_users BETWEEN 0 AND 1000000),
 ADD COLUMN license_checked_at timestamptz,
 ADD COLUMN license_next_refresh_at timestamptz NOT NULL DEFAULT '-infinity',
 ADD COLUMN license_refresh_lease uuid,
 ADD COLUMN license_refresh_connection uuid,
 ADD COLUMN license_refresh_expires_at timestamptz;
ALTER TABLE public.zoho_source_quota ALTER COLUMN allocation_mode SET DEFAULT 'automatic';

-- Recruit's documented base allowance; add-ons and global remaining usage are unknown.
-- https://www.zoho.com/recruit/developer-guide/apiv2/limits.html
CREATE FUNCTION public.zoho_effective_source_allocation(q public.zoho_source_quota) RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path=pg_catalog,public AS $$
DECLARE allowance bigint; provider_concurrency integer; fresh boolean; budget integer; concurrent integer;
BEGIN
 fresh:=q.license_checked_at IS NOT NULL AND q.license_checked_at>clock_timestamp()-interval '24 hours'
  AND q.license_checked_at<=clock_timestamp() AND q.license_users IS NOT NULL;
 IF fresh THEN
  CASE q.license_edition
   WHEN 'free' THEN allowance:=5000; provider_concurrency:=5;
   WHEN 'standard' THEN allowance:=least(100000,5000+q.license_users::bigint*250); provider_concurrency:=10;
   WHEN 'professional' THEN allowance:=least(500000,10000+q.license_users::bigint*500); provider_concurrency:=15;
   WHEN 'enterprise' THEN allowance:=least(1000000,15000+q.license_users::bigint*1000); provider_concurrency:=20;
   ELSE NULL;
  END CASE;
 END IF;
 IF q.allocation_mode='manual' THEN budget:=q.rolling_budget; concurrent:=q.concurrent_limit;
 ELSIF allowance IS NOT NULL THEN
  budget:=greatest(1,floor(allowance*q.allocation_percent/100.0)::integer);
  concurrent:=least(5,greatest(1,floor(provider_concurrency/2.0)::integer));
 ELSE budget:=least(q.rolling_budget,1000); concurrent:=least(q.concurrent_limit,2);
 END IF;
 RETURN jsonb_build_object('rolling_budget',budget,'concurrent_limit',concurrent,
  'estimated_base_allowance',allowance,'provider_concurrency',provider_concurrency,
  'license_fresh',coalesce(fresh AND allowance IS NOT NULL,false),'fallback',q.allocation_mode='automatic' AND allowance IS NULL);
END $$;

ALTER FUNCTION public.zoho_reserve_source_quota(uuid,text) RENAME TO zoho_reserve_source_quota_fixed;
REVOKE ALL ON FUNCTION public.zoho_reserve_source_quota_fixed(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.zoho_reserve_source_quota(p_connection uuid,p_kind text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; q public.zoho_source_quota; limits jsonb;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 INSERT INTO public.zoho_source_quota(region,source_org_id) VALUES(c.region,c.source_org_id) ON CONFLICT DO NOTHING;
 SELECT * INTO STRICT q FROM public.zoho_source_quota WHERE region=c.region AND source_org_id=c.source_org_id FOR UPDATE;
 limits:=public.zoho_effective_source_allocation(q);
 UPDATE public.zoho_source_quota SET rolling_budget=(limits->>'rolling_budget')::integer,
  concurrent_limit=(limits->>'concurrent_limit')::integer WHERE region=c.region AND source_org_id=c.source_org_id;
 RETURN public.zoho_reserve_source_quota_fixed(p_connection,p_kind);
END $$;

CREATE FUNCTION public.zoho_source_quota_status(p_connection uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; q public.zoho_source_quota; usage bigint;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection;
 SELECT * INTO q FROM public.zoho_source_quota WHERE region=c.region AND source_org_id=c.source_org_id;
 IF NOT FOUND THEN q.rolling_budget:=1000;q.concurrent_limit:=2;q.allocation_mode:='automatic';q.allocation_percent:=20; END IF;
 SELECT coalesce(sum(cost),0) INTO usage FROM public.zoho_source_reservations WHERE region=c.region
  AND source_org_id=c.source_org_id AND created_at>now()-interval '24 hours';
 RETURN public.zoho_effective_source_allocation(q)||jsonb_build_object('allocation_mode',q.allocation_mode,
  'allocation_percent',q.allocation_percent,'license_plan_type',q.license_plan_type,'license_users',q.license_users,
  'license_checked_at',q.license_checked_at,'license_next_refresh_at',q.license_next_refresh_at,
  'used_units',usage,'blocked_until',q.blocked_until);
END $$;

CREATE FUNCTION public.zoho_wake_budget_waiters(p_connection uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; q public.zoho_source_quota; limits jsonb; usage bigint;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection;
 SELECT * INTO STRICT q FROM public.zoho_source_quota WHERE region=c.region AND source_org_id=c.source_org_id FOR UPDATE;
 limits:=public.zoho_effective_source_allocation(q);
 SELECT coalesce(sum(cost),0) INTO usage FROM public.zoho_source_reservations WHERE region=c.region AND source_org_id=c.source_org_id AND created_at>now()-interval '24 hours';
 IF q.blocked_until<=clock_timestamp() AND usage+3<=(limits->>'rolling_budget')::integer THEN
  -- Never wait for a discovery lease while holding the shared quota row.
  WITH due AS (SELECT r.id FROM public.zoho_discovery_runs r JOIN public.zoho_connections source ON source.id=r.connection_id
   WHERE source.region=c.region AND source.source_org_id=c.source_org_id AND source.status='connected'
   AND source.config_revision=r.config_revision AND r.state='queued' AND r.control_state='active' AND r.last_error='RATE_LIMITED'
   FOR UPDATE OF r SKIP LOCKED)
  UPDATE public.zoho_discovery_runs r SET next_attempt_at=least(r.next_attempt_at,clock_timestamp()) WHERE r.id IN(SELECT id FROM due);
 END IF;
END $$;

ALTER FUNCTION public.zoho_configure_source_quota(uuid,integer,integer,uuid,text) RENAME TO zoho_configure_source_quota_fixed;
REVOKE ALL ON FUNCTION public.zoho_configure_source_quota_fixed(uuid,integer,integer,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.zoho_configure_source_quota(p_connection uuid,p_budget integer,p_concurrency integer,p_actor uuid,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; c public.zoho_connections;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 result:=public.zoho_configure_source_quota_fixed(p_connection,p_budget,p_concurrency,p_actor,p_reason);
 UPDATE public.zoho_source_quota SET allocation_mode='manual' WHERE region=c.region AND source_org_id=c.source_org_id;
 PERFORM public.zoho_wake_budget_waiters(p_connection);
 RETURN result||jsonb_build_object('allocationMode','manual');
END $$;
CREATE FUNCTION public.zoho_configure_auto_allocation(p_connection uuid,p_percent integer,p_actor uuid,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections;
BEGIN
 IF p_percent IS NULL OR p_percent NOT BETWEEN 1 AND 100 OR p_actor IS NULL OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500 THEN
  RAISE EXCEPTION 'Invalid allocation configuration' USING ERRCODE='22023'; END IF;
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 INSERT INTO public.zoho_source_quota(region,source_org_id,allocation_mode,allocation_percent) VALUES(c.region,c.source_org_id,'automatic',p_percent)
 ON CONFLICT(region,source_org_id) DO UPDATE SET allocation_mode='automatic',allocation_percent=excluded.allocation_percent;
 INSERT INTO public.zoho_security_events(connection_id,actor_id,action,reason,metadata)
 VALUES(c.id,p_actor,'configure_quota',trim(p_reason),jsonb_build_object('allocationMode','automatic','allocationPercent',p_percent));
 PERFORM public.zoho_wake_budget_waiters(p_connection);
 RETURN public.zoho_source_quota_status(p_connection);
END $$;

CREATE FUNCTION public.zoho_claim_license_refresh(p_connection uuid,p_lease uuid,p_force boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; q public.zoho_source_quota;
BEGIN
 IF p_lease IS NULL OR p_force IS NULL THEN RAISE EXCEPTION 'Invalid refresh claim'; END IF;
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.status<>'connected' THEN RETURN jsonb_build_object('acquired',false); END IF;
 INSERT INTO public.zoho_source_quota(region,source_org_id) VALUES(c.region,c.source_org_id) ON CONFLICT DO NOTHING;
 SELECT * INTO STRICT q FROM public.zoho_source_quota WHERE region=c.region AND source_org_id=c.source_org_id FOR UPDATE;
 IF q.license_refresh_expires_at>clock_timestamp() OR (NOT p_force AND q.license_next_refresh_at>clock_timestamp()) THEN
  RETURN jsonb_build_object('acquired',false); END IF;
 UPDATE public.zoho_source_quota SET license_refresh_lease=p_lease,license_refresh_connection=c.id,
  license_refresh_expires_at=clock_timestamp()+interval '2 minutes',license_next_refresh_at=clock_timestamp()+interval '15 minutes'
 WHERE region=c.region AND source_org_id=c.source_org_id;
 RETURN jsonb_build_object('acquired',true,'generation',c.credential_generation,'sourceOrgId',c.source_org_id);
END $$;
CREATE FUNCTION public.zoho_finish_license_refresh(p_connection uuid,p_lease uuid,p_generation integer,p_plan text,p_edition text,p_users integer) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections;
BEGIN
 IF p_plan IS NULL OR length(p_plan)>80 OR p_edition IS NULL OR p_edition NOT IN('free','standard','professional','enterprise','unknown')
  OR (p_edition<>'unknown' AND p_users IS NULL) OR p_users<0 OR p_users>1000000 THEN RAISE EXCEPTION 'Invalid license observation'; END IF;
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.status<>'connected' OR c.credential_generation IS DISTINCT FROM p_generation THEN RAISE EXCEPTION 'Source credentials changed' USING ERRCODE='40001'; END IF;
 UPDATE public.zoho_source_quota SET license_plan_type=p_plan,license_edition=p_edition,license_users=p_users,
  license_checked_at=clock_timestamp(),license_next_refresh_at=clock_timestamp()+interval '24 hours',
  license_refresh_lease=NULL,license_refresh_expires_at=NULL,license_refresh_connection=NULL
 WHERE region=c.region AND source_org_id=c.source_org_id AND license_refresh_lease=p_lease
  AND license_refresh_connection=c.id AND license_refresh_expires_at>clock_timestamp();
 IF NOT FOUND THEN RAISE EXCEPTION 'License refresh lease changed' USING ERRCODE='40001'; END IF;
 PERFORM public.zoho_wake_budget_waiters(p_connection);
 RETURN true;
END $$;
CREATE FUNCTION public.zoho_fail_license_refresh(p_connection uuid,p_lease uuid,p_retry_after integer) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 UPDATE public.zoho_source_quota SET license_refresh_lease=NULL,license_refresh_expires_at=NULL,license_refresh_connection=NULL,
  license_next_refresh_at=clock_timestamp()+make_interval(secs=>greatest(60,least(86400,coalesce(p_retry_after,900))))
 WHERE region=c.region AND source_org_id=c.source_org_id AND license_refresh_lease=p_lease AND license_refresh_connection=c.id;
 RETURN FOUND;
END $$;
CREATE FUNCTION public.zoho_due_license_refreshes() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT DISTINCT ON (c.region,c.source_org_id) c.id FROM public.zoho_connections c LEFT JOIN public.zoho_source_quota q
 ON q.region=c.region AND q.source_org_id=c.source_org_id WHERE c.status='connected'
 AND (q.license_next_refresh_at IS NULL OR q.license_next_refresh_at<=now())
 AND (q.license_refresh_expires_at IS NULL OR q.license_refresh_expires_at<=now())
 ORDER BY c.region,c.source_org_id,c.id LIMIT 10;
$$;
REVOKE ALL ON FUNCTION public.zoho_effective_source_allocation(public.zoho_source_quota),public.zoho_wake_budget_waiters(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.zoho_source_quota_status(uuid),public.zoho_reserve_source_quota(uuid,text),public.zoho_configure_source_quota(uuid,integer,integer,uuid,text),
 public.zoho_configure_auto_allocation(uuid,integer,uuid,text),public.zoho_claim_license_refresh(uuid,uuid,boolean),public.zoho_finish_license_refresh(uuid,uuid,integer,text,text,integer),
 public.zoho_fail_license_refresh(uuid,uuid,integer),public.zoho_due_license_refreshes() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_source_quota_status(uuid),public.zoho_reserve_source_quota(uuid,text),public.zoho_configure_source_quota(uuid,integer,integer,uuid,text),
 public.zoho_configure_auto_allocation(uuid,integer,uuid,text),public.zoho_claim_license_refresh(uuid,uuid,boolean),public.zoho_finish_license_refresh(uuid,uuid,integer,text,text,integer),
 public.zoho_fail_license_refresh(uuid,uuid,integer),public.zoho_due_license_refreshes() TO service_role;
COMMIT;
