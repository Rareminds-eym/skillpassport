# RLS Testing Guide - Explained Simply

## What is RLS (Row Level Security)?

RLS is like a bouncer at a club - it checks if you're allowed to see or modify specific rows in a database table.

**Without RLS:**
```
User A queries: SELECT * FROM requisitions;
Result: Sees ALL requisitions from ALL organizations ❌
```

**With RLS:**
```
User A queries: SELECT * FROM requisitions;
RLS Policy checks: "Is User A a member of the organization that owns this requisition?"
Result: Sees ONLY requisitions from User A's organization ✅
```

---

## How the Test Code Works

### **Step 1: Create Test Data**

```sql
-- Create 2 test organizations
Organization 1: "TEST_ORG_1"
Organization 2: "TEST_ORG_2"

-- Create 3 test users
User 1: Admin in Org 1
User 2: Recruiter in Org 1  
User 3: Recruiter in Org 2

-- Create test jobs
Job A: Belongs to Org 1
Job B: Belongs to Org 1
Job C: Belongs to Org 2
```

### **Step 2: Test Data Isolation**

```sql
-- Simulate User 1 (Admin in Org 1) querying jobs
SELECT COUNT(*) FROM requisitions 
WHERE organization_id IN (
  -- Get all orgs where User 1 has recruitment access
  SELECT org_id FROM memberships WHERE user_id = User1
);

Expected Result: 2 jobs (Job A and Job B)
Actual Result: 2 jobs ✅

-- Simulate User 3 (Recruiter in Org 2) querying jobs
SELECT COUNT(*) FROM requisitions 
WHERE organization_id IN (
  SELECT org_id FROM memberships WHERE user_id = User3
);

Expected Result: 1 job (Job C only)
Actual Result: 1 job ✅
```

**What this proves:** Users can only see data from their own organization.

### **Step 3: Test Role-Based Access**

```sql
-- Check if User 1 (Admin) can delete jobs
SELECT is_recruitment_admin(User1, Org1);
Result: TRUE ✅ (Admins can delete)

-- Check if User 2 (Recruiter) can delete jobs
SELECT is_recruitment_admin(User2, Org1);
Result: FALSE ✅ (Recruiters cannot delete)
```

**What this proves:** Different roles have different permissions.

### **Step 4: Test Cross-Organization Prevention**

```sql
-- User 2 (from Org 1) tries to create a job for Org 2
INSERT INTO requisitions (organization_id, title, ...)
VALUES (Org2_ID, 'Unauthorized Job', ...);

Result: ERROR - RLS policy violation ✅
```

**What this proves:** Users cannot create/modify data for other organizations.

### **Step 5: Test Membership Status**

```sql
-- User 2 has active membership
SELECT has_recruitment_access(User2, Org1);
Result: TRUE ✅

-- Deactivate User 2's membership
UPDATE memberships SET status = 'inactive' WHERE user_id = User2;

-- Check access again
SELECT has_recruitment_access(User2, Org1);
Result: FALSE ✅
```

**What this proves:** Inactive members lose access immediately.

---

## How to Run the Tests

### **Option 1: Using Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire content of `20260523000002_test_rls_policies.sql`
3. Click "Run"
4. Check the "Messages" tab for results

### **Option 2: Using Supabase CLI**

```bash
cd "c:\Users\saheb\OneDrive\Desktop\Skill Passport\skillpassport"
supabase db push
```

### **Option 3: Using psql**

```bash
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/20260523000002_test_rls_policies.sql
```

---

## Understanding the Test Output

### **✅ PASS Example:**
```
Test 1.1: Admin from Org 1 viewing requisitions
✅ PASS: User 1 sees 2 requisitions from Org 1
```
**Meaning:** The RLS policy correctly allows User 1 to see only their organization's data.

### **❌ FAIL Example:**
```
Test 1.1: Admin from Org 1 viewing requisitions
❌ FAIL: User 1 sees 5 requisitions (expected 2)
```
**Meaning:** The RLS policy is NOT working - User 1 can see data from other organizations (security breach!).

---

## Key Concepts Explained

### **1. Setting User Context**

```sql
PERFORM set_config('request.jwt.claims', 
  json_build_object('sub', v_user1_id)::text, true);
```

**What this does:** Tells PostgreSQL "pretend the current user is User 1"

**Why it's needed:** RLS policies use `auth.uid()` to get the current user. This simulates that.

### **2. RLS Policy Structure**

