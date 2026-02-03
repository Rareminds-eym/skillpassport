# Cloudflare Unimplemented Features Design Document

## Overview

This design document outlines the architecture and implementation strategy for completing all unimplemented features in Cloudflare Pages Functions. This includes implementing 52 stubbed endpoints across 6 APIs and migrating 1 standalone worker to Pages Functions.

### Current State

The consolidation from standalone workers to Pages Functions created the infrastructure but left many endpoints as stubs returning 501 "Not Implemented". Additionally, the `analyze-assessment-api` worker was never migrated to Pages Functions.

### Target State

All endpoints will be fully implemented with:
- Complete handler logic migrated from original workers
- Shared utilities for common operations
- Proper error handling and validation
- AI integration where needed
- Database operations via Supabase
- R2 storage operations where needed

## Architecture

### High-Level Architecture

```
Cloudflare Pages Functions
├── User API (27 endpoints)
│   ├── Signup handlers (12) - MIGRATE from cloudflare-workers/user-api/src/handlers/
│   ├── Utility handlers (9) - MIGRATE from cloudflare-workers/user-api/src/handlers/utility.ts
│   └── Authenticated handlers (6) - MIGRATE from cloudflare-workers/user-api/src/handlers/authenticated.ts
├── Storage API (14 endpoints)
│   ├── R2 operations (aws4fetch) - MIGRATE from cloudflare-workers/storage-api/src/index.ts
│   ├── Presigned URLs
│   └── Document proxy
├── Role Overview API (2 endpoints)
│   ├── OpenRouter AI integration - MIGRATE from cloudflare-workers/role-overview-api/src/
│   └── Gemini fallback
├── Question Generation API (3 endpoints)
│   ├── Streaming SSE - NEW IMPLEMENTATION
│   ├── Course-specific generation - HANDLER EXISTS, needs routing
│   └── Stability confirmation - MIGRATE from cloudflare-workers/question-generation-api/src/
├── Course API (5 endpoints)
│   ├── AI tutor system - MIGRATE from cloudflare-workers/course-api/src/
│   ├── Video transcription (Deepgram/Groq)
│   └── Progress tracking
├── Career API (1 endpoint)
│   └── Assessment analysis - MIGRATE from functions/api/career/handlers/analyze-assessment.ts
└── Analyze Assessment API (NEW - migration)
    └── Dedicated assessment analysis - MIGRATE from cloudflare-workers/analyze-assessment-api/src/

Shared Libraries (EXISTING - REUSE)
├── src/functions-lib/
│   ├── supabase.ts ✅ EXISTING
│   ├── cors.ts ✅ EXISTING
│   ├── response.ts ✅ EXISTING
│   └── types.ts ✅ EXISTING
└── functions/api/shared/
    ├── ai-config.ts ✅ EXISTING (comprehensive AI utilities)
    └── auth.ts ✅ EXISTING (in career/utils/auth.ts - MOVE to shared)
```

### Existing Utilities to Reuse

#### 1. AI Configuration (functions/api/shared/ai-config.ts) ✅
**Already Implemented - REUSE EVERYWHERE**
- `callOpenRouterWithRetry()` - Automatic retry with model fallback
- `callAIWithFallback()` - Claude → OpenRouter fallback
- `repairAndParseJSON()` - Robust JSON parsing with repair
- `generateUUID()` - UUID generation
- `delay()` - Async delay utility
- `getAPIKeys()` - Environment variable helper
- Model profiles for all use cases
- Comprehensive error handling

**Usage in New Implementations:**
```typescript
import { callOpenRouterWithRetry, repairAndParseJSON, getAPIKeys } from '../../shared/ai-config';

// All AI calls should use this pattern
const { openRouter } = getAPIKeys(env);
const response = await callOpenRouterWithRetry(openRouter, messages, {
  maxTokens: 4000,
  temperature: 0.7
});
const parsed = repairAndParseJSON(response);
```

#### 2. Authentication (functions/api/career/utils/auth.ts) ✅
**Already Implemented - MOVE TO SHARED**
- `authenticateUser()` - JWT decode + Supabase fallback
- `sanitizeInput()` - XSS prevention
- `generateConversationTitle()` - Title generation
- `isValidUUID()` - UUID validation

**Action Required:**
```bash
# Move to shared location
mv functions/api/career/utils/auth.ts functions/api/shared/auth.ts
# Update all imports
```

#### 3. Supabase Client (src/functions-lib/supabase.ts) ✅
**Already Implemented - REUSE**
- `createSupabaseClient()` - Standard client creation
- Proper environment variable handling

#### 4. Response Utilities (src/functions-lib/response.ts) ✅
**Already Implemented - REUSE**
- `jsonResponse()` - Consistent JSON responses
- Proper CORS headers

### Migration Sources

#### User API - Complete Handler Files Available
**Source:** `cloudflare-workers/user-api/src/handlers/`
- ✅ `school.ts` - School signup handlers (3 endpoints)
- ✅ `college.ts` - College signup handlers (3 endpoints)
- ✅ `university.ts` - University signup handlers (3 endpoints)
- ✅ `recruiter.ts` - Recruiter signup handlers (2 endpoints)
- ✅ `unified.ts` - Unified signup handler (1 endpoint)
- ✅ `utility.ts` - Institution lists + validation (9 endpoints)
- ✅ `authenticated.ts` - Authenticated operations (6 endpoints)
- ✅ `events.ts` - Event user creation (1 endpoint)
- ✅ `password.ts` - Password reset (1 endpoint)

**Source:** `cloudflare-workers/user-api/src/utils/`
- ✅ `email.ts` - Email sending utilities
- ✅ `helpers.ts` - Validation helpers
- ✅ `supabase.ts` - Supabase utilities

