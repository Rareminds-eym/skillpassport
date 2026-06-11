-- =============================================================================
-- Migration: 20260603000007_drop_role_type_columns_and_user_role_enum
-- Spec:      rbac-architecture-violations-fix  (Phase P4, task 22.2)
-- Purpose:   CONTRACT step — drop the legacy `role_type` (`public.user_role`
--            enum) columns from the two school-internal permission tables, then
--            DROP TYPE public.user_role now that nothing references it.
--
-- CONTEXT / WHY (behavior-preserving):
--   `role_type` is fully SUPERSEDED by `role_code` (TEXT, FK ->
--   school_internal_roles.code), added in 20260603000003 (task 20.1) and
--   backfilled by seed_rbac_z_role_code_backfill.sql (task 20.2). All read paths
--   (get-permissions in functions/api/user/handlers/actions.ts, settings GET
--   'roles' in functions/api/settings/[[path]].ts) already key off `role_code`,
--   and the settings WRITE path was switched to write/delete by `role_code` only
--   (task 22.2 code change — the prior role_type+role_code dual-write is removed).
--
--   Both `role_type` columns are EMPTY (0 rows in college_role_module_permissions
--   and college_role_scope_rules — live-verified), so dropping them loses no data.
--
--   By this point `public.user_role` has NO remaining dependents other than these
--   two columns: `public.users.role` was retyped enum -> text in
--   20260603000006 (task 22.1 behavior-preserving variant), and the vestigial RLS
--   policies referencing the enum were removed in 20260603000005 (task 21.2).
--   Live pg_depend confirms the ONLY non-internal dependents of public.user_role
--   are college_role_module_permissions.role_type and
--   college_role_scope_rules.role_type. Once they are gone, DROP TYPE succeeds.
--
-- WHAT THIS DOES (in order):
--   1. Drop the role_type-keyed UNIQUE constraints and the role_type-only indexes
--      (explicitly, so the CASCADE on the column drop is scoped to objects tied to
--      role_type only — never broad).
--   2. Drop college_role_module_permissions.role_type and
--      college_role_scope_rules.role_type.
--   3. Re-create the equivalent UNIQUE constraints keyed on `role_code` so the
--      de-duplication guarantee the old role_type UNIQUE constraints provided is
--      PRESERVED for the new sole key (the settings write path relies on it for
--      its delete-before-insert by role_code). The role_code indexes already exist
--      (idx_*_role_code, created in 20260603000003).
--   4. DROP TYPE IF EXISTS public.user_role (its internal array type drops with it).
--
-- SAFETY:
--   - Idempotent / guarded: IF EXISTS on every drop; UNIQUE constraints added via
--     guarded DO blocks (ADD CONSTRAINT has no IF NOT EXISTS in PostgreSQL).
--   - CASCADE is used ONLY on the specific role_type objects, not broadly.
--   - LOCAL apply only. No remote access.
--
-- APPROVAL: BREAKING/destructive. User has approved applying Task 22 migrations to
--   the LOCAL DB without further pauses.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Drop role_type-keyed UNIQUE constraints + role_type-only indexes.
--    (Scoped explicitly to objects tied to role_type.)
-- -----------------------------------------------------------------------------

-- college_role_module_permissions: UNIQUE (role_type, module_id, permission_id)
ALTER TABLE public.college_role_module_permissions
  DROP CONSTRAINT IF EXISTS college_role_module_permissio_role_type_module_id_permissio_key;

-- college_role_scope_rules: UNIQUE (role_type, scope_type, scope_value)
ALTER TABLE public.college_role_scope_rules
  DROP CONSTRAINT IF EXISTS college_role_scope_rules_role_type_scope_type_scope_value_key;

-- role_type-only btree indexes (the role_code equivalents already exist).
DROP INDEX IF EXISTS public.idx_college_role_module_permissions_role;
DROP INDEX IF EXISTS public.idx_college_role_scope_rules_role;

-- -----------------------------------------------------------------------------
-- 2) Drop the legacy role_type (public.user_role enum) columns.
--    CASCADE scoped to the column; any leftover dependent object tied solely to
--    this column is removed with it. Columns are EMPTY (no data loss).
-- -----------------------------------------------------------------------------

ALTER TABLE public.college_role_module_permissions
  DROP COLUMN IF EXISTS role_type CASCADE;

ALTER TABLE public.college_role_scope_rules
  DROP COLUMN IF EXISTS role_type CASCADE;

-- -----------------------------------------------------------------------------
-- 3) Re-create the equivalent UNIQUE constraints on `role_code` (the new sole
--    key) to PRESERVE the de-duplication guarantee the old role_type UNIQUE
--    constraints provided. The settings write path (delete-before-insert by
--    role_code) relies on this. Guarded because ADD CONSTRAINT lacks IF NOT EXISTS.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.college_role_module_permissions'::regclass
       AND conname  = 'college_role_module_permissions_role_code_module_permission_key'
  ) THEN
    ALTER TABLE public.college_role_module_permissions
      ADD CONSTRAINT college_role_module_permissions_role_code_module_permission_key
      UNIQUE (role_code, module_id, permission_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.college_role_scope_rules'::regclass
       AND conname  = 'college_role_scope_rules_role_code_scope_type_scope_value_key'
  ) THEN
    ALTER TABLE public.college_role_scope_rules
      ADD CONSTRAINT college_role_scope_rules_role_code_scope_type_scope_value_key
      UNIQUE (role_code, scope_type, scope_value);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4) Drop the now-unreferenced enum. `public.users.role` was retyped to text in
--    20260603000006 and the two role_type columns are gone (steps above), so the
--    enum has no remaining dependents. The internal array type _user_role drops
--    with it.
-- -----------------------------------------------------------------------------

DROP TYPE IF EXISTS public.user_role;

COMMIT;
