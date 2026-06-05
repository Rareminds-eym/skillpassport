-- Verify and Fix Role Mapping
-- Run this in Supabase SQL Editor to check and fix the recruitment_role_mapping

-- 1. Check if recruitment_role_mapping table exists and has data
SELECT 'recruitment_role_mapping table data:' as info;
SELECT * FROM public.recruitment_role_mapping;

-- 2. If empty, insert the mappings
INSERT INTO public.recruitment_role_mapping 
    (sso_role_name, recruitment_role, can_manage_team, can_create_jobs, can_edit_jobs, 
     can_delete_jobs, can_view_candidates, can_manage_candidates, can_view_analytics, description)
VALUES
    ('owner', 'company_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
     'Organization owner - full recruitment access'),
    ('admin', 'company_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
     'Organization admin - full recruitment access'),
    ('member', 'recruiter', FALSE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 
     'Organization member - recruiter access')
ON CONFLICT (sso_role_name) 
DO UPDATE SET
    recruitment_role = EXCLUDED.recruitment_role,
    can_manage_team = EXCLUDED.can_manage_team,
    can_create_jobs = EXCLUDED.can_create_jobs,
    can_edit_jobs = EXCLUDED.can_edit_jobs,
    can_delete_jobs = EXCLUDED.can_delete_jobs,
    can_view_candidates = EXCLUDED.can_view_candidates,
    can_manage_candidates = EXCLUDED.can_manage_candidates,
    can_view_analytics = EXCLUDED.can_view_analytics,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 3. Verify the data was inserted
SELECT 'After insert/update:' as info;
SELECT * FROM public.recruitment_role_mapping;

-- 4. Test the get_user_org_context function with your user ID
-- Replace 'YOUR_USER_ID' with the actual user ID from the signup
-- You can get it from: SELECT id, email FROM sso_foreign.users WHERE email = 'your@email.com';
-- SELECT * FROM public.get_user_org_context('YOUR_USER_ID'::UUID);

-- 5. Check organization_recruitment_settings
SELECT 'organization_recruitment_settings:' as info;
SELECT * FROM public.organization_recruitment_settings;

-- 6. Check SSO foreign tables
SELECT 'SSO Users:' as info;
SELECT id, email FROM sso_foreign.users LIMIT 5;

SELECT 'SSO Memberships:' as info;
SELECT m.id, m.user_id, m.org_id, m.status, so.name as org_name
FROM sso_foreign.memberships m
JOIN sso_foreign.organizations so ON so.id = m.org_id
LIMIT 5;

SELECT 'SSO Roles:' as info;
SELECT r.id, r.name, mr.membership_id
FROM sso_foreign.roles r
JOIN sso_foreign.membership_roles mr ON mr.role_id = r.id
LIMIT 5;
