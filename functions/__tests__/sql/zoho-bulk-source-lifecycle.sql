DO $$
DECLARE c uuid; actor uuid:=gen_random_uuid(); proposal uuid; out jsonb; staged jsonb; run uuid; lease uuid; request uuid:=gen_random_uuid(); before_count bigint; target uuid; scan uuid;
BEGIN
 c:=(public.zoho_register_connection('Bulk and lifecycle fixture','99999999999999999871','in','10000000-0000-4000-8000-000000000001',actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 staged:=public.zoho_stage_record(c,'Candidates','991',now()-interval '1 day','{"name":"Synthetic Learner","email":"synthetic@example.invalid"}','[]');
 PERFORM public.zoho_stage_source_deletions(c,'Candidates',1,jsonb_build_array(jsonb_build_object('externalId','991','kind','recycle','observedAt',now())),false);
 SELECT id INTO STRICT proposal FROM public.zoho_source_lifecycle_proposals WHERE connection_id=c AND external_id='991';
 ASSERT NOT public.zoho_is_source_suppressed(c,'Candidates','991'),'Discovery may not suppress source';
 out:=public.zoho_decide_source_lifecycle(c,proposal,1,'hold','Need approval review',request,actor);
 ASSERT out->>'decision'='hold';
 ASSERT NOT public.zoho_is_source_suppressed(c,'Candidates','991');
 ASSERT (public.zoho_decide_source_lifecycle(c,proposal,1,'hold','Need approval review',request,actor)->>'replayed')::boolean;
 BEGIN
  PERFORM public.zoho_decide_source_lifecycle(c,proposal,1,'approve','Wrong stale revision',gen_random_uuid(),actor);
  RAISE EXCEPTION 'Expected stale approval';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 out:=public.zoho_decide_source_lifecycle(c,proposal,2,'approve','Approved source-only suppression',gen_random_uuid(),actor);
 ASSERT out->>'effect'='source_suppressed';
 ASSERT (out->>'canonicalDeletion')::boolean=false;
 ASSERT public.zoho_is_source_suppressed(c,'Candidates','991');
 ASSERT (public.zoho_stage_record(c,'Candidates','991',now(),'{}','[]')->>'suppressed')::boolean;

 -- Source newer than deletion evidence must invalidate approval.
 PERFORM public.zoho_stage_record(c,'Candidates','992',now()-interval '1 day','{"name":"Synthetic Learner","email":"other@example.invalid"}','[]');
 PERFORM public.zoho_stage_source_deletions(c,'Candidates',1,jsonb_build_array(jsonb_build_object('externalId','992','kind','permanent','observedAt',now()-interval '1 hour')),false);
 SELECT id INTO proposal FROM public.zoho_source_lifecycle_proposals WHERE connection_id=c AND external_id='992';
 PERFORM public.zoho_stage_record(c,'Candidates','992',now(),' {"name":"Changed Learner","email":"other@example.invalid"}','[]');
 BEGIN
  PERFORM public.zoho_decide_source_lifecycle(c,proposal,1,'approve','Must reject changed source',gen_random_uuid(),actor);
  RAISE EXCEPTION 'Expected source revision conflict';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 ASSERT NOT public.zoho_is_source_suppressed(c,'Candidates','992');

 -- A source deletion can only stage a close. Destination remains unchanged and
 -- the existing immutable job approval path must independently approve it.
 PERFORM public.zoho_configure_job_policy(c,actor,1,'{"Open":"open","Closed":"closed"}','{"Full time":"job"}',true,true,public.zoho_job_trigger_fingerprint(),'Reviewed fixture job executable surface');
 SELECT id INTO STRICT target FROM public.opportunities WHERE status='open' AND is_active LIMIT 1;
 staged:=public.zoho_stage_record(c,'Job_Openings','994',now()-interval '1 hour',jsonb_build_object(
  'title','Synthetic Job','company_name','Fixture Company','department','Engineering','location','Bengaluru','employment_type','Full time',
  'description','Fixture description','application_link','https://fixture.example/apply','source_status','Open'),'[]');
 UPDATE public.zoho_staged_records SET target_id=target WHERE id=(staged->>'id')::uuid;
 PERFORM public.zoho_stage_source_deletions(c,'Job_Openings',1,jsonb_build_array(jsonb_build_object('externalId','994','kind','permanent','observedAt',now())),false);
 SELECT id INTO proposal FROM public.zoho_source_lifecycle_proposals WHERE connection_id=c AND external_id='994';
 out:=public.zoho_decide_source_lifecycle(c,proposal,1,'approve','Stage closure for separate job approval',gen_random_uuid(),actor);
 ASSERT out->>'effect'='job_closure_staged';
 ASSERT (SELECT status='open' AND is_active FROM public.opportunities WHERE id=target);
 ASSERT (SELECT decision='pending_approval' AND proposed_data->>'source_status'='Closed' FROM public.zoho_staged_records WHERE connection_id=c AND external_id='994');
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=c AND r.external_id='994');

 scan:=(public.zoho_start_deleted_scan(c,'Candidates',actor)->>'scanId')::uuid;
 lease:=(public.zoho_claim_deleted_scan(scan)->>'lease')::uuid;
 ASSERT NOT (public.zoho_claim_deleted_scan(scan)->>'claimed')::boolean;
 out:=public.zoho_commit_deleted_scan(scan,lease,'[]',true);
 ASSERT (SELECT next_page=2 AND state='running' FROM public.zoho_deleted_scans WHERE id=scan);
 BEGIN
  PERFORM public.zoho_commit_deleted_scan(scan,lease,'[]',false);RAISE EXCEPTION 'Expected reused scan lease rejected';
 EXCEPTION WHEN serialization_failure THEN NULL;END;
 UPDATE public.zoho_deleted_scans SET next_attempt_at=now()-interval '1 second' WHERE id=scan;
 lease:=(public.zoho_claim_deleted_scan(scan)->>'lease')::uuid;
 PERFORM public.zoho_commit_deleted_scan(scan,lease,'[]',false);
 ASSERT (SELECT state='completed' FROM public.zoho_deleted_scans WHERE id=scan);
 scan:=(public.zoho_start_deleted_scan(c,'Candidates',actor)->>'scanId')::uuid;
 ASSERT (SELECT modified_since IS NOT NULL FROM public.zoho_deleted_scans WHERE id=scan);

 run:=(public.zoho_start_bulk_read(c,'Candidates',request,actor)->>'runId')::uuid;
 ASSERT public.zoho_start_bulk_read(c,'Candidates',request,actor)->>'runId'=run::text;
 out:=public.zoho_claim_bulk_read(run);lease:=(out->>'lease')::uuid;
 ASSERT out->'run'->>'state'='creating';
 ASSERT NOT (public.zoho_claim_bulk_read(run)->>'claimed')::boolean;
 PERFORM public.zoho_advance_bulk_read(run,lease,'created','{"jobId":"998877"}');
 UPDATE public.zoho_bulk_read_runs SET next_attempt_at=now()-interval '1 second' WHERE id=run;
 lease:=(public.zoho_claim_bulk_read(run)->>'lease')::uuid;
 BEGIN
  PERFORM public.zoho_advance_bulk_read(run,gen_random_uuid(),'waiting','{}');
  RAISE EXCEPTION 'Expected fenced bulk lease';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 out:=public.zoho_advance_bulk_read(run,lease,'rows',jsonb_build_object('records',jsonb_build_array(jsonb_build_object(
  'externalId','993','modified',now(),'data',jsonb_build_object('email','bulk@example.invalid','name','Bulk Learner'),'errors','[]'::jsonb)),
  'issues','[]'::jsonb,'nextOffset',1,'total',1,'done',true,'more',false,'archiveHash',repeat('a',64)));
 ASSERT out->>'state'='completed';
 ASSERT (SELECT decision='pending_approval' AND execution_state='not_approved' FROM public.zoho_staged_records WHERE connection_id=c AND external_id='993');
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations o JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE r.connection_id=c);

 -- A lost provider create response cannot lead to an automatic second POST.
 run:=(public.zoho_start_bulk_read(c,'Candidates',gen_random_uuid(),actor)->>'runId')::uuid;
 PERFORM public.zoho_claim_bulk_read(run);
 UPDATE public.zoho_bulk_read_runs SET lease_expires_at=now()-interval '1 second' WHERE id=run;
 ASSERT NOT (public.zoho_claim_bulk_read(run)->>'claimed')::boolean;
 ASSERT (SELECT state='failed' AND last_error='CREATE_OUTCOME_UNKNOWN' FROM public.zoho_bulk_read_runs WHERE id=run);
 ASSERT NOT has_function_privilege('anon','public.zoho_claim_bulk_read(uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_decide_source_lifecycle(uuid,uuid,integer,text,text,uuid,uuid)','EXECUTE');
 ASSERT NOT has_table_privilege('authenticated','public.zoho_source_lifecycle_proposals','SELECT');
 ASSERT NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.zoho_bulk_read_runs'::regclass);
