-- =============================================================================
-- P4 — Task 21.1: Stop the signup trigger from writing an authoritative users.role
-- =============================================================================
--
-- WHY:
--   The signup trigger public.handle_new_auth_user() previously derived a role
--   from raw_user_meta_data ('user_role' / 'role', default 'learner'), validated
--   it against a hardcoded enum subset, cast it to public.user_role, and wrote it
--   into public.users.role on INSERT. This made the trigger an AUTHORITATIVE
--   role-assignment path that competes with the canonical source of role
--   assignment: the sso-worker's membership_roles (surfaced to the app via the JWT).
--
-- WHAT THIS MIGRATION DOES:
--   1. Makes public.users.role NULLABLE so the column can be omitted by the
--      trigger's INSERT. (users.role is now vestigial; it is dropped later in
--      task 22.1. We do NOT drop it here.)
--   2. CREATE OR REPLACE the trigger function so it NO LONGER:
--        - reads raw_user_meta_data role ('user_role' / 'role'),
--        - validates against the hardcoded enum subset,
--        - casts to public.user_role,
--        - writes role into the public.users INSERT.
--      All OTHER trigger behavior is preserved EXACTLY (first/last name parsing,
--      phone, isActive, organizationId, metadata, timestamps, ON CONFLICT DO NOTHING).
--
-- NOTES:
--   - Role assignment is now owned by the sso-worker membership_roles (canonical),
--     surfaced via the JWT. public.users.role is vestigial pending its drop in 22.1;
--     the trigger no longer derives or writes it.
--   - Removing the public.user_role cast from this function eliminates ONE of the
--     `DROP TYPE public.user_role` blockers handled in task 22.2.
--   - The function signature (name, args, return type) is UNCHANGED, so the existing
--     trigger binding keeps working — we do NOT drop/recreate the trigger.
--   - CREATE OR REPLACE FUNCTION preserves the existing owner; ownership is NOT changed.
--
-- SAFETY:
--   - NON-DESTRUCTIVE: only CREATE OR REPLACE FUNCTION + ALTER COLUMN DROP NOT NULL.
--   - No DROP COLUMN / DROP TYPE here (those belong to task 22).
--   - Approval-gated apply: this file is created for review; not applied automatically.
-- =============================================================================

-- 1) Make users.role nullable so the trigger can omit it (vestigial pending 22.1 drop).
ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;

-- 2) Replace the signup trigger function so it no longer owns role assignment.
CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );

  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    SPLIT_PART(v_full_name, ' ', 1),
    ''
  );

  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    CASE
      WHEN POSITION(' ' IN v_full_name) > 0
      THEN SUBSTRING(v_full_name FROM POSITION(' ' IN v_full_name) + 1)
      ELSE ''
    END,
    ''
  );

  -- NOTE: role derivation/validation/cast intentionally REMOVED.
  -- Role assignment is owned by the sso-worker membership_roles (canonical),
  -- surfaced via the JWT. public.users.role is vestigial (dropped in task 22.1);
  -- the trigger no longer writes it, so role defaults to NULL on INSERT.

  v_phone := NEW.raw_user_meta_data->>'phone';

  INSERT INTO public.users (
    id,
    email,
    "firstName",
    "lastName",
    phone,
    "isActive",
    "organizationId",
    metadata,
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_phone,
    true,
    NULL,
    jsonb_build_object(
      'source', 'auth_trigger',
      'registrationDate', NOW()::text,
      'fullName', v_full_name
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION "public"."handle_new_auth_user"() IS 'Trigger function to create a user record when a new auth user is created. Does NOT assign role: role assignment is owned by the sso-worker membership_roles (canonical, surfaced via JWT). public.users.role is vestigial pending its drop in task 22.1; the trigger no longer derives/writes it and no longer casts to public.user_role.';
