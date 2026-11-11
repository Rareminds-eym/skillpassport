BEGIN;
SET LOCAL lock_timeout='5s';

-- Follow-up for installations that already applied the background outbox.
ALTER TABLE public.job_index_control ADD COLUMN last_reconciled_at timestamptz;
CREATE INDEX job_index_ready_at ON public.job_index_work(next_attempt_at,opportunity_id)
 WHERE state IN ('queued','retry');
CREATE INDEX job_index_lease_at ON public.job_index_work(lease_expires_at,opportunity_id)
 WHERE state='processing';

CREATE OR REPLACE FUNCTION public.enqueue_job_index() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE h text; m text;
BEGIN
 IF NEW.status<>'open' OR NOT coalesce(NEW.is_active,false) OR NEW.employment_type IS NULL
 OR NEW.employment_type='factory_visit' OR (NEW.deadline IS NOT NULL AND NEW.deadline<=now()) THEN
  DELETE FROM public.job_index_work WHERE opportunity_id=NEW.id; RETURN NEW;
 END IF;
 SELECT model INTO m FROM public.job_index_control WHERE singleton;
 h:=md5(public.job_matching_text(NEW));
 IF EXISTS(SELECT 1 FROM public.embeddings WHERE entity_type='opportunity' AND entity_id=NEW.id
  AND model_version=m AND input_hash=h AND embedding IS NOT NULL) THEN
  DELETE FROM public.job_index_work WHERE opportunity_id=NEW.id;
  RETURN NEW;
 END IF;
 INSERT INTO public.job_index_work(opportunity_id,input_hash) VALUES(NEW.id,h)
 ON CONFLICT(opportunity_id) DO UPDATE SET input_hash=EXCLUDED.input_hash,state='queued',attempts=0,
 lease_token=NULL,lease_expires_at=NULL,next_attempt_at=now(),last_error=NULL,updated_at=now()
 WHERE job_index_work.input_hash IS DISTINCT FROM EXCLUDED.input_hash;
 RETURN NEW;
END; $$;
-- Two indexed first-row reads; no job catalogue scan or backlog aggregate.
CREATE FUNCTION public.job_index_dispatch_status(p_model text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.job_index_control WHERE singleton AND model=p_model) THEN
  RAISE EXCEPTION 'JOB_INDEX_MODEL_MISMATCH'; END IF;
 RETURN jsonb_build_object('managed',true,'next_attempt_at',least(
  (SELECT next_attempt_at FROM public.job_index_work WHERE state IN ('queued','retry')
   ORDER BY next_attempt_at,opportunity_id LIMIT 1),
  (SELECT lease_expires_at FROM public.job_index_work WHERE state='processing'
   ORDER BY lease_expires_at,opportunity_id LIMIT 1)));
END; $$;

