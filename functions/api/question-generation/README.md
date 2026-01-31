# Question Generation API - Pages Function

## Overview

The question-generation-api is a unified API that merges functionality from assessment-api and adaptive-aptitude-api. It generates various types of assessment questions using AI.

**Original Location**: `cloudflare-workers/question-generation-api/`  
**Migration Date**: January 27, 2026  
**Status**: ✅ Structure Complete, ⚠️ Implementation Needed

## Endpoints

### Career Assessment Endpoints

#### 1. POST /career-assessment/generate-aptitude
Generate 50 career aptitude questions.

**Request Body**:
```json
{
  "gradeLevel": "middle_school" | "high_school" | "college",
  "excludeQuestionIds": string[]
}
```

#### 2. POST /career-assessment/generate-aptitude/stream
Generate aptitude questions with Server-Sent Events (SSE) streaming.

#### 3. POST /career-assessment/generate-knowledge
Generate 20 career knowledge questions.

**Request Body**:
```json
{
  "gradeLevel": "middle_school" | "high_school" | "college",
  "excludeQuestionIds": string[]
}
```

#### 4. POST /generate
Generate course-specific assessment questions.

**Request Body**:
```json
{
  "courseId": "string",
  "lessonId": "string",
  "count": number
}
```

### Adaptive Assessment Endpoints

#### 5. POST /generate/diagnostic
Generate 6 diagnostic screener questions.

**Request Body**:
```json
{
  "gradeLevel": "middle_school" | "high_school" | "higher_secondary",
  "excludeQuestionIds": string[]
}
```

#### 6. POST /generate/adaptive
Generate 8-11 adaptive core questions.

**Request Body**:
```json
{
  "gradeLevel": "middle_school" | "high_school" | "higher_secondary",
  "startingDifficulty": 1-5,
  "count": number,
  "excludeQuestionIds": string[]
}
```

#### 7. POST /generate/stability
Generate 4-6 stability confirmation questions.

**Request Body**:
```json
{
  "gradeLevel": "middle_school" | "high_school" | "higher_secondary",
  "provisionalBand": 1-5,
  "count": number,
  "excludeQuestionIds": string[]
}
```

#### 8. POST /generate/single
Generate a single adaptive question.

**Request Body**:
```json
{
  "gradeLevel": "middle_school" | "high_school" | "higher_secondary",
  "phase": "diagnostic_screener" | "adaptive_core" | "stability_confirmation",
  "difficulty": 1-5,
  "subtag": "numerical_reasoning" | "logical_reasoning" | ...,
  "excludeQuestionIds": string[]
}
```

#### 9. GET /health
Health check endpoint.

## File Structure

```
functions/api/question-generation/
├── [[path]].ts              # Main router (✅ Complete)
├── README.md                # This file
├── types.ts                 # ⚠️ TODO: TypeScript types
├── handlers/
│   ├── career/
│   │   ├── aptitude.ts      # ⚠️ TODO: Aptitude generation
│   │   ├── knowledge.ts     # ⚠️ TODO: Knowledge generation
│   │   └── streaming.ts     # ⚠️ TODO: SSE streaming
│   ├── adaptive/
│   │   ├── diagnostic.ts    # ⚠️ TODO: Diagnostic screener
│   │   ├── core.ts          # ⚠️ TODO: Adaptive core
│   │   ├── stability.ts     # ⚠️ TODO: Stability confirmation
│   │   └── single.ts        # ⚠️ TODO: Single question
│   ├── course.ts            # ⚠️ TODO: Course assessment
│   └── health.ts            # ⚠️ TODO: Health check
├── services/
│   └── openrouter.ts        # ⚠️ TODO: OpenRouter API service
└── utils/
    ├── prompts.ts           # ⚠️ TODO: Prompt building
    ├── cache.ts             # ⚠️ TODO: Question caching
    └── validation.ts        # ⚠️ TODO: Question validation
```

## Features

### Completed ✅
- Main router with all 9 endpoints
- CORS handling
- Error handling structure

### TODO ⚠️

#### 1. Career Assessment Handlers
- **aptitude.ts**: Generate 50 aptitude questions
  - Multiple question types
  - Grade-level appropriate
  - Caching support
  
- **knowledge.ts**: Generate 20 knowledge questions
  - Domain-specific questions
  - Grade-level appropriate
  - Caching support

- **streaming.ts**: SSE streaming for real-time generation
  - Server-Sent Events implementation
  - Progress updates
  - Error handling

