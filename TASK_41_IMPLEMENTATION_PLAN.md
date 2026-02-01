# Task 41: AI Video Summarizer - Implementation Plan

**Complexity**: VERY HIGH  
**Estimated Lines**: 800-1000 lines  
**Requirements**: 7.7, 7.8

---

## Overview

The AI Video Summarizer is the most complex handler in the Course API. It involves:
1. Video transcription with Deepgram (primary) and Groq (fallback)
2. AI-generated content (summary, key points, chapters, topics)
3. Notable quotes extraction
4. Quiz questions generation
5. Flashcards generation
6. SRT/VTT subtitle generation
7. Background processing with `waitUntil`
8. Caching and status polling

---

## Original Implementation Analysis

### Main Handler (`handleAiVideoSummarizer`)
**Location**: `cloudflare-workers/course-api/src/index.ts` lines 1380-1520

**Flow**:
1. Validate POST method and videoUrl
2. Check cache for existing completed summary
3. Check if already processing (return 202)
4. Create processing record in database
5. Start background processing with `ctx.waitUntil`
6. Return 202 Accepted immediately

**Background Processing**:
1. Transcribe video (Deepgram → Groq fallback)
2. Run AI generation tasks in parallel:
   - Generate summary, key points, chapters, topics
   - Extract notable quotes
   - Generate quiz questions (if enabled)
   - Generate flashcards (if enabled)
3. Generate SRT and VTT subtitles
4. Save all results to database
5. Update status to 'completed' or 'failed'

---

## Required Files

### 1. Main Handler
**File**: `functions/api/course/handlers/ai-video-summarizer.ts`
- Main POST handler
- Cache checking
- Processing status management
- Background processing orchestration

### 2. Transcription Utilities
**File**: `functions/api/course/utils/transcription.ts`
- `transcribeVideo()` - Main transcription function with fallback
- `transcribeWithDeepgram()` - Deepgram API integration
- `transcribeWithGroqWhisper()` - Groq Whisper API integration
- Helper functions for audio/video processing

### 3. Video Processing Utilities
**File**: `functions/api/course/utils/video-processing.ts`
- `generateVideoSummary()` - AI-generated summary and analysis
- `extractNotableQuotes()` - Extract memorable quotes
- `generateQuizQuestions()` - Create quiz questions
- `generateFlashcards()` - Create flashcards
- `generateSRT()` - Generate SRT subtitles
- `generateVTT()` - Generate VTT subtitles
- Helper functions for formatting

### 4. Types
**File**: `functions/api/course/types/video.ts` (optional)
- TypeScript interfaces for video processing

---

## Key Challenges

### 1. Background Processing
**Challenge**: Pages Functions don't have `ExecutionContext.waitUntil`  
**Solution**: Use `context.waitUntil()` from PagesFunction context

### 2. AI Calls
**Challenge**: Must use `callOpenRouterWithRetry` instead of direct AI calls  
**Solution**: Replace all `callAI()` calls with `callOpenRouterWithRetry()`

### 3. Large Codebase
**Challenge**: 800+ lines of code across multiple functions  
**Solution**: Break into modular utilities, implement incrementally

### 4. External APIs
**Challenge**: Deepgram and Groq API integrations  
**Solution**: Preserve original API call logic, add error handling

### 5. Database Schema
**Challenge**: `video_summaries` table with many fields  
**Solution**: Verify schema exists, use exact field names

---

## Implementation Strategy

### Phase 1: Utility Functions (Transcription)
1. Create `functions/api/course/utils/transcription.ts`
2. Implement `transcribeWithDeepgram()`
3. Implement `transcribeWithGroqWhisper()`
4. Implement `transcribeVideo()` with fallback logic
5. Add helper functions (formatTime, getContentType, etc.)

### Phase 2: Utility Functions (Video Processing)
1. Create `functions/api/course/utils/video-processing.ts`
2. Implement `generateVideoSummary()` with `callOpenRouterWithRetry`
3. Implement `extractNotableQuotes()` with `callOpenRouterWithRetry`
4. Implement `generateQuizQuestions()` with `callOpenRouterWithRetry`
5. Implement `generateFlashcards()` with `callOpenRouterWithRetry`
6. Implement `generateSRT()` and `generateVTT()`

