# 🔧 FIX: 400 Error When Loading Pipeline Candidates

## Error You're Seeing:
```
Failed to load resource: the server responded with a status of 400
[Pipeline Service] Error fetching stage sourced: Object
```

## Root Cause:
The frontend is trying to query student fields (`name`, `email`, `phone`, etc.) as individual columns, but your `students` table stores all this data in a JSONB `profile` column.

## Quick Fix (2 Steps):

### Step 1: Update Database Views
Run this script in **Supabase SQL Editor**:
```
database/fix_pipeline_views_for_jsonb.sql
```

This updates the database views to correctly extract data from the JSONB profile column.

### Step 2: Frontend Already Fixed ✅
The frontend code has already been updated in:
- `src/services/pipelineService.ts` - Fixed to only select `id` and `profile` from students table
- The transformation logic extracts the needed fields from the profile in JavaScript

## What Was Fixed:

### Before (Causing 400 Error):
```typescript
.select(`
  *,
  students (
    id,
    name,        ❌ Column doesn't exist
    email,       ❌ Column doesn't exist
    phone,       ❌ Column doesn't exist
    department,  ❌ Column doesn't exist
    ...
  )
`)
```

### After (Working):
```typescript
.select(`
  *,
  students (
    id,
    profile    ✅ JSONB column that exists
  )
`)
```

Then the data is transformed:
```typescript
students: {
  dept: profile.dept || profile.department,
  college: profile.college || profile.university,
  skills: profile.skills || [],
  ai_score_overall: profile.ai_score_overall
}
```

## Verify It's Working:

1. **Check the views in Supabase:**
```sql
SELECT * FROM pipeline_candidates_detailed LIMIT 1;
SELECT * FROM student_applications_with_pipeline LIMIT 1;
```

2. **Test in your app:**
   - Go to recruiter pipeline dashboard
   - Should now load without 400 errors
   - Candidates should appear in their respective stages

## Expected Result:

✅ No more 400 errors
✅ Pipeline candidates load successfully
✅ Student data displays correctly (name, email, department, etc.)
✅ All pipeline stages show candidates

## Still Getting Errors?

### Check 1: Verify the view was updated
```sql
-- Should show the updated view definition with COALESCE and profile->>'name'
\d+ pipeline_candidates_detailed
```

### Check 2: Check your students table structure
```sql
-- Should show 'profile' as a JSONB column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students';
```

### Check 3: Check a sample student profile
```sql
SELECT id, profile 
FROM students 
LIMIT 1;
```

The profile should look like:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "dept": "Computer Science",
  "college": "MIT",
  "skills": ["React", "Node.js"],
  "ai_score_overall": 85
}
```

## Files Modified:
- ✅ `src/services/pipelineService.ts` - Updated queries
- ✅ `database/fix_pipeline_views_for_jsonb.sql` - Updated views
- ✅ `database/fix_pipeline_integration_complete.sql` - Updated main fix script

## Next Steps:
After running the SQL script:
1. Refresh your browser
2. Go to pipeline dashboard
3. Should load without errors!
