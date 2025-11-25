# Certificates Not Showing - Fix Documentation

## Problem
Certificates were not displaying in the student/candidate profile drawer views for both recruiters and educators, even though data existed in the database.

## Root Cause
The profile drawer components were querying the `certificates` table using `candidate.id` (or `student.id`), but the foreign key relationship in the database uses `students.user_id`, not `students.id`.

### Database Schema
```sql
CREATE TABLE certificates (
  id uuid PRIMARY KEY,
  student_id uuid NOT NULL,
  -- other fields...
  CONSTRAINT certificates_student_id_fkey 
    FOREIGN KEY (student_id) 
    REFERENCES students(user_id) ON DELETE CASCADE
);
```

The `student_id` column references `students(user_id)`, NOT `students(id)`.

## Solution
Updated both profile drawer components to use `user_id` instead of `id` when querying related tables.

### Files Modified

#### 1. `/src/components/Recruiter/components/CandidateProfileDrawer.tsx`

**Before:**
```typescript
useEffect(() => {
  if (!candidate?.id) return;
  
  const fetchCertificates = async () => {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', candidate.id)  // ❌ Wrong: uses primary key
      // ...
  };
}, [candidate?.id]);
```

**After:**
```typescript
useEffect(() => {
  const studentId = candidate?.user_id || candidate?.id;  // ✅ Use user_id first
  if (!studentId) return;
  
  const fetchCertificates = async () => {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', studentId)  // ✅ Correct: uses user_id
      // ...
  };
}, [candidate?.user_id, candidate?.id]);
```

#### 2. `/src/components/educator/components/StudentProfileDrawer.tsx`

Applied the same fix for the educator's student profile drawer.

## Why This Happened
When we refactored to use relational tables, the `useStudents` hook correctly returns `user_id` in the candidate/student objects. However, the profile drawer components were still using the older `id` field to query related data.

The foreign key relationships in the database are set up to reference `students(user_id)` because:
- `user_id` is the unique identifier linking students to their user accounts
- Multiple tables (skills, projects, certificates, experience, trainings) all reference `students(user_id)`
- This creates a consistent relationship model across all student-related data

## Testing
To verify the fix works:

1. **Check Database**: Ensure the student has certificates in the database
   ```sql
   SELECT * FROM certificates WHERE student_id = '<user_id>';
   ```

2. **Open Profile**: Click on a candidate/student in the list
3. **Navigate to Certificates Tab**: Switch to the "Certificates" tab
4. **Verify Display**: Certificates should now load and display correctly

## Related Tables Affected
The same fix applies to these related queries in both profile drawers:
- ✅ `projects` - uses `student_id` referencing `students(user_id)`
- ✅ `certificates` - uses `student_id` referencing `students(user_id)`
- ✅ `experience` - uses `student_id` referencing `students(user_id)`
- ✅ `skills` - uses `student_id` referencing `students(user_id)`
- ✅ `trainings` - uses `student_id` referencing `students(user_id)`

## Prevention
Going forward, when creating queries for student-related data:
1. Always use `user_id` as the foreign key reference
2. Check the actual foreign key constraint in the database schema
3. Ensure the data fetching logic uses the correct field

## Additional Notes
- The fix includes a fallback: `candidate?.user_id || candidate?.id` for backward compatibility
- The dependency array in `useEffect` now includes both `user_id` and `id` to handle re-fetching correctly
- Projects and assignments queries in the same components were also fixed with the same pattern