**Migration Strategy:** Direct copy with import path updates

#### Storage API - Complete Implementation Available
**Source:** `cloudflare-workers/storage-api/src/index.ts` (942 lines)
- ✅ All 14 endpoints in single file
- ✅ R2 client with aws4fetch
- ✅ Presigned URL generation
- ✅ Document proxy
- ✅ PDF extraction
- ✅ Payment receipt handling

**Migration Strategy:** Extract handlers into separate files, reuse R2 client logic

#### Role Overview API - Complete Implementation Available
**Source:** `cloudflare-workers/role-overview-api/src/`
- ✅ `handlers/roleOverviewHandler.ts` - Role overview generation
- ✅ `handlers/courseMatchingHandler.ts` - Course matching
- ✅ `services/openRouterService.ts` - OpenRouter integration
- ✅ `services/geminiService.ts` - Gemini fallback
- ✅ `prompts/roleOverviewPrompt.ts` - Comprehensive prompts
- ✅ `prompts/courseMatchingPrompt.ts` - Matching prompts
- ✅ `utils/validation.ts` - Request validation
- ✅ `utils/parser.ts` - Response parsing
- ✅ `utils/fallback.ts` - Static fallback data

**Migration Strategy:** Direct copy, replace OpenRouter calls with shared ai-config utilities

#### Course API - Partial Implementation Available
**Source:** `cloudflare-workers/course-api/src/index.ts` (1561 lines)
- ✅ AI tutor suggestions logic
- ✅ AI tutor chat with streaming
- ✅ Feedback handling
- ✅ Progress tracking
- ✅ Video summarizer with Deepgram/Groq
- ✅ Course context builder
- ✅ Conversation phase system

**Migration Strategy:** Extract from monolithic file into separate handlers

#### Analyze Assessment API - Complete Implementation Available
**Source:** `cloudflare-workers/analyze-assessment-api/src/`
- ✅ `index.ts` - Assessment analysis handler
- ✅ Comprehensive 800+ line prompt builder
- ✅ RIASEC scoring logic
- ✅ JSON repair for truncated responses
- ✅ Model fallback (Claude → GPT-4)

**Migration Strategy:** Create new Pages Function, copy implementation

## Target File Structure

After implementation, the file structure should be:

```
functions/api/
├── shared/
│   ├── ai-config.ts ✅ (existing)
│   ├── auth.ts (move from career/utils/auth.ts)
│   └── email-client.ts (if needed)
│
├── user/
│   ├── [[path]].ts (router)
│   ├── handlers/
│   │   ├── school.ts
│   │   ├── college.ts
│   │   ├── university.ts
│   │   ├── recruiter.ts
│   │   ├── unified.ts
│   │   ├── utility.ts
│   │   ├── authenticated.ts
│   │   ├── events.ts
│   │   └── password.ts
│   └── utils/
│       ├── email.ts
│       ├── helpers.ts
│       └── validation.ts
│
├── storage/
│   ├── [[path]].ts (router)
│   ├── handlers/
│   │   ├── upload.ts
│   │   ├── delete.ts
│   │   ├── presigned.ts
│   │   ├── confirm.ts
│   │   ├── get-url.ts
│   │   ├── document-access.ts
│   │   ├── signed-url.ts
│   │   ├── payment-receipt.ts
│   │   ├── certificate.ts
│   │   ├── extract-content.ts
│   │   └── list-files.ts
│   └── utils/
│       └── r2-client.ts
│
├── role-overview/
│   ├── [[path]].ts (router)
│   ├── handlers/
│   │   ├── role-overview.ts
│   │   └── course-matching.ts
│   ├── services/
│   │   ├── openrouter.ts (use shared/ai-config instead)
│   │   └── gemini.ts (use shared/ai-config instead)
│   ├── prompts/
│   │   ├── role-overview.ts
│   │   └── course-matching.ts
│   └── utils/
│       ├── validation.ts
│       ├── parser.ts
│       └── fallback.ts
│
├── question-generation/
│   ├── [[path]].ts (router)
│   ├── handlers/
│   │   ├── career-aptitude.ts ✅ (existing)
│   │   ├── career-knowledge.ts ✅ (existing)
│   │   ├── streaming.ts (NEW)
│   │   ├── course-assessment.ts (NEW)
│   │   └── adaptive.ts ✅ (existing)
│   └── utils/
│       ├── prompts.ts
│       ├── cache.ts
│       └── validation.ts
│
├── course/
│   ├── [[path]].ts (router)
│   ├── handlers/
│   │   ├── get-file-url.ts ✅ (existing)
│   │   ├── ai-tutor-suggestions.ts (implement)
│   │   ├── ai-tutor-chat.ts (implement)
│   │   ├── ai-tutor-feedback.ts (implement)
│   │   ├── ai-tutor-progress.ts (implement)
│   │   └── ai-video-summarizer.ts (implement)
│   └── utils/
│       ├── course-context.ts
│       ├── conversation-phases.ts
│       ├── transcription.ts
│       └── video-processing.ts
│
├── career/
│   ├── [[path]].ts (router)
│   ├── handlers/
│   │   ├── chat.ts ✅ (existing)
│   │   ├── recommend.ts ✅ (existing)
│   │   ├── analyze-assessment.ts (implement)
│   │   ├── generate-embedding.ts ✅ (existing)
│   │   ├── field-keywords.ts ✅ (existing)
│   │   └── parse-resume.ts ✅ (existing)
│   ├── types.ts ✅ (existing)
│   └── utils/
│       ├── auth.ts ✅ (move to shared)
│       └── rate-limit.ts ✅ (existing)
│
└── analyze-assessment/ (NEW)
    ├── [[path]].ts (router)
    ├── handlers/
    │   └── analyze.ts
    └── utils/
        ├── prompt-builder.ts
        └── scoring.ts
```



