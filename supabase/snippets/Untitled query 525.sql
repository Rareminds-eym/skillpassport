-- =====================================================
-- Add 'viewer' role to organization_invitations constraint
-- =====================================================

BEGIN;

-- Drop the existing check constraint
ALTER TABLE public.organization_invitations 
DROP CONSTRAINT IF EXISTS organization_invitations_invitee_role_check;

-- Recreate the constraint with 'viewer' role added
ALTER TABLE public.organization_invitations 
ADD CONSTRAINT organization_invitations_invitee_role_check 
CHECK (
    invitee_role = ANY (ARRAY[
        'learner'::text,
        'school_educator'::text,
        'school_admin'::text,
        'college_educator'::text,
        'college_admin'::text,
        'university_admin'::text,
        'recruiter'::text,
        'company_admin'::text,
        'viewer'::text  -- Added for recruitment read-only access
    ])
);

COMMENT ON CONSTRAINT organization_invitations_invitee_role_check 
ON public.organization_invitations IS 
'Allowed roles for organization invitations, including viewer for recruitment';

COMMIT;
