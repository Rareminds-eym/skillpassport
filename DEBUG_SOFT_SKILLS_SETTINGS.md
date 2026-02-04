# Debug Soft Skills in Settings

## Issue
Soft skills show in the edit modal but not in the Settings page soft skills section.

## Changes Made

### 1. Added Debug Logging
Added console logging to `SoftSkillsTab.jsx` to help diagnose the issue:
- Logs the `softSkillsData` received by the component
- Logs the filtered skills after applying the `enabled !== false` filter

### 2. Verified Filtering Logic
The filtering logic in `SoftSkillsTab.jsx` is correct:
```javascript
const filteredSkills = (softSkillsData || []).filter(
  (skill) => skill.enabled !== false
);
```

This should show ALL skills (including pending ones) as long as they're not explicitly disabled.

## Testing Steps

1. **Clear Browser Cache**:
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cached images and files
   - Close the dialog

2. **Refresh the Page**:
   - Press `F5` or `Cmd+R`
   - This will load the updated code with the `type: 'soft'` fix

3. **Open Browser Console**:
   - Press `F12` to open DevTools
   - Go to the "Console" tab

4. **Navigate to Settings**:
   - Go to Settings → Profile tab
   - Scroll to the "Soft Skills" section

5. **Check Console Logs**:
   Look for these log messages:
   ```
   🔍 SoftSkillsTab: softSkillsData received: [...]
   🔍 SoftSkillsTab: softSkillsData length: X
   🔍 SoftSkillsTab: softSkillsData items: {...}
   🔍 SoftSkillsTab: filteredSkills: [...]
   🔍 SoftSkillsTab: filteredSkills length: X
   ```

6. **Analyze the Logs**:
   - If `softSkillsData length: 0` → Data isn't being fetched from database
   - If `softSkillsData length: 1` but `filteredSkills length: 0` → Skill is being filtered out (check `enabled` field)
   - If both lengths are 1 → Skill should be visible (check if it's rendering)

## Expected Behavior

After refreshing:
- The soft skills section should show your "tests" skill
- It should have a "Pending Verification" badge (yellow)
- You should be able to click "Edit" to open the modal

## Possible Issues

### Issue 1: Data Not Fetched
**Symptom**: `softSkillsData length: 0`
**Cause**: Skills not being fetched from database or `type` field still incorrect
**Solution**: 
1. Check if you refreshed the page after the code fix
2. Check the Network tab to see if the student data request includes skills
3. Verify in Supabase that the skill exists with `type = 'soft'`

### Issue 2: Skill Filtered Out
**Symptom**: `softSkillsData length: 1` but `filteredSkills length: 0`
**Cause**: Skill has `enabled: false`
**Solution**: 
1. Check the console log for the skill object
2. Look for the `enabled` field value
3. If it's `false`, the skill was explicitly hidden

### Issue 3: Skill Not Rendering
**Symptom**: Both lengths are 1 but skill not visible
**Cause**: Rendering issue in the component
**Solution**: Check for JavaScript errors in the console

## Database Check

If the issue persists, check the database directly:

1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select the `skills` table
4. Filter by:
   - `type` = `soft`
   - `student_id` = your student ID
5. Check the values:
   - `name`: Should be "tests"
   - `type`: Should be "soft" (not "tests")
   - `enabled`: Should be `true` or `null`
   - `approval_status`: Should be "pending"

## Quick Fix SQL

If the `type` field is still wrong in the database, run this SQL:

```sql
UPDATE skills 
SET type = 'soft' 
WHERE type NOT IN ('soft', 'technical') 
AND student_id = 'YOUR_STUDENT_ID';
```

Replace `YOUR_STUDENT_ID` with your actual student ID.

---

**Next Steps**: 
1. Clear cache and refresh
2. Check console logs
3. Share the console output if the issue persists
