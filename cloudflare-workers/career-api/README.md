# Career API Cloudflare Worker

AI-powered career guidance and job matching service.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat` | POST | Career AI chat with streaming responses |
| `/recommend-opportunities` | POST | Get job recommendations based on student profile |
| `/generate-embedding` | POST | Generate text embeddings for semantic search |

## Environment Variables

### Required

| Variable | Description | Usage |
|----------|-------------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL | Database operations |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | User-scoped queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Admin operations |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key | AI chat completions (model: openai/gpt-4o-mini) |

### Optional

| Variable | Description | Default | Usage |
|----------|-------------|---------|-------|
| `EMBEDDING_SERVICE_URL` | Embedding service endpoint | `https://embedings.onrender.com` | Generate embeddings for semantic search |

## Setup Instructions

### 1. Install Dependencies
```bash
cd cloudflare-workers/career-api
npm install
```

### 2. Configure Secrets
```bash
# Required secrets
wrangler secret put VITE_SUPABASE_URL
wrangler secret put VITE_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put VITE_OPENROUTER_API_KEY

# Optional embedding service
wrangler secret put EMBEDDING_SERVICE_URL
```

### 3. Deploy
```bash
npm run deploy
```

### 4. Update Frontend Environment
```env
VITE_CAREER_API_URL=https://career-api.your-subdomain.workers.dev
```

## Features

### Career AI Chat (`/chat`)
- **Streaming responses** using Server-Sent Events (SSE)
- **Intent detection** (find-jobs, skill-gap, interview-prep, resume-review, etc.)
- **Conversation phases**: opening, exploring, deep_dive
- **Context-aware** responses using:
  - Student profile (skills, education, experience)
  - Assessment results (RIASEC, aptitude)
  - Career progress (applications, enrollments)
  - Active job opportunities
- **Rate limiting**: 30 requests per minute per user
- **Conversation persistence** in `career_ai_conversations` table

### Job Recommendations (`/recommend-opportunities`)
- Matches student skills with job requirements
- Uses semantic similarity scoring
- Filters by match threshold (default: 0.20)
- Returns up to 50 recommendations
- Considers:
  - Technical skills
  - Educational background
  - Experience level
  - CGPA (if available)

### Embedding Generation (`/generate-embedding`)
- Generates vector embeddings for text
- Used for semantic search
- Calls external embedding service

## Conversation Phases

| Phase | Trigger | Max Tokens | Temperature | Style |
|--------|---------|------------|-------------|-------|
| **Opening** | First message | 600 | 0.7 | Short, conversational |
| **Exploring** | Messages 2-4 | 2000 | 0.5 | Moderate depth |
| **Deep Dive** | Message 5+ | 4000 | 0.4 | Comprehensive |
| **Follow Up** | Message 10+ | 2500 | 0.45 | Balanced, builds on context |

## Intent Detection

Supported intents with pattern matching:
- **find-jobs**: Job searching
- **skill-gap**: Identify missing skills
- **interview-prep**: Interview preparation
- **resume-review**: Resume feedback
- **learning-path**: Course recommendations
- **career-guidance**: Career advice
- **assessment-insights**: RIASEC/personality interpretation
- **application-status**: Track applications
- **course-progress**: Enrollment tracking
- **general**: Greetings and general questions

## Development

```bash
# Start local dev server
npm run dev

# View real-time logs
npm run tail
```

## Response Format

### Chat Endpoint (SSE)
```javascript
// Token streaming
event: token
data: {"content": "Hello, "}

// Completion
event: done
data: {"conversationId": "...", "messageId": "...", "intent": "career-guidance", ...}

// Error
event: error
data: {"error": "Error message"}
```

### Recommendations Endpoint
```json
{
  "success": true,
  "recommendations": [
    {
      "id": "...",
      "title": "Software Engineer",
      "company_name": "Tech Corp",
      "match_score": 0.85,
      "match_reason": "Strong match in: Python, React, Node.js"
    }
  ],
  "count": 15
}
```

## Notes

- AI model: **openai/gpt-4o-mini** via OpenRouter
- Streaming uses SSE (Server-Sent Events)
- Rate limiting: 30 requests/min per user
- Conversations auto-titled from first message
- Context limited to last 10 messages for efficiency
- Embedding service defaults to external URL if not configured
