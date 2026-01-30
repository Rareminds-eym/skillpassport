# Assessment API - Cloudflare Worker

Generates course-specific assessment questions using Claude AI.

## Deploy

```bash
cd cloudflare-workers/assessment-api
npm install
wrangler deploy
```

## Set Secrets

```bash
wrangler secret put VITE_SUPABASE_URL
wrangler secret put VITE_SUPABASE_ANON_KEY
wrangler secret put CLAUDE_API_KEY
```

## Update Frontend

After deploying, update your `.env`:

```env
VITE_API_URL=https://assessment-api.<your-subdomain>.workers.dev
```

## Endpoints

- `GET /health` - Health check
- `POST /generate` - Generate assessment questions

### POST /generate

```json
{
  "courseName": "React Development",
  "level": "Intermediate",
  "questionCount": 15
}
```

Response:
```json
{
  "course": "React Development",
  "questions": [...],
  "cached": false
}
```
