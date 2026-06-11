# Option 3: Cross-Database Architecture with Foreign Data Wrapper

## Overview

This implementation uses **Foreign Data Wrapper (FDW)** to connect SkillPassport database to SSO-Worker database, allowing us to query membership and role data without duplicating it.

## Architecture Decision

### Why Option 3?

**Problem**: The `memberships`, `roles`, and `membership_roles` tables exist ONLY in SSO-Worker database (separate Supabase project), NOT in SkillPassport database.

**Options Considered**:
1. ❌ **Create new tables** - Would duplicate data and create sync issues
2. ❌ **API-based queries** - Would be slow and complex for RLS policies
3. ✅ **Foreign Data Wrapper** - Query SSO-Worker directly, single source of truth

### Benefits

- **No data duplication** - memberships stay in SSO-Worker (single source of truth)
- **Minimal new tables** - only `recruitment_role_mapping` needed
- **Flexible role mapping** - map SSO roles to recruitment roles without schema changes
- **Proper separation** - Authentication in SSO-Worker, features in SkillPassport
- **Multi-org support** - users can have different roles in different orgs

## Database Structure

### SSO-Worker Database (External)
```
memberships (source of truth)
├── id, user_id, org_id, status
├── created_at, updated_at
└── Foreign table in SkillPassport: sso_foreign.memberships

roles (source of truth)
├── id, name, description
└── Foreign table in SkillPassport: sso_foreign.roles

membership_roles (source of truth)
├── id, membership_id, role_id
└── Foreign table in SkillPassport: sso_foreign.membership_roles
```

### SkillPassport Database (Main)
```
recruitment_role_mapping (NEW)
├── Maps SSO roles to recruitment roles
├── Defines permissions per role
└── Example: 'owner' → 'company_admin' with full permissions

requisitions (UPDATED)
├── Added: organization_id
├── Added: created_by_uuid, assigned_to_uuid
└── RLS policies query SSO-Worker via FDW

opportunities (UPDATED)
├── Added: organization_id
├── Added: created_by_uuid
└── RLS policies query SSO-Worker via FDW

pipeline_candidates (UPDATED)
├── Added: organization_id
├── Added: assigned_to_uuid, added_by_uuid
└── RLS policies query SSO-Worker via FDW
```

## Implementation Steps

### 1. Setup Foreign Data Wrapper

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create foreign server
CREATE SERVER sso_worker_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host 'YOUR_SSO_WORKER_HOST',
    port '5432',
    dbname 'postgres'
  );

-- Create user mapping
CREATE USER MAPPING FOR postgres
  SERVER sso_worker_server
  OPTIONS (
    user 'postgres',
    password 'YOUR_PASSWORD'  -- Use vault in production
  );
```

### 2. Import Foreign Tables

```sql
-- Create schema for foreign tables
CREATE SCHEMA IF NOT EXISTS sso_foreign;

-- Import memberships
CREATE FOREIGN TABLE sso_foreign.memberships (
  id uuid,
  user_id uuid,
  org_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'memberships');

-- Import roles
CREATE FOREIGN TABLE sso_foreign.roles (
  id uuid,
  name text,
  description text,
  created_at timestamptz,
  updated_at timestamptz
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'roles');

-- Import membership_roles
CREATE FOREIGN TABLE sso_foreign.membership_roles (
  id uuid,
  membership_id uuid,
  role_id uuid,
  created_at timestamptz
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'membership_roles');
```

### 3. Create Recruitment Role Mapping

```sql
CREATE TABLE public.recruitment_role_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sso_role_name text NOT NULL,              -- 'owner', 'admin', 'member'
  recruitment_role text NOT NULL,           -- 'company_admin', 'recruiter', 'viewer'
  can_manage_team boolean DEFAULT false,
  can_create_jobs boolean DEFAULT false,
  can_edit_jobs boolean DEFAULT false,
  can_delete_jobs boolean DEFAULT false,
  can_view_candidates boolean DEFAULT false,
  can_manage_candidates boolean DEFAULT false,
  can_view_analytics boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sso_role_name, recruitment_role)
);