## Components and Interfaces

### 1. User API Components

#### Signup Handlers
Location: `functions/api/user/handlers/signup/`

**Unified Signup Handler**
- Validates user data
- Creates Supabase Auth account
- Creates profile record in appropriate table
- Sends welcome email

**Role-Specific Signup Handlers**
- School: admin, educator, student
- College: admin, educator, student  
- University: admin, educator, student
- Recruiter: admin, recruiter

Each handler:
- Validates institution code
- Checks email uniqueness
- Creates auth + profile atomically
- Assigns appropriate role

#### Utility Handlers
Location: `functions/api/user/handlers/utility/`

**Institution Lists**
- GET /schools - Returns active schools
- GET /colleges - Returns active colleges
- GET /universities - Returns active universities
- GET /companies - Returns active companies

**Validation Handlers**
- POST /check-school-code
- POST /check-college-code
- POST /check-university-code
- POST /check-company-code
- POST /check-email

#### Authenticated Handlers
Location: `functions/api/user/handlers/authenticated/`

- POST /create-student
- POST /create-teacher
- POST /create-college-staff
- POST /update-student-documents
- POST /create-event-user
- POST /send-interview-reminder
- POST /reset-password

### 2. Storage API Components

#### R2 Client
Location: `functions/api/storage/utils/r2-client.ts`

Uses `aws4fetch` for AWS Signature V4 authentication:
```typescript
import { AwsClient } from 'aws4fetch';

export class R2Client {
  private client: AwsClient;
  
  constructor(env: PagesEnv) {
    this.client = new AwsClient({
      accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    });
  }
  
  async upload(key: string, body: ArrayBuffer, contentType: string): Promise<string>
  async delete(key: string): Promise<void>
  async list(prefix: string): Promise<R2Object[]>
  async generatePresignedUrl(key: string, expiresIn: number): Promise<string>
  async getObject(key: string): Promise<Response>
}
```

#### Storage Handlers
Location: `functions/api/storage/handlers/`

- **upload.ts** - Multipart form upload
- **presigned.ts** - Generate presigned URLs
- **document-access.ts** - Proxy document access
- **payment-receipt.ts** - Handle payment receipts
- **certificate.ts** - Handle certificates
- **extract-content.ts** - PDF text extraction
- **list-files.ts** - List files in folder

### 3. Role Overview API Components

#### AI Service Layer
Location: `functions/api/role-overview/services/`

**OpenRouter Service**
- Primary AI provider
- Model fallback chain:
  1. google/gemini-2.0-flash-exp:free
  2. google/gemini-flash-1.5-8b
  3. anthropic/claude-3.5-sonnet

**Gemini Service**
- Direct Gemini API fallback
- Used when OpenRouter fails

#### Prompt Builders
Location: `functions/api/role-overview/prompts/`

**Role Overview Prompt**
- Grade-level specific context
- Comprehensive data structure
- Industry-specific examples

**Course Matching Prompt**
- Relevance scoring criteria
- Ranking logic
- Reasoning generation

### 4. Question Generation API Components

#### Streaming Handler
Location: `functions/api/question-generation/handlers/streaming.ts`

Implements Server-Sent Events (SSE) for real-time question generation:
```typescript
export async function handleStreamingAptitude(
  request: Request,
  env: PagesEnv
): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      // Send progress updates
      controller.enqueue(`data: ${JSON.stringify({ type: 'progress', count: 10 })}\n\n`);
      
      // Send questions as generated
      controller.enqueue(`data: ${JSON.stringify({ type: 'question', data: question })}\n\n`);
      
      // Send completion
      controller.enqueue(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### Course Assessment Handler
Location: `functions/api/question-generation/handlers/course-assessment.ts`

- Fetches lesson content from database
- Builds prompt based on lesson topics
- Generates questions via OpenRouter
- Caches results in Supabase

### 5. Course API Components

#### AI Tutor System
Location: `functions/api/course/handlers/ai-tutor/`

**Conversation Phases**
- Opening (first message): Short, conversational (150 words max)
- Exploring (messages 2-4): Moderate depth (200-400 words)
- Deep Dive (message 5+): Comprehensive explanations

**Course Context Builder**
```typescript
interface CourseContext {
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  resources: Resource[];
  progress: StudentProgress;
  videoSummaries?: VideoSummary[];
}

