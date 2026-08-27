-- Seed the SkillPassport shadow/application records matching the Soundarya SSO migration.
BEGIN;

DO $seed$
DECLARE
  v_org_id uuid := '284c9ed9-cd13-584d-b5bc-e198866b917b';
  v_admin_id uuid := '783d8431-a034-5369-ae47-3aca2c4ec618';
  v_university_id uuid;
  v_university_college_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.organizations AS org WHERE lower(org.name)=lower('Soundarya Institute of Management and Science') AND org.id<>v_org_id) THEN
    RAISE EXCEPTION 'Soundarya organization already exists under a different ID';
  END IF;
  IF EXISTS (SELECT 1 FROM public.users AS usr WHERE lower(usr.email)='soundarya.admin@rareminds.in' AND usr.id<>v_admin_id) THEN
    RAISE EXCEPTION 'Soundarya admin email already exists under a different ID';
  END IF;

  INSERT INTO public.organizations (id,name) VALUES (v_org_id,'Soundarya Institute of Management and Science')
  ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;
  UPDATE public.organizations SET
    organization_type='college',admin_id=v_admin_id,email='sims.info@soundaryainstitutions.in',phone='+916269000092',
    address='Soundarya Nagar, Sidedahalli, Nagasandra Post, 296, 9th Cross Road, Prakruthi Layout, Siddeshwar Layout, Soundarya Layout',
    city='Bengaluru',state='Karnataka',country='India',website='https://soundarya.edu.in/',is_active=true,
    approval_status='approved',account_status='active',updated_at=NOW(),
    metadata=jsonb_build_object('organization_type','college','admin_id',v_admin_id::text,'institution_name','Soundarya Institute of Management and Science','short_name','SIMS','college_slug','soundarya-institute-management-science','academic_year','2026/2027','affiliated_university','Bangalore University','website','https://soundarya.edu.in/','city','Bengaluru','state','Karnataka','postal_code','560073','country','India','onboarding_completed',true,'onboarding_source','soundarya_admin_migration')
  WHERE id=v_org_id;

  SELECT org.id INTO v_university_id FROM public.organizations AS org WHERE lower(org.name)=lower('Bangalore University') ORDER BY org.created_at NULLS LAST,org.id LIMIT 1;
  IF v_university_id IS NULL THEN
    v_university_id := '4be7c3ae-5aeb-5b1e-b4bf-038c584e2076';
    INSERT INTO public.organizations (id,name) VALUES (v_university_id,'Bangalore University') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;
  END IF;
  UPDATE public.organizations SET organization_type='university',city='Bengaluru',state='Karnataka' WHERE id=v_university_id;

  SELECT uc.id INTO v_university_college_id FROM public.university_colleges AS uc WHERE uc.university_id=v_university_id AND (upper(trim(uc.code))='SIMS' OR lower(trim(uc.name))=lower('Soundarya Institute of Management and Science')) LIMIT 1;
  IF v_university_college_id IS NULL THEN
    INSERT INTO public.university_colleges (university_id,name,code,account_status) VALUES (v_university_id,'Soundarya Institute of Management and Science','SIMS','active') RETURNING id INTO v_university_college_id;
  ELSE
    UPDATE public.university_colleges SET name='Soundarya Institute of Management and Science',code='SIMS',account_status='active' WHERE id=v_university_college_id;
  END IF;

  INSERT INTO public.users (email,"organizationId","isActive",metadata,"createdAt","updatedAt",id,"firstName","lastName",last_activity_at,role,temporary_password,password_changed,phone)
  VALUES ('soundarya.admin@rareminds.in',v_org_id,true,jsonb_build_object('organization_type','college','institution_name','Soundarya Institute of Management and Science','short_name','SIMS','affiliated_university','Bangalore University','university_organization_id',v_university_id::text,'university_college_id',v_university_college_id::text,'onboarding_completed',true,'sso_user_id',v_admin_id::text),NOW(),NOW(),v_admin_id,'Soundarya','College Admin',NULL,'college_admin',NULL,true,NULL)
  ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,"organizationId"=EXCLUDED."organizationId","isActive"=true,metadata=EXCLUDED.metadata,"updatedAt"=NOW(),"firstName"=EXCLUDED."firstName","lastName"=EXCLUDED."lastName",role='college_admin',temporary_password=NULL,password_changed=true;
END;
$seed$;

INSERT INTO public.users_shadow (id,email,created_at,updated_at)
VALUES ('783d8431-a034-5369-ae47-3aca2c4ec618','soundarya.admin@rareminds.in',NOW(),NOW())
ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,updated_at=NOW();

INSERT INTO public.plans_cache (id,plan_code,name,business_type,applicable_entities,pricing_matrix,base_features,entity_config,display_order,is_active,synced_at,created_at,updated_at,product_id)
VALUES ('a0000000-0000-4000-8000-000000000023','college_enterprise','College Enterprise','b2b',ARRAY['college'],'{"college":{"yearly":49999,"currency":"INR"}}'::jsonb,'["up_to_5000_learners_or_custom","multi_department_analytics","recruiter_access","advanced_placement_dashboard","bulk_onboarding","dedicated_success_manager"]'::jsonb,'{"college":{"display_name":"College Enterprise","max_users":5000,"storage_limit":"50GB","duration":"yearly"}}'::jsonb,23,true,NOW(),NOW(),NOW(),'912d5049-e195-46e9-a319-49e3502bf7e7')
ON CONFLICT (id) DO UPDATE SET plan_code=EXCLUDED.plan_code,name=EXCLUDED.name,pricing_matrix=EXCLUDED.pricing_matrix,base_features=EXCLUDED.base_features,entity_config=EXCLUDED.entity_config,is_active=true,synced_at=NOW(),updated_at=NOW();

INSERT INTO public.subscription_cache (id,user_id,organization_id,plan_id,plan_code,plan_name,plan_type,plan_amount,billing_cycle,status,features,subscription_start_date,subscription_end_date,is_organization_subscription,organization_type,seat_count,assigned_seats,synced_at,auth_updated_at,created_at,updated_at,product_id)
VALUES ('d3876903-b74e-55d7-910f-90907ea3e11f','783d8431-a034-5369-ae47-3aca2c4ec618','284c9ed9-cd13-584d-b5bc-e198866b917b','a0000000-0000-4000-8000-000000000023','college_enterprise','College Enterprise','College Enterprise',49999,'yearly','active','["up_to_5000_learners_or_custom","multi_department_analytics","recruiter_access","advanced_placement_dashboard","bulk_onboarding","dedicated_success_manager"]'::jsonb,NOW(),NOW()+INTERVAL '1 year',true,'college',5000,0,NOW(),NOW(),NOW(),NOW(),'912d5049-e195-46e9-a319-49e3502bf7e7')
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id,organization_id=EXCLUDED.organization_id,plan_id=EXCLUDED.plan_id,plan_code=EXCLUDED.plan_code,plan_name=EXCLUDED.plan_name,plan_type=EXCLUDED.plan_type,plan_amount=EXCLUDED.plan_amount,features=EXCLUDED.features,status='active',subscription_end_date=EXCLUDED.subscription_end_date,seat_count=EXCLUDED.seat_count,synced_at=NOW(),auth_updated_at=NOW(),updated_at=NOW();

COMMIT;
