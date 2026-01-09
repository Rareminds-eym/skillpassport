# Adaptive Aptitude API

Cloudflare Worker for generating adaptive aptitude test questions using AI (OpenRouter).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/generate/diagnostic` | Generate diagnostic screener questions (6 questions) |
| POST | `/generate/adaptive` | Generate adaptive core questions (8-11 questions) |
| POST | `/generate/stability` | Generate stability confirmation questions (4-6 questions) |
| POST | `/generate/single` | Generate a single question (for dynamic adaptive generation) |
| POST | `/generate` | Generic question generation |

## Request Examples

### Generate Diagnostic Screener Questions
```json
POST /generate/diagnostic
{
  "gradeLevel": "high_school",
  "excludeQuestionIds": []
}
```

### Generate Adaptive Core Questions
```json
POST /generate/adaptive
{
  "gradeLevel": "high_school",
  "startingDifficulty": 3,
  "count": 10,
  "excludeQuestionIds": []
}
```

### Generate Stability Confirmation Questions
```json
POST /generate/stability
{
  "gradeLevel": "high_school",
  "provisionalBand": 3,
  "count": 4,
  "excludeQuestionIds": []
}
```

### Generate Single Question (Dynamic)
```json
POST /generate/single
{
  "gradeLevel": "high_school",
  "phase": "adaptive_core",
  "difficulty": 3,
  "subtag": "numerical_reasoning",
  "excludeQuestionIds": []
}
```

## Response Format

```json
{
  "questions": [
    {
      "id": "high_school_diagnostic_screener_d2_numerical_reasoning_1704067200000_abc123",
      "text": "Question text here",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "B",
      "difficulty": 2,
      "subtag": "numerical_reasoning",
      "gradeLevel": "high_school",
      "phase": "diagnostic_screener",
      "explanation": "Explanation of correct answer",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "fromCache": false,
  "generatedCount": 6,
  "cachedCount": 0
}
```

## Deployment

1. Install dependencies:
```bash
cd cloudflare-workers/adaptive-aptitude-api
npm install
```

2. Set secrets:
```bash
wrangler secret put VITE_SUPABASE_URL
wrangler secret put VITE_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put OPENROUTER_API_KEY
```

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is required for caching AI-generated questions to the database. This key bypasses Row Level Security (RLS) policies, allowing the worker to INSERT questions into the cache table. Without this key, the worker will fall back to the anonymous key, and cache writes will fail silently due to RLS restrictions.

3. Deploy:
```bash
npm run deploy
```

## Local Development

```bash
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (used for SELECT operations) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (required for caching - bypasses RLS for INSERT/UPDATE operations) |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI generation |
