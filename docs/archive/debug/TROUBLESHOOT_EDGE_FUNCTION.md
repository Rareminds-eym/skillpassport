# 🔧 Troubleshooting: "Unable to connect to server" Error

## Error Message:
```
Unable to connect to server. Please try again.
```

This error occurs when the Edge Function fails to execute. Let's diagnose and fix it!

---

## 🔍 Step 1: Check Edge Function Deployment

### Verify in Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/dpooleduinyyzxgrcwko/functions
2. Check if `create-student` is listed
3. Check if status is "Active" (green)
4. Click on the function to see logs

### Re-deploy if needed:

```bash
supabase functions deploy create-student
```

---

## 🔍 Step 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try adding a student again
4. Look for error messages

**Common errors:**

### Error: "FunctionsRelayError: Edge Function returned a non-2xx status code"
**Solution:** Check Edge Function logs in Supabase Dashboard

### Error: "Failed to fetch" or "Network error"
**Solution:** Check internet connection and Supabase URL

### Error: "JWT expired" or "Invalid JWT"
**Solution:** Logout and login again

---

## 🔍 Step 3: Check Edge Function Logs

1. Go to Supabase Dashboard
2. Navigate to: Edge Functions → create-student → Logs
3. Look for recent errors

**Common log errors:**

### "Unauthorized: Please login to add students"
**Solution:** Make sure you're logged in as school admin

### "School ID not found"
**Solution:** Your user account is not linked to a school

### "Email already exists"
**Solution:** The email is already in use

### "Failed to create authentication account"
**Solution:** Service role key issue or Supabase Auth problem

---

## 🔍 Step 4: Verify Environment Variables

Edge Functions need these environment variables (automatically set by Supabase):

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Check in Dashboard:
1. Go to: Project Settings → Edge Functions
2. Verify environment variables are set

---

## 🔍 Step 5: Test with Script

Run the test script to diagnose:

```bash
# Update the script with your admin credentials first
node test-create-student-function.js
```

This will show you the exact error message.

---

## 🔧 Common Fixes

### Fix 1: Re-deploy Edge Function

```bash
supabase functions deploy create-student
```

### Fix 2: Check Service Role Key

1. Go to: Project Settings → API
2. Copy the `service_role` key (secret)
3. Verify it's set in Edge Functions environment

### Fix 3: Clear Browser Cache

1. Clear browser cache
2. Logout and login again
3. Try adding student again

### Fix 4: Check RLS Policies

The Edge Function uses service role key which bypasses RLS, but check:

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'students');

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'students');
```

---

## 🐛 Debug Mode

I've updated the modal to show actual error messages. Now when you try to add a student:

1. Open browser console (F12)
2. Try adding a student
3. Check console for detailed error
4. Share the error message for specific help

---

## 📞 Get Specific Help

If still not working, check:

1. **Browser Console** - What's the exact error?
2. **Edge Function Logs** - Any errors in Supabase Dashboard?
3. **Network Tab** - Is the request reaching the server?

Share these details and I can provide specific fix!

---

## ✅ Quick Checklist

- [ ] Edge Function deployed: `supabase functions deploy create-student`
- [ ] Function shows as "Active" in dashboard
- [ ] Logged in as school admin
- [ ] Browser console shows detailed error
- [ ] Edge Function logs checked
- [ ] Internet connection working
- [ ] Supabase project is active

---

## 🚀 Alternative: Direct Database Insert

If Edge Function continues to fail, we can temporarily use direct database insert:

```typescript
// Temporary workaround (not recommended for production)
const { data: student, error } = await supabase
  .from('students')
  .insert({
    email: formData.email,
    profile: {
      name: formData.name,
      contactNumber: formData.contactNumber,
      // ... other fields
    }
  })
```

But this won't create auth.users or public.users records!

---

## 📝 Next Steps

1. Try adding a student again
2. Check browser console for the new detailed error
3. Check Edge Function logs in Supabase Dashboard
4. Share the error message for specific help

The updated modal will now show you the exact error instead of the generic message!
