# RLS Testing - Quick Reference Card

## 🚀 Quick Start

```bash
# Run the test suite
cd "c:\Users\saheb\OneDrive\Desktop\Skill Passport\skillpassport"
supabase db push
```

Or in Supabase Dashboard:
1. SQL Editor → New Query
2. Paste `20260523000002_test_rls_policies.sql`
3. Run
4. Check Messages tab

---

## 📊 What Gets Tested

| Test # | What It Tests | Expected Result |
|--------|---------------|-----------------|
| 1 | Data Isolation | Users see only their org's data |
| 2 | Role Permissions | Admins can delete, recruiters cannot |
| 3 | Helper Functions | Functions return correct values |
| 4 | Cross-Org Access | Users cannot access other orgs |
| 5 | Membership Status | Inactive members lose access |
| 6 | Utility Views | Views return correct data |

---

## 🔍 Reading Test Results

### ✅ Success Pattern
```
Test 1.1: Admin from Org 1 viewing requisitions
✅ PASS: User 1 sees 2 requisitions from Org 1
```

### ❌ Failure Pattern
```
Test 1.1: Admin from Org 1 viewing requisitions
❌ FAIL: User 1 sees 5 requisitions (expected 2)
```

---

## 🛠️ Key SQL Commands

### Check if RLS is enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'requisitions';
```

### Check existing policies
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'requisitions';
```

### Test user access manually
```sql
SELECT has_recruitment_access('user-id', 'org-id');
```

### Check user's roles
```sql
SELECT get_user_org_roles('user-id', 'org-id');
```

### View user's permissions
```sql
SELECT get_user_permissions('user-id', 'org-id');
```

---

## 🧹 Cleanup Test Data

```sql
-- Remove all test data
DELETE FROM organizations WHERE name LIKE 'TEST_ORG_%';
DELETE FROM users WHERE email LIKE 'test_rls_%@example.com';
```

---

## 🐛 Common Issues

### Issue: "relation does not exist"
**Cause:** Migration not run yet  
**Fix:** Run `20260523000000_org_recruitment_dashboard.sql` first

### Issue: All tests fail
**Cause:** RLS not enabled  
**Fix:** Check if `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` ran

### Issue: User sees all data
**Cause:** RLS policy bug or organization_id is NULL  
**Fix:** Check `organization_id` column exists and has values

---

## 📈 Success Criteria

✅ **All 6 test groups pass**  
✅ **No security breaches detected**  
✅ **Helper functions work correctly**  
✅ **Views return expected data**  

---

## 🎯 Next Steps

After all tests pass:
1. Document any issues found
2. Move to Phase 2: API Layer & Services
3. Update frontend to use new membership system
4. Deploy to staging for integration testing

---

## 📞 Need Help?

- Check `TESTING_GUIDE.md` for detailed explanations
- Review `README_ORG_RECRUITMENT.md` for migration steps
- Check Supabase logs for detailed error messages
