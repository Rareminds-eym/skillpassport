# Adaptive Aptitude Services Documentation

**Version**: 2.0.0 (API-based)  
**Last Updated**: Context Transfer Session

---

## Overview

The Adaptive Aptitude services provide a complete solution for managing adaptive aptitude tests in the frontend. The architecture has been refactored to use a server-side API instead of direct Supabase calls.

### Architecture

```
Component
    ↓
useAdaptiveAptitude Hook
    ↓
adaptiveAptitudeService (Wrapper)
    ↓
adaptiveAptitudeApiService (API Client)
    ↓
Cloudflare Pages Functions API
    ↓
Supabase (Server-side)
```

---

## Files

### 1. `adaptiveAptitudeApiService.ts`

**Purpose**: HTTP client for the Adaptive Session API

**Exports**:
- 9 API client functions
- Type definitions for requests/responses
- `AdaptiveAptitudeApiService` class

**Key Features**:
- Automatic authentication token injection
- Comprehensive error handling
- Request/response logging
- Type-safe throughout

**Example Usage**:
```typescript
import * as AdaptiveAptitudeApiService from './adaptiveAptitudeApiService';

// Initialize a test
const result = await AdaptiveAptitudeApiService.initializeTest(
  'student-uuid',
  'high_school'
);

// Get next question
const nextQuestion = await AdaptiveAptitudeApiService.getNextQuestion(
  'session-uuid'
);

// Submit answer
const answerResult = await AdaptiveAptitudeApiService.submitAnswer({
  sessionId: 'session-uuid',
  questionId: 'question-uuid',
  selectedAnswer: 'B',
  responseTimeMs: 15000,
});
```

---

### 2. `adaptiveAptitudeService.ts`

**Purpose**: Backward-compatible wrapper around the API client

**Exports**:
- 9 wrapper functions (same signatures as before)
- Re-exported types from API service
- `AdaptiveAptitudeService` class

**Key Features**:
- 100% backward compatible
- Same function signatures as v1.0
- Transparent API delegation
- No breaking changes

**Example Usage**:
```typescript
import { AdaptiveAptitudeService } from './adaptiveAptitudeService';

// Same API as before - no changes needed!
const result = await AdaptiveAptitudeService.initializeTest({
  studentId: 'student-uuid',
  gradeLevel: 'high_school',
});
```

---

## Migration Guide

### From v1.0 (Direct Supabase) to v2.0 (API-based)

**Good News**: No code changes required! The refactor is 100% backward compatible.

#### What Changed

**Before (v1.0)**:
```typescript
// Direct Supabase calls
import { supabase } from '../lib/supabaseClient';

export async function initializeTest(options) {
  const { data } = await supabase
    .from('adaptive_aptitude_sessions')
    .insert({...});
  // ... more Supabase calls
}
```

**After (v2.0)**:
```typescript
// API calls
import * as AdaptiveAptitudeApiService from './adaptiveAptitudeApiService';

export async function initializeTest(options) {
  return AdaptiveAptitudeApiService.initializeTest(
    options.studentId,
    options.gradeLevel
  );
}
```

#### What Stayed the Same

- ✅ All function names
- ✅ All function signatures
- ✅ All return types
- ✅ All exported types
- ✅ Class structure

#### Benefits of v2.0

1. **No CORS Errors**: All database operations happen server-side
2. **Better Reliability**: Server-side retry logic and error handling
3. **Enhanced Security**: Authentication and authorization on server
4. **Improved Performance**: Server-side caching and connection pooling

---

## API Functions

### 1. `initializeTest(options)`

Initializes a new adaptive aptitude test session.

**Parameters**:
```typescript
{
  studentId: string;
  gradeLevel: 'middle_school' | 'high_school' | 'higher_secondary';
}
```

**Returns**:
```typescript
{
  session: TestSession;
  firstQuestion: Question;
}
```

**Example**:
```typescript
const { session, firstQuestion } = await AdaptiveAptitudeService.initializeTest({
  studentId: user.id,
  gradeLevel: 'high_school',
});
```

---

### 2. `getNextQuestion(sessionId)`

Gets the next question for the current session.

**Parameters**:
- `sessionId` (string) - The session UUID

**Returns**:
```typescript
{
  question: Question | null;
  isTestComplete: boolean;
  currentPhase: TestPhase;
  progress: {
    questionsAnswered: number;
    currentQuestionIndex: number;
    totalQuestionsInPhase: number;
  };
}
```

**Example**:
```typescript
const result = await AdaptiveAptitudeService.getNextQuestion(sessionId);

if (result.isTestComplete) {
  // Test is done
} else {
  // Show result.question
}
```

---

### 3. `submitAnswer(options)`

Submits an answer for the current question.

**Parameters**:
```typescript
{
  sessionId: string;
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  responseTimeMs: number;
}
```

**Returns**:
```typescript
{
  isCorrect: boolean;
  previousDifficulty: number;
  newDifficulty: number;
  difficultyChange: 'increased' | 'decreased' | 'unchanged';
  phaseComplete: boolean;
  nextPhase: TestPhase | null;
  testComplete: boolean;
  stopCondition: StopConditionResult | null;
  updatedSession: TestSession;
}
```

**Example**:
```typescript
const result = await AdaptiveAptitudeService.submitAnswer({
  sessionId,
  questionId,
  selectedAnswer: 'B',
  responseTimeMs: Date.now() - questionStartTime,
});

if (result.testComplete) {
  // Complete the test
} else {
  // Get next question
}
```

---

### 4. `completeTest(sessionId)`

