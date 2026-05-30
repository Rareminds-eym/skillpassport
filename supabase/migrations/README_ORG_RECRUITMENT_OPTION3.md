# Organization-Level Recruitment Dashboard - Option 3 Migration

## Overview

This migration implements **Option 3: Cross-Database Architecture** using Foreign Data Wrapper (FDW) to enable multi-tenant recruitment features while maintaining a single source of truth for authentication and authorization data.

## Architecture

### Two-Database Design

1. **SSO-Worker Database** (External)
   - Contains: `organizations`, `users`, `memberships`, `roles`, `membership_roles`
   - Purpose: Authentication, authorization, and organization membership
   - Access: Via Foreign Data Wrapper (FDW)

2. **SkillPassport Database** (Main)
   - Contains: Application data, recruitment features
   - Purpose: Business logic, recruitment workflows
   - Access: Direct database access

### Key Benefits

✅ **No Data Duplication** - Membership and role data stays in SSO-Worker  
✅ **Single Source of Truth** - Authentication/authorization centralized  
✅ **Minimal New Tables** - Only 1 new table (`recruitment_role_mapping`)  
✅ **Flexible Role Mapping** - Map SSO roles to recruitment roles without schema changes  
✅ **Multi-Org Support** - Users can have different roles in different organizations  
✅ **Backward Compatible** - Existing tables reused (`organization_invitations`, `organization_subscriptions`)

## What's Created

### 1. Foreign Data Wrapper Setup

- **Foreign Server**: `sso_worker_server` - Connection to SSO-Worker database
- **Foreign Schema**: `sso_foreign` - Contains foreign tables
- **Foreign Tables**:
  - `sso_foreign.organizations`
  - `sso_foreign.users`
  - `sso_foreign.memberships`
  - `sso_foreign.roles`
  - `sso_foreign.membership_roles`

### 2. New Table

**`recruitment_role_mapping`** - Maps SSO roles to recruitment permissions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| sso_role_name | TEXT | SSO role (owner, admin, member) |
| recruitment_role | TEXT | Recruitment role (company_admin, recruiter, viewer) |
| can_manage_team | BOOLEAN | Permission to manage team members |
| can_create_jobs | BOOLEAN | Permission to create jobs |
| can_edit_jobs | BOOLEAN | Permission to edit jobs |
| can_delete_jobs | BOOLEAN | Permission to delete jobs |
| can_view_candidates | BOOLEAN | Permission to view candidates |
| can_manage_candidates | BOOLEAN | Permission to manage candidates |
| can_view_analytics | BOOLEAN | Permission to view analytics |
| permissions | JSONB | Additional flexible permissions |

**Default Mappings**:
- `owner` → `company_admin` (full access)
- `admin` → `company_admin` (full access)
- `member` → `recruiter` (limited access)

### 3. Modified Tables

**`organizations`** - Added columns:
- `recruitment_enabled` (BOOLEAN) - Enable/disable recruitment features
- `max_recruiters` (INTEGER) - Maximum number of recruiters allowed

**`requisitions`** - Added columns:
- `organization_id` (UUID) - Organization reference
- `created_by_uuid` (UUID) - Creator user reference
- `assigned_to` (UUID) - Assigned recruiter reference
- `approval_status` (TEXT) - Approval status (pending, approved, rejected)

**`opportunities`** - Added columns:
- `organization_id` (UUID) - Organization reference
- `created_by_uuid` (UUID) - Creator user reference

**`pipeline_candidates`** - Added columns:
- `organization_id` (UUID) - Organization reference
- `assigned_to_uuid` (UUID) - Assigned recruiter reference
- `added_by_uuid` (UUID) - User who added candidate

### 4. Helper Functions

**`is_org_member(user_id, org_id)`**
- Check if user is active member of organization
- Queries SSO-Worker via FDW
- Returns: BOOLEAN

**`get_user_recruitment_roles(user_id, org_id)`**
- Get user's recruitment roles and permissions
- Queries SSO-Worker and joins with role mapping
- Returns: TABLE with role details

**`has_recruitment_permission(user_id, org_id, permission)`**
- Check if user has specific permission
- Permissions: manage_team, create_jobs, edit_jobs, delete_jobs, view_candidates, manage_candidates, view_analytics
- Returns: BOOLEAN

