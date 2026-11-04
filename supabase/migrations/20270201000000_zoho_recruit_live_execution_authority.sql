BEGIN;
-- Read-only live-claim authority for canonical services. It cannot claim, approve or mutate.
CREATE FUNCTION public.zoho_is_live_approved_operation(p_grant jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF jsonb_typeof(p_grant) IS DISTINCT FROM 'object' OR p_grant->'claimed' IS DISTINCT FROM 'true'::jsonb
    OR p_grant->>'emailPolicy' IS DISTINCT FROM 'forbidden' THEN RETURN false; END IF;
  RETURN EXISTS(
    SELECT 1 FROM public.zoho_approved_operations o
    JOIN public.zoho_staged_records r ON r.id=o.record_id
    JOIN public.zoho_connections c ON c.id=r.connection_id
    JOIN public.zoho_approval_batches b ON b.id=o.batch_id
    JOIN public.zoho_execution_attempts a ON a.id=o.lease_token AND a.operation_id=o.id
    WHERE o.id=(p_grant->>'operationId')::uuid AND o.state='processing'
      AND o.lease_token=(p_grant->>'lease')::uuid AND o.lease_expires_at>statement_timestamp()
      AND o.last_error IS DISTINCT FROM 'OUTCOME_UNKNOWN'
      AND o.lease_expires_at=(p_grant->>'leaseExpiresAt')::timestamptz
      AND o.expires_at=(p_grant->>'approvalExpiresAt')::timestamptz AND o.expires_at>statement_timestamp()
      AND b.actor_id=(p_grant->>'actorId')::uuid AND b.decision='approve'
      AND c.id=(p_grant->>'connectionId')::uuid AND c.status='connected'
      AND c.source_org_id=p_grant->>'sourceOrgId' AND c.publisher_organization_id=(p_grant->>'publisherOrganizationId')::uuid
      AND c.config_revision=o.config_revision AND r.config_revision=o.config_revision
      AND o.config_revision=(p_grant->>'configRevision')::integer
      AND r.id=(p_grant->>'recordId')::uuid AND r.revision=o.record_revision AND o.record_revision=(p_grant->>'revision')::integer
      AND r.source_hash=o.source_hash AND o.source_hash=p_grant->>'sourceHash'
      AND r.proposed_data=o.approved_data AND o.approved_data=p_grant->'data'
      AND r.decision='processing' AND r.execution_state='processing' AND jsonb_array_length(r.validation_errors)=0
      AND o.action=p_grant->>'action' AND r.module=p_grant->>'module' AND r.external_id=p_grant->>'externalId'
      AND p_grant ? 'targetId' AND to_jsonb(o)->'expected_target_id'=p_grant->'targetId'
  );
EXCEPTION WHEN invalid_text_representation OR datetime_field_overflow OR numeric_value_out_of_range THEN RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_is_live_approved_operation(jsonb) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_is_live_approved_operation(jsonb) TO service_role;
COMMIT;
