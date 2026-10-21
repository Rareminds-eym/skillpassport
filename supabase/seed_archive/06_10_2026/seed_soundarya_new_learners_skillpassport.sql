-- Soundarya College: add 3 new learners to SkillPassport App DB
-- Learners: 1 MCA + 2 MBA
-- Uses the SAME user UUIDs as the matching SSO seed.
-- Same execution flow as the supplied Soundarya reference seed package.
-- Insert-only: existing Soundarya organization, subscription, license pool and existing learner records are not modified.
BEGIN;

DO $seed_soundarya_3_new_learners$
DECLARE
  v_org_id uuid := '284c9ed9-cd13-584d-b5bc-e198866b917b';
  v_pool_id uuid := '84f6a944-a23d-56d8-9823-1f4d8c8e39f8';
  v_subscription_id uuid := 'd3876903-b74e-55d7-910f-90907ea3e11f';
  v_assigned_by uuid := '783d8431-a034-5369-ae47-3aca2c4ec618';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = v_org_id) THEN
    RAISE EXCEPTION 'Soundarya organization % does not exist', v_org_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.license_pools
    WHERE id = v_pool_id
      AND organization_id = v_org_id
      AND organization_subscription_id = v_subscription_id
      AND member_type = 'learner'
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Existing Soundarya learner license pool/subscription mapping was not found';
  END IF;

  INSERT INTO public.users
    (id,email,"organizationId","firstName","lastName",phone,role,"isActive",metadata,"createdAt","updatedAt")
  VALUES
    ('e180eacc-144a-5129-8a43-37833d561941'::uuid,'sanjay299sanju@gmail.com',v_org_id,'Sanchay','k','8848270420','learner',true,'{"role":"learner","lastName":"k","firstName":"Sanchay","contact_number":"8848270420"}'::jsonb,NOW(),NOW()),
    ('c6baed07-e92b-5e5f-8e68-fadd85eae5c9'::uuid,'harshaabhi56@gmail.com',v_org_id,'Harsha','','9606793933','learner',true,'{"role":"learner","lastName":"","firstName":"Harsha","contact_number":"9606793933"}'::jsonb,NOW(),NOW()),
    ('e10a439c-1725-5301-944f-79bcec5cf169'::uuid,'likhib612@gmail.com',v_org_id,'Likhitha','B','7348910496','learner',true,'{"role":"learner","lastName":"B","firstName":"Likhitha","contact_number":"7348910496"}'::jsonb,NOW(),NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users_shadow (id,email,created_at,updated_at)
  VALUES
    ('e180eacc-144a-5129-8a43-37833d561941'::uuid,'sanjay299sanju@gmail.com',NOW(),NOW()),
    ('c6baed07-e92b-5e5f-8e68-fadd85eae5c9'::uuid,'harshaabhi56@gmail.com',NOW(),NOW()),
    ('e10a439c-1725-5301-944f-79bcec5cf169'::uuid,'likhib612@gmail.com',NOW(),NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.organization_members
    (user_id,organization_id,role,status,created_at,updated_at)
  VALUES
    ('e180eacc-144a-5129-8a43-37833d561941'::uuid,v_org_id,'member','active',NOW(),NOW()),
    ('c6baed07-e92b-5e5f-8e68-fadd85eae5c9'::uuid,v_org_id,'member','active',NOW(),NOW()),
    ('e10a439c-1725-5301-944f-79bcec5cf169'::uuid,v_org_id,'member','active',NOW(),NOW())
  ON CONFLICT (user_id,organization_id) DO NOTHING;

  INSERT INTO public.learners
    (id,user_id,email,name,contact_number,college_id,learner_type,approval_status,metadata,created_at,updated_at)
  VALUES
    ('e180eacc-144a-5129-8a43-37833d561941'::uuid,'e180eacc-144a-5129-8a43-37833d561941'::uuid,'sanjay299sanju@gmail.com','Sanchay k','8848270420',v_org_id,'college_student','approved','{"role":"learner","lastName":"k","firstName":"Sanchay","contact_number":"8848270420"}'::jsonb,NOW(),NOW()),
    ('c6baed07-e92b-5e5f-8e68-fadd85eae5c9'::uuid,'c6baed07-e92b-5e5f-8e68-fadd85eae5c9'::uuid,'harshaabhi56@gmail.com','Harsha','9606793933',v_org_id,'college_student','approved','{"role":"learner","lastName":"","firstName":"Harsha","contact_number":"9606793933"}'::jsonb,NOW(),NOW()),
    ('e10a439c-1725-5301-944f-79bcec5cf169'::uuid,'e10a439c-1725-5301-944f-79bcec5cf169'::uuid,'likhib612@gmail.com','Likhitha B','7348910496',v_org_id,'college_student','approved','{"role":"learner","lastName":"B","firstName":"Likhitha","contact_number":"7348910496"}'::jsonb,NOW(),NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.license_assignments
    (license_pool_id,organization_subscription_id,user_id,member_type,status,assigned_by)
  VALUES
    (v_pool_id,v_subscription_id,'e180eacc-144a-5129-8a43-37833d561941'::uuid,'learner','active',v_assigned_by),
    (v_pool_id,v_subscription_id,'c6baed07-e92b-5e5f-8e68-fadd85eae5c9'::uuid,'learner','active',v_assigned_by),
    (v_pool_id,v_subscription_id,'e10a439c-1725-5301-944f-79bcec5cf169'::uuid,'learner','active',v_assigned_by)
  ON CONFLICT (user_id,organization_subscription_id) WHERE status='active' DO NOTHING;
END;
$seed_soundarya_3_new_learners$;

COMMIT;
