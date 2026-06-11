-- =============================================================================
-- P4 — Task 22.1 (behavior-preserving variant): Retype users.role enum -> text
-- =============================================================================
--
-- CONTEXT / WHY (USER-APPROVED DECISION):
--   The original task 22.1 called for DROPping public.users.role. That drop is
--   NOT behavior-preserving yet: ~15 Cloudflare Functions still READ users.role
--   as DATA (display/shadow) for arbitrary users, and there is no sso-worker
--   get-roles-by-user RPC + per-user shadow sync to replace those reads. Dropping
--   the column now would break those reads.
--
--   Instead of dropping, we RETYPE public.users.role from the public.user_role
--   ENUM to plain TEXT. This is fully BEHAVIOR-PRESERVING:
--     - reads still return the exact same role string (e.g. 'learner', 'admin'),
--     - inserts/filters/stats that compare role to string literals keep working
--       (text = text comparisons are equivalent to the prior enum = text casts),
--   while SEVERING the column's hard dependency on the public.user_role enum.
--
--   Severing this dependency is the whole point: it unblocks task 22.2's
--   `DROP TYPE public.user_role`. After this migration, the ONLY remaining
--   dependents of public.user_role are the school-internal college tables:
--     - college_role_module_permissions.role_type
--     - college_role_scope_rules.role_type
--   (plus their unique constraints and indexes), which task 22.2 handles.
--
-- IMPORTANT SEMANTICS:
--   public.users.role is now a NON-AUTHORITATIVE display/shadow TEXT field.
--   AUTHORITATIVE role assignment lives in the sso-worker membership_roles
--   (surfaced via the JWT). The column is RETAINED (NOT dropped) until an
--   sso-worker get-roles-by-user RPC + a per-user shadow sync exist to replace
--   the remaining cross-user reads. This migration only changes the column TYPE.
--
-- SAFETY:
--   - NON-DESTRUCTIVE: only ALTER COLUMN ... TYPE text. No DROP COLUMN, no DROP TYPE.
--   - Idempotent / guarded: only alters when the column exists AND is not already text.
--   - Handles a possible enum-typed DEFAULT defensively (drop, retype, recast) even
--     though no DEFAULT currently exists on users.role.
--   - LOCAL apply only. No remote access.
-- =============================================================================

DO $$
DECLARE
  v_type      text;
  v_default   text;
BEGIN
  -- Resolve the current type + default of public.users.role, if the column exists.
  SELECT t.typname,
         pg_get_expr(d.adbin, d.adrelid)
    INTO v_type, v_default
    FROM pg_attribute a
    JOIN pg_class c       ON c.oid = a.attrelid
    JOIN pg_namespace n   ON n.oid = c.relnamespace
    JOIN pg_type t        ON t.oid = a.atttypid
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
   WHERE n.nspname = 'public'
     AND c.relname = 'users'
     AND a.attname = 'role'
     AND NOT a.attisdropped;

  IF v_type IS NULL THEN
    RAISE NOTICE 'public.users.role does not exist; nothing to retype. Skipping.';
    RETURN;
  END IF;

  IF v_type = 'text' THEN
    RAISE NOTICE 'public.users.role is already text; nothing to retype. Skipping.';
    RETURN;
  END IF;

  -- Defensive: if a DEFAULT exists (e.g. an enum-typed literal), drop it before the
  -- type change so the ALTER cannot fail on an un-castable default, then re-add it
  -- as a text default afterward. (No DEFAULT currently exists on this column.)
  IF v_default IS NOT NULL THEN
    RAISE NOTICE 'Dropping existing DEFAULT on public.users.role before retype: %', v_default;
    EXECUTE 'ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT';
  END IF;

  -- Core change: retype enum -> text, preserving every existing value as its text form.
  EXECUTE 'ALTER TABLE public.users ALTER COLUMN role TYPE text USING role::text';

  -- Re-add the default as text if one had been present.
  IF v_default IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.users ALTER COLUMN role SET DEFAULT %L',
      regexp_replace(v_default, '::[a-zA-Z_."]+$', '')
    );
  END IF;

  RAISE NOTICE 'public.users.role retyped from % to text.', v_type;
END $$;

-- Document the new, non-authoritative semantics of the column.
COMMENT ON COLUMN public.users.role IS
  'NON-AUTHORITATIVE display/shadow role (text). Authoritative role assignment lives in the sso-worker membership_roles (surfaced via the JWT). This column is RETAINED (not dropped) until an sso-worker get-roles-by-user RPC + per-user shadow sync exist to replace the remaining cross-user reads. Retyped from the public.user_role enum to text (task 22.1, behavior-preserving variant) to sever the enum dependency and unblock DROP TYPE public.user_role in task 22.2.';