CREATE OR REPLACE FUNCTION public.reconcile_job_index(p_model text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 -- Serializes dispatchers; source writes and publication retain their normal locks.
 IF NOT pg_try_advisory_xact_lock(17070307) THEN
  RETURN public.job_index_dispatch_status(p_model);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.job_index_control WHERE singleton AND model=p_model) THEN
  RAISE EXCEPTION 'JOB_INDEX_MODEL_MISMATCH'; END IF;
 IF EXISTS(SELECT 1 FROM public.job_index_control WHERE singleton
  AND last_reconciled_at>now()-interval '5 minutes') THEN
  RETURN public.job_index_dispatch_status(p_model);
 END IF;
 DELETE FROM public.job_index_work w WHERE NOT EXISTS(SELECT 1 FROM public.opportunities o
  WHERE o.id=w.opportunity_id AND o.status='open' AND o.is_active AND o.employment_type<>'factory_visit'
  AND (o.deadline IS NULL OR o.deadline>now()));
 DELETE FROM public.job_index_work w USING public.embeddings e, public.opportunities o WHERE e.entity_type='opportunity'
  AND o.id=w.opportunity_id AND e.entity_id=o.id AND e.model_version=p_model AND e.input_hash=md5(public.job_matching_text(o)) AND e.embedding IS NOT NULL;
 INSERT INTO public.job_index_work(opportunity_id,input_hash)
 SELECT o.id,md5(public.job_matching_text(o)) FROM public.opportunities o
 LEFT JOIN public.embeddings e ON e.entity_type='opportunity' AND e.entity_id=o.id
 WHERE o.status='open' AND o.is_active AND o.employment_type<>'factory_visit' AND (o.deadline IS NULL OR o.deadline>now())
 AND (e.embedding IS NULL OR e.model_version IS DISTINCT FROM p_model OR e.input_hash IS DISTINCT FROM md5(public.job_matching_text(o)))
 ON CONFLICT(opportunity_id) DO UPDATE SET input_hash=EXCLUDED.input_hash,state='queued',attempts=0,
 lease_token=NULL,lease_expires_at=NULL,next_attempt_at=now(),last_error=NULL,updated_at=now()
 WHERE job_index_work.input_hash IS DISTINCT FROM EXCLUDED.input_hash;
 UPDATE public.job_index_work SET state='failed',last_error='ATTEMPTS_EXHAUSTED',lease_token=NULL,lease_expires_at=NULL,updated_at=now()
 WHERE state='processing' AND lease_expires_at<=now() AND attempts>=8;
 UPDATE public.job_index_control SET baseline_completed_at=now() WHERE singleton AND baseline_completed_at IS NULL
 AND NOT EXISTS(SELECT 1 FROM public.job_index_work);
 UPDATE public.job_index_control SET last_reconciled_at=now() WHERE singleton;
 RETURN public.job_index_dispatch_status(p_model);
END; $$;

-- Read only a bounded due queue window. Repair its hash from the same source
-- snapshot used for its text, and discard already indexed/ineligible entries.
CREATE OR REPLACE FUNCTION public.claim_job_index(p_model text,p_limit integer DEFAULT 8)
RETURNS TABLE(id uuid,input_text text,input_hash text,lease_token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.job_index_control WHERE singleton AND model=p_model) THEN
  RAISE EXCEPTION 'JOB_INDEX_MODEL_MISMATCH'; END IF;
 UPDATE public.job_index_work SET state='failed',last_error='ATTEMPTS_EXHAUSTED',
  lease_token=NULL,lease_expires_at=NULL,updated_at=now()
 WHERE state='processing' AND lease_expires_at<=now() AND attempts>=8;
 RETURN QUERY WITH due AS MATERIALIZED (
  SELECT w.* FROM public.job_index_work w WHERE w.attempts<8
  AND ((w.state IN ('queued','retry') AND w.next_attempt_at<=now()) OR (w.state='processing' AND w.lease_expires_at<=now()))
  ORDER BY w.next_attempt_at,w.opportunity_id LIMIT least(greatest(p_limit,1),8) FOR UPDATE SKIP LOCKED
 ), source AS MATERIALIZED (
  SELECT d.*,public.job_matching_text(o) AS source_text,md5(public.job_matching_text(o)) AS source_hash,
   coalesce(o.status='open' AND o.is_active AND o.employment_type<>'factory_visit'
    AND (o.deadline IS NULL OR o.deadline>now()),false) AS eligible,
   coalesce(e.embedding IS NOT NULL AND e.model_version=p_model
    AND e.input_hash=md5(public.job_matching_text(o)),false) AS verified
  FROM due d JOIN public.opportunities o ON o.id=d.opportunity_id
  LEFT JOIN public.embeddings e ON e.entity_type='opportunity' AND e.entity_id=o.id
 ), cleaned AS (
  DELETE FROM public.job_index_work w USING source s
  WHERE w.opportunity_id=s.opportunity_id AND (NOT s.eligible OR s.verified)
  RETURNING w.opportunity_id
 ), claimed AS (
  UPDATE public.job_index_work w SET state='processing',input_hash=s.source_hash,
   attempts=CASE WHEN w.input_hash IS DISTINCT FROM s.source_hash THEN 1 ELSE w.attempts+1 END,
   lease_token=gen_random_uuid(),lease_expires_at=now()+interval '10 minutes',updated_at=now()
  FROM source s WHERE w.opportunity_id=s.opportunity_id AND s.eligible AND NOT s.verified
  RETURNING w.*
 ) SELECT c.opportunity_id,s.source_text,c.input_hash,c.lease_token
 FROM claimed c JOIN source s ON s.opportunity_id=c.opportunity_id;
 UPDATE public.job_index_control SET baseline_completed_at=now() WHERE singleton AND baseline_completed_at IS NULL
 AND NOT EXISTS(SELECT 1 FROM public.job_index_work);
