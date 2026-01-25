# College Registration Fix

## Problem Summary

College registration was failing with error:
```
Could not find the 'created_by' column of 'colleges' in the schema cache
```

The issue occurred at `/subscription/plans/college-admin/purchase` during the college signup flow.

## Root Cause

The `colleges` table was missing required audit columns (`created_by` and `updated_by`) that the application code expects to track ownership and modifications.

### Current Flow
1. User fills college registration form (3 steps)
2. System creates auth user account
3. System creates user record
4. **System tries to create college record with `created_by` and `updated_by` columns** ❌ FAILS HERE
5. College data should be saved to database

## Solution

### 1. Database Migration

Run the migration script to add missing columns and set up proper RLS policies:

```bash
# Execute the migration
psql -h <your-supabase-host> -U postgres -d postgres -f database/migrations/004_fix_colleges_table.sql
```

Or run it directly in Supabase SQL Editor:
- Go to Supabase Dashboard → SQL Editor
- Copy contents of `database/migrations/004_fix_colleges_table.sql`
- Execute the script

### 2. What the Migration Does

The migration performs the following operations:

#### Schema Changes
- ✅ Adds `created_by` column (references auth.users)
- ✅ Adds `updated_by` column (references auth.users)
- ✅ Creates indexes for performance optimization
- ✅ Enables Row Level Security (RLS)

#### RLS Policies Created
1. **College Admin View**: Allows admins to view their own college
2. **College Admin Insert**: Allows authenticated users to create college during signup
3. **College Admin Update**: Allows admins to update their own college
4. **Public Read**: Allows public to view approved and active colleges
5. **Super Admin**: Allows super admins to manage all colleges

#### Data Migration
- Updates existing college records to link them with their auth users (based on email matching)

### 3. Verify the Fix

Run the test script to verify everything works:

```bash
node test-college-registration.js
```

Expected output:
```
🧪 Testing College Registration Flow

1️⃣ Checking colleges table schema...
✅ Colleges table accessible

2️⃣ Creating test user account...
✅ User created: <uuid>

3️⃣ Creating college record...
✅ College created successfully!

4️⃣ Verifying college retrieval...
✅ College retrieved successfully

5️⃣ Testing college code uniqueness...
✅ College code uniqueness check working

🧹 Cleaning up test data...
✅ Test college deleted
✅ Signed out

✨ All tests passed! College registration flow is working correctly.
```

## Technical Details

### Updated Table Schema

```sql
CREATE TABLE public.colleges (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  "universityId" uuid NULL,
  name varchar(255) NOT NULL,
  code varchar(50) NOT NULL UNIQUE,
  "collegeType" text NULL DEFAULT 'standalone'::text,
  "deanName" varchar(200) NULL,
  "deanEmail" varchar(255) NULL,
  "deanPhone" varchar(20) NULL,
  affiliation varchar(255) NULL,
  accreditation varchar(100) NULL,
  address text NULL,
  city varchar(100) NULL,
  state varchar(100) NULL,
  country varchar(100) NULL DEFAULT 'India'::varchar,
  pincode varchar(10) NULL,
  phone varchar(20) NULL,
  email varchar(255) NULL,
  website varchar(255) NULL,
  "establishedYear" integer NULL,
  "accountStatus" account_status NULL DEFAULT 'pending'::account_status,
  "approvalStatus" approval_status NULL DEFAULT 'pending'::approval_status,
  "approvedBy" uuid NULL,
  "approvedAt" timestamptz NULL,
  "totalStudents" integer NULL DEFAULT 0,
  "totalLecturers" integer NULL DEFAULT 0,
  "createdAt" timestamptz NULL DEFAULT now(),
  "updatedAt" timestamptz NULL DEFAULT now(),
  metadata jsonb NULL DEFAULT '{}'::jsonb,
  
  -- NEW COLUMNS
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### Service Code (Already Correct)

The `collegeService.js` already has the correct implementation:

```javascript
export const createCollege = async (collegeData, userId = null) => {
  // ... authentication logic ...
  
  const { data, error } = await supabase
    .from('colleges')
    .insert([{
      ...collegeData,
      created_by: uid,      // ✅ Now supported
      updated_by: uid,      // ✅ Now supported
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }])
    .select()
    .single();
    
  // ... error handling ...
};
```

## Registration Flow (After Fix)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User visits /subscription/plans/college-admin/purchase   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User fills 3-step registration form:                     │
│    - Step 1: Account (email, password)                      │
│    - Step 2: College Details (name, code, type)             │
│    - Step 3: Contact & Dean Info (address, dean details)    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. System creates auth user (signUpWithRole)                │
│    ✅ User ID generated                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. System creates user record (createUserRecord)            │
│    ✅ User profile created                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. System creates college record (createCollege)            │
│    ✅ College saved with created_by and updated_by          │
│    ✅ RLS policies allow insert                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Success! Redirect to payment page                        │
│    navigate('/subscription/payment', { state: { plan } })   │
└─────────────────────────────────────────────────────────────┘
```

## Files Modified/Created

### Created
- ✅ `database/migrations/004_fix_colleges_table.sql` - Database migration
- ✅ `test-college-registration.js` - Test script
- ✅ `COLLEGE_REGISTRATION_FIX.md` - This documentation

### No Changes Needed
- ✅ `src/services/collegeService.js` - Already correct
- ✅ `src/components/Subscription/CollegeSignupModal.jsx` - Already correct

## Testing Checklist

After applying the migration, test the following:

- [ ] Run migration script successfully
- [ ] Run test script - all tests pass
- [ ] Manual test: Register new college through UI
- [ ] Verify college appears in database with correct `created_by`
- [ ] Verify college admin can view their college
- [ ] Verify college code uniqueness validation works
- [ ] Verify RLS policies prevent unauthorized access

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Remove the columns
ALTER TABLE public.colleges 
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by;

-- Drop the indexes
DROP INDEX IF EXISTS idx_colleges_created_by;
DROP INDEX IF EXISTS idx_colleges_updated_by;

-- Drop the policies
DROP POLICY IF EXISTS "Allow college admins to view their own college" ON public.colleges;
DROP POLICY IF EXISTS "Allow college admins to insert their own college" ON public.colleges;
DROP POLICY IF EXISTS "Allow college admins to update their own college" ON public.colleges;
DROP POLICY IF EXISTS "Allow public to read approved colleges" ON public.colleges;
DROP POLICY IF EXISTS "Allow super admins to manage all colleges" ON public.colleges;

-- Disable RLS
ALTER TABLE public.colleges DISABLE ROW LEVEL SECURITY;
```

## Next Steps

1. ✅ Apply the database migration
2. ✅ Run the test script to verify
3. ✅ Test college registration through the UI
4. Consider adding similar audit columns to other entity tables (schools, universities)
5. Consider adding triggers to automatically update `updated_by` on record modifications

## Support

If you encounter any issues:
1. Check Supabase logs for detailed error messages
2. Verify RLS policies are correctly applied
3. Ensure auth.users table is accessible
4. Check that the user is properly authenticated during signup

## Related Files

- Service: `src/services/collegeService.js`
- Component: `src/components/Subscription/CollegeSignupModal.jsx`
- Auth Service: `src/services/authService.js`
- Educator Auth: `src/services/educatorAuthService.js`
