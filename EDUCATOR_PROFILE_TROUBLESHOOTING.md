# Educator Profile Troubleshooting Guide

## Issue: Profile shows default values instead of educator data

### 🚨 CRITICAL ISSUE IDENTIFIED: Table Mismatch

**Root Cause**: Your codebase has two different educator table structures:
- `educators` table (old structure) - used by `src/services/educatorProfile.js`
- `school_educators` table (new structure) - used by `src/pages/educator/Profile.tsx`

**The Fix**: Update your service file to use the correct `school_educators` table.

### IMMEDIATE FIX: Update Educator Service

**File to update**: `src/services/educatorProfile.js`

Replace the entire file content with this corrected version:

```javascript
import { supabase } from "../lib/supabaseClient";

// ✅ Get educator by email from school_educators table
export async function getEducatorByEmail(email) {
  try {
    const { data, error } = await supabase
      .from("school_educators")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error:", error);
      return { success: false, error: error.message };    
    }

    if (!data) {
      return { success: false, error: "No educator account found with this email. Please check your email or contact support." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return { success: false, error: err.message };
  }
}

// ✅ Login educator (ignores password, only checks email)
export async function loginEducator(email, password) {
  const result = await getEducatorByEmail(email);

  if (!result.success) {
    return result;
  }

  const educator = result.data;

  return {
    success: true,
    data: {
      id: educator.id,
      name: educator.first_name && educator.last_name 
        ? `${educator.first_name} ${educator.last_name}`
        : educator.first_name || "Educator",
      email: educator.email,
      school_id: educator.school_id,
      specialization: educator.specialization,
      qualification: educator.qualification,
      experience_years: educator.experience_years,
      designation: educator.designation,
      department: educator.department,
      verification_status: educator.verification_status || "Pending",
      account_status: educator.account_status || "active",
    },
  };
}

// ✅ Create new educator profile (for signup)
export async function createEducatorProfile(educatorData) {
  try {
    const { data, error } = await supabase
      .from("school_educators")
      .insert([
        {
          first_name: educatorData.first_name,
          last_name: educatorData.last_name,
          email: educatorData.email,
          phone_number: educatorData.phone_number,
          specialization: educatorData.specialization,
          qualification: educatorData.qualification,
          experience_years: educatorData.experience_years,
          designation: educatorData.designation,
          department: educatorData.department,
          school_id: educatorData.school_id, // Required field
          user_id: educatorData.user_id, // Required field
          account_status: "active",
          verification_status: "Pending",
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase error creating educator:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        specialization: data.specialization,
        qualification: data.qualification,
        verification_status: data.verification_status,
        account_status: data.account_status,
      },
    };
  } catch (err) {
    console.error("❌ Unexpected error creating educator:", err);
    return { success: false, error: err.message };
  }
}
```

### Step 1: Check Browser Console Logs

1. Open your browser DevTools (F12)
2. Go to Console tab
3. Look for the "=== EDUCATOR PROFILE DEBUG ===" section
4. Check these values:
   - **User ID**: Should show a UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
   - **Educator data**: Should show an object with educator fields, NOT null
   - **Educator error**: Should be null or undefined

### Step 2: Verify Data in Database

Run this SQL in Supabase SQL Editor to check if educator data exists:

```sql
-- Check if educator record exists for your user
SELECT * FROM public.school_educators 
WHERE user_id = 'YOUR_USER_ID'
LIMIT 1;
```

**Expected Result**: Should return a row with educator data

**If no rows returned**: The educator profile doesn't exist in the database

### Step 3: Common Issues & Solutions

#### Issue A: Educator data is NULL in console

**Cause**: No educator record in `school_educators` table for this user

**Solution**: Create an educator record:

```sql
-- First, get your user ID
SELECT id, email FROM auth.users WHERE email = 'karthikeyan@rareminds.in';

-- Then insert educator record (replace USER_ID and SCHOOL_ID)
INSERT INTO public.school_educators (
  user_id,
  school_id,
  first_name,
  last_name,
  email,
  phone_number,
  specialization,
  qualification,
  experience_years,
  designation,
  department,
  date_of_joining,
  account_status,
  verification_status
) VALUES (
  'USER_ID_FROM_ABOVE',
  'SCHOOL_ID',
  'Karthikeyan',
  'Kumar',
  'karthikeyan@rareminds.in',
  '+91-9876543210',
  'Computer Science',
  'M.Tech Computer Science',
  5,
  'Senior Educator',
  'Computer Science Department',
  '2020-01-15',
  'active',
  'Verified'
);
```

