BEGIN;
-- Observability only: this marker never authorizes execution, retries, or receipt completion.
ALTER TABLE public.zoho_approved_operations ADD COLUMN destination_phase text
 CHECK(destination_phase IS NULL OR destination_phase='projection_pending');
CREATE FUNCTION public.zoho_note_candidate_projection_pending(p_operation uuid,p_lease uuid,p_source_hash text,p_target uuid,p_receipt uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF p_operation IS NULL OR p_lease IS NULL OR p_target IS NULL OR p_receipt IS NULL
  OR p_source_hash IS NULL OR p_source_hash !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
 UPDATE public.zoho_approved_operations SET destination_phase='projection_pending',last_error='OUTCOME_UNKNOWN'
 WHERE id=p_operation AND lease_token=p_lease AND source_hash=p_source_hash AND state='processing'
  AND action='provision_candidate' AND (expected_target_id IS NULL OR expected_target_id=p_target);
 RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_note_candidate_projection_pending(uuid,uuid,text,uuid,uuid) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_note_candidate_projection_pending(uuid,uuid,text,uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.zoho_schedule_reconciliation(p_actions text[]) RETURNS TABLE(id uuid)
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
    ORDER BY o.next_reconcile_at,o.id LIMIT 100 FOR UPDATE SKIP LOCKED
  ) UPDATE public.zoho_approved_operations o SET next_reconcile_at=clock_timestamp()+interval '2 minutes'
    FROM due WHERE o.id=due.id RETURNING o.id;
END;
$$;

REVOKE ALL ON FUNCTION public.zoho_schedule_reconciliation(text[]) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_schedule_reconciliation(text[]) TO service_role;
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
   WHEN o.state='processing' AND o.destination_phase='projection_pending' THEN 'syncing'
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
  'syncing',count(*) FILTER(WHERE category='syncing'),
  'retrying',count(*) FILTER(WHERE category='retrying'),
  'attention',count(*) FILTER(WHERE category='attention'),
  'overdue',count(*) FILTER(WHERE state IN ('queued','failed') AND next_attempt_at<now()-interval '10 minutes'
    OR state='processing' AND lease_expires_at<now()-interval '10 minutes'),
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
