# Resume Assessment - Out of Bounds Question Index Fix

## Issue
When resuming an assessment, if the saved question index is out of bounds (e.g., question 48 when section only has 48 questions indexed 0-47), the screen would show nothing because the question doesn't exist.

## Root Cause

### The Problem
From the console logs:
```
📍 Resuming from section: 0 question: 48
✅ Sections built, restoring position: {sectionIndex: 0, questionIndex: 48, sectionsCount: 5, sectionId: 'riasec', ...}
✅ useEffect: Screen set to assessment (mid-section)
```

But RIASEC section has 48 questions with indices 0-47. Question index 48 doesn't exist!

### Why This Happens
When a user completes the last question of a section:
1. They answer question 47 (last question)
2. Click "Next"
3. `goToNextQuestion()` increments to question 48
4. Detects end of section
5. Shows section complete screen
6. **But saves position as question 48** before showing complete screen

When resuming:
1. Tries to restore to question 48
2. Question 48 doesn't exist
3. Question renderer fails
4. Screen shows nothing

## Solution

Added bounds checking when resuming. If question index is out of bounds:
1. Set to last valid question (questionCount - 1)
2. Show assessment screen briefly
3. Immediately call `completeSection()` to show section complete screen

```typescript
// Check if question index is out of bounds
const questionCount = targetSection?.questions?.length || 0;
if (questionIndex >= questionCount) {
  console.warn(`⚠️ Question index ${questionIndex} is out of bounds`);
  console.log('✅ Moving to section complete screen');
  
  flow.setCurrentQuestionIndex(questionCount - 1); // Last valid question
  flow.setShowSectionIntro(false);
  flow.setCurrentScreen('assessment');
  
  // Immediately show section complete
  setTimeout(() => {
    flow.completeSection();
  }, 100);
}
```

## Changes Made

### File: `src/features/assessment/career-test/AssessmentTestPage.tsx`

**Updated in 2 places**:

1. **handleResumeAssessment()** - Immediate restore path
2. **useEffect (restore after sections built)** - Delayed restore path

Both now check if `questionIndex >= questionCount` and handle it gracefully.

## How It Works Now

### Scenario: Resume at Out of Bounds Index

**Before Fix**:
```
1. Resume at question 48
2. RIASEC has 48 questions (0-47)
3. Try to render question 48
4. Question doesn't exist
5. ❌ Screen shows nothing
```

**After Fix**:
```
1. Resume at question 48
2. RIASEC has 48 questions (0-47)
3. Detect out of bounds: 48 >= 48
4. Set to question 47 (last valid)
5. Show assessment screen briefly
6. Call completeSection()
7. ✅ Show section complete screen
8. User can continue to next section
```

## Console Output

### Success:
```
📍 Resuming from section: 0 question: 48
✅ Sections built, restoring position: {sectionIndex: 0, questionIndex: 48, ...}
⚠️ Question index 48 is out of bounds (section has 48 questions)
✅ Moving to section complete screen
✅ useEffect: Screen set to assessment (mid-section)
🔄 completeSection called
✅ Setting showSectionComplete to true
```

## Edge Cases Handled

### 1. Last Question of Section
- Question index = questionCount (e.g., 48 when count is 48)
- Shows section complete screen
- User can proceed to next section

### 2. Way Out of Bounds
- Question index > questionCount (e.g., 100 when count is 48)
- Same handling - shows section complete
- Prevents crash

### 3. Valid Question Index
- Question index < questionCount
- Normal resume behavior
- Shows the exact question

## Testing

### Test Steps:
1. Start assessment
2. Complete all questions in first section
3. Click "Next" on last question
4. Refresh page before clicking "Continue"
5. Click "Resume Assessment"
6. Verify:
   - ✅ Section complete screen shows
   - ✅ Can click "Continue" to next section
   - ✅ No blank screen
   - ✅ No errors in console

### Database State to Test:
```sql
UPDATE personal_assessment_attempts
SET current_question_index = 48
WHERE id = '<attempt-id>';
```

Then resume and verify it handles gracefully.

## Why setTimeout?

We use `setTimeout(() => flow.completeSection(), 100)` because:
1. Need to set screen to 'assessment' first
2. React needs time to render the assessment screen
3. Then we can transition to section complete
4. Without timeout, state updates might conflict

## Related Issues

This fix also handles:
- ✅ Resume after auto-fill (which might save out-of-bounds indices)
- ✅ Resume after test mode skip buttons
- ✅ Resume after database corruption
- ✅ Resume with invalid saved state

## Benefits

✅ **No Blank Screen**: Always shows appropriate screen
✅ **Graceful Degradation**: Handles invalid data gracefully
✅ **Better UX**: User can continue from where they left off
✅ **Prevents Crashes**: Bounds checking prevents undefined errors

## Related Documentation
- [RESUME_SCREEN_FIX.md](./RESUME_SCREEN_FIX.md) - Screen not showing fix
- [REAL_TIME_RESPONSE_SAVING.md](./REAL_TIME_RESPONSE_SAVING.md) - How progress is saved

## Status
✅ **FIXED** - Resume now handles out-of-bounds question indices gracefully

**Date**: January 17, 2026
