# Database Schema Diagnostic Guide

This guide helps you diagnose and fix the "User not found in authentication system" error.

## Quick Start
 
Run these scripts **in your SkillPassport Supabase SQL Editor** in this order:

### 1. Check Current Setup (ALWAYS RUN THIS FIRST)
```sql
-- File: check_sso_foreign_schema.sql
-- This checks if the foreign data wrapper is configured
```

**What to look for:**
- ✅ All checks should show green checkmarks
- ❌ Any red X means that component needs to be fixed

---

## Common Scenarios 

### Scenario A: Everything Shows ✅
If all checks pass but you still get errors:

1. Run `test_user_lookup.sql` with the actual user ID from error logs
2. Check if the user exists in SSO database
3. The issue is likely **timing/replication delay** (already fixed in code)

### Scenario B: Foreign Tables Missing (❌ in Step 5-6)
If foreign tables don't exist:

1. **First, get your SSO-Worker connection details:**
   - Host: (usually `localhost` or your SSO server IP)
   - Port: (check your SSO-Worker database port, often `54332`)
   - Database: (usually `postgres`)
   - User: (usually `postgres`)
   - Password: (your SSO database password)

2. **Update connection details in `setup_sso_foreign_schema.sql`:**
   ```sql
   -- Find these lines and update:
   OPTIONS (
       host 'localhost',        -- YOUR HOST
       port '54332',           -- YOUR PORT
       dbname 'postgres'       -- YOUR DATABASE
   );
   
   -- And these credentials:
   OPTIONS (
       user 'postgres',        -- YOUR USER
       password 'postgres'     -- YOUR PASSWORD
   );
   ```

3. **Run the setup script:**
   ```sql
   -- File: setup_sso_foreign_schema.sql
   ```

4. **Verify it worked:**
   - You should see success messages
   - Re-run `check_sso_foreign_schema.sql` to confirm

### Scenario C: get_sso_user_email Function Missing (❌ in Step 9)
If the function doesn't exist:

1. **Run the function creation script:**
   ```sql
   -- File: create_get_sso_user_email_function.sql
   ```

2. **Test it:**
   ```sql
   SELECT get_sso_user_email('YOUR-USER-ID-HERE'::UUID);
   ```

### Scenario D: Connection Fails (❌ in Step 7-8)
If you can't connect to the foreign tables:

**Check 1: Is SSO-Worker database running?**
- If using Docker: `docker ps` (should see SSO-Worker container)
- If local: Check if PostgreSQL service is running on the SSO port

**Check 2: Are credentials correct?**
```sql
-- View current server configuration
SELECT 
    srvname,
    array_to_string(srvoptions, ', ') as options
FROM pg_foreign_server 
WHERE srvname = 'sso_worker_server';

-- Check user mapping
SELECT * FROM pg_user_mappings 
WHERE srvname = 'sso_worker_server';
```

**Check 3: Can you connect directly to SSO database?**
Try connecting via psql or a database client with the same credentials.

---

## File Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `check_sso_foreign_schema.sql` | Diagnose current state | **ALWAYS RUN FIRST** |
| `setup_sso_foreign_schema.sql` | Create/recreate foreign tables | When tables are missing |
| `create_get_sso_user_email_function.sql` | Create RPC function | When function is missing |
| `test_user_lookup.sql` | Test specific user lookup | When debugging specific errors |

---

## Understanding the Error

### Error Message:
```
User not found in authentication system
```

### What it means:
1. A user signed up (created in SSO-Worker database)
2. The invitation acceptance API tried to verify the user exists
3. The query to `sso_foreign.users` failed or returned no results

### Possible Causes:
1. **Foreign schema not configured** → Run setup scripts
2. **Timing delay** → Fixed in code with retry logic
3. **User actually doesn't exist** → Check SSO-Worker database directly
4. **Connection issue** → Check SSO-Worker database status

---

## Testing After Fixes

After running any setup scripts:

1. **Check schema again:**
   ```sql
   -- Run check_sso_foreign_schema.sql again
   ```

2. **Test with real user ID:**
   ```sql
   -- Update user_id in test_user_lookup.sql
   -- Then run it
   ```

3. **Test the full flow:**
   - Sign up a new user with invitation
   - Check console logs
   - Should see retry attempts
   - Should succeed within 5 attempts

---

## Still Having Issues?

If problems persist after running all scripts:

1. **Check server logs:**
   - Look for connection errors in Supabase logs
   - Check SSO-Worker database logs

2. **Verify data exists in SSO-Worker:**
   Connect directly to SSO-Worker database:
   ```sql
   SELECT id, email, created_at 
   FROM users 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Check network connectivity:**
   - Can SkillPassport database reach SSO-Worker database?
   - Check firewall rules
   - Check database host/port settings

---

## Quick Checklist

- [ ] Ran `check_sso_foreign_schema.sql`
- [ ] All foreign tables exist (Step 5-6 ✅)
- [ ] Connection test passed (Step 7-8 ✅)
- [ ] Function exists (Step 9 ✅)
- [ ] Tested with real user ID using `test_user_lookup.sql`
- [ ] Code changes deployed (exponential backoff + RPC function)
- [ ] Tested full signup flow

---

## Need to Reset Everything?

If you need to completely recreate the foreign schema:

```sql
-- DANGER: This drops everything
DROP SCHEMA IF EXISTS sso_foreign CASCADE;
DROP SERVER IF EXISTS sso_worker_server CASCADE;

-- Then run setup_sso_foreign_schema.sql
-- Then run create_get_sso_user_email_function.sql
```

**⚠️ WARNING:** Only do this if you're sure. This will break any existing code using the foreign tables until you recreate them.
