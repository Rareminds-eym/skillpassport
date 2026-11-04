BEGIN;
-- Integration-owned approval state only. Processing/unknown effects must be reconciled.
UPDATE public.zoho_staged_records r SET revision=r.revision+1,decision='pending_approval',execution_state='not_approved',updated_at=now()
FROM public.zoho_approved_operations o WHERE o.record_id=r.id AND o.record_revision=r.revision
  AND o.action='provision_candidate' AND o.candidate_review_hash IS NULL AND o.state IN ('queued','failed');
UPDATE public.zoho_approved_operations SET state='approval_stale'
WHERE action='provision_candidate' AND candidate_review_hash IS NULL AND state IN ('queued','failed');
COMMIT;