async function buildCourseContext(
  courseId: string,
  studentId: string,
  supabase: SupabaseClient
): Promise<CourseContext>
```

**Streaming Chat Handler**
- Fetches conversation history
- Determines conversation phase
- Builds system prompt with course context
- Streams AI response
- Saves conversation to database
- Generates title for new conversations

#### Video Summarizer
Location: `functions/api/course/handlers/video-summarizer.ts`

**Transcription Services**
- Primary: Deepgram (with sentiment analysis, speaker diarization)
- Fallback: Groq Whisper

**AI Processing**
- Summary generation
- Key points extraction
- Chapter markers with timestamps
- Notable quotes
- Quiz questions
- Flashcards
- SRT/VTT subtitle generation

**Background Processing**
Uses Cloudflare's `waitUntil` for async processing:
```typescript
export async function handleAiVideoSummarizer(
  request: Request,
  env: PagesEnv,
  waitUntil: (promise: Promise<any>) => void
): Promise<Response> {
  // Check cache
  // Return 202 Accepted
  // Start background processing
  waitUntil(processVideo(videoUrl, env));
  
  return jsonResponse({ status: 'processing' }, 202);
}
```

### 6. Career API / Analyze Assessment API

#### Assessment Analysis
Location: `functions/api/analyze-assessment/handlers/analyze.ts`

**Analysis Components**
- RIASEC career interest scoring
- Multi-aptitude battery analysis
- Big Five personality assessment
- Work values analysis
- Employability skills diagnostic
- Stream recommendation (for after-10th students)
- Career cluster matching with salary ranges
- Skill gap analysis
- Learning tracks

**Prompt Builder**
800+ line comprehensive prompt including:
- Assessment data structure
- Scoring rubrics
- Career cluster definitions
- Industry context
- Grade-level considerations

**AI Model Fallback**
1. Claude 3.5 Sonnet (primary)
2. GPT-4 (fallback)
3. JSON repair for truncated responses

## Data Models

### User Profiles

```typescript
interface StudentProfile {
  id: string;
  user_id: string; // Supabase Auth ID
  name: string;
  email: string;
  school_id?: string;
  college_id?: string;
  university_id?: string;
  grade_level?: string;
  documents?: {
    resume?: string;
    certificates?: string[];
  };
  created_at: string;
  updated_at: string;
}

interface EducatorProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  institution_id: string;
  institution_type: 'school' | 'college' | 'university';
  subjects?: string[];
  created_at: string;
}
```

### R2 Storage

```typescript
interface R2Object {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
}

interface PresignedUrlRequest {
  key: string;
  expiresIn: number; // seconds
  contentType?: string;
}

