-- Disposable fixture using the actual projection/control-plane table definitions.
CREATE FUNCTION pg_temp.context_snapshot(p_target uuid,p_operation uuid,p_subscription uuid,p_email text,p_role text,p_external text) RETURNS jsonb
LANGUAGE sql AS $$
 -- Reuse the existing canonical freemium catalog ID; a new ID with the same
 -- plan_code would correctly violate the real cache uniqueness constraint.
 SELECT jsonb_set(replace(replace(replace(replace(fixture.snapshot(),
  '10000000-0000-4000-8000-000000000002',p_target::text),
  '10000000-0000-4000-8000-000000000001',p_operation::text),
  '10000000-0000-4000-8000-000000000004',p_subscription::text),
  'projection@fixture.example',p_email)::jsonb,'{user,primaryRole}',to_jsonb(p_role)) ||
  jsonb_build_object('learnerContext',jsonb_build_object('version',1,'role','learner','productCode','skillpassport',
   'membershipId','30000000-0000-4000-8000-000000000004','organizationId','00000000-0000-0000-0000-000000000001',
   'active',true,'source',jsonb_build_object('sourceOrgId','1234','externalId',p_external),
   'primaryContext',jsonb_build_object('membershipId','30000000-0000-4000-8000-000000000004',
    'organizationId','00000000-0000-0000-0000-000000000001','role',p_role)));
$$;
CREATE FUNCTION pg_temp.reject_context_projection(p_body jsonb) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 BEGIN
  PERFORM public.zoho_apply_candidate_projection(p_body::text,encode(sha256(convert_to(p_body::text,'UTF8')),'hex'));
  RAISE EXCEPTION 'Invalid context/erased projection accepted';
 EXCEPTION WHEN invalid_parameter_value OR invalid_text_representation OR serialization_failure THEN NULL; END;
END $$;
DO $$
DECLARE target uuid:=gen_random_uuid(); op uuid:='30000000-0000-4000-8000-000000000001'; subscription uuid:=gen_random_uuid();
 second_target uuid:=gen_random_uuid(); second_op uuid:=gen_random_uuid(); second_subscription uuid:=gen_random_uuid();
 invalid_target uuid:=gen_random_uuid(); invalid_op uuid:=gen_random_uuid(); invalid_subscription uuid:=gen_random_uuid();
 actor uuid:=gen_random_uuid(); publisher uuid:=gen_random_uuid(); connection uuid:=gen_random_uuid();
 request uuid:=gen_random_uuid(); release_request uuid:=gen_random_uuid(); record uuid:=gen_random_uuid(); batch uuid:=gen_random_uuid();
 second_page uuid:='ffffffff-ffff-4fff-8fff-ffffffffffff'; body jsonb; second_body jsonb; invalid_body jsonb; h text;
 result jsonb; original jsonb; learner_original jsonb; receipt jsonb; page jsonb; continuation jsonb;
