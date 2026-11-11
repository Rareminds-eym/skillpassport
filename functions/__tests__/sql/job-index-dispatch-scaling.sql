-- Instrument source hashing in a disposable transaction. Fast dispatch and
-- throttled reconciliation must not revisit every job between small batches.
BEGIN;
CREATE SEQUENCE public.test_job_hash_calls;
CREATE OR REPLACE FUNCTION public.job_matching_text(public.opportunities) RETURNS text
LANGUAGE plpgsql VOLATILE AS $$ BEGIN
 PERFORM nextval('public.test_job_hash_calls'); RETURN $1.title;
END $$;
INSERT INTO public.opportunities(id,title,employment_type)
 SELECT gen_random_uuid(),'Scaling fixture '||i,'job' FROM generate_series(1,100) i;
UPDATE public.job_index_control SET last_reconciled_at=NULL;
SELECT public.reconcile_job_index('google/gemini-embedding-2-preview');
SELECT setval('public.test_job_hash_calls',1,false);
DO $$ BEGIN
 FOR i IN 1..25 LOOP
  PERFORM public.reconcile_job_index('google/gemini-embedding-2-preview');
  PERFORM public.job_index_dispatch_status('google/gemini-embedding-2-preview');
 END LOOP;
 ASSERT NOT (SELECT is_called FROM public.test_job_hash_calls),
  'dispatch or throttled reconciliation rescanned source text';
 ASSERT (SELECT count(*)=8 FROM public.claim_job_index('google/gemini-embedding-2-preview',8)),
  'bounded dispatch failed to claim work';
 ASSERT (SELECT last_value<=24 FROM public.test_job_hash_calls),
  'one eight-job claim hashed more than its bounded source window';
END $$;
ROLLBACK;
