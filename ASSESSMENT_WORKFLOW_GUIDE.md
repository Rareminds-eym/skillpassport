# Assessment Workflow Guide

## Understanding Assessment States

The dashboard button changes based on the database state:

### 1. "Start Assessment" (Blue Button)
**Database State:**
- No attempts exist, OR
- All attempts have status = 'abandoned'
- No completed results exist

### 2. "Continue Assessment" (Orange Button)  
**Database State:**
- At least one attempt with status = 'in_progress'
- No completed results exist (or result was deleted)

### 3. "View Results" (Green Button)
**Database State:**
- At least one completed result exists in `personal_assessment_results`
- (Attempt status doesn't matter when result exists)

## Assessment Lifecycle

```
Start Assessment
    ↓
[Creates attempt with status='in_progress']
    ↓
Answer questions
    ↓
Submit assessment
    ↓
[Updates attempt status to 'completed']
[Creates result in personal_assessment_results]
    ↓
View Results
```

## How to Reset to "Continue" State

If you want to regenerate a result (for testing or fixing issues):

### Option 1: Using SQL Script (Recommended)
Run `quick-reset-to-continue.sql` in Supabase SQL Editor:
- Deletes the result
- Resets attempt status to 'in_progress'
- Keeps all your responses intact

### Option 2: Manual Steps
1. Delete the row from `personal_assessment_results`
2. Update the attempt in `personal_assessment_attempts`:
   ```sql
   UPDATE personal_assessment_attempts
   SET status = 'in_progress', completed_at = NULL
   WHERE id = 'your-attempt-id';
   ```
3. Hard refresh the dashboard (Ctrl+Shift+R)

## Common Issues

### Issue: Deleted result but still shows "Start Assessment"
**Cause:** The attempt status is still 'completed'
**Fix:** Reset the attempt status to 'in_progress' using the SQL script above

### Issue: Shows "Start Assessment" even with in-progress attempt
**Cause:** 
- studentId is not being passed correctly
- RLS policies blocking the query
- Caching issue

**Fix:**
1. Check browser console for logs starting with 🔍
2. Hard refresh (Ctrl+Shift+R)
3. Clear localStorage: `localStorage.clear()` in console
4. Verify RLS policies allow SELECT on attempts table

### Issue: Shows "Continue" but want to start fresh
**Fix:** 
1. Delete or abandon the in-progress attempt:
   ```sql
   UPDATE personal_assessment_attempts
   SET status = 'abandoned'
   WHERE id = 'your-attempt-id';
   ```
2. Refresh dashboard

## Database Schema Reference

### personal_assessment_attempts
- `status` values: 'in_progress', 'completed', 'abandoned'
- `completed_at`: NULL for in-progress, timestamp for completed

### personal_assessment_results
- Only created when assessment is submitted
- `status`: 'completed'
- Linked to attempt via `attempt_id`

## Testing Workflow

### Test "Continue Assessment" Flow:
1. Start an assessment
2. Answer a few questions
3. Navigate away (don't complete)
4. Return to dashboard → Should show "Continue Assessment"
5. Click Continue → Should resume from where you left off

### Test "Regenerate Result" Flow:
1. Complete an assessment
2. View the result
3. Run `quick-reset-to-continue.sql`
4. Refresh dashboard → Should show "Continue Assessment"
5. Click Continue → Should go to last question
6. Submit → Generates new result

### Test "Fresh Start" Flow:
1. If you have any attempts, abandon them:
   ```sql
   UPDATE personal_assessment_attempts
   SET status = 'abandoned'
   WHERE student_id = 'your-student-id';
   ```
2. Delete any results
3. Refresh dashboard → Should show "Start Assessment"

## Quick Reference SQL Queries

### Check your current state:
```sql
-- Your attempts
SELECT id, status, grade_level, created_at, completed_at
FROM personal_assessment_attempts
WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com')
ORDER BY created_at DESC;

-- Your results
SELECT id, status, created_at
FROM personal_assessment_results
WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com')
ORDER BY created_at DESC;
```

### Reset to "Continue" state:
```sql
-- See quick-reset-to-continue.sql
```

### Reset to "Start" state:
```sql
-- Abandon all attempts
UPDATE personal_assessment_attempts
SET status = 'abandoned'
WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com');

-- Delete all results
DELETE FROM personal_assessment_results
WHERE student_id = (SELECT id FROM students WHERE email = 'your-email@example.com');
```
