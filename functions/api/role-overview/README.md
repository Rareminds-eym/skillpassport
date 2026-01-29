# Role Overview API - Pages Function

## Overview

The role-overview-api generates comprehensive career role overview data using AI. It provides detailed information about job roles including responsibilities, industry demand, career progression, learning roadmaps, and recommended resources.

**Original Location**: `cloudflare-workers/role-overview-api/`  
**Migration Date**: January 27, 2026  
**Status**: ✅ Structure Complete, ⚠️ Implementation Needed

## Endpoints

### 1. POST /role-overview
Generate comprehensive role overview data for a career role.

**Request Body**:
```json
{
  "roleTitle": "string",
  "gradeLevel": "middle_school" | "high_school" | "college",
  "studentInterests": string[],
  "studentStrengths": string[]
}
```

**Response**:
```json
{
  "roleOverview": {
    "title": "string",
    "description": "string",
    "responsibilities": string[],
    "industryDemand": {
      "level": "high" | "medium" | "low",
      "trends": string[],
      "outlook": "string"
    },
    "careerProgression": {
      "entryLevel": "string",
      "midLevel": "string",
      "seniorLevel": "string"
    },
    "learningRoadmap": {
      "phase1": { "title": "string", "duration": "string", "topics": string[] },
      "phase2": { "title": "string", "duration": "string", "topics": string[] },
      "phase3": { "title": "string", "duration": "string", "topics": string[] }
    },
    "recommendedCourses": [
      {
        "title": "string",
        "provider": "string",
        "level": "beginner" | "intermediate" | "advanced",
        "duration": "string"
      }
    ],
    "freeResources": [
      {
        "title": "string",
        "type": "video" | "article" | "tutorial" | "documentation",
        "url": "string"
      }
    ],
    "actionItems": string[]
  }
}
```

### 2. POST /match-courses
AI-powered course matching for a specific role.

**Request Body**:
```json
{
  "roleTitle": "string",
  "availableCourses": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "topics": string[]
    }
  ]
}
```

**Response**:
```json
{
  "matchedCourses": [
    {
      "courseId": "string",
      "relevanceScore": number,
      "reasoning": "string",
      "recommendedOrder": number
    }
  ]
}
```

### 3. GET /health
Health check endpoint.

## File Structure

```
functions/api/role-overview/
├── [[path]].ts              # Main router (✅ Complete)
├── README.md                # This file
├── types.ts                 # ⚠️ TODO: TypeScript types
├── handlers/
│   ├── role-overview.ts     # ⚠️ TODO: Role overview generation
│   ├── course-matching.ts   # ⚠️ TODO: Course matching logic
│   └── health.ts            # ⚠️ TODO: Health check
├── services/
│   ├── openrouter.ts        # ⚠️ TODO: OpenRouter API service
│   └── gemini.ts            # ⚠️ TODO: Gemini fallback service
├── prompts/
│   ├── role-overview.ts     # ⚠️ TODO: Role overview prompts
│   └── course-matching.ts   # ⚠️ TODO: Course matching prompts
└── utils/
    ├── validation.ts        # ⚠️ TODO: Request validation
    ├── parser.ts            # ⚠️ TODO: Response parsing
    └── fallback.ts          # ⚠️ TODO: Static fallback data
```

## Features

### Completed ✅
- Main router with all 3 endpoints
- CORS handling
- Error handling structure

### TODO ⚠️

#### 1. Handlers
- **role-overview.ts**: Generate comprehensive role overview
  - Validate request body
  - Build comprehensive prompt
  - Call OpenRouter API with fallback to Gemini
  - Parse and validate response
  - Return structured role overview data

- **course-matching.ts**: AI-powered course matching
  - Validate request body
  - Build course matching prompt
  - Call OpenRouter API
  - Parse and rank courses
  - Return matched courses with relevance scores

- **health.ts**: Health check handler

#### 2. Services
- **openrouter.ts**: OpenRouter API integration
  - API call with retry logic
  - Model fallback
  - Response parsing
  - Error handling

- **gemini.ts**: Gemini fallback service
  - Direct Gemini API integration
  - Fallback when OpenRouter fails
  - Response parsing

#### 3. Prompts
- **role-overview.ts**: Prompts for role overview generation
  - Grade-level specific prompts
  - Comprehensive data structure
  - Industry-specific context