#### Issue B: Educator error in console

**Cause**: RLS policy blocking access or table doesn't exist

**Solution**: 

1. Check if table exists:
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'school_educators'
);
```

2. Check RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'school_educators';
```

3. If RLS is blocking, disable temporarily to test:
```sql
ALTER TABLE public.school_educators DISABLE ROW LEVEL SECURITY;
```

#### Issue C: User ID mismatch

**Cause**: Auth user ID doesn't match educator user_id

**Solution**: Verify the IDs match:

```sql
-- Check auth user
SELECT id, email FROM auth.users 
WHERE email = 'karthikeyan@rareminds.in';

-- Check educator record
SELECT user_id, email FROM public.school_educators 
WHERE email = 'karthikeyan@rareminds.in';

-- They should be the same!
```

### Step 4: Verify RLS Policies

If you have RLS enabled, make sure policies allow reading:

```sql
-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'school_educators';

-- If RLS is on, verify policies exist
SELECT policyname, permissive, roles, qual 
FROM pg_policies 
WHERE tablename = 'school_educators' 
AND cmd = 'SELECT';
```

**Expected policies**:
- "Users can view their own educator profile" - allows SELECT where auth.uid() = user_id
- "School admins can view educators in their school" - allows SELECT for school admins

### Step 5: Test with Direct Query

Run this in Supabase SQL Editor to test:

```sql
-- Test 1: Check if table has data
SELECT COUNT(*) FROM public.school_educators;

-- Test 2: Check specific user's data
SELECT * FROM public.school_educators 
WHERE user_id = 'YOUR_USER_ID';

-- Test 3: Check if RLS is blocking
SELECT * FROM public.school_educators 
WHERE user_id = 'YOUR_USER_ID'
LIMIT 1;
```

### Step 6: Check Supabase Client Configuration

Verify your Supabase client is correctly configured:

**File**: `src/lib/supabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Check**: 
- `VITE_SUPABASE_URL` is set in `.env.local`
- `VITE_SUPABASE_ANON_KEY` is set in `.env.local`
- Values are correct from Supabase dashboard

### Step 7: Full Diagnostic Query

Run this complete query to diagnose all issues:

```sql
-- Comprehensive diagnostic
WITH auth_user AS (
  SELECT id, email FROM auth.users 
  WHERE email = 'karthikeyan@rareminds.in'
),
educator_record AS (
  SELECT * FROM public.school_educators 
  WHERE user_id = (SELECT id FROM auth_user)
)
SELECT 
  'Auth User Exists' as check_name,
  (SELECT COUNT(*) FROM auth_user) > 0 as result
UNION ALL
SELECT 
  'Educator Record Exists',
  (SELECT COUNT(*) FROM educator_record) > 0
UNION ALL
SELECT 
  'Educator Has First Name',
  (SELECT first_name IS NOT NULL FROM educator_record LIMIT 1)
UNION ALL
SELECT 
  'Educator Has Specialization',
  (SELECT specialization IS NOT NULL FROM educator_record LIMIT 1)
UNION ALL
SELECT 
  'School Exists',
  EXISTS (
    SELECT 1 FROM public.schools 
    WHERE id = (SELECT school_id FROM educator_record LIMIT 1)
  );
```

## Quick Fix Checklist

- [ ] Educator record exists in `school_educators` table
- [ ] `user_id` in educator record matches auth user ID
- [ ] `school_id` references valid school in `schools` table
- [ ] RLS policies allow reading educator data
- [ ] Supabase environment variables are set correctly
- [ ] Browser console shows educator data (not null)
- [ ] No errors in browser console

## If Still Not Working

1. **Check browser console** for the debug output
2. **Run the SQL queries** above to verify data
3. **Share the console output** and SQL results for debugging

## Related Files

- `src/pages/educator/Profile.tsx` - Profile component
- `src/lib/supabaseClient.ts` - Supabase client config
- `database/migrations/003_school_educators.sql` - Table schema
- `VERIFY_EDUCATOR_DATA.sql` - Verification queries
