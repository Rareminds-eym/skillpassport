CREATE FUNCTION public.fixture_job_grant(p_connection uuid,p_external text,p_status text DEFAULT 'Open',p_title text DEFAULT 'Engineer') RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r jsonb; staged public.zoho_staged_records; operation uuid; actor uuid:='10000000-0000-4000-8000-000000000002';
BEGIN
 r:=public.zoho_stage_record(p_connection,'Job_Openings',p_external,clock_timestamp(),jsonb_build_object(
 'title',p_title,'company_name','Fixture Company','department','Engineering','location','Bengaluru','employment_type','Full time',
 'description','Fixture description','application_link','https://fixture.example/apply','source_status',p_status),'["Job publication and status mapping requires review."]');
 SELECT * INTO STRICT staged FROM public.zoho_staged_records WHERE id=(r->>'id')::uuid;
 PERFORM public.zoho_decide_records(p_connection,jsonb_build_array(jsonb_build_object('id',staged.id,'revision',staged.revision,
 'sourceHash',staged.source_hash,'configRevision',staged.config_revision,'targetId',staged.target_id)),
 'approve','Fixture reviewed all changes',gen_random_uuid(),actor);
 SELECT id INTO STRICT operation FROM public.zoho_approved_operations WHERE record_id=staged.id AND record_revision=staged.revision;
 RETURN public.zoho_claim_operation(operation,gen_random_uuid());
