# 🚀 Start Here - Pipeline Fix

## You Got a "Column Already Exists" Error?

No problem! This means the migration was partially run. Here's how to fix it:

## Step 1: Clean Up (Optional but Recommended)

Run this first to reset to a clean state:
```sql
cleanup-pipeline-partial-migration.sql
```

## Step 2: Run the Idempotent Migration

This version is safe to run multiple times:
```sql
migrate-pipeline-idempotent.sql
```

**Why this one?**
- ✅ Checks state before each step
- ✅ Skips steps already completed
- ✅ Safe to run multiple times
- ✅ Handles partial migrations
- ✅ Won't error on existing columns

## What It Does

The script will:
1. Check what's already done
2. Skip completed steps
3. Complete remaining steps
4. Verify everything worked

## Expected Output

You'll see messages like:
```
✅ Backup already exists
✅ opportunity_id_new already exists
🔄 Populating X records...
✅ All records matched successfully
🔄 Renaming columns...
✅ Columns renamed
✅ Foreign key added
✅ MIGRATION COMPLETED!
```

## If You Want a Fresh Start

1. Run cleanup script first:
```sql
cleanup-pipeline-partial-migration.sql
```

2. Then run idempotent migration:
```sql
migrate-pipeline-idempotent.sql
```

## Files Summary

| File | When to Use |
|------|-------------|
| `cleanup-pipeline-partial-migration.sql` | Reset partial migration |
| `migrate-pipeline-idempotent.sql` | **RUN THIS** - Safe migration |
| `migrate-pipeline-complete.sql` | Original (use idempotent instead) |
| `migrate-pipeline-simple-fix.sql` | Alternative simple version |

## After Migration

Test these:
1. Open Pipeline page
2. Add a candidate
3. Move candidate between stages
4. Check Applicants list

All should work! 🎉

## Still Having Issues?

Run the diagnostic:
```sql
diagnose-type-mismatch.sql
```

This will show you exactly what state your tables are in.
