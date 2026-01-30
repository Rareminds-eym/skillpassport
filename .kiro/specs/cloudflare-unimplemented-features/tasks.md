# Implementation Plan

## Overview

This implementation plan covers completing 52 unimplemented endpoints across 6 APIs and migrating 1 standalone worker to Pages Functions. The plan follows a 7-week phased approach prioritizing code reuse and minimal rewrites.

## Key Principles

- ❌ NEVER rewrite existing code - migrate it
- ✅ ALWAYS use shared utilities (functions/api/shared/ai-config.ts)
- ✅ ONLY update import paths
- ✅ Test locally with `npm run pages:dev`
- ✅ Follow existing patterns (otp, streak, fetch-certificate)

---

## Phase 1: Preparation and Shared Utilities (Week 1)

- [x] 1. Install dependencies and verify environment
  - Install aws4fetch for R2 operations: `npm install aws4fetch`
  - Verify all environment variables configured in Cloudflare Pages dashboard
  - Test local development with `npm run pages:dev`
  - Verify Supabase connection works
  - Verify R2 connection works (if credentials available)
  - _Requirements: 3.1, 3.3, 4.1_

- [x] 2. Organize shared utilities
  - Move `functions/api/career/utils/auth.ts` to `functions/api/shared/auth.ts`
  - Update all imports in career API to use new path
  - Verify career API still works after move
  - Document shared utility usage patterns in functions/api/shared/README.md
  - _Requirements: 11.1_

- [x] 3. Verify existing shared utilities
  - Review `functions/api/shared/ai-config.ts` - ensure all AI utilities are documented
  - Review `src/functions-lib/supabase.ts` - ensure client creation works
  - Review `src/functions-lib/response.ts` - ensure jsonResponse works
  - Review `src/functions-lib/cors.ts` - ensure CORS headers work
  - Create examples of proper usage for each utility
  - _Requirements: 1.3_

- [x] 4. Phase 1 Checkpoint - Verify all shared utilities work
  - Start local server with `npm run pages:dev`
  - Test career API endpoints still work after auth.ts move
  - Verify all shared utilities are accessible
  - Verify 0 TypeScript errors
  - _Requirements: All Phase 1_

---

## Phase 2: User API Implementation (Week 2)

### 2.1 Utility Handlers (9 endpoints)

- [x] 5. Implement institution list endpoints
  - Copy `cloudflare-workers/user-api/src/handlers/utility.ts` to `functions/api/user/handlers/utility.ts`
  - Update imports to use `createSupabaseClient` from `src/functions-lib/supabase`
  - Update imports to use `jsonResponse` from `src/functions-lib/response`
  - Implement GET /schools endpoint
  - Implement GET /colleges endpoint
  - Implement GET /universities endpoint
  - Implement GET /companies endpoint
  - Test all list endpoints locally
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Implement validation endpoints
  - In same `utility.ts` file, implement validation handlers
  - Implement POST /check-school-code
  - Implement POST /check-college-code
  - Implement POST /check-university-code
  - Implement POST /check-company-code
  - Implement POST /check-email
  - Test all validation endpoints locally
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 7. Update user API router to use utility handlers
  - Update `functions/api/user/[[path]].ts` to import and route to utility handlers
  - Remove 501 responses for utility endpoints
  - Test all utility endpoints work through router
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

### 2.2 Signup Handlers (12 endpoints)

- [x] 8. Implement school signup handlers
  - Copy `cloudflare-workers/user-api/src/handlers/school.ts` to `functions/api/user/handlers/school.ts`
  - Update imports to use shared utilities
  - Implement POST /signup/school-admin
  - Implement POST /signup/educator
  - Implement POST /signup/student
  - Test all school signup endpoints locally
  - _Requirements: 1.1, 1.2, 1.3, 1.7, 1.8_

- [x] 9. Implement college signup handlers
  - Copy `cloudflare-workers/user-api/src/handlers/college.ts` to `functions/api/user/handlers/college.ts`
  - Update imports to use shared utilities
  - Implement POST /signup/college-admin
  - Implement POST /signup/college-educator
  - Implement POST /signup/college-student
  - Test all college signup endpoints locally
  - _Requirements: 1.1, 1.2, 1.4, 1.7, 1.8_

