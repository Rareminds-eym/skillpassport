# Adaptive Session API Documentation

**Version**: 1.0.0  
**Base URL**: `/api/adaptive-session`  
**Purpose**: Server-side API for managing adaptive aptitude test sessions

---

## Overview

The Adaptive Session API provides a robust, server-side solution for managing adaptive aptitude tests. It eliminates CORS issues and provides better error handling by moving all Supabase operations to Cloudflare Pages Functions.

### Benefits

- ✅ **No CORS errors** - All database operations happen server-side
- ✅ **Better reliability** - Server-side retry logic and error handling
- ✅ **Enhanced security** - Authentication and authorization on server
- ✅ **Improved performance** - Server-side caching and connection pooling

---

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Public Endpoints (No Auth Required)
- `GET /next-question/:sessionId`
- `GET /resume/:sessionId`
- `GET /find-in-progress/:studentId`

### Authenticated Endpoints
- `POST /initialize`
- `POST /submit-answer`
- `POST /complete/:sessionId`
- `GET /results/:sessionId`
- `GET /results/student/:studentId`
- `POST /abandon/:sessionId`

---

## Endpoints

### 1. Initialize Test

**POST** `/api/adaptive-session/initialize`

Creates a new adaptive aptitude test session and generates the first question.

**Authentication**: Required

**Request Body**:
```json
{
  "studentId": "uuid-string",
  "gradeLevel": "middle_school" | "high_school" | "higher_secondary"
}
```

**Response** (200):
```json
{
  "session": {
    "id": "session-uuid",
    "studentId": "student-uuid",
    "gradeLevel": "high_school",
    "currentPhase": "diagnostic_screener",
    "currentDifficulty": 3,
    "difficultyPath": [],
    "questionsAnswered": 0,
    "correctAnswers": 0,
    "currentQuestionIndex": 0,
    "responses": [],
    "currentPhaseQuestions": [...],
    "provisionalBand": null,
    "status": "in_progress",
    "startedAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "completedAt": null
  },
  "firstQuestion": {
    "id": "question-uuid",
    "text": "What is 2 + 2?",
    "options": {
      "A": "3",
      "B": "4",
      "C": "5",
      "D": "6"
    },
    "correctAnswer": "B",
    "difficulty": 3,
    "subtag": "numerical_reasoning",
    "gradeLevel": "high_school",
    "phase": "diagnostic_screener"
  }
}
```

**Errors**:
- `401` - Unauthorized (missing or invalid token)
- `400` - Bad request (invalid studentId or gradeLevel)
- `500` - Internal server error

---

### 2. Get Next Question

**GET** `/api/adaptive-session/next-question/:sessionId`

Retrieves the next question for the current session. Handles phase transitions and dynamic question generation.

**Authentication**: Not required (session ID is sufficient)

**URL Parameters**:
- `sessionId` (string, required) - The session UUID

**Response** (200):
```json
{
  "question": {
    "id": "question-uuid",
    "text": "Question text here",
    "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "correctAnswer": "B",
    "difficulty": 3,
    "subtag": "logical_reasoning",
    "gradeLevel": "high_school",
    "phase": "adaptive_core"
  },
  "isTestComplete": false,
  "currentPhase": "adaptive_core",
  "progress": {
    "questionsAnswered": 15,
    "currentQuestionIndex": 5,
    "totalQuestionsInPhase": 36
  }
}
```

**Response when test is complete** (200):
```json
{
  "question": null,
  "isTestComplete": true,
  "currentPhase": "stability_confirmation",
  "progress": {
    "questionsAnswered": 50,
    "currentQuestionIndex": 6,
    "totalQuestionsInPhase": 6
  }
}
```

**Errors**:
- `404` - Session not found
- `500` - Internal server error

---

### 3. Submit Answer

**POST** `/api/adaptive-session/submit-answer`

Submits an answer for the current question and updates session state.

**Authentication**: Required (must own the session)

