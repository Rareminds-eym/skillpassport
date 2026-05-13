# API Integration Tests - Task Sheet

## Project Overview

This document outlines the comprehensive plan for adding integration tests to all API endpoints in the SkillPassport application while maintaining FSD (Feature-Sliced Design) architecture integrity.

## Current State Analysis

### Existing Test Infrastructure
- **Test Framework**: Vitest with @testing-library/react
- **Test Location**: `src/__tests__/integration/`
- **Existing Tests**: 
  - Add-on purchase flow
  - Authentication flows
  - User signup flows
- **Test Utilities**: Mock data and test helpers available in `src/__tests__/integration/utils/`

### API Endpoints Identified

#### 1. Career API (`/api/career`)
**Location**: `functions/api/career/[[path]].ts`

**Endpoints**:
- `POST /chat` - Career AI chat with streaming
- `POST /recommend-opportunities` - Job recommendations
- `POST /analyze-assessment` - Career assessment analysis
- `POST /generate-embedding` - Generate embeddings
- `POST /generate-field-keywords` - Generate domain keywords
- `POST /parse-resume` - Parse resume text
- `GET /get-actions` - Get available actions
- `GET /health` - Health check

**Dependencies**: OpenRouter API, Supabase

#### 2. Course API (`/api/course`)
**Location**: `functions/api/course/[[path]].ts`

**Endpoints**:
- `POST /ai-tutor-suggestions` - Generate suggested questions
- `POST /ai-tutor-chat` - AI tutor chat (streaming)
- `POST /ai-tutor-feedback` - Submit feedback
- `GET /ai-tutor-progress` - Get learner progress
- `POST /ai-tutor-progress` - Update lesson progress
- `POST /ai-video-summarizer` - Video transcription and summary
- `GET /health` - Health check

**Dependencies**: OpenRouter API, Supabase

#### 3. Storage API (`/api/storage`)
**Location**: `functions/api/storage/[[path]].ts`

**Endpoints**:
- `POST /upload` - Upload file to R2
- `POST /delete` - Delete file from R2
- `POST /presigned` - Generate presigned URL
- `POST /confirm` - Confirm upload completion
- `POST /get-url` - Get file URL from key
- `GET /document-access` - Proxy document access (LEGACY)
- `POST /signed-url` - Generate signed URL
- `POST /signed-urls` - Batch generate signed URLs
- `POST /get-authenticated-url` - Generate authenticated URL (SECURE)
- `GET /media-proxy` - Proxy authenticated media (SECURE)
- `POST /upload-payment-receipt` - Upload payment receipt PDF
- `GET /payment-receipt` - Get payment receipt
- `GET /course-certificate` - Get course certificate
- `POST /extract-content` - Extract text from PDF
- `GET /files/:courseId/:lessonId` - List files in lesson

**Dependencies**: Cloudflare R2, Supabase

#### 4. User API (`/api/user`)
**Location**: `functions/api/user/[[path]].ts`

**Endpoints** (20+ endpoints):
- `POST /signup` - Unified signup
- `POST /signup/school-admin` - School admin signup
- `POST /signup/educator` - Educator signup
- `POST /signup/learner` - learner signup
- `POST /signup/college-admin` - College admin signup
- `POST /signup/college-educator` - College educator signup
- `POST /signup/college-learner` - College learner signup
- `POST /signup/university-admin` - University admin signup
- `POST /signup/university-educator` - University educator signup
- `POST /signup/university-learner` - University learner signup
- `POST /signup/recruiter-admin` - Recruiter admin signup
- `POST /signup/recruiter` - Recruiter signup
- `GET /schools` - Get schools list
- `GET /colleges` - Get colleges list
- `GET /universities` - Get universities list
- `GET /companies` - Get companies list
- `POST /check-school-code` - Validate school code
- `POST /check-college-code` - Validate college code
- `POST /check-university-code` - Validate university code
- `POST /check-company-code` - Validate company code
- `POST /check-email` - Check email availability
- `POST /create-learner` - Create learner (authenticated)
- `POST /create-teacher` - Create teacher (authenticated)
- `POST /create-college-staff` - Create college staff (authenticated)
- `POST /update-learner-documents` - Update learner documents
- `POST /create-event-user` - Create event user
- `POST /send-interview-reminder` - Send interview reminder
- `POST /reset-password` - Reset password

