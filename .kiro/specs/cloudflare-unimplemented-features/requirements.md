# Requirements Document

## Introduction

This document outlines the requirements for implementing the unimplemented features in Cloudflare Pages Functions. During the consolidation from standalone workers to Pages Functions, many endpoints were migrated as stubs returning 501 "Not Implemented" responses. Additionally, some workers (`analyze-assessment-api`) were not migrated to Pages Functions at all and need to be migrated. This specification addresses completing the implementation of these features to restore full functionality.

## Scope

This specification covers:
1. **Unimplemented endpoints** in migrated Pages Functions (returning 501)
2. **Missing Pages Functions** that should have been migrated but weren't (`analyze-assessment-api`)
3. **Incomplete implementations** where handlers exist but core logic is stubbed

This specification does NOT cover:
- Standalone workers that should remain standalone (`email-api`, `embedding-api`, `payments-api`)
- Already implemented endpoints (career aptitude/knowledge generation, adaptive questions, etc.)

## Glossary

- **Pages Function**: A serverless function deployed as part of Cloudflare Pages
- **Stub Endpoint**: An API endpoint that returns 501 Not Implemented
- **Handler**: A function that processes requests for a specific endpoint
- **User API**: API for user signup, validation, and management
- **Storage API**: API for R2 object storage operations
- **Role Overview API**: API for generating career role overviews
- **Question Generation API**: API for generating assessment questions
- **Course API**: API for course-related operations including AI tutor features
- **Career API**: API for career assessment analysis
- **Analyze Assessment API**: Dedicated API for comprehensive career assessment analysis (NOT YET MIGRATED)
- **R2**: Cloudflare's object storage service
- **OpenRouter**: AI model routing service
- **Supabase**: Backend-as-a-service providing database and authentication
- **Property-Based Testing**: Testing methodology that verifies properties hold across many generated inputs
- **Round Trip Property**: A property where applying an operation and its inverse returns the original value

## Requirements

### Requirement 1

**User Story:** As a user, I want to sign up for the platform with different roles, so that I can access role-specific features.

#### Acceptance Criteria

1. WHEN a user submits signup data THEN the User API SHALL validate the data against required fields
2. WHEN signup data is valid THEN the User API SHALL create a user account in Supabase Auth
3. WHEN a user signs up with a school code THEN the User API SHALL verify the code exists in the database
4. WHEN a user signs up with a college code THEN the User API SHALL verify the code exists in the database
5. WHEN a user signs up with a university code THEN the User API SHALL verify the code exists in the database
6. WHEN a user signs up with a company code THEN the User API SHALL verify the code exists in the database
7. WHEN an email is provided THEN the User API SHALL check if the email is already registered
8. WHEN a user account is created THEN the User API SHALL create the corresponding profile record in the appropriate table

### Requirement 2

**User Story:** As a developer, I want to retrieve lists of schools, colleges, universities, and companies, so that users can select their institution during signup.

#### Acceptance Criteria

1. WHEN a request is made to /api/user/schools THEN the User API SHALL return a list of all active schools
2. WHEN a request is made to /api/user/colleges THEN the User API SHALL return a list of all active colleges
3. WHEN a request is made to /api/user/universities THEN the User API SHALL return a list of all active universities
4. WHEN a request is made to /api/user/companies THEN the User API SHALL return a list of all active companies
5. WHEN institution lists are returned THEN the User API SHALL include institution ID, name, and code

### Requirement 3

**User Story:** As an administrator, I want to upload files to R2 storage, so that I can store user documents, payment receipts, and course materials.

#### Acceptance Criteria

1. WHEN a file upload request is received THEN the Storage API SHALL validate the file size and type
2. WHEN a file is uploaded THEN the Storage API SHALL generate a unique key for the file
3. WHEN a file is uploaded to R2 THEN the Storage API SHALL use AWS Signature Version 4 for authentication
4. WHEN a payment receipt is uploaded THEN the Storage API SHALL store it in the payment-receipts bucket
5. WHEN a file upload completes THEN the Storage API SHALL return the file key and URL

### Requirement 4

**User Story:** As a user, I want to access stored files, so that I can view my documents and course materials.