```sql
CREATE POLICY "org_members_view_requisitions"
  ON requisitions FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

**Breaking it down:**
- `ON requisitions FOR SELECT` - This policy applies when someone tries to SELECT from requisitions
- `USING (...)` - The condition that must be TRUE for the row to be visible
- `auth.uid()` - Gets the current user's ID
- The subquery checks: "Is the current user an active member of the organization that owns this requisition?"

### **3. Helper Functions**

```sql
SELECT has_recruitment_access(user_id, org_id);
```

**What it does:** Returns TRUE if the user has any recruitment role in the organization.

**How it works:**
1. Looks up the user's memberships
2. Checks if they have any roles with category = 'recruitment'
3. Verifies the membership is active
4. Returns TRUE or FALSE

---

## Common Test Scenarios

### **Scenario 1: New User Joins Organization**

```sql
-- Before: User has no access
SELECT has_recruitment_access(new_user_id, org_id);
-- Result: FALSE

-- Create membership and assign role
INSERT INTO memberships (user_id, org_id, status) 
VALUES (new_user_id, org_id, 'active');

INSERT INTO membership_roles (membership_id, role_id)
VALUES (membership_id, recruiter_role_id);

-- After: User has access
SELECT has_recruitment_access(new_user_id, org_id);
-- Result: TRUE ✅
```

### **Scenario 2: User Leaves Organization**

```sql
-- Before: User has access
SELECT has_recruitment_access(user_id, org_id);
-- Result: TRUE

-- Deactivate membership
UPDATE memberships SET status = 'inactive' 
WHERE user_id = user_id AND org_id = org_id;

-- After: User loses access
SELECT has_recruitment_access(user_id, org_id);
-- Result: FALSE ✅
```

### **Scenario 3: Role Change**

```sql
-- Before: User is recruiter (cannot delete)
SELECT is_recruitment_admin(user_id, org_id);
-- Result: FALSE

-- Change role to admin
DELETE FROM membership_roles WHERE membership_id = membership_id;
INSERT INTO membership_roles (membership_id, role_id)
VALUES (membership_id, admin_role_id);

-- After: User is admin (can delete)
SELECT is_recruitment_admin(user_id, org_id);
-- Result: TRUE ✅
```

---

## Troubleshooting

### **Problem: All tests fail**

**Possible causes:**
1. Migration not run yet
2. RLS policies not created
3. Test data not created properly

**Solution:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('requisitions', 'opportunities', 'pipeline_candidates');
-- Should show rowsecurity = true

-- Check if policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('requisitions', 'opportunities', 'pipeline_candidates');
-- Should show multiple policies
```

### **Problem: User can see other org's data**

**Possible causes:**
1. RLS policy has a bug
2. User has multiple memberships
3. organization_id is NULL

**Solution:**
```sql
-- Check user's memberships
SELECT * FROM memberships WHERE user_id = 'user-id';

-- Check if data has organization_id
SELECT id, organization_id FROM requisitions WHERE organization_id IS NULL;
```

### **Problem: User cannot see their own org's data**

**Possible causes:**
1. Membership is inactive
2. User has no recruitment role
3. RLS policy is too restrictive

**Solution:**
```sql
-- Check membership status
SELECT * FROM memberships 
WHERE user_id = 'user-id' AND org_id = 'org-id';

-- Check user's roles
SELECT * FROM user_memberships_with_roles 
WHERE user_id = 'user-id';
```

---

## Manual Testing (Without Script)

If you want to test manually:

```sql
-- 1. Create a test user
INSERT INTO users (id, email, "firstName", "lastName", role)
VALUES (gen_random_uuid(), 'test@example.com', 'Test', 'User', 'recruiter');

-- 2. Get the user ID
SELECT id FROM users WHERE email = 'test@example.com';
-- Copy this ID

-- 3. Create a membership
INSERT INTO memberships (user_id, org_id, status)
VALUES ('user-id-from-step-2', 'your-org-id', 'active');

-- 4. Assign a role
INSERT INTO membership_roles (membership_id, role_id)
SELECT m.id, r.id
FROM memberships m, roles r
WHERE m.user_id = 'user-id-from-step-2'
  AND r.name = 'recruiter';

-- 5. Test access
SELECT has_recruitment_access('user-id-from-step-2', 'your-org-id');
-- Should return TRUE

-- 6. Try to query requisitions
SELECT COUNT(*) FROM requisitions
WHERE organization_id IN (
  SELECT org_id FROM memberships 
  WHERE user_id = 'user-id-from-step-2'
);
-- Should return count of requisitions in that org
```

---

## Next Steps After Testing

1. ✅ All tests pass → Move to Phase 2 (API Layer)
2. ❌ Some tests fail → Debug RLS policies
3. 📝 Document any issues found
4. 🔄 Re-run tests after fixes

---

## Summary

**What we're testing:**
- ✅ Users can only see their organization's data
- ✅ Admins have more permissions than recruiters
- ✅ Users cannot access other organizations' data
- ✅ Inactive members lose access
- ✅ Helper functions work correctly

**Why it matters:**
- Prevents data leaks between organizations
- Ensures proper role-based access control
- Validates security before going to production

**How long it takes:**
- Running the test script: ~5 seconds
- Reviewing results: ~2 minutes
- Fixing issues (if any): Varies
