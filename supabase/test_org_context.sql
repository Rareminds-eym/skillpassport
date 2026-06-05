-- =====================================================
-- Test Organization Context Function
-- =====================================================

-- Step 1: Get a sample user_id from memberships
SELECT 
    user_id,
    org_id,
    status
FROM sso_foreign.memberships 
WHERE status = 'active'
LIMIT 5;

-- Step 2: Test the get_user_org_context function
-- Replace 'YOUR_USER_ID' with an actual user_id from Step 1
-- Example: SELECT * FROM get_user_org_context('e74e8fe3-3244-40ae-9055-c5599f30a4d3');

-- Uncomment and replace with actual user_id:
-- SELECT * FROM get_user_org_context('YOUR_USER_ID_HERE');

-- Step 3: Test with the user from the error message
-- This is the user_id from your original error
SELECT * FROM get_user_org_context('e74e8fe3-3244-40ae-9055-c5599f30a4d3');

-- Step 4: Check if organization_recruitment_settings exist
SELECT 
    organization_id,
    recruitment_enabled,
    max_recruiters,
    plan_tier
FROM public.organization_recruitment_settings;

-- Step 5: Check recruitment_role_mapping
SELECT 
    sso_role_name,
    recruitment_role,
    can_manage_team,
    can_create_jobs,
    can_view_candidates
FROM public.recruitment_role_mapping
ORDER BY sso_role_name;
