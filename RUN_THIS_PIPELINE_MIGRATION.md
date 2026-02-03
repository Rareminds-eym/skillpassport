# 🚀 Pipeline Migration - Simple Guide

## What You Need to Do

Run **ONE** SQL file in your Supabase SQL Editor:

```sql
migrate-pipeline-complete.sql
```

That's it! This single file does everything:
- ✅ Creates automatic backup
- ✅ Migrates opportunity_id to UUID
- ✅ Updates all constraints
- ✅ Fixes the view
- ✅ Verifies everything worked

## Step-by-Step

### 1. Open Supabase SQL Editor
Go to your Supabase dashboard → SQL Editor

### 2. Copy & Paste
Open `migrate-pipeline-complete.sql` and copy all the content

### 3. Run It
Click "Run" button

### 4. Watch the Progress
You'll see messages like:
```
📦 Creating backup table...
✅ Backup created: 150 records
🔧 Adding new UUID column...
🔄 Populating UUID values...
✅ All records matched successfully
...
🎉 MIGRATION COMPLETED SUCCESSFULLY!
```

### 5. Verify Success
At the end, you should see:
- Column type is now UUID ✅
- All records have UUIDs ✅
- View works ✅
- Constraints created ✅

## If Something Goes Wrong

Run the rollback script:
```sql
rollback-pipeline-migration.sql
```

This will restore everything to how it was before.

## After Migration

Test these features:
1. Open Pipeline page
2. Try adding a candidate
3. Try moving a candidate between stages
4. Check Applicants list

All should work without errors!

## Files Reference

| File | Purpose |
|------|---------|
| `migrate-pipeline-complete.sql` | **RUN THIS** - Does everything |
| `rollback-pipeline-migration.sql` | Emergency rollback if needed |
| `backup-pipeline-candidates.sql` | Manual backup (optional) |
| `PIPELINE_CANDIDATES_UUID_MIGRATION.md` | Detailed documentation |

## Expected Time
⏱️ 2-5 minutes depending on data size

## Risk Level
🟢 **LOW** - Has automatic backup and rollback plan

## Questions?
Check `PIPELINE_CANDIDATES_UUID_MIGRATION.md` for detailed info.
