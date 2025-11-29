# Troubleshooting KPI Dashboard

## Error: "Failed to load dashboard data"

### Quick Fixes

#### 1. Check Browser Console (F12)
Look for specific error messages that will tell you exactly what's wrong.

#### 2. Common Issues & Solutions

### Issue: "relation does not exist" or table not found

**Problem:** One or more database tables are missing.

**Solution:** Check which tables exist in your Supabase database:

Required tables:
- `students`
- `attendance_records`
- `exams`
- `marks`
- `fee_payments`
- `career_recommendations`
- `book_issue`

**Quick Fix:** The dashboard will now show 0 for missing tables instead of crashing.

---

### Issue: "permission denied" or RLS policy error

**Problem:** Row Level Security (RLS) policies are blocking access.

**Solution:**

1. **Temporarily disable RLS for testing:**
   ```sql
   ALTER TABLE students DISABLE ROW LEVEL SECURITY;
   ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
   ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
   ALTER TABLE marks DISABLE ROW LEVEL SECURITY;
   ALTER TABLE fee_payments DISABLE ROW LEVEL SECURITY;
   ALTER TABLE career_recommendations DISABLE ROW LEVEL SECURITY;
   ALTER TABLE book_issue DISABLE ROW LEVEL SECURITY;
   ```

2. **Or create proper RLS policies:**
   ```sql
   -- Allow authenticated users to read all data
   CREATE POLICY "Allow read access" ON students
   FOR SELECT USING (auth.role() = 'authenticated');
   
   -- Repeat for other tables
   ```

---

### Issue: No data showing (all zeros)

**Problem:** Tables exist but have no data.

**Solution:** Add sample data:

```sql
-- Add sample students
INSERT INTO students (student_id, status, school_id)
VALUES 
  (gen_random_uuid(), 'active', 'test-school-1'),
  (gen_random_uuid(), 'active', 'test-school-1'),
  (gen_random_uuid(), 'active', 'test-school-1');

-- Add sample attendance for today
INSERT INTO attendance_records (att_id, student_id, school_id, date, status)
SELECT 
  gen_random_uuid(),
  student_id,
  school_id,
  CURRENT_DATE,
  'present'
FROM students
WHERE school_id = 'test-school-1';

-- Add sample exam
INSERT INTO exams (exam_id, school_id, name, date)
VALUES (gen_random_uuid(), 'test-school-1', 'Mid-term', CURRENT_DATE + 7);
```

---

### Issue: Supabase connection error

**Problem:** Can't connect to Supabase.

**Solution:**

1. Check `.env` file has correct values:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Restart dev server after changing `.env`:
   ```bash
   npm run dev
   ```

3. Test connection:
   ```typescript
   import { supabase } from './lib/supabaseClient';
   
   const testConnection = async () => {
     const { data, error } = await supabase.from('students').select('count');
     console.log('Connection test:', { data, error });
   };
   ```

---

### Issue: schoolId is undefined

**Problem:** No school ID is being passed to the component.

**Current Behavior:** Dashboard will show ALL data (no school filter).

**Solution:** Set a real school ID in `Dashboard.tsx`:

```typescript
// Option 1: Hardcode for testing
const schoolId = "test-school-1";

// Option 2: From auth context
import { useAuth } from '@/context/AuthContext';
const { user } = useAuth();
const schoolId = user?.school_id;

// Option 3: From Supabase
const [schoolId, setSchoolId] = useState(null);
useEffect(() => {
  const getSchoolId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    // Get school_id from user metadata or profile
    setSchoolId(user?.user_metadata?.school_id);
  };
  getSchoolId();
}, []);
```

---

## Debugging Steps

### Step 1: Check Console Logs

Open browser console (F12) and look for:
```
Fetching KPI data for school: undefined
```

This tells you if schoolId is being passed.

### Step 2: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for requests to Supabase
5. Check if they're returning 200 (success) or errors

### Step 3: Test Individual Queries

Add this to your Dashboard.tsx to test:

```typescript
useEffect(() => {
  const testQueries = async () => {
    // Test students table
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('count');
    console.log('Students:', { data: students, error: studentsError });
    
    // Test attendance_records table
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('count');
    console.log('Attendance:', { data: attendance, error: attendanceError });
    
    // Add more tests for other tables...
  };
  
  testQueries();
}, []);
```

---

## Current Configuration

The KPI Dashboard is now configured to:

✅ Work without a school ID (shows all data)  
✅ Handle missing tables gracefully (shows 0)  
✅ Provide detailed error messages  
✅ Log debug information to console  

---

## Quick Test

To verify the dashboard is working:

1. **Check if component loads:**
   - You should see 8 KPI cards (even if showing 0)
   - No red error box

2. **Check console for logs:**
   ```
   Fetching KPI data for school: undefined
   ```

3. **Check for specific errors:**
   - "relation does not exist" → Table missing
   - "permission denied" → RLS policy issue
   - "Failed to fetch" → Network/Supabase connection issue

---

## Still Not Working?

### Create Minimal Test Tables

```sql
-- Create minimal students table
CREATE TABLE IF NOT EXISTS students (
  student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'active',
  school_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add sample data
INSERT INTO students (status, school_id)
VALUES ('active', 'test-school-1');

-- Disable RLS for testing
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
```

Then check if "Total Students" KPI shows 1.

---

## Contact Support

If you're still having issues:

1. Copy the error message from console
2. Check which table is causing the error
3. Verify that table exists in Supabase
4. Check RLS policies on that table
5. Test the query directly in Supabase SQL Editor

---

**Last Updated:** November 28, 2025
