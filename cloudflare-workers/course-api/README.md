# Course API Cloudflare Worker

Handles course-related AI features including AI tutor, video transcription, and file access.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/get-file-url` | POST | Generate presigned URLs for R2 files |
| `/ai-tutor-suggestions` | POST | Generate suggested questions for lessons |
| `/ai-tutor-chat` | POST | AI tutor chat with streaming |
| `/ai-tutor-feedback` | POST | Submit feedback on AI responses |
| `/ai-tutor-progress` | POST | Track student progress |
| `/ai-video-summarizer` | POST | Transcribe and summarize videos |

## Environment Variables

### Required

| Variable | Description | Usage |
|----------|-------------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL | Database operations |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | User-scoped queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Admin operations |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key | AI features (model: openai/gpt-4o-mini) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare R2 account ID | File storage operations |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 access key | R2 authentication |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret key | R2 authentication |
| `CLOUDFLARE_R2_BUCKET_NAME` | R2 bucket name | File storage bucket |

### R2 Bucket Binding

| Binding | Value | Description |
|---------|-------|-------------|
| `R2_BUCKET` | `skill-echosystem` | Direct R2 bucket access (configured in wrangler.toml) |

### Optional

| Variable | Description | Default | Usage |
|----------|-------------|---------|-------|
| `DEEPGRAM_API_KEY` | Deepgram API key | None | Primary transcription service (Nova-2 model) |
| `GROQ_API_KEY` | Groq API key | None | Fallback transcription (Whisper Large V3) |

## Setup Instructions

### 1. Install Dependencies
```bash
cd cloudflare-workers/course-api
npm install
```

### 2. Configure Secrets
```bash
# Required secrets
wrangler secret put VITE_SUPABASE_URL
wrangler secret put VITE_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put VITE_OPENROUTER_API_KEY
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_R2_ACCESS_KEY_ID
wrangler secret put CLOUDFLARE_R2_SECRET_ACCESS_KEY
wrangler secret put CLOUDFLARE_R2_BUCKET_NAME

# Optional transcription services
wrangler secret put DEEPGRAM_API_KEY
wrangler secret put GROQ_API_KEY
```

### 3. Configure R2 Bucket Binding
The R2 bucket is configured in `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "skill-echosystem"
```

### 4. Deploy
```bash
npm run deploy
```

### 5. Update Frontend Environment
```env
VITE_COURSE_API_URL=https://course-api.your-subdomain.workers.dev
```

## Features

### AI Tutor Chat (`/ai-tutor-chat`)
- **Streaming responses** using SSE
- **Conversation phases**: opening (150 words), exploring (400 words), deep_dive (800+ words)
- **Context includes**:
  - Full course structure
  - Current lesson content
  - PDF/resource contents
  - Video summaries
  - Student progress
- Adaptive responses based on student level
- Socratic method for problem-solving

### Video Transcription (`/ai-video-summarizer`)
- **Primary**: Deepgram Nova-2 (if configured)
  - Speaker diarization
  - Sentiment analysis
  - Utterance detection
  - Language detection
- **Fallback**: Groq Whisper Large V3 (25MB limit)
- **AI-Generated**:
  - Comprehensive summary
  - Key points
  - Chapter markers with timestamps
  - Topic tags
  - Notable quotes
  - Quiz questions
  - Flashcards
- **Export formats**: SRT, VTT, JSON

### File Access (`/get-file-url`)
- Generates presigned R2 URLs
- Supports video, audio, PDF, documents
- Direct access to course materials

## Transcription Features

When both APIs are configured:
1. Tries Deepgram first (faster, URL-based API)
2. Falls back to Groq Whisper if Deepgram fails
3. Returns rich metadata:
   - Transcript with timestamps
   - Speaker segments
   - Sentiment analysis
   - Notable quotes
   - Auto-generated summary
   - Quiz questions
   - Flashcards

### Supported Media Formats
- **Video**: MP4, MOV, AVI, MKV, WebM
- **Audio**: MP3, WAV, OGG, FLAC, M4A, AAC, WMA

## Development

```bash
# Start local dev server
npm run dev

# View real-time logs
npm run tail
```

## Response Format

### AI Tutor Chat (SSE)
```javascript
// Token streaming
event: token
data: {"content": "The concept of..."}

// Completion
event: done
data: {"conversationId": "...", "messageId": "...", "phase": "exploring"}

// Error  
event: error
data: {"error": "Error message"}
```

### Video Summary
```json
{
  "success": true,
  "data": {
    "transcript": "Full transcript...",
    "summary": "Video summary...",
    "keyPoints": ["Point 1", "Point 2"],
    "chapters": [{"timestamp": 0, "title": "Introduction", "summary": "..."}],
    "topics": ["Topic 1", "Topic 2"],
    "quotes": [{"text": "...", "timestamp": 120}],
    "quiz": [...],
    "flashcards": [...],
    "sentimentData": {...},
    "speakers": [...],
    "srtSubtitles": "...",
    "vttSubtitles": "...",
    "duration": 1234
  }
}
```

## Conversation Phases

| Phase | Trigger | Style | Max Tokens |
|-------|---------|-------|------------|
| **Opening** | First message | Short, conversational (150 words) | 250 |
| **Exploring** | Messages 2-4 | Moderate depth (200-400 words) | 1500 |
| **Deep Dive** | Message 5+ | Comprehensive (up to 800 words) | 3000 |

## Notes

- AI model: **openai/gpt-4o-mini** via OpenRouter
- R2 bucket binding provides direct file access
- Transcription automatically tries URLs first, then downloads
- Video summaries saved to `video_summaries` table
- Supports multiple languages via Deepgram language detection
- Groq has 25MB file size limit
- All costs optimized through conversation phases
