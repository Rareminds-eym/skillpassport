# 🔒 Recruiter API Security Guide

## Overview

All recruiter endpoints now have **automatic organization-level isolation** via middleware. Every request is scoped to the authenticated user's organization.

---

## How It Works

### 1. **Middleware (_middleware.ts)**

The middleware automatically:
- ✅ Validates user authentication (via `withAuth`)
- ✅ Fetches user's `organization_id` from `organization_members` table
- ✅ Injects `organizationId` into `context.data`
- ✅ Returns 403 if user has no organization

### 2. **Handlers (actions.ts, etc.)**

All handlers can access the organization ID:

```typescript
const organizationId = (context.data as any).organizationId;
```

---

## Usage in Actions

### ✅ **Correct Pattern (Using Middleware Context)**

```typescript
if (action === 'list-opportunities') {
  // Get organization_id from context (injected by middleware)
  const organizationId = (context.data as any).organizationId;
  
  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('organization_id', organizationId); // 🔒 Filter by org
    
  const { data, error } = await query;
  return apiSuccess(data, context.request);
}
```

### ✅ **Creating Records**

```typescript
if (action === 'create-requisition') {
  const organizationId = (context.data as any).organizationId;
  
  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      ...requisitionData,
      organization_id: organizationId // 🔒 Auto-set from context
    });
}
```

### ✅ **Updating/Deleting Records**

```typescript
if (action === 'update-requisition') {
  const organizationId = (context.data as any).organizationId;
  
  const { data, error } = await supabase
    .from('opportunities')
    .update({ ...updates })
    .eq('id', id)
    .eq('organization_id', organizationId); // 🔒 Verify ownership
}
```

### ❌ **Incorrect Pattern (Manual Lookup - DEPRECATED)**

```typescript
// DON'T DO THIS ANYMORE - Middleware handles it
const { data: memberData } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .single();
```

---

## Actions Status

### ✅ **Secured Actions**
- `list-opportunities` - Filters by organization
- `create-requisition` - Sets organization_id
- `update-requisition` - Verifies organization ownership
- `delete-requisition` - Verifies organization ownership

### ⚠️ **Actions That Need Organization Filtering**

The following actions still need to be updated to use `organizationId` from context:

#### **High Priority (Access to Sensitive Data)**
1. **`list-interviews`** - Shows interview data
   ```typescript
   .eq('organization_id', organizationId)
   ```

2. **`update-interview`** - Modifies interview data
   ```typescript
   .eq('id', id).eq('organization_id', organizationId)
   ```

3. **`get-applications-by-opportunity`** - Shows applications
   - First verify the opportunity belongs to user's org
   ```typescript
   // Step 1: Verify opportunity ownership
   const { data: opp } = await supabase
     .from('opportunities')
     .select('id')
     .eq('id', opportunityId)
     .eq('organization_id', organizationId)
     .single();
   
   if (!opp) return apiError(404, 'NOT_FOUND', 'Opportunity not found');
   
   // Step 2: Then fetch applications
   const { data } = await supabase
     .from('applied_jobs')
     .select('*')
     .eq('opportunity_id', opportunityId);
   ```

4. **`create/update/delete-opportunity`** - Opportunity management
   ```typescript
   .eq('organization_id', organizationId)
   ```

#### **Medium Priority (Metadata/Filtering)**
5. **`fetch-departments`** - Filter departments by org's opportunities
   ```typescript
   const { data } = await supabase
     .from('opportunities')
     .select('department')
     .eq('organization_id', organizationId)
     .not('department', 'is', null);
   ```

6. **`fetch-locations`** - Filter locations by org's opportunities
   ```typescript
   const { data } = await supabase
     .from('opportunities')
     .select('location')
     .eq('organization_id', organizationId)
     .not('location', 'is', null);
   ```

7. **`list-recruiters`** - Filter recruiters by organization
   ```typescript
   const { data } = await supabase
     .from('organization_members')
     .select('user_id, users(*), recruiters(*)')
     .eq('organization_id', organizationId)
     .not('recruiters', 'is', null);
   ```

8. **`fetch-shortlist-tags`** - Filter tags by org's shortlists
   ```typescript
   const { data } = await supabase
     .from('shortlists')
     .select('tags')
     .eq('organization_id', organizationId)
     .not('tags', 'is', null);
   ```

9. **`fetch-shortlist-creators`** - Filter by org's shortlists
   ```typescript
   const { data } = await supabase
     .from('shortlists')
     .select('created_by')
     .eq('organization_id', organizationId);
   ```

#### **Lower Priority (May Not Need Org Filtering)**
- `list-learners` - Depends on whether learners are org-specific
- `get-learner` - Public learner profiles
- `get-recruiter-profile` - May be cross-org for collaboration

---

## Testing

### 1. **Create Two Organizations**
- Sign up as Company A owner
- Sign up as Company B owner

### 2. **Create Test Data**
- Company A: Create requisitions, interviews, shortlists
- Company B: Create requisitions, interviews, shortlists

### 3. **Verify Isolation**
- Login as Company A recruiter
- ✅ Should ONLY see Company A's data
- ❌ Should NOT see Company B's data

### 4. **Test Cross-Org Access Attempts**
Try to:
- Update Company B's requisition using Company A's session → Should fail
- Delete Company B's interview using Company A's session → Should fail
- View Company B's applications using Company A's session → Should fail

---

## Security Checklist

When adding a new recruiter action:

- [ ] Does it query organization-specific data? (opportunities, interviews, etc.)
- [ ] Add `.eq('organization_id', organizationId)` to SELECT queries
- [ ] Add `organization_id: organizationId` to INSERT queries
- [ ] Add `.eq('organization_id', organizationId)` to UPDATE/DELETE queries
- [ ] Test with multiple organizations to verify isolation
- [ ] Document the action in this guide

---

## Benefits of Middleware Approach

✅ **Automatic** - All endpoints get organization context  
✅ **DRY** - No repetitive organization lookup code  
✅ **Consistent** - Single source of truth for organization context  
✅ **Secure by Default** - Fails closed if organization not found  
✅ **Performance** - Organization lookup happens once per request  
✅ **Maintainable** - Easy to audit and update security logic  

---

## Migration Guide

### Before (Manual Lookup)
```typescript
const { data: memberData } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .single();

if (!memberData) return apiError(403, 'Forbidden');
const orgId = memberData.organization_id;
```

### After (Middleware Context)
```typescript
const organizationId = (context.data as any).organizationId;
```

**Result:** 7 lines → 1 line, faster, cleaner, more secure!

---

## Future Enhancements

Consider adding TypeScript types for better safety:

```typescript
// In lib/types.ts
export interface RecruiterContext extends AuthenticatedContext {
  data: AuthenticatedContext['data'] & {
    organizationId: string;
  };
}

// Then in actions.ts
const onRequestPost = withAuth(async (context: RecruiterContext) => {
  const organizationId = context.data.organizationId; // ✅ Type-safe!
});
```

---

## Support

Questions? Security concerns? Contact the backend team or create a ticket.

**Last Updated:** $(date)  
**Maintained By:** Backend Security Team
