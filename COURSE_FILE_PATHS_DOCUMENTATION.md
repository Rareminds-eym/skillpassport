# Course-Related File Paths Documentation

This document provides a comprehensive listing of all files related to course functionality across the frontend, backend, and worker components of the application.

## Frontend Files

### Core Course Feature Module (`src/features/courses/`)

#### API Services
- `src/features/courses/api/courseApiService.ts` - Main course API service
- `src/features/courses/api/courseEnrollmentService.js` - Course enrollment API calls
- `src/features/courses/api/courseProgressService.js` - Course progress tracking API
- `src/features/courses/api/courseService.ts` - Core course service functions
- `src/features/courses/api/enrollmentService.ts` - Enrollment management service
- `src/features/courses/api/progressService.ts` - Progress tracking service
- `src/features/courses/api/index.ts` - API exports

#### Business Logic & Utilities
- `src/features/courses/lib/index.ts` - Library exports
- `src/features/courses/lib/recommendations/config.js` - Recommendation system configuration
- `src/features/courses/lib/recommendations/courseRepository.js` - Course data repository
- `src/features/courses/lib/recommendations/embeddingBatch.js` - Batch embedding processing
- `src/features/courses/lib/recommendations/embeddingService.js` - Embedding service for course matching
- `src/features/courses/lib/recommendations/fieldDomainService.js` - Field domain mapping service
- `src/features/courses/lib/recommendations/index.ts` - Recommendations exports
- `src/features/courses/lib/recommendations/profileBuilder.js` - User profile building for recommendations
- `src/features/courses/lib/recommendations/recommendationService.js` - Main recommendation engine
- `src/features/courses/lib/recommendations/skillGapMatcher.js` - Skill gap analysis
- `src/features/courses/lib/recommendations/utils.js` - Recommendation utilities

#### React Hooks & State Management
- `src/features/courses/model/index.ts` - Model exports
- `src/features/courses/model/useCourseEnrollment.ts` - Course enrollment hook
- `src/features/courses/model/useCoursePerformance.ts` - Course performance tracking hook
- `src/features/courses/model/useCourseProgress.ts` - Course progress hook
- `src/features/courses/model/useCourses.ts` - Main courses hook

#### UI Components
- `src/features/courses/ui/AddLessonModal.tsx` - Modal for adding lessons to courses
- `src/features/courses/ui/AssignEducatorModal.tsx` - Modal for assigning educators to courses
- `src/features/courses/ui/CourseCard.tsx` - Course display card component
- `src/features/courses/ui/CourseDetailDrawer.tsx` - Course details drawer component
- `src/features/courses/ui/CourseDetailModal.jsx` - Course details modal
- `src/features/courses/ui/CourseFilters.tsx` - Course filtering component
- `src/features/courses/ui/CoursePlayer.jsx` - Course content player
- `src/features/courses/ui/CreateCourseModal.tsx` - Modal for creating new courses
- `src/features/courses/ui/QuizProgressTracker.jsx` - Quiz progress tracking component
- `src/features/courses/ui/ResourceUploadComponent.tsx` - Course resource upload component
- `src/features/courses/ui/RestoreProgressModal.jsx` - Progress restoration modal
- `src/features/courses/ui/SyncStatusIndicator.jsx` - Synchronization status indicator
- `src/features/courses/ui/index.ts` - UI component exports
- `src/features/courses/index.ts` - Main feature exports

### Page Components

#### Admin Pages
- `src/pages/admin/universityAdmin/BrowseCourses.jsx` - University admin course browsing page
- `src/pages/admin/schoolAdmin/AssessmentResults.tsx` - School admin assessment results (includes course data)
- `src/pages/admin/universityAdmin/AssessmentResults.tsx` - University admin assessment results (includes course data)

#### Demo & Testing Pages
- `src/pages/puter/PuterDemo.tsx` - Demo page with course data display

### Type Definitions
- `src/types/index.ts` - Main course interface definitions
- `src/types/educator/course.ts` - Educator-specific course types
- `src/types/college.ts` - College course mapping types
- `src/types/Attendance.ts` - Course attendance types

### Configuration & Utilities
- `src/shared/config/fileSizeLimits.ts` - File size limits for course videos and resources

## Backend Files

### API Functions (`functions/api/`)

#### User Management
- `functions/api/user/types.ts` - User types including course information
- `functions/api/user/handlers/college.ts` - College user registration with course data

#### Storage API
- `functions/api/storage/[[path]].ts` - Main storage API with course file handling
- `functions/api/storage/handlers/certificate.ts` - Course certificate handling
- `functions/api/storage/handlers/list-files.ts` - Course file listing
- `functions/api/storage/utils/course-authorization.ts` - Course access authorization utilities

#### Streak API
- `functions/api/streak/[[path]].ts` - Student course progress tracking

### Database Schema Files (`supabase/`)

#### Course Tables
- `supabase/public_courses.sql` - Main courses table schema and data
- `supabase/public_course_enrollments.sql` - Course enrollment records
- `supabase/public_course_modules.sql` - Course module structure
- `supabase/public_course_lessons.sql` - Individual course lessons
- `supabase/public_course_resources.sql` - Course learning resources
- `supabase/public_course_progress.sql` - Student progress tracking
- `supabase/public_course_certificates.sql` - Course completion certificates
- `supabase/public_course_reviews.sql` - Course reviews and ratings
- `supabase/public_course_categories.sql` - Course categorization
- `supabase/public_course_prerequisites.sql` - Course prerequisite relationships

