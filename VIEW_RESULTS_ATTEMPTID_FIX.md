# View Results Button - attemptId Fix ✅

## Problem
The "View Results" button in the student dashboard was not passing the `attemptId` query parameter when navigating to the assessment results page. This caused the results page to fall back to fetching the latest result without the specific attempt context.

## Root Cause
The Dashboard component was navigating to `/student/assessment/result` without including the `attemptId` query parameter, even though the `useAssessmentRecommendations` hook had access to the result data which includes the `attempt_id`.

## Solution

### 1. Updated `useAssessmentRecommendations` Hook
**File**: `src/hooks/useAssessmentRecommendations.js`

Added state to track and return the latest attemptId:

```javascript
// Added new state
const [latestAttemptId, setLatestAttemptId] = useState(null);

// Store the attempt_id when result is fetched
if (result.attempt_id) {
  console.log('✅ Found attempt_id:', result.attempt_id);
  setLatestAttemptId(result.attempt_id);
} else {
  console.warn('⚠️ Result found but no attempt_id');
}

// Return attemptId in hook result
return {
  recommendations,
  loading,
  error,
  hasAssessment: hasCompletedAssessment || !!recommendations,
  hasInProgressAssessment,
  inProgressAttempt,
  latestAttemptId, // NEW: Return the attempt ID
};
```

### 2. Updated Dashboard Component
**File**: `src/pages/student/Dashboard.jsx`

#### Extract attemptId from hook:
```javascript
const {
  recommendations: assessmentRecommendations,
  loading: recommendationsLoading,
  hasAssessment,
  hasInProgressAssessment,
  latestAttemptId, // NEW: Get the attempt ID
} = useAssessmentRecommendations(studentId, !!studentId && !isViewingOthersProfile);
```

#### Updated "View Results" button navigation:
```javascript
<Button
  onClick={() => navigate(
    latestAttemptId 
      ? `/student/assessment/result?attemptId=${latestAttemptId}` 
      : "/student/assessment/result"
  )}
  className="w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 py-4"
>
  <Eye className="w-5 h-5 mr-2" />
  View Results
</Button>
```

## How It Works

### Before Fix:
1. User clicks "View Results" button
2. Navigates to `/student/assessment/result` (no attemptId)
3. Result page falls back to fetching latest result
4. May not load the correct attempt if multiple exist

### After Fix:
1. Dashboard fetches latest assessment result via `useAssessmentRecommendations`
2. Hook extracts and stores `attempt_id` from the result
3. User clicks "View Results" button
4. Navigates to `/student/assessment/result?attemptId=<uuid>`
5. Result page loads the specific attempt directly
6. Faster and more accurate result loading

## Benefits

1. **Correct Attempt Loading**: Always loads the exact attempt that corresponds to the displayed assessment status
2. **Better Performance**: Direct lookup by attemptId is faster than fetching latest
3. **Consistency**: Ensures the dashboard and results page show the same assessment data
4. **Fallback Support**: Still works without attemptId (falls back to latest result)
5. **Future-Proof**: Supports scenarios where users might have multiple completed assessments

## Database Schema Reference

The `personal_assessment_results` table has an `attempt_id` column that links to `personal_assessment_attempts`:

```sql
-- personal_assessment_results table
CREATE TABLE personal_assessment_results (
  id UUID PRIMARY KEY,
  attempt_id UUID REFERENCES personal_assessment_attempts(id),
  student_id UUID REFERENCES students(id),
  status TEXT,
  gemini_results JSONB,
  -- ... other fields
);
```

## Testing Checklist

- [x] Hook returns attemptId when result exists
- [x] Dashboard extracts attemptId from hook
- [x] "View Results" button includes attemptId in URL
- [x] Results page receives and uses attemptId parameter
- [x] Fallback works when attemptId is not available
- [ ] Test with user who has completed assessment
- [ ] Verify correct attempt loads on results page
- [ ] Check browser console for attemptId logs

## Files Modified

1. `src/hooks/useAssessmentRecommendations.js`
   - Added `latestAttemptId` state
   - Extract and store `attempt_id` from result
   - Return `latestAttemptId` in hook result

2. `src/pages/student/Dashboard.jsx`
   - Extract `latestAttemptId` from hook
   - Update "View Results" button to include attemptId in navigation URL

## Related Files (No Changes Needed)

- `src/features/assessment/assessment-result/hooks/useAssessmentResults.js` - Already handles attemptId from URL params
- `src/services/assessmentService.js` - `getLatestResult` already returns attempt_id field

---

**Fix Date**: January 18, 2026
**Issue**: View Results button not passing attemptId
**Status**: ✅ Fixed
**Branch**: `fix/Assigment-Evaluation`
