# ADR-042: Allow Null Organization Names During Onboarding

**Status:** Accepted  
**Date:** 2026-07-01  
**Deciders:** Development Team  
**Related:** Migration `20260701000001_make_org_name_nullable.sql`

---

## Context

### Problem Statement

Previously, recruiter admins were required to provide their organization name during signup. This created several user experience issues:

1. **Decision Paralysis:** Users didn't know if their company already existed in the system
2. **Signup Friction:** Requiring company name added cognitive load during signup
3. **Name Conflicts:** Users would create duplicate organizations unknowingly
4. **Poor UX Flow:** Signup form was too long and intimidating

### User Flow Before

```
┌─────────────────────────┐
│ Signup Form             │
│ - Email                 │
│ - Password              │
│ - Company Name (❌ Required) │ ← Blocking issue
└─────────────────────────┘
           │
           v
┌─────────────────────────┐
│ Email Verification      │
└─────────────────────────┘
           │
           v
┌─────────────────────────┐
│ Dashboard               │
└─────────────────────────┘
```

**Issues:**
- User must decide company name immediately
- Cannot search for existing companies first
- May create duplicate organizations
- High abandonment rate at signup

---

## Decision

**We will allow `organizations.name` to be NULL temporarily during recruiter signup.**

### New User Flow

```
┌─────────────────────────┐
│ Signup Form             │
│ - Email                 │
│ - Password              │  ← Simplified!
└─────────────────────────┘
           │
           v (org.name = NULL)
┌─────────────────────────┐
│ Email Verification      │
└─────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│ Onboarding Step 1: Company Info     │
│ - Search existing companies         │ ← New!
│ - Create new company                │
│ - Set company name (REQUIRED)       │
└─────────────────────────────────────┘
           │
           v (org.name = "Acme Corp")
┌─────────────────────────┐
│ Complete Onboarding     │
│ (Steps 2-4)             │
└─────────────────────────┘
           │
           v
┌─────────────────────────┐
│ Dashboard               │
└─────────────────────────┘
```

### Implementation Details

1. **Database Change:**
   - Make `organizations.name` column nullable
   - Add comment documenting temporary NULL state

2. **Application Logic:**
   - Signup creates org with NULL name
   - Onboarding Step 1 requires name (enforced in UI and backend)
   - Dashboard access blocked until name is set

3. **Data Integrity:**
   - NULL names allowed for maximum 24 hours
   - Monitoring alerts for overdue nulls
   - Cleanup job for abandoned orgs (> 30 days)

---

## Alternatives Considered

### Alternative 1: Keep Existing Flow (Rejected)

**Pros:**
- No database changes needed
- Simpler data model
- No temporary inconsistent state

**Cons:**
- ❌ Poor user experience (decision paralysis)
- ❌ Cannot search existing companies
- ❌ High abandonment rate
- ❌ Duplicate organizations created

**Decision:** Rejected due to poor UX

---

### Alternative 2: Use Placeholder Names (Rejected)

**Description:** Generate placeholder names like "Organization-123" during signup, replace in Step 1.

**Pros:**
- No nullable column needed
- Simpler database constraints

**Cons:**
- ❌ Placeholder names visible in logs/admin tools
- ❌ Must track which names are placeholders
- ❌ Cleanup complexity (finding all placeholders)
- ❌ Risk of placeholder names leaking to UI

**Decision:** Rejected due to data cleanliness concerns

---

### Alternative 3: Defer Org Creation Until Step 1 (Rejected)

**Description:** Don't create organization during signup. Create it in onboarding Step 1.

**Pros:**
- No nullable column needed
- Org always has name when created

**Cons:**
- ❌ Complicates authentication flow (user without org?)
- ❌ SSO Worker expects org at signup
- ❌ Breaks assumption: user always belongs to org
- ❌ Requires significant auth refactoring

**Decision:** Rejected due to auth complexity

---

### Alternative 4: Allow NULL Names (Selected ✅)

**Description:** Make column nullable, enforce name in application logic.

**Pros:**
- ✅ Minimal database changes
- ✅ Clean separation of signup and onboarding
- ✅ Users can search for existing companies
- ✅ Better UX (progressive disclosure)
- ✅ Flexible for future changes

**Cons:**
- ⚠️ Temporary data inconsistency (< 24 hours)
- ⚠️ Must validate at application level
- ⚠️ Need monitoring for abandoned orgs

**Decision:** Selected - Best balance of UX and implementation complexity

---

## Consequences

### Positive Consequences

1. **Improved User Experience**
   - Simplified signup form (less intimidating)
   - Users can search for existing companies
   - Reduced decision paralysis
   - Lower abandonment rate (expected)

2. **Reduced Duplicate Organizations**
   - Users can verify company doesn't exist
   - Search functionality in Step 1
   - Better data quality

3. **Cleaner Separation of Concerns**
   - Signup handles authentication only
   - Onboarding handles profile setup
   - Each step focused on one goal

