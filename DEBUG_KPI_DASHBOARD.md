# Debug KPI Dashboard - Why Showing 0?

## Step 1: Check School ID

Open browser console (F12) and look for this log:
```
Fetching KPI data for school: [some-id or undefined]
```

**If you see `undefined`:**
- The school_id is not being fetched from the user
- Dashboard is querying ALL data (no school filter)
- If still showing 0, tables are empty

**If you see a school_id:**
- Dashboard is filtering by that school_id
- If showing 0, no data exists for that school

---

## Step 2: Check if Tables Have Data

Run these queries in Supabase SQL Editor:

### Check Students Table
```sql
-- Check total students
SELECT COUNT(*) as total_students FROM students WHERE status = 'active';

-- Check students by school
SELECT school_id, COUNT(*) as count 
FROM students 
WHERE status = 'active' 
GROUP BY school_id;

-- See all students
SELECT * FROM students LIMIT 10;
```

### Check Attendance Records
```sql
-- Check today's attendance
SELECT COUNT(*) as total_records 
FROM attendance_records 
WHERE date = CURRENT_DATE;

-- Check by school
SELECT school_id, COUNT(*) as count 
FROM attendance_records 
WHERE date = CURRENT_DATE 
GROUP BY school_id;

-- See all attendance
SELECT * FROM attendance_records 
WHERE date = CURRENT_DATE 
LIMIT 10;
```

### Check Exams
```sql
-- Check upcoming exams
SELECT COUNT(*) as total_exams 
FROM exams 
WHERE date >= CURRENT_DATE;

-- Check by school
SELECT school_id, COUNT(*) as count 
FROM exams 
WHERE date >= CURRENT_DATE 
GROUP BY school_id;

-- See all exams
SELECT * FROM exams LIMIT 10;
```

### Check Marks
```sql
-- Check unpublished marks
SELECT COUNT(*) as pending_assessments 
FROM marks 
WHERE published = false;

-- Check by school
SELECT school_id, COUNT(*) as count 
FROM marks 
WHERE published = false 
GROUP BY school_id;

-- See all marks
SELECT * FROM marks LIMIT 10;
```

---

## Step 3: Check User's School ID

```sql
-- Find your user's school_id
SELECT email, school_id 
FROM users 
WHERE email = 'your-email@example.com';

-- Or check all users
SELECT email, school_id, role 
FROM users 
LIMIT 10;
```

---

## Common Issues & Solutions

### Issue 1: No school_id in user object

**Check console for:**
```
School ID from user: undefined
```

**Solution:** Add school_id to your user record:
```sql
UPDATE users 
SET school_id = 'your-school-id' 
WHERE email = 'your-email@example.com';
```

---

### Issue 2: Tables are empty

**Check if tables have any data:**
```sql
SELECT 
  (SELECT COUNT(*) FROM students) as students_count,
  (SELECT COUNT(*) FROM attendance_records) as attendance_count,
  (SELECT COUNT(*) FROM exams) as exams_count,
  (SELECT COUNT(*) FROM marks) as marks_count;
```

**If all are 0, add sample data:**

```sql
-- Add sample students
INSERT INTO students (student_id, status, school_id, name)
VALUES 
  (gen_random_uuid(), 'active', 'school-123', 'John Doe'),
  (gen_random_uuid(), 'active', 'school-123', 'Jane Smith'),
  (gen_random_uuid(), 'active', 'school-123', 'Bob Johnson');

-- Add today's attendance
INSERT INTO attendance_records (att_id, student_id, school_id, date, status)
SELECT 
  gen_random_uuid(),
  student_id,
  school_id,
  CURRENT_DATE,
  'present'
FROM students
WHERE school_id = 'school-123';

-- Add sample exam
INSERT INTO exams (exam_id, school_id, name, date)
VALUES 
  (gen_random_uuid(), 'school-123', 'Mid-term Exam', CURRENT_DATE + 7),
  (gen_random_uuid(), 'school-123', 'Final Exam', CURRENT_DATE + 30);

-- Add sample unpublished marks
INSERT INTO marks (mark_id, exam_id, student_id, school_id, marks_scored, published)
SELECT 
  gen_random_uuid(),
  (SELECT exam_id FROM exams LIMIT 1),
  student_id,
  school_id,
  85,
  false
FROM students
WHERE school_id = 'school-123'
LIMIT 3;
```

