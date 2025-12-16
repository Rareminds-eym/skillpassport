# Faculty/Educators Page Status

## Current Implementation

The Faculty Management page at `/college-admin/departments/educators` is **already correctly implemented** to fetch from the `college_lecturers` table.

### Component Structure

```
FacultyManagement.tsx
  └─> FacultyManagementDashboard.tsx
       ├─> FacultyList.tsx (displays lecturers)
       ├─> FacultyOnboarding.tsx (adds new lecturers)
       ├─> FacultyTimetable.tsx
       ├─> FacultyPerformanceAnalytics.tsx
       └─> FacultyBulkImport.tsx
```

### Data Flow

1. **FacultyManagementDashboard** fetches the college ID:
   - Checks `college_lecturers` table for current user's email
   - Falls back to `colleges` table (email or admin_email)
   - Passes `collegeId` to child components

2. **FacultyList** queries `college_lecturers`:
   ```typescript
   const { data, error } = await supabase
     .from("college_lecturers")
     .select("*")
     .eq("collegeId", collegeId)
     .order("createdAt", { ascending: false });
   ```

3. **Displays**:
   - Employee ID
   - Name (from metadata.first_name, metadata.last_name)
   - Email (from metadata.email)
   - Role (from metadata.role)
   - Subject expertise (from metadata.subject_expertise)
   - Status (accountStatus)

## Schema Used

```sql
college_lecturers:
  - id (uuid, primary key)
  - userId / user_id (uuid, foreign key to users)
  - collegeId (uuid, foreign key to colleges)
  - employeeId (varchar)
  - department (varchar)
  - specialization (varchar)
  - qualification (varchar)
  - experienceYears (integer)
  - dateOfJoining (date)
  - accountStatus (enum: active, inactive, pending, suspended)
  - metadata (jsonb):
      - first_name
      - last_name
      - email
      - phone_number
      - role (college_admin, dean, hod, professor, assistant_professor, lecturer)
      - subject_expertise (array of objects)
      - temporary_password
      - password_created_at
      - created_by
```

## Why It Might Not Be Displaying

### Issue 1: No Data in Table
**Check**: Run `test-faculty-educators-data.sql`

**Solution**: Insert sample data using FacultyOnboarding tab or SQL:
```sql
INSERT INTO college_lecturers (...) VALUES (...);
```

### Issue 2: College ID Not Found
**Symptom**: Console shows "No college_id found for user"

**Solution**: Ensure the logged-in user's email exists in either:
- `college_lecturers.metadata->>'email'`
- `colleges.email`
- `colleges.admin_email`

### Issue 3: RLS Policies Blocking Access
**Check**: 
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'college_lecturers';
```

**Solution**: Create appropriate RLS policy:
```sql
CREATE POLICY "Allow college users to view their college lecturers"
ON college_lecturers FOR SELECT
TO authenticated
USING (
  "collegeId" IN (
    SELECT id FROM colleges 
    WHERE email = auth.jwt()->>'email' 
    OR admin_email = auth.jwt()->>'email'
  )
);
```

### Issue 4: Wrong College ID
**Symptom**: Page loads but shows "No faculty found"

**Solution**: Verify the collegeId being used matches the data:
```sql
-- Check what college ID the user should have
SELECT id, name, email, admin_email 
FROM colleges 
WHERE email = 'your-email@example.com' 
OR admin_email = 'your-email@example.com';

-- Check if lecturers exist for that college
SELECT COUNT(*) 
FROM college_lecturers 
WHERE "collegeId" = 'your-college-id';
```

## Debugging Steps

1. **Open Browser Console** (F12)
   - Look for errors
   - Check what collegeId is being used
   - See if the query returns data

2. **Run SQL Check**:
   ```bash
   # In Supabase SQL Editor
   test-faculty-educators-data.sql
   ```

3. **Check Network Tab**:
   - Look for the Supabase API call to `college_lecturers`
   - Check the response

4. **Verify User Context**:
   - What email is logged in?
   - Does that email have a college association?

## Quick Test Data

If you need to add test data quickly:

```sql
-- Get IDs first
SELECT id as user_id FROM users LIMIT 1;
SELECT id as college_id FROM colleges LIMIT 1;

-- Insert test lecturer
INSERT INTO college_lecturers (
  "userId",
  "collegeId",
  "employeeId",
  department,
  specialization,
  qualification,
  "experienceYears",
  "dateOfJoining",
  "accountStatus",
  metadata
) VALUES (
  'USER_ID_HERE',
  'COLLEGE_ID_HERE',
  'FAC001',
  'Computer Science',
  'AI/ML',
  'PhD',
  5,
  CURRENT_DATE,
  'active',
  '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@college.edu",
    "phone_number": "+1234567890",
    "role": "professor",
    "subject_expertise": [
      {
        "name": "Machine Learning",
        "proficiency": "expert",
        "years_experience": 5
      }
    ]
  }'::jsonb
);
```

## Features Available

### FacultyList Tab
- ✅ View all lecturers
- ✅ Search by name, email, employee ID, department
- ✅ Filter by status (active, inactive, pending, suspended)
- ✅ View detailed faculty profile
- ✅ Update faculty status
- ✅ Display statistics (total, active, pending, etc.)

### FacultyOnboarding Tab
- ✅ Add new faculty members
- ✅ Generate temporary passwords
- ✅ Assign roles and subjects

### Other Tabs
- FacultyTimetable
- FacultyPerformanceAnalytics
- FacultyBulkImport

## Comparison with User Management

| Feature | User Management | Faculty/Educators |
|---------|----------------|-------------------|
| Table | `college_lecturers` + `students` | `college_lecturers` only |
| Purpose | View all users (staff + students) | Manage faculty specifically |
| Features | Basic CRUD | Advanced (onboarding, timetable, analytics) |
| Filtering | Role, status, search | Status, search, department |
| Data Source | Combined from 2 tables | Single table |

## Recommendation

The Faculty/Educators page is **more feature-rich** and **already working correctly**. If it's not displaying data, the issue is likely:

1. **No data in `college_lecturers` table** - Add via FacultyOnboarding tab
2. **College ID not found** - Ensure user email is linked to a college
3. **RLS policies** - Check and create appropriate policies

Run the test SQL file to diagnose the exact issue.