**Request Body**:
```json
{
  "sessionId": "session-uuid",
  "questionId": "question-uuid",
  "selectedAnswer": "A" | "B" | "C" | "D",
  "responseTimeMs": 15000
}
```

**Response** (200):
```json
{
  "isCorrect": true,
  "previousDifficulty": 3,
  "newDifficulty": 4,
  "difficultyChange": "increased",
  "phaseComplete": false,
  "nextPhase": null,
  "testComplete": false,
  "stopCondition": null,
  "updatedSession": {
    "id": "session-uuid",
    "studentId": "student-uuid",
    "currentPhase": "adaptive_core",
    "currentDifficulty": 4,
    "questionsAnswered": 16,
    "correctAnswers": 12,
    ...
  }
}
```

**Errors**:
- `401` - Unauthorized
- `403` - Forbidden (not session owner)
- `404` - Session or question not found
- `400` - Invalid answer or question not in current phase
- `500` - Internal server error

---

### 4. Complete Test

**POST** `/api/adaptive-session/complete/:sessionId`

Completes the test and calculates final results with analytics.

**Authentication**: Required (must own the session)

**URL Parameters**:
- `sessionId` (string, required) - The session UUID

**Response** (200):
```json
{
  "id": "results-uuid",
  "sessionId": "session-uuid",
  "studentId": "student-uuid",
  "aptitudeLevel": 4,
  "confidenceTag": "high",
  "tier": "H",
  "totalQuestions": 50,
  "totalCorrect": 38,
  "overallAccuracy": 76.0,
  "accuracyByDifficulty": {
    "1": { "correct": 5, "total": 5, "accuracy": 100 },
    "2": { "correct": 8, "total": 10, "accuracy": 80 },
    "3": { "correct": 12, "total": 15, "accuracy": 80 },
    "4": { "correct": 10, "total": 15, "accuracy": 66.67 },
    "5": { "correct": 3, "total": 5, "accuracy": 60 }
  },
  "accuracyBySubtag": {
    "numerical_reasoning": { "correct": 7, "total": 9, "accuracy": 77.78 },
    "logical_reasoning": { "correct": 8, "total": 10, "accuracy": 80 },
    ...
  },
  "difficultyPath": [3, 3, 4, 4, 5, 4, 4, ...],
  "pathClassification": "ascending",
  "averageResponseTimeMs": 18500,
  "gradeLevel": "high_school",
  "completedAt": "2024-01-01T01:00:00Z"
}
```

**Errors**:
- `401` - Unauthorized
- `403` - Forbidden (not session owner)
- `404` - Session not found
- `400` - Session not complete or already completed
- `500` - Internal server error

---

### 5. Get Results

**GET** `/api/adaptive-session/results/:sessionId`

Retrieves test results for a completed session.

**Authentication**: Required (must own the session)

**URL Parameters**:
- `sessionId` (string, required) - The session UUID

**Response** (200):
```json
{
  "id": "results-uuid",
  "sessionId": "session-uuid",
  "studentId": "student-uuid",
  "aptitudeLevel": 4,
  "confidenceTag": "high",
  ...
}
```

**Response when not found** (404):
```json
{
  "error": "Results not found"
}
```

**Errors**:
- `401` - Unauthorized
- `403` - Forbidden (not session owner)
- `404` - Results not found
- `500` - Internal server error

---

### 6. Get Student Results

**GET** `/api/adaptive-session/results/student/:studentId`

Retrieves all test results for a student (most recent first).

**Authentication**: Required (must be the student or admin)

**URL Parameters**:
- `studentId` (string, required) - The student UUID

**Response** (200):
```json
[
  {
    "id": "results-uuid-1",
    "sessionId": "session-uuid-1",
    "studentId": "student-uuid",
    "aptitudeLevel": 4,
    "completedAt": "2024-01-02T00:00:00Z",
    ...
  },
  {
    "id": "results-uuid-2",
    "sessionId": "session-uuid-2",
    "studentId": "student-uuid",
    "aptitudeLevel": 3,
    "completedAt": "2024-01-01T00:00:00Z",
    ...
  }
]
```