**`get_user_org_context(user_id)`**
- Get all organizations user belongs to with roles
- Returns: TABLE with org details and roles

### 5. RLS Policies

**Multi-tenant data isolation** enforced via Row Level Security:

- **requisitions**: Users can only access requisitions from their organizations
- **opportunities**: Users can only access opportunities from their organizations
- **pipeline_candidates**: Users can only access candidates from their organizations

Policies check:
1. User membership in organization (via FDW)
2. User permissions based on role mapping
3. Backward compatibility (NULL organization_id allowed)

### 6. Indexes

Performance indexes created for:
- Organization ID lookups
- User ID lookups
- Status filtering
- Foreign key relationships

## Installation Steps

### Prerequisites

1. **SSO-Worker Database** must be accessible from SkillPassport database
2. **Network connectivity** between databases
3. **Database credentials** for SSO-Worker
4. **postgres_fdw extension** available

### Step 1: Update Connection Details

Edit the migration file `20260525000000_org_recruitment_dashboard_option3.sql`:

```sql
CREATE SERVER sso_worker_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (
    host 'YOUR_SSO_WORKER_HOST',      -- Replace
    port 'YOUR_SSO_WORKER_PORT',      -- Replace
    dbname 'YOUR_SSO_WORKER_DBNAME'   -- Replace
);

CREATE USER MAPPING FOR current_user
SERVER sso_worker_server
OPTIONS (
    user 'YOUR_SSO_WORKER_USER',      -- Replace
    password 'YOUR_SSO_WORKER_PASSWORD' -- Replace
);
```

### Step 2: Run Migration

```bash
# Apply migration
supabase db push

# Or manually
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f supabase/migrations/20260525000000_org_recruitment_dashboard_option3.sql
```

### Step 3: Verify Foreign Tables

```sql
-- Test foreign table access
SELECT * FROM sso_foreign.organizations LIMIT 5;
SELECT * FROM sso_foreign.users LIMIT 5;
SELECT * FROM sso_foreign.memberships LIMIT 5;
SELECT * FROM sso_foreign.roles;
SELECT * FROM sso_foreign.membership_roles LIMIT 5;
```

### Step 4: Test Helper Functions

```sql
-- Test membership check
SELECT public.is_org_member(
    'USER_UUID'::UUID,
    'ORG_UUID'::UUID
);

-- Test role retrieval
SELECT * FROM public.get_user_recruitment_roles(
    'USER_UUID'::UUID,
    'ORG_UUID'::UUID
);

-- Test permission check
SELECT public.has_recruitment_permission(
    'USER_UUID'::UUID,
    'ORG_UUID'::UUID,
    'create_jobs'
);

-- Test org context
SELECT * FROM public.get_user_org_context('USER_UUID'::UUID);
```

### Step 5: Enable Recruitment for Organizations

```sql
-- Enable recruitment for specific organizations
UPDATE public.organizations
SET recruitment_enabled = TRUE,
    max_recruiters = 10
WHERE organization_type = 'company';
```

### Step 6: Migrate Existing Data (Optional)

If you have existing recruitment data without organization_id:

```sql
-- Example: Assign existing requisitions to organizations
UPDATE public.requisitions r
SET organization_id = u.organizationId
FROM public.users u
WHERE r.created_by_uuid = u.id
AND r.organization_id IS NULL;

-- Example: Assign existing opportunities to organizations
UPDATE public.opportunities o
SET organization_id = u.organizationId
FROM public.users u
WHERE o.created_by_uuid = u.id
AND o.organization_id IS NULL;
```

## Testing

### Test RLS Policies

```sql
-- Set user context
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims = '{"sub": "USER_UUID"}';

-- Try to access data (should only see org-scoped data)
SELECT * FROM public.requisitions;
SELECT * FROM public.opportunities;
SELECT * FROM public.pipeline_candidates;
```

### Test Permissions

```sql
-- Test as company admin (should have full access)
SELECT public.has_recruitment_permission(
    'ADMIN_USER_UUID'::UUID,
    'ORG_UUID'::UUID,
    'delete_jobs'
); -- Should return TRUE

-- Test as recruiter (should have limited access)
SELECT public.has_recruitment_permission(
    'RECRUITER_USER_UUID'::UUID,
    'ORG_UUID'::UUID,
    'delete_jobs'
); -- Should return FALSE
```

