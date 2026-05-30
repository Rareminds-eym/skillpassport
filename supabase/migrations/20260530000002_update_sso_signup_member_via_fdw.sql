-- Update signup_member function in SSO database via FDW
-- This modifies the function to skip membership creation for recruiters

-- Execute the function modification on the remote SSO database
DO $$
BEGIN
  -- Drop the existing function on remote database
  PERFORM dblink_exec(
    'sso_connection',
    'DROP FUNCTION IF EXISTS public.signup_member(text, text, text, uuid);'
  );

  -- Create the updated function on remote database
  PERFORM dblink_exec(
    'sso_connection',
    $func$
    CREATE OR REPLACE FUNCTION public.signup_member(p_email text, p_password_hash text, p_role text, p_org_id uuid DEFAULT NULL::uuid) 
    RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $body$
    DECLARE
      v_user_id       uuid;
      v_membership_id uuid;
      v_role_id       uuid;
      v_org_id        uuid;
    BEGIN
      -- Validate role exists
      SELECT id INTO v_role_id FROM roles WHERE name = p_role;
      IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Invalid role: %', p_role;
      END IF;

      -- Create user
      INSERT INTO users (email, password_hash, is_email_verified)
      VALUES (p_email, p_password_hash, false)
      RETURNING id INTO v_user_id;

      -- For recruiters without an org_id, skip membership creation
      -- They will get their membership when they accept an invitation
      IF p_role = 'recruiter' AND p_org_id IS NULL THEN
        RETURN jsonb_build_object(
          'user_id', v_user_id,
          'org_id', NULL,
          'membership_id', NULL
        );
      END IF;

      -- For all other roles, create membership
      -- Determine target org: use provided org_id, or raise error if none provided
      IF p_org_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_org_id) THEN
          RAISE EXCEPTION 'Organization not found';
        END IF;
        v_org_id := p_org_id;
      ELSE
        RAISE EXCEPTION 'Organization ID is required for role: %', p_role;
      END IF;

      -- Create membership and assign role
      INSERT INTO memberships (user_id, org_id, status)
      VALUES (v_user_id, v_org_id, 'active')
      RETURNING id INTO v_membership_id;

      INSERT INTO membership_roles (membership_id, role_id)
      VALUES (v_membership_id, v_role_id);

      RETURN jsonb_build_object(
        'user_id', v_user_id,
        'org_id', v_org_id,
        'membership_id', v_membership_id
      );
    END;
    $body$;
    $func$
  );
END $$;