**Dependencies**: Supabase

#### 5. Adaptive Session API (`/api/adaptive-session`)
**Location**: `functions/api/adaptive-session/[[path]].ts`

**Endpoints**:
- `POST /initialize` - Initialize adaptive session
- `POST /next-question` - Get next question
- `POST /submit-answer` - Submit answer
- `POST /resume` - Resume session
- `POST /complete` - Complete session
- `POST /abandon` - Abandon session
- `GET /results` - Get session results

**Dependencies**: Supabase, OpenRouter API

#### 6. Analyze Assessment API (`/api/analyze-assessment`)
**Location**: `functions/api/analyze-assessment/[[path]].ts`

**Endpoints**:
- `POST /analyze` - Analyze assessment results
- `POST /program-career-paths` - Generate program career paths

**Dependencies**: OpenRouter API, Supabase

#### 7. Question Generation API (`/api/question-generation`)
**Location**: `functions/api/question-generation/[[path]].ts`

**Endpoints**:
- `POST /adaptive` - Generate adaptive questions
- `POST /adaptive-bank` - Generate from question bank
- `POST /career-aptitude` - Career aptitude questions
- `POST /career-knowledge` - Career knowledge questions
- `POST /course-assessment` - Course assessment questions
- `POST /streaming` - Streaming question generation

**Dependencies**: OpenRouter API, Supabase

#### 8. Email API (`/api/email`)
**Location**: `functions/api/email/[[path]].ts`

**Endpoints**:
- `POST /bulk-countdown` - Send bulk countdown emails
- `POST /countdown` - Send countdown email
- `POST /event-registration` - Event registration email
- `POST /generic` - Generic email
- `POST /invitation` - Invitation email
- `POST /pdf-receipt` - PDF receipt email

**Dependencies**: Email service, Supabase

#### 9. OTP API (`/api/otp`)
**Location**: `functions/api/otp/[[path]].ts`

**Endpoints**:
- `POST /send` - Send OTP
- `POST /verify` - Verify OTP
- `POST /resend` - Resend OTP

**Dependencies**: SMS/Email service, Supabase

#### 10. Role Overview API (`/api/role-overview`)
**Location**: `functions/api/role-overview/[[path]].ts`

**Endpoints**:
- `POST /role-overview` - Get role overview
- `POST /course-matching` - Match courses to role

**Dependencies**: OpenRouter API, Supabase

#### 11. Fetch Certificate API (`/api/fetch-certificate`)
**Location**: `functions/api/fetch-certificate/[[path]].ts`

**Endpoints**:
- `GET /fetch-certificate` - Fetch certificate by ID

**Dependencies**: Supabase, R2 Storage

#### 12. Streak API (`/api/streak`)
**Location**: `functions/api/streak/[[path]].ts`

**Endpoints**:
- `POST /streak` - Update user streak

**Dependencies**: Supabase

#### 13. Cloudflare Workers APIs

##### Email Worker API
**Location**: `cloudflare-workers/email-api/`

**Endpoints**:
- `POST /send` - Send email
- `GET /health` - Health check

**Dependencies**: Email service (Resend/SendGrid)

##### Payments Worker API
**Location**: `cloudflare-workers/payments-api/`

**Endpoints**:
- `POST /create-order` - Create Razorpay order
- `POST /verify-payment` - Verify payment signature
- `POST /webhook` - Handle Razorpay webhooks

**Dependencies**: Razorpay API, Supabase

##### Embedding Worker API
**Location**: `cloudflare-workers/embedding-api/`

**Endpoints**:
- `POST /generate` - Generate embeddings

**Dependencies**: OpenRouter API

## FSD Architecture Compliance

### Current FSD Structure
```
src/
├── entities/          # Business entities (learner, course, etc.)
├── features/          # Feature modules
├── widgets/           # Composite UI components
├── pages/             # Page components
├── shared/            # Shared utilities, UI, API clients
│   ├── api/          # API client configurations
│   ├── lib/          # Utility functions
│   ├── ui/           # Shared UI components
│   └── types/        # Shared TypeScript types
├── app/              # Application initialization
└── __tests__/        # Test files
    ├── integration/  # Integration tests
    ├── property/     # Property-based tests
    └── services/     # Service tests
```

