BEGIN;

-- Advisory read-only checks for the approval preview. The publisher retains its
-- transactional organization lock and rechecks entitlement/capacity on writes.
CREATE FUNCTION public.zoho_job_publishing_preflight(p_connection uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE publisher uuid; feature uuid; plan uuid; numeric_limit numeric; enabled_value boolean:=false;
 addon numeric:=0; active_count bigint; pending_count bigint; targets jsonb; remaining numeric;
BEGIN
 SELECT publisher_organization_id INTO STRICT publisher FROM public.zoho_connections WHERE id=p_connection;
 SELECT count(*) INTO active_count FROM public.opportunities WHERE organization_id=publisher AND (is_active OR status='open');
 SELECT count(DISTINCT op.record_id) INTO pending_count FROM public.zoho_approved_operations op
 JOIN public.zoho_staged_records r ON r.id=op.record_id JOIN public.zoho_connections c ON c.id=r.connection_id
 JOIN public.zoho_job_publisher_policies p ON p.connection_id=c.id
 WHERE c.publisher_organization_id=publisher AND op.action='apply_job'
 AND op.config_revision=c.config_revision AND op.record_revision=r.revision AND p.enabled AND p.no_email_reviewed AND p.config_revision=c.config_revision
 AND NOT EXISTS(SELECT 1 FROM public.zoho_job_receipts receipt WHERE receipt.operation_id=op.id)
 AND op.state IN ('queued','processing','reconciliation_required') AND op.expires_at>clock_timestamp()
 AND p.status_map->>(op.approved_data->>'source_status')='open'
 AND NOT EXISTS(SELECT 1 FROM public.opportunities o WHERE o.id=op.expected_target_id AND o.organization_id=publisher AND o.is_active AND o.status='open');
 SELECT coalesce(jsonb_agg(o.id),'[]'::jsonb) INTO targets
 FROM public.zoho_staged_records r JOIN public.zoho_job_links l ON l.record_id=r.id
 JOIN public.opportunities o ON o.id=l.target_id AND o.organization_id=publisher
 WHERE r.connection_id=p_connection AND r.module='Job_Openings' AND r.decision='pending_approval'
 AND o.is_active AND o.status='open';
 SELECT id INTO feature FROM public.features WHERE feature_key='active_job_posts';
 IF feature IS NOT NULL THEN
  SELECT value_numeric,coalesce(is_enabled,false) INTO numeric_limit,enabled_value FROM public.tenant_entitlement_overrides
   WHERE tenant_id=publisher AND feature_id=feature AND (expires_at IS NULL OR expires_at>clock_timestamp()) ORDER BY updated_at DESC LIMIT 1;
  IF NOT FOUND THEN
   SELECT coalesce(s.plan_id,p.id) INTO plan FROM public.subscription_cache s LEFT JOIN public.plans_cache p ON p.plan_code=s.plan_code
    WHERE (s.organization_id=publisher OR s.user_id=publisher) AND s.status='active' ORDER BY s.created_at DESC LIMIT 1;
   SELECT value_numeric,coalesce(is_enabled,false) INTO numeric_limit,enabled_value FROM public.plan_entitlements
    WHERE (plan_id=plan OR plan_id=(SELECT parent_plan_id FROM public.plans_cache WHERE id=plan)) AND feature_id=feature
    ORDER BY (plan_id=plan) DESC LIMIT 1;
  END IF;
 END IF;
 IF coalesce(enabled_value,false) THEN
  SELECT coalesce(sum(quantity),0) INTO addon FROM public.get_addon_numeric_grants(publisher) WHERE feature_key='active_job_posts';
  remaining:=CASE WHEN numeric_limit IS NULL THEN NULL WHEN numeric_limit<0 THEN 0 ELSE greatest(0,numeric_limit+addon-active_count-pending_count) END;
 ELSE remaining:=0;
 END IF;
 RETURN jsonb_build_object('entitlementReady',coalesce(enabled_value,false),'remainingSlots',remaining,
  'activeJobs',active_count,'pendingOpenJobs',pending_count,'activeTargetIds',targets,'reasonCode',CASE WHEN NOT coalesce(enabled_value,false) THEN 'PUBLISHING_ENTITLEMENT_UNAVAILABLE'
   WHEN remaining=0 THEN 'PUBLISHING_CAPACITY_EXHAUSTED' ELSE NULL END);
END $$;
REVOKE ALL ON FUNCTION public.zoho_job_publishing_preflight(uuid) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_job_publishing_preflight(uuid) TO service_role;
COMMIT;