4. **Flexible Architecture**
   - Easy to add more onboarding steps
   - Can defer other fields similarly
   - Progressive disclosure pattern established

---

### Negative Consequences

1. **Temporary Data Inconsistency**
   - Organizations can have NULL names (< 24 hours)
   - Must handle NULL in all queries
   - Need defensive coding

2. **Application-Level Validation Required**
   - Cannot rely on database constraint
   - Must enforce in multiple places
   - Risk of validation gaps

3. **Monitoring Overhead**
   - Need alerts for overdue NULL names
   - Track onboarding completion rate
   - Monitor abandoned organizations

4. **Cleanup Required**
   - Abandoned orgs (never completed onboarding)
   - Need periodic cleanup job
   - Determine retention policy

---

### Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Null names persist indefinitely | High | Low | Alert after 24h, cleanup after 30 days |
| Queries break on NULL names | Medium | Low | Defensive coding, WHERE name IS NOT NULL |
| Users abandon onboarding | Medium | Medium | Track completion rate, improve UX |
| Duplicate names after migration | Low | Low | Add unique constraint (separate migration) |

---

## Implementation

### Migration

```sql
-- Phase 1: Make column nullable
ALTER TABLE organizations 
ALTER COLUMN name DROP NOT NULL;

COMMENT ON COLUMN organizations.name IS 
  'Organization name. Can be NULL temporarily during recruiter onboarding 
   (first 24 hours after creation). Synced from SSO. Must be set during 
   onboarding Step 1.';
```

**File:** `supabase/migrations/20260701000001_make_org_name_nullable.sql`

---

### Application Validation

```typescript
// Onboarding Step 1 validation
export async function validateCompanyInfo(data: CompanyInfoForm) {
  const errors: ValidationError[] = [];

  if (!data.companyName || data.companyName.trim().length === 0) {
    errors.push({
      field: 'companyName',
      message: 'Company name is required',
    });
  }

  if (data.companyName && data.companyName.length > 100) {
    errors.push({
      field: 'companyName',
      message: 'Company name must be 100 characters or less',
    });
  }

  // Check for duplicate names
  const existingOrg = await db.organizations.findFirst({
    where: {
      name: {
        equals: data.companyName,
        mode: 'insensitive', // Case-insensitive
      },
    },
  });

  if (existingOrg) {
    errors.push({
      field: 'companyName',
      message: 'An organization with this name already exists',
    });
  }

  return errors;
}
```

---

### Monitoring

```typescript
// Alert for orgs with null names > 24 hours
async function checkOverdueNullNames() {
  const overdueOrgs = await db.organizations.findMany({
    where: {
      name: null,
      created_at: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      },
    },
  });

  if (overdueOrgs.length > 0) {
    logger.warn('org_names_null_timeout', {
      count: overdueOrgs.length,
      orgIds: overdueOrgs.map(o => o.id),
    });

    // Send alert to ops team
    await alerting.send({
      severity: 'warning',
      title: 'Organizations with NULL names > 24 hours',
      message: `${overdueOrgs.length} organizations have NULL names for > 24 hours`,
      orgIds: overdueOrgs.map(o => o.id),
    });
  }
}

// Run every hour
cron.schedule('0 * * * *', checkOverdueNullNames);
```

---

## Validation

### Success Metrics

**Tracked for 30 days post-deployment:**

1. **Signup Abandonment Rate**
   - Before: ~40% (baseline)
   - Target: < 25%
   - Actual: TBD

2. **Onboarding Completion Rate**
   - Target: > 90%
   - Actual: TBD

3. **Null Name Duration**
   - Target: Average < 1 hour
   - Max: < 24 hours
   - Actual: TBD

4. **Duplicate Organizations**
   - Target: < 5% of new orgs
   - Actual: TBD

### Review Date

**2026-08-01** (30 days post-deployment)

If metrics meet targets, this decision is validated. If not, revisit alternatives.

---

## Related Documentation

- **Migration Plan:** `.kiro/plans/2026-07-17_org-name-nullable_migration-plan.md`
- **Migration File:** `supabase/migrations/20260701000001_make_org_name_nullable.sql`
- **Architecture:** `.kiro/architecture/RECRUITER_ONBOARDING_FLOW_ARCHITECTURE.md` (TBD)
- **Steering File:** `04-database-api-standards.md` Section 11.2

---

## References

- [Progressive Disclosure Pattern](https://www.nngroup.com/articles/progressive-disclosure/)
- [Signup Form Best Practices](https://www.smashingmagazine.com/2018/08/best-practices-for-mobile-form-design/)
- [Database NULL Handling](https://www.postgresql.org/docs/current/functions-comparison.html)

---

## Change Log

- **2026-07-01:** Decision made, migration deployed
- **2026-07-17:** ADR documented
- **2026-08-01:** Scheduled review date

