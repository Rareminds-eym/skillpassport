-- Add offline internship fields to opportunities table
-- Migration: add_offline_internship_fields
-- Date: 2025-12-06

ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS exposure_type text,
ADD COLUMN IF NOT EXISTS total_hours integer,
ADD COLUMN IF NOT EXISTS duration_weeks integer,
ADD COLUMN IF NOT EXISTS duration_days integer,
ADD COLUMN IF NOT EXISTS schedule_note text,
ADD COLUMN IF NOT EXISTS what_youll_learn text,
ADD COLUMN IF NOT EXISTS what_youll_do text,
ADD COLUMN IF NOT EXISTS final_artifact_type text,
ADD COLUMN IF NOT EXISTS final_artifact_description text,
ADD COLUMN IF NOT EXISTS mentor_bio text,
ADD COLUMN IF NOT EXISTS safety_note text,
ADD COLUMN IF NOT EXISTS parent_role text,
ADD COLUMN IF NOT EXISTS cost_inr integer,
ADD COLUMN IF NOT EXISTS cost_note text;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_opportunities_sector ON public.opportunities USING btree (sector);
CREATE INDEX IF NOT EXISTS idx_opportunities_exposure_type ON public.opportunities USING btree (exposure_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_cost ON public.opportunities USING btree (cost_inr);

-- Update search index to include new fields
DROP INDEX IF EXISTS idx_opportunities_search;
CREATE INDEX idx_opportunities_search ON public.opportunities 
USING gin (
  to_tsvector('english'::regconfig,
    COALESCE(job_title, '') || ' ' ||
    COALESCE(title, '') || ' ' ||
    COALESCE(company_name, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(sector, '') || ' ' ||
    COALESCE(exposure_type, '')
  )
);

-- Add comment for documentation
COMMENT ON COLUMN public.opportunities.sector IS 'Industry sector (e.g., Technology, Healthcare, Education)';
COMMENT ON COLUMN public.opportunities.exposure_type IS 'Type of exposure (e.g., Hands-on, Observation, Hybrid)';
COMMENT ON COLUMN public.opportunities.total_hours IS 'Total hours for the internship/opportunity';
COMMENT ON COLUMN public.opportunities.duration_weeks IS 'Duration in weeks';
COMMENT ON COLUMN public.opportunities.duration_days IS 'Duration in days';
COMMENT ON COLUMN public.opportunities.what_youll_learn IS 'Learning outcomes description';
COMMENT ON COLUMN public.opportunities.what_youll_do IS 'Activities and tasks description';
COMMENT ON COLUMN public.opportunities.cost_inr IS 'Cost in Indian Rupees';
