-- =====================================================
-- Ensure Role Mapping Data Exists
-- This migration ensures recruitment_role_mapping has data
-- =====================================================

BEGIN;

-- Create recruitment_role_mapping table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.recruitment_role_mapping (
    id SERIAL PRIMARY KEY,
    sso_role_name TEXT NOT NULL UNIQUE,
    recruitment_role TEXT NOT NULL,
    can_manage_team BOOLEAN DEFAULT FALSE,
    can_create_jobs BOOLEAN DEFAULT FALSE,
    can_edit_jobs BOOLEAN DEFAULT FALSE,
    can_delete_jobs BOOLEAN DEFAULT FALSE,
    can_view_candidates BOOLEAN DEFAULT FALSE,
    can_manage_candidates BOOLEAN DEFAULT FALSE,
    can_view_analytics BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delete existing data and re-insert to ensure consistency
DELETE FROM public.recruitment_role_mapping;

-- Insert role mappings
INSERT INTO public.recruitment_role_mapping 
    (sso_role_name, recruitment_role, can_manage_team, can_create_jobs, can_edit_jobs, 
     can_delete_jobs, can_view_candidates, can_manage_candidates, can_view_analytics, description)
VALUES
    ('owner', 'company_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
     'Organization owner - full recruitment access'),
    ('admin', 'company_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
     'Organization admin - full recruitment access'),
    ('member', 'recruiter', FALSE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 
     'Organization member - recruiter access');

-- Verify the data
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.recruitment_role_mapping;
    
    IF v_count < 3 THEN
        RAISE EXCEPTION 'recruitment_role_mapping table should have 3 rows, but has %', v_count;
    END IF;
    
    RAISE NOTICE 'recruitment_role_mapping table has % rows - OK', v_count;
END $$;

COMMIT;
