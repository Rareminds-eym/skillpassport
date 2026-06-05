# Schema Verification Checklist ✅

## Migration File: `20260525000000_org_recruitment_dashboard_option3.sql`

### ✅ VERIFIED - Ready to Run

---

## 1. Foreign Table Definitions ✅

### SSO-Worker Tables (Verified against actual schema)

| Table | Columns Verified | Status |
|-------|-----------------|--------|
| **organizations** | id, name, slug, created_by, metadata, created_at | ✅ CORRECT |
| **users** | id, email, password_hash, is_email_verified, created_at, updated_at, last_login_at, is_blocked | ✅ CORRECT |
| **memberships** | id, user_id, org_id, status, created_at | ✅ CORRECT |
| **roles** | id, name, description, created_at | ✅ CORRECT |
| **membership_roles** | id, membership_id, role_id, created_at | ✅ CORRECT |

**Note**: Fixed - Removed non-existent `updated_at` columns from organizations, memberships, and roles tables.

---

## 2. New Table Creation ✅

### recruitment_role_mapping

| Feature | Status |
|---------|--------|
| Primary key (id UUID) | ✅ |
| sso_role_name (owner, admin, member) | ✅ |
| recruitment_role (company_admin, recruiter, viewer) | ✅ |
| Permission flags (9 boolean columns) | ✅ |
| Constraints (CHECK, UNIQUE) | ✅ |
| Default data inserted | ✅ |
| Timestamps (created_at, updated_at) | ✅ |

---

## 3. Existing Table Modifications ✅

### organizations
- ✅ `recruitment_enabled` BOOLEAN DEFAULT FALSE
- ✅ `max_recruiters` INTEGER DEFAULT 10

### requisitions
- ✅ `organization_id` UUID (FK to organizations)
- ✅ `created_by_uuid` UUID (FK to users)
- ✅ `assigned_to` UUID (FK to users)
- ✅ `approval_status` TEXT (pending, approved, rejected)

### opportunities
- ✅ `organization_id` UUID (FK to organizations)
- ✅ `created_by_uuid` UUID (FK to users)

### pipeline_candidates
- ✅ `organization_id` UUID (FK to organizations)
- ✅ `assigned_to_uuid` UUID (FK to users)
- ✅ `added_by_uuid` UUID (FK to users)

---

## 4. Helper Functions ✅

| Function | Purpose | Status |
|----------|---------|--------|
| `is_org_member(user_id, org_id)` | Check membership via FDW | ✅ |
| `get_user_recruitment_roles(user_id, org_id)` | Get roles and permissions | ✅ |
| `has_recruitment_permission(user_id, org_id, permission)` | Check specific permission | ✅ |
| `get_user_org_context(user_id)` | Get all user organizations | ✅ |

All functions:
- ✅ Use SECURITY DEFINER
- ✅ Marked as STABLE
- ✅ Query foreign tables correctly
- ✅ Have proper comments

---

## 5. RLS Policies ✅

### Coverage

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| requisitions | ✅ | ✅ | ✅ | ✅ |
| opportunities | ✅ | ✅ | ✅ | ✅ |
| pipeline_candidates | ✅ | ✅ | ✅ | ✅ |

### Policy Logic
- ✅ Backward compatible (NULL organization_id allowed)
- ✅ Uses helper functions for membership checks
- ✅ Permission-based access control
- ✅ Proper auth.uid() usage

---

## 6. Indexes ✅

### Performance Indexes Created

**requisitions**: 5 indexes
- organization_id, created_by_uuid, assigned_to, status, approval_status

**opportunities**: 4 indexes
- organization_id, created_by_uuid, requisition_id_uuid, status

**pipeline_candidates**: 6 indexes
- organization_id, assigned_to_uuid, added_by_uuid, learner_id, stage, status

**recruitment_role_mapping**: 2 indexes
- sso_role_name, recruitment_role

**Total**: 17 indexes ✅

---

## 7. Triggers ✅

- ✅ `update_updated_at_column()` function created
- ✅ Trigger on `recruitment_role_mapping` table

---

## 8. Permissions ✅

- ✅ GRANT USAGE ON SCHEMA sso_foreign TO authenticated
- ✅ GRANT SELECT ON foreign tables TO authenticated
- ✅ GRANT SELECT ON recruitment_role_mapping TO authenticated
- ✅ GRANT EXECUTE ON helper functions TO authenticated
- ✅ GRANT INSERT, UPDATE, DELETE ON recruitment_role_mapping TO service_role

---

## 9. Transaction Safety ✅

- ✅ Wrapped in BEGIN/COMMIT
- ✅ Uses IF NOT EXISTS for idempotency
- ✅ Uses DROP IF EXISTS before creating foreign tables
- ✅ Uses ADD COLUMN IF NOT EXISTS
- ✅ Uses CREATE INDEX IF NOT EXISTS

---

## 10. Alignment with ERD ✅

| ERD Component | Implementation | Status |
|---------------|----------------|--------|
| 5 Foreign Tables | All 5 created correctly | ✅ |
| 1 New Table | recruitment_role_mapping created | ✅ |
| 4 Modified Tables | All columns added | ✅ |
| 2 Reused Tables | organization_invitations, organization_subscriptions (no changes needed) | ✅ |
| Cross-DB Relationships | FDW queries in helper functions | ✅ |
| Role Mapping | Default mappings inserted | ✅ |

