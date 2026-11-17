-- Soundarya College / SkillPassport - three learner application accounts
-- Run SECOND, after the corresponding SSO Worker production seed.
-- Mirrors the Shivaganesh SkillPassport insert flow, without modifying existing pool/subscription/org rows.
-- Same application user UUID as SSO user UUID for each learner.
-- PRE-DEPLOYMENT CHECKS:
--   (1) Chethan roll_number is preserved exactly as supplied: Po4ku24m015060 (verify spelling).
--   (2) All three are provisionally mapped to MBA Section A using Shivaganesh's program_section_id.
--       The source did NOT specify the section for these three: confirm this mapping.
--   (3) Charan's semester is confirmed as 4.
--   (4) This creates account, learner, license and in_progress assessment only;
--       it does not migrate education, employment, project, LinkedIn or resume details.

BEGIN;

DO $seed_soundarya_three_learners$
DECLARE
  v_org_id uuid := '284c9ed9-cd13-584d-b5bc-e198866b917b'::uuid;
  v_pool_id uuid := '84f6a944-a23d-56d8-9823-1f4d8c8e39f8'::uuid;
  v_subscription_id uuid := 'd3876903-b74e-55d7-910f-90907ea3e11f'::uuid;
  v_assigned_by uuid := '783d8431-a034-5369-ae47-3aca2c4ec618'::uuid;
  v_program_id uuid := '25e1410b-bb26-40fe-abda-79a4a03925a0'::uuid;
  v_program_section_id uuid := '05b3a656-a3f1-47dc-ae51-ea9d6229427d'::uuid;
  v_conflict record;
