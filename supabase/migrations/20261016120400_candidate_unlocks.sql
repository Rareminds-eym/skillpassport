-- Migration: Candidate Contact Unlocks Table & Security Policies
-- Tracks which candidate profiles have been unlocked by which organization
-- Enforces Spec Sections 6 & 9 (1 contact unlock credit per candidate unlock)

CREATE TABLE IF NOT EXISTS public.candidate_contact_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    candidate_id TEXT NOT NULL,
    unlocked_by UUID NOT NULL,
    credits_consumed INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_org_candidate_unlock UNIQUE (organization_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_unlocks_org_cand 
    ON public.candidate_contact_unlocks(organization_id, candidate_id);

CREATE INDEX IF NOT EXISTS idx_contact_unlocks_org_created 
    ON public.candidate_contact_unlocks(organization_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.candidate_contact_unlocks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated organization members to read their organization's unlocks
CREATE POLICY "org_members_read_candidate_unlocks" ON public.candidate_contact_unlocks
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

-- Service role full access
CREATE POLICY "service_role_all_candidate_unlocks" ON public.candidate_contact_unlocks
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
