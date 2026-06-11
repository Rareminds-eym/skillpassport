-- Test script to verify organization context setup
-- Run this in Supabase SQL Editor or via psql

-- 1. Check if organization_recruitment_settings table exists and has data
SELECT 
    'organization_recruitment_settings' as table_name,
    COUNT(*) as record_count
FROM public.organization_recruitment_settings;

-- 2. Check if foreign tables are accessible
SELECT 
    'sso_foreign.organizations' as table_name,
    COUNT(*) as record_count
FROM sso_foreign.organizations;

SELECT 
    'sso_foreign.memberships' as table_name,
    COUNT(*) as record_count
FROM sso_foreign.memberships;

-- 3. Check recruitment_role_mapping
SELECT 
    'recruitment_role_mapping' as table_name,
    sso_role_name,
    recruitment_role
FROM public.recruitment_role_mapping;

-- 4. Test get_user_org_context function with a specific user
-- Replace 'YOUR_USER_ID' with actual user ID from auth.users
SELECT * FROM public.get_user_org_context('YOUR_USER_ID'::UUID);

-- 5. Check if there are any active memberships
SELECT 
    m.id as membership_id,
    m.user_id,
    m.org_id,
    m.status,
    so.name as org_name,
    r.name as role_name
FROM sso_foreign.memberships m
JOIN sso_foreign.organizations so ON so.id = m.org_id
JOIN sso_foreign.membership_roles mr ON mr.membership_id = m.id
JOIN sso_foreign.roles r ON r.id = mr.role_id
WHERE m.status = 'active'
LIMIT 10;
