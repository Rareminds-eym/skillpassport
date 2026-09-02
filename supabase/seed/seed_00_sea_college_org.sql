-- ============================================================
-- SEED FILE: SEA College Organization
-- Must run BEFORE seed_sea_college_skillpassport.sql
-- Creates the organization record that learners reference
-- ============================================================

INSERT INTO "public"."organizations" (
  "id",
  "name",
  "organization_type",
  "email",
  "admin_id",
  "account_status",
  "verification_status",
  "is_active",
  "approval_status",
  "created_at",
  "updated_at"
) VALUES (
  '927756bb-5270-4148-a2a0-24142d70c7de',
  'SEA College',
  'college',
  'demo.college@skillpassport.com',
  '22222222-2222-2222-2222-222222222222',
  'active',
  'approved',
  true,
  'approved',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  organization_type = EXCLUDED.organization_type,
  email = EXCLUDED.email,
  admin_id = EXCLUDED.admin_id,
  account_status = EXCLUDED.account_status,
  verification_status = EXCLUDED.verification_status,
  is_active = EXCLUDED.is_active,
  approval_status = EXCLUDED.approval_status,
  updated_at = NOW();

COMMENT ON TABLE public.organizations IS 'Organizations including schools, colleges, and universities';