interface PresignedUrlResponse {
  url: string;
  key: string;
  expiresAt: string;
}
```

### AI Tutor

```typescript
interface Conversation {
  id: string;
  student_id: string;
  course_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Feedback {
  id: string;
  message_id: string;
  student_id: string;
  rating: 'up' | 'down';
  feedback_text?: string;
  created_at: string;
}
```

### Video Summarizer

```typescript
interface VideoSummary {
  id: string;
  video_url: string;
  course_id: string;
  lesson_id: string;
  transcript: string;
  summary: string;
  key_points: string[];
  chapters: Chapter[];
  sentiment?: SentimentAnalysis;
  speakers?: SpeakerSegment[];
  quotes: string[];
  quiz_questions: QuizQuestion[];
  flashcards: Flashcard[];
  srt_subtitles: string;
  vtt_subtitles: string;
  created_at: string;
}

interface Chapter {
  timestamp: number; // seconds
  title: string;
  summary: string;
}
```

### Assessment Analysis

```typescript
interface AssessmentAnalysis {
  student_id: string;
  riasec_scores: {
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
  };
  aptitude_scores: {
    verbal: number;
    numerical: number;
    abstract: number;
    spatial: number;
    clerical: number;
  };
  personality_traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  career_clusters: CareerCluster[];
  skill_gaps: SkillGap[];
  learning_tracks: LearningTrack[];
  stream_recommendation?: StreamRecommendation;
  created_at: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### User API Properties

#### Property 1: Signup Data Validation
*For any* signup request, when the data is submitted, the system should validate all required fields and reject invalid data with clear error messages.

**Validates: Requirements 1.1**

#### Property 2: Institution Code Verification
*For any* signup with an institution code (school, college, university, or company), the system should verify the code exists in the database before creating the account.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

#### Property 3: Email Uniqueness
*For any* signup request, when an email is provided, the system should reject the signup if the email is already registered.

**Validates: Requirements 1.7**

#### Property 4: Atomic Account Creation
*For any* successful signup, both the Supabase Auth account and the corresponding profile record should be created together, or neither should be created if either operation fails.

**Validates: Requirements 1.2, 1.8**

#### Property 5: Institution List Structure
*For any* institution list endpoint (schools, colleges, universities, companies), the returned data should include institution ID, name, and code for each entry.

**Validates: Requirements 2.5**

#### Property 6: Authenticated User Creation
*For any* authenticated user creation request (student, teacher, staff), the system should verify admin permissions before creating the account.

**Validates: Requirements 11.1**

#### Property 7: Password Reset Round Trip
*For any* valid password reset request, generating a token and then using that token should successfully allow password update.

**Validates: Requirements 13.5**

### Storage API Properties

#### Property 8: File Upload Validation
*For any* file upload request, the system should validate file size and type before accepting the upload.

**Validates: Requirements 3.1**

#### Property 9: Unique File Keys
*For any* set of uploaded files, all generated file keys should be unique.

**Validates: Requirements 3.2**

#### Property 10: Upload Response Structure
*For any* successful file upload, the response should include both the file key and URL.

**Validates: Requirements 3.5**

#### Property 11: Presigned URL Expiration
*For any* presigned URL request, the generated URL should have an expiration time within acceptable bounds.

**Validates: Requirements 4.1, 4.2**

#### Property 12: Batch Presigned URLs
*For any* batch presigned URL request with N files, the system should return exactly N presigned URLs.

**Validates: Requirements 4.3**

#### Property 13: File Deletion Round Trip
*For any* file, uploading it and then deleting it should result in the file no longer existing in R2 storage.

**Validates: Requirements 4.5**

#### Property 14: File List Structure
*For any* file list request, the returned data should include file names, sizes, and last modified dates for each file.

**Validates: Requirements 10.3**

### Role Overview API Properties

#### Property 15: Role Overview Validation
*For any* role overview request, the system should validate that role title and grade level are provided and valid.

**Validates: Requirements 5.1**

#### Property 16: Role Overview Structure
*For any* generated role overview, the response should include job responsibilities, industry demand, career progression, and learning roadmap.

**Validates: Requirements 5.4**

#### Property 17: Course Ranking Order
*For any* course matching request, the returned courses should be ranked in descending order of relevance score.

**Validates: Requirements 5.5**

#### Property 18: AI Response Parsing
*For any* AI response from role overview generation, the system should successfully parse and validate the JSON structure.

**Validates: Requirements 5.3**

### Question Generation API Properties

#### Property 19: Course Question Validation
*For any* course-specific question request, the system should validate that course ID and lesson ID are provided.

**Validates: Requirements 14.1**

#### Property 20: Question Cache Round Trip
*For any* generated course questions, caching them and then retrieving from cache should return the same questions.

**Validates: Requirements 14.5**

### Course API Properties

#### Property 21: Course Context Completeness
*For any* AI tutor chat request, the built course context should include modules, lessons, resources, and student progress.

**Validates: Requirements 7.3**

#### Property 22: Feedback Storage Round Trip
*For any* submitted AI tutor feedback, storing it and then querying should return the same feedback data.

**Validates: Requirements 7.5**

#### Property 23: Progress Completion Calculation
*For any* student progress update, the calculated completion percentage should be between 0 and 100 and accurately reflect completed lessons.

**Validates: Requirements 7.6**

#### Property 24: Video Summary Structure
*For any* transcribed video, the generated summary should include summary text, key points, chapters, and quiz questions.

**Validates: Requirements 7.8**

### Career API Properties

#### Property 25: Assessment Data Validation
*For any* career assessment submission, the system should validate the assessment data structure before processing.

**Validates: Requirements 8.1**

#### Property 26: Assessment Analysis Structure
*For any* completed assessment analysis, the response should include RIASEC scores, aptitude scores, personality traits, career clusters, skill gaps, and learning tracks.

**Validates: Requirements 8.3, 8.6**

#### Property 27: JSON Parsing with Repair
*For any* AI response that fails initial JSON parsing, the system should attempt to repair truncated JSON before failing.

**Validates: Requirements 8.5**

### Migration Properties

#### Property 28: Analyze Assessment API Equivalence
*For any* request to the migrated analyze-assessment Pages Function, the response should be functionally equivalent to the standalone worker response.

**Validates: Requirements 16.5**

## Error Handling

### 1. Validation Errors (400 Bad Request)
All APIs will return clear validation errors:
- Missing required fields
- Invalid data types
- Out-of-range values
- Invalid format (email, URLs, etc.)

### 2. Authentication Errors (401 Unauthorized)
- Missing or invalid JWT token
- Expired token
- Insufficient permissions

### 3. Not Found Errors (404 Not Found)
- Institution code not found
- User not found
- File not found in R2
- Course/lesson not found

### 4. Conflict Errors (409 Conflict)
- Email already registered
- Duplicate file key

### 5. Server Errors (500 Internal Server Error)
- Database connection failures
- R2 operation failures
- AI API failures (with fallback)
- Unexpected errors

### 6. Service Unavailable (503 Service Unavailable)
- AI service temporarily unavailable
- External service (Deepgram, Groq) unavailable

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality of individual components:

1. **Validation Tests**
   - Test email validation
   - Test institution code validation
   - Test file size/type validation
   - Test request body validation

2. **Handler Tests**
   - Test each signup handler
   - Test institution list handlers
   - Test R2 operation handlers
   - Test AI integration handlers

3. **Utility Tests**
   - Test R2 client operations
   - Test presigned URL generation
   - Test prompt building
   - Test JSON parsing and repair

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using fast-check for TypeScript. All property-based tests will be configured to run a minimum of 100 iterations.

Each property-based test will be tagged with a comment explicitly referencing the correctness property:

```typescript
/**
 * Feature: cloudflare-unimplemented-features, Property 2: Institution Code Verification
 * Validates: Requirements 1.3, 1.4, 1.5, 1.6
 */
test('Institution codes are verified before signup', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        institutionType: fc.constantFrom('school', 'college', 'university', 'company'),
        code: fc.string(),
        validCode: fc.boolean(),
      }),
      async ({ institutionType, code, validCode }) => {
        // Setup: Create institution if validCode is true
        if (validCode) {
          await createInstitution(institutionType, code);
        }
        
        // Test signup
        const result = await signup({ institutionType, code });
        
        // Verify
        if (validCode) {
          expect(result.success).toBe(true);
        } else {
          expect(result.error).toContain('Invalid code');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify end-to-end functionality:

1. **User API Integration**
   - Test complete signup flow
   - Test institution code validation with database
   - Test email uniqueness check
   - Test authenticated user creation

2. **Storage API Integration**
   - Test file upload to R2
   - Test presigned URL generation and usage
   - Test file deletion from R2
   - Test document proxy access

3. **AI Integration**
   - Test role overview generation with OpenRouter
   - Test fallback to Gemini
   - Test question generation
   - Test assessment analysis

4. **Course API Integration**
   - Test AI tutor chat with streaming
   - Test video transcription with Deepgram/Groq
   - Test progress tracking
   - Test feedback submission

## Deployment Strategy

### Code Reuse Principles

1. **NEVER Rewrite Existing Code** - If it exists in original workers, migrate it
2. **Use Shared Utilities** - Always use functions/api/shared/ai-config.ts for AI calls
3. **Consistent Patterns** - Follow existing patterns in implemented APIs (otp, streak, fetch-certificate)
4. **Import Path Updates** - Only change import paths, not logic
5. **Test Original First** - Verify original worker works before migrating

### Critical: What NOT to Do

❌ **DO NOT** rewrite AI calling logic - use `callOpenRouterWithRetry` from shared/ai-config
❌ **DO NOT** rewrite JSON parsing - use `repairAndParseJSON` from shared/ai-config
❌ **DO NOT** rewrite authentication - use `authenticateUser` from shared/auth
❌ **DO NOT** create new Supabase client patterns - use `createSupabaseClient` from functions-lib
❌ **DO NOT** create new response patterns - use `jsonResponse` from functions-lib
❌ **DO NOT** hardcode model names - use MODEL_PROFILES from shared/ai-config
❌ **DO NOT** implement custom retry logic - it's already in shared/ai-config
❌ **DO NOT** implement custom UUID generation - use `generateUUID` from shared/ai-config

✅ **DO** copy existing handler logic from original workers
✅ **DO** update import paths to use shared utilities
✅ **DO** follow existing patterns in otp-api, streak-api, fetch-certificate
✅ **DO** test locally before deploying
✅ **DO** use TypeScript types from src/functions-lib/types.ts

### Migration Checklist for Each Handler

For every handler you migrate:

1. ✅ Find the original implementation in cloudflare-workers/
2. ✅ Copy the handler logic (don't rewrite)
3. ✅ Update imports:
   - `import { callOpenRouterWithRetry } from '../../shared/ai-config'`
   - `import { createSupabaseClient } from '../../../src/functions-lib/supabase'`
   - `import { jsonResponse } from '../../../src/functions-lib/response'`
   - `import { authenticateUser } from '../../shared/auth'`
4. ✅ Replace any custom AI calls with shared utilities
5. ✅ Test locally with `wrangler pages dev`
6. ✅ Verify response format matches original
7. ✅ Deploy to staging
8. ✅ Run integration tests

### Phase 1: Preparation and Shared Utilities (Week 1)

**Day 1-2: Dependency Installation**
1. Install `aws4fetch` for R2 operations
   ```bash
   npm install aws4fetch
   ```
2. Verify all environment variables configured
3. Test R2 connectivity locally

**Day 3-4: Shared Utilities Organization**
1. Move `functions/api/career/utils/auth.ts` to `functions/api/shared/auth.ts`
2. Update all imports in career API
3. Create `functions/api/shared/email-client.ts` (if needed for user API)
4. Document shared utility usage patterns

**Day 5: Local Testing Setup**
1. Set up local development environment
2. Test `wrangler pages dev` with all dependencies
3. Verify Supabase connection
4. Verify R2 connection

### Phase 2: User API Implementation (Week 2)

**Migration Source:** `cloudflare-workers/user-api/src/`

**Day 1-2: Utility Handlers (9 endpoints)**
1. Copy `handlers/utility.ts` to `functions/api/user/handlers/utility.ts`
2. Update imports to use shared utilities
3. Test institution lists endpoints
4. Test validation endpoints

**Day 3-4: Signup Handlers (12 endpoints)**
1. Copy all signup handlers:
   - `handlers/school.ts` → `functions/api/user/handlers/school.ts`
   - `handlers/college.ts` → `functions/api/user/handlers/college.ts`
   - `handlers/university.ts` → `functions/api/user/handlers/university.ts`
   - `handlers/recruiter.ts` → `functions/api/user/handlers/recruiter.ts`
   - `handlers/unified.ts` → `functions/api/user/handlers/unified.ts`
2. Update imports
3. Test all signup flows

**Day 5: Authenticated Handlers (6 endpoints)**
1. Copy `handlers/authenticated.ts`, `handlers/events.ts`, `handlers/password.ts`
2. Update imports
3. Test authenticated operations
4. Deploy to staging

### Phase 3: Storage API Implementation (Week 3)

**Migration Source:** `cloudflare-workers/storage-api/src/index.ts` (942 lines)

**Day 1-2: R2 Client and Core Operations**
1. Extract R2 client logic to `functions/api/storage/utils/r2-client.ts`
2. Implement upload handler
3. Implement delete handler
4. Test R2 operations locally

**Day 3: Presigned URLs**
1. Extract presigned URL logic to `functions/api/storage/handlers/presigned.ts`
2. Implement confirm handler
3. Implement get-url handlers
4. Test presigned URL generation

**Day 4: Document Access and Proxy**
1. Extract document access logic to `functions/api/storage/handlers/document-access.ts`
2. Implement signed-url handlers
3. Test document proxy

**Day 5: Specialized Handlers**
1. Implement payment receipt handlers
2. Implement certificate handler
3. Implement PDF extraction handler
4. Implement file listing handler
5. Deploy to staging

### Phase 4: AI APIs Implementation (Week 4-5)

#### Week 4: Role Overview and Question Generation

**Day 1-2: Role Overview API**
**Migration Source:** `cloudflare-workers/role-overview-api/src/`
1. Copy all handlers, services, prompts, utils
2. **REPLACE** OpenRouter calls with `callOpenRouterWithRetry` from shared/ai-config
3. Test role overview generation
4. Test course matching
5. Deploy to staging

**Day 3-4: Question Generation API - Streaming**
**NEW IMPLEMENTATION** (no existing code)
1. Implement SSE streaming handler for aptitude questions
2. Use `callOpenRouterWithRetry` from shared/ai-config
3. Test streaming with real client
4. Deploy to staging

**Day 5: Question Generation API - Course Assessment**
**Migration Source:** `cloudflare-workers/assessment-api/src/`
1. Copy course assessment logic
2. Update to use shared AI utilities
3. Test course question generation
4. Deploy to staging

#### Week 5: Course and Career APIs

**Day 1-3: Course API**
**Migration Source:** `cloudflare-workers/course-api/src/index.ts` (1561 lines)
1. Extract AI tutor suggestions to `functions/api/course/handlers/ai-tutor-suggestions.ts`
2. Extract AI tutor chat to `functions/api/course/handlers/ai-tutor-chat.ts`
3. Extract feedback handler to `functions/api/course/handlers/ai-tutor-feedback.ts`
4. Extract progress handler to `functions/api/course/handlers/ai-tutor-progress.ts`
5. **REPLACE** all AI calls with shared/ai-config utilities
6. Test all AI tutor features
7. Deploy to staging

**Day 4: Course API - Video Summarizer**
1. Extract video summarizer to `functions/api/course/handlers/ai-video-summarizer.ts`
2. Implement Deepgram integration
3. Implement Groq fallback
4. Test transcription and summarization
5. Deploy to staging

**Day 5: Analyze Assessment API Migration**
**Migration Source:** `cloudflare-workers/analyze-assessment-api/src/`
1. Create `functions/api/analyze-assessment/[[path]].ts`
2. Copy assessment analysis handler
3. Copy 800+ line prompt builder
4. **REPLACE** AI calls with shared/ai-config utilities
5. Test assessment analysis
6. Deploy to staging

### Phase 5: Testing and Verification (Week 6)

**Day 1-2: Integration Testing**
1. Run full integration test suite
2. Test all 52 endpoints
3. Test error handling
4. Test edge cases
5. Fix any issues found

**Day 3: Performance Testing**
1. Load test all endpoints
2. Measure response times
3. Test AI fallback chains
4. Test R2 operations under load
5. Optimize slow endpoints

**Day 4: Security Review**
1. Review authentication implementation
2. Review input validation
3. Review SQL injection prevention
4. Review file upload security
5. Review API key handling

**Day 5: Documentation**
1. Document all 52 endpoints
2. Update API documentation
3. Create migration guide
4. Update developer guide

### Phase 6: Production Deployment (Week 7)

**Day 1: Pre-deployment Checklist**
1. Verify all tests pass
2. Verify all environment variables configured
3. Verify monitoring and alerting set up
4. Create rollback plan
5. Notify stakeholders

**Day 2-3: Staged Rollout**
1. Deploy to production (0% traffic)
2. Smoke test all endpoints
3. Enable 10% traffic
4. Monitor for 4 hours
5. Enable 50% traffic
6. Monitor for 4 hours
7. Enable 100% traffic

**Day 4: Post-deployment**
1. Monitor error rates
2. Monitor performance
3. Verify all endpoints working
4. Update frontend to use new endpoints
5. Decommission standalone analyze-assessment-api worker

**Day 5: Cleanup**
1. Remove old worker code (if applicable)
2. Update GitHub workflows
3. Update documentation
4. Celebrate! 🎉

### Rollback Plan

If issues are detected:
1. **Immediate**: Shift traffic back to 0%
2. **Investigate**: Check logs and metrics
3. **Fix**: Apply fix to staging first
4. **Redeploy**: Follow staged rollout again

### Success Criteria

- ✅ All 52 endpoints return 200 (not 501)
- ✅ Error rate < 1%
- ✅ Response time < 2 seconds (p95)
- ✅ All tests passing
- ✅ No security vulnerabilities
- ✅ Documentation complete



## Security Considerations

1. **Authentication**: All authenticated endpoints verify JWT tokens
2. **Authorization**: Role-based access control for admin operations
3. **Input Validation**: All user input is validated and sanitized
4. **SQL Injection**: Use parameterized queries via Supabase client
5. **File Upload**: Validate file types and sizes, scan for malware
6. **API Keys**: Store in environment variables, never in code
7. **CORS**: Restrict origins in production
8. **Rate Limiting**: Implement rate limiting for AI endpoints

## Environment Variables

### Required for All APIs
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# AI Services
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_API_KEY=sk-or-v1-...
CLAUDE_API_KEY=sk-ant-... (optional, for fallback)
VITE_CLAUDE_API_KEY=sk-ant-... (optional)
```

### Required for Storage API
```bash
# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=skill-echosystem
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your-account.r2.dev (optional)
```

### Required for Course API (Video Summarizer)
```bash
# Transcription Services
DEEPGRAM_API_KEY=your-deepgram-key (optional, primary)
GROQ_API_KEY=gsk_... (optional, fallback)
```

### Required for User API (Email Sending)
```bash
# Email Service (if using Resend or similar)
RESEND_API_KEY=re_... (optional, if email sending is needed)
EMAIL_FROM=noreply@skillpassport.com
```

### Environment Variable Validation

Each API should validate required environment variables on startup:

```typescript
// Example validation in handler
export const onRequest: PagesFunction = async (context) => {
  const { env } = context;
  
  // Validate required vars
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENROUTER_API_KEY'];
  const missing = required.filter(key => !env[key] && !env[`VITE_${key}`]);
  
  if (missing.length > 0) {
    return jsonResponse({
      error: 'Configuration error',
      missing: missing
    }, 500);
  }
  
  // Continue with handler logic
};
```

## Dependencies

### Required NPM Packages

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "aws4fetch": "^1.0.18"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20231218.0",
    "typescript": "^5.3.3",
    "wrangler": "^3.22.1"
  }
}
```

### Installation Commands

```bash
# Install aws4fetch for R2 operations
npm install aws4fetch

