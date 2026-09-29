-- Migration for SkillPassport App DB
-- Seeds 1 Soundarya learner account: abhisheknd267@gmail.com
-- Safe and idempotent (can be re-run safely).

BEGIN;

DO $seed_learners$
DECLARE
  v_org_id uuid := '284c9ed9-cd13-584d-b5bc-e198866b917b';
BEGIN

  -- 0. Ensure organization exists in public.organizations
  INSERT INTO public.organizations (id, name)
  VALUES (v_org_id, 'Soundarya Institute of Management and Science')
  ON CONFLICT (id) DO NOTHING;

  -- 1. Insert/Update public.users (SkillPassport schema)
  INSERT INTO public.users (
    id,
    email,
    "organizationId",
    "firstName",
    "lastName",
    phone,
    role,
    "isActive",
    metadata,
    "createdAt",
    "updatedAt"
  )
  SELECT
    v.id,
    v.email,
    v_org_id,
    v.user_metadata->>'firstName',
    v.user_metadata->>'lastName',
    v.user_metadata->>'contact_number',
    'learner',
    true,
    v.user_metadata,
    v.created_at,
    v.updated_at
  FROM (
    VALUES
      ('69b35ea7-3c06-488f-b360-32bc2c60e729'::uuid, 'abhisheknd267@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "nd", "firstName": "Abhishek", "contact_number": "7892915864"}'::jsonb)
  ) AS v(id, email, created_at, updated_at, user_metadata)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "organizationId" = EXCLUDED."organizationId",
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    phone = EXCLUDED.phone,
    role = 'learner',
    "isActive" = true,
    metadata = EXCLUDED.metadata,
    "updatedAt" = NOW();

  -- 2. Insert into public.users_shadow
  INSERT INTO public.users_shadow (id, email, created_at, updated_at)
  SELECT
    v.id,
    v.email,
    v.created_at,
    v.updated_at
  FROM (
    VALUES
      ('69b35ea7-3c06-488f-b360-32bc2c60e729'::uuid, 'abhisheknd267@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz)
  ) AS v(id, email, created_at, updated_at)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- 3. Map every learner to Soundarya in the SkillPassport app DB.
  -- SSO memberships alone are not read by the college-admin learner APIs.
  INSERT INTO public.organization_members (
    user_id,
    organization_id,
    role,
    status,
    created_at,
    updated_at
  )
  SELECT
    u.id,
    v_org_id,
    'member',
    'active',
    NOW(),
    NOW()
  FROM public.users AS u
  WHERE u."organizationId" = v_org_id
    AND u.role = 'learner'
    AND u.id = '69b35ea7-3c06-488f-b360-32bc2c60e729'
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = 'member',
    status = 'active',
    updated_at = NOW();

  -- 4. Insert/Update public.learners
  INSERT INTO public.learners (
    id,
    user_id,
    email,
    name,
    contact_number,
    college_id,
    learner_type,
    approval_status,
    metadata,
    created_at,
    updated_at
  )
  SELECT
    v.id,
    v.id,
    v.email,
    trim(concat(v.user_metadata->>'firstName', ' ', v.user_metadata->>'lastName')),
    v.user_metadata->>'contact_number',
    v_org_id,
    'college_student',
    'approved',
    v.user_metadata,
    v.created_at,
    v.updated_at
  FROM (
    VALUES
      ('69b35ea7-3c06-488f-b360-32bc2c60e729'::uuid, 'abhisheknd267@gmail.com', '2026-08-29 07:55:59.826969+00'::timestamptz, '2026-08-29 08:09:37.137481+00'::timestamptz, '{"role": "learner", "lastName": "nd", "firstName": "Abhishek", "contact_number": "7892915864"}'::jsonb)
  ) AS v(id, email, created_at, updated_at, user_metadata)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    contact_number = EXCLUDED.contact_number,
    college_id = v_org_id,
    learner_type = 'college_student',
    approval_status = 'approved',
    is_deleted = false,
    updated_at = NOW();

  -- 5. Allocate the organization's enterprise subscription to these learners.
  -- This makes payment/entitlement checks use the college plan instead of
  -- treating each learner as an individual subscriber.
  INSERT INTO public.license_pools (
    id,
    organization_subscription_id,
    organization_id,
    organization_type,
    pool_name,
    member_type,
    allocated_seats,
    auto_assign_new_members,
    assignment_criteria,
    is_active,
    created_by
  ) VALUES (
    '84f6a944-a23d-56d8-9823-1f4d8c8e39f8',
    'd3876903-b74e-55d7-910f-90907ea3e11f',
    v_org_id,
    'college',
    'Soundarya learners',
    'learner',
    5000,
    true,
    jsonb_build_object('role', 'learner', 'organization_id', v_org_id::text),
    true,
    '783d8431-a034-5369-ae47-3aca2c4ec618'
  )
  ON CONFLICT (id) DO UPDATE SET
    allocated_seats = EXCLUDED.allocated_seats,
    auto_assign_new_members = true,
    is_active = true,
    updated_at = NOW();

  INSERT INTO public.license_assignments (
    license_pool_id,
    organization_subscription_id,
    user_id,
    member_type,
    status,
    assigned_by
  )
  SELECT
    '84f6a944-a23d-56d8-9823-1f4d8c8e39f8',
    'd3876903-b74e-55d7-910f-90907ea3e11f',
    u.id,
    'learner',
    'active',
    '783d8431-a034-5369-ae47-3aca2c4ec618'
  FROM public.users AS u
  WHERE u."organizationId" = v_org_id
    AND u.role = 'learner'
    AND u.id = '69b35ea7-3c06-488f-b360-32bc2c60e729'
  ON CONFLICT (user_id, organization_subscription_id)
    WHERE status = 'active'
  DO UPDATE SET
    license_pool_id = EXCLUDED.license_pool_id,
    member_type = 'learner',
    updated_at = NOW();

END;
$seed_learners$;

COMMIT;