---

### Issue 3: school_id mismatch

**Problem:** User's school_id doesn't match data's school_id

**Check:**
```sql
-- What school_id does the user have?
SELECT school_id FROM users WHERE email = 'your-email@example.com';

-- What school_ids exist in students table?
SELECT DISTINCT school_id FROM students;
```

**Solution:** Make sure they match:
```sql
-- Option A: Update user's school_id to match data
UPDATE users 
SET school_id = 'actual-school-id-from-data' 
WHERE email = 'your-email@example.com';

-- Option B: Update data's school_id to match user
UPDATE students SET school_id = 'user-school-id';
UPDATE attendance_records SET school_id = 'user-school-id';
UPDATE exams SET school_id = 'user-school-id';
UPDATE marks SET school_id = 'user-school-id';
```

---

## Step 4: Test Without School Filter

Temporarily remove school filter to see if data exists:

In `Dashboard.tsx`, change:
```typescript
const [schoolId, setSchoolId] = useState<string | undefined>(undefined);
```

And comment out the useEffect that fetches school_id.

Refresh the page. If you now see data, the issue is the school_id filter.

---

## Step 5: Enable Debug Logging

Add this to your Dashboard.tsx:

```typescript
useEffect(() => {
  console.log('=== DEBUG INFO ===');
  console.log('User:', user);
  console.log('School ID:', schoolId);
  console.log('==================');
}, [user, schoolId]);
```

This will show you exactly what values are being used.

---

## Quick Test Script

Run this in Supabase SQL Editor to create test data:

```sql
-- Create test school and data
DO $$
DECLARE
  test_school_id TEXT := 'test-school-123';
  student1_id UUID := gen_random_uuid();
  student2_id UUID := gen_random_uuid();
  exam1_id UUID := gen_random_uuid();
BEGIN
  -- Add students
  INSERT INTO students (student_id, status, school_id, name)
  VALUES 
    (student1_id, 'active', test_school_id, 'Test Student 1'),
    (student2_id, 'active', test_school_id, 'Test Student 2');
  
  -- Add attendance for today
  INSERT INTO attendance_records (att_id, student_id, school_id, date, status)
  VALUES 
    (gen_random_uuid(), student1_id, test_school_id, CURRENT_DATE, 'present'),
    (gen_random_uuid(), student2_id, test_school_id, CURRENT_DATE, 'present');
  
  -- Add exam
  INSERT INTO exams (exam_id, school_id, name, date)
  VALUES (exam1_id, test_school_id, 'Test Exam', CURRENT_DATE + 7);
  
  -- Add marks
  INSERT INTO marks (mark_id, exam_id, student_id, school_id, marks_scored, published)
  VALUES 
    (gen_random_uuid(), exam1_id, student1_id, test_school_id, 85, false),
    (gen_random_uuid(), exam1_id, student2_id, test_school_id, 90, false);
  
  RAISE NOTICE 'Test data created for school: %', test_school_id;
END $$;
```

Then update your user:
```sql
UPDATE users 
SET school_id = 'test-school-123' 
WHERE email = 'your-email@example.com';
```

Refresh the dashboard and you should see:
- Total Students: 2
- Attendance % Today: 100%
- Exams Scheduled: 1
- Pending Assessments: 2

---

## Expected Results After Fix

Once you have data and correct school_id:
- **Total Students:** Should show count > 0
- **Attendance % Today:** Should show percentage (e.g., 87%)
- **Exams Scheduled:** Should show count > 0
- **Pending Assessments:** Should show count > 0

---

**Last Updated:** November 28, 2025
