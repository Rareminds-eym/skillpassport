BEGIN;
-- Preserve combined totals for existing consumers and add complete per-type totals.
-- Counts are scoped to source and module, independent of review-table pagination.
CREATE OR REPLACE FUNCTION public.zoho_admin_snapshot() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
WITH statuses AS MATERIALIZED (
 SELECT connection_id,module,decision AS state,count(*) AS n
 FROM public.zoho_staged_records GROUP BY connection_id,module,decision
 UNION ALL
 SELECT r.connection_id,r.module,'reconciliation_required',count(*)
 FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id
 WHERE o.state='processing' AND (o.last_error='OUTCOME_UNKNOWN' OR o.lease_expires_at<=now())
 GROUP BY r.connection_id,r.module
), module_totals AS (
 SELECT connection_id,module,jsonb_object_agg(state,n) AS totals FROM statuses GROUP BY connection_id,module
), source_totals AS (
 SELECT connection_id,state,sum(n) AS n FROM statuses GROUP BY connection_id,state
)
SELECT jsonb_build_object(
 'connections',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'sourceOrgId',c.source_org_id,
  'region',c.region,'status',c.status,'publisherOrganizationId',c.publisher_organization_id,'configRevision',c.config_revision,
  'lastDiscoveredAt',c.last_discovered_at,'createdAt',c.created_at) ORDER BY c.created_at) FROM public.zoho_connections c),'[]'::jsonb),
 'countsByConnectionAndModule',coalesce((SELECT jsonb_object_agg(connection_id,totals) FROM (
  SELECT connection_id,jsonb_object_agg(module,totals) AS totals FROM module_totals GROUP BY connection_id
 ) per_connection),'{}'::jsonb),
 'countsByConnection',coalesce((SELECT jsonb_object_agg(connection_id,totals) FROM (
  SELECT connection_id,jsonb_object_agg(state,n) AS totals FROM source_totals GROUP BY connection_id
 ) per_connection),'{}'::jsonb),
 'counts',coalesce((SELECT jsonb_object_agg(state,n) FROM (
  SELECT state,sum(n) AS n FROM statuses GROUP BY state
 ) totals),'{}'::jsonb),
 'emailPolicy','forbidden');
$$;
REVOKE ALL ON FUNCTION public.zoho_admin_snapshot() FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_admin_snapshot() TO service_role;
COMMIT;
