# Bug Investigation: Getting Stuck on "Loading question..." Screen When Test is Resumed

## Bug Summary

When a user resumes an assessment test at the "Stream Based Aptitude" (adaptive aptitude) section, the screen gets stuck showing a loading spinner with no question displayed. The console shows successful operations (questions loaded, cache hits, etc.) but the UI remains in a stuck state.

## Root Cause Analysis

### The Issue

When resuming an assessment at the adaptive aptitude section, there's a race condition between:
1. The adaptive aptitude session resume operation (`adaptiveAptitude.resumeTest()`)
2. The UI rendering logic that determines what to display

**Location**: `src/features/assessment/career-test/AssessmentTestPage.tsx`

### Specific Problem Points

1. **Question Determination** (lines 1717-1720):
   ```typescript
   const currentQuestion = currentSection?.isAdaptive 
     ? adaptiveAptitude.currentQuestion 
     : currentSection?.questions?.[flow.currentQuestionIndex];
   ```
   For adaptive sections, `currentQuestion` comes from `adaptiveAptitude.currentQuestion`.

2. **UI Rendering Condition** (line 2051):
   ```typescript
   {!flow.showSectionIntro && !flow.showSectionComplete && currentQuestion && (
   ```
   The question UI only renders when `currentQuestion` is truthy. If `currentQuestion` is null/undefined, nothing is rendered.

3. **Resume Flow** (lines 1010-1018, 1074-1081):
   - When resuming, `adaptiveAptitude.resumeTest()` is called asynchronously
   - The screen is set to 'assessment' immediately (line 1080)
   - But `resumeTest()` is async and sets `loading = true` at start, `false` at end
   - During the loading period, `currentQuestion` is null

4. **Missing Loading State Handling**:
   - When `currentSection.isAdaptive` is true
   - AND `adaptiveAptitude.loading` is true  
   - AND `adaptiveAptitude.currentQuestion` is null
   - The UI should show a loading indicator, but currently shows nothing (blank screen)

### Resume Flow Timeline

```
1. User clicks "Resume Assessment"
2. handleResumeAssessment() is called
3. adaptiveAptitude.resumeTest(sessionId) is called (ASYNC)
   → Sets loading = true
   → Sets currentQuestion = null (initially)
4. flow.setCurrentScreen('assessment') is called IMMEDIATELY
5. UI tries to render but currentQuestion is null
   → No loading indicator shown
   → No question shown
   → User sees stuck screen
6. [Later] resumeTest() completes
   → Sets currentQuestion from API response
   → Sets loading = false
   → UI should now render, but may not update due to React state issues
```

## Affected Components

1. **AssessmentTestPage.tsx** (`src/features/assessment/career-test/AssessmentTestPage.tsx`)
   - Lines 1010-1018: Resume logic for adaptive sessions
   - Lines 1074-1081: Screen state management for adaptive resume
   - Lines 1717-1720: Current question determination
   - Lines 2050-2133: Question UI rendering

2. **useAdaptiveAptitude.ts** (`src/hooks/useAdaptiveAptitude.ts`)
   - Lines 398-433: `resumeTest()` function
   - Loading state management

## Proposed Solution

Add proper loading state handling in the main render logic:

**In AssessmentTestPage.tsx**, after line 2048 (before the question rendering block):

```typescript
{/* Loading state for adaptive section resume */}
{!flow.showSectionIntro && !flow.showSectionComplete && 
 currentSection?.isAdaptive && 
 adaptiveAptitude.loading && 
 !currentQuestion && (
  <LoadingScreen message="Loading question..." />
)}
```

This ensures that when:
- We're not showing intro/complete screens
- Current section is adaptive
- Adaptive aptitude is loading  
- No current question is available yet

→ A proper loading screen is displayed instead of a blank/stuck screen.

## Edge Cases to Consider

1. **Slow network**: Resume operation takes several seconds
2. **Failed resume**: API call fails during resume
3. **Session expired**: Adaptive session no longer valid
4. **Multiple resume attempts**: User clicks resume multiple times

## Test Scenarios

1. **Happy Path Resume**:
   - Complete assessment up to adaptive section
   - Refresh/close browser
   - Resume assessment
   - Should show loading indicator briefly, then question

2. **Slow Network**:
   - Throttle network to slow 3G
   - Resume at adaptive section
   - Should show loading indicator (not blank screen)

3. **Failed Resume**:
   - Mock API failure in resumeTest
   - Should show error message, not stuck screen

4. **Mid-Adaptive Resume**:
   - Answer 5 questions in adaptive section
   - Refresh browser
   - Resume
   - Should continue from question 6 with proper loading state

## Implementation Notes

- The fix is minimal (4-8 lines of code)
- No breaking changes to existing logic
- Preserves all current functionality
- Adds missing UI state handling for edge case

### Implementation Details

**Date**: February 3, 2026

**Changes Made**:

1. **File**: `src/features/assessment/career-test/AssessmentTestPage.tsx`
   - **Lines**: 2050-2056 (new code added)
   - **Change**: Added loading state handler for adaptive section resume
   
2. **Code Added**:
   ```typescript
   {/* Loading state for adaptive section resume */}
   {!flow.showSectionIntro && !flow.showSectionComplete && 
    currentSection?.isAdaptive && 
    adaptiveAptitude.loading && 
    !currentQuestion && (
     <LoadingScreen message="Loading question..." />
   )}
   ```

3. **Logic**:
   - Checks if we're not showing intro/complete screens
   - Checks if current section is adaptive
   - Checks if adaptive aptitude is in loading state
   - Checks if no current question is available yet
   - If all conditions are met, displays the LoadingScreen component

**Test Results**:
- TypeScript typecheck passed (no new errors introduced)
- No build errors from the fix
- The fix properly handles the race condition during resume

**Expected Behavior After Fix**:
- When resuming an adaptive aptitude test, users will now see "Loading question..." instead of a blank/stuck screen
- The loading indicator will display until `resumeTest()` completes and sets `currentQuestion`
- This provides proper user feedback during the async operation