END $$;
-- Dormant/local-only markers are defined BEFORE approval so the tests prove
-- post-review wiring drift, not merely detection of a new public function.
CREATE TABLE public.fixture_job_side_effect_markers(marker text NOT NULL);
CREATE FUNCTION public.fixture_job_default_marker() RETURNS text LANGUAGE plpgsql AS $body$
BEGIN INSERT INTO public.fixture_job_side_effect_markers VALUES('default'); RETURN 'marker'; END $body$;
CREATE SCHEMA fixture_job_helpers;
CREATE FUNCTION fixture_job_helpers.noop() RETURNS void LANGUAGE plpgsql AS $body$ BEGIN RETURN; END $body$;
CREATE FUNCTION public.fixture_job_helper_trigger() RETURNS trigger LANGUAGE plpgsql AS $body$
BEGIN PERFORM fixture_job_helpers.noop(); RETURN NEW; END $body$;
CREATE TRIGGER fixture_job_helper AFTER INSERT ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.fixture_job_helper_trigger();
DO $$
DECLARE connection uuid; g jsonb; result jsonb; target uuid; failed boolean; oldfp text; helper_definition text;
BEGIN
 INSERT INTO public.organizations(id) VALUES('10000000-0000-4000-8000-000000000001');
 INSERT INTO public.features VALUES('10000000-0000-4000-8000-000000000003','active_job_posts');
 INSERT INTO public.tenant_entitlement_overrides VALUES('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003',1,true,NULL,now());
 connection:=(public.zoho_register_connection('Job fixture','88888888888888888881','in',
 '10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002')->>'id')::uuid;
 UPDATE public.zoho_connections SET status='connected' WHERE id=connection;
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
 oldfp:=public.zoho_job_trigger_fingerprint();
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(public.zoho_read_job_policy(connection)->'triggerSurface') surface
  WHERE surface->>'name' LIKE 'routine: fixture_job_helpers.noop%'),'Non-public helper missing from operator review';
 -- Installing a new DEFAULT that calls an already existing marker must fail
 -- before either the marker or target job is written.
 EXECUTE 'ALTER TABLE public.opportunities ALTER COLUMN company_logo SET DEFAULT public.fixture_job_default_marker()';
 ASSERT oldfp IS DISTINCT FROM public.zoho_job_trigger_fingerprint(),'DEFAULT drift left review valid';
 ASSERT NOT public.zoho_job_publisher_ready();
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(public.zoho_read_job_policy(connection)->'triggerSurface') surface
  WHERE surface->>'name'='default: opportunities.company_logo' AND surface->>'definition' LIKE '%fixture_job_default_marker%'),'DEFAULT missing from operator review';
 failed:=false; BEGIN PERFORM public.zoho_apply_job_operation_effect(g); EXCEPTION WHEN SQLSTATE 'ZJ001' THEN failed:=true; END;
 ASSERT failed AND NOT EXISTS(SELECT 1 FROM public.fixture_job_side_effect_markers),'Unreviewed DEFAULT executed';
 EXECUTE 'ALTER TABLE public.opportunities ALTER COLUMN company_logo DROP DEFAULT';
 ASSERT oldfp=public.zoho_job_trigger_fingerprint(),'DEFAULT restoration changed stable surface';
 -- A reviewed trigger's helper can reside outside public. Replacing only that
 -- helper must revoke review, while restoring the exact body restores the digest.
 SELECT pg_get_functiondef('fixture_job_helpers.noop()'::regprocedure) INTO helper_definition;
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_job_helpers.noop() RETURNS void LANGUAGE plpgsql AS $body$ BEGIN INSERT INTO public.fixture_job_side_effect_markers VALUES(''helper''); END $body$';
 ASSERT oldfp IS DISTINCT FROM public.zoho_job_trigger_fingerprint(),'Non-public helper drift left review valid';
 failed:=false; BEGIN PERFORM public.zoho_apply_job_operation_effect(g); EXCEPTION WHEN SQLSTATE 'ZJ001' THEN failed:=true; END;
 ASSERT failed AND NOT EXISTS(SELECT 1 FROM public.fixture_job_side_effect_markers),'Unreviewed helper executed';
 EXECUTE helper_definition;
 ASSERT oldfp=public.zoho_job_trigger_fingerprint();
 -- Rewrite rules can enqueue effects without changing a trigger or routine.
 EXECUTE 'CREATE RULE fixture_job_rule AS ON INSERT TO public.opportunities DO ALSO INSERT INTO public.fixture_job_side_effect_markers VALUES(''rule'')';
 ASSERT oldfp IS DISTINCT FROM public.zoho_job_trigger_fingerprint(),'Rule drift left review valid';
 failed:=false; BEGIN PERFORM public.zoho_apply_job_operation_effect(g); EXCEPTION WHEN SQLSTATE 'ZJ001' THEN failed:=true; END;
 ASSERT failed AND NOT EXISTS(SELECT 1 FROM public.fixture_job_side_effect_markers),'Unreviewed rewrite rule executed';
 EXECUTE 'DROP RULE fixture_job_rule ON public.opportunities';
 ASSERT oldfp=public.zoho_job_trigger_fingerprint();
 failed:=false;BEGIN PERFORM public.zoho_apply_job_operation(jsonb_set(g,'{data,title}','"Forged"'));EXCEPTION WHEN OTHERS THEN failed:=true; END;ASSERT failed,'Forged approval accepted';
 failed:=false;BEGIN PERFORM public.zoho_apply_job_operation(jsonb_set(g,'{publisherOrganizationId}',to_jsonb(gen_random_uuid())));EXCEPTION WHEN OTHERS THEN failed:=true;END;ASSERT failed,'Publisher override accepted';
 INSERT INTO public.plans_cache(id,plan_code) VALUES('10000000-0000-4000-8000-000000000010','recruiter_fixture');
 INSERT INTO public.subscription_cache(plan_id,organization_id,status,created_at) VALUES('10000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000001','active',now());
 INSERT INTO public.plan_entitlements VALUES('10000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000003',10,true);
 UPDATE public.tenant_entitlement_overrides SET is_enabled=false;
 failed:=false;BEGIN PERFORM public.zoho_apply_job_operation_effect(g);EXCEPTION WHEN OTHERS THEN failed:=true;END;ASSERT failed,'Disabled override fell through to enabled plan';
 UPDATE public.tenant_entitlement_overrides SET is_enabled=true,expires_at=now()-interval '1 second';
 INSERT INTO public.plans_cache(id,plan_code) VALUES('10000000-0000-4000-8000-000000000011','recruiter_parent_fixture');
 UPDATE public.plans_cache SET parent_plan_id='10000000-0000-4000-8000-000000000011' WHERE id='10000000-0000-4000-8000-000000000010';
 DELETE FROM public.plan_entitlements WHERE plan_id='10000000-0000-4000-8000-000000000010';
 INSERT INTO public.plan_entitlements VALUES('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000003',1,true);
 result:=public.zoho_apply_job_operation(g);target:=(result->>'targetId')::uuid;
 UPDATE public.tenant_entitlement_overrides SET expires_at=NULL;
 ASSERT result=public.zoho_apply_job_operation(g),'Replay changed receipt';
 ASSERT (SELECT count(*)=1 FROM public.opportunities);
 ASSERT (SELECT title='Engineer' AND employment_type='job' AND status='open' AND is_active FROM public.opportunities WHERE id=target);
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
-- Trigger replica/origin mode changes must invalidate review too.
ALTER TABLE public.opportunities ENABLE REPLICA TRIGGER enqueue_learning_opening;
DO $$ BEGIN ASSERT NOT public.zoho_job_publisher_ready(),'Trigger firing-mode drift accepted'; END $$;
ALTER TABLE public.opportunities ENABLE TRIGGER enqueue_learning_opening;
DO $$ BEGIN ASSERT public.zoho_job_publisher_ready(); END $$;
ALTER TABLE public.opportunities DISABLE TRIGGER enqueue_learning_opening;
DO $$ BEGIN ASSERT NOT public.zoho_job_publisher_ready(),'Disabled-trigger drift accepted'; END $$;
ALTER TABLE public.opportunities ENABLE TRIGGER enqueue_learning_opening;
DO $$ BEGIN ASSERT public.zoho_job_publisher_ready(); END $$;
-- Unknown trigger/function changes revoke no-email readiness immediately.
CREATE FUNCTION public.fixture_unreviewed_job_hook() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER fixture_unknown AFTER INSERT ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.fixture_unreviewed_job_hook();
DO $$ BEGIN ASSERT NOT public.zoho_job_publisher_ready(),'Unknown trigger accepted'; END $$;
DROP TRIGGER fixture_unknown ON public.opportunities;
DROP FUNCTION public.fixture_unreviewed_job_hook();
DO $$ BEGIN ASSERT public.zoho_job_publisher_ready(); END $$;
GRANT UPDATE(title) ON public.opportunities TO authenticated;
DO $$ BEGIN ASSERT NOT public.zoho_job_publisher_ready(),'Legacy column grants accepted'; END $$;
REVOKE UPDATE(title) ON public.opportunities FROM authenticated;
CREATE VIEW public.fixture_job_write_view AS SELECT id,title FROM public.opportunities;
GRANT UPDATE ON public.fixture_job_write_view TO authenticated;
DO $$ BEGIN ASSERT NOT public.zoho_job_publisher_ready(),'Legacy dependent-view write grants accepted'; END $$;
DROP VIEW public.fixture_job_write_view;
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