### Phase 3: Main Handler
1. Create `functions/api/course/handlers/ai-video-summarizer.ts`
2. Implement cache checking
3. Implement processing status management
4. Implement background processing with `context.waitUntil()`
5. Implement error handling and status updates

### Phase 4: Router Integration
1. Update `functions/api/course/[[path]].ts`
2. Wire `/ai-video-summarizer` endpoint
3. Remove 501 stub
4. Update documentation

### Phase 5: Testing & Verification
1. TypeScript compilation
2. Verify all AI calls use `callOpenRouterWithRetry`
3. Verify database operations
4. Create completion documents

---

## Database Schema

### Table: `video_summaries`
```sql
- id (primary key)
- video_url (text)
- lesson_id (uuid, nullable)
- course_id (uuid, nullable)
- language (text, default 'en')
- processing_status (enum: 'processing', 'completed', 'failed')
- transcript (text)
- transcript_segments (jsonb)
- summary (text)
- key_points (jsonb array)
- chapters (jsonb array)
- topics (jsonb array)
- duration_seconds (integer)
- sentiment_data (jsonb, nullable)
- speakers (jsonb array)
- deepgram_summary (text, nullable)
- notable_quotes (jsonb array)
- quiz_questions (jsonb array)
- flashcards (jsonb array)
- srt_content (text)
- vtt_content (text)
- error_message (text, nullable)
- processed_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## API Specification

### Request
```http
POST /api/course/ai-video-summarizer
Content-Type: application/json

{
  "videoUrl": "https://example.com/video.mp4",
  "lessonId": "uuid" (optional),
  "courseId": "uuid" (optional),
  "language": "en" (optional, default: "en"),
  "enableQuiz": true (optional, default: true),
  "enableFlashcards": true (optional, default: true)
}
```

### Response (Immediate - 202 Accepted)
```json
{
  "id": "uuid",
  "video_url": "https://example.com/video.mp4",
  "processing_status": "processing",
  "message": "Video processing started. Poll for status updates."
}
```

### Response (Cached - 200 OK)
```json
{
  "id": "uuid",
  "video_url": "https://example.com/video.mp4",
  "processing_status": "completed",
  "transcript": "...",
  "summary": "...",
  "key_points": [...],
  "chapters": [...],
  "topics": [...],
  "duration_seconds": 300,
  "notable_quotes": [...],
  "quiz_questions": [...],
  "flashcards": [...],
  "srt_content": "...",
  "vtt_content": "...",
  "processed_at": "2026-02-01T..."
}
```

---

## Requirements Coverage

### Requirement 7.7
> WHEN a video is submitted for summarization THEN the Course API SHALL transcribe it using Deepgram or Groq

**Implementation**:
- ✅ Try Deepgram first (if API key available)
- ✅ Fallback to Groq Whisper (if Deepgram fails)
- ✅ Return error if both fail

### Requirement 7.8
> WHEN a video is transcribed THEN the Course API SHALL generate summary, key points, chapters, and quiz questions

**Implementation**:
- ✅ Generate summary (2-3 paragraphs)
- ✅ Generate key points (5-8 bullet points)
- ✅ Generate chapters with timestamps
- ✅ Generate quiz questions (5 MCQ)
- ✅ Generate flashcards (5-8 cards)
- ✅ Generate SRT/VTT subtitles

---

## Estimated Effort

- **Transcription utilities**: ~300 lines
- **Video processing utilities**: ~400 lines
- **Main handler**: ~150 lines
- **Router integration**: ~10 lines
- **Total**: ~860 lines

**Time Estimate**: 2-3 hours for implementation + testing

---

## Next Steps

1. Start with Phase 1: Transcription utilities
2. Implement Phase 2: Video processing utilities
3. Implement Phase 3: Main handler
4. Complete Phase 4: Router integration
5. Verify Phase 5: Testing & documentation

---

## Notes

- This is the most complex task in the entire spec
- Requires careful handling of async operations
- Must preserve all original logic while adapting to Pages Functions
- Background processing is critical for user experience
- Caching prevents redundant processing
