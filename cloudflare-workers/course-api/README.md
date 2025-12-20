# Course API Cloudflare Worker

A unified Cloudflare Worker that provides all course-related API endpoints, replacing multiple Supabase Edge Functions with full feature parity.

## Features

### Complete Implementation
- **AI Tutor Chat**: Full conversation phase system (opening/exploring/deep_dive), course context building, video summary context
- **AI Video Summarizer**: Deepgram transcription with sentiment analysis, speaker diarization, Groq Whisper fallback, quiz generation, flashcard generation, notable quotes extraction
- **AI Tutor Suggestions**: Context-aware question generation based on lesson content
- **AI Tutor Feedback**: Thumbs up/down feedback with optional text
- **AI Tutor Progress**: GET/POST for student progress tracking
- **Get File URL**: Presigned R2 URLs for secure file access

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/get-file-url` | POST | Generate presigned URLs for R2 files |
| `/ai-tutor-suggestions` | POST | Get AI-generated questions for lessons |
| `/ai-tutor-chat` | POST | AI tutor chat with streaming responses |
| `/ai-tutor-feedback` | POST | Submit feedback on AI responses |
| `/ai-tutor-progress` | GET/POST | Get/update student progress |
| `/ai-video-summarizer` | POST | Transcribe and summarize videos |
| `/health` | GET | Health check endpoint |

## Setup

### 1. Install Dependencies

```bash
cd cloudflare-workers/course-api
npm install
```

### 2. Configure Secrets

Set the required secrets using Wrangler:

```bash
# Supabase
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# AI Services
wrangler secret put OPENROUTER_API_KEY
wrangler secret put DEEPGRAM_API_KEY  # For video transcription with sentiment/diarization
wrangler secret put GROQ_API_KEY      # Optional fallback for transcription

# Cloudflare R2
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_R2_ACCESS_KEY_ID
wrangler secret put CLOUDFLARE_R2_SECRET_ACCESS_KEY
wrangler secret put CLOUDFLARE_R2_BUCKET_NAME
```

### 3. Deploy

```bash
npm run deploy
```

### 4. Configure Frontend

Add the worker URL to your `.env` file:

```env
VITE_COURSE_API_URL=https://course-api.<your-subdomain>.workers.dev
```

## Local Development

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`.

## API Usage

### Get File URL

```javascript
const response = await fetch('https://course-api.example.workers.dev/get-file-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileKey: 'courses/abc/video.mp4' })
});
const { url } = await response.json();
```

### AI Tutor Chat (Streaming)

```javascript
const response = await fetch('https://course-api.example.workers.dev/ai-tutor-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    courseId: 'course-123',
    lessonId: 'lesson-456',
    message: 'Explain this concept'
  })
});

const reader = response.body.getReader();
// Process SSE stream...
```

## Migration from Supabase Edge Functions

The frontend code automatically uses this worker when `VITE_COURSE_API_URL` is set. If not set, it falls back to Supabase Edge Functions.

To migrate:
1. Deploy this worker
2. Set `VITE_COURSE_API_URL` in your environment
3. The `courseApiService.js` handles the routing automatically
