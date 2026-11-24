BEGIN;
-- Expose scheduling metadata only; export credentials, artifact keys and leases stay private.
CREATE OR REPLACE FUNCTION public.zoho_bulk_read_snapshot(p_connection uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC,r.id DESC),'[]'::jsonb) FROM (
 SELECT id,module,state,export_page,row_offset,staged_count,issue_count,last_error,next_attempt_at,artifact_cleanup_pending,artifact_write_pending,artifact_expires_at,created_at,completed_at
 FROM public.zoho_bulk_read_runs WHERE connection_id=p_connection ORDER BY created_at DESC,id DESC LIMIT 100) r;
$$;

-- Read-only replenishment estimates: never reset charges, modify allocations or bypass provider cooldowns.
ALTER FUNCTION public.zoho_source_quota_status(uuid) RENAME TO zoho_source_quota_status_before_retry_visibility;
REVOKE ALL ON FUNCTION public.zoho_source_quota_status_before_retry_visibility(uuid) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
CREATE FUNCTION public.zoho_source_quota_status(p_connection uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; status jsonb; observed_at timestamptz:=now();
 next_replenishment timestamptz; read_available timestamptz; deficit bigint; budget integer; usage bigint; cooldown timestamptz;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection;
 status:=public.zoho_source_quota_status_before_retry_visibility(p_connection);
 budget:=(status->>'rolling_budget')::integer; usage:=(status->>'used_units')::bigint;
 cooldown:=(status->>'blocked_until')::timestamptz;
 deficit:=greatest(0,usage+3-budget);
 WITH expiring AS (
  SELECT created_at+interval '24 hours' AS available_at,
   sum(cost) OVER(ORDER BY created_at,id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS released
  FROM public.zoho_source_reservations WHERE region=c.region AND source_org_id=c.source_org_id
   AND created_at>observed_at-interval '24 hours'
 ) SELECT min(available_at),min(available_at) FILTER(WHERE released>=deficit)
 INTO next_replenishment,read_available FROM expiring;
 IF budget<3 THEN read_available:=NULL;
 ELSIF deficit=0 THEN read_available:=greatest(observed_at,cooldown);
 ELSIF read_available IS NOT NULL THEN read_available:=greatest(read_available,cooldown); END IF;
 RETURN status||jsonb_build_object('window_hours',24,'read_cost',3,'read_request_possible',budget>=3,
  'remaining_units',greatest(0,budget-usage),'next_replenishment_at',next_replenishment,'read_available_at',read_available);
END $$;
REVOKE ALL ON FUNCTION public.zoho_source_quota_status(uuid),public.zoho_bulk_read_snapshot(uuid) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_source_quota_status(uuid),public.zoho_bulk_read_snapshot(uuid) TO service_role;
COMMIT;