# Verify all dependencies
npm install

# Test local development
npm run pages:dev
```

### Dependency Notes

1. **aws4fetch** - Required for AWS Signature V4 authentication with R2
   - Used in Storage API for all R2 operations
   - Handles presigned URL generation
   - Handles authenticated requests to R2

2. **@supabase/supabase-js** - Already installed
   - Used for all database operations
   - Used for authentication
   - Used for file storage metadata

3. **No additional AI libraries needed** - All AI calls use fetch API
   - OpenRouter API via fetch
   - Claude API via fetch
   - Deepgram API via fetch
   - Groq API via fetch

## Monitoring and Observability

### Logging Standards

All implementations should follow consistent logging patterns:

```typescript
// Success logs with emoji indicators
console.log('✅ Operation succeeded');
console.log(`🔑 Using ${modelName} for generation`);
console.log(`📦 Returning ${count} items`);

// Warning logs
console.warn('⚠️ Fallback triggered');
console.warn(`⚠️ ${issue} detected, using default`);

// Error logs with context
console.error('❌ Operation failed:', error);
console.error(`❌ ${operation} error:`, error.message);

// Progress logs
console.log(`🔄 Trying ${model} (attempt ${n}/${max})`);
console.log(`⏳ Waiting ${ms}ms before retry...`);
```

### Structured Logging

Implement structured logging for better observability:

```typescript
// Log with context
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  service: 'user-api',
  endpoint: '/signup/student',
  userId: user.id,
  duration: Date.now() - startTime,
  status: 'success'
}));
```

### Metrics

Track key metrics:
- Request count per endpoint
- Error rate per endpoint
- Response time (p50, p95, p99)
- AI API success/failure rates
- R2 operation success rates
- Cache hit rates

### Alerting

Set up alerts for:
- Error rate > 5%
- Response time > 3 seconds
- AI API failures
- R2 operation failures
- Authentication failures spike

## Database Considerations

### Required Tables

Most tables already exist in Supabase. Verify these exist:

```sql
-- User profiles (should exist)
- students
- educators  
- school_admins
- college_admins
- university_admins
- recruiters