#### Related Tables
- `supabase/public_external_courses.sql` - External course integrations
- `supabase/public_student_course_progress.sql` - Detailed student progress
- `supabase/public_exam_timetable.sql` - Course examination scheduling
- `supabase/public_generated_external_assessment.sql` - Course assessments

## Cloudflare Workers

### Embedding API
- `cloudflare-workers/embedding-api/src/index.ts` - Course embedding and search functionality

### Course API Worker
- `cloudflare-workers/course-api/` - Dedicated course API worker (if exists)

## Scripts & Utilities

### Package.json Scripts
- `package.json` - Contains `embed-courses` script for course embedding generation

### Embedding Scripts
- `scripts/embedCourses.js` - Course embedding generation script
- `scripts/generateStudentEmbeddingsViaEdge.js` - Student-course embedding generation

## Test Files

### Property-Based Tests
- `src/__tests__/property/api-endpoint-parity.property.test.ts` - Course API endpoint testing
- `src/__tests__/property/backward-compatibility.property.test.ts` - Course API backward compatibility
- `src/__tests__/property/environment-specific-configuration.property.test.ts` - Course API configuration testing
- `src/__tests__/property/environment-variable-accessibility.property.test.ts` - Course API environment variables

### Integration Tests
- `functions/api/storage/__tests__/integration.test.ts` - Course file storage integration tests

## Configuration Files

### Environment Configuration
- `.env` - Course API URLs and configuration
- `.env.development` - Development course API endpoints
- `.dev.vars` - Course worker environment variables
- `.dev.vars.career-api` - Career-course integration variables

## Implementation Status Summary

### What Has Been Implemented

#### Student Dashboard Course Features
1. **Course Browsing & Discovery**
   - Course catalog with search and filtering (`BrowseCourses.jsx`)
   - Course cards with enrollment status (`CourseCard.tsx`)
   - Course detail modals with comprehensive information (`CourseDetailModal.jsx`)
   - Course filtering by status, category, and level (`CourseFilters.tsx`)

2. **Course Enrollment System**
   - Enrollment API services (`courseEnrollmentService.js`, `enrollmentService.ts`)
   - Enrollment status tracking and management
   - Enrollment hooks for React components (`useCourseEnrollment.ts`)

3. **Course Player & Learning Experience**
   - Interactive course player (`CoursePlayer.jsx`)
   - Progress tracking throughout lessons (`useCourseProgress.ts`)
   - Quiz progress tracking (`QuizProgressTracker.jsx`)
   - Resource access and download capabilities

4. **Progress Tracking & Analytics**
   - Comprehensive progress tracking (`courseProgressService.js`)
   - Performance analytics (`useCoursePerformance.ts`)
   - Progress restoration capabilities (`RestoreProgressModal.jsx`)
   - Sync status indicators (`SyncStatusIndicator.jsx`)

#### Educator Dashboard Course Features
1. **Course Creation & Management**
   - Course creation modal with full form (`CreateCourseModal.tsx`)
   - Lesson addition and management (`AddLessonModal.tsx`)
   - Resource upload functionality (`ResourceUploadComponent.tsx`)
   - Educator assignment system (`AssignEducatorModal.tsx`)

2. **Course Content Management**
   - Course structure definition (modules, lessons, resources)
   - Content upload with file size limits (`fileSizeLimits.ts`)
   - Course status management (Draft, Active, Upcoming)

#### Admin Dashboard Course Features
1. **Course Oversight & Management**
   - University admin course browsing (`BrowseCourses.jsx`)
   - Course approval workflows
   - Assessment result integration with course data
   - Course analytics and reporting

2. **System Administration**
   - Course authorization and access control (`course-authorization.ts`)
   - File storage management for course resources
   - Certificate generation and management

#### Backend Infrastructure
1. **Database Schema**
   - Complete course data model with all related tables
   - Enrollment tracking and progress management
   - Course categorization and prerequisite systems
   - External course integration capabilities

2. **API Services**
   - RESTful course APIs with full CRUD operations
   - File storage APIs for course resources
   - Authentication and authorization for course access
   - Progress tracking and analytics APIs

3. **AI Integration**
   - Course recommendation system using embeddings
   - Skill gap analysis and course matching
   - AI-powered course suggestions based on user profiles

#### Advanced Features
1. **Recommendation Engine**
   - Sophisticated course recommendation system
   - User profile-based suggestions
   - Skill gap analysis and course matching
   - Embedding-based similarity matching

2. **File Management**
   - Secure course resource storage
   - File size limits and validation
   - Course certificate generation
   - Media proxy for secure content delivery

### User Interactivity Implemented

#### Student Interactions
- Browse and search course catalog
- View detailed course information
- Enroll in courses with status tracking
- Access course player with interactive content
- Track learning progress and performance
- Download course resources and certificates
- Restore previous progress sessions

#### Educator Interactions
- Create and manage courses
- Add lessons and learning materials
- Upload course resources and media
- Assign courses to other educators
- Monitor student progress and engagement
- Manage course status and availability

#### Admin Interactions
- Oversee all course activities
- Approve course publications
- Monitor system-wide course analytics
- Manage course policies and access controls
- Generate reports on course effectiveness

This comprehensive file structure demonstrates a fully-featured course management system with robust frontend interfaces, scalable backend infrastructure, and advanced AI-powered recommendation capabilities.