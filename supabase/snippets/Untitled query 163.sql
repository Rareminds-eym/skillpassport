-- Drop the foreign key constraint that's blocking invitations
-- Since users are in SSO-Worker database, we can't enforce FK locally

ALTER TABLE public.organization_invitations 
DROP CONSTRAINT IF EXISTS organization_invitations_invited_by_fkey;

-- Verify it's dropped
SELECT 
    constraint_name,
    table_name
FROM information_schema.table_constraints
WHERE table_name = 'organization_invitations'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'organization_invitations_invited_by_fkey';
