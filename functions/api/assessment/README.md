# Assessment API

Personal assessment (non-adaptive) endpoint handlers.

## Directory Structure

```
functions/api/assessment/
├── [[path]].ts              Main router
├── types/
│   └── index.ts             Type definitions
├── handlers/
│   ├── start.ts             POST /api/assessment/start
│   ├── save-response.ts     POST /api/assessment/save-response
│   ├── update-progress.ts   POST /api/assessment/update-progress
│   ├── submit.ts            POST /api/assessment/submit
│   ├── check-in-progress.ts GET /api/assessment/check-in-progress
│   └── abandon.ts           POST /api/assessment/abandon
├── utils/
│   ├── question-loader.ts   Load sections and questions
│   ├── validation.ts        Input validation
│   └── converters.ts        DB to API type conversions
└── README.md                This file
```

## API Endpoints

### POST /api/assessment/start
**Start a new assessment attempt**

Loads sections and questions for the given grade level and creates an assessment attempt record.

**Request:**
```json
{
  "gradeLevel": "middle|highschool|higher_secondary|after10|after12|college",
  "streamId": "optional_stream_id"
}
```

**Response:**
```json
{
  "success": true,
  "attemptId": "string",
  "attempt": { ... },
  "sections": [ ... ]
}
```

**Handler:** `handlers/start.ts`

---

### POST /api/assessment/save-response
**Save a response to a question**

Records a user's answer. Inserts or updates the response in the database.

**Request:**
```json
{
  "attemptId": "string",
  "questionId": "string",
  "answer": "any"
}
```

**Response:**
```json
{
  "success": true
}
```

**Handler:** `handlers/save-response.ts`

---

### POST /api/assessment/update-progress
**Update assessment progress**

Updates the current section/question position and timings. Merges responses and timings with existing data.

**Request:**
```json
{
  "attemptId": "string",
  "sectionIndex": "number",
  "questionIndex": "number",
  "sectionTimings": { "section_id": seconds },
  "timerRemaining": "number|null",
  "elapsedTime": "number",
  "answers": { "question_id": "answer" }
}
```

**Response:**
```json
{
  "success": true
}
```

**Handler:** `handlers/update-progress.ts`

---

### POST /api/assessment/submit
**Submit completed assessment**

Marks the assessment as completed and merges final answers.

**Request:**
```json
{
  "attemptId": "string",
  "answers": { "question_id": "answer" }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment submitted successfully"
}
```

**Handler:** `handlers/submit.ts`

---

### GET /api/assessment/check-in-progress
**Check for in-progress assessment**

Checks if the authenticated user has an in-progress assessment attempt. Returns null if no in-progress attempt found.

**Request:** None (uses authentication header)

**Response:**
```json
{
  "success": true,
  "hasInProgress": true,
  "attemptId": "string",
  "answers": { ... },
  "currentSectionIndex": number,
  "currentQuestionIndex": number,
  "gradeLevel": "string",
  "streamId": "string|null",
  "sectionTimings": { ... },
  "elapsedTime": number,
  "started_at": "ISO8601"
}
```

**Handler:** `handlers/check-in-progress.ts`

---

### POST /api/assessment/abandon
**Abandon an in-progress assessment**

Marks an assessment attempt as abandoned instead of completed.

**Request:**
```json
{
  "attemptId": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

**Handler:** `handlers/abandon.ts`

---

## Type System

All types are defined in `types/index.ts`:

- `StartAssessmentOptions` - Start request
- `SaveResponseOptions` - Save response request
- `UpdateProgressOptions` - Update progress request
- `SubmitAssessmentOptions` - Submit request
- `AbandonAttemptOptions` - Abandon request
- `StartAssessmentResult` - Start response
- `CheckInProgressResult` - Check-in-progress response
- `AssessmentAttempt` - Attempt record
- `AssessmentSection` - Section with questions
- `AssessmentQuestion` - Question definition

---

## Utilities

### question-loader.ts
Loads sections and questions for assessment:

- `loadSectionsWithQuestions()` - Load all sections and questions for grade
- `loadAdaptiveSections()` - Load adaptive sections (if applicable)
- `loadAISections()` - Load AI-generated sections for streams

### validation.ts
Input validation functions:

- `validateStartAssessmentRequest()`
- `validateSaveResponseRequest()`
- `validateUpdateProgressRequest()`
- `validateSubmitAssessmentRequest()`
- `validateAbandonAttemptRequest()`
- `validateLearnerData()`
- `validateAttemptData()`

### converters.ts
Database to API type conversions:

- `dbAttemptToAssessmentAttempt()` - Convert DB record to typed attempt
- `dbResponseToAssessmentResponse()` - Convert DB record to typed response

---

## Authentication

All endpoints require authentication via:

```typescript
const auth = await authenticateUser(request, env);
if (!auth) return jsonResponse({ error: 'Authentication required' }, 401);
```

Uses `authenticateUser()` from `functions/api/shared/auth.ts`.

---

## Error Handling

All handlers follow a consistent error pattern:

1. Authentication check (401)
2. Input validation (400)
3. Resource lookup (404)
4. Ownership verification (403)
5. Database operations (500 on error)

Errors always return:
```json
{
  "error": "Error message",
  "message": "Additional details"
}
```

---

## Database Schema

Assumes these tables exist:

- `personal_assessment_sections` - Assessment sections
- `personal_assessment_questions` - Assessment questions
- `personal_assessment_attempts` - Attempt records (attempts table)
- `personal_assessment_responses` - Question responses
- `learners` - Learner records
- `career_assessment_ai_questions` - AI-generated questions (stream-specific)

---

## Related Documentation

- **Adaptive API:** `functions/api/adaptive-session/README.md`
- **Frontend Service:** `src/features/assessment/api/assessmentApiService.ts`
- **Types:** `src/shared/types/` (frontend types)
