# Pre-Migration Check: Unique Organization Names

**Date:** 2026-07-17  
**Migration File:** `supabase/migrations/20260702000002_make_org_name_unique.sql`  
**Check Type:** Data Validation  
**Risk Level:** CRITICAL  
**Status:** VERIFICATION REQUIRED BEFORE DEPLOYMENT

---

## Overview

This document verifies that the unique constraint migration can be safely applied to production data.

**Migration Being Verified:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS organizations_name_unique_idx 
    ON public.organizations (LOWER(name)) 
    WHERE name IS NOT NULL;
```

**Risk:** If duplicate organization names exist in production, this migration will **FAIL** and block deployment.

---

## Pre-Deployment Verification Steps

### Step 1: Check for Duplicate Names in Production

**Required Action:** Run this query on production database **BEFORE** deploying the migration.

```sql
-- Check for duplicate organization names (case-insensitive)
SELECT 
  LOWER(name) as normalized_name,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as org_ids,
  STRING_AGG(name, ' | ') as original_names,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM public.organizations 
WHERE name IS NOT NULL 
GROUP BY LOWER(name) 
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, LOWER(name);
```

**Expected Result:** **0 rows** (no duplicates)

**If Query Returns Rows:** Migration will fail. Proceed to Step 2 (Data Cleanup).

---

### Step 2: Analyze Duplicate Data (If Found)

If duplicates exist, run additional analysis:

```sql
-- Detailed analysis of duplicate organizations
WITH duplicates AS (
  SELECT 
    LOWER(name) as normalized_name,
    COUNT(*) as count
  FROM public.organizations 
  WHERE name IS NOT NULL 
  GROUP BY LOWER(name) 
  HAVING COUNT(*) > 1
)
SELECT 
  o.id,
  o.name,
  o.slug,
  o.created_at,
  o.created_by,
  o.updated_at,
  d.count as total_duplicates,
  -- Check if org has any members
  (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) as member_count,
  -- Check if org has any subscriptions
  (SELECT COUNT(*) FROM organization_subscriptions os WHERE os.organization_id = o.id) as subscription_count,
  -- Check if org has any requisitions
  (SELECT COUNT(*) FROM requisitions r WHERE r.organization_id = o.id) as requisition_count
FROM public.organizations o
JOIN duplicates d ON LOWER(o.name) = d.normalized_name
ORDER BY d.normalized_name, o.created_at;
```

**Analysis Points:**
1. Which orgs are active (have members, subscriptions, requisitions)?
2. Which orgs are abandoned (no activity)?
3. Are duplicates from test data or real users?
4. Determine merge vs delete strategy

---

### Step 3: Data Cleanup (If Duplicates Found)

**⚠️ CRITICAL: Get explicit user approval before running any cleanup queries.**

#### Strategy A: Delete Abandoned Duplicates (Safest)

If duplicates have no members, subscriptions, or requisitions:

```sql
-- SAFETY CHECK: Verify these orgs are truly abandoned
SELECT 
  o.id,
  o.name,
  o.created_at,
  (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) as members,
  (SELECT COUNT(*) FROM organization_subscriptions os WHERE os.organization_id = o.id) as subscriptions,
  (SELECT COUNT(*) FROM requisitions r WHERE r.organization_id = o.id) as requisitions
FROM public.organizations o
WHERE LOWER(o.name) IN (
  SELECT LOWER(name) 
  FROM public.organizations 
  WHERE name IS NOT NULL 
  GROUP BY LOWER(name) 
  HAVING COUNT(*) > 1
)
AND NOT EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = o.id)
AND NOT EXISTS (SELECT 1 FROM organization_subscriptions os WHERE os.organization_id = o.id)
AND NOT EXISTS (SELECT 1 FROM requisitions r WHERE r.organization_id = o.id);

-- If above query shows safe-to-delete orgs:
-- DELETE FROM public.organizations 
-- WHERE id IN (
--   -- IDs from above query
-- );
```

**Approval Required:** Yes, document IDs to delete and get approval.

---

#### Strategy B: Rename Duplicates (For Active Orgs)

If duplicates have activity, append suffix:

```sql
-- Preview rename changes (DO NOT RUN without approval)
WITH duplicates AS (
  SELECT 
    LOWER(name) as normalized_name,
    ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY created_at) as row_num
  FROM public.organizations 
  WHERE name IS NOT NULL
),
rename_candidates AS (
  SELECT 
    o.id,
    o.name as old_name,
    CASE 
      WHEN d.row_num > 1 THEN o.name || ' (' || d.row_num || ')'
      ELSE o.name
    END as new_name,
    d.row_num
  FROM public.organizations o
  JOIN duplicates d ON LOWER(o.name) = d.normalized_name
  WHERE d.row_num > 1
)
SELECT * FROM rename_candidates;