-- Insert default mappings
INSERT INTO public.recruitment_role_mapping 
  (sso_role_name, recruitment_role, can_manage_team, can_create_jobs, can_edit_jobs, can_delete_jobs, can_view_candidates, can_manage_candidates, can_view_analytics, description)
VALUES
  ('owner', 'company_admin', true, true, true, true, true, true, true, 'Organization owner with full recruitment access'),
  ('admin', 'company_admin', true, true, true, true, true, true, true, 'Admin with full recruitment management'),
  ('member', 'recruiter', false, true, true, false, true, true, true, 'Recruiter with job and candidate management'),
  ('member', 'viewer', false, false, false, false, true, false, true, 'Read-only access to recruitment data');
```

### 4. Create Helper Functions

```sql
-- Check if user is org member
CREATE OR REPLACE FUNCTION public.is_org_member(p_user_id uuid, p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM sso_foreign.memberships m
    WHERE m.user_id = p_user_id 
      AND m.org_id = p_org_id 
      AND m.status = 'active'
  );
$$;

-- Get user's recruitment roles
CREATE OR REPLACE FUNCTION public.get_user_recruitment_roles(p_user_id uuid, p_org_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(array_agg(DISTINCT rrm.recruitment_role), ARRAY[]::text[])
  FROM sso_foreign.memberships m
  JOIN sso_foreign.membership_roles mr ON mr.membership_id = m.id
  JOIN sso_foreign.roles r ON r.id = mr.role_id
  JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = r.name
  WHERE m.user_id = p_user_id 
    AND m.org_id = p_org_id 
    AND m.status = 'active';
$$;

-- Check specific permission
CREATE OR REPLACE FUNCTION public.has_recruitment_permission(
  p_user_id uuid, 
  p_org_id uuid, 
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_has_permission boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM sso_foreign.memberships m
    JOIN sso_foreign.membership_roles mr ON mr.membership_id = m.id
    JOIN sso_foreign.roles r ON r.id = mr.role_id
    JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = r.name
    WHERE m.user_id = p_user_id 
      AND m.org_id = p_org_id 
      AND m.status = 'active'
      AND (
        CASE p_permission
          WHEN 'manage_team' THEN rrm.can_manage_team
          WHEN 'create_jobs' THEN rrm.can_create_jobs
          WHEN 'edit_jobs' THEN rrm.can_edit_jobs
          WHEN 'delete_jobs' THEN rrm.can_delete_jobs
          WHEN 'view_candidates' THEN rrm.can_view_candidates
          WHEN 'manage_candidates' THEN rrm.can_manage_candidates
          WHEN 'view_analytics' THEN rrm.can_view_analytics
          ELSE false
        END
      )
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$;
```

### 5. Create RLS Policies

```sql
-- Enable RLS
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_candidates ENABLE ROW LEVEL SECURITY;

-- Example: Requisitions SELECT policy
CREATE POLICY "Users can view requisitions in their org"
  ON public.requisitions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT m.org_id 
      FROM sso_foreign.memberships m
      WHERE m.user_id = auth.uid() 
        AND m.status = 'active'
    )
  );

-- Example: Requisitions INSERT policy
CREATE POLICY "Users can create requisitions in their org"
  ON public.requisitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_recruitment_permission(auth.uid(), organization_id, 'create_jobs')
  );
