-- Runs only at the end of the existing disposable job-publisher test database.
TRUNCATE public.zoho_connections CASCADE;
DELETE FROM public.opportunities;
TRUNCATE public.tenant_entitlement_overrides;
ALTER TABLE public.organizations ADD COLUMN name text;
ALTER TABLE public.tenant_entitlement_overrides ADD COLUMN notes text;
CREATE UNIQUE INDEX fixture_entitlement_owner_feature ON public.tenant_entitlement_overrides(tenant_id,feature_id);
INSERT INTO public.organizations(id,name) VALUES('00000000-0000-0000-0000-000000000001','SkillPassport Platform');

CREATE TABLE public.fixture_platform_ownership(connection_id uuid, record_id uuid, target_id uuid, manual_id uuid, operation_id uuid, race_record_id uuid, race_target_id uuid);
DO $$
DECLARE c uuid; r uuid:=gen_random_uuid(); j uuid:=gen_random_uuid(); manual uuid:=gen_random_uuid();
  b uuid:=gen_random_uuid(); op uuid:=gen_random_uuid(); rev integer; race_record uuid:=gen_random_uuid(); race_target uuid:=gen_random_uuid();
BEGIN
  c:=(public.zoho_register_connection('Legacy publisher fixture','77777777777777777777','in',
    '10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002')->>'id')::uuid;
  UPDATE public.zoho_connections SET status='connected' WHERE id=c;
  INSERT INTO public.zoho_job_publisher_policies(connection_id,config_revision,status_map,employment_map,enabled,no_email_reviewed,trigger_fingerprint)
    VALUES(c,1,'{"Open":"open"}','{"Full time":"job"}',true,true,public.zoho_job_trigger_fingerprint());
  SELECT config_revision INTO rev FROM public.zoho_connections WHERE id=c;
  INSERT INTO public.opportunities(id,title,job_title,company_name,department,location,employment_type,description,status,is_active,organization_id)
    VALUES(j,'Imported fixture','Imported fixture','Fixture Company','','Chennai','job','Fixture description','draft',false,'10000000-0000-4000-8000-000000000001'),
      (manual,'Manual fixture','Manual fixture','Manual Company','','Chennai','job','Manual description','draft',false,'10000000-0000-4000-8000-000000000001'),
      (race_target,'Race fixture','Race fixture','Race Company','','Chennai','job','Race description','draft',false,'00000000-0000-0000-0000-000000000001');
  INSERT INTO public.zoho_staged_records(id,connection_id,module,external_id,source_modified_at,source_hash,config_revision,proposed_data,decision,target_id)
    VALUES(r,c,'Job_Openings','777',now(),repeat('a',64),rev,'{}','approved',j);
  INSERT INTO public.zoho_staged_records(id,connection_id,module,external_id,source_modified_at,source_hash,config_revision,proposed_data)
    VALUES(race_record,c,'Job_Openings','778',now(),repeat('b',64),rev,'{}');
  INSERT INTO public.zoho_job_links(record_id,target_id,publisher_id,source_revision,source_hash,target_fingerprint)
    SELECT r,j,'10000000-0000-4000-8000-000000000001',1,repeat('a',64),public.zoho_job_target_fingerprint(o) FROM public.opportunities o WHERE id=j;
  INSERT INTO public.zoho_approval_batches(id,connection_id,request_id,actor_id,decision,reason,manifest)
    VALUES(b,c,gen_random_uuid(),'10000000-0000-4000-8000-000000000002','approve','Legacy fixture approval','[]');
  INSERT INTO public.zoho_approved_operations(id,batch_id,record_id,record_revision,source_hash,config_revision,approved_data,action,state,expires_at)
    VALUES(op,b,r,1,repeat('a',64),rev,'{}','apply_job','processing',now()+interval '1 day');
  INSERT INTO public.fixture_platform_ownership VALUES(c,r,j,manual,op,race_record,race_target);
END $$;