### FSD Principles to Maintain
1. **Layer Isolation**: Tests should not violate layer dependencies
2. **Public API**: Only test through public APIs of features/entities
3. **No Cross-Imports**: Tests should follow same import rules as production code
4. **Shared Utilities**: Use `@/shared` for common test utilities

## Test Organization Strategy

### Directory Structure
```
src/__tests__/integration/
├── api/
│   ├── career/
│   │   ├── chat.test.ts
│   │   ├── recommend.test.ts
│   │   ├── analyze-assessment.test.ts
│   │   ├── generate-embedding.test.ts
│   │   ├── field-keywords.test.ts
│   │   ├── parse-resume.test.ts
│   │   └── README.md
│   ├── course/
│   │   ├── ai-tutor-suggestions.test.ts
│   │   ├── ai-tutor-chat.test.ts
│   │   ├── ai-tutor-feedback.test.ts
│   │   ├── ai-tutor-progress.test.ts
│   │   ├── ai-video-summarizer.test.ts
│   │   └── README.md
│   ├── storage/
│   │   ├── upload.test.ts
│   │   ├── delete.test.ts
│   │   ├── presigned.test.ts
│   │   ├── document-access.test.ts
│   │   ├── signed-url.test.ts
│   │   ├── authenticated-url.test.ts
│   │   ├── payment-receipt.test.ts
│   │   ├── certificate.test.ts
│   │   ├── extract-content.test.ts
│   │   └── README.md
│   ├── user/
│   │   ├── signup/
│   │   │   ├── unified.test.ts
│   │   │   ├── school.test.ts
│   │   │   ├── college.test.ts
│   │   │   ├── university.test.ts
│   │   │   └── recruiter.test.ts
│   │   ├── utility/
│   │   │   ├── institutions.test.ts
│   │   │   ├── code-validation.test.ts
│   │   │   └── email-check.test.ts
│   │   ├── authenticated/
│   │   │   ├── create-users.test.ts
│   │   │   ├── update-documents.test.ts
│   │   │   └── events.test.ts
│   │   └── README.md
│   ├── adaptive-session/
│   │   └── README.md
│   ├── analyze-assessment/
│   │   └── README.md
│   ├── email/
│   │   └── README.md
│   ├── otp/
│   │   └── README.md
│   ├── question-generation/
│   │   ├── adaptive.test.ts
│   │   ├── career-questions.test.ts
│   │   ├── course-assessment.test.ts
│   │   └── README.md
│   ├── email/
│   │   ├── countdown.test.ts
│   │   ├── event-registration.test.ts
│   │   ├── generic.test.ts
│   │   └── README.md
│   ├── otp/
│   │   ├── send-verify.test.ts
│   │   └── README.md
│   ├── role-overview/
│   │   ├── role-overview.test.ts
│   │   └── README.md
│   ├── fetch-certificate/
│   │   └── fetch-certificate.test.ts
│   ├── streak/
│   │   └── streak.test.ts
│   └── README.md
├── workers/
│   ├── email-worker/
│   │   ├── send.test.ts
│   │   └── README.md
│   ├── payments-worker/
│   │   ├── create-order.test.ts
│   │   ├── verify-payment.test.ts
│   │   ├── webhook.test.ts
│   │   └── README.md
│   ├── embedding-worker/
│   │   ├── generate.test.ts
│   │   └── README.md
│   └── README.md
├── frontend-clients/
│   ├── http-client.test.ts
│   ├── api-utils.test.ts
│   ├── storage-client.test.ts
│   ├── auth-client.test.ts
│   └── README.md
├── e2e/
│   ├── user-journey.test.ts
│   ├── career-flow.test.ts
│   ├── course-flow.test.ts
│   ├── payment-flow.test.ts
│   └── README.md
├── auth/              # Existing auth tests
├── file-operations/   # Existing file tests
├── messaging/         # Existing messaging tests
├── utils/             # Test utilities
│   ├── mockData.ts
│   ├── testHelpers.ts
│   ├── apiHelpers.ts      # NEW: API-specific helpers
│   ├── mockResponses.ts   # NEW: Mock API responses
│   └── fixtures.ts        # NEW: Test fixtures
└── README.md
```

