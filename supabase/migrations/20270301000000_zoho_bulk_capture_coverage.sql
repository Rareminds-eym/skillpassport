BEGIN;

CREATE OR REPLACE FUNCTION public.zoho_bulk_sync_progress() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 -- Recruit Bulk Read does not document converted/approval coverage controls.
 -- An export is a staging accelerator, not proof that both REST streams were
 -- fully captured. Complete the canonical REST pass before moving the watermark.
 UPDATE public.zoho_discovery_runs SET
 transport=CASE WHEN NEW.state IN ('failed','completed','completed_with_exceptions') THEN 'rest' ELSE transport END,
 transport_phase=CASE WHEN NEW.state IN ('failed','completed','completed_with_exceptions') THEN NULL ELSE NEW.state END,
 state=CASE WHEN NEW.state IN ('failed','completed','completed_with_exceptions') THEN 'queued' ELSE 'running' END,
 capture_complete=false,
 received_count=CASE WHEN NEW.state IN ('failed','completed','completed_with_exceptions') THEN 0 ELSE least(2147483647,NEW.staged_count+NEW.issue_count)::integer END,
 staged_count=CASE WHEN NEW.state IN ('failed','completed','completed_with_exceptions') THEN 0 ELSE least(2147483647,NEW.staged_count)::integer END,
 next_page=CASE WHEN NEW.state IN ('failed','completed','completed_with_exceptions') THEN 1 ELSE 1+ceil((NEW.staged_count+NEW.issue_count)::numeric/(CASE NEW.module WHEN 'Job_Openings' THEN 20 ELSE 200 END))::integer END,
 next_attempt_at=CASE WHEN NEW.state IN ('failed','completed','completed_with_exceptions') THEN clock_timestamp() ELSE greatest(clock_timestamp(),NEW.next_attempt_at) END,
 last_error=CASE WHEN NEW.state='failed' THEN 'BULK_FALLBACK_REST' WHEN NEW.state IN ('completed','completed_with_exceptions') THEN 'BULK_COVERAGE_VERIFY' ELSE NEW.last_error END,
 completed_at=NULL
 WHERE bulk_run_id=NEW.id AND transport='bulk' AND control_state='active' AND state IN ('queued','running');
 RETURN NEW;
END;
$$;

-- Previously staged exports alone are not a canonical REST coverage proof.
UPDATE public.zoho_discovery_runs SET capture_complete=false
 WHERE transport='bulk' AND bulk_run_id IS NOT NULL AND capture_complete;

COMMIT;
