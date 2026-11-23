-- Disposable database only; exercises durable queue behavior with real Postgres.
DO $$
DECLARE a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); visit uuid:=gen_random_uuid();
 c record; old_claim jsonb; n integer; model text:='google/gemini-embedding-2-preview';
 vector_text text:='['||array_to_string(array_fill(1,ARRAY[1536]),',')||']';
BEGIN
 ASSERT (public.job_matching_index_status(model)->>'baseline_ready')::boolean;
 INSERT INTO public.opportunities(id,title,employment_type) VALUES(a,'Engineer','job'),(b,'Designer','job'),(visit,'Visit','factory_visit');
 ASSERT (SELECT count(*)=2 FROM public.job_index_work),'visits must not be queued';
 ASSERT (public.job_matching_index_status(model)->>'baseline_ready')::boolean,'later imports must preserve baseline availability';
 SELECT * INTO c FROM public.claim_job_index(model,1);
 old_claim:=jsonb_build_object('id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,'embedding',vector_text);
 ASSERT (SELECT count(*)=1 FROM public.claim_job_index(model,8)),'an active lease must not be claimed twice';
 -- An identical write must preserve a lease and retry budget.
 UPDATE public.opportunities SET title=title WHERE id=c.id;
 ASSERT (SELECT lease_token=c.lease_token FROM public.job_index_work WHERE opportunity_id=c.id);
 UPDATE public.opportunities SET title=title||' changed' WHERE id=c.id;
 ASSERT public.finish_job_index_batch(model,jsonb_build_array(old_claim))=0,'stale source accepted';
 ASSERT (SELECT attempts=0 AND state='queued' FROM public.job_index_work WHERE opportunity_id=c.id);
 SELECT * INTO c FROM public.claim_job_index(model,1);
 old_claim:=jsonb_build_object('id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,'embedding',vector_text);
 UPDATE public.job_index_work SET lease_expires_at=now()-interval '1 second' WHERE opportunity_id=c.id;
 ASSERT public.finish_job_index_batch(model,jsonb_build_array(old_claim))=0,'expired lease published';
 SELECT * INTO c FROM public.claim_job_index(model,1);
 old_claim:=jsonb_build_object('id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,'embedding',vector_text);
 ASSERT public.finish_job_index_batch(model,jsonb_build_array(old_claim))=1,'valid claim not published';
 ASSERT public.finish_job_index_batch(model,jsonb_build_array(old_claim))=0,'redelivery published twice';
 -- Crash recovery, throttling and terminal errors.
 UPDATE public.job_index_work SET lease_expires_at=now()-interval '1 second';
 SELECT * INTO c FROM public.claim_job_index(model,1);
 n:=(SELECT attempts FROM public.job_index_work WHERE opportunity_id=c.id);
 PERFORM public.finish_job_index_batch(model,jsonb_build_array(jsonb_build_object('id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,'error','RATE_LIMITED','retry_after_seconds',120)));
 ASSERT (SELECT state='retry' AND attempts=n-1 AND next_attempt_at>=now()+interval '120 seconds' FROM public.job_index_work WHERE opportunity_id=c.id),'throttling burned retry budget';
 UPDATE public.job_index_work SET next_attempt_at=now(),attempts=7 WHERE opportunity_id=c.id;
 SELECT * INTO c FROM public.claim_job_index(model,1);
 PERFORM public.finish_job_index_batch(model,jsonb_build_array(jsonb_build_object('id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,'error','PROVIDER_UNAVAILABLE')));
 PERFORM public.reconcile_job_index(model);
 ASSERT (SELECT state='failed' AND attempts=8 FROM public.job_index_work WHERE opportunity_id=c.id),'terminal failure resurrected';
 UPDATE public.opportunities SET status='closed' WHERE id=c.id;
 ASSERT NOT EXISTS(SELECT 1 FROM public.job_index_work WHERE opportunity_id=c.id),'closed job retained';
 BEGIN PERFORM public.claim_job_index('wrong-model',8); RAISE EXCEPTION 'wrong model accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'JOB_INDEX_MODEL_MISMATCH' THEN RAISE; END IF; END;
 ASSERT NOT has_function_privilege('authenticated','public.claim_job_index(text,integer)','EXECUTE');
 ASSERT NOT has_table_privilege('anon','public.job_index_work','SELECT');
 INSERT INTO public.zoho_staged_records(id,connection_id) VALUES(a,a),(b,b);
 INSERT INTO public.zoho_job_links(record_id,target_id) VALUES(a,a),(b,b);
 UPDATE public.opportunities SET status='open' WHERE id IN (a,b);
 INSERT INTO public.job_index_work(opportunity_id,input_hash,state,attempts)
 SELECT o.id,md5(public.job_matching_text(o)),'failed',8 FROM public.opportunities o WHERE id IN (a,b)
 ON CONFLICT(opportunity_id) DO UPDATE SET state='failed',attempts=8;
 ASSERT public.retry_zoho_job_index(a)=1,'source retry count incorrect';
 ASSERT (SELECT state='failed' FROM public.job_index_work WHERE opportunity_id=b),'retry affected another source';
 ASSERT (SELECT state='queued' AND attempts=0 FROM public.job_index_work WHERE opportunity_id=a),'retry did not reset failed work';
 DELETE FROM public.opportunities;
END $$;