- [x] 10. Implement university signup handlers
  - Copy `cloudflare-workers/user-api/src/handlers/university.ts` to `functions/api/user/handlers/university.ts`
  - Update imports to use shared utilities
  - Implement POST /signup/university-admin
  - Implement POST /signup/university-educator
  - Implement POST /signup/university-student
  - Test all university signup endpoints locally
  - _Requirements: 1.1, 1.2, 1.5, 1.7, 1.8_

- [x] 11. Implement recruiter signup handlers
  - Copy `cloudflare-workers/user-api/src/handlers/recruiter.ts` to `functions/api/user/handlers/recruiter.ts`
  - Update imports to use shared utilities
  - Implement POST /signup/recruiter-admin
  - Implement POST /signup/recruiter
  - Test all recruiter signup endpoints locally
  - _Requirements: 1.1, 1.2, 1.6, 1.7, 1.8_

- [x] 12. Implement unified signup handler
  - Copy `cloudflare-workers/user-api/src/handlers/unified.ts` to `functions/api/user/handlers/unified.ts`
  - Update imports to use shared utilities
  - Implement POST /signup
  - Test unified signup endpoint locally
  - _Requirements: 1.1, 1.2, 1.7, 1.8_

- [x] 13. Update user API router for signup handlers
  - Update `functions/api/user/[[path]].ts` to import and route to all signup handlers
  - Remove 501 responses for signup endpoints
  - Test all signup endpoints work through router
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

### 2.3 Authenticated Handlers (6 endpoints)

- [x] 14. Implement authenticated user creation handlers
  - Copy `cloudflare-workers/user-api/src/handlers/authenticated.ts` to `functions/api/user/handlers/authenticated.ts`
  - Update imports to use `authenticateUser` from `functions/api/shared/auth`
  - Implement POST /create-student
  - Implement POST /create-teacher
  - Implement POST /create-college-staff
  - Implement POST /update-student-documents
  - Test all authenticated endpoints locally with JWT token
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 15. Implement event and password handlers
  - Copy `cloudflare-workers/user-api/src/handlers/events.ts` to `functions/api/user/handlers/events.ts`
  - Copy `cloudflare-workers/user-api/src/handlers/password.ts` to `functions/api/user/handlers/password.ts`
  - Update imports to use shared utilities
  - Implement POST /create-event-user
  - Implement POST /send-interview-reminder
  - Implement POST /reset-password
  - Test all endpoints locally
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4, 13.5, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 16. Update user API router for authenticated handlers
  - Update `functions/api/user/[[path]].ts` to import and route to authenticated handlers
  - Remove 501 responses for authenticated endpoints
  - Test all authenticated endpoints work through router
  - _Requirements: 11.1, 12.1, 13.1, 15.1_

- [x] 17. Phase 2 Checkpoint - Test all User API endpoints locally
  - Start local server with `npm run pages:dev`
  - Test all 9 utility endpoints (GET /schools, /colleges, /universities, /companies, POST /check-*)
  - Test all 12 signup endpoints (school, college, university, recruiter, unified)
  - Test all 6 authenticated endpoints (create-student, create-teacher, etc.)
  - Verify all 27 User API endpoints work correctly
  - Verify proper error handling and validation
  - _Requirements: All Phase 2_

---

## Phase 3: Storage API Implementation (Week 3)

### 3.1 R2 Client and Core Operations

- [ ] 18. Create R2 client wrapper
  - Extract R2 client logic from `cloudflare-workers/storage-api/src/index.ts`
  - Create `functions/api/storage/utils/r2-client.ts`
  - Implement R2Client class with aws4fetch
  - Implement upload() method
  - Implement delete() method
  - Implement list() method
  - Implement generatePresignedUrl() method
  - Implement getObject() method
  - Test R2 client locally
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 19. Implement upload handler
  - Extract upload logic from `cloudflare-workers/storage-api/src/index.ts` (handleUpload function)
  - Create `functions/api/storage/handlers/upload.ts`
  - Use R2Client from utils
  - Implement file validation (size, type)
  - Implement unique key generation
  - Test upload endpoint locally
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 20. Implement delete handler
  - Extract delete logic from `cloudflare-workers/storage-api/src/index.ts` (handleDelete function)
  - Create `functions/api/storage/handlers/delete.ts`
  - Use R2Client from utils
  - Test delete endpoint locally
  - _Requirements: 4.5_

