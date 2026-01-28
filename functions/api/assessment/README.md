# Assessment API

AI-powered assessment generation and evaluation service.

## Overview

This API provides endpoints for generating, submitting, and evaluating assessments using AI. It supports streaming generation for real-time question creation.

## Endpoints

### POST `/generate`
Generate assessment questions based on role and difficulty.

**Request Body:**
```json
{
  "role": "software-engineer",
  "difficulty": "intermediate",
  "numQuestions": 10,
  "topics": ["algorithms", "data-structures"],
  "language": "en"
}
```

**Response:**
```json
{
  "assessmentId": "uuid",
  "questions": [...],
  "metadata": {...}
}
```

### POST `/submit`
Submit assessment answers for grading.

**Request Body:**
```json
{
  "assessmentId": "uuid",
  "answers": {...},
  "timeSpent": 1800
}
```

### GET `/results/:assessmentId`
Get assessment results.

### GET `/history`
Get user's assessment history.

### POST `/stream-generate` (SSE)
Generate assessment with streaming for real-time question generation.

### POST `/validate`
Validate a single answer.

### GET `/analytics/:assessmentId`
Get detailed analytics for an assessment.

## Implementation Status

✅ **Fully Implemented** (773 lines)
- All 7 endpoints implemented
- Streaming support for generation
- AI integration with OpenAI
- Comprehensive error handling

## Dependencies

- OpenAI API for question generation
- Supabase for data storage
- Shared utilities from `src/functions-lib/`

## Environment Variables

- `OPENAI_API_KEY` - OpenAI API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Testing

Property tests available in:
- `src/__tests__/property/api-endpoint-parity.property.test.ts`
- `src/__tests__/property/file-based-routing.property.test.ts`