-- After approval, apply renames:
-- UPDATE public.organizations
-- SET name = CASE 
--   WHEN id = 'uuid1' THEN 'Acme Corp (2)'
--   WHEN id = 'uuid2' THEN 'Acme Corp (3)'
--   -- etc...
-- END
-- WHERE id IN ('uuid1', 'uuid2', ...);
```

**Approval Required:** Yes, review all renames with stakeholders.

---

#### Strategy C: Manual Resolution (Complex Cases)

If duplicates have significant activity, require manual review:

1. Export duplicate data to CSV
2. Contact organization owners
3. Determine correct organization
4. Migrate data from duplicate to primary
5. Delete duplicate after data migration

**Process:**
```sql
-- Export for manual review
COPY (
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.created_at,
    o.created_by,
    (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) as members,
    (SELECT COUNT(*) FROM organization_subscriptions os WHERE os.organization_id = o.id) as subscriptions,
    (SELECT COUNT(*) FROM requisitions r WHERE r.organization_id = o.id) as requisitions,
    (SELECT email FROM users u WHERE u.id = o.created_by) as creator_email
  FROM public.organizations o
  WHERE LOWER(o.name) IN (
    SELECT LOWER(name) 
    FROM public.organizations 
    WHERE name IS NOT NULL 
    GROUP BY LOWER(name) 
    HAVING COUNT(*) > 1
  )
  ORDER BY LOWER(o.name), o.created_at
) TO '/tmp/duplicate_organizations.csv' WITH CSV HEADER;
```

---

### Step 4: Re-verify No Duplicates

After cleanup, re-run duplicate check:

```sql
-- Verify cleanup was successful
SELECT 
  LOWER(name) as normalized_name,
  COUNT(*) as count
FROM public.organizations 
WHERE name IS NOT NULL 
GROUP BY LOWER(name) 
HAVING COUNT(*) > 1;
```

**Expected Result:** **0 rows**

**If Still Has Duplicates:** Repeat Step 2-3 until clean.

---

### Step 5: Deploy Migration

Only after verification shows 0 duplicates:

```bash
# Deploy unique constraint migration
supabase db push

# Or if using specific migration:
# psql $DATABASE_URL -f supabase/migrations/20260702000002_make_org_name_unique.sql
```

**Monitor deployment:**
- Check for errors
- Verify index created successfully
- Test signup with duplicate name (should fail gracefully)

---

## Rollback Plan

If migration fails or causes issues:

```sql
-- Drop the unique index
DROP INDEX IF EXISTS public.organizations_name_unique_idx;