## Task Breakdown

### Phase 1: Foundation & Utilities (Priority: HIGH)
**Estimated Time**: 2-3 days

#### Task 1.1: Enhance Test Utilities
- [ ] Create `apiHelpers.ts` with functions for:
  - Making authenticated API requests
  - Mocking Cloudflare Pages Function context
  - Handling streaming responses
  - Error response assertions
- [ ] Create `mockResponses.ts` with:
  - Mock OpenRouter API responses
  - Mock Supabase responses
  - Mock R2 storage responses
- [ ] Create `fixtures.ts` with:
  - Test data for all entity types
  - Request payload templates
  - Response payload templates
- [ ] Update `testHelpers.ts` with:
  - Cloudflare R2 mock client
  - OpenRouter API mock client
  - Enhanced Supabase mock client

**Acceptance Criteria**:
- All utility functions have TypeScript types
- Utilities follow FSD principles (in `@/shared` equivalent for tests)
- Documentation for each utility function
- Example usage in comments

#### Task 1.2: Setup Test Configuration
- [ ] Create dedicated `vitest.config.ts` for integration tests
- [ ] Configure test environment variables
- [ ] Setup test database/mock strategies
- [ ] Configure code coverage thresholds
- [ ] Setup test isolation and cleanup strategies
- [ ] Configure test timeouts for streaming/long-running tests

**Acceptance Criteria**:
- Tests can run with `npm test`
- Dedicated vitest config for better organization
- Environment variables properly mocked
- Coverage reports generated
- CI/CD compatible configuration
- Test isolation working properly

### Phase 2: User API Tests (Priority: HIGH)
**Estimated Time**: 4-5 days

#### Task 2.1: Signup Endpoints
- [ ] Test unified signup endpoint
- [ ] Test school signup endpoints (admin, educator, learner)
- [ ] Test college signup endpoints (admin, educator, learner)
- [ ] Test university signup endpoints (admin, educator, learner)
- [ ] Test recruiter signup endpoints (admin, recruiter)

**Test Cases Per Endpoint**:
- ✅ Successful signup with valid data
- ✅ Validation errors for invalid data
- ✅ Duplicate email handling
- ✅ Invalid institution code handling
- ✅ Database transaction rollback on error
- ✅ Password strength validation
- ✅ Phone number format validation

#### Task 2.2: Utility Endpoints
- [ ] Test institution list endpoints (schools, colleges, universities, companies)
- [ ] Test code validation endpoints
- [ ] Test email availability check

**Test Cases**:
- ✅ Successful data retrieval
- ✅ Empty result handling
- ✅ Invalid code format
- ✅ Non-existent code handling
- ✅ Email format validation

#### Task 2.3: Authenticated Endpoints
- [ ] Test create learner/teacher/staff endpoints
- [ ] Test update learner documents
- [ ] Test event user creation
- [ ] Test interview reminder
- [ ] Test password reset

**Test Cases**:
- ✅ Successful operations with valid auth
- ✅ Unauthorized access (no token)
- ✅ Forbidden access (wrong role)
- ✅ Invalid data handling
- ✅ Database constraint violations

**Acceptance Criteria**:
- All user API endpoints covered
- Authentication/authorization tested
- Error scenarios handled
- Code coverage > 80%

### Phase 3: Storage API Tests (Priority: HIGH)
**Estimated Time**: 5-6 days

#### Task 3.1: File Upload/Delete Operations
- [ ] Test file upload to R2
- [ ] Test file deletion from R2
- [ ] Test presigned URL generation
- [ ] Test upload confirmation

**Test Cases**:
- ✅ Successful file upload
- ✅ File size validation
- ✅ File type validation
- ✅ Duplicate file handling
- ✅ Successful file deletion
- ✅ Delete non-existent file
- ✅ Presigned URL generation
- ✅ Presigned URL expiration

#### Task 3.2: Document Access & Security
- [ ] Test document access (legacy)
- [ ] Test signed URL generation (single & batch)
- [ ] Test authenticated URL generation
- [ ] Test media proxy