-- Institutions (should exist)
- schools
- colleges
- universities
- companies

-- Course data (should exist)
- courses
- modules
- lessons
- resources
- student_progress

-- AI Tutor (should exist)
- conversations
- messages
- feedback

-- Video summaries (should exist)
- video_summaries

-- Assessment data (should exist)
- career_assessment_ai_questions
- career_aptitude_questions_cache
- career_knowledge_questions_cache
- adaptive_aptitude_questions_cache

-- OTP (already has migration)
- phone_otps
- otp_requests_log
```

### New Tables Needed

If any tables are missing, create them:

```sql
-- Example: If video_summaries doesn't exist
CREATE TABLE IF NOT EXISTS video_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url TEXT NOT NULL,
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  transcript TEXT,
  summary TEXT,
  key_points JSONB,
  chapters JSONB,
  quotes TEXT[],
  quiz_questions JSONB,
  flashcards JSONB,
  srt_subtitles TEXT,
  vtt_subtitles TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE video_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies as needed
CREATE POLICY "Users can view their course video summaries"
  ON video_summaries FOR SELECT
  USING (auth.uid() IN (
    SELECT student_id FROM student_progress 
    WHERE course_id = video_summaries.course_id
  ));
```

### Database Indexes

Ensure proper indexes exist for performance:

```sql
-- User lookups
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- Institution lookups
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_colleges_code ON colleges(code);

