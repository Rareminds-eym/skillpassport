-- =====================================================
-- Fix organization_invitations Foreign Key Constraints
-- Update to reference SSO-Worker users via FDW
-- =====================================================

BEGIN;

-- Drop existing foreign key constraints that reference local users table
ALTER TABLE public.organization_invitations 
DROP CONSTRAINT IF EXISTS organization_invitations_invited_by_fkey;

ALTER TABLE public.organization_invitations 
DROP CONSTRAINT IF EXISTS organization_invitations_organization_id_fkey;

-- Make invited_by nullable since we can't enforce FK to foreign table
-- (PostgreSQL doesn't support FK constraints to foreign tables)
ALTER TABLE public.organization_invitations 
ALTER COLUMN invited_by DROP NOT NULL;

-- Add a check to ensure invited_by is a valid UUID format
ALTER TABLE public.organization_invitations 
ADD CONSTRAINT organization_invitations_invited_by_uuid_check 
CHECK (invited_by IS NULL OR (invited_by::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'));

-- Don't add FK constraint for organization_id since organizations exist in SSO-Worker
-- Instead, we'll validate via trigger
-- Note: organization_invitations.organization_id should reference sso_foreign.organizations
-- but PostgreSQL doesn't support FK to foreign tables

-- Create a validation function to check if user exists in SSO-Worker
CREATE OR REPLACE FUNCTION public.validate_invitation_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if invited_by user exists in SSO-Worker
    IF NEW.invited_by IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM sso_foreign.users WHERE id = NEW.invited_by
        ) THEN
            RAISE EXCEPTION 'User % does not exist in SSO-Worker database', NEW.invited_by;
        END IF;
    END IF;
    
    -- Check if organization exists in SSO-Worker
    IF NEW.organization_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM sso_foreign.organizations WHERE id = NEW.organization_id
        ) THEN
            RAISE EXCEPTION 'Organization % does not exist in SSO-Worker database', NEW.organization_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to validate user before insert/update
DROP TRIGGER IF EXISTS validate_invitation_user_trigger ON public.organization_invitations;
CREATE TRIGGER validate_invitation_user_trigger
    BEFORE INSERT OR UPDATE ON public.organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_invitation_user();

COMMENT ON FUNCTION public.validate_invitation_user IS 
'Validates that invited_by user exists in SSO-Worker database via FDW';

COMMIT;
