# Question Generation API

Unified Cloudflare Worker that merges functionality from:
- `assessment-api` (career aptitude/knowledge questions)
- `adaptive-aptitude-api` (adaptive test questions)

## Endpoints

### Health Check
- `GET /health` - Health check

### Career Assessment (from assessment-api)
- `POST /career-assessment/generate-aptitude` - Generate 50 aptitude questions
- `POST /career-assessment/generate-knowledge` - Generate 20 knowledge questions
- `POST /generate` - Generate course-specific assessment questions

### Adaptive Assessment (from adaptive-aptitude-api)
- `POST /generate/diagnostic` - Generate 6 diagnostic screener questions
- `POST /generate/adaptive` - Generate 8-11 adaptive core questions
- `POST /generate/stability` - Generate 4-6 stability confirmation questions
- `POST /generate/single` - Generate a single adaptive question

## Project Structure

```
src/
├── index.ts                 # Main router
├── types/                   # TypeScript type definitions
├── config/                  # Configuration constants
│   ├── index.ts            # API models, test config
│   ├── aptitudeCategories.ts # Aptitude/school subject categories
│   └── streamContexts.ts   # Stream-specific contexts
├── utils/                   # Utility functions
│   ├── cors.ts             # CORS headers
│   ├── response.ts         # JSON response helpers
│   ├── jsonParser.ts       # JSON repair/parse
│   ├── uuid.ts             # UUID generation
│   └── delay.ts            # Delay helper
├── services/                # External service integrations
│   ├── supabaseService.ts  # Supabase client factory
│   ├── openRouterService.ts # OpenRouter API
│   ├── claudeService.ts    # Claude API
│   └── cacheService.ts     # Unified caching
├── prompts/                 # AI prompt templates
│   ├── career/             # Career assessment prompts
│   ├── adaptive/           # Adaptive test prompts
│   └── course/             # Course assessment prompts
├── fallbacks/               # Fallback questions
│   ├── middleSchool.ts     # Middle school fallbacks
│   └── highSchool.ts       # High school fallbacks
└── handlers/                # Request handlers
    ├── healthHandler.ts    # Health check
    ├── career/             # Career assessment handlers
    ├── adaptive/           # Adaptive test handlers
    └── course/             # Course assessment handlers
```

## Environment Variables

Set via `wrangler secret put`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for cache writes)
- `OPENROUTER_API_KEY` - OpenRouter API key
- `CLAUDE_API_KEY` - Claude API key

## Cache Tables

- `career_assessment_ai_questions` - Career assessment question cache
- `adaptive_aptitude_questions_cache` - Adaptive test question cache

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy
npm run deploy
```

## Migration from Old Workers

This worker replaces:
1. `assessment-api` - All endpoints preserved with same paths
2. `adaptive-aptitude-api` - All endpoints preserved with same paths

Frontend code should update the API base URL to point to this new worker.

## Frontend Integration

The frontend services have been updated to use this unified worker:

### Environment Variables (`.env`)

```env
# Primary URL for question generation
VITE_QUESTION_GENERATION_API_URL=https://question-generation-api.dark-mode-d021.workers.dev

# Legacy aliases (backward compatibility)
VITE_EXTERNAL_API_KEY=https://question-generation-api.dark-mode-d021.workers.dev
VITE_ADAPTIVE_APTITUDE_API_URL=https://question-generation-api.dark-mode-d021.workers.dev
```

### Frontend Services Updated

| Service | File | Endpoints Used |
|---------|------|----------------|
| Question Generator | `src/services/questionGeneratorService.ts` | `/generate/diagnostic`, `/generate/adaptive`, `/generate/stability`, `/generate/single` |
| Career Assessment AI | `src/services/careerAssessmentAIService.js` | `/career-assessment/generate-aptitude`, `/career-assessment/generate-knowledge` |
| Assessment Generation | `src/services/assessmentGenerationService.js` | `/api/assessment/generate` |

### URL Resolution Priority

All frontend services use this priority for API URL:
1. `VITE_QUESTION_GENERATION_API_URL` (recommended)
2. `VITE_EXTERNAL_API_KEY` (legacy)
3. `VITE_ADAPTIVE_APTITUDE_API_URL` (legacy)
4. Hardcoded fallback: `https://question-generation-api.dark-mode-d021.workers.dev`
