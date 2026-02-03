# Skills Table Migration - Add Enabled Column

## Issue
The Skills hide/show functionality is not working because the `enabled` column is missing from the `skills` table in the database. When you hide a skill, it disappears temporarily but reappears after refreshing the page.

## Solution
Run the migration script to add the `enabled` column to the skills table.

## How to Run the Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `database/migrations/add_enabled_to_skills.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

### Option 2: Copy and Paste This SQL
```sql
-- Add enabled column to skills table
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN skills.enabled IS 'Controls visibility of skill item on profile. Default is true (visible).';

-- Update existing records to have enabled = true
UPDATE skills 
SET enabled = true 
WHERE enabled IS NULL;
```

### Option 3: Using psql Command Line
```bash
psql -h your-db-host -U your-db-user -d your-db-name -f database/migrations/add_enabled_to_skills.sql
```

## What This Migration Does
1. Adds `enabled` column (BOOLEAN, default: true) to the `skills` table
2. Sets all existing records to `enabled = true` for backward compatibility
3. Adds a comment explaining the column's purpose

## After Running the Migration
1. The hide/show toggle for skills will work correctly
2. Hidden skills (enabled = false) will not appear on the dashboard or profile
3. Hidden skills will still be visible in the edit modal so they can be unhidden
4. Changes will persist after page refresh

## Verification
After running the migration, you can verify it worked by:
1. Going to the Settings page
2. Opening the Skills edit modal
3. Toggling the visibility (eye icon) of a skill
4. Clicking "Save All Changes"
5. Refreshing the page
6. The hidden skill should remain hidden on the dashboard
7. Opening the edit modal again - the hidden skill should still be there with an "EyeOff" icon

## Rollback (if needed)
If you need to rollback this migration:
```sql
ALTER TABLE skills DROP COLUMN IF EXISTS enabled;
```

## Note
This migration is similar to the one we ran for the `experience` table. Both tables now support the hide/show functionality.
