# Task 38: AI Tutor Chat Handler - COMPLETE ✅

**Date**: February 1, 2026  
**Phase**: Phase 4 - AI APIs (Course API)  
**Status**: COMPLETE

---

## Summary

Implemented AI tutor chat handler with streaming responses, conversation phases, course context integration, and database persistence. This is a complex feature that enables real-time AI tutoring with adaptive response depth based on conversation progress.

---

## Files Created

### 1. `functions/api/course/utils/conversation-phases.ts` (90 lines)
**Purpose**: Conversation phase system

**Key Features**:
- 3 conversation phases: opening, exploring, deep_dive
- Phase-specific parameters (maxTokens, temperature, verbosity)
- Phase-specific instructions for AI behavior

**Phases**:
```typescript
opening: {
  maxTokens: 250,
  temperature: 0.8,
  verbosity: 'low'
  // First message: brief, conversational, no lists
}

exploring: {
  maxTokens: 1500,
  temperature: 0.7,
  verbosity: 'medium'
  // Messages 2-4: moderate depth, build context
}

deep_dive: {
  maxTokens: 3000,
  temperature: 0.6,
  verbosity: 'high'
  // Message 5+: comprehensive, detailed explanations
}
```

### 2. `functions/api/course/utils/course-context.ts` (400+ lines)
**Purpose**: Build comprehensive course context for AI

**Key Features**:
- Fetches course, modules, lessons, resources
- Fetches student progress and completion percentage
- Fetches video summaries if available
- Formats context into AI-readable prompt
- Builds complete system prompt with phase instructions

**Context Includes**:
- Course information (title, description, code)
- Module and lesson structure with progress indicators
- Current lesson content and resources
- Resource content (PDFs, documents) - truncated if too long
- Video summaries (AI-generated from transcripts)
- Student progress (completed lessons, completion %)

### 3. `functions/api/course/handlers/ai-tutor-chat.ts` (280 lines)
**Purpose**: Main AI tutor chat handler with streaming

**Key Features**:
- Server-Sent Events (SSE) streaming
- Conversation phase detection
- Course context building
- Message history management
- Database persistence
- Title generation for new conversations
- Race condition handling for concurrent updates

**Flow**:
1. Authenticate user (optional)
2. Fetch existing conversation messages
3. Determine conversation phase
4. Build course context
5. Build system prompt with phase instructions
6. Stream AI response token-by-token
7. Save conversation to database
8. Generate title for new conversations

---

## Implementation Details

### Streaming Response
```typescript
const stream = new ReadableStream({
  async start(controller) {
    // Call OpenRouter with streaming
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: aiMessages,
        stream: true,
        max_tokens: phaseParams.maxTokens,
        temperature: phaseParams.temperature
      })
    });

    // Stream tokens to client
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Parse SSE data and send to client
      controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content })}\n\n`));
    }
  }
});
```

### Conversation Persistence
```typescript
if (currentConversationId) {
  // Update existing conversation
  // Re-fetch latest to avoid race condition
  const { data: latestConv } = await supabaseAdmin
    .from('tutor_conversations')
    .select('messages')
    .eq('id', currentConversationId)
    .maybeSingle();
  
  const finalMessages = [...latestMessages, userMessage, assistantMessage];
  await supabaseAdmin.from('tutor_conversations').update({
    messages: finalMessages,
    updated_at: new Date().toISOString()
  });
} else {
  // Create new conversation with generated title
  const { data: newConv } = await supabaseAdmin
    .from('tutor_conversations')
    .insert({
      student_id: studentId,
      course_id: courseId,
      lesson_id: lessonId || null,
      title: title.slice(0, 255),
      messages: updatedMessages
    });
}
```

### Title Generation
```typescript
// Generate title for new conversations
const titleResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  body: JSON.stringify({
    model: 'openai/gpt-4o-mini',
    messages: [{ 
      role: 'user', 
      content: `Generate a short title (max 50 chars) for a tutoring conversation about "${courseContext.courseTitle}" starting with: "${message}"` 
    }],
    max_tokens: 60,
    temperature: 0.5
  })
});
```

---

## Router Integration

Updated `functions/api/course/[[path]].ts`:

```typescript
import { handleAiTutorChat } from './handlers/ai-tutor-chat';

