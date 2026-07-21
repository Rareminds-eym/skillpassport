# Org Name Nullable Migration Plan

**Date:** 2026-07-17  
**Migration File:** `supabase/migrations/20260701000001_make_org_name_nullable.sql`  
**Pattern:** Expand-Migrate-Contract  
**Status:** Phase 1 Complete, Phase 2 & 3 Documented

---

## Overview

This migration implements support for recruiter admin onboarding flow where organization name is collected during onboarding Step 1 (after signup) rather than during signup itself.

**Business Context:**
- Reduces signup friction for recruiter admins
- Allows users to search for existing companies during onboarding
- Improves user experience by deferring company name decision

---

## Three-Phase Migration Strategy

### Phase 1: Expand ✅ COMPLETE

**Status:** Deployed  
**Migration:** `20260701000001_make_org_name_nullable.sql`  
**Date:** 2026-07-01

**Changes:**
```sql
ALTER TABLE organizations 
ALTER COLUMN name DROP NOT NULL;

COMMENT ON COLUMN organizations.name IS 
  'Organization name. Can be NULL temporarily during recruiter onboarding 
   (first 24 hours after creation). Synced from SSO. Must be set during 
   onboarding Step 1.';
```

**Impact:**
- ✅ Backward compatible - existing code can still write non-null names
- ✅ New code can write null names
- ✅ No data changes (existing rows unchanged)
- ✅ Old application code continues working

**Deployment:**
- Deploy migration first
- Then deploy application code that handles null names

---

### Phase 2: Migrate (No Backfill Required)

**Status:** Not Applicable  
**Reason:** NULL values are intentional, not legacy data

**Strategy:**
Instead of backfilling, we implement:

1. **Application-Level Validation**
   - Onboarding Step 1 requires org name
   - Cannot proceed without setting name
   - Enforced in UI and backend

2. **Monitoring & Alerting**
   - Track count of orgs with null names
   - Alert if null name persists > 24 hours
   - Monitor onboarding completion rate

3. **Automated Cleanup (Optional)**
   - Background job identifies abandoned orgs (null name > 30 days)
   - Mark as inactive or delete (decision pending)

**Implementation:**

```typescript
// Application validation example
async function validateOrgName(orgId: string): Promise<boolean> {
  const org = await db.organizations.findUnique({
    where: { id: orgId },
  });
  
  if (!org.name) {
    const hoursSinceCreation = 
      (Date.now() - org.created_at.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 24) {
      // Alert: org name still null after 24 hours
      logger.warn('org_name_null_timeout', {
        orgId,
        hoursSinceCreation,
      });
    }
    
    return false;
  }
  
  return true;
}
```

**Monitoring Queries:**

```sql
-- Count orgs with null names
SELECT COUNT(*) 
FROM organizations 
WHERE name IS NULL;

-- Orgs with null names > 24 hours (needs cleanup)
SELECT id, created_at, 
       EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_old
FROM organizations 
WHERE name IS NULL 
  AND created_at < NOW() - INTERVAL '24 hours';

-- Onboarding completion rate
SELECT 
  COUNT(*) FILTER (WHERE name IS NOT NULL) * 100.0 / COUNT(*) as completion_rate
FROM organizations
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

### Phase 3: Contract (Optional - Future Enhancement)

**Status:** Not Planned  
**Reason:** Nullable names serve a valid business purpose

**If Needed in Future:**

If business requirements change and null names are no longer acceptable:

1. **Application-Level Enforcement** (Recommended)
   - Keep column nullable in database
   - Enforce non-null in application code
   - More flexible for future changes

2. **Database-Level Enforcement** (Alternative)
   - Add NOT NULL constraint back
   - Requires explicit approval (breaking change)
   - Must ensure all orgs have names first

**Migration (if Phase 3 executed):**

```sql
-- Phase 3: Make org name required (REQUIRES APPROVAL)
-- WARNING: This is a breaking change

-- Step 1: Verify no null names exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM organizations WHERE name IS NULL) THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: % rows have NULL names',
      (SELECT COUNT(*) FROM organizations WHERE name IS NULL);
  END IF;
END $$;

-- Step 2: Add constraint
ALTER TABLE organizations 
ALTER COLUMN name SET NOT NULL;