END;
$$;

DO $$
DECLARE c uuid;actor uuid:=gen_random_uuid();run uuid;lease uuid;out jsonb;pointer jsonb;
BEGIN
 c:=(public.zoho_register_connection('Private artifact fixture','99999999999999999872','in','10000000-0000-4000-8000-000000000001',actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 run:=(public.zoho_start_bulk_read(c,'Candidates',gen_random_uuid(),actor)->>'runId')::uuid;
 lease:=(public.zoho_claim_bulk_read(run)->>'lease')::uuid;
 PERFORM public.zoho_advance_bulk_read(run,lease,'created','{"jobId":"998878"}');
 UPDATE public.zoho_bulk_read_runs SET next_attempt_at=now()-interval '1 second' WHERE id=run;
 lease:=(public.zoho_claim_bulk_read(run)->>'lease')::uuid;
 out:=public.zoho_advance_bulk_read(run,lease,'artifact-plan',jsonb_build_object('archiveHash',repeat('b',64),'count',201,'more',false));pointer:=out->'artifact';
 ASSERT pointer->>'key'='__private_zoho_bulk/v1/'||run::text||'/998878/'||repeat('b',64)||'.bin';
 ASSERT (pointer->>'expiresAt')::timestamptz<=now()+interval '7 days';
 ASSERT (SELECT artifact_write_pending AND NOT artifact_ready FROM public.zoho_bulk_read_runs WHERE id=run);
 out:=public.zoho_erase_bulk_source_artifacts(c);
 ASSERT NOT (out->>'complete')::boolean;
 -- Erasure cannot acknowledge completion while a previously authorized write
 -- might still finish. Its pending pointer survives lease/run revocation.
 ASSERT NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.zoho_due_bulk_artifact_cleanup()) x WHERE x->>'runId'=run::text);
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(public.zoho_due_bulk_artifact_writes()) x WHERE x->>'runId'=run::text AND x->>'writeToken'=lease::text);
 out:=public.zoho_finish_bulk_artifact_write(run,pointer->>'key',lease,true);
 ASSERT NOT (out->>'ready')::boolean;
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(public.zoho_due_bulk_artifact_cleanup()) x WHERE x->>'runId'=run::text);
 PERFORM public.zoho_finish_bulk_artifact_cleanup(run,pointer->>'key');
 ASSERT (public.zoho_erase_bulk_source_artifacts(c)->>'complete')::boolean;
 ASSERT NOT has_function_privilege('authenticated','public.zoho_finish_bulk_artifact_write(uuid,text,uuid,boolean)','EXECUTE');
END;
$$;
