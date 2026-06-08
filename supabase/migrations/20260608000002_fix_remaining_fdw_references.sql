-- =====================================================
-- Fix validate_invitation_user() trigger
-- =====================================================
--
-- Previous migration replaced RPC functions but the
-- validate_invitation_user trigger function still
-- references sso_foreign.users and sso_foreign.organizations.
-- This migration updates it to use local tables instead.

BEGIN;

-- =====================================================
-- Fix validate_invitation_user() trigger
-- =====================================================

-- Drop trigger first, then function
DROP TRIGGER IF EXISTS validate_invitation_user_trigger ON public.organization_invitations;

CREATE OR REPLACE FUNCTION public.validate_invitation_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if invited_by user exists in local users table
    IF NEW.invited_by IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.users WHERE id = NEW.invited_by
        ) THEN
            RAISE EXCEPTION 'User % does not exist in users table', NEW.invited_by;
        END IF;
    END IF;

    -- Check if organization exists in local organizations table
    IF NEW.organization_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.organizations WHERE id = NEW.organization_id
        ) THEN
            RAISE EXCEPTION 'Organization % does not exist in organizations table', NEW.organization_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER validate_invitation_user_trigger
    BEFORE INSERT OR UPDATE ON public.organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_invitation_user();

COMMENT ON FUNCTION public.validate_invitation_user IS
'Validates that invited_by user and organization exist in local tables';

COMMIT;
