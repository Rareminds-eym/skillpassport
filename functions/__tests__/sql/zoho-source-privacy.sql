DO $$
DECLARE c uuid; org uuid; actor uuid:=gen_random_uuid(); rec uuid; before_revision integer; outcome jsonb; op uuid; run uuid;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Privacy synthetic fixture','99999999999999999989','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 rec:=(public.zoho_stage_record(c,'Candidates','701',now(),'{"name":"Synthetic Person","email":"synthetic@fixture.example"}','[]')->>'id')::uuid;
 outcome:=public.zoho_set_source_suppression(c,'Candidates','701',true,'Explicit source exclusion',actor);
 ASSERT outcome->>'suppressed'='true' AND outcome->>'canonicalDeletion'='false';
 ASSERT public.zoho_is_source_suppressed(c,'Candidates','701');
 ASSERT NOT public.zoho_is_source_suppressed(c,'Job_Openings','701');
 ASSERT (SELECT proposed_data='{}' AND payload_redacted_at IS NOT NULL AND decision='rejected' FROM public.zoho_staged_records WHERE id=rec);
 ASSERT public.zoho_stage_record(c,'Candidates','701',now(),'{"email":"not-restored@fixture.example"}','[]')->>'suppressed'='true';
 ASSERT (SELECT proposed_data='{}' FROM public.zoho_staged_records WHERE id=rec);
 -- Reconnect never discards source-level suppression.
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"BBBBBBBBBBBBBBBBBBBBBBBB"}',actor);
 ASSERT public.zoho_is_source_suppressed(c,'Candidates','701');
 BEGIN
  UPDATE public.zoho_staged_records SET decision='approved' WHERE id=rec;
  RAISE EXCEPTION 'Redacted/suppressed source approved';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 PERFORM public.zoho_set_source_suppression(c,'Candidates','701',false,'Explicit exclusion removal',actor);
 ASSERT (SELECT proposed_data='{}' AND payload_redacted_at IS NOT NULL FROM public.zoho_staged_records WHERE id=rec);
 SELECT revision INTO before_revision FROM public.zoho_staged_records WHERE id=rec;
 PERFORM public.zoho_stage_record(c,'Candidates','701',now(),'{"name":"Synthetic Person","email":"synthetic@fixture.example"}','[]');
 ASSERT (SELECT revision=before_revision+1 AND payload_redacted_at IS NULL AND decision='pending_approval' FROM public.zoho_staged_records WHERE id=rec);
 PERFORM public.zoho_configure_retention(c,1,'Short synthetic retention',actor);
 UPDATE public.zoho_staged_records SET payload_staged_at=now()-interval '2 days' WHERE id=rec;
 PERFORM public.zoho_cleanup_source_payloads();
 ASSERT (SELECT proposed_data='{}' AND payload_redacted_at IS NOT NULL AND validation_errors='["PAYLOAD_EXPIRED_REFETCH_REQUIRED"]' FROM public.zoho_staged_records WHERE id=rec);
 ASSERT public.zoho_source_privacy_snapshot(c)->>'retentionDays'='1';
 ASSERT (SELECT count(*)>=4 FROM public.zoho_privacy_audit WHERE connection_id=c);
 -- Unresolved effects retain enough payload for receipt reconciliation.
 rec:=(public.zoho_stage_record(c,'Job_Openings','702',now(),'{"title":"Synthetic Job"}','[]')->>'id')::uuid;
 PERFORM public.zoho_decide_records(c,(SELECT jsonb_build_array(jsonb_build_object('id',id,'revision',revision,
  'sourceHash',source_hash,'configRevision',config_revision,'targetId',NULL)) FROM public.zoho_staged_records WHERE id=rec),
  'approve','Synthetic job review',gen_random_uuid(),actor);
 SELECT id INTO op FROM public.zoho_approved_operations WHERE record_id=rec;
 UPDATE public.zoho_approved_operations SET state='processing',last_error='OUTCOME_UNKNOWN' WHERE id=op;
 UPDATE public.zoho_staged_records SET payload_staged_at=now()-interval '2 days' WHERE id=rec;
 PERFORM public.zoho_cleanup_source_payloads();
 ASSERT (SELECT proposed_data->>'title'='Synthetic Job' AND payload_redacted_at IS NULL FROM public.zoho_staged_records WHERE id=rec);
 ASSERT public.zoho_set_source_suppression(c,'Job_Openings','702',true,'Unresolved source exclusion',actor)->>'reconciliationRequired'='true';
 ASSERT (SELECT approved_data->>'title'='Synthetic Job' FROM public.zoho_approved_operations WHERE id=op);
 -- Once the receipt is reconciled, suppression also clears a recent payload.
 UPDATE public.zoho_approved_operations SET state='completed',last_error=NULL WHERE id=op;
 UPDATE public.zoho_staged_records SET payload_staged_at=now() WHERE id=rec;
 PERFORM public.zoho_cleanup_source_payloads();
 ASSERT (SELECT proposed_data='{}' AND payload_redacted_at IS NOT NULL FROM public.zoho_staged_records WHERE id=rec);
 ASSERT (SELECT approved_data='{}' FROM public.zoho_approved_operations WHERE id=op);
 ASSERT NOT has_function_privilege('anon','public.zoho_set_source_suppression(uuid,text,text,boolean,text,uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_cleanup_source_payloads()','EXECUTE');
 ASSERT NOT has_table_privilege('service_role','public.zoho_source_suppressions','INSERT');
 ASSERT NOT has_table_privilege('zoho_discovery','public.zoho_source_suppressions','SELECT');
 -- The same configured retention applies to deferred duplicate snapshots.
 run:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
 INSERT INTO public.zoho_deferred_records(connection_id,run_id,module,external_id,source_modified_at,config_revision,
   proposed_data,validation_errors,state,reason)
 VALUES(c,run,'Candidates','703',now(),(SELECT config_revision FROM public.zoho_connections WHERE id=c),
   '{"name":"Deferred Synthetic","email":"deferred@fixture.example"}','[]','waiting_execution','EXECUTION_IN_FLIGHT');
 UPDATE public.zoho_deferred_records SET payload_staged_at=now()-interval '2 days' WHERE connection_id=c AND external_id='703';
 PERFORM public.zoho_cleanup_source_payloads();
 ASSERT (SELECT proposed_data IS NULL AND validation_errors IS NULL AND reason='REFETCH_REQUIRED'
   FROM public.zoho_deferred_records WHERE connection_id=c AND external_id='703');
 -- Connection controls invalidate old work but preserve unknown/completed receipts.
 SELECT config_revision INTO before_revision FROM public.zoho_connections WHERE id=c;
 outcome:=public.zoho_control_connection(c,before_revision,'pause','Pause synthetic connection',actor);
 ASSERT outcome->>'status'='paused';
 ASSERT EXISTS(SELECT 1 FROM public.zoho_connection_secrets WHERE connection_id=c);
 BEGIN
  PERFORM public.zoho_control_connection(c,before_revision,'resume','Stale operator command',actor);
  RAISE EXCEPTION 'Stale connection command accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 PERFORM public.zoho_control_connection(c,before_revision+1,'resume','Resume synthetic connection',actor);
 ASSERT (SELECT status='connected' FROM public.zoho_connections WHERE id=c);
 PERFORM public.zoho_control_connection(c,before_revision+2,'disconnect','Disconnect synthetic connection',actor);
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_connection_secrets WHERE connection_id=c);
 ASSERT (SELECT status='not_connected' FROM public.zoho_connections WHERE id=c);
 ASSERT (SELECT state='completed' FROM public.zoho_approved_operations WHERE id=op);
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_control_connection(uuid,integer,text,text,uuid)','EXECUTE');
END $$;