Completes the test and calculates final results.

**Parameters**:
- `sessionId` (string) - The session UUID

**Returns**: `TestResults` with full analytics

**Example**:
```typescript
const results = await AdaptiveAptitudeService.completeTest(sessionId);

console.log('Aptitude Level:', results.aptitudeLevel);
console.log('Confidence:', results.confidenceTag);
console.log('Accuracy:', results.overallAccuracy);
```

---

### 5. `resumeTest(sessionId)`

Resumes an in-progress test session.

**Parameters**:
- `sessionId` (string) - The session UUID

**Returns**:
```typescript
{
  session: TestSession;
  currentQuestion: Question | null;
  isTestComplete: boolean;
}
```

**Example**:
```typescript
const { session, currentQuestion, isTestComplete } = 
  await AdaptiveAptitudeService.resumeTest(sessionId);
```

---

### 6. `findInProgressSession(studentId, gradeLevel?)`

Finds the most recent in-progress session for a student.

**Parameters**:
- `studentId` (string) - The student UUID
- `gradeLevel` (optional) - Filter by grade level

**Returns**: `TestSession | null`

**Example**:
```typescript
const session = await AdaptiveAptitudeService.findInProgressSession(
  user.id,
  'high_school'
);

if (session) {
  // Resume the session
}
```

---

### 7. `abandonSession(sessionId)`

Marks a session as abandoned.

**Parameters**:
- `sessionId` (string) - The session UUID

**Returns**: `void`

**Example**:
```typescript
await AdaptiveAptitudeService.abandonSession(sessionId);
```

---

### 8. `getTestResults(sessionId)`

Gets test results for a completed session.

**Parameters**:
- `sessionId` (string) - The session UUID

**Returns**: `TestResults | null`

**Example**:
```typescript
const results = await AdaptiveAptitudeService.getTestResults(sessionId);

if (results) {
  // Display results
}
```

---

### 9. `getStudentTestResults(studentId)`

Gets all test results for a student.

**Parameters**:
- `studentId` (string) - The student UUID

**Returns**: `TestResults[]`

**Example**:
```typescript
const allResults = await AdaptiveAptitudeService.getStudentTestResults(user.id);

// Display history
allResults.forEach(result => {
  console.log('Test on:', result.completedAt);
  console.log('Level:', result.aptitudeLevel);
});
```

---

## Error Handling

All functions throw errors that should be caught:

```typescript
try {
  const result = await AdaptiveAptitudeService.initializeTest({
    studentId: user.id,
    gradeLevel: 'high_school',
  });
} catch (error) {
  console.error('Failed to initialize test:', error.message);
  // Show error to user
}
```

### Common Errors

- **401 Unauthorized**: User not logged in or token expired
- **403 Forbidden**: User doesn't own the session
- **404 Not Found**: Session or results not found
- **500 Internal Server Error**: Server-side error

---

## Using with React Hook

The recommended way to use these services is through the `useAdaptiveAptitude` hook:

```typescript
import { useAdaptiveAptitude } from '../hooks/useAdaptiveAptitude';

function AdaptiveTestPage() {
  const {
    currentQuestion,
    session,
    progress,
    loading,
    error,
    isTestComplete,
    results,
    startTest,
    submitAnswer,
    resumeTest,
  } = useAdaptiveAptitude({
    studentId: user.id,
    gradeLevel: 'high_school',
    onTestComplete: (results) => {
      console.log('Test complete!', results);
    },
    onError: (error) => {
      console.error('Test error:', error);
    },
  });

  // Use the hook state and actions
}
```

---

## Testing

### Local Testing

1. Start the development server:
```bash
npm run pages:dev
```

2. Navigate to the test page:
```
http://localhost:5173/student/assessment/test
```

3. Start a test and verify:
   - Questions load without CORS errors
   - Answers submit successfully
   - Test completes and shows results

### Manual API Testing

```typescript
// In browser console
const service = await import('./services/adaptiveAptitudeService');

// Initialize test
const result = await service.AdaptiveAptitudeService.initializeTest({
  studentId: 'your-student-id',
  gradeLevel: 'high_school',
});

console.log('Session:', result.session);
console.log('First question:', result.firstQuestion);
```

---

## Troubleshooting

### Issue: "Unauthorized" errors

**Solution**: Ensure user is logged in and has a valid Supabase session.

```typescript
import { supabase } from '../lib/supabaseClient';

const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
}
```

### Issue: "Session not found" errors

**Solution**: Verify the session ID is correct and the session exists.

```typescript
// Check if session exists before using
const session = await AdaptiveAptitudeService.findInProgressSession(
  studentId,
  gradeLevel
);

if (!session) {
  // Start a new test
}
```

### Issue: CORS errors (should not happen in v2.0)

**Solution**: If you still see CORS errors, verify:
1. You're using v2.0 services (check imports)
2. The API is running (`npm run pages:dev`)
3. You're not making direct Supabase calls

---

## Performance Tips

1. **Cache session ID**: Store in component state or context
2. **Debounce answer submissions**: Prevent double-submissions
3. **Preload next question**: Fetch while user reads current question
4. **Use React.memo**: Memoize question components

---

## Support

For issues or questions:
- Check API documentation: `functions/api/adaptive-session/README.md`
- Review hook documentation: `src/hooks/useAdaptiveAptitude.ts`
- Check type definitions: `src/types/adaptiveAptitude.ts`

---

**Version History**:
- **v2.0.0**: API-based architecture (current)
- **v1.0.0**: Direct Supabase calls (deprecated)
