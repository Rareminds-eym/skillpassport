-- Repair Soundarya learners that were created before college_id,
-- organization membership, and enterprise license assignment were seeded.

BEGIN;

DO $repair_soundarya_learners$
DECLARE
  v_org_id uuid := '284c9ed9-cd13-584d-b5bc-e198866b917b';
  v_admin_id uuid := '783d8431-a034-5369-ae47-3aca2c4ec618';
  v_subscription_id uuid := 'd3876903-b74e-55d7-910f-90907ea3e11f';
  v_pool_id uuid := '84f6a944-a23d-56d8-9823-1f4d8c8e39f8';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = v_org_id) THEN
    RAISE EXCEPTION 'Soundarya organization % does not exist', v_org_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.subscription_cache WHERE id = v_subscription_id) THEN
    RAISE EXCEPTION 'Soundarya enterprise subscription % does not exist; run 20260827000000 first', v_subscription_id;
  END IF;

  UPDATE public.learners AS learner
  SET
    college_id = v_org_id,
    learner_type = 'college_student',
    approval_status = 'approved',
    is_deleted = false,
    updated_at = NOW()
  FROM public.users AS app_user
  WHERE learner.user_id = app_user.id
    AND app_user."organizationId" = v_org_id
    AND app_user.role = 'learner';

  INSERT INTO public.organization_members (
    user_id, organization_id, role, status, created_at, updated_at
  )
  SELECT id, v_org_id, 'member', 'active', NOW(), NOW()
  FROM public.users
  WHERE "organizationId" = v_org_id
    AND role = 'learner'
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = 'member',
    status = 'active',
    updated_at = NOW();

  INSERT INTO public.license_pools (
    id, organization_subscription_id, organization_id, organization_type,
    pool_name, member_type, allocated_seats, auto_assign_new_members,
    assignment_criteria, is_active, created_by
  ) VALUES (
    v_pool_id, v_subscription_id, v_org_id, 'college',
    'Soundarya learners', 'learner', 5000, true,
    jsonb_build_object('role', 'learner', 'organization_id', v_org_id::text),
    true, v_admin_id
  )
  ON CONFLICT (id) DO UPDATE SET
    allocated_seats = EXCLUDED.allocated_seats,
    auto_assign_new_members = true,
    is_active = true,
    updated_at = NOW();

  INSERT INTO public.license_assignments (
    license_pool_id, organization_subscription_id, user_id,
    member_type, status, assigned_by
  )
  SELECT v_pool_id, v_subscription_id, id, 'learner', 'active', v_admin_id
  FROM public.users
  WHERE "organizationId" = v_org_id
    AND role = 'learner'
  ON CONFLICT (user_id, organization_subscription_id)
    WHERE status = 'active'
  DO UPDATE SET
    license_pool_id = EXCLUDED.license_pool_id,
    member_type = 'learner',
    updated_at = NOW();
END;
$repair_soundarya_learners$;

COMMIT;