#### 2. Adaptive Assessment Handlers
- **diagnostic.ts**: Generate diagnostic screener (6 questions)
- **core.ts**: Generate adaptive core (8-11 questions)
- **stability.ts**: Generate stability confirmation (4-6 questions)
- **single.ts**: Generate single question

#### 3. Course Assessment Handler
- **course.ts**: Generate course-specific questions
  - Lesson-based questions
  - Difficulty progression
  - Topic coverage

#### 4. Services
- **openrouter.ts**: OpenRouter API integration
  - Multi-model fallback
  - Retry logic
  - Response parsing

#### 5. Utilities
- **prompts.ts**: Prompt building for different question types
- **cache.ts**: Question caching with Supabase
- **validation.ts**: Question validation and quality checks

## Question Types

### Career Aptitude Questions (50 total)
- Numerical reasoning
- Logical reasoning
- Verbal reasoning
- Spatial reasoning
- Data interpretation
- Pattern recognition

### Career Knowledge Questions (20 total)
- Industry knowledge
- Career paths
- Skills and competencies
- Educational requirements

### Adaptive Questions
- Diagnostic screener (6 questions at difficulty 3)
- Adaptive core (8-11 questions with varying difficulty)
- Stability confirmation (4-6 questions around provisional band)

### Course Assessment Questions
- Lesson-specific questions
- Concept understanding
- Application questions
- Problem-solving

## AI Models

Uses OpenRouter with fallback models:
1. `google/gemini-2.0-flash-exp:free` - Primary (free, fast)
2. `google/gemini-flash-1.5-8b` - Secondary
3. `anthropic/claude-3.5-sonnet` - Tertiary (paid, best quality)

## Environment Variables Required

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENROUTER_API_KEY` or `OPENROUTER_API_KEY` - OpenRouter API key

## Database Tables

### `career_aptitude_questions_cache`
Caches generated career aptitude questions.

### `career_knowledge_questions_cache`
Caches generated career knowledge questions.

### `adaptive_aptitude_questions_cache`
Caches generated adaptive aptitude questions.

### `course_assessment_questions_cache`
Caches generated course assessment questions.

## Original Files to Migrate

### Handlers
- `src/handlers/career/*.ts` - Career assessment handlers
- `src/handlers/adaptive/*.ts` - Adaptive assessment handlers
- `src/handlers/course.ts` - Course assessment handler
- `src/handlers/healthHandler.ts` - Health check

### Services
- `src/services/openRouterService.ts` - OpenRouter integration

### Utils
- `src/utils/prompts.ts` - Prompt building
- `src/utils/cache.ts` - Caching logic
- `src/utils/validation.ts` - Validation
- `src/utils/cors.ts` - CORS (already in shared lib)
- `src/utils/response.ts` - Response helpers (already in shared lib)

### Types
- `src/types/index.ts` - Type definitions

## Next Steps

To complete the migration:

1. **Create Types** (`types.ts`)
   - Question types
   - Request/response types
   - Grade level types
   - Difficulty types

2. **Create Career Handlers** (3 files in `handlers/career/`)
   - Aptitude generation
   - Knowledge generation
   - SSE streaming

3. **Create Adaptive Handlers** (4 files in `handlers/adaptive/`)
   - Diagnostic screener
   - Adaptive core
   - Stability confirmation
   - Single question

4. **Create Course Handler** (`handlers/course.ts`)
   - Course-specific question generation

5. **Create Services** (`services/openrouter.ts`)
   - OpenRouter API integration
   - Multi-model fallback
   - Response parsing

6. **Create Utils** (3 files in `utils/`)
   - Prompt building
   - Caching
   - Validation

7. **Test All Endpoints**
   - Test career assessment generation
   - Test adaptive assessment generation
   - Test course assessment generation
   - Test streaming functionality
   - Verify caching works

## Testing Strategy

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test with real OpenRouter API
3. **E2E Tests**: Test complete generation flows
4. **Cache Tests**: Verify caching and duplicate prevention
5. **Streaming Tests**: Test SSE functionality

## Notes

- The migration preserves all original functionality
- Code is organized for better maintainability
- Placeholder responses (501) indicate incomplete endpoints
- All TypeScript types need to be properly defined
- Original worker: `cloudflare-workers/question-generation-api/` (multiple files)
- Unified API combines functionality from two separate APIs

