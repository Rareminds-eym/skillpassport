CREATE FUNCTION public.fixture_job_grant(p_connection uuid,p_external text,p_status text DEFAULT 'Open',p_title text DEFAULT 'Engineer') RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r jsonb; staged public.zoho_staged_records; operation uuid; actor uuid:='10000000-0000-4000-8000-000000000002';
BEGIN
 r:=public.zoho_stage_record(p_connection,'Job_Openings',p_external,clock_timestamp(),jsonb_build_object(
 'title',p_title,'company_name','Fixture Company','department','','location','Bengaluru','employment_type','Full time',
 'description','Fixture description','application_link','https://fixture.example/apply','source_status',p_status),'["department mapping is required.","Job publication and status mapping requires review."]');
 SELECT * INTO STRICT staged FROM public.zoho_staged_records WHERE id=(r->>'id')::uuid;
 PERFORM public.zoho_decide_records(p_connection,jsonb_build_array(jsonb_build_object('id',staged.id,'revision',staged.revision,
 'sourceHash',staged.source_hash,'configRevision',staged.config_revision,'targetId',staged.target_id)),
 'approve','Fixture reviewed all changes',gen_random_uuid(),actor);
 SELECT id INTO STRICT operation FROM public.zoho_approved_operations WHERE record_id=staged.id AND record_revision=staged.revision;
 RETURN public.zoho_claim_operation(operation,gen_random_uuid());
