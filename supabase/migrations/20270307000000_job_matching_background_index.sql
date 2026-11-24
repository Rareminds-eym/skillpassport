BEGIN;
SET LOCAL lock_timeout='5s';

-- Transactional outbox: only derived search data is produced. No mail, job
-- approval, publication, or organization entitlement is changed here.
CREATE TABLE public.job_index_control (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 model text NOT NULL CHECK(length(btrim(model))>0),
 baseline_completed_at timestamptz
);
INSERT INTO public.job_index_control(singleton,model)
 VALUES(true,'google/gemini-embedding-2-preview');
CREATE TABLE public.job_index_work (
 opportunity_id uuid PRIMARY KEY REFERENCES public.opportunities(id) ON DELETE CASCADE,
 input_hash text NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','processing','retry','failed')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 lease_token uuid,
 lease_expires_at timestamptz,
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 last_error text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX job_index_work_due ON public.job_index_work(next_attempt_at,opportunity_id)
 WHERE state IN ('queued','retry','processing');
REVOKE ALL ON public.job_index_control,public.job_index_work FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.job_index_control,public.job_index_work TO service_role;

CREATE FUNCTION public.enqueue_job_index() RETURNS trigger
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
  AND model_version=m AND input_hash=h AND embedding IS NOT NULL) THEN RETURN NEW; END IF;
 INSERT INTO public.job_index_work(opportunity_id,input_hash) VALUES(NEW.id,h)
 ON CONFLICT(opportunity_id) DO UPDATE SET input_hash=EXCLUDED.input_hash,state='queued',attempts=0,
 lease_token=NULL,lease_expires_at=NULL,next_attempt_at=now(),last_error=NULL,updated_at=now()
 WHERE job_index_work.input_hash IS DISTINCT FROM EXCLUDED.input_hash;
 RETURN NEW;
END; $$;
CREATE TRIGGER job_index_outbox AFTER INSERT OR UPDATE ON public.opportunities
 FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_index();