## Frontend Integration

### 1. Get User's Organization Context

```typescript
// Get all organizations user belongs to
const { data: orgContext } = await supabase
  .rpc('get_user_org_context', {
    p_user_id: userId
  });

// orgContext contains:
// - org_id
// - org_name
// - org_slug
// - membership_status
// - sso_role_name
// - recruitment_role
// - recruitment_enabled
```

### 2. Check Permissions

```typescript
// Check if user can create jobs
const { data: canCreate } = await supabase
  .rpc('has_recruitment_permission', {
    p_user_id: userId,
    p_org_id: orgId,
    p_permission: 'create_jobs'
  });

if (canCreate) {
  // Show create job button
}
```

### 3. Create Organization-Scoped Data

```typescript
// Create requisition with organization context
const { data, error } = await supabase
  .from('requisitions')
  .insert({
    organization_id: orgId,
    created_by_uuid: userId,
    title: 'Software Engineer',
    department: 'Engineering',
    // ... other fields
  });
```

### 4. Query Organization-Scoped Data

```typescript
// RLS automatically filters by organization
const { data: requisitions } = await supabase
  .from('requisitions')
  .select('*')
  .eq('organization_id', orgId);
```

## Rollback

To rollback the migration:

```bash
# Run rollback script
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f supabase/migrations/20260525000001_org_recruitment_dashboard_option3_rollback.sql
```

This will:
1. Drop all RLS policies
2. Drop all indexes
3. Drop all helper functions
4. Remove added columns
5. Drop recruitment_role_mapping table
6. Drop foreign tables and server

## Troubleshooting

### Issue: Cannot connect to foreign server

**Solution**: Check network connectivity and credentials
```sql
-- Test connection
SELECT * FROM sso_foreign.organizations LIMIT 1;
```

### Issue: Permission denied on foreign tables

**Solution**: Grant permissions in SSO-Worker database
```sql
-- Run in SSO-Worker database
GRANT SELECT ON public.organizations TO fdw_user;
GRANT SELECT ON public.users TO fdw_user;
GRANT SELECT ON public.memberships TO fdw_user;
GRANT SELECT ON public.roles TO fdw_user;
GRANT SELECT ON public.membership_roles TO fdw_user;
```

### Issue: RLS policies blocking access

**Solution**: Verify user membership and permissions
```sql
-- Check membership
SELECT * FROM sso_foreign.memberships 
WHERE user_id = 'USER_UUID' AND org_id = 'ORG_UUID';

-- Check roles
SELECT * FROM public.get_user_recruitment_roles(
    'USER_UUID'::UUID,
    'ORG_UUID'::UUID
);
```

### Issue: Slow queries

**Solution**: Add indexes and consider caching
```sql
-- Add indexes on foreign tables (in SSO-Worker)
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_org_id ON memberships(org_id);
CREATE INDEX idx_membership_roles_membership_id ON membership_roles(membership_id);
```

## Performance Considerations

1. **FDW Query Overhead**: Foreign table queries have network latency
   - **Solution**: Cache frequently accessed data (user roles, permissions)
   - **Solution**: Use materialized views for complex joins

2. **RLS Policy Performance**: Each query checks membership via FDW
   - **Solution**: Add indexes on foreign tables
   - **Solution**: Consider connection pooling

3. **Large Organizations**: Many members = many FDW queries
   - **Solution**: Implement application-level caching
   - **Solution**: Use Redis for session-based permission caching

## Security Notes

1. **FDW Credentials**: Store securely, use read-only user
2. **RLS Policies**: Always enabled, cannot be bypassed by users
3. **Helper Functions**: SECURITY DEFINER - execute with elevated privileges
4. **Backward Compatibility**: NULL organization_id allowed for legacy data

## Next Steps

1. ✅ Migration complete
2. ⏭️ Update frontend to use organization context
3. ⏭️ Implement invitation flow for recruiters
4. ⏭️ Create admin dashboard for team management
5. ⏭️ Add analytics for organization-level metrics
6. ⏭️ Implement role-based UI components

## Support

For issues or questions:
1. Check troubleshooting section
2. Review helper function implementations
3. Test with sample data
4. Check SSO-Worker database connectivity
