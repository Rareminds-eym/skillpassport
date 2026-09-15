# Course API - Pages Function

Migrated from `cloudflare-workers/course-api` (1561 lines, 6 endpoints)

## Endpoints

1. `/api/course/get-file-url` - Return authenticated storage proxy URLs for R2 files
2. `/api/course/ai-tutor-suggestions` - Generate suggested questions for lessons
3. `/api/course/ai-tutor-chat` - AI tutor chat with streaming and conversation phases
4. `/api/course/ai-tutor-feedback` - Submit feedback on AI responses
5. `/api/course/ai-tutor-progress` - Track learner progress (GET/POST)
6. `/api/course/ai-video-summarizer` - Transcribe and summarize videos with enhancements

## Features

- **R2 Integration**: Binding-only R2 access through the shared storage proxy
- **AI Tutor**: Context-aware tutoring with conversation phases (opening, exploring, deep_dive)
- **Video Processing**: Transcription (Deepgram/Groq), summarization, sentiment analysis, speaker diarization
- **Progress Tracking**: learner course progress management
- **Feedback System**: Thumbs up/down feedback on AI responses

## Architecture

- **Main Handler**: `[[path]].ts` - Routes requests to appropriate handlers
- **Handlers**: Separate files for each endpoint in `handlers/` directory
- **Utils**: Shared utilities (auth, course context, transcription) in `utils/` directory

## Dependencies

- `@supabase/supabase-js` - Database client
- OpenRouter API for AI models
- Deepgram API for transcription (primary)
- Groq API for transcription (fallback)

## Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `DEEPGRAM_API_KEY` (optional)
- `GROQ_API_KEY` (optional)
- `R2_BUCKET` binding, configured in `wrangler.toml`
- `CLOUDFLARE_R2_PUBLIC_URL` (optional, only if a public/custom R2 domain is configured)

## Key Features

### Conversation Phases
- **Opening** (first message): Short, conversational (150 words max)
- **Exploring** (messages 2-4): Moderate depth (200-400 words)
- **Deep Dive** (message 5+): Comprehensive explanations

### Video Summarizer Enhancements
- Transcription with Deepgram (primary) or Groq (fallback)
- AI-generated summary and key points
- Chapter markers with timestamps
- Sentiment analysis
- Speaker diarization
- Notable quotes extraction
- Quiz questions generation
- Flashcards generation
- SRT/VTT subtitle formats

### Course Context Builder
- Fetches course, modules, lessons, resources
- Tracks learner progress
- Includes video summaries if available
- Formats context for AI prompts