#### Acceptance Criteria

1. WHEN a file URL is requested THEN the Storage API SHALL generate a presigned URL with expiration
2. WHEN a presigned URL is generated THEN the Storage API SHALL set an appropriate expiration time
3. WHEN multiple file URLs are requested THEN the Storage API SHALL batch generate presigned URLs
4. WHEN a document access request is received THEN the Storage API SHALL proxy the file from R2
5. WHEN a file is deleted THEN the Storage API SHALL remove it from R2 storage

### Requirement 5

**User Story:** As a student, I want to receive AI-generated career role overviews, so that I can understand different career paths.

#### Acceptance Criteria

1. WHEN a role overview is requested THEN the Role Overview API SHALL validate the role title and grade level
2. WHEN generating a role overview THEN the Role Overview API SHALL call OpenRouter with a comprehensive prompt
3. WHEN the AI response is received THEN the Role Overview API SHALL parse and validate the JSON structure
4. WHEN a role overview is generated THEN the Role Overview API SHALL include job responsibilities, industry demand, career progression, and learning roadmap
5. WHEN course matching is requested THEN the Role Overview API SHALL rank courses by relevance to the role

### Requirement 6

**User Story:** As a student, I want to receive AI-generated assessment questions with streaming support, so that I can see questions appear in real-time during assessment generation.

#### Acceptance Criteria

1. WHEN aptitude questions are requested with streaming THEN the Question Generation API SHALL stream questions using Server-Sent Events
2. WHEN streaming aptitude questions THEN the Question Generation API SHALL send progress updates as each question is generated
3. WHEN streaming completes THEN the Question Generation API SHALL send a completion event
4. WHEN streaming fails THEN the Question Generation API SHALL send an error event and close the stream
5. WHEN the client disconnects THEN the Question Generation API SHALL stop generation and clean up resources

### Requirement 7

**User Story:** As a student, I want to interact with an AI tutor for my courses, so that I can get personalized learning assistance.

#### Acceptance Criteria

1. WHEN AI tutor suggestions are requested THEN the Course API SHALL fetch lesson content and module information
2. WHEN AI tutor suggestions are generated THEN the Course API SHALL call OpenRouter to generate relevant questions
3. WHEN AI tutor chat is initiated THEN the Course API SHALL build course context including modules, lessons, and progress
4. WHEN AI tutor chat messages are sent THEN the Course API SHALL stream responses in real-time
5. WHEN AI tutor feedback is submitted THEN the Course API SHALL store the feedback in the database
6. WHEN student progress is updated THEN the Course API SHALL calculate completion percentage
7. WHEN a video is submitted for summarization THEN the Course API SHALL transcribe it using Deepgram or Groq
8. WHEN a video is transcribed THEN the Course API SHALL generate summary, key points, chapters, and quiz questions

### Requirement 8

**User Story:** As a student, I want my career assessment analyzed by AI, so that I can receive personalized career recommendations.

#### Acceptance Criteria

1. WHEN a career assessment is submitted THEN the Career API SHALL validate the assessment data structure
2. WHEN analyzing an assessment THEN the Career API SHALL build a comprehensive analysis prompt
3. WHEN the AI analyzes an assessment THEN the Career API SHALL calculate RIASEC scores, aptitude scores, and personality traits
4. WHEN the AI response is received THEN the Career API SHALL parse and validate the JSON structure
5. WHEN JSON parsing fails THEN the Career API SHALL attempt to repair truncated JSON responses
6. WHEN analysis completes THEN the Career API SHALL return career clusters, skill gaps, and learning tracks

### Requirement 9

**User Story:** As a developer, I want to extract text content from PDF files, so that I can process document content.

#### Acceptance Criteria

1. WHEN a PDF extraction request is received THEN the Storage API SHALL fetch the PDF from R2
2. WHEN a PDF is fetched THEN the Storage API SHALL extract text content from all pages
3. WHEN text extraction completes THEN the Storage API SHALL return the extracted text
4. WHEN text extraction fails THEN the Storage API SHALL return a clear error message
5. WHEN a PDF contains images THEN the Storage API SHALL handle them gracefully

### Requirement 10