**Test Cases**:
- ✅ Authorized document access
- ✅ Unauthorized access blocked
- ✅ Signed URL validation
- ✅ URL expiration handling
- ✅ Batch URL generation
- ✅ Media proxy with valid token
- ✅ Media proxy with invalid token

#### Task 3.3: Specialized Storage Operations
- [ ] Test payment receipt upload/retrieval
- [ ] Test course certificate retrieval
- [ ] Test PDF content extraction
- [ ] Test file listing by course/lesson

**Test Cases**:
- ✅ Receipt upload and retrieval
- ✅ Certificate generation
- ✅ PDF text extraction
- ✅ File listing with filters
- ✅ Empty directory handling

**Acceptance Criteria**:
- All storage endpoints covered
- R2 operations mocked properly
- Security scenarios tested
- File handling edge cases covered
- Code coverage > 80%

### Phase 4: Career API Tests (Priority: MEDIUM)
**Estimated Time**: 4-5 days

#### Task 4.1: AI Chat & Recommendations
- [ ] Test career AI chat (with streaming)
- [ ] Test opportunity recommendations
- [ ] Test career assessment analysis

**Test Cases**:
- ✅ Successful chat response
- ✅ Streaming response handling
- ✅ AI service unavailable
- ✅ Invalid input handling
- ✅ Recommendation generation
- ✅ Empty recommendations
- ✅ Assessment analysis
- ✅ Invalid assessment data

#### Task 4.2: Embeddings & Keywords
- [ ] Test embedding generation
- [ ] Test field keyword generation
- [ ] Test resume parsing

**Test Cases**:
- ✅ Successful embedding generation
- ✅ Batch embedding processing
- ✅ Keyword generation
- ✅ Fallback when AI unavailable
- ✅ Resume text parsing
- ✅ Invalid resume format

**Acceptance Criteria**:
- All career endpoints covered
- OpenRouter API mocked
- Streaming responses tested
- AI fallback scenarios covered
- Code coverage > 75%

### Phase 5: Course API Tests (Priority: MEDIUM)
**Estimated Time**: 3-4 days

#### Task 5.1: AI Tutor Features
- [ ] Test AI tutor suggestions
- [ ] Test AI tutor chat (streaming)
- [ ] Test AI tutor feedback
- [ ] Test AI tutor progress (GET & POST)

**Test Cases**:
- ✅ Suggestion generation
- ✅ Chat with context
- ✅ Streaming responses
- ✅ Feedback submission
- ✅ Progress retrieval
- ✅ Progress update
- ✅ Invalid lesson ID

#### Task 5.2: Video Summarizer
- [ ] Test video transcription and summarization

**Test Cases**:
- ✅ Successful transcription
- ✅ Summary generation
- ✅ Invalid video URL
- ✅ Transcription failure handling

**Acceptance Criteria**:
- All course endpoints covered
- AI interactions mocked
- Progress tracking tested
- Code coverage > 75%

### Phase 6: Additional Pages Function APIs (Priority: MEDIUM)
**Estimated Time**: 6-8 days

#### Task 6.1: Adaptive Session API
- [ ] Test session initialization
- [ ] Test next question retrieval
- [ ] Test answer submission and scoring
- [ ] Test session resume functionality
- [ ] Test session completion
- [ ] Test session abandonment
- [ ] Test results retrieval

**Test Cases**:
- ✅ Successful session flow (init → questions → complete)
- ✅ Resume interrupted session
- ✅ Adaptive difficulty adjustment
- ✅ Invalid session ID handling
- ✅ Concurrent session handling
- ✅ Session timeout scenarios

#### Task 6.2: Assessment Analysis API
- [ ] Test assessment analysis
- [ ] Test program career path generation
- [ ] Test result interpretation

**Test Cases**:
- ✅ Successful analysis with valid data
- ✅ AI service unavailable fallback
- ✅ Invalid assessment data handling
- ✅ Career path recommendations
- ✅ Program matching accuracy

#### Task 6.3: Question Generation API
- [ ] Test adaptive question generation
- [ ] Test question bank generation
- [ ] Test career aptitude questions
- [ ] Test career knowledge questions
- [ ] Test course assessment questions
- [ ] Test streaming generation

