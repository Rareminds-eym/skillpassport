# 🔧 Fix: Edge Function 400 Error

## Error:
```
Edge Function returned a non-2xx status code (400)
```

## Root Cause:
The Edge Function can't find your **school ID**. This happens when your admin user account is not properly linked to a school.

---

## 🎯 Quick Diagnosis

Run this script to check your account:

```bash
node check-current-user-school.js
```

This will tell you if your account has a school ID or not.

---

## 🔧 Solution 1: Check What You See in Console

**Try adding a student again** and check the browser console. You should now see a more detailed error message like:

- "School ID not found. Please ensure you are logged in as a school admin."
- "Unauthorized: Please login to add students"
- "A user with email xxx already exists"

Share that message and I can give you a specific fix!

---

## 🔧 Solution 2: Link Your Account to a School

Your admin account needs to be linked to a school in one of these ways:

### Option A: Update public.users table

```sql
-- Find your user ID first
SELECT id, email, role, "organizationId" 
FROM public.users 
WHERE email = 'your-email@example.com';

-- Update with your school ID
UPDATE public.users 
SET "organizationId" = 'YOUR_SCHOOL_UUID_HERE'
WHERE email = 'your-email@example.com';
```

### Option B: Add to school_educators table

```sql
-- Insert a record linking you to a school
INSERT INTO public.school_educators (
  user_id,
  school_id,
  email,
  first_name,
  last_name,
  role
) VALUES (
  'YOUR_USER_ID',
  'YOUR_SCHOOL_ID',
  'your-email@example.com',
  'Your',
  'Name',
  'school_admin'
);
```

### Option C: Update schools table

```sql
-- Add your email to the schools table
UPDATE public.schools 
SET email = 'your-email@example.com'
-- OR principal_email = 'your-email@example.com'
WHERE id = 'YOUR_SCHOOL_ID';
```

---

## 🔍 How to Find Your School ID

```sql
-- List all schools
SELECT id, name, email, principal_email 
FROM public.schools;

-- Find schools you might be associated with
SELECT * FROM public.schools 
WHERE email LIKE '%your-domain.com%' 
OR principal_email LIKE '%your-domain.com%';
```

---

## ✅ After Fixing

1. **Logout** from your app
2. **Login** again
3. **Try adding a student** - should work now!

---

## 🐛 Still Not Working?

Try adding a student again and check the console. The error message should now be more specific. Share it and I'll help!

---

## 📝 Quick Test

After linking your account to a school, test with this:

```javascript
// In browser console
const { data } = await supabase.from('users').select('organizationId').eq('id', (await supabase.auth.getUser()).data.user.id).single()
console.log('My School ID:', data.organizationId)
```

If it shows a UUID, you're good to go!