### 3.2 Presigned URLs

- [ ] 21. Implement presigned URL handlers
  - Extract presigned logic from `cloudflare-workers/storage-api/src/index.ts` (handlePresigned function)
  - Create `functions/api/storage/handlers/presigned.ts`
  - Implement POST /presigned - generate presigned URL
  - Implement POST /confirm - confirm upload completion
  - Implement POST /get-url - get public URL from key
  - Implement POST /get-file-url - alias for get-url
  - Test all presigned URL endpoints locally
  - _Requirements: 4.1, 4.2, 4.3_

### 3.3 Document Access and Proxy

- [ ] 22. Implement document access handlers
  - Extract document access logic from `cloudflare-workers/storage-api/src/index.ts` (handleDocumentAccess function)
  - Create `functions/api/storage/handlers/document-access.ts`
  - Implement GET /document-access - proxy document from R2
  - Test document proxy locally
  - _Requirements: 4.4_

- [ ] 23. Implement signed URL handlers
  - Extract signed URL logic from `cloudflare-workers/storage-api/src/index.ts` (handleSignedUrl function)
  - Create `functions/api/storage/handlers/signed-url.ts`
  - Implement POST /signed-url - generate signed URL for single document
  - Implement POST /signed-urls - batch generate signed URLs
  - Test signed URL endpoints locally
  - _Requirements: 4.1, 4.3_

### 3.4 Specialized Handlers

- [ ] 24. Implement payment receipt handlers
  - Extract payment receipt logic from `cloudflare-workers/storage-api/src/index.ts`
  - Create `functions/api/storage/handlers/payment-receipt.ts`
  - Implement POST /upload-payment-receipt - upload base64 PDF
  - Implement GET /payment-receipt - get payment receipt
  - Test payment receipt endpoints locally
  - _Requirements: 3.4_

- [ ] 25. Implement certificate handler
  - Extract certificate logic from `cloudflare-workers/storage-api/src/index.ts` (handleCourseCertificate function)
  - Create `functions/api/storage/handlers/certificate.ts`
  - Implement GET /course-certificate
  - Test certificate endpoint locally
  - _Requirements: 3.4_

- [ ] 26. Implement PDF extraction handler
  - Extract PDF extraction logic from `cloudflare-workers/storage-api/src/index.ts` (handleExtractContent function)
  - Create `functions/api/storage/handlers/extract-content.ts`
  - Implement POST /extract-content
  - Test PDF extraction locally
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 27. Implement file listing handler
  - Extract file listing logic from `cloudflare-workers/storage-api/src/index.ts` (handleListFiles function)
  - Create `functions/api/storage/handlers/list-files.ts`
  - Implement GET /files/:courseId/:lessonId
  - Test file listing locally
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 28. Update storage API router
  - Update `functions/api/storage/[[path]].ts` to import and route to all handlers
  - Remove 501 responses for all storage endpoints
  - Test all 14 storage endpoints work through router
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 29. Phase 3 Checkpoint - Test all Storage API endpoints locally
  - Start local server with `npm run pages:dev`
  - Test file upload and delete operations
  - Test presigned URL generation and confirmation
  - Test document access proxy
  - Test signed URL generation (single and batch)
  - Test payment receipt upload and retrieval
  - Test course certificate generation
  - Test PDF content extraction
  - Test file listing by course/lesson
  - Verify all 14 Storage API endpoints work correctly
  - Verify R2 integration works properly
  - _Requirements: All Phase 3_

---

## Phase 4: AI APIs Implementation (Week 4-5)

### 4.1 Role Overview API (Week 4, Days 1-2)

