# Experience Table Migration - Add Enabled Column

## Issue
The Experience card hide/show functionality was not working because the `enabled` column was missing from the `experience` table in the database.

## Solution
Run the migration script to add the `enabled` and `approval_status` columns to the experience table.

## How to Run the Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `database/migrations/add_enabled_to_experience.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

### Option 2: Using psql Command Line
```bash
psql -h your-db-host -U your-db-user -d your-db-name -f database/migrations/add_enabled_to_experience.sql
```

### Option 3: Using Supabase CLI
```bash
supabase db push
```

## What This Migration Does
1. Adds `enabled` column (BOOLEAN, default: true) to the `experience` table
2. Adds `approval_status` column (TEXT, default: 'pending') if it doesn't exist
3. Sets all existing records to `enabled = true` and `approval_status = 'approved'` for backward compatibility

## After Running the Migration
1. The hide/show toggle for experience cards will work correctly
2. Hidden experiences (enabled = false) will not appear on the dashboard
3. Hidden experiences will still be visible in the edit modal so they can be unhidden
4. Changes will persist after page refresh

## Verification
After running the migration, you can verify it worked by:
1. Going to the Settings page
2. Opening the Experience edit modal
3. Toggling the visibility (eye icon) of an experience
4. Clicking "Save All Changes"
5. Refreshing the page
6. The hidden experience should remain hidden

## Rollback (if needed)
If you need to rollback this migration:
```sql
ALTER TABLE experience DROP COLUMN IF EXISTS enabled;
ALTER TABLE experience DROP COLUMN IF EXISTS approval_status;
```
