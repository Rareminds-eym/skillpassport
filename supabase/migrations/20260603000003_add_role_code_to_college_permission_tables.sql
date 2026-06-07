-- Migration: Add nullable `role_code` FK columns to the school-internal permission tables.
-- Spec: rbac-architecture-violations-fix  |  Phase: P4 (Contract)  |  Task: 20.1
--
-- What/Why:
--   This is the ADDITIVE "Expand" step of the Expand-Migrate-Contract re-typing for the
--   two school-internal permission tables (design.md "Changed: school-internal permission
--   tables (re-typed off the enum)"). It ADDS a nullable `role_code TEXT` column to each
--   table with an FK to `public.school_internal_roles(code)`, alongside the existing
--   `role_type` (`public.user_role` enum) columns. This decouples these tables from the
--   legacy `user_role` enum and points them at the app-owned lookup created in
--   20260603000002_create_school_internal_roles.sql (P3 task 15.4, seeded by task 17.2).
--
--   Non-destructive by design:
--     - ADD COLUMN is nullable (no NOT NULL, no DEFAULT) so the change cannot fail on the
--       existing tables. Per the task 15.1 verification both
--       `college_role_module_permissions` and `college_role_scope_rules` are EMPTY (0 rows),
--       so there is no data to violate any constraint.
--     - The existing `role_type` columns, their constraints, and their indexes
--       (`idx_college_role_module_permissions_role`, `idx_college_role_scope_rules_role`)
--       are left completely untouched here.
--
--   Sequencing (do NOT do these here):
--     - Backfill `role_code` from `role_type`        -> task 20.2 (a separate seed/DML file)
--     - Switch handlers to query/write `role_code`    -> task 20.3 (application code)
--     - DROP the old `role_type` columns (destructive) -> task 22.2 (later Contract step)
--
-- Ordering: timestamp 20260603000003 sorts AFTER 20260603000002_create_school_internal_roles.sql,
--   guaranteeing the FK target `public.school_internal_roles(code)` already exists when this runs.
--
-- DDL ONLY: no DML / seed data here.
--
-- APPROVAL-GATED: This file is written to disk only. Execution (supabase db push /
--   migration up) is deferred and MUST be proposed and explicitly approved before running.

-- 1) college_role_module_permissions: add nullable role_code FK -> school_internal_roles(code).
ALTER TABLE public.college_role_module_permissions
  ADD COLUMN IF NOT EXISTS role_code TEXT REFERENCES public.school_internal_roles(code);

COMMENT ON COLUMN public.college_role_module_permissions.role_code IS
  'School-internal role code (FK -> school_internal_roles.code). P4 Expand step (task 20.1): replaces the legacy role_type (user_role enum) column, which is backfilled in task 20.2 and dropped in task 22.2. Nullable during the Expand-Migrate-Contract transition.';

-- 2) college_role_scope_rules: add nullable role_code FK -> school_internal_roles(code).
ALTER TABLE public.college_role_scope_rules
  ADD COLUMN IF NOT EXISTS role_code TEXT REFERENCES public.school_internal_roles(code);

COMMENT ON COLUMN public.college_role_scope_rules.role_code IS
  'School-internal role code (FK -> school_internal_roles.code). P4 Expand step (task 20.1): replaces the legacy role_type (user_role enum) column, which is backfilled in task 20.2 and dropped in task 22.2. Nullable during the Expand-Migrate-Contract transition.';

-- 3) Indexes on the new role_code columns, consistent with the existing role_type indexes
--    (idx_college_role_module_permissions_role / idx_college_role_scope_rules_role). The new
--    query path (task 20.3) filters by role_code, so these indexes support it. The legacy
--    role_type indexes are NOT touched here (removed with their column in task 22.2).
CREATE INDEX IF NOT EXISTS idx_college_role_module_permissions_role_code
  ON public.college_role_module_permissions (role_code);

CREATE INDEX IF NOT EXISTS idx_college_role_scope_rules_role_code
  ON public.college_role_scope_rules (role_code);
