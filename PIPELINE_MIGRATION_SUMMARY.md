# Pipeline Migration Summary

## Current Situation
❌ Pipeline features are broken with errors:
- "invalid input syntax for type integer: [UUID]"
- "duplicate key value violates unique constraint"
- Cannot view candidates
- Cannot add candidates
- Cannot move candidates

## Root Cause
The `pipeline_candidates` table still uses `integer` for `opportunity_id`, but the `opportunities` table was migrated to UUID.

## Solution
Run the migration script to convert `pipeline_candidates.opportunity_id` to UUID.

## Quick Start

### Option 1: All-in-One (Recommended) ⭐
```sql
-- Run this ONE file - it does everything
migrate-pipeline-complete.sql
```

### Option 2: Step-by-Step
```sql
-- 1. Backup first
backup-pipeline-candidates.sql

-- 2. Check dependencies
check-pipeline-dependencies.sql

-- 3. Run migration
migrate-pipeline-candidates-to-uuid.sql

-- 4. Fix view
fix-pipeline-candidates-view-uuid.sql
```

## What Gets Changed

### Before Migration
```sql
pipeline_candidates
├── opportunity_id: integer (❌ incompatible with UUID)
└── Foreign key → opportunities.id_old
```

### After Migration
```sql
pipeline_candidates
├── opportunity_id: uuid (✅ compatible)
├── opportunity_id_old: integer (backup)
└── Foreign key → opportunities.id
```

## Safety Features

1. **Automatic Backup**: Creates `pipeline_candidates_backup_20250123`
2. **Rollback Script**: `rollback-pipeline-migration.sql` if needed
3. **Verification**: Checks all data migrated correctly
4. **Non-Destructive**: Keeps old column as backup

## Files Created

### Migration Files
- ✅ `migrate-pipeline-complete.sql` - **Main migration (run this)**
- ✅ `backup-pipeline-candidates.sql` - Manual backup
- ✅ `rollback-pipeline-migration.sql` - Emergency rollback
- ✅ `check-pipeline-dependencies.sql` - Pre-migration check
- ✅ `migrate-pipeline-candidates-to-uuid.sql` - Step-by-step migration
- ✅ `fix-pipeline-candidates-view-uuid.sql` - View update

### Documentation
- ✅ `RUN_THIS_PIPELINE_MIGRATION.md` - Simple guide
- ✅ `PIPELINE_CANDIDATES_UUID_MIGRATION.md` - Detailed guide
- ✅ `URGENT_PIPELINE_FIX_NEEDED.md` - Problem description
- ✅ `PIPELINE_MIGRATION_SUMMARY.md` - This file

### Code Updates (Already Done)
- ✅ `src/services/pipelineService.ts` - Handles both number and UUID
- ✅ `PIPELINE_UUID_TYPE_FIX.md` - Service documentation

## Expected Results

After running the migration:

### Database
- ✅ `pipeline_candidates.opportunity_id` is UUID type
- ✅ Foreign key points to `opportunities.id` (UUID)
- ✅ View `pipeline_candidates_detailed` works
- ✅ All existing data preserved

### Application
- ✅ Pipeline page loads without errors
- ✅ Can add candidates to pipeline
- ✅ Can move candidates between stages
- ✅ Applicants list works
- ✅ No more type mismatch errors

## Testing Checklist

After migration, verify:
- [ ] Pipeline page loads
- [ ] Can view candidates in each stage
- [ ] Can add candidate from talent pool
- [ ] Can move candidate between stages
- [ ] Can reject candidate
- [ ] Applicants list loads
- [ ] No console errors

## Timeline
- **Preparation**: 2 minutes (read this doc)
- **Execution**: 2-5 minutes (run SQL)
- **Verification**: 2 minutes (test features)
- **Total**: ~10 minutes

## Support
If you encounter issues:
1. Check error messages in SQL editor
2. Review `PIPELINE_CANDIDATES_UUID_MIGRATION.md`
3. Run `rollback-pipeline-migration.sql` if needed
4. Restore from backup table if necessary

## Next Steps
1. ✅ Read `RUN_THIS_PIPELINE_MIGRATION.md`
2. ✅ Run `migrate-pipeline-complete.sql`
3. ✅ Test pipeline features
4. ✅ Celebrate! 🎉
