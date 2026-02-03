# Quick Test Guide - Soft Skills Modal

## What Was Fixed

Fixed the issue where soft skills weren't showing in the edit modal even after being added.

## Changes Made

### 1. Updated Skill Fetching Logic
- Changed default `approval_status` from `'pending'` to `'approved'` for backward compatibility
- Changed `enabled` handling to gracefully handle missing column: `skill.enabled !== undefined ? skill.enabled : true`
- This ensures skills added before these columns existed will still show up

### 2. Files Modified
- `src/services/studentServiceProfile.js` (2 changes: technical skills + soft skills)

## Testing Steps

### Step 1: Clear Cache and Refresh
1. Open your browser
2. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
3. Clear cached images and files
4. Close the dialog
5. Refresh the page (`F5` or `Cmd+R`)

### Step 2: Test the Modal
1. Go to Dashboard
2. Scroll to the "Soft Skills" card
3. Click the **eye icon** (👁️) in the top right of the card
4. The modal should open and show your skills

### Step 3: Verify Skills Appear
- ✅ **Expected**: All your soft skills should appear in the modal
- ❌ **If not**: See troubleshooting below

### Step 4: Add a New Skill (Optional)
1. In the modal, scroll down to "Add New Skill"
2. Enter a skill name (e.g., "Communication")
3. Select proficiency level
4. Click "Add Skill"
5. Click "Save All Changes"
6. Refresh the page
7. Open the modal again
8. Verify the new skill appears

## Troubleshooting

### If Skills Still Don't Show

#### Option 1: Check Browser Console
1. Press `F12` to open DevTools
2. Go to the "Console" tab
3. Look for any red error messages
4. Take a screenshot and share it

#### Option 2: Check Database
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select the `skills` table
4. Filter by:
   - `type` = `soft`
   - `student_id` = your student ID
5. Verify skills exist in the database
6. Check the `enabled` and `approval_status` columns

#### Option 3: Check Network Request
1. Press `F12` to open DevTools
2. Go to the "Network" tab
3. Refresh the page
4. Look for a request to fetch student data
5. Click on it and check the "Response" tab
6. Look for `softSkills` in the response
7. Verify skills are being returned

### Common Issues

**Issue**: Modal shows "No skills added yet"
**Cause**: Skills might have `approval_status: 'pending'` in the database
**Solution**: The code fix should handle this, but if not, run this SQL in Supabase:
```sql
UPDATE skills 
SET approval_status = 'approved' 
WHERE type = 'soft' 
AND (approval_status IS NULL OR approval_status = 'pending');
```

**Issue**: Skills disappear after page refresh
**Cause**: The `enabled` column doesn't exist in the database
**Solution**: Run the migration in `database/migrations/add_enabled_to_skills.sql`

**Issue**: Hide/Show toggle doesn't work
**Cause**: The `enabled` column doesn't exist in the database
**Solution**: Run the migration (see `RUN_SKILLS_MIGRATION.md`)

## Next Steps

1. ✅ Test the modal (follow steps above)
2. ⏳ If working: Run the migration to enable hide/show feature
3. ⏳ If not working: Share console errors or database screenshots

## Migration (Optional but Recommended)

To enable the hide/show feature for skills:

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Click "New Query"
4. Copy and paste from `database/migrations/add_enabled_to_skills.sql`:
   ```sql
   ALTER TABLE skills ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
   ```
5. Click "Run"
6. Verify: `Success. No rows returned`

---

**Status**: Code fixes applied. Ready for testing.
**Expected Result**: Soft skills should now appear in the edit modal.