END; $$;

CREATE OR REPLACE FUNCTION public.finish_job_index_batch(p_model text,p_results jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r jsonb; w public.job_index_work; published integer:=0; job_id uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.job_index_control WHERE singleton AND model=p_model) THEN
  RAISE EXCEPTION 'JOB_INDEX_MODEL_MISMATCH'; END IF;
 IF jsonb_typeof(p_results) IS DISTINCT FROM 'array' OR jsonb_array_length(p_results)>8 THEN RAISE EXCEPTION 'INVALID_BATCH'; END IF;
 -- Lock EVERY destination before the first publication acquires the catalogue
 -- revision lock. A normal job UPDATE locks its row before that same revision.
 PERFORM o.id FROM public.opportunities o
 WHERE o.id IN (SELECT (value->>'id')::uuid FROM jsonb_array_elements(p_results))
 ORDER BY o.id FOR UPDATE;
 FOR r IN SELECT value FROM jsonb_array_elements(p_results) ORDER BY value->>'id' LOOP
  job_id:=(r->>'id')::uuid;
  SELECT * INTO w FROM public.job_index_work WHERE opportunity_id=job_id FOR UPDATE;
  IF NOT FOUND OR w.state<>'processing' OR w.lease_token IS DISTINCT FROM (r->>'lease_token')::uuid
   OR w.input_hash IS DISTINCT FROM r->>'input_hash' OR w.lease_expires_at<=now() THEN CONTINUE; END IF;
  IF r ? 'embedding' AND public.publish_job_matching_vector(job_id,p_model,w.input_hash,(r->>'embedding')::extensions.vector) THEN
   DELETE FROM public.job_index_work WHERE opportunity_id=job_id;
   published:=published+1;
  ELSE
   UPDATE public.job_index_work SET state=CASE WHEN attempts>=8 AND coalesce(r->>'error','PUBLICATION_REJECTED')<>'RATE_LIMITED' THEN 'failed' ELSE 'retry' END,
    attempts=CASE WHEN r->>'error'='RATE_LIMITED' THEN greatest(0,attempts-1) ELSE attempts END,
    next_attempt_at=now()+make_interval(secs=>CASE WHEN r->>'error'='RATE_LIMITED' THEN greatest(60,least(86400,coalesce((r->>'retry_after_seconds')::integer,60))) ELSE least(3600,15*power(2,least(attempts,8))::integer) END),
    last_error=CASE WHEN r->>'error' IN ('RATE_LIMITED','PROVIDER_UNAVAILABLE','MODEL_MISMATCH','INVALID_VECTOR') THEN r->>'error' ELSE 'PUBLICATION_REJECTED' END,
    lease_token=NULL,lease_expires_at=NULL,updated_at=now() WHERE opportunity_id=job_id;
  END IF;
 END LOOP;
 UPDATE public.job_index_control SET baseline_completed_at=now() WHERE singleton AND baseline_completed_at IS NULL
 AND NOT EXISTS(SELECT 1 FROM public.job_index_work);
 RETURN published;
END; $$;

REVOKE ALL ON FUNCTION public.job_index_dispatch_status(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.job_index_dispatch_status(text) TO service_role;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='zoho_discovery') THEN
 REVOKE ALL ON FUNCTION public.job_index_dispatch_status(text) FROM zoho_discovery;
END IF; END $$;
SELECT public.reconcile_job_index('google/gemini-embedding-2-preview');
COMMIT;
