# Assessment "Continue" Button Fix

## Problem
The dashboard was showing "Start Assessment" even when there was an in-progress assessment attempt in the database. It should have shown "Continue Assessment" instead.

## Root Cause
The `getInProgressAttempt()` and `getLatestResult()` functions in `assessmentService.js` were not robust enough to handle both:
1. `student.id` (from the students table)
2. `user_id` (from auth.users)

Different parts of the application pass different IDs, causing lookups to fail silently.

## Solution

### 1. Enhanced `getInProgressAttempt()` Function
**File:** `src/services/assessmentService.js`

The function now:
- First tries direct lookup with the provided ID (assuming it's `student.id`)
- If not found, tries to look up the student by `user_id` and then queries again
- Returns `null` gracefully if no attempt is found
- Logs helpful debug messages

### 2. Enhanced `getLatestResult()` Function
**File:** `src/services/assessmentService.js`

The function now:
- First tries direct lookup with the provided ID (assuming it's `student.id`)
- If not found, tries to look up the student by `user_id` and then queries again
- Returns `null` gracefully if no result is found
- Logs helpful debug messages

### 3. Improved Hook Logging
**File:** `src/hooks/useAssessmentRecommendations.js`

Added console logging to help debug issues:
- Logs when checking for in-progress attempts
- Logs the student ID being used
- Logs the results of the lookup

### 4. Removed Duplicate Logic
Removed the duplicate fallback logic from the hook since the service functions now handle both ID types.

## Testing

### To Test In-Progress Detection:
1. Start an assessment but don't complete it
2. Navigate away from the assessment page
3. Go back to the dashboard
4. You should see "Continue Assessment" button (orange/amber colored)

### To Test Completed Assessment:
1. Complete an assessment
2. Go to the dashboard
3. You should see "View Results" button (green colored)

### To Test Fresh Start:
1. Clear all assessment data (use the dev menu option)
2. Go to the dashboard
3. You should see "Start Assessment" button (blue colored)

## Database Schema Requirements

The fix assumes the following schema:

### `students` table:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to auth.users

### `personal_assessment_attempts` table:
- `id` (UUID) - Primary key
- `student_id` (UUID) - Foreign key to students.id
- `status` (text) - 'in_progress', 'completed', or 'abandoned'

### `personal_assessment_results` table:
- `id` (UUID) - Primary key
- `student_id` (UUID) - Foreign key to students.id
- `status` (text) - 'completed'

## Button States

The dashboard now correctly shows:

1. **"Start Assessment"** (Blue) - No assessment data exists
2. **"Continue Assessment"** (Amber/Orange) - In-progress attempt exists, no completed result
3. **"View Results"** (Green) - Completed result exists

## Debug Queries

Use these SQL queries to debug issues:

```sql
-- Check for in-progress attempts
SELECT * FROM personal_assessment_attempts 
WHERE status = 'in_progress' 
ORDER BY created_at DESC;

-- Check for completed results
SELECT * FROM personal_assessment_results 
WHERE status = 'completed' 
ORDER BY created_at DESC;

-- Check student record
SELECT id, user_id, email FROM students 
WHERE email = 'your-email@example.com';
```

## Console Logs to Watch

When the dashboard loads, check the browser console for:
- `🔍 useAssessmentRecommendations: Checking for student: [id]`
- `🔍 Calling getInProgressAttempt with studentId: [id]`
- `✅ Found in-progress attempt: [attempt-id]` OR `❌ No in-progress attempt found`
- `✅ Found assessment result` OR `❌ No completed assessment result found`

## Future Improvements

1. Add a unified ID resolution service that all functions can use
2. Cache the student.id lookup to avoid repeated queries
3. Add better error handling for network failures
4. Consider using RLS policies to automatically filter by auth.uid()