CREATE FUNCTION public.reconcile_job_index(p_model text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 -- Serializes dispatchers; source writes and publication retain their normal locks.
 PERFORM pg_advisory_xact_lock(17070307);
 IF NOT EXISTS(SELECT 1 FROM public.job_index_control WHERE singleton AND model=p_model) THEN
  RAISE EXCEPTION 'JOB_INDEX_MODEL_MISMATCH'; END IF;
 DELETE FROM public.job_index_work w WHERE NOT EXISTS(SELECT 1 FROM public.opportunities o
  WHERE o.id=w.opportunity_id AND o.status='open' AND o.is_active AND o.employment_type<>'factory_visit'
  AND (o.deadline IS NULL OR o.deadline>now()));
 DELETE FROM public.job_index_work w USING public.embeddings e WHERE e.entity_type='opportunity'
  AND e.entity_id=w.opportunity_id AND e.model_version=p_model AND e.input_hash=w.input_hash AND e.embedding IS NOT NULL;
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
 RETURN public.job_matching_index_status(p_model);
END; $$;

CREATE FUNCTION public.claim_job_index(p_model text,p_limit integer DEFAULT 8)
RETURNS TABLE(id uuid,input_text text,input_hash text,lease_token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.job_index_control WHERE singleton AND model=p_model) THEN
  RAISE EXCEPTION 'JOB_INDEX_MODEL_MISMATCH'; END IF;
 RETURN QUERY WITH due AS (
  SELECT w.opportunity_id FROM public.job_index_work w WHERE w.attempts<8
  AND ((w.state IN ('queued','retry') AND w.next_attempt_at<=now()) OR (w.state='processing' AND w.lease_expires_at<=now()))
  ORDER BY w.next_attempt_at,w.opportunity_id LIMIT least(greatest(p_limit,1),8) FOR UPDATE SKIP LOCKED
 ), claimed AS (
  UPDATE public.job_index_work w SET state='processing',attempts=w.attempts+1,lease_token=gen_random_uuid(),
   lease_expires_at=now()+interval '10 minutes',updated_at=now()
  FROM due WHERE w.opportunity_id=due.opportunity_id RETURNING w.*
 ) SELECT c.opportunity_id,public.job_matching_text(o),c.input_hash,c.lease_token
 FROM claimed c JOIN public.opportunities o ON o.id=c.opportunity_id;
END; $$;

-- One transaction makes a whole batch visible and avoids continuous catalogue
-- revision changes while provider requests are in flight. Opp -> work is also
-- the lock order used by the source-write trigger.
CREATE FUNCTION public.finish_job_index_batch(p_model text,p_results jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r jsonb; w public.job_index_work; published integer:=0; job_id uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.job_index_control WHERE singleton AND model=p_model) THEN
  RAISE EXCEPTION 'JOB_INDEX_MODEL_MISMATCH'; END IF;
 IF jsonb_typeof(p_results)<>'array' OR jsonb_array_length(p_results)>8 THEN RAISE EXCEPTION 'INVALID_BATCH'; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(p_results) ORDER BY value->>'id' LOOP
  job_id:=(r->>'id')::uuid;
  PERFORM 1 FROM public.opportunities WHERE id=job_id FOR UPDATE;
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

CREATE OR REPLACE FUNCTION public.job_matching_index_status(p_model text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH counts AS (
 SELECT count(*) AS total,count(*) FILTER(WHERE e.embedding IS NOT NULL AND e.model_version=p_model
  AND e.input_hash=md5(public.job_matching_text(o))) AS verified
 FROM public.opportunities o LEFT JOIN public.embeddings e ON e.entity_type='opportunity' AND e.entity_id=o.id
 WHERE o.status='open' AND o.is_active AND o.employment_type<>'factory_visit' AND (o.deadline IS NULL OR o.deadline>now())
 ) SELECT jsonb_build_object('total',c.total,'verified',c.verified,
 'baseline_ready',coalesce(k.baseline_completed_at IS NOT NULL,false) AND k.model=p_model,
 'managed',k.model=p_model,'failed',(SELECT count(*) FROM public.job_index_work w JOIN public.opportunities o ON o.id=w.opportunity_id
 LEFT JOIN public.embeddings e ON e.entity_type='opportunity' AND e.entity_id=o.id
 WHERE w.state='failed' AND o.status='open' AND o.is_active AND o.employment_type<>'factory_visit'
 AND (o.deadline IS NULL OR o.deadline>now()) AND (e.embedding IS NULL OR e.model_version IS DISTINCT FROM p_model
 OR e.input_hash IS DISTINCT FROM md5(public.job_matching_text(o)))),
 'next_attempt_at',(SELECT min(CASE WHEN state='processing' THEN lease_expires_at ELSE next_attempt_at END)
  FROM public.job_index_work WHERE state<>'failed')) FROM counts c CROSS JOIN public.job_index_control k WHERE k.singleton;
$$;

CREATE FUNCTION public.zoho_job_index_progress(p_connection_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT jsonb_build_object('total',count(*),'verified',count(*) FILTER(WHERE e.embedding IS NOT NULL
 AND e.model_version=k.model AND e.input_hash=md5(public.job_matching_text(o))),
 'queued',count(*) FILTER(WHERE w.state='queued' AND (e.embedding IS NULL OR e.model_version IS DISTINCT FROM k.model OR e.input_hash IS DISTINCT FROM md5(public.job_matching_text(o)))),'processing',count(*) FILTER(WHERE w.state='processing' AND (e.embedding IS NULL OR e.model_version IS DISTINCT FROM k.model OR e.input_hash IS DISTINCT FROM md5(public.job_matching_text(o)))),
 'retry',count(*) FILTER(WHERE w.state='retry' AND (e.embedding IS NULL OR e.model_version IS DISTINCT FROM k.model OR e.input_hash IS DISTINCT FROM md5(public.job_matching_text(o)))),'failed',count(*) FILTER(WHERE w.state='failed' AND (e.embedding IS NULL OR e.model_version IS DISTINCT FROM k.model OR e.input_hash IS DISTINCT FROM md5(public.job_matching_text(o)))))
 FROM public.zoho_job_links l JOIN public.zoho_staged_records r ON r.id=l.record_id
 JOIN public.opportunities o ON o.id=l.target_id CROSS JOIN public.job_index_control k
 LEFT JOIN public.embeddings e ON e.entity_type='opportunity' AND e.entity_id=o.id
 LEFT JOIN public.job_index_work w ON w.opportunity_id=o.id
 WHERE r.connection_id=p_connection_id AND o.status='open' AND o.is_active AND o.employment_type<>'factory_visit'
 AND (o.deadline IS NULL OR o.deadline>now());
$$;

CREATE FUNCTION public.retry_zoho_job_index(p_connection_id uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE affected integer;
BEGIN
 UPDATE public.job_index_work w SET state='queued',attempts=0,next_attempt_at=now(),last_error=NULL,updated_at=now()
 FROM public.zoho_job_links l JOIN public.zoho_staged_records r ON r.id=l.record_id
 WHERE l.target_id=w.opportunity_id AND r.connection_id=p_connection_id AND w.state='failed';
 GET DIAGNOSTICS affected = ROW_COUNT;
 RETURN affected;
END; $$;
REVOKE ALL ON FUNCTION public.retry_zoho_job_index(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.retry_zoho_job_index(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.enqueue_job_index(),public.reconcile_job_index(text),public.claim_job_index(text,integer),
 public.finish_job_index_batch(text,jsonb),public.job_matching_index_status(text),public.zoho_job_index_progress(uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_job_index(text),public.claim_job_index(text,integer),
 public.finish_job_index_batch(text,jsonb),public.job_matching_index_status(text),public.zoho_job_index_progress(uuid) TO service_role;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='zoho_discovery') THEN
 REVOKE ALL ON public.job_index_control,public.job_index_work FROM zoho_discovery;
 REVOKE ALL ON FUNCTION public.retry_zoho_job_index(uuid) FROM zoho_discovery;
 REVOKE ALL ON FUNCTION public.enqueue_job_index(),public.reconcile_job_index(text),public.claim_job_index(text,integer),
 public.finish_job_index_batch(text,jsonb),public.job_matching_index_status(text),public.zoho_job_index_progress(uuid) FROM zoho_discovery;
END IF; END $$;
SELECT public.reconcile_job_index('google/gemini-embedding-2-preview');
COMMIT;