**Test Cases**:
- ✅ Question generation for different types
- ✅ Difficulty level adaptation
- ✅ Question uniqueness validation
- ✅ Streaming response handling
- ✅ Question bank integration
- ✅ Invalid parameters handling

#### Task 6.4: Email API
- [ ] Test bulk countdown emails
- [ ] Test single countdown email
- [ ] Test event registration emails
- [ ] Test generic emails
- [ ] Test invitation emails
- [ ] Test PDF receipt emails

**Test Cases**:
- ✅ Successful email sending
- ✅ Template rendering
- ✅ Bulk email processing
- ✅ Email service failure handling
- ✅ Invalid recipient handling
- ✅ Attachment handling (PDF receipts)

#### Task 6.5: OTP API
- [ ] Test OTP generation and sending
- [ ] Test OTP verification
- [ ] Test OTP resend functionality

**Test Cases**:
- ✅ Successful OTP generation
- ✅ OTP verification (valid/invalid)
- ✅ OTP expiration handling
- ✅ Rate limiting on OTP requests
- ✅ Resend cooldown period
- ✅ Invalid phone/email format

#### Task 6.6: Role Overview API
- [ ] Test role overview generation
- [ ] Test course matching to roles

**Test Cases**:
- ✅ Role overview with AI insights
- ✅ Course recommendations for role
- ✅ Invalid role handling
- ✅ AI service unavailable fallback

#### Task 6.7: Miscellaneous APIs
- [ ] Fetch Certificate API tests
- [ ] Streak API tests

**Test Cases**:
- ✅ Certificate retrieval by ID
- ✅ Non-existent certificate handling
- ✅ Streak update and calculation
- ✅ Streak reset scenarios
- ✅ Concurrent streak updates

**Acceptance Criteria**:
- All Pages Function APIs covered
- AI service mocking comprehensive
- Streaming responses tested
- Code coverage > 75%

### Phase 7: Cloudflare Workers APIs (Priority: MEDIUM)
**Estimated Time**: 3-4 days

#### Task 7.1: Email Worker API
- [ ] Test email sending endpoint
- [ ] Test health check
- [ ] Test email service integration

**Test Cases**:
- ✅ Successful email delivery
- ✅ Email service failure handling
- ✅ Rate limiting
- ✅ Invalid email format
- ✅ Template rendering
- ✅ Attachment handling

#### Task 7.2: Payments Worker API
- [ ] Test Razorpay order creation
- [ ] Test payment verification
- [ ] Test webhook handling

**Test Cases**:
- ✅ Successful order creation
- ✅ Payment signature verification
- ✅ Webhook signature validation
- ✅ Payment success webhook
- ✅ Payment failure webhook
- ✅ Invalid webhook handling
- ✅ Duplicate webhook prevention

#### Task 7.3: Embedding Worker API
- [ ] Test embedding generation
- [ ] Test batch embedding processing

**Test Cases**:
- ✅ Single embedding generation
- ✅ Batch embedding processing
- ✅ OpenRouter API failure handling
- ✅ Invalid input text
- ✅ Rate limiting

**Acceptance Criteria**:
- All Cloudflare Workers covered
- Worker-specific patterns tested
- External service mocking
- Code coverage > 75%

### Phase 8: Integration & E2E Scenarios (Priority: HIGH)
**Estimated Time**: 4-5 days

#### Task 8.1: Cross-API Integration Tests
- [ ] Test complete user journey (signup → course enrollment → progress → certificate)
- [ ] Test file upload → storage → retrieval → deletion flow
- [ ] Test career assessment → analysis → recommendations → application flow
- [ ] Test AI tutor → progress tracking → assessment → certificate generation
- [ ] Test adaptive session → question generation → assessment analysis flow
- [ ] Test payment flow (order creation → payment → verification → receipt)
- [ ] Test OTP flow (send → verify → access grant)

#### Task 8.2: Error Handling & Edge Cases
- [ ] Test API rate limiting across all endpoints
- [ ] Test concurrent requests (same user, multiple sessions)
- [ ] Test database connection failures
- [ ] Test external service failures (OpenRouter, R2, Razorpay)
- [ ] Test partial failures and transaction rollbacks
- [ ] Test network timeout scenarios
- [ ] Test malformed request handling

