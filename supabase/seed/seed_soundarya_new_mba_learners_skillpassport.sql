-- Soundarya College: add 4 MBA learners to SkillPassport App DB
-- Uses the SAME user UUIDs as the SSO seed. Includes org mapping, learner rows, and enterprise license assignment.
BEGIN;

DO $seed_soundarya_4_mba$
DECLARE
  v_org_id uuid := '284c9ed9-cd13-584d-b5bc-e198866b917b';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id=v_org_id) THEN RAISE EXCEPTION 'Soundarya organization % does not exist', v_org_id; END IF;
  INSERT INTO public.users (id,email,"organizationId","firstName","lastName",phone,role,"isActive",metadata,"createdAt","updatedAt") VALUES
    ('a42bacdf-bcb3-441e-9a5c-2413f20616f1'::uuid,'simrithasuresh31@gmail.com',v_org_id,'Simritha','S','7904603568','learner',true,'{"role":"learner","lastName":"S","firstName":"Simritha","contact_number":"7904603568"}'::jsonb,NOW(),NOW()),
    ('523512cd-9c31-4ae9-8eeb-a1e839a99946'::uuid,'ddeekshith920@gmail.com',v_org_id,'Deekshith','','9035626885','learner',true,'{"role":"learner","lastName":"","firstName":"Deekshith","contact_number":"9035626885"}'::jsonb,NOW(),NOW()),
    ('597faf14-c863-4e95-bb8e-d90a9e0c33ff'::uuid,'sumithasenthil0225@gmail.com',v_org_id,'Sumitha','S','9092039023','learner',true,'{"role":"learner","lastName":"S","firstName":"Sumitha","contact_number":"9092039023"}'::jsonb,NOW(),NOW()),
    ('376652c3-0405-557d-9610-54c96740a56a'::uuid,'priyankapriyanka54295@gmail.com',v_org_id,'Priyanka','Y A','7892349083','learner',true,'{"role":"learner","lastName":"Y A","firstName":"Priyanka","contact_number":"7892349083"}'::jsonb,NOW(),NOW())
  ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,"organizationId"=EXCLUDED."organizationId","firstName"=EXCLUDED."firstName","lastName"=EXCLUDED."lastName",phone=EXCLUDED.phone,role='learner',"isActive"=true,metadata=EXCLUDED.metadata,"updatedAt"=NOW();

  INSERT INTO public.users_shadow (id,email,created_at,updated_at) VALUES
    ('a42bacdf-bcb3-441e-9a5c-2413f20616f1'::uuid,'simrithasuresh31@gmail.com',NOW(),NOW()),
    ('523512cd-9c31-4ae9-8eeb-a1e839a99946'::uuid,'ddeekshith920@gmail.com',NOW(),NOW()),
    ('597faf14-c863-4e95-bb8e-d90a9e0c33ff'::uuid,'sumithasenthil0225@gmail.com',NOW(),NOW()),
    ('376652c3-0405-557d-9610-54c96740a56a'::uuid,'priyankapriyanka54295@gmail.com',NOW(),NOW())
  ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, updated_at=NOW();

  INSERT INTO public.organization_members (user_id,organization_id,role,status,created_at,updated_at) VALUES
    ('a42bacdf-bcb3-441e-9a5c-2413f20616f1'::uuid,v_org_id,'member','active',NOW(),NOW()),
    ('523512cd-9c31-4ae9-8eeb-a1e839a99946'::uuid,v_org_id,'member','active',NOW(),NOW()),
    ('597faf14-c863-4e95-bb8e-d90a9e0c33ff'::uuid,v_org_id,'member','active',NOW(),NOW()),
    ('376652c3-0405-557d-9610-54c96740a56a'::uuid,v_org_id,'member','active',NOW(),NOW())
  ON CONFLICT (user_id,organization_id) DO UPDATE SET role='member',status='active',updated_at=NOW();

  INSERT INTO public.learners (id,user_id,email,name,contact_number,college_id,learner_type,approval_status,metadata,created_at,updated_at) VALUES
    ('a42bacdf-bcb3-441e-9a5c-2413f20616f1'::uuid,'a42bacdf-bcb3-441e-9a5c-2413f20616f1'::uuid,'simrithasuresh31@gmail.com','Simritha S','7904603568',v_org_id,'college_student','approved','{"role":"learner","lastName":"S","firstName":"Simritha","contact_number":"7904603568"}'::jsonb,NOW(),NOW()),
    ('523512cd-9c31-4ae9-8eeb-a1e839a99946'::uuid,'523512cd-9c31-4ae9-8eeb-a1e839a99946'::uuid,'ddeekshith920@gmail.com','Deekshith','9035626885',v_org_id,'college_student','approved','{"role":"learner","lastName":"","firstName":"Deekshith","contact_number":"9035626885"}'::jsonb,NOW(),NOW()),
    ('597faf14-c863-4e95-bb8e-d90a9e0c33ff'::uuid,'597faf14-c863-4e95-bb8e-d90a9e0c33ff'::uuid,'sumithasenthil0225@gmail.com','Sumitha S','9092039023',v_org_id,'college_student','approved','{"role":"learner","lastName":"S","firstName":"Sumitha","contact_number":"9092039023"}'::jsonb,NOW(),NOW()),
    ('376652c3-0405-557d-9610-54c96740a56a'::uuid,'376652c3-0405-557d-9610-54c96740a56a'::uuid,'priyankapriyanka54295@gmail.com','Priyanka Y A','7892349083',v_org_id,'college_student','approved','{"role":"learner","lastName":"Y A","firstName":"Priyanka","contact_number":"7892349083"}'::jsonb,NOW(),NOW())
  ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name,contact_number=EXCLUDED.contact_number,college_id=v_org_id,learner_type='college_student',approval_status='approved',is_deleted=false,metadata=EXCLUDED.metadata,updated_at=NOW();

  INSERT INTO public.license_pools (id,organization_subscription_id,organization_id,organization_type,pool_name,member_type,allocated_seats,auto_assign_new_members,assignment_criteria,is_active,created_by)
  VALUES ('84f6a944-a23d-56d8-9823-1f4d8c8e39f8'::uuid,'d3876903-b74e-55d7-910f-90907ea3e11f'::uuid,v_org_id,'college','Soundarya learners','learner',5000,true,jsonb_build_object('role','learner','organization_id',v_org_id::text),true,'783d8431-a034-5369-ae47-3aca2c4ec618'::uuid)
  ON CONFLICT (id) DO UPDATE SET allocated_seats=EXCLUDED.allocated_seats,auto_assign_new_members=true,is_active=true,updated_at=NOW();

  INSERT INTO public.license_assignments (license_pool_id,organization_subscription_id,user_id,member_type,status,assigned_by) VALUES
    ('84f6a944-a23d-56d8-9823-1f4d8c8e39f8'::uuid,'d3876903-b74e-55d7-910f-90907ea3e11f'::uuid,'a42bacdf-bcb3-441e-9a5c-2413f20616f1'::uuid,'learner','active','783d8431-a034-5369-ae47-3aca2c4ec618'::uuid),
    ('84f6a944-a23d-56d8-9823-1f4d8c8e39f8'::uuid,'d3876903-b74e-55d7-910f-90907ea3e11f'::uuid,'523512cd-9c31-4ae9-8eeb-a1e839a99946'::uuid,'learner','active','783d8431-a034-5369-ae47-3aca2c4ec618'::uuid),
    ('84f6a944-a23d-56d8-9823-1f4d8c8e39f8'::uuid,'d3876903-b74e-55d7-910f-90907ea3e11f'::uuid,'597faf14-c863-4e95-bb8e-d90a9e0c33ff'::uuid,'learner','active','783d8431-a034-5369-ae47-3aca2c4ec618'::uuid),
    ('84f6a944-a23d-56d8-9823-1f4d8c8e39f8'::uuid,'d3876903-b74e-55d7-910f-90907ea3e11f'::uuid,'376652c3-0405-557d-9610-54c96740a56a'::uuid,'learner','active','783d8431-a034-5369-ae47-3aca2c4ec618'::uuid)
  ON CONFLICT (user_id,organization_subscription_id) WHERE status='active' DO UPDATE SET license_pool_id=EXCLUDED.license_pool_id,member_type='learner',updated_at=NOW();
END;
$seed_soundarya_4_mba$;

COMMIT;
