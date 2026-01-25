# Automatic Assessment Reset Solution

## Problem
When you delete a result from `personal_assessment_results`, the attempt status remains 'completed', so the dashboard shows "Start Assessment" instead of "Continue Assessment".

## Solution: Database Trigger

We've created a database trigger that automatically resets the attempt status to 'in_progress' whenever a result is deleted.

### Installation

Run `create-auto-reset-trigger.sql` in your Supabase SQL Editor. This will:
1. Create a trigger function `reset_attempt_on_result_delete()`
2. Attach it to the `personal_assessment_results` table
3. Trigger on DELETE operations

### How It Works

```
User deletes result
    ↓
Trigger fires automatically
    ↓
Finds the associated attempt
    ↓
Resets status to 'in_progress'
    ↓
Sets completed_at to NULL
    ↓
Dashboard shows "Continue Assessment"
```

### Testing

1. **Complete an assessment** (creates result)
2. **Delete the result:**
   ```sql
   DELETE FROM personal_assessment_results 
   WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com')
   ORDER BY created_at DESC
   LIMIT 1;
   ```
3. **Check the attempt status:**
   ```sql
   SELECT status, completed_at 
   FROM personal_assessment_attempts
   WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com')
   ORDER BY created_at DESC
   LIMIT 1;
   ```
4. **Result:** Status should be 'in_progress' and completed_at should be NULL
5. **Refresh dashboard** → Should show "Continue Assessment"

### Benefits

✅ **Automatic** - No manual SQL needed after deleting results
✅ **Safe** - Only resets attempts that were 'completed'
✅ **Fast** - Happens instantly when result is deleted
✅ **Consistent** - Works for all users, not just manual deletes
✅ **Developer-friendly** - Makes testing and regeneration easy

### Use Cases

1. **Testing Assessment Flow**
   - Complete assessment
   - Delete result to test regeneration
   - Trigger automatically resets attempt
   - Continue from where you left off

2. **Fixing Bad Results**
   - If AI analysis fails or produces bad results
   - Delete the result
   - Attempt automatically resets
   - Resubmit to regenerate

3. **Development/Debugging**
   - Quickly iterate on result generation
   - Delete and regenerate without manual SQL
   - Speeds up development workflow

### Alternative: Manual Reset (Without Trigger)

If you don't want to use the trigger, you can still manually reset:

```sql
-- Delete result
DELETE FROM personal_assessment_results WHERE id = 'result-id';

-- Reset attempt
UPDATE personal_assessment_attempts
SET status = 'in_progress', completed_at = NULL
WHERE id = 'attempt-id';
```

### Removing the Trigger

If you want to remove the automatic behavior:

```sql
-- Drop the trigger
DROP TRIGGER IF EXISTS auto_reset_attempt_on_result_delete ON personal_assessment_results;

-- Drop the function
DROP FUNCTION IF EXISTS reset_attempt_on_result_delete();
```

### Important Notes

⚠️ **RLS Policies**: Make sure your RLS policies allow:
- SELECT on `personal_assessment_attempts` (to find the attempt)
- UPDATE on `personal_assessment_attempts` (to reset the status)

⚠️ **Cascade Deletes**: If you have cascade delete set up, the trigger will fire before the attempt is deleted.

⚠️ **Bulk Deletes**: The trigger fires for each row deleted, so bulk deletes will reset multiple attempts.

### Monitoring

To see when the trigger fires, check the Supabase logs:
- The trigger raises a NOTICE with the attempt ID
- Look for: "Result deleted for attempt [id]. Attempt reset to in_progress."

### Future Enhancements

Possible improvements:
1. Add a `regeneration_count` column to track how many times a result was regenerated
2. Store the old result in an archive table before deleting
3. Add a time limit (e.g., only allow regeneration within 24 hours)
4. Send a notification when a result is regenerated

## Summary

With this trigger installed:
- ✅ Delete result → Attempt automatically resets to 'in_progress'
- ✅ Dashboard automatically shows "Continue Assessment"
- ✅ No manual SQL needed
- ✅ Works for all users and all scenarios

**Install it once, and it works forever!**
