-- ============================================================================
-- Add Factory Visit Support to Opportunities Table
-- ============================================================================
-- This migration adds support for factory visits as a separate employment type
-- Factory visits are only visible to school students
-- ============================================================================

-- Add comment to employment_type column
COMMENT ON COLUMN opportunities.employment_type IS 'Employment type: job, internship, contract, factory_visit, etc. Use factory_visit for industrial visits';

-- Create index for factory visits
CREATE INDEX IF NOT EXISTS idx_opportunities_factory_visit 
ON opportunities(employment_type) 
WHERE employment_type = 'factory_visit';

-- Create view for factory visits only
CREATE OR REPLACE VIEW factory_visits AS
SELECT 
    id,
    company_name,
    location,
    sector,
    description,
    title,
    posted_date,
    is_active,
    created_at,
    updated_at
FROM opportunities
WHERE employment_type = 'factory_visit'
AND is_active = true;

-- Grant access to factory visits view
GRANT SELECT ON factory_visits TO authenticated;
GRANT SELECT ON factory_visits TO anon;
