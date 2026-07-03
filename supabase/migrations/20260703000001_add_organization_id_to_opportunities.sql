-- Add organization_id column to opportunities table for multi-tenant support
-- This allows each organization to only see their own job requisitions

ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id 
ON public.opportunities(organization_id);

-- Add comment
COMMENT ON COLUMN public.opportunities.organization_id IS 
'Organization that owns this opportunity/requisition. NULL for legacy data.';

-- Note: Existing rows will have NULL organization_id
-- You may want to run a data migration to populate this for existing opportunities
-- based on the recruiter_id or created_by field