**Errors**:
- `401` - Unauthorized
- `403` - Forbidden (not the student)
- `500` - Internal server error

---

### 7. Resume Test

**GET** `/api/adaptive-session/resume/:sessionId`

Resumes an in-progress test session.

**Authentication**: Not required (session ID is sufficient)

**URL Parameters**:
- `sessionId` (string, required) - The session UUID

**Response** (200):
```json
{
  "session": {
    "id": "session-uuid",
    "studentId": "student-uuid",
    "currentPhase": "adaptive_core",
    "questionsAnswered": 20,
    ...
  },
  "currentQuestion": {
    "id": "question-uuid",
    "text": "Question text",
    ...
  },
  "isTestComplete": false
}
```

**Errors**:
- `404` - Session not found
- `400` - Cannot resume abandoned session
- `500` - Internal server error

---

### 8. Find In-Progress Session

**GET** `/api/adaptive-session/find-in-progress/:studentId`

Finds the most recent in-progress session for a student.

**Authentication**: Not required (for anonymous users)

**URL Parameters**:
- `studentId` (string, required) - The student UUID

**Query Parameters**:
- `gradeLevel` (string, optional) - Filter by grade level

**Response** (200):
```json
{
  "id": "session-uuid",
  "studentId": "student-uuid",
  "gradeLevel": "high_school",
  "currentPhase": "adaptive_core",
  "questionsAnswered": 15,
  ...
}
```

**Response when not found** (404):
```json
{
  "error": "No in-progress session found"
}
```

**Errors**:
- `404` - No in-progress session found
- `500` - Internal server error

---

### 9. Abandon Session

**POST** `/api/adaptive-session/abandon/:sessionId`

Marks a session as abandoned.

**Authentication**: Required (must own the session)

**URL Parameters**:
- `sessionId` (string, required) - The session UUID

**Response** (200):
```json
{
  "success": true,
  "message": "Session abandoned successfully"
}
```

**Errors**:
- `401` - Unauthorized
- `403` - Forbidden (not session owner)
- `404` - Session not found
- `500` - Internal server error

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

---

## Testing

### Local Testing

Start the development server:
```bash
npm run pages:dev
```

Test endpoints with curl:
```bash
# Initialize test
curl -X POST http://localhost:8788/api/adaptive-session/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"studentId":"uuid","gradeLevel":"high_school"}'

# Get next question
curl http://localhost:8788/api/adaptive-session/next-question/SESSION_ID

# Submit answer
curl -X POST http://localhost:8788/api/adaptive-session/submit-answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"sessionId":"uuid","questionId":"uuid","selectedAnswer":"B","responseTimeMs":15000}'
```

---

## Architecture

```
Frontend (Browser)
    ↓
adaptiveAptitudeApiService (API Client)
    ↓
Cloudflare Pages Functions (/api/adaptive-session)
    ↓
Supabase (Database)
```

### Benefits of This Architecture

1. **CORS Elimination**: All database calls happen server-side
2. **Better Security**: Authentication and authorization on server
3. **Improved Reliability**: Server-side retry logic and error handling
4. **Performance**: Server-side caching and connection pooling
5. **Maintainability**: Centralized business logic

---

## Database Tables

### `adaptive_aptitude_sessions`
Stores active and completed test sessions.

### `adaptive_aptitude_responses`
Stores individual question responses.

### `adaptive_aptitude_results`
Stores final test results and analytics.

---

## Support

For issues or questions, please refer to:
- Frontend service: `src/services/adaptiveAptitudeApiService.ts`
- Backend handlers: `functions/api/adaptive-session/handlers/`
- Type definitions: `functions/api/adaptive-session/types/index.ts`

---

**Last Updated**: Context Transfer Session  
**Maintained By**: Development Team