BEGIN
 body:=pg_temp.context_snapshot(target,op,subscription,'recruiter-context@fixture.example','recruiter','41001');
 result:=public.zoho_apply_candidate_projection(body::text,encode(sha256(convert_to(body::text,'UTF8')),'hex'));
 ASSERT EXISTS(SELECT 1 FROM public.users WHERE id=target AND role='recruiter' AND temporary_password IS NULL);
 ASSERT EXISTS(SELECT 1 FROM public.learners WHERE user_id=target AND notification_settings->>'emailNotifications'='false');
 ASSERT public.zoho_check_candidate_projection(op,result->>'sourceHash',result->>'projectionHash',(result->>'projectionReceiptId')::uuid);
 -- Missing learner mirror: canonical additional context does not rewrite the existing primary role or explicit preferences.
 INSERT INTO public.users(id,email,role,"firstName",metadata) VALUES(second_target,'educator-context@fixture.example','college_educator','Existing','{"preference":false}');
 SELECT to_jsonb(u) INTO original FROM public.users u WHERE id=second_target;
 second_body:=pg_temp.context_snapshot(second_target,second_op,second_subscription,'educator-context@fixture.example','college_educator','41002');
 PERFORM public.zoho_apply_candidate_projection(second_body::text,encode(sha256(convert_to(second_body::text,'UTF8')),'hex'));
 ASSERT (SELECT to_jsonb(u)=original FROM public.users u WHERE id=second_target);
 ASSERT EXISTS(SELECT 1 FROM public.learners WHERE user_id=second_target);
 invalid_body:=pg_temp.context_snapshot(invalid_target,invalid_op,invalid_subscription,'unsupported-context@fixture.example','teacher','41003');
 PERFORM pg_temp.reject_context_projection(invalid_body);
 ASSERT NOT EXISTS(SELECT 1 FROM public.users WHERE id=invalid_target);
 invalid_body:=jsonb_set(invalid_body,'{user,primaryRole}','"recruiter"');
 invalid_body:=jsonb_set(invalid_body,'{learnerContext,primaryContext,role}','"recruiter"');
 PERFORM pg_temp.reject_context_projection(invalid_body-'learnerContext');
 PERFORM pg_temp.reject_context_projection(jsonb_set(invalid_body,'{learnerContext,active}','false'));
 PERFORM pg_temp.reject_context_projection(jsonb_set(invalid_body,'{learnerContext,source,sourceOrgId}','"not-an-org"'));
 PERFORM pg_temp.reject_context_projection(jsonb_set(invalid_body,'{learnerContext,membershipId}','"bad"'));
 PERFORM pg_temp.reject_context_projection(jsonb_set(invalid_body,'{learnerContext,primaryContext,role}','"super_admin"'));
 PERFORM pg_temp.reject_context_projection(jsonb_set(jsonb_set(invalid_body,'{user,primaryRole}','"super_admin"'),'{learnerContext,primaryContext,role}','"super_admin"'));
 ASSERT NOT EXISTS(SELECT 1 FROM public.users WHERE id=invalid_target);

 INSERT INTO public.organizations(id) VALUES(publisher);
 INSERT INTO public.zoho_connections(id,name,source_org_id,region,publisher_organization_id,status,created_by)
 VALUES(connection,'Context privacy fixture','1234','in',publisher,'connected',actor);
 INSERT INTO public.zoho_staged_records(id,connection_id,module,external_id,source_modified_at,source_hash,config_revision,proposed_data)
 VALUES(record,connection,'Candidates','41001',now(),repeat('a',64),1,'{"email":"recruiter-context@fixture.example","name":"Connector supplied"}');
 INSERT INTO public.zoho_approval_batches(id,connection_id,request_id,actor_id,decision,reason,manifest)
 VALUES(batch,connection,gen_random_uuid(),actor,'approve','Synthetic approved payload','{}');
 INSERT INTO public.zoho_approved_operations(id,batch_id,record_id,record_revision,source_hash,config_revision,approved_data,action,expires_at)
 VALUES(op,batch,record,1,repeat('a',64),1,'{"email":"recruiter-context@fixture.example"}','provision_candidate',now()+interval '1 hour');
 SELECT to_jsonb(u) INTO original FROM public.users u WHERE id=target;
 SELECT to_jsonb(l) INTO learner_original FROM public.learners l WHERE user_id=target;
 receipt:=jsonb_build_object('version',1,'requestId',request,'action','erase_connector','state','completed','targetId',target,
  'sourceOrgId','1234','externalId','41001','emailPolicy','forbidden','canonicalAccountPreserved',true,
  'erasedOperationIds',jsonb_build_array(op),'moreErasedOperations',true);
 BEGIN
  PERFORM public.zoho_apply_candidate_administration(connection,receipt||jsonb_build_object('requestId',gen_random_uuid(),
    'erasedOperationIds',jsonb_build_array(second_op),'moreErasedOperations',false),actor,NULL);
  RAISE EXCEPTION 'Erasure of another canonical target accepted';
 EXCEPTION WHEN invalid_parameter_value OR serialization_failure THEN NULL; END;
 result:=public.zoho_apply_candidate_administration(connection,receipt,actor,NULL);
 ASSERT result->>'state'='application_pending' AND result->>'afterOperationId'=op::text;
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_source_erasure WHERE target_id=target AND suppressed);
 ASSERT NOT public.zoho_check_candidate_projection(op,body->>'sourceHash',encode(sha256(convert_to(body::text,'UTF8')),'hex'),
  (SELECT receipt_id FROM public.zoho_candidate_projections WHERE operation_id=op));
 PERFORM pg_temp.reject_context_projection(body);
 ASSERT EXISTS(SELECT 1 FROM public.zoho_staged_records WHERE id=record AND proposed_data='{}' AND payload_redacted_at IS NOT NULL AND decision='rejected');
 ASSERT EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE id=op AND approved_data='{}' AND state='revoked');
 ASSERT EXISTS(SELECT 1 FROM public.zoho_source_suppressions WHERE source_org_id='1234' AND external_id='41001');
 ASSERT (SELECT to_jsonb(u)=original FROM public.users u WHERE id=target);
 ASSERT (SELECT to_jsonb(l)=learner_original FROM public.learners l WHERE user_id=target);
 ASSERT EXISTS(SELECT 1 FROM public.subscription_cache WHERE id=subscription AND user_id=target AND status='active');
 -- Already signed snapshots with a different operation still cannot cross the active source fence.
 PERFORM pg_temp.reject_context_projection(jsonb_set(body,'{operationId}',to_jsonb(gen_random_uuid())));
 page:=receipt||jsonb_build_object('erasedOperationIds',jsonb_build_array(second_page),'moreErasedOperations',false);
 BEGIN
  PERFORM public.zoho_apply_candidate_administration(connection,page,actor,NULL);
  RAISE EXCEPTION 'Wrong continuation cursor accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 continuation:=public.zoho_apply_candidate_administration(connection,page,actor,op);
 ASSERT continuation->>'state'='completed';
 ASSERT public.zoho_apply_candidate_administration(connection,page,actor,op)->>'state'='completed';
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_erased_operations WHERE operation_id=op AND target_id=target);
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_erased_operations WHERE operation_id=second_page AND target_id=target);
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_administration_progress WHERE request_id=request AND completed AND last_operation_id=second_page);
 INSERT INTO public.zoho_bulk_read_runs(connection_id,module,request_id,actor_id,config_revision,credential_generation,state,artifact_key,artifact_write_pending)
 VALUES(connection,'Candidates',gen_random_uuid(),actor,1,1,'failed','private-test-ciphertext',true);
 ASSERT public.zoho_confirm_candidate_administration(request,actor)->>'state'='application_pending';
 UPDATE public.zoho_bulk_read_runs SET artifact_key=NULL,artifact_write_pending=false WHERE connection_id=connection;
 ASSERT public.zoho_confirm_candidate_administration(request,actor)->>'state'='completed';
 ASSERT EXISTS(SELECT 1 FROM public.zoho_candidate_administration_progress WHERE request_id=request AND artifacts_confirmed);

 receipt:=receipt||jsonb_build_object('requestId',release_request,'action','release_suppression','erasedOperationIds','[]'::jsonb,'moreErasedOperations',false);
 result:=public.zoho_apply_candidate_administration(connection,receipt,actor,NULL);
 ASSERT result->>'state'='completed';
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_source_suppressions WHERE source_org_id='1234' AND external_id='41001');
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_candidate_source_erasure WHERE target_id=target AND suppressed);
 PERFORM pg_temp.reject_context_projection(body); -- release never revives an erased operation
 body:=jsonb_set(body,'{operationId}',to_jsonb(gen_random_uuid()));
 PERFORM public.zoho_apply_candidate_projection(body::text,encode(sha256(convert_to(body::text,'UTF8')),'hex'));
 ASSERT (SELECT to_jsonb(u)=original FROM public.users u WHERE id=target);
 ASSERT (SELECT to_jsonb(l)=learner_original FROM public.learners l WHERE user_id=target);
 ASSERT NOT has_function_privilege('anon','public.zoho_apply_candidate_administration(uuid,jsonb,uuid,uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_apply_candidate_administration(uuid,jsonb,uuid,uuid)','EXECUTE');
 ASSERT NOT has_table_privilege('service_role','public.zoho_candidate_source_erasure','UPDATE');
 ASSERT NOT has_table_privilege('service_role','public.zoho_candidate_erased_operations','DELETE');
 ASSERT (SELECT bool_and(NOT relrowsecurity) FROM pg_class WHERE oid IN('public.zoho_candidate_source_erasure'::regclass,'public.zoho_candidate_erased_operations'::regclass));
 GRANT SELECT ON public.zoho_candidate_source_erasure TO anon;
 BEGIN
  PERFORM public.zoho_assert_private_projection_boundary();
  RAISE EXCEPTION 'Browser-readable erasure metadata accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 ASSERT public.zoho_candidate_projection_ready() IS FALSE;
 REVOKE SELECT ON public.zoho_candidate_source_erasure FROM anon;
END $$;