-- Verify index removed
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'organizations' 
AND indexname = 'organizations_name_unique_idx';
-- Should return 0 rows
```

**Rollback Safe:** Yes, dropping index does not affect data.

---

## Testing Strategy

### Staging Environment Test

Before production deployment:

1. **Clone production data to staging**
   ```bash
   # Create sanitized copy of production data
   pg_dump $PROD_DATABASE_URL | psql $STAGING_DATABASE_URL
   ```

2. **Run duplicate check on staging**
   ```sql
   -- Should match production results
   SELECT COUNT(*) FROM (
     SELECT LOWER(name) 
     FROM public.organizations 
     WHERE name IS NOT NULL 
     GROUP BY LOWER(name) 
     HAVING COUNT(*) > 1
   ) duplicates;
   ```

3. **Apply migration to staging**
   ```bash
   supabase db push --env staging
   ```

4. **Verify migration success**
   ```sql
   -- Check index exists
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'organizations' 
   AND indexname = 'organizations_name_unique_idx';
   ```

5. **Test duplicate name rejection**
   ```sql
   -- Should succeed (first insert)
   INSERT INTO organizations (id, name, slug, created_by)
   VALUES (gen_random_uuid(), 'Test Corp', 'test-corp', NULL);

   -- Should fail with unique constraint error
   INSERT INTO organizations (id, name, slug, created_by)
   VALUES (gen_random_uuid(), 'test corp', 'test-corp-2', NULL);
   -- Expected error: duplicate key value violates unique constraint
   ```

---

## Production Deployment Checklist

- [ ] **Pre-Deployment**
  - [ ] Run duplicate check query on production (Step 1)
  - [ ] Result: 0 duplicates found
  - [ ] Screenshot/log query results for audit
  - [ ] Get explicit approval to proceed

- [ ] **If Duplicates Found**
  - [ ] Analyze duplicate data (Step 2)
  - [ ] Choose cleanup strategy (A, B, or C)
  - [ ] Get explicit approval for cleanup plan
  - [ ] Execute cleanup queries
  - [ ] Re-verify 0 duplicates (Step 4)
  - [ ] Document cleanup actions taken

- [ ] **Staging Validation**
  - [ ] Clone production data to staging
  - [ ] Apply migration to staging
  - [ ] Verify index created
  - [ ] Test duplicate name rejection
  - [ ] No errors observed

- [ ] **Production Deployment**
  - [ ] Schedule deployment during low-traffic window
  - [ ] Have rollback plan ready
  - [ ] Deploy migration
  - [ ] Monitor for errors
  - [ ] Verify index created
  - [ ] Test duplicate name rejection (in production)
  - [ ] Update runbooks with new constraint

- [ ] **Post-Deployment**
  - [ ] Monitor error logs for constraint violations
  - [ ] Update application code to handle unique constraint errors gracefully
  - [ ] Document any issues encountered

---

## Application Code Updates Required

After migration, application must handle unique constraint errors:

```typescript
// Backend: Organization creation
async function createOrganization(name: string): Promise<Result> {
  try {
    const org = await db.organizations.create({
      data: { name, slug: generateSlug(name) },
    });
    return { success: true, org };
  } catch (error) {
    // Check for unique constraint violation
    if (error.code === '23505' && error.constraint === 'organizations_name_unique_idx') {
      return { 
        success: false, 
        error: 'An organization with this name already exists',
        errorCode: 'DUPLICATE_NAME',
      };
    }
    throw error;
  }
}

// Frontend: Onboarding Step 1
async function handleOrgNameSubmit(name: string) {
  const result = await apiPost('/recruitment/organization/profile', { name });
  
  if (!result.success && result.errorCode === 'DUPLICATE_NAME') {
    setError('companyName', {
      type: 'manual',
      message: 'An organization with this name already exists. Please choose a different name.',
    });
    // Optionally: Show list of similar names or suggest alternatives
  }
}
```

---

## Monitoring & Alerts

After deployment, monitor:

1. **Unique Constraint Violations**
   ```sql
   -- Query PostgreSQL logs for constraint violations
   SELECT 
     log_time,
     error_severity,
     message
   FROM pg_log
   WHERE message LIKE '%organizations_name_unique_idx%'
   AND log_time > NOW() - INTERVAL '24 hours'
   ORDER BY log_time DESC;
   ```

2. **Application Error Rate**
   - Track HTTP 400/409 responses with `DUPLICATE_NAME` error
   - Should be < 1% of organization creation attempts
   - High rate suggests users confused about existing orgs

3. **User Impact**
   - Monitor signup abandonment rate
   - Track "organization name already exists" error frequency
   - Collect feedback on name search functionality

---

## Success Criteria

- ✅ Pre-deployment duplicate check shows 0 duplicates
- ✅ Migration deploys without errors
- ✅ Index created successfully
- ✅ Duplicate name attempts fail with appropriate error
- ✅ Application handles constraint errors gracefully
- ✅ No production incidents related to unique constraint
- ✅ User signup flow not negatively impacted

---

## Related Documentation

- **Migration File:** `supabase/migrations/20260702000002_make_org_name_unique.sql`
- **ADR:** `.kiro/adr/ADR-043-enforce-unique-org-names.md` (to be created)
- **Migration Plan:** `.kiro/plans/2026-07-17_org-name-nullable_migration-plan.md`
- **Steering File:** `04-database-api-standards.md` Section 11.5

---

## Change Log

- **2026-07-17:** Pre-migration check documentation created
- **TBD:** Production duplicate check executed
- **TBD:** Migration deployed to production

---

## Approval Required

**This verification check must be completed and approved before deploying migration 20260702000002.**

**Sign-offs Required:**
- [ ] Database Administrator: _________________ Date: _______
- [ ] Tech Lead: _________________ Date: _______
- [ ] Production deployment approval: _________________ Date: _______

---

**Status:** ⚠️ PENDING VERIFICATION - Do not deploy until duplicate check complete
