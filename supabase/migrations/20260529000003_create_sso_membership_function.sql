-- Create function to create SSO-Worker membership via FDW
-- This function directly inserts into SSO-Worker database tables

CREATE OR REPLACE FUNCTION create_sso_membership(
    p_user_id UUID,
    p_org_id UUID,
    p_roles TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_membership_id UUID;
    v_role_id UUID;
    v_role_name TEXT;
    v_result JSONB;
BEGIN
    -- 1. Check if membership already exists
    SELECT id INTO v_membership_id
    FROM sso_foreign.memberships
    WHERE user_id = p_user_id
      AND org_id = p_org_id;

    -- 2. Create or reactivate membership
    IF v_membership_id IS NULL THEN
        -- Create new membership
        INSERT INTO sso_foreign.memberships (user_id, org_id, status)
        VALUES (p_user_id, p_org_id, 'active')
        RETURNING id INTO v_membership_id;
        
        RAISE NOTICE 'Created new membership: %', v_membership_id;
    ELSE
        -- Reactivate existing membership if needed
        UPDATE sso_foreign.memberships
        SET status = 'active',
            updated_at = NOW()
        WHERE id = v_membership_id
          AND status != 'active';
        
        RAISE NOTICE 'Reactivated existing membership: %', v_membership_id;
    END IF;

    -- 3. Assign roles
    FOREACH v_role_name IN ARRAY p_roles
    LOOP
        -- Get role ID from SSO-Worker roles table
        SELECT id INTO v_role_id
        FROM sso_foreign.roles
        WHERE name = v_role_name;

        IF v_role_id IS NULL THEN
            RAISE WARNING 'Role not found: %', v_role_name;
            CONTINUE;
        END IF;

        -- Insert into membership_roles (ignore duplicates)
        BEGIN
            INSERT INTO sso_foreign.membership_roles (membership_id, role_id)
            VALUES (v_membership_id, v_role_id);
            
            RAISE NOTICE 'Assigned role % to membership %', v_role_name, v_membership_id;
        EXCEPTION
            WHEN unique_violation THEN
                RAISE NOTICE 'Role % already assigned to membership %', v_role_name, v_membership_id;
        END;
    END LOOP;

    -- 4. Return result
    v_result := jsonb_build_object(
        'success', true,
        'membership_id', v_membership_id,
        'user_id', p_user_id,
        'org_id', p_org_id,
        'roles', p_roles
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create SSO membership: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_sso_membership(UUID, UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_sso_membership(UUID, UUID, TEXT[]) TO service_role;

COMMENT ON FUNCTION create_sso_membership IS 'Creates or reactivates SSO-Worker membership and assigns roles via FDW';