// AI Tutor Chat
if (path === '/ai-tutor-chat' && request.method === 'POST') {
  return handleAiTutorChat(context);
}
```

---

## Requirements Satisfied

### Requirement 7.3: AI Tutor Chat Initiation
- ✅ Builds course context including modules, lessons, and progress
- ✅ Fetches all course structure and student progress
- ✅ Includes lesson content and resources
- ✅ Includes video summaries if available

### Requirement 7.4: AI Tutor Chat Streaming
- ✅ Streams responses in real-time using SSE
- ✅ Sends token-by-token updates to client
- ✅ Sends completion event when done
- ✅ Handles errors gracefully
- ✅ Saves conversation to database
- ✅ Generates title for new conversations

---

## Key Improvements Over Original

### 1. Better Error Handling
- Graceful fallback for title generation
- Proper error events in SSE stream
- Comprehensive try-catch blocks

### 2. Race Condition Prevention
- Re-fetches latest conversation before update
- Prevents message loss in concurrent updates

### 3. Flexible Authentication
- Works with or without authentication
- Uses admin client for database writes
- Proper type casting for env variables

### 4. Modular Design
- Separated conversation phases into utility
- Separated course context building into utility
- Clean, maintainable code structure

---

## TypeScript Verification

```bash
npx tsc --noEmit
```

**Result**: 0 errors ✅

---

## Testing Guide

### Local Testing
```bash
# Start dev server
npm run pages:dev

# Test endpoint with curl
curl -X POST http://localhost:8788/api/course/ai-tutor-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "courseId": "course-123",
    "lessonId": "lesson-456",
    "message": "Can you explain the key concepts in this lesson?"
  }'
```

### Expected Response (SSE Stream)
```
event: token
data: {"content":"Great"}

event: token
data: {"content":" question"}

event: token
data: {"content":"!"}

event: done
data: {"conversationId":"conv-789","messageId":"msg-abc"}
```

### Test Cases

1. **First message (opening phase)**
   - Should return brief, conversational response
   - Should create new conversation
   - Should generate title

2. **Follow-up messages (exploring phase)**
   - Should return moderate depth response
   - Should update existing conversation
   - Should maintain message history

3. **Deep conversation (deep_dive phase)**
   - Should return comprehensive response
   - Should include citations and references
   - Should use structured formatting

4. **Without authentication**
   - Should work but not save to database
   - Should still stream responses

5. **With lesson context**
   - Should include lesson content in prompt
   - Should reference specific materials

6. **With video summary**
   - Should include video summary in context
   - Should reference video content

---

## Database Schema

### tutor_conversations table
```sql
CREATE TABLE tutor_conversations (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(course_id),
  lesson_id UUID REFERENCES lessons(lesson_id),
  title TEXT,
  messages JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Message Format
```typescript
interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

---

## Next Steps

**Task 39**: Implement AI tutor feedback handler
- Create `functions/api/course/handlers/ai-tutor-feedback.ts`
- Use `authenticateUser` from shared/auth
- Verify conversation ownership
- Upsert feedback to database

---

## Verification Checklist

- [x] Extracted logic from original worker
- [x] Created conversation phases utility
- [x] Created course context utility
- [x] Created AI tutor chat handler
- [x] Implemented SSE streaming
- [x] Implemented conversation phases
- [x] Implemented course context building
- [x] Implemented database persistence
- [x] Implemented title generation
- [x] Updated router to wire endpoint
- [x] 0 TypeScript errors
- [x] Requirements 7.3, 7.4 satisfied

---

## Conclusion

Task 38 is **COMPLETE** ✅

AI tutor chat handler successfully implemented with:
- Streaming SSE responses
- 3-phase conversation system
- Comprehensive course context
- Database persistence
- Title generation
- Race condition handling
- 0 TypeScript errors

Ready to proceed to **Task 39** (AI Tutor Feedback Handler).
