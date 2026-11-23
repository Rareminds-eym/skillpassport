BEGIN;

-- Seeds run after migrations on a fresh database. Bootstrap the reserved
-- publisher here so ownership constraints do not depend on seeded data.
-- Preserve existing organizations; the preflight below rejects an ID conflict.
INSERT INTO public.organizations
  (id, name, organization_type, is_active, approval_status, account_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'SkillPassport Platform',
  'platform', true, 'approved', 'active')
ON CONFLICT (id) DO NOTHING;

COMMIT;