- **course-matching.ts**: Prompts for course matching
  - Relevance scoring criteria
  - Ranking logic
  - Reasoning generation

#### 4. Utilities
- **validation.ts**: Request validation
  - Validate role title
  - Validate grade level
  - Validate course data

- **parser.ts**: Response parsing
  - Parse AI responses
  - Validate structure
  - Extract data fields

- **fallback.ts**: Static fallback data
  - Fallback role overviews
  - Common career paths
  - Generic recommendations

## Role Overview Data Structure

### Job Responsibilities
- Day-to-day tasks
- Key responsibilities
- Required skills

### Industry Demand
- Current demand level (high/medium/low)
- Industry trends
- Future outlook
- Growth projections

### Career Progression
- Entry-level positions
- Mid-level positions
- Senior-level positions
- Typical timeline

### Learning Roadmap
- Phase 1: Foundation (topics, duration)
- Phase 2: Intermediate (topics, duration)
- Phase 3: Advanced (topics, duration)

### Recommended Courses
- Course title
- Provider
- Level (beginner/intermediate/advanced)
- Duration
- Key topics covered

### Free Resources
- Videos
- Articles
- Tutorials
- Documentation
- Online communities

### Action Items
- Immediate next steps
- Short-term goals
- Long-term goals

## AI Models

### Primary: OpenRouter
1. `google/gemini-2.0-flash-exp:free` - Primary (free, fast)
2. `google/gemini-flash-1.5-8b` - Secondary
3. `anthropic/claude-3.5-sonnet` - Tertiary (paid, best quality)

### Fallback: Direct Gemini API
- Used when OpenRouter fails
- Direct Google AI API integration

### Last Resort: Static Fallback
- Pre-generated role overviews
- Common career paths
- Generic recommendations

## Environment Variables Required

- `VITE_SUPABASE_URL` - Supabase project URL (optional, for caching)
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (optional)
- `OPENROUTER_API_KEY` or `VITE_OPENROUTER_API_KEY` - OpenRouter API key
- `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY` - Gemini API key (fallback)

## Original Files to Migrate

### Handlers (2 files)
- `src/handlers/roleOverviewHandler.ts` - Role overview generation
- `src/handlers/courseMatchingHandler.ts` - Course matching logic

### Services (2 files)
- `src/services/openRouterService.ts` - OpenRouter integration
- `src/services/geminiService.ts` - Gemini fallback

### Prompts (2 files)
- `src/prompts/roleOverviewPrompt.ts` - Role overview prompts
- `src/prompts/courseMatchingPrompt.ts` - Course matching prompts

### Utils (4 files)
- `src/utils/cors.ts` - CORS handling (already in shared lib)
- `src/utils/validation.ts` - Request validation
- `src/utils/parser.ts` - Response parsing
- `src/utils/fallback.ts` - Static fallback data

### Types (1 file)
- `src/types/index.ts` - Type definitions

## Next Steps

To complete the migration:

1. **Create Types** (`types.ts`)
   - Role overview types
   - Course matching types
   - Request/response types
   - Grade level types

2. **Create Handlers** (3 files in `handlers/`)
   - Role overview generation
   - Course matching
   - Health check

3. **Create Services** (2 files in `services/`)
   - OpenRouter API integration
   - Gemini fallback service

4. **Create Prompts** (2 files in `prompts/`)
   - Role overview prompts
   - Course matching prompts

5. **Create Utils** (3 files in `utils/`)
   - Request validation
   - Response parsing
   - Static fallback data

6. **Test All Endpoints**
   - Test role overview generation
   - Test course matching
   - Test fallback chain (OpenRouter → Gemini → Static)
   - Verify data structure

## Testing Strategy

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test with real OpenRouter and Gemini APIs
3. **E2E Tests**: Test complete role overview generation flows
4. **Fallback Tests**: Verify fallback chain works correctly
5. **Validation Tests**: Test request validation

## Notes

- The migration preserves all original functionality
- Code is organized for better maintainability
- Placeholder responses (501) indicate incomplete endpoints
- All TypeScript types need to be properly defined
- Original worker: `cloudflare-workers/role-overview-api/` (multiple files)
- Implements fallback chain: OpenRouter → Gemini → Static

