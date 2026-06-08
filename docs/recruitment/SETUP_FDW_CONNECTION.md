# Foreign Data Wrapper Setup Guide

## Prerequisites

Before running the migration, you need:

1. **SSO-Worker Database Credentials**:
   - Host (e.g., `db.xxx.supabase.co`)
   - Port (usually `5432`)
   - Database name (usually `postgres`)
   - Username (usually `postgres`)
   - Password

2. **Network Access**:
   - SkillPassport database must be able to connect to SSO-Worker database
   - Check firewall rules and network policies
   - For Supabase projects, they should be able to connect if in same region

## Step 1: Get SSO-Worker Connection Details

### From Supabase Dashboard

1. Go to SSO-Worker project in Supabase
2. Navigate to **Settings** → **Database**
3. Copy the connection details:
   ```
   Host: db.xxx.supabase.co
   Port: 5432
   Database: postgres
   User: postgres
   Password: [your-password]
   ```

### From Connection String

If you have a connection string like:
```
postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

Extract:
- Host: `db.xxx.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: `[PASSWORD]`

## Step 2: Store Password in Supabase Vault (Recommended)

### Option A: Using Supabase Dashboard

1. Go to SkillPassport project in Supabase
2. Navigate to **Database** → **Vault**
3. Click **New Secret**
4. Enter:
   - Name: `sso_worker_password`
   - Secret: `[your-sso-worker-password]`
5. Click **Save**

### Option B: Using SQL

```sql
-- Store password in vault
SELECT vault.create_secret('your-sso-worker-password', 'sso_worker_password');

-- Verify it was stored
SELECT name FROM vault.secrets WHERE name = 'sso_worker_password';
```

## Step 3: Update Migration File

Open `supabase/migrations/20260523000000_org_recruitment_dashboard_fdw.sql` and update:

### Replace Connection Parameters

Find this section:
```sql
CREATE SERVER sso_worker_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host 'YOUR_SSO_WORKER_HOST',           -- REPLACE THIS
    port '5432',
    dbname 'postgres',
    fetch_size '1000',
    extensions 'uuid-ossp'
  );
```

Replace with your actual values:
```sql
CREATE SERVER sso_worker_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host 'db.xxx.supabase.co',              -- Your SSO-Worker host
    port '5432',
    dbname 'postgres',
    fetch_size '1000',
    extensions 'uuid-ossp'
  );
```

### Update User Mapping

#### Option A: Using Vault (Recommended)

Find this section:
```sql
CREATE USER MAPPING IF NOT EXISTS FOR postgres
  SERVER sso_worker_server
  OPTIONS (
    user 'postgres',
    password 'YOUR_SSO_WORKER_PASSWORD'     -- REPLACE THIS
  );
```

Replace with vault reference:
```sql
CREATE USER MAPPING IF NOT EXISTS FOR postgres
  SERVER sso_worker_server
  OPTIONS (
    user 'postgres',
    password (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'sso_worker_password')
  );
```

#### Option B: Direct Password (Not Recommended for Production)

```sql
CREATE USER MAPPING IF NOT EXISTS FOR postgres
  SERVER sso_worker_server
  OPTIONS (
    user 'postgres',
    password 'your-actual-password'
  );
```

## Step 4: Run the Migration

### Using Supabase CLI

```bash
# Make sure you're in the project directory
cd /path/to/skillpassport

# Push migration to database
supabase db push

# Or apply specific migration
supabase migration up
```

### Using Supabase Dashboard

1. Go to SkillPassport project in Supabase
2. Navigate to **Database** → **Migrations**
3. Click **New Migration**
4. Copy and paste the migration file content
5. Click **Run Migration**

## Step 5: Verify Connection

### Test Foreign Tables

```sql
-- Test memberships table
SELECT COUNT(*) FROM sso_foreign.memberships;

-- Test roles table
SELECT * FROM sso_foreign.roles;

-- Test membership_roles table
SELECT COUNT(*) FROM sso_foreign.membership_roles;
```

### Test Helper Functions

```sql
-- Get a user_id and org_id from SSO-Worker
SELECT user_id, org_id FROM sso_foreign.memberships LIMIT 1;

-- Test is_org_member function (replace with actual UUIDs)
SELECT public.is_org_member('user-uuid-here', 'org-uuid-here');

-- Test get_user_recruitment_roles function
SELECT public.get_user_recruitment_roles('user-uuid-here', 'org-uuid-here');

-- Test has_recruitment_permission function
SELECT public.has_recruitment_permission('user-uuid-here', 'org-uuid-here', 'create_jobs');
```

### Check Role Mappings

```sql
-- View all role mappings
SELECT 
  sso_role_name,
  recruitment_role,
  can_manage_team,
  can_create_jobs,
  can_edit_jobs,
  can_view_candidates,
  can_manage_candidates
FROM public.recruitment_role_mapping
ORDER BY sso_role_name, recruitment_role;
```

