-- Migration: Create the app-owned `public.school_internal_roles` lookup table.
-- Spec: rbac-architecture-violations-fix  |  Phase: P3  |  Task: 15.4
--
-- What/Why:
--   `school_internal_roles` is an APP-OWNED lookup table (design.md "Data Models /
--   New: school_internal_roles"). It enumerates the SCHOOL-INTERNAL permission roles —
--   the `SchoolInternalRole` taxonomy (principal, vice_principal, it_admin,
--   class_teacher, subject_teacher, accountant, librarian, parent, career_counselor,
--   school_admin) — and REPLACES the legacy `user_role` enum for these codes.
--
--   These are NOT SSO authorization roles. This lookup is NOT an authorization source —
--   Cloudflare Functions enforce authz from the verified JWT. It exists to SCOPE school
--   feature permissions: it is the FK target for the P4 re-typing (task 20.1 adds
--   `role_code TEXT REFERENCES school_internal_roles(code)` to
--   `college_role_module_permissions` and `college_role_scope_rules`).
--
-- Ordering: this file's timestamp (20260603000002) sorts AFTER the prior P3 migrations
--   20260603000000_replace_roles_shadow.sql (15.2) and
--   20260603000001_create_role_categories.sql (15.3). This table is a STANDALONE lookup
--   with no FK to those tables; the later timestamp only keeps P3 ordering consistent.
--
-- DDL ONLY: no DML / seed data here. Seeding the canonical school-internal codes is
--   task 17.2 (a separate seed file). The P4 `role_code` FK columns on the college
--   tables are added later by task 20.1 — NOT here.
--
-- APPROVAL-GATED: This file is written to disk only. Execution (supabase db push /
--   migration up) is task 15.5 and MUST be proposed and explicitly approved before running.

-- 1) Create the table (exact shape per design.md Data Models / New: school_internal_roles).
--    Shape is intentionally minimal: code, label, created_at. No `updated_at` (and thus
--    no updated_at trigger) — the design shape does not include one.
CREATE TABLE public.school_internal_roles (
  code       TEXT PRIMARY KEY,   -- 'principal','vice_principal','it_admin','class_teacher','subject_teacher',...
  label      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.school_internal_roles IS
  'App-owned lookup of school-internal permission roles (the SchoolInternalRole taxonomy: principal/vice_principal/it_admin/class_teacher/subject_teacher/accountant/librarian/parent/career_counselor/school_admin). Replaces the legacy user_role enum for these codes and is the FK target for college_role_module_permissions/college_role_scope_rules.role_code (P4). NOT an authorization source (authz = JWT); it scopes school feature permissions.';

-- 2) Grants — match the access parity of the sibling app-owned reference tables
--    `public.roles` (20260603000000) and `public.role_categories` (20260603000001),
--    which GRANT ALL to anon / authenticated / service_role. The service_role (the
--    Functions client) reads this lookup; read-only-at-app-layer semantics are enforced
--    in code, not via grants. No RLS is present on the sibling reference tables, so none
--    is added here (Functions use service_role, which bypasses RLS regardless).
GRANT ALL ON TABLE public.school_internal_roles TO anon;
GRANT ALL ON TABLE public.school_internal_roles TO authenticated;
GRANT ALL ON TABLE public.school_internal_roles TO service_role;
