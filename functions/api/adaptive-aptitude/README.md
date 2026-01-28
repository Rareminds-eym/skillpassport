# Adaptive Aptitude API - Pages Function

## Overview

The adaptive-aptitude-api generates adaptive aptitude test questions using AI (OpenRouter). It handles question generation for all test phases with caching support.

**Original Size**: 1,700 lines  
**Migration Date**: January 27, 2026  
**Status**: ✅ Structure Complete, ⚠️ Implementation Partial

## Endpoints

### 1. POST /generate/diagnostic
Generate diagnostic screener questions (8 questions at difficulty level 3).

**Request Body**:
```json
{
  "gradeLevel": "middle_school" | "high_school" | "higher_secondary",
  "excludeQuestionIds": string[],
  "excludeQuestionTexts": string[]
}
```

### 2. POST /generate/adaptive
Generate adaptive core questions (11 questions with varying difficulty).

**Request Body**:
```json
{
  "gradeLevel": "middle_school" | "high_school" | "higher_secondary",
  "startingDifficulty": 1-5,
  "count": number,
  "excludeQuestionIds": string[],
  "excludeQuestionTexts": string[]
}
```

### 3. POST /generate/stability
Generate stability confirmation questions (4-6 questions around provisional band).

**Request Body**:
```json
{
  "gradeLevel": "middle_school" | "high_school" | "higher_secondary",
  "provisionalBand": 1-5,
  "count": number,
  "excludeQuestionIds": string[],
  "excludeQuestionTexts": string[]
}
```

### 4. POST /generate/single
Generate a single question with specific parameters.

**Request Body**:
```json
{
  "gradeLevel": "middle_school" | "high_school" | "higher_secondary",
  "phase": "diagnostic_screener" | "adaptive_core" | "stability_confirmation",
  "difficulty": 1-5,
  "subtag": "numerical_reasoning" | "logical_reasoning" | "verbal_reasoning" | "spatial_reasoning" | "data_interpretation" | "pattern_recognition",
  "excludeQuestionIds": string[]
}
```

### 5. POST /generate
Generic generation endpoint that routes to specific handlers based on phase.

### 6. GET /health
Health check endpoint.

## File Structure

```
functions/api/adaptive-aptitude/
├── [[path]].ts              # Main router (✅ Complete)
├── README.md                # This file
├── types.ts                 # TypeScript types (✅ Complete)
├── constants.ts             # Prompts, fallbacks, AI models (✅ Complete)
├── utils.ts                 # Helper functions (✅ Complete)
├── handlers/
│   ├── generate.ts          # Main handler exports (✅ Complete)
│   ├── diagnostic.ts        # ⚠️ TODO: Diagnostic screener logic
│   ├── adaptive.ts          # ⚠️ TODO: Adaptive core logic
│   ├── stability.ts         # ⚠️ TODO: Stability confirmation logic
│   ├── single.ts            # ⚠️ TODO: Single question logic
│   ├── ai.ts                # ⚠️ TODO: AI generation with OpenRouter
│   └── cache.ts             # ⚠️ TODO: Supabase caching logic
```

## Features

### Completed ✅
- Main router with all 6 endpoints
- Type definitions for all data structures
- Constants (prompts, fallback questions, AI models)
- Utility functions (ID generation, fallback selection, reordering)
- Handler structure and exports

### TODO ⚠️

#### 1. AI Generation Module (`handlers/ai.ts`)
- OpenRouter API integration
- Multi-model fallback (Gemini 2.0, Claude 3.5, etc.)
- JSON parsing and repair
- Question validation
- Prompt building

#### 2. Cache Module (`handlers/cache.ts`)
- Supabase integration for question cache
- `getCachedQuestions()` - Fetch from cache with exclusions
- `cacheQuestions()` - Store generated questions
- `trackQuestionUsage()` - Update usage statistics

#### 3. Diagnostic Handler (`handlers/diagnostic.ts`)
- Generate 8 questions at difficulty level 3
- Select 4+ subtags for variety
- Sequential cache lookups to prevent duplicates
- Batch AI generation for missing questions
- Fallback question selection
- Reorder to prevent consecutive subtags

