-- Membership-derived ownership is ambiguous when a recruiter joins two companies.
ALTER TABLE public.shortlists ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
WITH unique_memberships AS (
 SELECT user_id,(array_agg(DISTINCT organization_id))[1] AS organization_id
 FROM public.organization_members WHERE status='active' GROUP BY user_id HAVING count(DISTINCT organization_id)=1
)
UPDATE public.shortlists s SET organization_id=m.organization_id FROM unique_memberships m
WHERE s.created_by=m.user_id::text AND s.organization_id IS NULL;
CREATE INDEX IF NOT EXISTS shortlists_organization_date_idx ON public.shortlists(organization_id,created_date DESC);
NOTIFY pgrst,'reload schema';
