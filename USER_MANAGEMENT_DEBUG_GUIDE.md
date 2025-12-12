# User Management - Debugging Guide

## Issue
User Management page is not displaying lecturers and students from `college_lecturers` and `students` tables.

## Debugging Steps

### Step 1: Check Browser Console
Open the User Management page and check the browser console for these logs:

```
🔍 Fetching users with filters: {...}
📚 Lecturers query result: { count: X, error: ... }
🎓 Students query result: { count: X, error: ... }
✅ Total users fetched: { total: X, filtered: X, lecturers: X, students: X }
```

### Step 2: Run SQL Check
Run the SQL script to verify data exists:

```bash
# In Supabase SQL Editor, run:
check-user-management-data.sql
```

Expected results:
- `college_lecturers` should have records
- `students` should have records where `is_deleted = false`
- Users should have matching records

### Step 3: Run Test Script
Test the data fetching directly:

```bash
node test-user-management-fetch.js
```

This will show:
- If tables exist
- If data exists
- If foreign key relationships work
- What the actual query returns

## Common Issues & Fixes

### Issue 1: No Data in Tables
**Symptom**: Count is 0 for both lecturers and students

**Fix**: Insert sample data

```sql
-- Insert sample lecturer
INSERT INTO college_lecturers (
  "userId",
  "collegeId",
  "employeeId",
  department,
  specialization,
  "accountStatus"
) VALUES (
  (SELECT id FROM users LIMIT 1),  -- Use existing user
  (SELECT id FROM colleges LIMIT 1),  -- Use existing college
  'EMP001',
  'Computer Science',
  'AI/ML',
  'active'
);

-- Students should already exist from your schema
SELECT COUNT(*) FROM students WHERE is_deleted = false;
```

### Issue 2: Foreign Key Mismatch
**Symptom**: Lecturers found but no user details

**Problem**: The `college_lecturers` table has both `userId` and `user_id` columns

**Current Fix**: The service now fetches users separately using both columns:
```typescript
const userId = lecturer.userId || lecturer.user_id;
```

### Issue 3: RLS Policies Blocking Access
**Symptom**: Error 406 or empty results despite data existing

**Fix**: Check RLS policies

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('college_lecturers', 'students');

-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE college_lecturers DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Or create permissive policies
CREATE POLICY "Allow college admin to view lecturers"
ON college_lecturers FOR SELECT
TO authenticated
USING (true);  -- Adjust based on your auth logic

CREATE POLICY "Allow college admin to view students"
ON students FOR SELECT
TO authenticated
USING (true);  -- Adjust based on your auth logic
```

### Issue 4: College Filter Not Applied
**Symptom**: Seeing students/lecturers from all colleges

**Fix**: Add college filtering to the service

The current implementation doesn't filter by college. You need to:

1. Get the current user's college ID from context
2. Add it to the query:

```typescript
// In the service
const { data: { user } } = await supabase.auth.getUser();
const collegeId = user?.user_metadata?.college_id;

if (collegeId) {
  lecturersQuery = lecturersQuery.eq('collegeId', collegeId);
  studentsQuery = studentsQuery.eq('college_id', collegeId);
}
```

### Issue 5: Users Table Missing Columns
**Symptom**: Error about `full_name` not existing

**Fix**: Check users table structure

```sql
-- Check columns in users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public';
```

If `full_name` doesn't exist, update the service to use available columns:
```typescript
.select('id, email, name')  // Instead of full_name
```

## Verification Checklist

- [ ] Tables exist (`college_lecturers`, `students`, `users`)
- [ ] Data exists in tables
- [ ] RLS policies allow access
- [ ] Foreign keys are properly set
- [ ] Console shows correct counts
- [ ] No errors in browser console
- [ ] Users appear in the UI table

## Quick Test Data

If you need test data:

```sql
-- Create test lecturer (assuming you have a user and college)
INSERT INTO college_lecturers (
  "userId",
  "collegeId", 
  "employeeId",
  department,
  specialization,
  qualification,
  "experienceYears",
  "accountStatus"
)
SELECT 
  u.id,
  c.id,
  'TEST-' || SUBSTRING(u.id::text, 1, 8),
  'Computer Science',
  'Software Engineering',
  'PhD in Computer Science',
  5,
  'active'
FROM users u
CROSS JOIN colleges c
LIMIT 1;

-- Check students exist
SELECT 
  COUNT(*) as total_students,
  COUNT(DISTINCT college_id) as colleges_with_students
FROM students 
WHERE is_deleted = false;
```

## Next Steps

1. Run the debugging steps above
2. Check the console logs
3. Verify data exists in tables
4. Check RLS policies
5. Report back with the specific error or count results
