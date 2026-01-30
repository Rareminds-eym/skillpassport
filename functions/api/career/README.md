# Career API - Pages Function

Migrated from `cloudflare-workers/career-api` (1925 lines, 6 endpoints)

## Endpoints

1. `/api/career/chat` - Career AI chat with streaming
2. `/api/career/recommend-opportunities` - Job recommendations with AI matching
3. `/api/career/analyze-assessment` - Comprehensive career assessment analysis
4. `/api/career/generate-embedding` - Generate embeddings for opportunities/students
5. `/api/career/generate-field-keywords` - Generate domain keywords for fields
6. `/api/career/parse-resume` - Parse resume text into structured data

## Architecture

Due to the complexity of the original worker (multiple AI modules, context builders, guardrails, etc.), this migration uses a consolidated approach:

- **Main Handler**: `[[path]].ts` - Routes requests to appropriate handlers
- **Handlers**: Separate files for each endpoint in `handlers/` directory
- **Utilities**: Auth, rate limiting in `utils/` directory
- **Types**: Shared TypeScript types in `types.ts`

## Key Features Preserved

- AI model fallback (Claude → GPT-4)
- Streaming responses for chat
- Rate limiting (30 req/min per user)
- JWT authentication with fallback
- Conversation memory and context compression
- Intent detection and conversation phases
- Safety guardrails for user input
- Embedding generation with caching
- Resume parsing with AI

## Dependencies

- `@supabase/supabase-js` - Database client
- Shared utilities from `src/functions-lib/`
- OpenRouter API for AI models

## Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY` or `VITE_OPENROUTER_API_KEY`
