# Assessment One-Time Only Feature ✅

## What Was Implemented

Students can only take each external course assessment **once**. After completion, the assessment button changes to "Completed" and they cannot retake it.

## Changes Made

### 1. ✅ Database Constraint
**File:** `database/create_assessment_attempts_table.sql`

Added unique constraint:
```sql
CREATE UNIQUE INDEX idx_external_assessment_one_per_course 
  ON external_assessment_attempts(student_id, course_name);
```

This prevents duplicate attempts at the database level.

### 2. ✅ Assessment Service
**File:** `src/services/externalAssessmentService.js`

Created service with functions:
- `checkAssessmentCompleted()` - Check if student completed assessment
- `saveAssessmentAttempt()` - Save attempt (prevents duplicates)
- `getAssessmentHistory()` - Get all attempts
- `getAssessmentByCourse()` - Get specific course attempt

### 3. ✅ UI Update
**File:** `src/components/Students/components/ModernLearningCard.jsx`

**Before:**
- Always shows "Assessment" button

**After:**
- Checks if assessment completed on load
- Shows "Completed ✓" badge if done
- Shows "Assessment" button if not done

## How It Works

### Flow:
```
1. Student opens My Learning page
   ↓
2. For each external course:
   - Check database for completed assessment
   ↓
3. If completed:
   - Show green "Completed ✓" badge
   - Disable assessment button
   ↓
4. If not completed:
   - Show blue "Assessment" button
   - Allow taking assessment
   ↓
5. After completing assessment:
   - Save to database
   - Button changes to "Completed ✓"
   - Cannot retake
```

## UI States

### Not Completed:
```
┌─────────────────────────────────┐
│  [Assessment] ← Blue button     │
└─────────────────────────────────┘
```

### Completed:
```
┌─────────────────────────────────┐
│  [✓ Completed] ← Green badge    │
└─────────────────────────────────┘
```

## Setup Instructions

### Step 1: Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste `database/create_assessment_attempts_table.sql`
3. Run the SQL

### Step 2: Test the Feature
1. Take an assessment for a course
2. Complete it
3. Go back to My Learning
4. Button should now show "Completed ✓"
5. Try clicking - nothing happens (disabled)

## Error Handling

### Duplicate Attempt:
If someone tries to submit twice (race condition), the database will reject it:
```javascript
{
  success: false,
  error: 'You have already completed this assessment'
}
```

### Network Issues:
If check fails, defaults to showing the button (fail-safe).

## Benefits

✅ **Fair Assessment:** Each student gets one attempt
✅ **Prevents Cheating:** Can't retake for better score
✅ **Clear Status:** Visual indicator of completion
✅ **Database Enforced:** Can't bypass with code
✅ **User Friendly:** Clear "Completed" badge

## Future Enhancements

### Option 1: Allow Retakes After Time Period
```sql
-- Allow retake after 30 days
WHERE completed_at < NOW() - INTERVAL '30 days'
```

### Option 2: Allow Retakes with Lower Score
```sql
-- Only show completed if score >= 60%
WHERE score >= 60
```

### Option 3: Show Score on Badge
```jsx
<div className="...">
  <CheckCircle className="w-4 h-4" />
  Completed ({score}%)
</div>
```

### Option 4: View Results Button
```jsx
{assessmentCompleted && (
  <button onClick={() => navigate('/assessment/results')}>
    View Results
  </button>
)}
```

## Query Examples

### Check if student completed course:
```javascript
const { completed, attempt } = await checkAssessmentCompleted(
  studentId, 
  "React Development"
);

if (completed) {
  console.log('Score:', attempt.score);
  console.log('Completed:', attempt.completed_at);
}
```

### Get all completed assessments:
```javascript
const history = await getAssessmentHistory(studentId);
console.log('Completed courses:', history.length);
```

## Summary

✅ **Database table created** with unique constraint
✅ **Service functions** for checking/saving attempts
✅ **UI updated** to show completion status
✅ **One attempt per course** enforced
✅ **Clear visual feedback** with badges

**Result:** Students can only take each assessment once, with clear visual indication of completion! 🎯