## Step 6: Backfill Organization IDs

After migration, you need to backfill `organization_id` for existing recruitment data.

### Example Backfill Script

```sql
-- Backfill requisitions
-- This is an example - adjust based on your business logic
UPDATE public.requisitions r
SET organization_id = (
  SELECT m.org_id 
  FROM sso_foreign.memberships m
  JOIN public.users u ON u.id = m.user_id
  WHERE u.email = r.created_by  -- Assuming created_by is email
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Backfill opportunities
UPDATE public.opportunities o
SET organization_id = (
  SELECT m.org_id 
  FROM sso_foreign.memberships m
  WHERE m.user_id = o.recruiter_id
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Backfill pipeline_candidates
UPDATE public.pipeline_candidates pc
SET organization_id = (
  SELECT o.organization_id
  FROM public.opportunities o
  WHERE o.id = pc.opportunity_id
  LIMIT 1
)
WHERE organization_id IS NULL;
```

## Troubleshooting

### Error: "could not connect to server"

**Cause**: Network connectivity issue or wrong host/port

**Solution**:
1. Verify host and port are correct
2. Check if SSO-Worker database is running
3. Verify network access between databases
4. For Supabase: Ensure both projects are in same region

### Error: "password authentication failed"

**Cause**: Wrong username or password

**Solution**:
1. Verify username (usually `postgres`)
2. Verify password is correct
3. If using vault, check secret name matches
4. Try direct password first to isolate issue

### Error: "permission denied for schema public"

**Cause**: User doesn't have permissions on SSO-Worker tables

**Solution**:
```sql
-- Run on SSO-Worker database
GRANT USAGE ON SCHEMA public TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO postgres;
```

### Error: "foreign table does not exist"

**Cause**: Foreign tables not created or wrong schema/table names

**Solution**:
1. Verify tables exist in SSO-Worker: `\dt` in psql
2. Check schema name (should be `public`)
3. Check table names match exactly
4. Re-run foreign table creation

### Performance Issues

**Symptoms**: Slow queries involving foreign tables

**Solutions**:
1. **Add indexes on SSO-Worker tables**:
   ```sql
   -- Run on SSO-Worker database
   CREATE INDEX IF NOT EXISTS idx_memberships_user_org 
     ON memberships(user_id, org_id);
   CREATE INDEX IF NOT EXISTS idx_memberships_status 
     ON memberships(status);
   CREATE INDEX IF NOT EXISTS idx_membership_roles_membership 
     ON membership_roles(membership_id);
   ```

2. **Use materialized views**:
   ```sql
   -- Run on SkillPassport database
   CREATE MATERIALIZED VIEW user_org_cache AS
   SELECT 
     m.user_id,
     m.org_id,
     m.status,
     array_agg(r.name) as roles
   FROM sso_foreign.memberships m
   JOIN sso_foreign.membership_roles mr ON mr.membership_id = m.id
   JOIN sso_foreign.roles r ON r.id = mr.role_id
   GROUP BY m.user_id, m.org_id, m.status;
   
   -- Refresh every 5 minutes (adjust as needed)
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   SELECT cron.schedule('refresh-user-org-cache', '*/5 * * * *', 
     'REFRESH MATERIALIZED VIEW user_org_cache');
   ```

3. **Increase fetch_size**:
   ```sql
   ALTER SERVER sso_worker_server 
   OPTIONS (SET fetch_size '5000');
   ```

## Monitoring

### Check FDW Statistics

```sql
-- View FDW query performance
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements 
WHERE query LIKE '%sso_foreign%' 
ORDER BY total_exec_time DESC
LIMIT 10;
```

### Check Active Connections

```sql
-- View active FDW connections
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity 
WHERE application_name LIKE '%fdw%';
```

### Monitor Foreign Table Access

```sql
-- View foreign table access stats
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables 
WHERE schemaname = 'sso_foreign';
```

## Security Best Practices

1. **Use Vault for Passwords**: Never hardcode passwords in migration files
2. **Limit Permissions**: Grant only SELECT on foreign tables
3. **Use SECURITY DEFINER**: Helper functions should use SECURITY DEFINER
4. **Monitor Access**: Regularly check FDW connection logs
5. **Rotate Credentials**: Periodically update SSO-Worker password

## Next Steps

After successful setup:

1. ✅ Test all helper functions with real data
2. ✅ Backfill organization_id for existing data
3. ✅ Test RLS policies with different user roles
4. ✅ Update frontend to use new org-scoped queries
5. ✅ Implement team invitation flow
6. ✅ Create admin dashboard
7. ✅ Set up monitoring and alerts

## Support

If you encounter issues:

1. Check Supabase logs: **Database** → **Logs**
2. Review migration output for errors
3. Test FDW connection manually
4. Verify SSO-Worker database is accessible
5. Check network connectivity between databases