END $$;
-- Historical schema upgrade fixture: current pipeline is checked after forward migrations.
DO $$
DECLARE connection uuid; g jsonb; result jsonb; target uuid; failed boolean;
BEGIN
 INSERT INTO public.organizations(id) VALUES('10000000-0000-4000-8000-000000000001');
 INSERT INTO public.features VALUES('10000000-0000-4000-8000-000000000003','active_job_posts');
 INSERT INTO public.tenant_entitlement_overrides VALUES('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003',1,true,NULL,now());
 connection:=(public.zoho_register_connection('Job fixture','88888888888888888881','in',
 '10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002')->>'id')::uuid;
 UPDATE public.zoho_connections SET status='connected' WHERE id=connection;
 ASSERT (public.zoho_job_publishing_preflight(connection)->>'entitlementReady')::boolean;
 ASSERT (public.zoho_job_publishing_preflight(connection)->>'remainingSlots')::numeric=1;
 ASSERT NOT public.zoho_job_publisher_ready(),'Publisher defaults ready';
 ASSERT (public.zoho_read_job_policy(connection)->'policy')='null'::jsonb;
 failed:=false;BEGIN PERFORM public.zoho_configure_job_policy(connection,'10000000-0000-4000-8000-000000000002',1,'{"Open":"open"}','{"Full time":"job"}',true,false,public.zoho_job_trigger_fingerprint(),'Missing review'); EXCEPTION WHEN OTHERS THEN failed:=true;END;ASSERT failed;
 PERFORM public.zoho_configure_job_policy(connection,'10000000-0000-4000-8000-000000000002',1,'{"Open":"open","Closed":"closed","Draft":"draft"}','{"Full time":"job"}',true,true,public.zoho_job_trigger_fingerprint(),'Reviewed notification dependencies');
 ASSERT (public.zoho_read_job_policy(connection)->>'configRevision')='2';
 ASSERT (SELECT count(*)=1 FROM public.zoho_job_policy_audit);
 ASSERT public.zoho_job_publisher_ready();
 ASSERT (public.zoho_stage_record(connection,'Job_Openings','99',clock_timestamp(),'{"source_status":"UNKNOWN","employment_type":"Full time"}','[]')->>'revision')='1';
 ASSERT (SELECT jsonb_array_length(validation_errors)=1 FROM public.zoho_staged_records WHERE connection_id=connection AND external_id='99');
 g:=public.fixture_job_grant(connection,'1');
 failed:=false;BEGIN PERFORM public.zoho_apply_job_operation(jsonb_set(g,'{data,title}','"Forged"'));EXCEPTION WHEN OTHERS THEN failed:=true; END;ASSERT failed,'Forged approval accepted';
 failed:=false;BEGIN PERFORM public.zoho_apply_job_operation(jsonb_set(g,'{publisherOrganizationId}',to_jsonb(gen_random_uuid())));EXCEPTION WHEN OTHERS THEN failed:=true;END;ASSERT failed,'Publisher override accepted';
 INSERT INTO public.plans_cache(id,plan_code) VALUES('10000000-0000-4000-8000-000000000010','recruiter_fixture');
 INSERT INTO public.subscription_cache(plan_id,organization_id,status,created_at) VALUES('10000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000001','active',now());
 INSERT INTO public.plan_entitlements VALUES('10000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000003',10,true);
 UPDATE public.tenant_entitlement_overrides SET is_enabled=false;
 ASSERT NOT (public.zoho_job_publishing_preflight(connection)->>'entitlementReady')::boolean;
 failed:=false;BEGIN PERFORM public.zoho_apply_job_operation_effect(g);EXCEPTION WHEN OTHERS THEN failed:=true;END;ASSERT failed,'Disabled override fell through to enabled plan';
 UPDATE public.tenant_entitlement_overrides SET is_enabled=true,expires_at=now()-interval '1 second';
 INSERT INTO public.plans_cache(id,plan_code) VALUES('10000000-0000-4000-8000-000000000011','recruiter_parent_fixture');
 UPDATE public.plans_cache SET parent_plan_id='10000000-0000-4000-8000-000000000011' WHERE id='10000000-0000-4000-8000-000000000010';
 DELETE FROM public.plan_entitlements WHERE plan_id='10000000-0000-4000-8000-000000000010';
 INSERT INTO public.plan_entitlements VALUES('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000003',1,true);
 result:=public.zoho_apply_job_operation(g);target:=(result->>'targetId')::uuid;
 UPDATE public.tenant_entitlement_overrides SET expires_at=NULL;
 ASSERT (public.zoho_job_publishing_preflight(connection)->>'remainingSlots')::numeric=0;
 ASSERT (public.zoho_job_publishing_preflight(connection)->>'pendingOpenJobs')::bigint=0;
 ASSERT result=public.zoho_apply_job_operation(g),'Replay changed receipt';
 ASSERT (SELECT count(*)=1 FROM public.opportunities);
 ASSERT (SELECT title='Engineer' AND department='' AND employment_type='job' AND status='open' AND is_active FROM public.opportunities WHERE id=target);
 ASSERT NOT EXISTS(SELECT 1 FROM public.learning_job_notification_work),'Job triggered notification queue';
 PERFORM public.zoho_complete_operation((g->>'operationId')::uuid,(g->>'lease')::uuid,target,(result->>'receiptId')::uuid);
 ASSERT public.zoho_find_job_operation_receipt((g->>'operationId')::uuid,g->>'sourceHash')=result,'Completed receipt not recoverable';
 -- Quota covers all current publisher jobs; a second integration record cannot bypass it.
 g:=public.fixture_job_grant(connection,'2');
 failed:=false;BEGIN PERFORM public.zoho_apply_job_operation_effect(g);EXCEPTION WHEN OTHERS THEN failed:=true;END;ASSERT failed,'Quota exceeded';
 ASSERT (SELECT count(*)=1 FROM public.opportunities);
 PERFORM public.zoho_record_execution_outcome((g->>'operationId')::uuid,(g->>'lease')::uuid,'NOT_APPLIED');
 -- Local changes require manual conflict review; the source cannot overwrite them.
 g:=public.fixture_job_grant(connection,'1','Closed','Updated');
 UPDATE public.opportunities SET title='Local edit' WHERE id=target;
 failed:=false;BEGIN PERFORM public.zoho_apply_job_operation_effect(g);EXCEPTION WHEN OTHERS THEN failed:=true;END;ASSERT failed,'Local change overwritten';
 UPDATE public.opportunities SET title='Engineer' WHERE id=target;
 result:=public.zoho_apply_job_operation(g);
 ASSERT (SELECT title='Updated' AND status='closed' AND NOT is_active FROM public.opportunities WHERE id=target);
 ASSERT NOT EXISTS(SELECT 1 FROM public.learning_job_notification_work);
 PERFORM public.zoho_complete_operation((g->>'operationId')::uuid,(g->>'lease')::uuid,target,(result->>'receiptId')::uuid);
 -- Mapping config updates invalidate already-approved source versions.
 g:=public.fixture_job_grant(connection,'3');
 failed:=false;BEGIN PERFORM public.zoho_configure_job_policy(connection,'10000000-0000-4000-8000-000000000002',2,'{"Open":"draft","Closed":"closed"}','{"Full time":"job"}',true,true,public.zoho_job_trigger_fingerprint(),'In-flight change');EXCEPTION WHEN OTHERS THEN failed:=true;END;ASSERT failed,'In-flight mapping changed';
 PERFORM public.zoho_record_execution_outcome((g->>'operationId')::uuid,(g->>'lease')::uuid,'NOT_APPLIED');
 PERFORM public.zoho_configure_job_policy(connection,'10000000-0000-4000-8000-000000000002',2,'{"Open":"draft","Closed":"closed"}','{"Full time":"job"}',true,true,public.zoho_job_trigger_fingerprint(),'Reviewed mapping change');
 failed:=false;BEGIN PERFORM public.zoho_apply_job_operation_effect(g);EXCEPTION WHEN OTHERS THEN failed:=true;END;ASSERT failed,'Old mapping approval accepted';
 ASSERT NOT has_function_privilege('anon','public.zoho_apply_job_operation(jsonb)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_apply_job_operation(jsonb)','EXECUTE');
 ASSERT has_function_privilege('service_role','public.zoho_apply_job_operation(jsonb)','EXECUTE');
 ASSERT NOT has_table_privilege('service_role','public.zoho_job_links','INSERT,UPDATE,DELETE');
 ASSERT NOT has_table_privilege('service_role','public.zoho_job_receipts','INSERT,UPDATE,DELETE');
 ASSERT NOT has_table_privilege('service_role','public.zoho_job_publisher_policies','INSERT,UPDATE,DELETE');
 ASSERT NOT has_table_privilege('service_role','public.zoho_job_policy_audit','INSERT,UPDATE,DELETE');