```

## Configuration

### Before Running Migration

1. **Update Foreign Server Connection**:
   ```sql
   -- In migration file, replace:
   host 'YOUR_SSO_WORKER_HOST'           -- e.g., 'db.xxx.supabase.co'
   password 'YOUR_SSO_WORKER_PASSWORD'   -- Use vault.secrets() in production
   ```

2. **Use Supabase Vault for Credentials**:
   ```sql
   -- Store password in vault
   SELECT vault.create_secret('YOUR_PASSWORD', 'sso_worker_password');
   
   -- Use in user mapping
   CREATE USER MAPPING FOR postgres
     SERVER sso_worker_server
     OPTIONS (
       user 'postgres',
       password (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sso_worker_password')
     );
   ```

## Testing

### 1. Test FDW Connection

```sql
-- Should return data from SSO-Worker
SELECT * FROM sso_foreign.memberships LIMIT 1;
SELECT * FROM sso_foreign.roles LIMIT 1;
```

### 2. Test Helper Functions

```sql
-- Replace with actual UUIDs
SELECT public.is_org_member('user-uuid', 'org-uuid');
SELECT public.get_user_recruitment_roles('user-uuid', 'org-uuid');
SELECT public.has_recruitment_permission('user-uuid', 'org-uuid', 'create_jobs');
```

### 3. Test RLS Policies

```sql
-- Set user context
SET request.jwt.claims = '{"sub": "user-uuid"}';

-- Should only return orgs where user is member
SELECT * FROM requisitions;
```

## Performance Considerations

### Caching Strategy

FDW queries can be slower than local queries. Consider:

1. **Materialized Views** for frequently accessed data:
   ```sql
   CREATE MATERIALIZED VIEW user_org_memberships AS
   SELECT m.user_id, m.org_id, m.status, array_agg(r.name) as roles
   FROM sso_foreign.memberships m
   JOIN sso_foreign.membership_roles mr ON mr.membership_id = m.id
   JOIN sso_foreign.roles r ON r.id = mr.role_id
   GROUP BY m.user_id, m.org_id, m.status;
   
   -- Refresh periodically
   REFRESH MATERIALIZED VIEW user_org_memberships;
   ```

2. **Application-level caching** (Redis):
   - Cache user memberships for 5-15 minutes
   - Invalidate on role changes

3. **Connection pooling**:
   - FDW maintains connection pool automatically
   - Monitor with `pg_stat_activity`

### Monitoring

```sql
-- Check FDW query performance
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%sso_foreign%' 
ORDER BY total_exec_time DESC;

-- Check active FDW connections
SELECT * FROM pg_stat_activity 
WHERE application_name LIKE '%fdw%';
```

## Migration Checklist

- [ ] Update FDW connection parameters in migration file
- [ ] Store SSO-Worker password in Supabase vault
- [ ] Run migration: `supabase db push`
- [ ] Test FDW connection: `SELECT * FROM sso_foreign.memberships LIMIT 1;`
- [ ] Verify role mappings: `SELECT * FROM recruitment_role_mapping;`
- [ ] Test helper functions with real user/org UUIDs
- [ ] Backfill `organization_id` for existing recruitment data
- [ ] Test RLS policies with different user roles
- [ ] Monitor FDW query performance
- [ ] Set up caching strategy if needed

## Troubleshooting

### Connection Issues

```sql
-- Check server configuration
SELECT * FROM pg_foreign_server WHERE srvname = 'sso_worker_server';

-- Check user mapping
SELECT * FROM pg_user_mappings WHERE srvname = 'sso_worker_server';

-- Test connection
SELECT * FROM sso_foreign.memberships LIMIT 1;
```

### Permission Issues

```sql
-- Grant permissions on foreign tables
GRANT SELECT ON sso_foreign.memberships TO authenticated;
GRANT SELECT ON sso_foreign.roles TO authenticated;
GRANT SELECT ON sso_foreign.membership_roles TO authenticated;
```

### Performance Issues

```sql
-- Check query execution time
EXPLAIN ANALYZE 
SELECT * FROM requisitions WHERE organization_id = 'org-uuid';

-- Consider adding indexes on foreign tables (in SSO-Worker)
-- Or use materialized views for caching
```

## Next Steps

1. Run the migration: `20260523000000_org_recruitment_dashboard_fdw.sql`
2. Update frontend to use new helper functions
3. Implement invitation flow using existing `organization_invitations` table
4. Create admin dashboard for team management
5. Add org-scoped recruitment analytics
6. Test with multiple organizations and roles

## References

- [PostgreSQL Foreign Data Wrapper Documentation](https://www.postgresql.org/docs/current/postgres-fdw.html)
- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault)
- [Row Level Security Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
