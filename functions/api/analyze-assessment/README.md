# Analyze Assessment API - Pages Function

## Overview

The analyze-assessment-api provides AI-powered career assessment analysis for students at different grade levels. It uses OpenRouter to generate personalized career recommendations based on assessment results.

**Original Location**: `cloudflare-workers/analyze-assessment-api/`  
**Migration Date**: January 27, 2026  
**Status**: ✅ Structure Complete, ⚠️ Implementation Needed

## Endpoints

### 1. POST /analyze-assessment
Analyze student assessment results and provide career recommendations.

**Request Body**:
```json
{
  "studentId": "uuid",
  "assessmentData": {
    "gradeLevel": "middle_school" | "high_school" | "higher_secondary" | "college" | "after_10th",
    "scores": { ... },
    "interests": string[],
    "strengths": string[],
    "weaknesses": string[]
  }
}
```

**Response**:
```json
{
  "analysis": {
    "summary": "string",
    "recommendations": string[],
    "careerPaths": string[],
    "nextSteps": string[]
  }
}
```

### 2. POST /generate-program-career-paths
Generate AI career paths for academic programs.

**Request Body**:
```json
{
  "programName": "string",
  "programType": "string",
  "description": "string"
}
```

**Response**:
```json
{
  "careerPaths": [
    {
      "title": "string",
      "description": "string",
      "skills": string[],
      "industries": string[]
    }
  ]
}
```

### 3. GET /health
Health check endpoint.

## File Structure

```
functions/api/analyze-assessment/
├── [[path]].ts              # Main router (✅ Complete)
├── README.md                # This file
├── types.ts                 # ⚠️ TODO: TypeScript types
├── handlers/
│   ├── analyze.ts           # ⚠️ TODO: Analyze assessment handler
│   ├── generate-paths.ts    # ⚠️ TODO: Generate career paths handler
│   └── health.ts            # ⚠️ TODO: Health check handler
├── prompts/
│   ├── middle-school.ts     # ⚠️ TODO: Middle school prompts
│   ├── high-school.ts       # ⚠️ TODO: High school prompts
│   ├── higher-secondary.ts  # ⚠️ TODO: Higher secondary prompts
│   ├── college.ts           # ⚠️ TODO: College prompts
│   ├── after-10th.ts        # ⚠️ TODO: After 10th prompts
│   ├── program-paths.ts     # ⚠️ TODO: Program career paths prompts
│   └── index.ts             # ⚠️ TODO: Prompt exports
├── services/
│   └── openrouter.ts        # ⚠️ TODO: OpenRouter API service
└── utils/
    ├── auth.ts              # ⚠️ TODO: Authentication utilities
    ├── hash.ts              # ⚠️ TODO: Hashing utilities
    ├── json-parser.ts       # ⚠️ TODO: JSON parsing and repair
    └── rate-limit.ts        # ⚠️ TODO: Rate limiting
```

## Features

### Completed ✅
- Main router with all 3 endpoints
- CORS handling
- Error handling structure

### TODO ⚠️

#### 1. Type Definitions (`types.ts`)
- Assessment data types
- Grade level types
- Analysis result types
- Career path types
- Request/response types

#### 2. Handlers
- **analyze.ts**: Main assessment analysis logic
  - Validate request body
  - Determine grade level
  - Build appropriate prompt
  - Call OpenRouter API
  - Parse and validate response
  - Return analysis

- **generate-paths.ts**: Program career paths generation
  - Validate request body
  - Build program career paths prompt
  - Call OpenRouter API
  - Parse and validate response
  - Return career paths

- **health.ts**: Health check handler

#### 3. Prompts (Grade-Specific)
- **middle-school.ts**: Prompts for grades 6-8
- **high-school.ts**: Prompts for grades 9-12
- **higher-secondary.ts**: Prompts for grades 11-12
- **college.ts**: Prompts for college students
- **after-10th.ts**: Prompts for stream selection after 10th grade
- **program-paths.ts**: Prompts for program career path generation
- **index.ts**: Export all prompts

#### 4. Services
- **openrouter.ts**: OpenRouter API integration
  - API call with retry logic
  - Model fallback (Gemini, Claude, etc.)
  - Response parsing
  - Error handling

