-- DEV ONLY. Apply the same-named SSO dev seed first.
-- App-side mirror for recruiter.dev@example.com; passwords belong ONLY in SSO.
-- Dedicated company/profile, active member -> recruiter mapping, no admin grants.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $seed$
DECLARE
  fixture_user CONSTANT uuid := 'c90dd3d7-48da-4736-968d-3c796ecbb63d';
  fixture_org CONSTANT uuid := '83b535de-4f65-43c3-926b-2bf209c068b1';
  fixture_recruiter CONSTANT uuid := '1942b799-4b6f-4f70-bc1c-f4b39eef243f';
  fixture_email CONSTANT text := 'recruiter.dev@example.com';
  fixture_tag CONSTANT text := 'recruiter-test-login-v1';
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(fixture_tag, 0));
  IF NOT EXISTS (SELECT 1 FROM public.recruitment_role_mapping
    WHERE sso_role_name = 'member' AND recruitment_role = 'recruiter') THEN
    RAISE EXCEPTION 'Apply recruitment role-mapping migrations first; member must map to recruiter';
  END IF;
  -- Matching ID/email rows may already exist through the legitimate SSO sync.
  IF EXISTS (SELECT 1 FROM public.users
    WHERE (id = fixture_user AND email <> fixture_email)
       OR (lower(email) = fixture_email AND id <> fixture_user))
    OR EXISTS (SELECT 1 FROM public.users_shadow
      WHERE (id = fixture_user AND email <> fixture_email)
         OR (lower(email) = fixture_email AND id <> fixture_user)) THEN
    RAISE EXCEPTION 'Recruiter fixture user/shadow ID or email collision; nothing changed';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organizations
    WHERE id = fixture_org AND (name <> 'Dev Recruiter Test Company'
      OR (metadata->>'dev_seed' IS NOT NULL AND metadata->>'dev_seed' <> fixture_tag)))
    OR EXISTS (SELECT 1 FROM public.companies
      WHERE (id = fixture_org AND metadata->>'dev_seed' IS DISTINCT FROM fixture_tag)
         OR (code = 'DEV_RECRUITER_TEST' AND id <> fixture_org)) THEN
    RAISE EXCEPTION 'Recruiter fixture company/organization collision; nothing changed';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organization_members
    WHERE user_id = fixture_user AND (organization_id <> fixture_org OR role <> 'member')) THEN
    RAISE EXCEPTION 'Recruiter fixture has unexpected app memberships; refusing to change them';
  END IF;
  IF EXISTS (SELECT 1 FROM public.recruiters
    WHERE (id = fixture_recruiter AND user_id <> fixture_user)
       OR (user_id = fixture_user AND (id <> fixture_recruiter OR company_id IS DISTINCT FROM fixture_org))
       OR (lower(email) = fixture_email AND user_id <> fixture_user)) THEN
    RAISE EXCEPTION 'Recruiter fixture profile collision; nothing changed';
  END IF;

  INSERT INTO public.organizations
    (id, name, organization_type, email, website, is_active, verification_status,
      approval_status, account_status, metadata)
  VALUES (fixture_org, 'Dev Recruiter Test Company', 'company', fixture_email,
    'https://example.com', true, 'approved', 'approved', 'active',
    jsonb_build_object('dev_seed', fixture_tag))
  ON CONFLICT (id) DO UPDATE SET is_active = true, verification_status = 'approved',
    approval_status = 'approved', account_status = 'active',
    metadata = COALESCE(organizations.metadata, '{}'::jsonb) || EXCLUDED.metadata;
  INSERT INTO public.users_shadow (id, email) VALUES (fixture_user, fixture_email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now();
  INSERT INTO public.users
    (id, email, "firstName", "lastName", role, "organizationId", "isActive", metadata)
  VALUES (fixture_user, fixture_email, 'Dev', 'Recruiter', 'recruiter', fixture_org, true,
    jsonb_build_object('dev_seed', fixture_tag, 'is_email_verified', true))
  ON CONFLICT (id) DO UPDATE SET "organizationId" = EXCLUDED."organizationId",
    "isActive" = true, role = 'recruiter',
    metadata = COALESCE(users.metadata, '{}'::jsonb) || EXCLUDED.metadata, "updatedAt" = now();
  INSERT INTO public.companies
    (id, name, code, email, website, "accountStatus", "approvalStatus", created_by, metadata)
  VALUES (fixture_org, 'Dev Recruiter Test Company', 'DEV_RECRUITER_TEST', fixture_email,
    'https://example.com', 'active', 'approved', fixture_user,
    jsonb_build_object('dev_seed', fixture_tag))
  ON CONFLICT (id) DO UPDATE SET "accountStatus" = 'active',
    "approvalStatus" = 'approved', "updatedAt" = now();
  INSERT INTO public.recruiters
    (id, user_id, company_id, name, email, isactive, verificationstatus, approval_status, account_status)
  VALUES (fixture_recruiter, fixture_user, fixture_org, 'Dev Recruiter', fixture_email,
    true, 'approved', 'approved', 'active')
  ON CONFLICT (id) DO UPDATE SET isactive = true, verificationstatus = 'approved',
    approval_status = 'approved', account_status = 'active', updatedat = now();
  INSERT INTO public.organization_members (user_id, organization_id, role, status)
  VALUES (fixture_user, fixture_org, 'member', 'active')
  ON CONFLICT (user_id, organization_id) DO UPDATE SET status = 'active', updated_at = now();
  INSERT INTO public.organization_recruitment_settings
    (organization_id, recruitment_enabled, max_recruiters, metadata)
  VALUES (fixture_org, true, 1, jsonb_build_object('dev_seed', fixture_tag))
  ON CONFLICT (organization_id) DO UPDATE SET recruitment_enabled = true, updated_at = now();
  RAISE NOTICE 'App recruiter test fixture ready: %. No paid subscription was created.', fixture_email;
END;
$seed$;
COMMIT;