- [ ] 30. Implement role overview handler
  - Copy `cloudflare-workers/role-overview-api/src/handlers/roleOverviewHandler.ts` to `functions/api/role-overview/handlers/role-overview.ts`
  - Copy `cloudflare-workers/role-overview-api/src/prompts/roleOverviewPrompt.ts` to `functions/api/role-overview/prompts/role-overview.ts`
  - **REPLACE** OpenRouter calls with `callOpenRouterWithRetry` from `functions/api/shared/ai-config`
  - Update imports to use shared utilities
  - Test role overview generation locally
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 31. Implement course matching handler
  - Copy `cloudflare-workers/role-overview-api/src/handlers/courseMatchingHandler.ts` to `functions/api/role-overview/handlers/course-matching.ts`
  - Copy `cloudflare-workers/role-overview-api/src/prompts/courseMatchingPrompt.ts` to `functions/api/role-overview/prompts/course-matching.ts`
  - **REPLACE** OpenRouter calls with `callOpenRouterWithRetry` from shared/ai-config
  - Update imports to use shared utilities
  - Test course matching locally
  - _Requirements: 5.5_

- [ ] 32. Copy role overview utilities
  - Copy `cloudflare-workers/role-overview-api/src/utils/validation.ts` to `functions/api/role-overview/utils/validation.ts`
  - Copy `cloudflare-workers/role-overview-api/src/utils/parser.ts` to `functions/api/role-overview/utils/parser.ts`
  - Copy `cloudflare-workers/role-overview-api/src/utils/fallback.ts` to `functions/api/role-overview/utils/fallback.ts`
  - Update imports to use shared utilities
  - _Requirements: 5.1, 5.3_

- [ ] 33. Update role overview API router
  - Update `functions/api/role-overview/[[path]].ts` to import and route to handlers
  - Remove 501 responses for role overview endpoints
  - Test both endpoints work through router with `npm run pages:dev`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

### 4.2 Question Generation API (Week 4, Days 3-4)

- [x] 34. Implement streaming aptitude handler
  - Create `functions/api/question-generation/handlers/streaming.ts` (NEW IMPLEMENTATION)
  - Implement Server-Sent Events (SSE) for real-time question streaming
  - Use `callOpenRouterWithRetry` from shared/ai-config
  - Send progress updates as questions are generated
  - Send completion event when done
  - Handle client disconnection
  - Test streaming locally with real client
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 35. Implement course assessment handler
  - **NOTE**: Handler already exists at `functions/api/question-generation/handlers/course-assessment.ts` ✅
  - Verify the existing `generateAssessment` function works correctly
  - Copy any missing logic from `cloudflare-workers/question-generation-api/src/handlers/course/` if needed
  - Fetch lesson content from Supabase
  - Build prompt based on lesson topics
  - Use `callOpenRouterWithRetry` from shared/ai-config
  - Cache results in Supabase
  - Test course question generation locally
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 36. Update question generation API router
  - Update `functions/api/question-generation/[[path]].ts` to import and route to new handlers
  - Remove 501 responses for streaming and course assessment endpoints
  - **IMPORTANT**: Add route for POST /generate (course assessment) - handler already exists at `handlers/course-assessment.ts` but is not routed
  - Route the existing `generateAssessment` function to POST /generate endpoint
  - Test all question generation endpoints work with `npm run pages:dev`
  - _Requirements: 6.1, 14.1_

### 4.3 Course API (Week 4, Day 5 - Week 5, Days 1-3)

- [ ] 37. Implement AI tutor suggestions handler
  - Extract logic from `cloudflare-workers/course-api/src/index.ts` (handleAiTutorSuggestions function)
  - Create `functions/api/course/handlers/ai-tutor-suggestions.ts`
  - Fetch lesson and module data from Supabase
  - **REPLACE** AI calls with `callOpenRouterWithRetry` from shared/ai-config
  - Implement graceful degradation with default questions
  - Test AI tutor suggestions locally
  - _Requirements: 7.1, 7.2_