#### Task 8.3: Performance & Load Testing
- [ ] Test response times for all endpoints
- [ ] Test streaming response performance
- [ ] Test large file upload/download
- [ ] Test bulk operations (bulk email, batch embeddings)
- [ ] Test database query performance
- [ ] Establish performance benchmarks

**Acceptance Criteria**:
- End-to-end flows tested
- Error scenarios covered
- Performance benchmarks established
- Resilience tested
- Load testing completed

### Phase 9: Frontend API Client Tests (Priority: MEDIUM)
**Estimated Time**: 3-4 days

#### Task 9.1: Shared API Clients
- [ ] Test httpClient utility
- [ ] Test apiUtils functions
- [ ] Test storageApiService
- [ ] Test authApiService
- [ ] Test careerApiService
- [ ] Test courseApiService

#### Task 9.2: Entity API Clients
- [ ] Test entity-level API operations
- [ ] Test data transformation layers
- [ ] Test error handling in clients

#### Task 9.3: Feature API Clients
- [ ] Test feature-level API integrations
- [ ] Test state management with API calls
- [ ] Test optimistic updates

**Acceptance Criteria**:
- All API clients tested
- Error handling verified
- State management tested
- Code coverage > 75%

### Phase 10: Documentation & CI/CD (Priority: HIGH)
**Estimated Time**: 2-3 days

#### Task 10.1: Documentation
- [ ] Create README for each API test directory
- [ ] Document test patterns and conventions
- [ ] Create troubleshooting guide
- [ ] Document mock strategies

#### Task 10.2: CI/CD Integration
- [ ] Setup GitHub Actions workflow for tests
- [ ] Configure test coverage reporting
- [ ] Setup test result notifications
- [ ] Create pre-commit hooks for tests

#### Task 10.3: Quality Gates
- [ ] Define coverage thresholds per API
- [ ] Setup automated test runs on PR
- [ ] Configure test failure notifications
- [ ] Create test performance benchmarks

**Acceptance Criteria**:
- Comprehensive documentation
- Automated test execution
- Coverage reports in CI/CD
- Quality gates enforced

## Testing Patterns & Best Practices

### 1. Test Structure
```typescript
describe('API Endpoint Name', () => {
  beforeEach(() => {
    // Setup mocks
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Success Cases', () => {
    it('should handle valid request', async () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe('Error Cases', () => {
    it('should handle invalid input', async () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary conditions', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 2. Mock Strategy
- **Supabase**: Mock at client level, not network level
- **OpenRouter API**: Mock fetch calls with appropriate responses
- **R2 Storage**: Mock R2 bucket operations
- **Authentication**: Use test tokens and mock JWT validation

### 3. Assertion Patterns
```typescript
// Response structure
expect(response.status).toBe(200);
expect(response.headers.get('content-type')).toContain('application/json');

// Response body
const data = await response.json();
expect(data).toHaveProperty('success', true);
expect(data).toHaveProperty('data');

