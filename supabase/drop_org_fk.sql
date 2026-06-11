-- Drop the organization_id foreign key constraint
-- Organizations are in SSO-Worker database, not local

ALTER TABLE public.organization_invitations 
DROP CONSTRAINT IF EXISTS organization_invitations_organization_id_fkey;

-- Verify it's dropped
SELECT 
    constraint_name,
    table_name
FROM information_schema.table_constraints
WHERE table_name = 'organization_invitations'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'organization_invitations_organization_id_fkey';
