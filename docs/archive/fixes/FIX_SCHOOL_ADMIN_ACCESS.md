# Fix School Admin Access Issue

## Problem
School Admin users are seeing "Access Denied" when trying to access Teacher Onboarding, even though they should have full permissions.

## Root Cause
The `useUserRole` hook is not finding the user's role in the database, so it defaults to `subject_teacher` which has no permissions.

---

## Solution Steps

### Step 1: Check Current Role in Database

Open your browser console and look for these debug messages:
- "Current role: [role_name]"
- "Current permissions: {...}"

Or use the Role Debugger widget that now appears on the Access Denied screen.

### Step 2: Set School Admin Role in Database

Run ONE of these SQL commands based on your setup:

#### Option A: If using `school_educators` table
```sql
-- Set role for specific user by email
UPDATE school_educators 
SET role = 'school_admin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@school.com'
);

-- OR set role for ALL school educators (if they don't have roles yet)
UPDATE school_educators 
SET role = 'school_admin' 
WHERE role IS NULL;
```

#### Option B: If using `teachers` table
```sql
-- Set role for specific user by email
UPDATE teachers 
SET role = 'school_admin' 
WHERE email = 'your-email@school.com';
```

#### Option C: Set in user metadata (Supabase Dashboard)
1. Go to Supabase Dashboard → Authentication → Users
2. Find your user
3. Click on the user
4. In "User Metadata" section, add:
   ```json
   {
     "role": "school_admin"
   }
   ```
5. Save

### Step 3: Verify the Change

Run this query to verify:
```sql
-- Check school_educators table
SELECT 
  se.id,
  u.email,
  se.role,
  s.name as school_name
FROM school_educators se
JOIN auth.users u ON u.id = se.user_id
JOIN schools s ON s.id = se.school_id
WHERE u.email = 'your-email@school.com';

-- Check teachers table
SELECT email, role FROM teachers WHERE email = 'your-email@school.com';
```

### Step 4: Clear Cache and Reload

1. Open browser DevTools (F12)
2. Go to Application tab → Storage → Clear site data
3. Or just do a hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Log out and log back in

---

## Quick Fix (Temporary)

If you need immediate access without database changes, the system will automatically grant `school_admin` permissions to anyone accessing `/school-admin` or `/admin/schoolAdmin` routes.

This is a fallback mechanism for backward compatibility.

---

## Debugging Tools

### 1. Role Debugger Widget
- Appears on the Access Denied screen
- Shows:
  - Current detected role
  - Permissions
  - User email
  - Role from each table
  - Current URL path

### 2. Browser Console Logs
Open DevTools Console (F12) and look for:
```
Current role: school_admin
Current permissions: { add_teacher: "C/A", ... }
```

If you see:
```
No role found, defaulting to subject_teacher
```
Then the role is not set in the database.

### 3. Manual Check
Run this in browser console:
```javascript
// Check current user
const { data } = await supabase.auth.getUser();
console.log('User:', data.user.email);
console.log('Metadata:', data.user.user_metadata);

// Check teachers table
const { data: teacher } = await supabase
  .from('teachers')
  .select('role')
  .eq('email', data.user.email)
  .single();
console.log('Teacher role:', teacher?.role);

// Check school_educators table
const { data: educator } = await supabase
  .from('school_educators')
  .select('role')
  .eq('user_id', data.user.id)
  .single();
console.log('Educator role:', educator?.role);
```

---

## Expected Behavior After Fix

✅ School Admin should see:
- Teacher Onboarding page (not Access Denied)
- "Create & Approve" button (can approve immediately)
- Can select all role types including School Admin, Principal, IT Admin
- Role badge showing "School Admin (Can Create & Approve)"

✅ In Teacher List:
- School Admin role shows with indigo badge
- Can view all teachers

✅ In Timetable:
- Full edit access
- Can add and delete slots
- No "View Only Mode" badge

---

## Permanent Fix Checklist

- [ ] Run database migration: `role_based_permissions.sql`
- [ ] Set role in database for your user
- [ ] Verify role is set correctly
- [ ] Clear browser cache
- [ ] Log out and log back in
- [ ] Test Teacher Onboarding access
- [ ] Test Timetable access
- [ ] Remove RoleDebugger component (optional, for production)

---

## Files Modified

1. ✅ `src/hooks/useUserRole.ts` - Added fallback logic for school admin routes
2. ✅ `src/components/debug/RoleDebugger.tsx` - Debug widget
3. ✅ `src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx` - Shows debugger
4. ✅ `supabase/migrations/role_based_permissions.sql` - Database schema
5. ✅ `set-school-admin-role.sql` - Helper script

---

## Common Issues

### Issue 1: "No role found" in console
**Solution:** Role is not set in database. Run SQL from Step 2.

### Issue 2: Still Access Denied after setting role
**Solution:** Clear cache and log out/in. The hook caches the role.

### Issue 3: Role shows as "subject_teacher" in debugger
**Solution:** Database query is failing. Check:
- Table exists: `school_educators` or `teachers`
- Column exists: `role`
- User email matches exactly

### Issue 4: RLS policy blocking query
**Solution:** Check RLS policies allow SELECT on role column:
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'school_educators';

-- Temporarily disable RLS for testing (NOT for production)
ALTER TABLE school_educators DISABLE ROW LEVEL SECURITY;
```

---

## Production Cleanup

After fixing the issue, you can remove the debug tools:

1. Remove `<RoleDebugger />` from TeacherOnboarding.tsx
2. Remove console.log statements from useUserRole.ts
3. Delete `src/components/debug/RoleDebugger.tsx` (optional)

---

## Support

If issue persists:
1. Check browser console for errors
2. Check Supabase logs for query errors
3. Verify migration was applied successfully
4. Check RLS policies are not blocking queries

**Quick Test:**
```sql
-- This should return 'school_admin'
SELECT get_user_role('your-user-uuid');
```
