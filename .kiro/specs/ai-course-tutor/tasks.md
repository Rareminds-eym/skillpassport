# Implementation Plan

## 1. Database Schema and Migrations

- [x] 1.1 Create tutor_conversations table migration
  - Create `supabase/migrations/YYYYMMDD_ai_tutor_schema.sql`
  - Define tutor_conversations table with student_id, course_id, lesson_id, title, messages JSONB
  - Add foreign key constraints to auth.users, courses, lessons
  - Add indexes for student_id and course_id
  - _Requirements: 7.1, 7.2_

- [x] 1.2 Create student_course_progress table
  - Add student_course_progress table with student_id, course_id, lesson_id, status, timestamps
  - Add UNIQUE constraint on (student_id, course_id, lesson_id)
  - Add CHECK constraint for status values
  - _Requirements: 5.1, 7.3_

- [x] 1.3 Create tutor_feedback table
  - Add tutor_feedback table with conversation_id, message_index, rating, feedback_text
  - Add foreign key to tutor_conversations
  - Add CHECK constraint for rating values (-1, 1)
  - _Requirements: 8.2, 8.3_

- [x] 1.4 Create Row Level Security policies
  - Enable RLS on all three tables
  - Create policies for tutor_conversations: students can only access their own conversations
  - Create policies for student_course_progress: students can only access their own progress
  - Create policies for tutor_feedback: students can only create feedback for their conversations
  - _Requirements: 7.4_

- [ ]* 1.5 Write property test for RLS enforcement
  - **Property 9: Row-level security enforcement**
  - **Validates: Requirements 7.4**

- [x] 1.6 Apply migration to database
  - Run migration using Supabase CLI or MCP
  - Verify tables are created correctly
  - _Requirements: 7.1, 7.3_

## 2. Backend - Course Context Builder

- [x] 2.1 Create course context builder utility
  - Create `supabase/functions/_shared/courseContext.ts`
  - Implement `buildCourseContext(courseId, lessonId, studentId)` function
  - Query courses, course_modules, lessons, lesson_resources tables
  - Include student progress data in context
  - _Requirements: 2.1, 2.3, 5.2_

- [ ]* 2.2 Write property test for context builder
  - **Property 1: Context reflects current lesson**
  - **Validates: Requirements 2.1, 2.3**

- [x] 2.3 Create system prompt template
  - Create `supabase/functions/_shared/systemPrompt.ts`
  - Build dynamic system prompt with course context injection
  - Include instructions for course-relevant responses
  - Include handling for out-of-scope questions
  - _Requirements: 1.4, 1.5, 2.2_

## 3. Backend - AI Tutor Edge Function

- [x] 3.1 Create ai-tutor-chat edge function structure
  - Create `supabase/functions/ai-tutor-chat/index.ts`
  - Set up Deno serve with CORS headers
  - Add authentication check using Supabase client
  - Parse request body for conversationId, courseId, lessonId, message
  - _Requirements: 1.2, 1.3_

- [x] 3.2 Implement conversation management
  - Load existing conversation if conversationId provided
  - Create new conversation with generated title if new
  - Append user message to conversation messages array
  - _Requirements: 3.2, 3.3, 3.4, 7.1, 7.2_

- [ ]* 3.3 Write property test for conversation integrity
  - **Property 2: Conversation message integrity**
  - **Validates: Requirements 3.2, 3.3**

- [ ]* 3.4 Write property test for conversation creation
  - **Property 3: Conversation creation completeness**
  - **Validates: Requirements 3.4, 7.1**

- [x] 3.5 Implement OpenRouter AI integration
  - Configure OpenRouter with x-ai/grok-4.1-fast:free model
  - Build chat completion with course context
  - Configure streaming output with reasoning support
  - _Requirements: 1.3, 1.4, 2.2_

- [x] 3.6 Implement streaming response
  - Create ReadableStream for token-by-token delivery
  - Send Server-Sent Events format (event: token, data: content)
  - Send reasoning events for AI thinking process
  - Send completion event with conversationId and messageId
  - Save complete assistant message to conversation on completion
  - _Requirements: 6.1, 6.3_

- [ ]* 3.7 Write property test for streaming lifecycle
  - **Property 7: Streaming response lifecycle**
  - **Validates: Requirements 6.1, 6.3**

- [ ]* 3.8 Write property test for message append
  - **Property 8: Message append preserves history**
  - **Validates: Requirements 7.2**

- [x] 3.9 Implement error handling
  - Handle rate limiting with appropriate error response
  - Handle AI service unavailable errors
  - Handle network/timeout errors
  - Handle invalid course/lesson errors
  - _Requirements: 6.4_

## 4. Backend - Suggested Questions Endpoint

- [x] 4.1 Create suggested questions generator
  - Add endpoint or function for generating suggested questions
  - Query lesson content and generate 3-5 relevant questions
  - Use LLM to generate contextual questions based on lesson
  - _Requirements: 4.1, 4.3_

- [ ]* 4.2 Write property test for suggested questions count
  - **Property 4: Suggested questions count**
  - **Validates: Requirements 4.1**

- [ ]* 4.3 Write property test for questions update on lesson change
  - **Property 5: Suggested questions update on lesson change**
  - **Validates: Requirements 4.3**

## 5. Backend - Progress Tracking

