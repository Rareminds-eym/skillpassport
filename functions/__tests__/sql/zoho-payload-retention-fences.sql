CREATE FUNCTION pg_temp.retention_items(p_record uuid) RETURNS jsonb LANGUAGE sql AS $$
 SELECT jsonb_build_array(jsonb_build_object('id',id,'revision',revision,'sourceHash',source_hash,
   'configRevision',config_revision,'targetId',target_id)) FROM public.zoho_staged_records WHERE id=p_record;
$$;
DO $$
DECLARE c uuid; org uuid; actor uuid:=gen_random_uuid(); rec uuid; history uuid; op uuid; old_op uuid; request_id uuid;
 items jsonb; result jsonb; grant_value jsonb; revision_before integer; deadline timestamptz;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Retention fence fixture','99999999999999999985','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 rec:=(public.zoho_stage_record(c,'Job_Openings','901',now(),'{"title":"Synthetic expired review"}','[]')->>'id')::uuid;
 SELECT revision INTO revision_before FROM public.zoho_staged_records WHERE id=rec;
 UPDATE public.zoho_staged_records SET payload_staged_at=now()-interval '31 days' WHERE id=rec;
 ASSERT NOT public.zoho_review_payload_current(c,rec);
 BEGIN
   PERFORM public.zoho_decide_records(c,pg_temp.retention_items(rec),'approve','Must refetch expired data',gen_random_uuid(),actor);
   RAISE EXCEPTION 'Expired source approved';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE record_id=rec);
 -- An actual fresh read of identical source data starts a new review generation.
 PERFORM public.zoho_stage_record(c,'Job_Openings','901',now(),'{"title":"Synthetic expired review"}','[]');
 ASSERT public.zoho_review_payload_current(c,rec);
 ASSERT (SELECT revision>revision_before AND decision='pending_approval' FROM public.zoho_staged_records WHERE id=rec);
 items:=pg_temp.retention_items(rec); request_id:=gen_random_uuid();
 result:=public.zoho_decide_records(c,items,'approve','Fresh source reviewed',request_id,actor);
 SELECT id INTO op FROM public.zoho_approved_operations WHERE record_id=rec;
 ASSERT (SELECT o.payload_captured_at=r.payload_staged_at FROM public.zoho_approved_operations o
   JOIN public.zoho_staged_records r ON r.id=o.record_id WHERE o.id=op);
 UPDATE public.zoho_staged_records SET payload_staged_at=now()-interval '31 days' WHERE id=rec;
 -- Replaying a committed decision is read-only; it does not renew its effect.
 ASSERT public.zoho_decide_records(c,items,'approve','Fresh source reviewed',request_id,actor)->>'replayed'='true';
 result:=public.zoho_claim_operation(op,gen_random_uuid());
 ASSERT result->>'claimed'='false' AND result->>'reason'='PAYLOAD_EXPIRED';
 ASSERT (SELECT state='approval_stale' FROM public.zoho_approved_operations WHERE id=op);
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_execution_attempts WHERE operation_id=op);
 PERFORM public.zoho_stage_record(c,'Job_Openings','901',now(),'{"title":"Synthetic expired review"}','[]');
 UPDATE public.zoho_staged_records SET payload_staged_at=clock_timestamp()-interval '30 days'+interval '60 seconds' WHERE id=rec;
 PERFORM public.zoho_decide_records(c,pg_temp.retention_items(rec),'approve','Short remaining TTL review',gen_random_uuid(),actor);
 SELECT id INTO op FROM public.zoho_approved_operations WHERE record_id=rec AND state='queued';
 grant_value:=public.zoho_claim_operation(op,gen_random_uuid());
 ASSERT grant_value->>'claimed'='true';
 SELECT payload_staged_at+interval '30 days' INTO deadline FROM public.zoho_staged_records WHERE id=rec;
 ASSERT (grant_value->>'leaseExpiresAt')::timestamptz<=deadline;
 ASSERT public.zoho_is_live_approved_operation(grant_value);
 UPDATE public.zoho_staged_records SET payload_staged_at=now()-interval '31 days' WHERE id=rec;
 UPDATE public.zoho_approved_operations SET payload_captured_at=now()-interval '31 days',last_error='OUTCOME_UNKNOWN' WHERE id=op;
 ASSERT NOT public.zoho_is_live_approved_operation(grant_value);
 ASSERT public.zoho_claim_operation(op,(grant_value->>'lease')::uuid)->>'claimed'='false';
 PERFORM public.zoho_cleanup_source_payloads();
 ASSERT (SELECT state='processing' AND approved_data<>'{}'::jsonb FROM public.zoho_approved_operations WHERE id=op);
 ASSERT (SELECT payload_redacted_at IS NULL FROM public.zoho_staged_records WHERE id=rec);

 history:=(public.zoho_stage_record(c,'Job_Openings','902',now(),'{"title":"Historical one"}','[]')->>'id')::uuid;
 PERFORM public.zoho_decide_records(c,pg_temp.retention_items(history),'approve','Historical source one',gen_random_uuid(),actor);
 SELECT id INTO old_op FROM public.zoho_approved_operations WHERE record_id=history;
 UPDATE public.zoho_approved_operations SET state='completed',payload_captured_at=now()-interval '31 days' WHERE id=old_op;
 PERFORM public.zoho_stage_record(c,'Job_Openings','902',now(),'{"title":"Historical two"}','[]');
 PERFORM public.zoho_decide_records(c,pg_temp.retention_items(history),'approve','Historical source two',gen_random_uuid(),actor);
 -- Legacy NULL capture timestamps fall back to approval creation, never the new stage.
 UPDATE public.zoho_approved_operations SET state='completed',payload_captured_at=NULL,created_at=now()-interval '31 days'
   WHERE record_id=history AND id<>old_op;
 PERFORM public.zoho_stage_record(c,'Job_Openings','902',now(),'{"title":"Current source stays fresh"}','[]');
 result:=public.zoho_cleanup_source_payloads();
 ASSERT (result->>'operationPayloadsRedacted')::integer>=2;
 ASSERT (SELECT bool_and(approved_data='{}'::jsonb AND state='completed') FROM public.zoho_approved_operations WHERE record_id=history);
 ASSERT (SELECT proposed_data->>'title'='Current source stays fresh' AND payload_redacted_at IS NULL FROM public.zoho_staged_records WHERE id=history);
 ASSERT EXISTS(SELECT 1 FROM public.zoho_privacy_audit WHERE record_id=history AND event='operation_payload_expired');
 ASSERT NOT has_function_privilege('anon','public.zoho_review_payload_current(uuid,uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.zoho_claim_operation_before_retention(uuid,uuid)','EXECUTE');
END $$;
