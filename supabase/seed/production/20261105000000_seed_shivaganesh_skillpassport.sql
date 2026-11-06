-- Soundarya College: add shivaganesh2046@gmail.com learner to SkillPassport DB
-- Learner: Shivaganesh (MBA - Marketing)
-- Run AFTER the SSO production seed (sso-worker/supabase/seed/production/20261105000000_seed_shivaganesh_sso_auth.sql)
-- The application user id MUST equal the SSO user id: f8182d23-28f3-5d54-b610-dc82f2470d4d
-- Same execution flow as the supplied Soundarya reference seed package.
-- Insert-only: existing Soundarya organization, subscription, license pool and existing learner records are not modified.
-- Safe and idempotent: can be re-run safely, uses fixed IDs with ON CONFLICT DO NOTHING

BEGIN;

DO $seed_shivaganesh_learner$
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

  -- 1. Insert application user (same ID as SSO account)
  INSERT INTO public.users
    (id,email,"organizationId","firstName","lastName",phone,role,"isActive",metadata,"createdAt","updatedAt")
  VALUES
    ('f8182d23-28f3-5d54-b610-dc82f2470d4d'::uuid,'shivaganesh2046@gmail.com',v_org_id,'Shivaganesh','',NULL,'learner',true,'{"role":"learner","lastName":"","firstName":"Shivaganesh","contact_number":""}'::jsonb,NOW(),NOW())
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insert user shadow record
  INSERT INTO public.users_shadow (id,email,created_at,updated_at)
  VALUES
    ('f8182d23-28f3-5d54-b610-dc82f2470d4d'::uuid,'shivaganesh2046@gmail.com',NOW(),NOW())
  ON CONFLICT (id) DO NOTHING;

  -- 3. Insert organization membership
  INSERT INTO public.organization_members
    (user_id,organization_id,role,status,created_at,updated_at)
  VALUES
    ('f8182d23-28f3-5d54-b610-dc82f2470d4d'::uuid,v_org_id,'member','active',NOW(),NOW())
  ON CONFLICT (user_id,organization_id) DO NOTHING;

  -- 4. Insert learner profile with grade, section, semester, roll_number, program_id, and program_section_id
  INSERT INTO public.learners
    (id,user_id,email,name,contact_number,college_id,learner_type,approval_status,grade,section,semester,roll_number,program_id,program_section_id,metadata,created_at,updated_at)
  VALUES
    ('f8182d23-28f3-5d54-b610-dc82f2470d4d'::uuid,'f8182d23-28f3-5d54-b610-dc82f2470d4d'::uuid,'shivaganesh2046@gmail.com','Shivaganesh',NULL,v_org_id,'college_student','approved','PG','A',4,'P03KU24M015038','25e1410b-bb26-40fe-abda-79a4a03925a0'::uuid,'05b3a656-a3f1-47dc-ae51-ea9d6229427d'::uuid,'{"role":"learner","lastName":"","firstName":"Shivaganesh","contact_number":""}'::jsonb,NOW(),NOW())
  ON CONFLICT (id) DO NOTHING;

  -- 5. Assign license from pool
  INSERT INTO public.license_assignments
    (license_pool_id,organization_subscription_id,user_id,member_type,status,assigned_by)
  VALUES
    (v_pool_id,v_subscription_id,'f8182d23-28f3-5d54-b610-dc82f2470d4d'::uuid,'learner','active',v_assigned_by)
  ON CONFLICT (user_id,organization_subscription_id) WHERE status='active' DO NOTHING;

  -- 6. Insert personal assessment attempt with learner context (MBA - Marketing program)
  INSERT INTO public.personal_assessment_attempts
    (id,learner_id,stream_id,started_at,completed_at,status,current_section_index,current_question_index,section_timings,created_at,updated_at,timer_remaining,elapsed_time,grade_level,adaptive_aptitude_session_id,all_responses,aptitude_scores,knowledge_scores,aptitude_question_timer,learner_context)
  VALUES
    ('b2c3d4e5-f6a7-5890-1bcd-ef0123456abc'::uuid,'f8182d23-28f3-5d54-b610-dc82f2470d4d'::uuid,'mba',NOW(),NULL,'in_progress',0,0,'{}'::jsonb,NOW(),NOW(),NULL,0,'college',NULL,'{}'::jsonb,NULL,NULL,NULL,jsonb_build_object('rawGrade','PG','degreeLevel','Postgraduate','programCode','MBA','programName','Master of Business Administration - Marketing','selectedStream','mba','migrationSource','google_forms'))
  ON CONFLICT (id) DO NOTHING;

END;
$seed_shivaganesh_learner$;

COMMIT;
