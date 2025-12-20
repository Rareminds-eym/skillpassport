# Career AI - Production Ready Implementation Guide

## Overview

Career AI is a modern AI agent designed to help Indian students with career guidance, job matching, skill development, and interview preparation. This implementation follows best practices for production-ready AI systems.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Career AI Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │───▶│  Edge Func   │───▶│  OpenRouter  │      │
│  │  (React)     │◀───│  (Deno)      │◀───│  (GPT-4o)    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                                    │
│         │            ┌──────┴──────┐                            │
│         │            │             │                            │
│         ▼            ▼             ▼                            │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                    Supabase                           │      │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │      │
│  │  │students │ │ skills  │ │ courses │ │  jobs   │    │      │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │      │
│  │  ┌─────────────────┐ ┌─────────────────────────┐    │      │
│  │  │ conversations   │ │ assessment_results      │    │      │
│  │  └─────────────────┘ └─────────────────────────┘    │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Intent Detection (v2)
- **12 Career Intents**: find-jobs, skill-gap, interview-prep, resume-review, learning-path, career-guidance, assessment-insights, application-status, networking, course-progress, course-recommendation, general
- **Confidence Scoring**: high/medium/low based on pattern matching
- **Context-Aware**: Uses conversation history to improve detection
- **Chip Support**: Quick action chips boost intent scores

### 2. Conversation Phases
- **Opening**: Short, warm greeting (150-200 words)
- **Exploring**: Moderate depth (300-500 words)
- **Deep Dive**: Comprehensive guidance (up to 800 words)
- **Follow Up**: Balanced, builds on previous discussion

### 3. Context Building
- **Student Profile**: Skills, education, experience, projects
- **Assessment Results**: RIASEC, personality, aptitude, career fit
- **Career Progress**: Applications, enrollments, saved jobs
- **Course Context**: Enrolled courses, available courses
- **Opportunities**: Real job listings from database

### 4. Safety & Guardrails
- **Prompt Injection Detection**: Blocks manipulation attempts
- **Harmful Content Filter**: Blocks inappropriate requests
- **PII Redaction**: Protects sensitive information
- **Off-Topic Detection**: Keeps conversations career-focused
- **Response Validation**: Ensures safe AI outputs

### 5. Memory Management
- **Entity Extraction**: Jobs, skills, companies, preferences
- **Conversation Summary**: Compresses long conversations
- **Topic Tracking**: Detects topic shifts
- **Action Items**: Extracts actionable recommendations

## File Structure

```
supabase/functions/
├── career-ai-chat/
│   └── index.ts                    # Main handler (v2.0)
└── _shared/
    ├── ai/
    │   ├── agent/
    │   │   ├── tools.ts            # ReAct agent tools
    │   │   └── executor.ts         # Agent execution loop
    │   ├── prompts/
    │   │   ├── enhanced-system-prompt.ts  # Production prompt
    │   │   ├── few-shot.ts         # Example responses
    │   │   ├── chain-of-thought.ts # Reasoning framework
    │   │   ├── verification.ts     # Self-check rules
    │   │   └── intent-instructions.ts
    │   ├── intent-detection-v2.ts  # Enhanced intent detection
    │   ├── conversation-phase.ts   # Phase management
    │   ├── guardrails.ts           # Safety module
    │   ├── memory.ts               # Context management
    │   └── riasec.ts               # Assessment interpretation
    ├── context/
    │   ├── student.ts              # Student profile builder
    │   ├── assessment.ts           # Assessment context
    │   ├── progress.ts             # Career progress
    │   ├── courses.ts              # Course context
    │   └── opportunities.ts        # Job opportunities
    ├── types/
    │   └── career-ai.ts            # TypeScript interfaces
    └── utils/
        ├── cors.ts                 # CORS headers
        └── auth.ts                 # Authentication
```

## Production Optimizations

### 1. Performance
- **Parallel Context Building**: Fetches student, assessment, progress, courses simultaneously
- **Rate Limiting**: 30 requests/minute per user
- **Context Compression**: Limits conversation history to last 10 messages
- **Streaming Responses**: SSE for real-time token delivery

### 2. Reliability
- **Input Sanitization**: Removes HTML, limits length
- **Error Handling**: Graceful degradation with user-friendly messages
- **Database Fallbacks**: Handles missing data gracefully
- **Timeout Management**: Prevents hanging requests

### 3. Quality
- **Anti-Hallucination Rules**: Only mentions real jobs/courses from database
- **Skill Verification**: Only attributes skills explicitly listed
- **Phase-Appropriate Responses**: Length matches conversation stage
- **Intent-Specific Guidance**: Tailored instructions per intent

## API Usage

### Request
```typescript
POST /functions/v1/career-ai-chat
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "message": "What jobs match my skills?",
  "conversationId": "uuid-optional",
  "selectedChips": ["Find Jobs"]
}
```

### Response (SSE Stream)
```
event: token
data: {"content": "Hi "}

event: token
data: {"content": "Rahul! "}

event: done
data: {
  "conversationId": "uuid",
  "messageId": "uuid",
  "intent": "find-jobs",
  "intentConfidence": "high",
  "phase": "opening",
  "hasAssessment": true,
  "executionTime": 1234
}
```

## Environment Variables

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENROUTER_API_KEY=xxx
```

## Deployment

```bash
# Deploy edge function
supabase functions deploy career-ai-chat

# Set secrets
supabase secrets set OPENROUTER_API_KEY=xxx
```

## Monitoring

### Key Metrics to Track
- Response latency (target: <3s for first token)
- Intent detection accuracy
- Conversation completion rate
- User satisfaction (feedback)
- Error rate by type

### Logging
```
[REQUEST] studentId: xxx, convId: new, msg: "What jobs..."
[ANALYSIS] Phase: opening | Intent: find-jobs (high) | Score: 75
[CONTEXT] Profile: Rahul, Skills: 5, Courses: 3
[CONTEXT] Fetched 50 opportunities
[COMPLETE] Intent: find-jobs, Time: 1234ms, Response: 456 chars
```

## Future Enhancements

1. **Vector Search**: Semantic job matching with embeddings
2. **Multi-Turn Planning**: Complex career planning workflows
3. **Proactive Suggestions**: Push notifications for new matches
4. **Voice Interface**: Speech-to-text integration
5. **Analytics Dashboard**: Career AI usage insights

## Support

For issues or questions, check:
- Edge function logs in Supabase dashboard
- Browser console for frontend errors
- Network tab for API responses
