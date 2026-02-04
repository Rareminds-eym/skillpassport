# Pending Edit Migration Guide

## Overview
This migration adds a versioning system to keep verified data visible while edits are pending approval.

## What This Does
When a user edits already verified data:
1. The current verified data is preserved in `verified_data` column
2. The new edited data is stored in `pending_edit_data` column
3. `has_pending_edit` flag is set to `true`
4. `approval_status` is set to `'pending'`
5. Dashboard continues to show the verified data until the edit is approved

## How to Run

### Step 1: Run the Migration
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `database/migrations/add_pending_edit_fields.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Step 2: Verify the Migration
Run this query to verify the columns were added:

```sql
-- Check certificates table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'certificates' 
AND column_name IN ('pending_edit_data', 'has_pending_edit', 'verified_data');

-- Check projects table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('pending_edit_data', 'has_pending_edit', 'verified_data');

-- Check experience table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'experience' 
AND column_name IN ('pending_edit_data', 'has_pending_edit', 'verified_data');

-- Check education table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'education' 
AND column_name IN ('pending_edit_data', 'has_pending_edit', 'verified_data');

-- Check skills table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'skills' 
AND column_name IN ('pending_edit_data', 'has_pending_edit', 'verified_data');
```

You should see 3 columns for each table:
- `pending_edit_data` (jsonb)
- `has_pending_edit` (boolean)
- `verified_data` (jsonb)

## What Happens Next

### For Students:
- When they edit verified data, they'll see a "Pending Verification" badge
- The dashboard will continue to show their verified data
- Once approved, the new data will replace the old data

### For Admins/Educators:
- They'll see pending edits in the approval queue
- They can approve or reject the edits
- On approval, the pending data becomes the current data
- On rejection, the pending data is discarded

## Workflow Example

1. **Student has verified certificate**: "AWS Certified Developer"
   - Dashboard shows: "AWS Certified Developer" (Verified)
   
2. **Student edits the certificate**: Changes title to "AWS Certified Developer Associate"
   - Dashboard still shows: "AWS Certified Developer" (Verified)
   - Settings shows: "AWS Certified Developer Associate" (Pending Verification)
   
3. **Admin approves the edit**:
   - Dashboard now shows: "AWS Certified Developer Associate" (Verified)
   - Old data is archived

## Rollback (if needed)
If you need to rollback this migration:

```sql
ALTER TABLE certificates DROP COLUMN IF EXISTS pending_edit_data;
ALTER TABLE certificates DROP COLUMN IF EXISTS has_pending_edit;
ALTER TABLE certificates DROP COLUMN IF EXISTS verified_data;

ALTER TABLE projects DROP COLUMN IF EXISTS pending_edit_data;
ALTER TABLE projects DROP COLUMN IF EXISTS has_pending_edit;
ALTER TABLE projects DROP COLUMN IF EXISTS verified_data;

ALTER TABLE experience DROP COLUMN IF EXISTS pending_edit_data;
ALTER TABLE experience DROP COLUMN IF EXISTS has_pending_edit;
ALTER TABLE experience DROP COLUMN IF EXISTS verified_data;

ALTER TABLE education DROP COLUMN IF EXISTS pending_edit_data;
ALTER TABLE education DROP COLUMN IF EXISTS has_pending_edit;
ALTER TABLE education DROP COLUMN IF EXISTS verified_data;

ALTER TABLE skills DROP COLUMN IF EXISTS pending_edit_data;
ALTER TABLE skills DROP COLUMN IF EXISTS has_pending_edit;
ALTER TABLE skills DROP COLUMN IF EXISTS verified_data;
```

## Next Steps
After running this migration, the code changes will automatically handle the versioning logic.
