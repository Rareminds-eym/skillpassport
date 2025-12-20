# Career API Cloudflare Worker

Handles career guidance features including AI chat and job recommendations.

## Endpoints

### POST /chat
Career AI chat with streaming responses.

**Request:**
```json
{
  "conversationId": "uuid (optional)",
  "message": "Find me jobs matching my skills",
  "selectedChips": ["job", "opportunity"]
}
```

**Response:** Server-Sent Events (SSE)
- `event: token` - Streaming content tokens
- `event: done` - Completion with metadata
- `event: error` - Error message

### POST /recommend-opportunities
Get personalized job recommendations based on student profile and embeddings.

**Request:**
```json
{
  "studentId": "uuid",
  "forceRefresh": false,
  "limit": 20
}
```

**Response:**
```json
{
  "recommendations": [...],
  "count": 20,
  "totalMatches": 45,
  "executionTime": 234
}
```

### GET /health
Health check endpoint.

## Deployment

1. Install dependencies:
```bash
cd cloudflare-workers/career-api
npm install
```

2. Configure secrets:
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put OPENROUTER_API_KEY
```

3. Deploy:
```bash
npm run deploy
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| SUPABASE_URL | Supabase project URL |
| SUPABASE_ANON_KEY | Supabase anonymous key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key |
| OPENROUTER_API_KEY | OpenRouter API key for AI |

## Features

- Intent detection for career-related queries
- Conversation phase management (opening, exploring, deep_dive, follow_up)
- Student profile context building
- Assessment results integration
- Job opportunity matching with vector similarity
- Rate limiting (30 requests/minute per user)
- Streaming SSE responses for chat