- [ ] 38. Implement AI tutor chat handler
  - Extract logic from `cloudflare-workers/course-api/src/index.ts` (handleAiTutorChat function)
  - Create `functions/api/course/handlers/ai-tutor-chat.ts`
  - Create `functions/api/course/utils/course-context.ts` for buildCourseContext function
  - Create `functions/api/course/utils/conversation-phases.ts` for phase system
  - Implement conversation phases (opening, exploring, deep_dive)
  - **REPLACE** AI calls with `callOpenRouterWithRetry` from shared/ai-config
  - Implement streaming responses
  - Save conversation to database
  - Generate title for new conversations
  - Test AI tutor chat locally
  - _Requirements: 7.3, 7.4_

- [ ] 39. Implement AI tutor feedback handler
  - Extract logic from `cloudflare-workers/course-api/src/index.ts` (handleAiTutorFeedback function)
  - Create `functions/api/course/handlers/ai-tutor-feedback.ts`
  - Use `authenticateUser` from shared/auth
  - Verify conversation ownership
  - Upsert feedback to database
  - Test feedback submission locally
  - _Requirements: 7.5_

- [ ] 40. Implement AI tutor progress handler
  - Extract logic from `cloudflare-workers/course-api/src/index.ts` (handleAiTutorProgress function)
  - Create `functions/api/course/handlers/ai-tutor-progress.ts`
  - Use `authenticateUser` from shared/auth
  - Implement GET: Fetch progress and calculate completion percentage
  - Implement POST: Update lesson progress status
  - Test progress tracking locally
  - _Requirements: 7.6_

- [ ] 41. Implement video summarizer handler
  - Extract logic from `cloudflare-workers/course-api/src/index.ts` (handleAiVideoSummarizer function)
  - Create `functions/api/course/handlers/ai-video-summarizer.ts`
  - Create `functions/api/course/utils/transcription.ts` for Deepgram/Groq integration
  - Create `functions/api/course/utils/video-processing.ts` for summary generation
  - Implement Deepgram transcription (primary)
  - Implement Groq transcription (fallback)
  - **REPLACE** AI calls with `callOpenRouterWithRetry` from shared/ai-config
  - Generate summary, key points, chapters, quotes
  - Generate quiz questions and flashcards
  - Generate SRT/VTT subtitles
  - Implement background processing with waitUntil
  - Implement caching
  - Test video summarization locally
  - _Requirements: 7.7, 7.8_

- [ ] 42. Update course API router
  - Update `functions/api/course/[[path]].ts` to import and route to all AI tutor handlers
  - Remove 501 responses for all AI tutor endpoints
  - Test all 5 course API endpoints work through router with `npm run pages:dev`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

### 4.4 Analyze Assessment API Migration (Week 5, Day 4)

- [x] 43. Create analyze-assessment Pages Function
  - Create `functions/api/analyze-assessment/[[path]].ts` router
  - Copy `cloudflare-workers/analyze-assessment-api/src/index.ts` to `functions/api/analyze-assessment/handlers/analyze.ts`
  - Extract 800+ line prompt builder to `functions/api/analyze-assessment/utils/prompt-builder.ts`
  - Extract scoring logic to `functions/api/analyze-assessment/utils/scoring.ts`
  - **REPLACE** AI calls with `callAIWithFallback` from shared/ai-config (supports Claude → OpenRouter fallback)
  - Use `authenticateUser` from shared/auth
  - Use `checkRateLimit` from career/utils/rate-limit
  - Implement JSON repair for truncated responses (use `repairAndParseJSON` from shared/ai-config)
  - Test assessment analysis locally
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 16.1, 16.2, 16.5_

- [x] 44. Update career API analyze-assessment handler
  - Update `functions/api/career/handlers/analyze-assessment.ts` to call analyze-assessment Pages Function
  - OR remove this handler and update frontend to call analyze-assessment API directly
  - Test both APIs work with `npm run pages:dev`
  - _Requirements: 8.1, 16.3_