END $$;
GRANT UPDATE(title) ON public.opportunities TO authenticated;
DO $$ BEGIN ASSERT NOT public.zoho_job_publisher_ready(),'Legacy column grants accepted'; END $$;
REVOKE UPDATE(title) ON public.opportunities FROM authenticated;
-- Separate source connections share a publisher and must share its last quota slot.
CREATE TABLE public.fixture_concurrent_job_grants(n integer PRIMARY KEY,grant_value jsonb NOT NULL);
DO $$ DECLARE connection uuid; n integer; BEGIN
 FOR n IN 1..2 LOOP
  connection:=(public.zoho_register_connection('Concurrent job fixture','8888888888888888888'||(n+1)::text,'in',
   '10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002')->>'id')::uuid;
  UPDATE public.zoho_connections SET status='connected' WHERE id=connection;
  PERFORM public.zoho_configure_job_policy(connection,'10000000-0000-4000-8000-000000000002',1,'{"Open":"open"}','{"Full time":"job"}',true,true,public.zoho_job_trigger_fingerprint(),'Reviewed concurrent publisher fixture');
  INSERT INTO public.fixture_concurrent_job_grants VALUES(n,public.fixture_job_grant(connection,'100'));
 END LOOP;
END $$;
GRANT SELECT ON public.fixture_concurrent_job_grants TO service_role;