**User Story:** As a developer, I want to list files in a course lesson, so that I can display available resources to students.

#### Acceptance Criteria

1. WHEN a file list request is received THEN the Storage API SHALL validate the course ID and lesson ID
2. WHEN listing files THEN the Storage API SHALL query R2 for files matching the path prefix
3. WHEN files are found THEN the Storage API SHALL return file names, sizes, and last modified dates
4. WHEN no files are found THEN the Storage API SHALL return an empty list
5. WHEN listing fails THEN the Storage API SHALL return a clear error message

### Requirement 11

**User Story:** As an administrator, I want to create authenticated user accounts, so that I can manage students, teachers, and staff.

#### Acceptance Criteria

1. WHEN an authenticated create-student request is received THEN the User API SHALL verify the requester has admin permissions
2. WHEN creating a student THEN the User API SHALL create both auth account and profile record
3. WHEN creating a teacher THEN the User API SHALL assign appropriate role permissions
4. WHEN creating college staff THEN the User API SHALL link them to the correct institution
5. WHEN student documents are updated THEN the User API SHALL validate document URLs and update the profile

### Requirement 12

**User Story:** As a system, I want to send interview reminders, so that candidates are notified of upcoming interviews.

#### Acceptance Criteria

1. WHEN an interview reminder request is received THEN the User API SHALL validate the interview ID and candidate ID
2. WHEN sending a reminder THEN the User API SHALL fetch interview details from the database
3. WHEN interview details are fetched THEN the User API SHALL format a reminder message
4. WHEN a reminder is sent THEN the User API SHALL call the email API to deliver the message
5. WHEN reminder sending fails THEN the User API SHALL log the error and return a clear message

### Requirement 13

**User Story:** As a user, I want to reset my password, so that I can regain access to my account if I forget my password.

#### Acceptance Criteria

1. WHEN a password reset request is received THEN the User API SHALL validate the email address
2. WHEN the email is valid THEN the User API SHALL check if the user exists
3. WHEN the user exists THEN the User API SHALL generate a password reset token
4. WHEN a reset token is generated THEN the User API SHALL send a reset email via the email API
5. WHEN the reset link is clicked THEN the User API SHALL validate the token and allow password update

### Requirement 14

**User Story:** As a developer, I want to generate course-specific assessment questions, so that students can be tested on lesson content.

#### Acceptance Criteria

1. WHEN course assessment questions are requested THEN the Question Generation API SHALL validate the course ID and lesson ID
2. WHEN generating course questions THEN the Question Generation API SHALL fetch lesson content from the database
3. WHEN lesson content is fetched THEN the Question Generation API SHALL build a prompt based on the lesson topics
4. WHEN questions are generated THEN the Question Generation API SHALL ensure they are relevant to the lesson content
5. WHEN course questions are cached THEN the Question Generation API SHALL store them for future retrieval

### Requirement 15

**User Story:** As a developer, I want to create event users for competitions and special events, so that participants can register without full account creation.

#### Acceptance Criteria

1. WHEN an event user creation request is received THEN the User API SHALL validate the event ID
2. WHEN creating an event user THEN the User API SHALL generate a temporary user account
3. WHEN an event user is created THEN the User API SHALL link them to the specific event
4. WHEN event user data is provided THEN the User API SHALL store minimal required information
5. WHEN an event ends THEN the User API SHALL mark event users as inactive or convert them to full accounts

### Requirement 16

**User Story:** As a developer, I want to migrate the analyze-assessment-api to Pages Functions, so that all APIs follow the consolidated architecture.

#### Acceptance Criteria

1. WHEN the analyze-assessment-api is migrated THEN the Pages Function SHALL be created at functions/api/analyze-assessment/[[path]].ts
2. WHEN the migration is complete THEN the Pages Function SHALL maintain the same /analyze-assessment endpoint
3. WHEN the Pages Function is deployed THEN the frontend SHALL be updated to use the new endpoint
4. WHEN the migration is verified THEN the standalone analyze-assessment-api worker SHALL be decommissioned
5. WHEN the Pages Function handles requests THEN the Consolidated System SHALL provide the same functionality as the standalone worker