- [x] 45. Phase 4 Checkpoint - Test all AI API endpoints locally
  - Start local server with `npm run pages:dev`
  - Test role overview generation (POST /generate-role-overview)
  - Test course matching (POST /match-courses)
  - Test streaming aptitude questions (POST /stream-aptitude)
  - Test course assessment generation (POST /generate)
  - Test AI tutor suggestions (POST /ai-tutor/suggestions)
  - Test AI tutor chat with streaming (POST /ai-tutor/chat)
  - Test AI tutor feedback (POST /ai-tutor/feedback)
  - Test AI tutor progress (GET/POST /ai-tutor/progress)
  - Test video summarization (POST /ai-video-summarizer)
  - Test assessment analysis (POST /analyze)
  - Verify all 11 AI API endpoints work correctly
  - Verify AI fallback chains work (Claude → OpenRouter)
  - Verify streaming responses work properly
  - _Requirements: All Phase 4_

---

## Phase 5: Testing and Verification (Week 6)

### 5.1 Integration Testing

- [ ] 46. Run integration tests for User API
  - Start local server with `npm run pages:dev`
  - Test all 27 endpoints with real data
  - Test signup flows for all user types
  - Test institution code validation
  - Test email uniqueness
  - Test authenticated operations
  - Verify error handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 47. Run integration tests for Storage API
  - Start local server with `npm run pages:dev`
  - Test all 14 endpoints with real R2 operations
  - Test file upload and delete
  - Test presigned URL generation and usage
  - Test document proxy
  - Test PDF extraction
  - Test file listing
  - Verify error handling
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 48. Run integration tests for AI APIs
  - Start local server with `npm run pages:dev`
  - Test role overview generation with OpenRouter
  - Test course matching
  - Test streaming aptitude questions
  - Test course assessment generation
  - Test AI tutor chat with streaming
  - Test video summarization with Deepgram/Groq
  - Test assessment analysis with Claude/OpenRouter fallback
  - Verify all AI fallback chains work
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 7.1, 7.2, 7.3, 7.4, 7.7, 7.8, 8.1, 8.3_

### 5.2 Performance Testing

- [ ] 49. Performance test all endpoints
  - Start local server with `npm run pages:dev`
  - Load test User API endpoints
  - Load test Storage API endpoints
  - Load test AI API endpoints
  - Measure response times (p50, p95, p99)
  - Identify slow endpoints
  - Optimize slow endpoints
  - Verify caching works
  - _Requirements: All_

### 5.3 Security Review

- [ ] 50. Security review
  - Review authentication implementation
  - Review input validation for all endpoints
  - Review SQL injection prevention
  - Review file upload security
  - Review API key handling
  - Review CORS configuration
  - Review rate limiting
  - Fix any security issues found
  - _Requirements: All_

### 5.4 Documentation

- [ ] 51. Update documentation
  - Document all 52 endpoints with request/response examples
  - Update API documentation
  - Create migration guide
  - Update developer guide
  - Document shared utilities usage
  - Document local testing process with `npm run pages:dev`
  - _Requirements: All_

---

## Summary

**Total Tasks:** 51
**Total Endpoints Implemented:** 52
**Total APIs Completed:** 6
**Total Migrations:** 1
**Estimated Duration:** 6 weeks (reduced from 7 - no deployment phase)

**Key Milestones:**
- Week 1: Preparation complete + Phase 1 checkpoint
- Week 2: User API complete (27 endpoints) + Phase 2 checkpoint
- Week 3: Storage API complete (14 endpoints) + Phase 3 checkpoint
- Week 4-5: AI APIs complete (11 endpoints) + Phase 4 checkpoint
- Week 6: Testing and documentation complete

**Testing Approach:**
- All testing done locally using `npm run pages:dev`
- No staging or production deployments
- Phase checkpoints test all endpoints after each phase
- Integration tests run against local server
- Performance tests run against local server

**Phase Checkpoints:**
- Task 4: Phase 1 - Verify shared utilities work
- Task 17: Phase 2 - Test all 27 User API endpoints
- Task 29: Phase 3 - Test all 14 Storage API endpoints
- Task 45: Phase 4 - Test all 11 AI API endpoints
- Tasks 46-51: Phase 5 - Comprehensive testing and documentation

