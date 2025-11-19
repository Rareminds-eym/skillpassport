# 🔄 Students Table Migration: JSONB to Proper Columns

## What This Does
Migrates your `students` table from using a JSONB `profile` column to individual columns for better performance and SQL compatibility.

## 🚀 Quick Migration (3 Steps)

### Step 1: Run the Migration Script
Open **Supabase SQL Editor** and run:
```
database/migrate_students_to_columns.sql
```

This will:
1. ✅ Add new columns (`name`, `email`, `phone`, `department`, etc.) to `students` table
2. ✅ Migrate all data from JSONB `profile` to the new columns
3. ✅ Create indexes for better performance
4. ✅ Update all views to use the new column structure
5. ✅ Update the trigger function to use new columns
6. ✅ Keep `profile` column as backup (you can drop it later)

### Step 2: Frontend Already Updated ✅
The frontend code has been updated to work with the new structure:
- `src/services/pipelineService.ts` - Now queries proper columns

### Step 3: Test
1. Refresh your browser
2. Go to recruiter pipeline dashboard
3. Should load without 400 errors!

## 📊 What Changed

### Before (JSONB Structure):
```sql
students
├── id (uuid)
├── profile (jsonb) ← Everything stored here
│   ├── name
│   ├── email
│   ├── phone
│   ├── department
│   └── ...
└── email (text)
```

### After (Proper Columns):
```sql
students
├── id (uuid)
├── name (text)              ← Extracted from profile
├── email (text)             ← Extracted from profile
├── phone (text)             ← Extracted from profile
├── department (text)        ← Extracted from profile
├── university (text)        ← Extracted from profile
├── cgpa (numeric)           ← Extracted from profile
├── employability_score (numeric) ← Extracted from profile
├── verified (boolean)       ← Extracted from profile
└── profile (jsonb)          ← Kept as backup
```

## ✅ Benefits

1. **Better Performance:** Individual columns are faster to query than JSONB
2. **SQL Compatibility:** Standard SQL queries work without JSON operators
3. **Easier Joins:** Views and joins work naturally
4. **Type Safety:** Database enforces data types
5. **Indexing:** Can create indexes on individual columns

## 🔍 Verification

After running the migration, check:

```sql
-- See the new columns
SELECT 
  id,
  name,
  email,
  phone,
  department,
  university
FROM students
LIMIT 5;

-- Check migration completeness
SELECT 
  COUNT(*) as total,
  COUNT(name) as with_name,
  COUNT(email) as with_email
FROM students;

-- Test the views
SELECT * FROM pipeline_candidates_detailed LIMIT 3;
SELECT * FROM student_applications_with_pipeline LIMIT 3;
```

## 🧪 Test the Full Flow

1. **Student applies to job**
   ```sql
   -- Check the application was created
   SELECT * FROM applied_jobs ORDER BY applied_at DESC LIMIT 1;
   ```

2. **Trigger should add to pipeline**
   ```sql
   -- Check student was added to pipeline
   SELECT 
     pc.candidate_name,
     pc.candidate_email,
     pc.stage,
     pc.source
   FROM pipeline_candidates pc
   ORDER BY pc.added_at DESC
   LIMIT 1;
   ```

3. **Frontend should display correctly**
   - Go to recruiter pipeline
   - Should see student card with name, email, department
   - No 400 errors in console

## ⚠️ Important Notes

1. **Profile column is kept:** As a backup. After verifying everything works, you can drop it:
   ```sql
   -- Only run after full verification!
   ALTER TABLE students DROP COLUMN profile;
   ```

2. **Existing data migrated:** All existing JSONB data has been migrated to columns

3. **New students:** Future student records should populate the columns directly

## 📁 Files Modified

### Database:
- ✅ `database/migrate_students_to_columns.sql` - Migration script

### Frontend:
- ✅ `src/services/pipelineService.ts` - Updated to use proper columns

### Views Updated:
- ✅ `pipeline_candidates_detailed` - Uses new columns
- ✅ `student_applications_with_pipeline` - Uses new columns

### Functions Updated:
- ✅ `auto_add_applicant_to_pipeline()` - Uses new columns

## 🆘 Troubleshooting

### Issue: Still getting 400 errors
**Solution:** Make sure you ran the migration script and restarted the dev server

### Issue: Some students have NULL values
**Solution:** Check the original profile data:
```sql
SELECT id, profile FROM students WHERE name IS NULL LIMIT 5;
```
Then manually update if needed.

### Issue: Need to add more columns
**Solution:** You can add more columns from the profile:
```sql
ALTER TABLE students ADD COLUMN your_field TEXT;
UPDATE students SET your_field = profile->>'your_field';
```

## 🎉 Success!

After migration, you should have:
- ✅ Proper table structure with individual columns
- ✅ Better query performance
- ✅ No 400 errors
- ✅ Pipeline loading correctly
- ✅ All student data preserved

---

**Ready to migrate?** Just run `database/migrate_students_to_columns.sql` in Supabase! 🚀