#### 4. Adaptive Core Handler (`handlers/adaptive.ts`)
- Generate 11 questions with adaptive difficulty
- `generateDifficultyRange()` - Create difficulty progression
- `generateBalancedSubtagSequence()` - Ensure subtag variety
- Sequential cache lookups
- Batch AI generation
- Fallback selection

#### 5. Stability Handler (`handlers/stability.ts`)
- Generate 4-6 questions around provisional band
- `generateStabilityDifficulties()` - Create difficulty range
- `generateMixedFormatSubtags()` - Mix data/logic formats
- Sequential cache lookups
- Batch AI generation
- Fallback selection

#### 6. Single Question Handler (`handlers/single.ts`)
- Generate single question with specific parameters
- Try cache first
- Generate with AI if not cached
- Cache result synchronously

## Key Algorithms

### Difficulty Progression (Adaptive Core)
- Starts at specified difficulty
- Varies up/down with constraints
- Max 2 consecutive moves in same direction
- Ensures variety while maintaining challenge

### Subtag Selection
- Diagnostic: Select 4+ subtags, distribute across 8 questions
- Adaptive: Balanced sequence with max 2 consecutive same subtag
- Stability: Mixed format (alternate data/logic subtags)

### Duplicate Prevention
- Track used question IDs within batch
- Track used question texts for fallbacks
- Sequential cache lookups (not parallel)
- Post-query validation to filter exclusions

### Caching Strategy
- Try cache first for each question
- Batch generate missing questions
- Cache synchronously after generation
- Track usage statistics for cache rotation

## Environment Variables Required

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_KEY` - For cache writes
- `OPENROUTER_API_KEY` or `VITE_OPENROUTER_API_KEY` - OpenRouter API key

## Database Schema

### Table: `adaptive_aptitude_questions_cache`

```sql
CREATE TABLE adaptive_aptitude_questions_cache (
  question_id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  subtag TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  phase TEXT NOT NULL,
  explanation TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## AI Models (in order of preference)

1. `google/gemini-2.0-flash-exp:free` - Free, fast, 1M context
2. `google/gemini-flash-1.5-8b` - Fast and efficient
3. `anthropic/claude-3.5-sonnet` - Best quality (paid)
4. `xiaomi/mimo-v2-flash:free` - Fallback free model

## Fallback Questions

- **Middle School**: 8 questions per subtag (48 total)
- **High School**: 8 questions per subtag (48 total)
- **Higher Secondary**: Uses high school fallbacks

## Next Steps

To complete the migration:

1. **Create AI Module** (`handlers/ai.ts`)
   - Implement `generateQuestionsWithAI()`
   - Implement `parseAIResponse()`
   - Implement `validateQuestions()`
   - Add multi-model fallback logic

2. **Create Cache Module** (`handlers/cache.ts`)
   - Implement `getCachedQuestions()`
   - Implement `cacheQuestions()`
   - Implement `trackQuestionUsage()`
   - Add Supabase client creation

3. **Create Diagnostic Handler** (`handlers/diagnostic.ts`)
   - Implement full diagnostic screener logic
   - Use AI and cache modules
   - Add fallback handling

4. **Create Adaptive Handler** (`handlers/adaptive.ts`)
   - Implement difficulty progression
   - Implement subtag balancing
   - Use AI and cache modules

5. **Create Stability Handler** (`handlers/stability.ts`)
   - Implement stability difficulty logic
   - Implement mixed format subtags
   - Use AI and cache modules

6. **Create Single Handler** (`handlers/single.ts`)
   - Implement single question generation
   - Use AI and cache modules

7. **Test All Endpoints**
   - Test with real Supabase database
   - Test with OpenRouter API
   - Verify caching works correctly
   - Test fallback behavior

## Testing Strategy

1. **Unit Tests**: Test individual functions (difficulty generation, subtag selection, etc.)
2. **Integration Tests**: Test with real Supabase and OpenRouter
3. **E2E Tests**: Test complete question generation flows
4. **Cache Tests**: Verify caching and duplicate prevention

## Notes

- The migration preserves all original functionality
- Code is organized for better maintainability
- Placeholder responses (501) indicate incomplete endpoints
- All TypeScript types are properly defined
- No diagnostic errors in completed files
- Original worker: `cloudflare-workers/adaptive-aptitude-api/src/index.ts` (1,700 lines)

