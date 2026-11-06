-- Synthetic service-role control-plane fixture. No destination capability is used.
SET ROLE service_role;
DO $$
DECLARE actor uuid:=gen_random_uuid(); connection uuid; selected_record uuid; op uuid; request_id uuid:=gen_random_uuid();
 item jsonb; grant_value jsonb; changed jsonb;
BEGIN
 connection:=(public.zoho_register_connection('Canonical review fixture','88888888888888888871','in',
   '10000000-0000-4000-8000-000000000001',actor)->>'id')::uuid;
 UPDATE public.zoho_connections SET status='connected' WHERE id=connection;
 selected_record:=(public.zoho_stage_record(connection,'Candidates','1',now(),'{"name":"Fixture","email":"fixture@example.test"}','[]')->>'id')::uuid;
 SELECT jsonb_build_object('id',id,'revision',revision,'sourceHash',source_hash,'configRevision',config_revision,'targetId',target_id)
 INTO item FROM public.zoho_staged_records WHERE id=selected_record;
 BEGIN
   PERFORM public.zoho_decide_records(connection,jsonb_build_array(item),'approve','No canonical review',gen_random_uuid(),actor);
   RAISE EXCEPTION 'Candidate approved without canonical review';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 item:=item||jsonb_build_object('candidateReviewHash',repeat('a',64));
 FOREACH changed IN ARRAY ARRAY[item||'{"sourceHash":null}',item||jsonb_build_object('sourceHash',repeat('b',64)),
   item||'{"revision":null}',item||'{"configRevision":2}',item||jsonb_build_object('targetId',gen_random_uuid()),
   item||'{"candidateReviewHash":null}',item||'{"candidateReviewHash":"invalid"}',item||'{"unreviewed":"field"}'] LOOP
   BEGIN
     PERFORM public.zoho_decide_records(connection,jsonb_build_array(changed),'approve','Changed canonical context',gen_random_uuid(),actor);
     RAISE EXCEPTION 'Invalid or changed reviewed context approved';
   EXCEPTION WHEN invalid_parameter_value OR serialization_failure THEN NULL; END;
 END LOOP;
 PERFORM public.zoho_decide_records(connection,jsonb_build_array(item),'approve','Reviewed candidate',request_id,actor);
 SELECT o.id INTO STRICT op FROM public.zoho_approved_operations o WHERE o.record_id=selected_record;
 ASSERT (SELECT candidate_review_hash=repeat('a',64) FROM public.zoho_approved_operations WHERE id=op);
 ASSERT (public.zoho_lookup_decision(connection,jsonb_build_array(item),'approve','Reviewed candidate',request_id,actor)->>'found')::boolean;
 BEGIN
   PERFORM public.zoho_lookup_decision(connection,jsonb_build_array(item||jsonb_build_object('candidateReviewHash',repeat('b',64))),
     'approve','Reviewed candidate',request_id,actor);
   RAISE EXCEPTION 'Changed canonical review replayed';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 grant_value:=public.zoho_claim_operation(op,gen_random_uuid());
 ASSERT grant_value->>'candidateReviewHash'=repeat('a',64);
 ASSERT public.zoho_is_live_approved_operation(grant_value);
 ASSERT NOT public.zoho_is_live_approved_operation(grant_value-'candidateReviewHash');
 ASSERT NOT public.zoho_is_live_approved_operation(grant_value||jsonb_build_object('candidateReviewHash',repeat('b',64)));
 selected_record:=(public.zoho_stage_record(connection,'Job_Openings','2',now(),'{"title":"Fixture job"}','[]')->>'id')::uuid;
 SELECT jsonb_build_object('id',id,'revision',revision,'sourceHash',source_hash,'configRevision',config_revision,'targetId',target_id)
 INTO item FROM public.zoho_staged_records WHERE id=selected_record;
 PERFORM public.zoho_decide_records(connection,jsonb_build_array(item),'approve','Reviewed job',gen_random_uuid(),actor);
 SELECT o.id INTO STRICT op FROM public.zoho_approved_operations o WHERE o.record_id=selected_record;
 grant_value:=public.zoho_claim_operation(op,gen_random_uuid());
 ASSERT NOT grant_value ? 'candidateReviewHash';
 ASSERT public.zoho_is_live_approved_operation(grant_value);
 ASSERT NOT public.zoho_is_live_approved_operation(grant_value||jsonb_build_object('candidateReviewHash',repeat('a',64)));
 -- A legacy queued candidate remains fenced even before the upgrade seeds run.
 selected_record:=(public.zoho_stage_record(connection,'Candidates','4',now(),'{"name":"Legacy fixture","email":"legacy@example.test"}','[]')->>'id')::uuid;
 SELECT jsonb_build_object('id',id,'revision',revision,'sourceHash',source_hash,'configRevision',config_revision,'targetId',target_id,
   'candidateReviewHash',repeat('a',64)) INTO item FROM public.zoho_staged_records WHERE id=selected_record;
 PERFORM public.zoho_decide_records(connection,jsonb_build_array(item),'approve','Legacy stored approval fixture',gen_random_uuid(),actor);
 SELECT o.id INTO STRICT op FROM public.zoho_approved_operations o WHERE o.record_id=selected_record;
 UPDATE public.zoho_approved_operations SET candidate_review_hash=NULL WHERE id=op;
 ASSERT public.zoho_claim_operation(op,gen_random_uuid())->>'reason'='APPROVAL_STALE';
 ASSERT (SELECT state='approval_stale' FROM public.zoho_approved_operations WHERE id=op);
 ASSERT (SELECT revision=2 AND decision='pending_approval' FROM public.zoho_staged_records WHERE id=selected_record);
 -- Minimal hold/reject remain useful before identity review is possible.
 selected_record:=(public.zoho_stage_record(connection,'Candidates','3',now(),'{"name":"Held fixture"}','[]')->>'id')::uuid;
 PERFORM public.zoho_decide_records(connection,jsonb_build_array(jsonb_build_object('id',selected_record,'revision',1)),
   'hold','Manual follow-up',gen_random_uuid(),actor);
 ASSERT NOT has_function_privilege('anon','public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_claim_operation(uuid,uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_decide_records(uuid,jsonb,text,text,uuid,uuid)','EXECUTE');
END $$;
RESET ROLE;