// Error responses
expect(response.status).toBe(400);
const error = await response.json();
expect(error).toHaveProperty('error');
expect(error.error).toContain('expected error message');
```

### 4. FSD Compliance Checklist
- [ ] Tests import from `@/shared`, `@/entities`, `@/features` only
- [ ] No direct imports from other features
- [ ] Test utilities in `src/__tests__/integration/utils/`
- [ ] Mock data follows entity structure
- [ ] No business logic in tests (only in tested code)

## Dependencies & Prerequisites

### Required Packages (Already Installed)
- `vitest` - Test runner
- `@testing-library/react` - Testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction simulation

### Environment Setup
- Node.js 18+
- Supabase local instance (optional)
- Environment variables configured
- Test database/mock strategy

## Success Metrics

### Coverage Targets
- **Overall**: > 75%
- **User API**: > 80%
- **Storage API**: > 80%
- **Career API**: > 75%
- **Course API**: > 75%
- **Adaptive Session API**: > 75%
- **Question Generation API**: > 75%
- **Assessment Analysis API**: > 75%
- **Email API**: > 70%
- **OTP API**: > 80%
- **Cloudflare Workers**: > 75%
- **Frontend Clients**: > 75%
- **Other APIs**: > 70%

### Quality Metrics
- All critical paths tested
- All error scenarios covered
- No flaky tests
- Test execution time < 5 minutes
- Zero test failures in CI/CD

## Risk Assessment

### High Risk Areas
1. **Streaming Responses**: Complex to test, may need special handling
2. **External API Dependencies**: OpenRouter, R2 - need robust mocking
3. **Authentication**: JWT validation, role-based access
4. **File Operations**: Large files, concurrent uploads
5. **Database Transactions**: Rollback scenarios, race conditions

### Mitigation Strategies
1. Use specialized libraries for streaming tests
2. Comprehensive mock strategies with fallbacks
3. Test authentication at multiple levels
4. Use small test files, mock large file scenarios
5. Isolate transaction tests, use test database

## Timeline Summary

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| Phase 1: Foundation | 2-3 days | HIGH | None |
| Phase 2: User API | 4-5 days | HIGH | Phase 1 |
| Phase 3: Storage API | 5-6 days | HIGH | Phase 1 |
| Phase 4: Career API | 4-5 days | MEDIUM | Phase 1 |
| Phase 5: Course API | 3-4 days | MEDIUM | Phase 1 |
| Phase 6: Additional Pages APIs | 6-8 days | MEDIUM | Phase 1 |
| Phase 7: Cloudflare Workers | 3-4 days | MEDIUM | Phase 1 |
| Phase 8: Integration & E2E | 4-5 days | HIGH | Phases 2-7 |
| Phase 9: Frontend Clients | 3-4 days | MEDIUM | Phase 1 |
| Phase 10: Documentation | 2-3 days | HIGH | All phases |

**Total Estimated Time**: 36-47 days (7.2-9.4 weeks)

## Next Steps

1. **Review & Approval**: Get stakeholder approval on task sheet
2. **Environment Setup**: Ensure test environment is ready
3. **Start Phase 1**: Begin with foundation and utilities
4. **Iterative Development**: Complete phases in order
5. **Continuous Review**: Review tests as they're written
6. **Documentation**: Document as you go, not at the end

## Alignment with Existing Codebase

### Verified Against
- ✅ All 13 API modules in `functions/api/` directory
- ✅ 3 Cloudflare Workers in `cloudflare-workers/` directory
- ✅ Existing test infrastructure in `src/__tests__/`
- ✅ FSD architecture in `src/entities/`, `src/features/`, `src/widgets/`, `src/shared/`
- ✅ Package.json scripts and dependencies
- ✅ Existing integration tests and patterns

### Key Findings from Codebase Analysis
1. **Total API Endpoints**: 80+ endpoints across 13 modules + 3 workers
2. **Existing Tests**: Storage API integration tests, add-on flow tests, property-based tests
3. **Test Infrastructure**: Vitest, @testing-library/react, comprehensive mock utilities
4. **FSD Compliance**: 12 entities, 27 features, 10 widgets, well-organized shared layer
5. **Missing Coverage**: Cloudflare Workers, frontend API clients, E2E flows

### Updates Made to Task Sheet
- ✅ Added all 13 Pages Function APIs with complete endpoint lists
- ✅ Added Cloudflare Workers APIs (email, payments, embedding)
- ✅ Added frontend API client testing phase
- ✅ Expanded integration/E2E testing phase
- ✅ Added performance and load testing
- ✅ Updated timeline to reflect complete scope (36-47 days)
- ✅ Added dedicated vitest.config.ts setup task
- ✅ Expanded test directory structure to include all modules

## Notes

- This task sheet follows FSD architecture principles
- Tests are organized by API domain, not by feature
- Emphasis on maintainability and clarity
- Comprehensive coverage of success, error, and edge cases
- CI/CD integration is a priority
- Documentation is continuous, not an afterthought
- Aligned with complete codebase structure (13 APIs + 3 Workers)
- Includes frontend API client testing
- Covers E2E user journeys and performance testing

---

**Document Version**: 2.0  
**Created**: 2026-04-23  
**Last Updated**: 2026-04-23  
**Status**: Aligned with Complete Codebase - Ready for Implementation
