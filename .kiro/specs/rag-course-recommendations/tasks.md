# Implementation Plan

## Phase 1: Database Infrastructure

- [x] 1. Set up database schema for course embeddings
  - [x] 1.1 Create migration to add embedding column to courses table
    - Add `embedding vector(768)` column
    - Create IVFFlat index for cosine similarity search
    - Enable pgvector extension if not already enabled
    - _Requirements: 1.3, 6.5_
  - [x] 1.2 Write property test for embedding storage
    - **Property 2: Embedding Persistence**
    - **Validates: Requirements 1.3**

## Phase 2: Embedding Service

- [x] 2. Implement core embedding service
  - [x] 2.1 Create embedding service with Gemini API integration
    - Create `src/services/embeddingService.js`
    - Implement `generateEmbedding(text)` function using Gemini text-embedding-004
    - Implement `generateBatchEmbeddings(texts)` for multiple texts
    - Implement `cosineSimilarity(embedding1, embedding2)` calculation
    - Add rate limiting with exponential backoff (1s, 2s, 4s, 8s)
    - _Requirements: 1.2, 6.1, 6.2_
  - [x] 2.2 Write property test for embedding consistency
    - **Property 1: Embedding Generation Consistency**
    - **Validates: Requirements 1.1, 1.2**
  - [x] 2.3 Write property test for rate limit retry
    - **Property 10: Rate Limit Retry**
    - **Validates: Requirements 6.1**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Course Embedding Manager

- [x] 4. Implement course embedding manager
  - [x] 4.1 Create course embedding manager service
    - Create `src/services/courseEmbeddingManager.js`
    - Implement `buildCourseText(course)` to create embeddable text from title, description, skills, outcomes
    - Implement `embedCourse(courseId)` to generate and store single course embedding
    - Implement `embedAllCourses()` batch process for courses without embeddings
    - Handle failures gracefully, continue processing other courses
    - _Requirements: 1.1, 1.4, 1.5_
  - [x] 4.2 Write property test for batch processing resilience
    - **Property 9: Batch Processing Resilience**
    - **Validates: Requirements 1.5**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Course Recommendation Service

- [x] 6. Implement course recommendation service
  - [x] 6.1 Create course recommendation service
    - Create `src/services/courseRecommendationService.js`
    - Implement `buildProfileText(assessmentResults)` to create student profile text from skill gaps, career clusters, employability areas
    - Implement `fetchCoursesWithEmbeddings()` to get active courses with embeddings from database
    - Implement `getRecommendedCourses(assessmentResults)` main recommendation function
    - Implement vector similarity search with top 10 limit
    - Calculate relevance scores (0-100) based on cosine similarity
    - Filter to only active courses
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_
  - [x] 6.2 Write property test for profile text completeness
    - **Property 3: Profile Text Completeness**
    - **Validates: Requirements 2.1, 2.2**
  - [x] 6.3 Write property test for similarity search result limit
    - **Property 4: Similarity Search Result Limit**
    - **Validates: Requirements 3.2**
  - [x] 6.4 Write property test for active course filter
    - **Property 5: Active Course Filter**
    - **Validates: Requirements 3.3**
  - [x] 6.5 Write property test for relevance score bounds
    - **Property 6: Relevance Score Bounds**
    - **Validates: Requirements 3.4**

- [x] 7. Implement skill gap to course mapping
  - [x] 7.1 Add skill gap course mapping functionality
    - Implement `getCoursesForSkillGap(skillGap)` in courseRecommendationService
    - Use both course_skills table matching and semantic similarity
    - Limit to 1-3 courses per skill gap
    - Generate "Why this course" explanations based on skill overlap
    - _Requirements: 5.1, 5.2, 5.4_
  - [x] 7.2 Write property test for skill gap course limit
    - **Property 7: Skill Gap Course Limit**
    - **Validates: Requirements 5.1**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Integration with Assessment Service

- [ ] 9. Integrate recommendations into assessment flow
  - [ ] 9.1 Modify geminiAssessmentService to include course recommendations
    - Import courseRecommendationService
    - After Gemini returns results, call `getRecommendedCourses()`
    - Add `platformCourses` field to assessment results
    - Add `skillGapCourses` mapping for each priority skill gap
    - Implement fallback to keyword matching if embedding fails
    - _Requirements: 4.1, 5.2, 6.3_
  - [ ] 9.2 Write unit tests for assessment integration
    - Test that platformCourses is populated
    - Test fallback behavior when embedding fails
    - _Requirements: 4.1, 6.3_

## Phase 6: UI Components

- [ ] 10. Create course recommendation UI components
  - [ ] 10.1 Create CourseRecommendationCard component
    - Create `src/pages/student/assessment-result/components/CourseRecommendationCard.jsx`
    - Display course title, duration, skills, match percentage
    - Add click handler to navigate to course enrollment
    - Style consistent with existing assessment result cards
    - _Requirements: 4.2, 4.3_
  - [ ]* 10.2 Write property test for course card data completeness
    - **Property 8: Course Card Data Completeness**
    - **Validates: Requirements 4.2**

- [ ] 11. Create recommended courses section
  - [ ] 11.1 Create RecommendedCoursesSection component
    - Create `src/pages/student/assessment-result/components/sections/RecommendedCoursesSection.jsx`
    - Display "Recommended Platform Courses" header
    - Show grid of CourseRecommendationCard components
    - Group courses by relevance to skill gaps
    - Handle empty state with appropriate message
    - _Requirements: 4.1, 4.4, 3.5_

- [ ] 12. Update RoadmapSection to include recommendations
  - [ ] 12.1 Integrate RecommendedCoursesSection into RoadmapSection
    - Import RecommendedCoursesSection
    - Add section after existing certifications section
    - Pass platformCourses from assessment results
    - _Requirements: 4.1_

- [ ] 13. Update SkillsSection with course suggestions
  - [ ] 13.1 Add course suggestions to skill gap display
    - Modify SkillsSection.jsx to show courses per skill gap
    - Display 1-3 courses under each priority skill
    - Include "Why this course" explanation
    - Handle case when no courses match a skill gap
    - _Requirements: 5.1, 5.3, 5.4_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Batch Embedding Script

- [ ] 15. Create batch embedding utility
  - [ ] 15.1 Create script to embed all existing courses
    - Create `scripts/embedCourses.js`
    - Fetch all active courses without embeddings
    - Generate embeddings in batches of 10 to avoid rate limits
    - Log progress and errors
    - Provide summary of success/failure counts
    - _Requirements: 1.4, 1.5_

## Phase 8: Final Integration & Testing

- [ ] 16. End-to-end testing and refinement
  - [ ] 16.1 Test complete flow
    - Run batch embedding script on all courses
    - Complete a test assessment
    - Verify course recommendations appear in results
    - Verify skill gap courses are displayed
    - Test navigation to course enrollment
    - _Requirements: 4.1, 4.3, 4.5_
  - [ ]* 16.2 Write integration tests
    - Test assessment completion → recommendations flow
    - Test fallback when no embeddings exist
    - _Requirements: 4.1, 6.3_

- [ ] 17. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