BEGIN
  -- Verify the shared Soundarya records before creating anything.
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id=v_org_id) THEN
    RAISE EXCEPTION 'Soundarya organization % does not exist',v_org_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.license_pools
    WHERE id=v_pool_id AND organization_id=v_org_id
      AND organization_subscription_id=v_subscription_id
      AND member_type='learner' AND is_active=true
  ) THEN
    RAISE EXCEPTION 'Soundarya active learner license pool/subscription mapping not found';
  END IF;

  -- Existing application user email with a different ID needs manual reconciliation.
  SELECT x.email, u.id AS existing_id INTO v_conflict
  FROM (VALUES
  ('ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, 'chethuchethan781@gmail.com'),
  ('e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, 'gaganaks029@gmail.com'),
  ('79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, 'charuc250@gmail.com')
  ) AS x(id,email)
  JOIN public.users u ON lower(u.email)=lower(x.email) AND u.id<>x.id
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'SkillPassport conflict: email % is already owned by ID %',v_conflict.email,v_conflict.existing_id;
  END IF;

  SELECT x.email, u.email AS existing_email INTO v_conflict
  FROM (VALUES
  ('ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, 'chethuchethan781@gmail.com'),
  ('e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, 'gaganaks029@gmail.com'),
  ('79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, 'charuc250@gmail.com')
  ) AS x(id,email)
  JOIN public.users u ON u.id=x.id AND lower(u.email)<>lower(x.email)
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'SkillPassport conflict: UUID planned for % already belongs to %',v_conflict.email,v_conflict.existing_email;
  END IF;

  -- A separately seeded learner/profile or shadow user should not be duplicated.
  SELECT x.email, l.id AS existing_id INTO v_conflict
  FROM (VALUES
  ('ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, 'chethuchethan781@gmail.com'),
  ('e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, 'gaganaks029@gmail.com'),
  ('79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, 'charuc250@gmail.com')
  ) AS x(id,email)
  JOIN public.learners l ON lower(l.email)=lower(x.email) AND l.id<>x.id
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'SkillPassport conflict: learner email % has another learner ID %',v_conflict.email,v_conflict.existing_id;
  END IF;

  SELECT x.email, s.id AS existing_id INTO v_conflict
  FROM (VALUES
  ('ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, 'chethuchethan781@gmail.com'),
  ('e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, 'gaganaks029@gmail.com'),
  ('79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, 'charuc250@gmail.com')
  ) AS x(id,email)
  JOIN public.users_shadow s ON lower(s.email)=lower(x.email) AND s.id<>x.id
  LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'SkillPassport conflict: shadow email % has another ID %',v_conflict.email,v_conflict.existing_id;
  END IF;

  -- 1. Application users; MUST match the SSO UUID.
  INSERT INTO public.users
    (id,email,"organizationId","firstName","lastName",phone,role,"isActive",metadata,"createdAt","updatedAt")
  VALUES
  ('ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, 'chethuchethan781@gmail.com', v_org_id, 'Chethan', '', '8095123213', 'learner', true, '{"role":"learner","lastName":"","firstName":"Chethan","contact_number":"8095123213"}'::jsonb, NOW(), NOW()),
  ('e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, 'gaganaks029@gmail.com', v_org_id, 'Gagana', 'K S', '9108412946', 'learner', true, '{"role":"learner","lastName":"K S","firstName":"Gagana","contact_number":"9108412946"}'::jsonb, NOW(), NOW()),
  ('79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, 'charuc250@gmail.com', v_org_id, 'Charan', 'H S', '9380121190', 'learner', true, '{"role":"learner","lastName":"H S","firstName":"Charan","contact_number":"9380121190"}'::jsonb, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- 2. Shadow user IDs for the same accounts.
  INSERT INTO public.users_shadow (id,email,created_at,updated_at)
  VALUES
  ('ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, 'chethuchethan781@gmail.com', NOW(), NOW()),
  ('e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, 'gaganaks029@gmail.com', NOW(), NOW()),
  ('79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, 'charuc250@gmail.com', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- 3. Organization memberships.
  INSERT INTO public.organization_members (user_id,organization_id,role,status,created_at,updated_at)
  VALUES
  ('ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, v_org_id, 'member', 'active', NOW(), NOW()),
  ('e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, v_org_id, 'member', 'active', NOW(), NOW()),
  ('79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, v_org_id, 'member', 'active', NOW(), NOW())
  ON CONFLICT (user_id,organization_id) DO NOTHING;

  -- 4. Learner profiles (PG / MBA; Section A is an assumption inherited from the supplied template).
  INSERT INTO public.learners
    (id,user_id,email,name,contact_number,college_id,learner_type,approval_status,grade,section,semester,roll_number,program_id,program_section_id,metadata,created_at,updated_at)
  VALUES
  ('ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, 'ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, 'chethuchethan781@gmail.com', 'Chethan', '8095123213', v_org_id, 'college_student', 'approved', 'PG', 'A', 4, 'Po4ku24m015060', v_program_id, v_program_section_id, '{"role":"learner","lastName":"","firstName":"Chethan","contact_number":"8095123213"}'::jsonb, NOW(), NOW()),
  ('e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, 'e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, 'gaganaks029@gmail.com', 'Gagana K S', '9108412946', v_org_id, 'college_student', 'approved', 'PG', 'A', 4, 'P03KU24M016083', v_program_id, v_program_section_id, '{"role":"learner","lastName":"K S","firstName":"Gagana","contact_number":"9108412946"}'::jsonb, NOW(), NOW()),
  ('79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, '79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, 'charuc250@gmail.com', 'Charan H S', '9380121190', v_org_id, 'college_student', 'approved', 'PG', 'A', 4, 'P03KU24M015040', v_program_id, v_program_section_id, '{"role":"learner","lastName":"H S","firstName":"Charan","contact_number":"9380121190"}'::jsonb, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- 5. Assign one active learner license per user from the existing pool.
  INSERT INTO public.license_assignments
    (license_pool_id,organization_subscription_id,user_id,member_type,status,assigned_by)
  VALUES
  (v_pool_id, v_subscription_id, 'ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, 'learner', 'active', v_assigned_by),
  (v_pool_id, v_subscription_id, 'e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, 'learner', 'active', v_assigned_by),
  (v_pool_id, v_subscription_id, '79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, 'learner', 'active', v_assigned_by)
  ON CONFLICT (user_id,organization_subscription_id) WHERE status='active' DO NOTHING;

  -- 6. Initialize one MBA personal assessment per learner, with explicit specialization.
  INSERT INTO public.personal_assessment_attempts
    (id,learner_id,stream_id,started_at,completed_at,status,current_section_index,current_question_index,section_timings,created_at,updated_at,timer_remaining,elapsed_time,grade_level,adaptive_aptitude_session_id,all_responses,aptitude_scores,knowledge_scores,aptitude_question_timer,learner_context)
  VALUES
  ('7949190b-ebc2-5706-8b16-487abac398d4'::uuid, 'ef7bdd44-ebc5-5128-9ad3-a2ebb488358c'::uuid, 'mba', NOW(), NULL, 'in_progress', 0, 0, '{}'::jsonb, NOW(), NOW(), NULL, 0, 'college', NULL, '{}'::jsonb, NULL, NULL, NULL, jsonb_build_object('rawGrade','PG','degreeLevel','Postgraduate','programCode','MBA','programName','Master of Business Administration - Marketing','specialization','Marketing','selectedStream','mba','migrationSource','google_forms')),
  ('c6c619b8-6a0f-5346-96f9-6cbd919f7d68'::uuid, 'e14cac5a-fb99-56cf-ad9e-d8971206db87'::uuid, 'mba', NOW(), NULL, 'in_progress', 0, 0, '{}'::jsonb, NOW(), NOW(), NULL, 0, 'college', NULL, '{}'::jsonb, NULL, NULL, NULL, jsonb_build_object('rawGrade','PG','degreeLevel','Postgraduate','programCode','MBA','programName','Master of Business Administration - HR','specialization','HR','selectedStream','mba','migrationSource','google_forms')),
  ('37ce763a-b940-5bbb-b6b4-de02c8f45e74'::uuid, '79141bdd-bc46-58ce-bbd4-aee57340cbd6'::uuid, 'mba', NOW(), NULL, 'in_progress', 0, 0, '{}'::jsonb, NOW(), NOW(), NULL, 0, 'college', NULL, '{}'::jsonb, NULL, NULL, NULL, jsonb_build_object('rawGrade','PG','degreeLevel','Postgraduate','programCode','MBA','programName','Master of Business Administration - Marketing','specialization','Marketing','selectedStream','mba','migrationSource','google_forms'))
  ON CONFLICT (id) DO NOTHING;
END;
$seed_soundarya_three_learners$;

COMMIT;

-- Optional post-run verification (run in SkillPassport DB):
-- SELECT l.id,l.name,l.email,l.roll_number,l.semester,l.section,l.program_id,
--        l.program_section_id,pa.status AS assessment_status,pa.learner_context
-- FROM public.learners l
-- LEFT JOIN public.personal_assessment_attempts pa ON pa.learner_id=l.id
-- WHERE l.email IN ('chethuchethan781@gmail.com','gaganaks029@gmail.com','charuc250@gmail.com');
--
-- SELECT u.email,la.license_pool_id,la.organization_subscription_id,la.status
-- FROM public.users u JOIN public.license_assignments la ON la.user_id=u.id
-- WHERE u.email IN ('chethuchethan781@gmail.com','gaganaks029@gmail.com','charuc250@gmail.com');