- [x] 5.1 Create progress update endpoint
  - Add endpoint for marking lesson completion
  - Update student_course_progress table with status and timestamp
  - Handle upsert for existing progress records
  - _Requirements: 5.1, 7.3_

- [ ]* 5.2 Write property test for progress recording
  - **Property 6: Progress recording completeness**
  - **Validates: Requirements 5.1, 7.3**

- [x] 5.3 Create progress query function
  - Query student progress for a course
  - Calculate completion percentage
  - Return last accessed lesson information
  - _Requirements: 5.3, 5.4_

## 6. Backend - Feedback Endpoint

- [x] 6.1 Create feedback submission endpoint
  - Add endpoint for submitting feedback on AI responses
  - Store rating and optional feedback text
  - Link to conversation and message index
  - _Requirements: 8.2, 8.3_

- [ ]* 6.2 Write property test for feedback storage
  - **Property 10: Feedback storage completeness**
  - **Validates: Requirements 8.2, 8.3**

## 7. Checkpoint - Backend Tests

- [x] 7. Checkpoint - Backend implementation complete
  - All edge functions created and deployed
  - Database schema in place

## 8. Frontend - Tutor Service

- [x] 8.1 Create tutorService
  - Create `src/services/tutorService.ts`
  - Implement `sendMessage()` with async generator for streaming
  - Implement `getConversations()` to list conversations for a course
  - Implement `getConversation()` to load a specific conversation
  - Implement `submitFeedback()` for rating responses
  - Implement `getSuggestedQuestions()` for lesson-based suggestions
  - Added StreamChunk interface for reasoning support
  - _Requirements: 1.3, 3.1, 3.2, 4.1, 8.2_

## 9. Frontend - useTutorChat Hook

- [x] 9.1 Create useTutorChat hook
  - Create `src/hooks/useTutorChat.ts`
  - Manage messages state array
  - Manage isLoading and isStreaming states
  - Manage isReasoning and currentReasoning states
  - Manage error state
  - Implement sendMessage function with streaming handling
  - Implement loadConversation function
  - Implement startNewConversation function
  - Fetch and manage conversations list
  - _Requirements: 1.3, 3.1, 3.2, 3.3, 6.1, 6.2_

## 10. Frontend - AITutorButton Component

- [x] 10.1 Create AITutorButton component
  - Create `src/components/ai-tutor/AITutorButton.tsx`
  - Implement floating action button with chat icon
  - Accept courseId and optional lessonId props
  - Accept position prop (bottom-right, bottom-left)
  - Toggle chat panel visibility on click
  - _Requirements: 1.1, 1.2_

## 11. Frontend - AITutorChat Component

- [x] 11.1 Create AITutorChat component structure
  - Create `src/components/ai-tutor/AITutorChat.tsx`
  - Implement chat panel with header, messages area, input
  - Accept courseId, lessonId, onClose props
  - Use useTutorChat hook for state management
  - _Requirements: 1.2, 1.3_

- [x] 11.2 Implement message display
  - Render message list with user/assistant styling
  - Show timestamps for messages
  - Auto-scroll to latest message
  - Show typing indicator during streaming
  - Show reasoning indicator with Brain icon
  - _Requirements: 6.2_

- [x] 11.3 Implement message input
  - Create input field with send button
  - Handle Enter key to send
  - Disable input during streaming
  - Clear input after sending
  - _Requirements: 1.3_

- [x] 11.4 Implement suggested questions
  - Display suggested questions when chat opens
  - Update suggestions when lesson changes
  - Send question as message on click
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 11.5 Implement conversation history sidebar
  - Show list of previous conversations
  - Allow selecting a conversation to load
  - Show "New conversation" button
  - _Requirements: 3.1, 3.2_

- [x] 11.6 Implement feedback buttons
  - Add thumbs up/down buttons to assistant messages
  - Call submitFeedback on click
  - Show visual feedback on selection
  - _Requirements: 8.1, 8.2_

- [x] 11.7 Implement error handling UI
  - Show error messages for failed requests
  - Add retry button for stream failures
  - Handle connection lost state
  - _Requirements: 6.4_

## 12. Frontend - Integration

- [x] 12.1 Integrate AITutor into course pages
  - Add AITutorButton to CoursePlayer component
  - Pass courseId from page context
  - Pass lessonId when viewing a specific lesson
  - _Requirements: 1.1, 2.1, 2.3_

- [x] 12.2 Update lesson context on navigation
  - Detect lesson navigation events
  - Update AITutor context with new lessonId
  - Refresh suggested questions
  - _Requirements: 2.3, 4.3_

## 13. Deploy and Test

- [x] 13.1 Deploy edge functions
  - Deploy ai-tutor-chat function to Supabase
  - Deploy ai-tutor-suggestions function
  - Deploy ai-tutor-progress function
  - Deploy ai-tutor-feedback function
  - Set required environment variables (OPENROUTER_API_KEY)
  - Verify functions are accessible
  - _Requirements: 1.3_

- [ ] 13.2 Manual testing
  - Test end-to-end chat flow
  - Test conversation persistence
  - Test progress tracking
  - Test reasoning display
  - _Requirements: All_

## 14. Final Checkpoint

- [ ] 14. Final Checkpoint - Verify implementation
  - Ensure all core functionality works
  - Verify OpenRouter integration with grok model
  - Confirm reasoning tokens display correctly
