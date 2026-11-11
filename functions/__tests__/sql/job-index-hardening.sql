-- Disposable database only. Work must describe the current source, including
-- when an operator restores content whose original vector is still valid.
DO $$
DECLARE a uuid:=gen_random_uuid(); c record; stale jsonb; n integer;
 model text:='google/gemini-embedding-2-preview';
 vector_text text:='['||array_to_string(array_fill(1,ARRAY[1536]),',')||']';
BEGIN
 INSERT INTO public.opportunities(id,title,employment_type) VALUES(a,'Original content','job');
 SELECT * INTO c FROM public.claim_job_index(model,1);
 ASSERT c.id=a,'unexpected pending work in isolated fixture';
 ASSERT public.finish_job_index_batch(model,jsonb_build_array(jsonb_build_object(
  'id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,'embedding',vector_text)))=1;
 UPDATE public.opportunities SET title='Edited content' WHERE id=a;
 SELECT * INTO c FROM public.claim_job_index(model,1);
 stale:=jsonb_build_object('id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,'embedding',vector_text);
 UPDATE public.opportunities SET title='Original content' WHERE id=a;
 ASSERT NOT EXISTS(SELECT 1 FROM public.job_index_work WHERE opportunity_id=a),
  'restoring indexed content retained obsolete leased work';
 ASSERT public.finish_job_index_batch(model,jsonb_build_array(stale))=0,
  'restoring indexed content accepted an obsolete lease';
 ASSERT (SELECT input_hash=md5('Original content') FROM public.embeddings WHERE entity_type='opportunity' AND entity_id=a),
  'restored source lost its verified vector';

 -- Simulate an obsolete row left behind by the previous implementation. Reset
 -- the periodic gate explicitly so this call exercises full reconciliation.
 INSERT INTO public.job_index_work(opportunity_id,input_hash,state,attempts)
 VALUES(a,md5('Edited content'),'failed',8);
 UPDATE public.job_index_control SET last_reconciled_at=NULL;
 PERFORM public.reconcile_job_index(model);
 ASSERT NOT EXISTS(SELECT 1 FROM public.job_index_work WHERE opportunity_id=a),
  'reconciliation retained stale work although current content is indexed';
 ASSERT (SELECT last_reconciled_at IS NOT NULL FROM public.job_index_control),
  'full reconciliation did not record its periodic gate';

 -- Cached reconciliation must not revive unchanged terminal failures.
 UPDATE public.opportunities SET title='New content' WHERE id=a;
 UPDATE public.job_index_work SET state='failed',attempts=8 WHERE opportunity_id=a;
 PERFORM public.reconcile_job_index(model);
 ASSERT (SELECT state='failed' AND attempts=8 FROM public.job_index_work WHERE opportunity_id=a),
  'periodic reconciliation revived unchanged terminal failure';
 UPDATE public.job_index_work SET state='queued',attempts=0,next_attempt_at=now() WHERE opportunity_id=a;
 SELECT * INTO c FROM public.claim_job_index(model,1);
 stale:=jsonb_build_object('id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,'embedding',vector_text);
 UPDATE public.opportunities SET title='Newer content' WHERE id=a;
 ASSERT public.finish_job_index_batch(model,jsonb_build_array(stale))=0,
  'hardening weakened the source-hash fence';
 SELECT * INTO c FROM public.claim_job_index(model,1);
 stale:=jsonb_build_object('id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,'embedding',vector_text);
 UPDATE public.job_index_work SET lease_expires_at=now()-interval '1 second' WHERE opportunity_id=a;
 ASSERT public.finish_job_index_batch(model,jsonb_build_array(stale))=0,
  'hardening weakened the lease-expiry fence';
 SELECT * INTO c FROM public.claim_job_index(model,1);
 stale:=jsonb_build_object('id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,'embedding',vector_text);
 ASSERT public.finish_job_index_batch(model,jsonb_build_array(stale))=1;
 ASSERT public.finish_job_index_batch(model,jsonb_build_array(stale))=0,
  'completed batch redelivery was not idempotent';
 ASSERT NOT has_function_privilege('authenticated','public.job_index_dispatch_status(text)','EXECUTE');
 ASSERT NOT has_function_privilege('anon','public.job_index_dispatch_status(text)','EXECUTE');
 DELETE FROM public.opportunities WHERE id=a;
END $$;
