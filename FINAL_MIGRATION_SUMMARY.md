# Final Migration Summary

## ✅ Completed Migrations

### 1. opportunities table
- ✅ `id`: serial → UUID
- ✅ Primary key updated
- ✅ Foreign keys recreated

### 2. pipeline_candidates table
- ✅ `id`: serial → UUID
- ✅ `opportunity_id`: integer → UUID
- ✅ Foreign key to opportunities updated

### 3. applied_jobs table
- ✅ `id`: serial → UUID
- ✅ `opportunity_id`: integer → UUID
- ✅ Foreign key to opportunities updated

## ⚠️ Remaining Issue

The foreign keys in `pipeline_candidates` and `applied_jobs` are referencing `students.user_id` but should reference `students.id`.

### Current (Wrong):
```sql
FOREIGN KEY (student_id) REFERENCES students(user_id)
```

### Should be:
```sql
FOREIGN KEY (student_id) REFERENCES students(id)
```

## 🔧 Fix Required

**Run this script**: `fix-student-foreign-keys.sql`

This will:
1. Drop the incorrect foreign key constraints
2. Recreate them pointing to `students.id`
3. Verify the changes

## After Running the Fix

All tables will have:
- ✅ UUID primary keys
- ✅ UUID foreign keys
- ✅ Correct references to students.id
- ✅ Old columns kept for safety

## Testing After Fix

Test these features:
- [ ] Import requisitions (opportunities table)
- [ ] Apply to jobs (applied_jobs table)
- [ ] View applications
- [ ] Add candidates to pipeline (pipeline_candidates table)
- [ ] Move candidates through stages
- [ ] All student-related operations

## Cleanup (After 1-2 weeks)

Once everything is verified:

```sql
-- Drop old columns
ALTER TABLE opportunities DROP COLUMN id_old;
ALTER TABLE pipeline_candidates DROP COLUMN id_old, opportunity_id_old;
ALTER TABLE applied_jobs DROP COLUMN id_old, opportunity_id_old;

-- Update indexes to use new UUID columns
DROP INDEX IF EXISTS idx_applied_jobs_opportunity_id;
CREATE INDEX idx_applied_jobs_opportunity_id ON applied_jobs(opportunity_id);

DROP INDEX IF EXISTS idx_applied_jobs_opportunity_student;
CREATE INDEX idx_applied_jobs_opportunity_student ON applied_jobs(opportunity_id, student_id);

-- Drop backup tables
DROP TABLE opportunities_backup_migration;
DROP TABLE pipeline_candidates_backup_migration;
DROP TABLE applied_jobs_backup_migration;
```

## Current Table Structure

### opportunities
```
id (uuid) - PRIMARY KEY
id_old (integer) - old ID for reference
... other columns ...
```

### pipeline_candidates
```
id (uuid) - PRIMARY KEY
student_id (uuid) - FK to students.id (needs fix)
opportunity_id (uuid) - FK to opportunities.id ✅
opportunity_id_old (integer) - old ID for reference
... other columns ...
```

### applied_jobs
```
id (uuid) - PRIMARY KEY
student_id (uuid) - FK to students.id (needs fix)
opportunity_id (uuid) - FK to opportunities.id ✅
opportunity_id_old (integer) - old ID for reference
... other columns ...
```

## Next Steps

1. **Run**: `fix-student-foreign-keys.sql`
2. **Test**: All features thoroughly
3. **Wait**: 1-2 weeks
4. **Cleanup**: Drop old columns and update indexes
5. **Done**: All tables using UUID! 🎉

---

**Your import feature is ready to use!** The UUID migrations are complete, just need to fix the student foreign keys. 🚀