-- Step 3: Update comment
COMMENT ON COLUMN organizations.name IS 
  'Organization name. Required. Synced from SSO.';
```

---

## Data Integrity Rules

### Null Name Duration Limits

**Rule:** Organization names can be NULL for maximum 24 hours after creation.

**Enforcement:**
1. **Application Code:** Onboarding must be completed within 24 hours
2. **Monitoring:** Alert if null > 24 hours
3. **Cleanup:** Archive/delete abandoned orgs after 30 days

### Validation Timeline

```
┌─────────────┐
│   Signup    │ name = NULL
└──────┬──────┘
       │
       v
┌─────────────┐
│Email Verify │ name = NULL (OK)
└──────┬──────┘
       │
       v (< 24 hours)
┌─────────────┐
│ Onboarding  │ name = NULL (OK)
│   Step 1    │
└──────┬──────┘
       │
       v
┌─────────────┐
│ Name Set    │ name = "Acme Corp" (REQUIRED)
└─────────────┘
```

---

## Rollback Strategy

### Phase 1 Rollback (If Needed)

**Condition:** Safe if NO rows have NULL names

```sql
-- Check for null names first
SELECT COUNT(*) FROM organizations WHERE name IS NULL;

-- If count = 0, safe to rollback
ALTER TABLE organizations 
ALTER COLUMN name SET NOT NULL;

COMMENT ON COLUMN organizations.name IS 
  'Organization name. Required.';
```

**If Null Names Exist:**
1. Cannot rollback directly
2. Must set names first (use placeholder or prompt users)
3. Then apply NOT NULL constraint

---

## Monitoring & Alerting

### Metrics to Track

1. **Null Name Count**
   - Current count of orgs with null names
   - Should be < 10 at any time (typical signup volume)

2. **Null Name Duration**
   - Average time org name remains null
   - Should be < 1 hour (typical onboarding time)
   - Alert if > 24 hours

3. **Onboarding Completion Rate**
   - % of orgs that complete onboarding (set name)
   - Should be > 90%

4. **Abandoned Org Count**
   - Orgs with null names > 30 days
   - Should be cleaned up weekly

### Alert Thresholds

```yaml
alerts:
  - name: org_name_null_timeout
    condition: org.name IS NULL AND created_at < NOW() - 24 hours
    severity: warning
    action: notify_on_call

  - name: org_name_null_count_high
    condition: COUNT(orgs with null names) > 50
    severity: warning
    action: notify_team

  - name: onboarding_completion_low
    condition: completion_rate < 80%
    severity: critical
    action: notify_product_team
```

---

## Testing Strategy

### Unit Tests
- ✅ Org can be created with null name
- ✅ Org can be created with non-null name
- ✅ Onboarding validates name is set
- ✅ API rejects operations requiring name when null

### Integration Tests
- ✅ Signup flow creates org with null name
- ✅ Onboarding Step 1 sets org name
- ✅ Cannot proceed past Step 1 without name
- ✅ Dashboard requires org name

### E2E Tests
- ✅ Complete signup → onboarding → dashboard flow
- ✅ Verify name set before dashboard access
- ✅ Verify null name rejection for core features

---

## Related Documentation

- **ADR:** `ADR-042: Allow Null Organization Names During Onboarding`
- **Migration:** `supabase/migrations/20260701000001_make_org_name_nullable.sql`
- **Architecture:** `.kiro/architecture/RECRUITER_ONBOARDING_FLOW_ARCHITECTURE.md`
- **Steering File:** `04-database-api-standards.md` Section 11.2

---

## Success Criteria

### Phase 1 (Complete)
- ✅ Migration deployed without errors
- ✅ Application code handles null names
- ✅ No production incidents

### Phase 2 (Ongoing)
- ✅ Onboarding completion rate > 90%
- ✅ Average null name duration < 1 hour
- ✅ No orgs with null names > 24 hours
- ✅ Monitoring alerts working

### Phase 3 (Not Planned)
- N/A - Null names serve valid business purpose

---

## Change Log

- **2026-07-01:** Phase 1 migration deployed
- **2026-07-17:** Documentation created (this plan)
- **Future:** Phase 2 monitoring implementation
- **Future:** Phase 3 decision (if needed)