#### 5. Utilities
- **auth.ts**: Authentication utilities
  - Get OpenRouter API key
  - Validate credentials

- **hash.ts**: Hashing utilities
  - Generate cache keys
  - Hash assessment data

- **json-parser.ts**: JSON parsing and repair
  - Parse AI responses
  - Repair malformed JSON
  - Validate structure

- **rate-limit.ts**: Rate limiting
  - Track API usage
  - Enforce rate limits
  - Return appropriate errors

## Grade Level Prompts

### Middle School (Grades 6-8)
- Focus on exploration and discovery
- Age-appropriate language
- Broad career categories
- Emphasis on interests and hobbies

### High School (Grades 9-12)
- More specific career paths
- Academic requirements
- Skill development focus
- College preparation guidance

### Higher Secondary (Grades 11-12)
- Stream-specific guidance (Science, Commerce, Arts)
- Competitive exam preparation
- College major recommendations
- Career path clarity

### After 10th
- Stream selection guidance
- Subject combination recommendations
- Career implications of choices
- Future opportunities

### College
- Specialization recommendations
- Industry-specific guidance
- Skill gap analysis
- Job market insights

## AI Models

Uses OpenRouter with fallback models:
1. `google/gemini-2.0-flash-exp:free` - Primary (free, fast)
2. `google/gemini-flash-1.5-8b` - Secondary
3. `anthropic/claude-3.5-sonnet` - Tertiary (paid, best quality)

## Environment Variables Required

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENROUTER_API_KEY` or `VITE_OPENROUTER_API_KEY` - OpenRouter API key

## Original Files to Migrate

### Handlers (3 files)
- `src/handlers/analyzeHandler.ts` - Main analysis logic
- `src/handlers/generateProgramCareerPaths.ts` - Career paths generation
- `src/handlers/healthHandler.ts` - Health check

### Prompts (7 files)
- `src/prompts/middleSchool.ts`
- `src/prompts/highSchool.ts`
- `src/prompts/higherSecondary.ts`
- `src/prompts/college.ts`
- `src/prompts/after10.ts`
- `src/prompts/programCareerPaths.ts`
- `src/prompts/index.ts`

### Services (1 file)
- `src/services/openRouterService.ts` - OpenRouter API integration

### Utils (5 files)
- `src/utils/auth.ts` - Authentication
- `src/utils/cors.ts` - CORS handling (already in shared lib)
- `src/utils/hash.ts` - Hashing
- `src/utils/jsonParser.ts` - JSON parsing
- `src/utils/rateLimit.ts` - Rate limiting

### Types (1 file)
- `src/types/index.ts` - Type definitions

## Next Steps

To complete the migration:

1. **Create Types** (`types.ts`)
   - Copy from `src/types/index.ts`
   - Update imports

2. **Create Prompts** (7 files in `prompts/`)
   - Copy all prompt files
   - Update imports
   - Ensure grade-level specific prompts are correct

3. **Create Services** (`services/openrouter.ts`)
   - Copy from `src/services/openRouterService.ts`
   - Update imports to use shared utilities
   - Add retry logic and fallback models

4. **Create Utils** (4 files in `utils/`)
   - Copy auth, hash, json-parser, rate-limit
   - Update imports
   - Use shared Supabase client

5. **Create Handlers** (3 files in `handlers/`)
   - Copy analyze, generate-paths, health handlers
   - Update imports
   - Wire up to main router

6. **Test All Endpoints**
   - Test with real assessment data
   - Test with OpenRouter API
   - Verify all grade levels work
   - Test error handling

## Testing Strategy

1. **Unit Tests**: Test individual functions (prompt building, JSON parsing, etc.)
2. **Integration Tests**: Test with real OpenRouter API
3. **E2E Tests**: Test complete analysis flows for each grade level
4. **Prompt Tests**: Verify prompts generate appropriate responses

## Notes

- The migration preserves all original functionality
- Code is organized for better maintainability
- Placeholder responses (501) indicate incomplete endpoints
- All TypeScript types need to be properly defined
- Original worker: `cloudflare-workers/analyze-assessment-api/` (multiple files)
- Well-structured original code makes migration straightforward