---

## Issues Fixed ✅

### Before Review:
1. ❌ `organizations` had non-existent `updated_at` column
2. ❌ `memberships` had non-existent `updated_at` column
3. ❌ `roles` had non-existent `updated_at` column

### After Fix:
1. ✅ Removed `updated_at` from `organizations` foreign table
2. ✅ Removed `updated_at` from `memberships` foreign table
3. ✅ Removed `updated_at` from `roles` foreign table
4. ✅ Added missing columns to `users` foreign table (last_login_at, is_blocked)

---

## Pre-Flight Checklist

Before running the migration, ensure:

- [ ] **FDW Connection Details Updated** (lines 35-48)
  - [ ] host: Replace `'supabase_db_sso-auth'` with actual SSO-Worker host
  - [ ] port: Verify `'5432'` is correct
  - [ ] dbname: Replace `'postgres'` with actual SSO-Worker database name
  - [ ] user: Replace `'supabase_auth_admin'` with actual username
  - [ ] password: Replace `'postgres'` with actual password

- [ ] **Network Connectivity**
  - [ ] SkillPassport DB can reach SSO-Worker DB
  - [ ] Firewall rules allow connection
  - [ ] SSL/TLS configured if required

- [ ] **Database Permissions**
  - [ ] SSO-Worker user has SELECT permission on all 5 tables
  - [ ] SkillPassport user has permission to create extensions
  - [ ] SkillPassport user has permission to create foreign servers

- [ ] **Backup Created**
  - [ ] SkillPassport database backed up
  - [ ] Can rollback if needed

---

## Running the Migration

### Option 1: Supabase CLI (Recommended)
```bash
cd "c:\Users\saheb\OneDrive\Desktop\Skill Passport\skillpassport"
supabase db push
```

### Option 2: psql
```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB \
  -f supabase/migrations/20260525000000_org_recruitment_dashboard_option3.sql
```

### Option 3: Supabase Dashboard
1. Go to SQL Editor
2. Copy migration file content
3. Click "Run"

---

## Post-Migration Verification

### 1. Verify Foreign Tables
```sql
-- Test foreign table access
SELECT COUNT(*) FROM sso_foreign.organizations;
SELECT COUNT(*) FROM sso_foreign.users;
SELECT COUNT(*) FROM sso_foreign.memberships;
SELECT COUNT(*) FROM sso_foreign.roles;
SELECT COUNT(*) FROM sso_foreign.membership_roles;
```

### 2. Verify New Table
```sql
-- Check recruitment_role_mapping
SELECT * FROM public.recruitment_role_mapping;
-- Should return 3 rows (owner, admin, member)
```

### 3. Verify Columns Added
```sql
-- Check organizations
SELECT recruitment_enabled, max_recruiters 
FROM public.organizations LIMIT 1;

-- Check requisitions
SELECT organization_id, created_by_uuid, assigned_to, approval_status 
FROM public.requisitions LIMIT 1;

-- Check opportunities
SELECT organization_id, created_by_uuid 
FROM public.opportunities LIMIT 1;

-- Check pipeline_candidates
SELECT organization_id, assigned_to_uuid, added_by_uuid 
FROM public.pipeline_candidates LIMIT 1;
```

### 4. Test Helper Functions
```sql
-- Replace with actual UUIDs from your database
SELECT public.is_org_member(
    'USER_UUID'::UUID,
    'ORG_UUID'::UUID
);

SELECT * FROM public.get_user_recruitment_roles(
    'USER_UUID'::UUID,
    'ORG_UUID'::UUID
);

SELECT public.has_recruitment_permission(
    'USER_UUID'::UUID,
    'ORG_UUID'::UUID,
    'create_jobs'
);

SELECT * FROM public.get_user_org_context('USER_UUID'::UUID);
```

### 5. Verify RLS Policies
```sql
-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('requisitions', 'opportunities', 'pipeline_candidates')
ORDER BY tablename, policyname;
-- Should return 12 policies (4 per table)
```

### 6. Verify Indexes
```sql
-- Check indexes created
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('requisitions', 'opportunities', 'pipeline_candidates', 'recruitment_role_mapping')
ORDER BY tablename, indexname;
-- Should return 17+ indexes
```

---

## Rollback

If you need to rollback:

```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB \
  -f supabase/migrations/20260525000001_org_recruitment_dashboard_option3_rollback.sql
```

---

## Summary

✅ **Schema is CORRECT and READY TO RUN**

- All foreign table definitions match SSO-Worker schema
- All new columns properly defined with constraints
- All helper functions correctly query foreign tables
- All RLS policies properly configured
- All indexes created for performance
- Transaction-safe and idempotent
- Backward compatible (NULL organization_id allowed)

**Total Changes:**
- 5 Foreign Tables imported
- 1 New Table created
- 4 Existing Tables modified (8 new columns total)
- 4 Helper Functions created
- 12 RLS Policies created
- 17 Indexes created
- 1 Trigger created

**Next Step**: Update FDW connection details and run the migration!
