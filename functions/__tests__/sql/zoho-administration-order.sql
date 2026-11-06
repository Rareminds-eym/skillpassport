-- Durable order and recovery regressions; disposable transaction only.
CREATE FUNCTION pg_temp.reject_ordered_administration(p_connection uuid,p_receipt jsonb,p_actor uuid,p_after uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 BEGIN
  PERFORM public.zoho_apply_candidate_administration(p_connection,p_receipt,p_actor,p_after);
  RAISE EXCEPTION 'Out-of-order administration accepted';
 EXCEPTION WHEN serialization_failure OR invalid_parameter_value THEN NULL; END;
END $$;
DO $$
DECLARE actor uuid:=gen_random_uuid(); recovering uuid:=gen_random_uuid(); target uuid:=gen_random_uuid();
 connection uuid:=gen_random_uuid(); publisher uuid:=gen_random_uuid(); erase_request uuid:=gen_random_uuid();
 release_request uuid:=gen_random_uuid(); last_request uuid:=gen_random_uuid(); op uuid:='18000000-0000-4000-8000-000000000001';
 next_op uuid:='18000000-0000-4000-8000-000000000002'; record uuid:=gen_random_uuid(); receipt jsonb; page jsonb; release jsonb; last_receipt jsonb; result jsonb;
 old_release uuid:=gen_random_uuid(); old_erase uuid:=gen_random_uuid(); partial_request uuid:=gen_random_uuid(); legacy jsonb;
BEGIN
 INSERT INTO public.organizations(id) VALUES(publisher);
 INSERT INTO public.zoho_connections(id,name,source_org_id,region,publisher_organization_id,status,created_by)
 VALUES(connection,'Ordering fixture','183001','in',publisher,'connected',actor);
 INSERT INTO public.zoho_staged_records(id,connection_id,module,external_id,source_modified_at,source_hash,config_revision,proposed_data)
 VALUES(record,connection,'Candidates','183002',now(),repeat('a',64),1,'{"email":"ordering@fixture.invalid"}');
 receipt:=jsonb_build_object('version',1,'requestId',erase_request,'action','erase_connector','state','completed','targetId',target,
  'sourceOrgId','183001','externalId','183002','emailPolicy','forbidden','canonicalAccountPreserved',true,
  'administrationVersion',1,'currentAdministration',true,'approvalActorId',actor,
  'erasedOperationIds',jsonb_build_array(op),'moreErasedOperations',true);
 -- First app delivery may be recovered by another currently verified admin.
 result:=public.zoho_apply_candidate_administration(connection,receipt,recovering,NULL);
 ASSERT result->>'state'='application_pending';
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_administration_progress WHERE request_id=erase_request AND actor_id=actor AND administration_version=1);
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_administration_recovery_audit WHERE request_id=erase_request AND original_actor_id=actor AND recovering_actor_id=recovering);
 release:=receipt||jsonb_build_object('requestId',release_request,'action','release_suppression','administrationVersion',2,'erasedOperationIds','[]'::jsonb,'moreErasedOperations',false);
 PERFORM pg_temp.reject_ordered_administration(connection,release,recovering);
 page:=receipt||jsonb_build_object('erasedOperationIds',jsonb_build_array(next_op),'moreErasedOperations',false);
 result:=public.zoho_apply_candidate_administration(connection,page,recovering,op);
 ASSERT result->>'state'='completed';
 INSERT INTO public.zoho_bulk_read_runs(connection_id,module,request_id,actor_id,config_revision,credential_generation,state,artifact_key,artifact_write_pending)
 VALUES(connection,'Candidates',gen_random_uuid(),actor,1,1,'failed','private-test-artifact',true);
 ASSERT public.zoho_erase_bulk_source_artifacts(connection,erase_request,1)->>'complete'='false';
 ASSERT public.zoho_confirm_candidate_administration(erase_request,recovering)->>'state'='application_pending';
 PERFORM pg_temp.reject_ordered_administration(connection,release,recovering);
 UPDATE public.zoho_bulk_read_runs SET artifact_key=NULL,artifact_write_pending=false WHERE connection_id=connection;
 ASSERT public.zoho_confirm_candidate_administration(erase_request,recovering)->>'state'='completed';
 ASSERT public.zoho_apply_candidate_administration(connection,release,recovering,NULL)->>'state'='completed';
 ASSERT public.zoho_confirm_candidate_administration(release_request,recovering)->>'state'='completed';
 INSERT INTO public.zoho_bulk_read_runs(connection_id,module,request_id,actor_id,config_revision,credential_generation,state)
 VALUES(connection,'Candidates',gen_random_uuid(),actor,1,1,'queued');
 BEGIN
  PERFORM public.zoho_erase_bulk_source_artifacts(connection,erase_request,1);
  RAISE EXCEPTION 'Stale erasure invalidated newer artifacts';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 ASSERT EXISTS(SELECT 1 FROM public.zoho_bulk_read_runs WHERE connection_id=connection AND state='queued');
 -- Even a delayed cached receipt marked current cannot defeat persistent app order.
 PERFORM pg_temp.reject_ordered_administration(connection,page,recovering,op);
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_source_suppressions WHERE source_org_id='183001' AND external_id='183002');
 last_receipt:=receipt||jsonb_build_object('requestId',last_request,'administrationVersion',3,'erasedOperationIds','[]'::jsonb,'moreErasedOperations',false);
 ASSERT public.zoho_apply_candidate_administration(connection,last_receipt,recovering,NULL)->>'state'='completed';
 ASSERT public.zoho_confirm_candidate_administration(last_request,recovering)->>'state'='completed';
 PERFORM pg_temp.reject_ordered_administration(connection,release,recovering);
 ASSERT EXISTS(SELECT 1 FROM public.zoho_source_suppressions WHERE source_org_id='183001' AND external_id='183002');
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_administration_watermarks WHERE source_org_id='183001' AND external_id='183002' AND administration_version=3 AND request_id=last_request);
 PERFORM pg_temp.reject_ordered_administration(connection,last_receipt||jsonb_build_object('requestId',gen_random_uuid()),recovering);
 PERFORM pg_temp.reject_ordered_administration(connection,last_receipt||jsonb_build_object('currentAdministration',false),recovering);
 PERFORM pg_temp.reject_ordered_administration(connection,(last_receipt||jsonb_build_object('externalId','183003','requestId',gen_random_uuid()))-'approvalActorId',recovering);
 -- Historical completed progress has version zero; current canonical receipt
 -- must converge app suppression even if prior legacy deliveries were reversed.
 legacy:=release||jsonb_build_object('requestId',old_release,'externalId','183004','administrationVersion',10);
 PERFORM public.zoho_apply_candidate_administration_before_ordering(connection,legacy,actor,NULL);
 PERFORM public.zoho_apply_candidate_administration_before_ordering(connection,legacy||jsonb_build_object('requestId',old_erase,'action','erase_connector'),actor,NULL);
 ASSERT EXISTS(SELECT 1 FROM public.zoho_source_suppressions WHERE source_org_id='183001' AND external_id='183004');
 ASSERT public.zoho_apply_candidate_administration(connection,legacy,recovering,NULL)->>'state'='completed';
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_source_suppressions WHERE source_org_id='183001' AND external_id='183004');
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_administration_progress WHERE request_id=old_release AND actor_id=actor AND administration_version=10);
 -- Existing version-zero partial progress resumes its actual durable cursor.
 legacy:=receipt||jsonb_build_object('requestId',partial_request,'externalId','183005','administrationVersion',11);
 PERFORM public.zoho_apply_candidate_administration_before_ordering(connection,legacy,actor,NULL);
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_administration_progress WHERE request_id=partial_request AND NOT completed AND administration_version=0 AND last_operation_id=op);
 legacy:=legacy||jsonb_build_object('erasedOperationIds',jsonb_build_array(next_op),'moreErasedOperations',false);
 ASSERT public.zoho_apply_candidate_administration(connection,legacy,recovering,op)->>'state'='completed';
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_administration_progress WHERE request_id=partial_request AND completed AND administration_version=11 AND last_operation_id=next_op);
 ASSERT NOT has_table_privilege('anon','public.zoho_candidate_administration_watermarks','SELECT');
 ASSERT NOT has_table_privilege('service_role','public.zoho_candidate_administration_watermarks','UPDATE');
 ASSERT NOT has_function_privilege('service_role','public.zoho_apply_candidate_administration_before_ordering(uuid,jsonb,uuid,uuid)','EXECUTE');
 GRANT SELECT ON public.zoho_candidate_administration_watermarks TO anon;
 BEGIN
  PERFORM public.zoho_assert_private_projection_boundary();
  RAISE EXCEPTION 'Browser-readable ordering accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 ASSERT public.zoho_candidate_projection_ready() IS FALSE;
 REVOKE SELECT ON public.zoho_candidate_administration_watermarks FROM anon;
END $$;