-- Course progress
CREATE INDEX IF NOT EXISTS idx_student_progress_student_course 
  ON student_progress(student_id, course_id);

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_student_course 
  ON conversations(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(conversation_id);

-- Video summaries
CREATE INDEX IF NOT EXISTS idx_video_summaries_lesson 
  ON video_summaries(lesson_id);
```

### Row Level Security (RLS)

Verify RLS policies are in place:

```sql
-- Students can only see their own data
CREATE POLICY "Students can view own profile"
  ON students FOR SELECT
  USING (auth.uid() = user_id);

-- Educators can see their institution's students
CREATE POLICY "Educators can view institution students"
  ON students FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM educators 
      WHERE user_id = auth.uid()
    )
  );

-- Similar policies for other tables
```

## Performance Optimization

### Caching Strategy

1. **Question Caching**
   - Cache generated questions in Supabase
   - Check cache before calling AI
   - TTL: 30 days for career questions, 7 days for course questions

2. **Role Overview Caching**
   - Cache role overviews by role title + grade level
   - TTL: 7 days

3. **Video Summary Caching**
   - Cache transcriptions and summaries
   - Never expire (expensive to regenerate)

4. **Institution Lists Caching**
   - Cache in memory for 1 hour
   - Refresh on cache miss

### Database Query Optimization

1. **Use Indexes** - Ensure all foreign keys and frequently queried columns have indexes
2. **Limit Results** - Always use LIMIT in queries
3. **Select Specific Columns** - Don't use SELECT *
4. **Batch Operations** - Use batch inserts/updates where possible

### AI API Optimization

1. **Model Selection** - Use fastest free models first (Gemini 2.0 Flash)
2. **Parallel Requests** - Generate questions in batches
3. **Streaming** - Use streaming for long responses
4. **Fallback Chain** - Fast models → Slower models → Fallback data

### R2 Optimization

1. **Presigned URLs** - Use presigned URLs for client-side uploads
2. **Batch Operations** - Batch multiple file operations
3. **CDN** - Use R2 public URL with CDN
4. **Compression** - Compress large files before upload

## Documentation Updates

1. **API Documentation**: Document all 52 endpoints with request/response examples
2. **Developer Guide**: How to add new endpoints, use shared utilities
3. **Deployment Guide**: Step-by-step deployment instructions
4. **Testing Guide**: How to run tests locally and in CI/CD

## Conclusion

This design provides a comprehensive plan for implementing all 52 unimplemented endpoints and migrating the analyze-assessment-api to Pages Functions. The approach prioritizes:
- Code reusability through shared utilities
- Robust error handling and validation
- AI integration with fallback mechanisms
- Comprehensive testing strategy
- Security best practices
- Monitoring and observability

