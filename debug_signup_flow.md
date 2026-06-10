# Debug Signup Flow - Step by Step

## Issue
After company signup, user is redirected to `/recruitment/overview` instead of `/recruitment/admin` and sees "No organization found" error.

## Root Causes Identified

### 1. Database Function Issue
The `get_user_org_context()` function was trying to JOIN `public.organizations` table which doesn't exist (only `sso_foreign.organizations` exists).

**Fix Applied**: Migration `20260526000000_fix_org_recruitment_context.sql` removes the JOIN to `public.organizations` and uses `organization_recruitment_settings` instead.

### 2. Session/Token Issue
The 401 Unauthorized error on `/auth/refresh` suggests the Supabase session might not be properly established after SSO signup.

**Fix Applied**: Updated `CompanySignup.tsx` to explicitly set Supabase session using SSO token after signup.

### 3. Recruitment Settings Not Created
The `organization_recruitment_settings` record might not be created during signup, causing the function to return no data.

**Fix Applied**: Updated `CompanySignup.tsx` to create the settings record BEFORE navigating, and throw error if it fails.

### 4. Role Mapping Issue
The `recruitment_role_mapping` table maps SSO roles to recruitment roles:
- 'owner' → 'company_admin'
- 'admin' → 'company_admin'  
- 'member' → 'recruiter'

This mapping should work correctly if the database function is working.

## Testing Steps

### Step 1: Verify Database Setup
Run these SQL queries in Supabase SQL Editor:

```sql
-- Check if recruitment_role_mapping has correct data
SELECT * FROM public.recruitment_role_mapping;

-- Check if organization_recruitment_settings table exists
SELECT COUNT(*) FROM public.organization_recruitment_settings;

-- Check if foreign tables are accessible
SELECT COUNT(*) FROM sso_foreign.organizations;
SELECT COUNT(*) FROM sso_foreign.memberships;
```

### Step 2: Test Signup Flow
1. Open browser console (F12)
2. Go to `/signup/company`
3. Fill in the form and submit
4. Watch console logs for:
   - `[CompanySignup] Starting signup process...`
   - `[CompanySignup] SSO signup successful`
   - `[CompanySignup] Creating recruitment settings...`
   - `[CompanySignup] Recruitment settings created:`
   - `[CompanySignup] Signup complete, navigating to admin dashboard...`

### Step 3: Check for Errors
If you see errors in console:
- **"Failed to create recruitment settings"**: Database permissions issue or table doesn't exist
- **"No authenticated user found"**: Session not established properly
- **"RPC error"**: Database function issue

### Step 4: Verify Database Records
After signup, run these queries to verify data was created:

```sql
-- Replace with actual user email
SELECT 
    u.id as user_id,
    u.email,
    m.org_id,
    m.status as membership_status,
    r.name as sso_role
FROM sso_foreign.users u
JOIN sso_foreign.memberships m ON m.user_id = u.id
JOIN sso_foreign.membership_roles mr ON mr.membership_id = m.id
JOIN sso_foreign.roles r ON r.id = mr.role_id
WHERE u.email = 'YOUR_EMAIL@example.com';

-- Check if recruitment settings were created
SELECT * FROM public.organization_recruitment_settings
WHERE organization_id IN (
    SELECT org_id FROM sso_foreign.memberships 
    WHERE user_id = 'YOUR_USER_ID'
);

-- Test the get_user_org_context function directly
SELECT * FROM public.get_user_org_context('YOUR_USER_ID'::UUID);
```

### Step 5: Check Routing Logic
After login, watch console for:
- `[roleBasedRouter] Redirecting to dashboard`
- `[roleBasedRouter] Fetching org context for recruiter...`
- `[roleBasedRouter] Org context fetched`
- `[roleBasedRouter] User is company_admin, redirecting to /recruitment/admin`

## Expected Behavior

### Successful Signup Flow:
1. User fills company signup form
2. SSO creates organization and user with 'owner' role
3. Supabase session is established
4. `organization_recruitment_settings` record is created
5. User profile is created in `users` table
6. Auth store is set with 'recruiter' role (mapped from 'owner')
7. User is navigated to `/recruitment/admin`

### Successful Login Flow:
1. User logs in with 'recruiter' role selected
2. SSO validates credentials and returns JWT with 'owner' role
3. Login maps 'owner' → 'recruiter' for app purposes
4. `redirectToRoleDashboard()` is called
5. `getOrgContext()` fetches org context via `get_user_org_context()` RPC
6. Function returns `recruitment_role: 'company_admin'` (from role mapping)
7. User is redirected to `/recruitment/admin`

## Common Issues

### Issue: "No organization found"
**Cause**: `get_user_org_context()` returns empty array
**Debug**:
1. Check if user has active membership in `sso_foreign.memberships`
2. Check if `organization_recruitment_settings` record exists
3. Run the function directly in SQL to see what it returns

### Issue: Goes to `/recruitment/overview` instead of `/recruitment/admin`
**Cause**: `orgContext.recruitmentRole` is not 'company_admin'
**Debug**:
1. Check console logs for `[roleBasedRouter] Org context fetched`
2. Verify `recruitmentRole` value in logs
3. Check if `recruitment_role_mapping` has correct mapping for 'owner'

### Issue: 401 Unauthorized on `/auth/refresh`
**Cause**: Supabase session not established or token invalid
**Debug**:
1. Check if `ssoClient.getAccessToken()` returns a valid token
2. Verify `supabase.auth.setSession()` was called successfully
3. Check browser localStorage for Supabase auth tokens

## Next Steps

If issues persist after applying fixes:
1. Run the test SQL queries to verify database state
2. Check browser console logs during signup/login
3. Verify migrations were applied correctly: `supabase db reset`
4. Test the database function directly with a known user ID
