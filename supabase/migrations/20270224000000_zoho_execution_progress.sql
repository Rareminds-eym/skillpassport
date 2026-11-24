BEGIN;
-- One read-only snapshot across every approved operation, independent of history pagination.
CREATE OR REPLACE FUNCTION public.zoho_execution_progress(p_connection uuid,p_module text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
 IF p_connection IS NULL OR p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings') THEN
  RAISE EXCEPTION 'Invalid execution progress scope' USING ERRCODE='22023';
 END IF;
 WITH classified AS (
  SELECT o.*,CASE
   WHEN o.state='completed' THEN 'completed'
   WHEN o.state='processing' THEN CASE
    WHEN o.last_error='OUTCOME_UNKNOWN' OR o.lease_expires_at IS NULL OR o.lease_expires_at<=now() THEN 'checking'
    ELSE 'processing' END
   WHEN o.state IN ('queued','failed') AND o.expires_at>now() AND o.execution_attempts<8 THEN
    CASE WHEN o.state='queued' THEN 'queued' ELSE 'retrying' END
   ELSE 'attention' END AS category
  FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id
  WHERE r.connection_id=p_connection AND r.module=p_module
   AND o.action=CASE WHEN p_module='Candidates' THEN 'provision_candidate' ELSE 'apply_job' END
 ) SELECT jsonb_build_object(
  'connectionId',p_connection,'module',p_module,'checkedAt',now(),'total',count(*),
  'completed',count(*) FILTER(WHERE category='completed'),
  'queued',count(*) FILTER(WHERE category='queued'),
  'processing',count(*) FILTER(WHERE category='processing'),
  'checking',count(*) FILTER(WHERE category='checking'),
  'retrying',count(*) FILTER(WHERE category='retrying'),
  'attention',count(*) FILTER(WHERE category='attention'),
  'expired',count(*) FILTER(WHERE state IN ('queued','failed') AND expires_at<=now()),
  'exhausted',count(*) FILTER(WHERE state IN ('queued','failed') AND execution_attempts>=8),
  'nextRetryAt',min(next_attempt_at) FILTER(WHERE category IN ('queued','retrying') AND next_attempt_at>now()),
  'emailPolicy','forbidden') INTO result FROM classified;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_execution_progress(uuid,text) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_execution_progress(uuid,text) TO service_role;
COMMIT;
