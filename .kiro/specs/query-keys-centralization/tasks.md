# Implementation Plan: Query Keys Centralization

## Overview

This implementation plan migrates 46 files from hardcoded React Query keys to a centralized, type-safe query key factory. The migration follows a 7-phase approach: Phase 0 creates the factory module, then 6 migration phases cover student messaging, educator messaging, college/recruiter messaging, admin pages, analytics/courses, and shared hooks. Each phase is designed to be independently deployable with validation checkpoints.

## Tasks

- [x] 0. Create centralized query key factory module
  - [x] 0.1 Create factory directory structure and type definitions
    - Create `src/shared/lib/queryKeys/` directory
    - Create `src/shared/lib/queryKeys/types.ts` with QueryKey, UserType, ConversationType, and ArchiveStatus types
    - _Requirements: 1.1, 1.2, 9.1_
  
  - [x] 0.2 Implement student domain query keys
    - Create `src/shared/lib/queryKeys/student.ts` with studentKeys factory
    - Include messages, conversations, unread, and activities key generators
    - Use readonly tuples with `as const` assertions
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 9.4_
  
  - [x] 0.3 Implement educator domain query keys
    - Create `src/shared/lib/queryKeys/educator.ts` with educatorKeys factory
    - Include messages, conversations, and admin key generators
    - Support optional ArchiveStatus parameters
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 9.4_
  
  - [x] 0.4 Implement college domain query keys
    - Create `src/shared/lib/queryKeys/college.ts` with collegeKeys factory
    - Include lecturer, admin, departments, and programs key generators
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 9.4_
  
  - [x] 0.5 Implement recruiter domain query keys
    - Create `src/shared/lib/queryKeys/recruiter.ts` with recruiterKeys factory
    - Include messages and conversations key generators
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 9.4_
  
  - [x] 0.6 Implement analytics domain query keys
    - Create `src/shared/lib/queryKeys/analytics.ts` with analyticsKeys factory
    - Include diversity, geographic, hiring, quality, recruitment, kpis, realtime, and speed key generators
    - Support optional filter and date range parameters
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 9.4_
  
  - [x] 0.7 Implement courses domain query keys
    - Create `src/shared/lib/queryKeys/courses.ts` with coursesKeys factory
    - Include list, enrollment, performance, progress, and curriculum key generators
    - Maintain legacy `curriculum_courses` naming for backward compatibility
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 8.1, 9.4_
  
  - [x] 0.8 Implement subscription domain query keys
    - Create `src/shared/lib/queryKeys/subscription.ts` with subscriptionKeys factory
    - Include data, addons, and promotions key generators
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 9.4_
  
  - [x] 0.9 Create main factory export module
    - Create `src/shared/lib/queryKeys/index.ts` aggregating all domain factories
    - Export unified `queryKeys` object with all domains
    - Export all TypeScript types
    - Add JSDoc documentation with usage examples
    - _Requirements: 1.1, 1.2, 1.7, 9.3_
  
  - [ ]* 0.10 Write unit tests for query key factory
    - Create test files for each domain in `src/shared/lib/queryKeys/__tests__/`
    - Test key structure, parameter handling, and readonly behavior
    - Test backward compatibility for curriculum_courses keys
    - _Requirements: 8.3, 9.1, 9.2, 9.4_

- [ ] 1. Checkpoint - Verify factory module
  - Ensure factory compiles without TypeScript errors
  - Verify all domain keys are exported correctly
  - Run unit tests to confirm key structure
  - Ask the user if questions arise

- [x] 2. Migrate Phase 1: Student messaging files (9 files)
  - [x] 2.1 Migrate src/entities/student/model/useStudentMessages.ts
    - Replace hardcoded query keys with `queryKeys.student.messages.*` calls
    - Add import: `import { queryKeys } from '@/shared/lib/queryKeys'`
    - Update cache invalidation calls to use base keys
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 8.1, 8.2, 9.1_
  
  - [x] 2.2 Migrate src/features/student-profile/model/useStudentMessages.ts
    - Replace hardcoded query keys with factory calls
    - Update realtime subscription invalidations
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 8.1, 8.2_
  
  - [x] 2.3 Migrate src/features/student-profile/model/useStudentEducatorMessages.ts
    - Replace hardcoded query keys with `queryKeys.student.messages.*` calls
    - _Requirements: 2.1, 2.3, 2.5, 2.6, 8.1, 8.2_
  
  - [x] 2.4 Migrate src/features/student-profile/model/useStudentAdminMessages.ts
    - Replace hardcoded query keys with factory calls
    - _Requirements: 2.1, 2.3, 2.5, 2.6, 8.1, 8.2_
  
  - [x] 2.5 Migrate src/features/student-profile/model/useStudentCollegeAdminMessages.ts
    - Replace hardcoded query keys with factory calls
    - _Requirements: 2.1, 2.3, 2.5, 2.6, 8.1, 8.2_
  
  - [x] 2.6 Migrate src/features/student-profile/model/useStudentCollegeLecturerMessages.ts
    - Replace hardcoded query keys with factory calls
    - _Requirements: 2.1, 2.3, 2.5, 2.6, 8.1, 8.2_
  
  - [x] 2.7 Migrate src/pages/student/Messages.jsx
    - Replace hardcoded query keys with factory calls
    - Update imports to include queryKeys
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 8.1, 8.2_
  
  - [x] 2.8 Migrate src/pages/student/EducatorMessages.jsx
    - Replace hardcoded query keys with factory calls
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 8.1, 8.2_
  
  - [x] 2.9 Migrate src/pages/student/Applications.jsx
    - Replace hardcoded query keys with factory calls
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 8.1, 8.2_
  
  - [ ]* 2.10 Write integration tests for Phase 1 migrations
    - Test that migrated hooks work correctly with React Query
    - Verify cache invalidation using base keys
    - Confirm realtime subscriptions still function
    - _Requirements: 2.5, 2.6, 8.1, 10.2_

- [x] 3. Checkpoint - Verify Phase 1 migration
  - Run `npm run build:dev` to check for TypeScript errors
  - Test student messaging features in development
  - Verify query keys in React Query DevTools
  - Ensure all tests pass, ask the user if questions arise

- [x] 4. Migrate Phase 2: Educator messaging files (8 files)
  - [x] 4.1 Migrate src/features/educator/model/useEducatorMessages.ts
    - Replace hardcoded query keys with `queryKeys.educator.messages.*` calls
    - Add import for queryKeys
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 8.1, 8.2_
  
  - [x] 4.2 Migrate src/features/educator/model/useEducatorAdminMessages.ts
    - Replace hardcoded query keys with `queryKeys.educator.admin.*` calls
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 8.1, 8.2_
  
  - [x] 4.3 Migrate src/features/educator/model/useCollegeEducatorAdminMessages.ts
    - Replace hardcoded query keys with factory calls
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 8.1, 8.2_
  
  - [x] 4.4 Migrate src/features/educator/model/useCollegeEducatorAdminConversations.ts
    - Replace hardcoded query keys with `queryKeys.educator.conversations.*` calls
    - Support optional ArchiveStatus parameter
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 8.1, 8.2_
  
  - [x] 4.5 Migrate src/entities/student/model/useConversationStudents.ts
    - Replace hardcoded query keys with `queryKeys.educator.conversations.students()` calls
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 8.1, 8.2_
  
  - [x] 4.6 Migrate src/pages/educator/Communication.tsx
    - Replace hardcoded query keys with factory calls
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 8.1, 8.2_
  
  - [x] 4.7 Migrate src/pages/educator/AdminCommunication.tsx
    - Replace hardcoded query keys with factory calls
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 8.1, 8.2_
  
  - [x] 4.8 Migrate src/pages/educator/Messages.tsx
    - Replace hardcoded query keys with factory calls
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 8.1, 8.2_
  
  - [ ]* 4.9 Write integration tests for Phase 2 migrations
    - Test educator messaging hooks with React Query
    - Verify archive status filtering works correctly
    - _Requirements: 3.5, 3.6, 8.1_

- [-] 5. Checkpoint - Verify Phase 2 migration
  - Run `npm run build:dev` to check for TypeScript errors
  - Test educator messaging features in development
  - Ensure all tests pass, ask the user if questions arise

- [ ] 6. Migrate Phase 3: College and recruiter messaging files (7 files)
  - [ ] 6.1 Migrate src/features/college-profile/model/useCollegeLecturerConversations.ts
    - Replace hardcoded query keys with `queryKeys.college.lecturer.conversations()` calls
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 8.1, 8.2_
  
  - [ ] 6.2 Migrate src/features/college-profile/model/useCollegeLecturerMessages.ts
    - Replace hardcoded query keys with `queryKeys.college.lecturer.messages()` calls
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 8.1, 8.2_
  
  - [ ] 6.3 Migrate src/features/college-profile/model/useCollegeAdminMessages.ts
    - Replace hardcoded query keys with `queryKeys.college.admin.messages()` calls
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 8.1, 8.2_
  
  - [ ] 6.4 Migrate src/features/messaging/model/useMessages.ts
    - Replace hardcoded query keys with appropriate domain factory calls
    - Handle multiple user types (student, educator, recruiter, college)
    - _Requirements: 4.1, 4.3, 4.5, 4.6, 8.1, 8.2_
  
  - [ ] 6.5 Migrate src/features/messaging/model/useUnreadMessagesCount.ts
    - Replace hardcoded query keys with unread count factory calls
    - Support all user types
    - _Requirements: 4.1, 4.3, 4.5, 4.6, 8.1, 8.2_
  
  - [ ] 6.6 Migrate src/pages/recruiter/Messages.tsx
    - Replace hardcoded query keys with `queryKeys.recruiter.messages.*` calls
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 8.1, 8.2_
  
  - [ ] 6.7 Migrate src/pages/recruiter/Messages.optimized.tsx
    - Replace hardcoded query keys with factory calls
    - _Requirements: 4.1, 4.4, 4.5, 4.6, 8.1, 8.2_
  
  - [ ]* 6.8 Write integration tests for Phase 3 migrations
    - Test college lecturer and recruiter messaging
    - Verify multi-user-type hooks work correctly
    - _Requirements: 4.5, 4.6, 8.1_

- [ ] 7. Checkpoint - Verify Phase 3 migration
  - Run `npm run build:dev` to check for TypeScript errors
  - Test college and recruiter messaging features
  - Ensure all tests pass, ask the user if questions arise

- [ ] 8. Migrate Phase 4: School and college admin pages (6 files)
  - [ ] 8.1 Migrate src/pages/admin/schoolAdmin/EducatorCommunication.tsx
    - Replace hardcoded query keys with `queryKeys.educator.*` calls
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 8.1, 8.2_
  
  - [ ] 8.2 Migrate src/pages/admin/schoolAdmin/StudentCommunication.tsx
    - Replace hardcoded query keys with `queryKeys.student.*` calls
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 8.1, 8.2_
  
  - [ ] 8.3 Migrate src/pages/admin/collegeAdmin/StudentCollegeAdminCommunication.tsx
    - Replace hardcoded query keys with factory calls
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 8.1, 8.2_
  
  - [ ] 8.4 Migrate src/pages/admin/collegeAdmin/CourseManagement.tsx
    - Replace hardcoded query keys with `queryKeys.courses.*` calls
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 8.1, 8.2_
  
  - [ ] 8.5 Migrate src/pages/admin/collegeAdmin/Departmentmanagement.tsx
    - Replace hardcoded query keys with `queryKeys.college.departments.*` calls
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 8.1, 8.2_
  
  - [ ] 8.6 Migrate src/pages/admin/collegeAdmin/ExaminationManagement.tsx
    - Replace hardcoded query keys with factory calls
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 8.1, 8.2_
  
  - [ ]* 8.7 Write integration tests for Phase 4 migrations
    - Test admin page components with React Query
    - Verify course and department queries work correctly
    - _Requirements: 5.4, 5.5, 8.1_

- [ ] 9. Checkpoint - Verify Phase 4 migration
  - Run `npm run build:dev` to check for TypeScript errors
  - Test admin pages in development
  - Ensure all tests pass, ask the user if questions arise

- [ ] 10. Migrate Phase 5: Analytics and course files (13 files)
  - [ ] 10.1 Migrate src/features/analytics/model/useDiversityData.ts
    - Replace hardcoded query keys with `queryKeys.analytics.diversity.data()` calls
    - Support optional filters parameter
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.2 Migrate src/features/analytics/model/useGeographicDistribution.ts
    - Replace hardcoded query keys with `queryKeys.analytics.geographic.distribution()` calls
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.3 Migrate src/features/analytics/model/useTopHiringColleges.ts
    - Replace hardcoded query keys with `queryKeys.analytics.hiring.topColleges()` calls
    - Support optional limit parameter
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.4 Migrate src/features/analytics/model/useQualityMetrics.ts
    - Replace hardcoded query keys with `queryKeys.analytics.quality.metrics()` calls
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.5 Migrate src/features/analytics/model/useRecruitmentFunnel.ts
    - Replace hardcoded query keys with `queryKeys.analytics.recruitment.funnel()` calls
    - Support optional dateRange parameter
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.6 Migrate src/features/analytics/model/useCoursePerformance.ts
    - Replace hardcoded query keys with `queryKeys.courses.performance.*` calls
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.7 Migrate src/features/analytics/model/useAnalyticsKPIs.ts
    - Replace hardcoded query keys with `queryKeys.analytics.kpis.data()` calls
    - _Requirements: 6.1, 6.3, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.8 Migrate src/features/analytics/model/useRealtimeActivities.ts
    - Replace hardcoded query keys with `queryKeys.analytics.realtime.activities()` calls
    - _Requirements: 6.1, 6.3, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.9 Migrate src/features/analytics/model/useSpeedAnalytics.ts
    - Replace hardcoded query keys with `queryKeys.analytics.speed.metrics()` calls
    - _Requirements: 6.1, 6.3, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.10 Migrate src/features/courses/model/useCourseEnrollment.ts
    - Replace hardcoded query keys with `queryKeys.courses.enrollment.*` calls
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.11 Migrate src/features/courses/model/useCourseProgress.ts
    - Replace hardcoded query keys with `queryKeys.courses.progress.byStudent()` calls
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.12 Migrate src/features/courses/model/useCourses.ts
    - Replace hardcoded query keys with `queryKeys.courses.list.*` or `queryKeys.courses.curriculum.*` calls
    - Maintain backward compatibility for curriculum_courses keys
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 8.1, 8.2_
  
  - [ ] 10.13 Verify curriculum_courses backward compatibility
    - Ensure `queryKeys.courses.curriculum.byCollege()` generates `['curriculum_courses', collegeId]`
    - Test that existing cached data is preserved
    - _Requirements: 6.5, 6.6, 8.1, 8.3_
  
  - [ ]* 10.14 Write integration tests for Phase 5 migrations
    - Test analytics hooks with various filter parameters
    - Test course hooks with enrollment and progress queries
    - Verify curriculum_courses backward compatibility
    - _Requirements: 6.5, 6.6, 8.1, 8.3_

- [ ] 11. Checkpoint - Verify Phase 5 migration
  - Run `npm run build:dev` to check for TypeScript errors
  - Test analytics dashboards and course features
  - Verify curriculum_courses keys maintain cache
  - Ensure all tests pass, ask the user if questions arise

- [ ] 12. Migrate Phase 6: Shared hooks and subscription files (4 files)
  - [ ] 12.1 Migrate src/shared/hooks/usePromotionalEvent.ts
    - Replace hardcoded query keys with `queryKeys.subscription.promotions.active()` calls
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 8.1, 8.2_
  
  - [ ] 12.2 Migrate src/shared/hooks/useStudentRealtimeActivities.ts
    - Replace hardcoded query keys with `queryKeys.student.activities.realtime()` calls
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 8.1, 8.2_
  
  - [ ] 12.3 Migrate src/shared/hooks/useSubscriptionQuery.js
    - Replace hardcoded query keys with `queryKeys.subscription.data.byOrganization()` calls
    - Convert from .js to .ts if needed for type safety
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 8.1, 8.2, 9.1_
  
  - [ ] 12.4 Migrate src/shared/hooks/useAddOnCatalog.ts
    - Replace hardcoded query keys with `queryKeys.subscription.addons.catalog()` calls
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 8.1, 8.2_
  
  - [ ]* 12.5 Write integration tests for Phase 6 migrations
    - Test subscription and promotional event queries
    - Test student realtime activities
    - _Requirements: 7.4, 7.5, 8.1_

- [ ] 13. Checkpoint - Verify Phase 6 migration
  - Run `npm run build:dev` to check for TypeScript errors
  - Test subscription features and realtime activities
  - Verify all 46 files have been migrated (1 factory + 45 migration files)
  - Ensure all tests pass, ask the user if questions arise

- [ ] 14. Final validation and documentation
  - [ ] 14.1 Run full test suite
    - Execute all unit tests for query key factory
    - Execute all integration tests for migrated files
    - Verify 100% test coverage for factory module
    - _Requirements: 8.3, 9.1, 9.2_
  
  - [ ]* 14.2 Write property-based tests for correctness properties
    - **Property 1: Query key immutability** - Validates: Requirements 1.2, 9.4
    - **Property 2: Parameterized key inclusion** - Validates: Requirements 1.3
    - **Property 3: Query key structure consistency** - Validates: Requirements 1.5
    - **Property 4: Cache key equivalence** - Validates: Requirements 2.5, 3.5, 4.5, 5.4, 6.5, 7.4, 8.1
    - **Property 5: Parameter order preservation** - Validates: Requirements 8.2
    - **Property 6: Hierarchical prefix invalidation** - Validates: Requirements 10.2
    - **Property 7: Parent-child key hierarchy** - Validates: Requirements 10.3
    - Run each property test with minimum 100 iterations
    - _Requirements: 8.1, 8.2, 8.3, 10.2, 10.3_
  
  - [ ] 14.3 Verify TypeScript compilation across entire codebase
    - Run `npm run build:dev` for full build
    - Ensure zero TypeScript errors
    - Verify all imports resolve correctly
    - _Requirements: 2.6, 3.6, 4.6, 5.5, 6.6, 7.5, 9.1, 9.2_
  
  - [ ] 14.4 Test cache invalidation patterns
    - Test domain-level invalidation (e.g., `queryKeys.student.all`)
    - Test resource-level invalidation (e.g., `queryKeys.student.messages.all`)
    - Test specific query invalidation
    - Verify hierarchical invalidation works correctly
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 14.5 Performance validation
    - Measure factory function execution time (should be < 1 microsecond)
    - Verify bundle size impact (should be ~5-8 KB)
    - Confirm no performance regression in query operations
    - _Requirements: 1.6, 8.1_

- [ ] 15. Final checkpoint - Complete migration
  - All 46 files successfully migrated
  - All tests passing (unit, integration, property-based)
  - Zero TypeScript errors
  - Performance metrics within acceptable range
  - Ready for deployment

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation between phases
- Property-based tests validate universal correctness properties
- The migration preserves existing cache behavior to prevent user disruption
- Each phase can be deployed independently with rollback capability
- Use `npm run build:dev` to verify TypeScript compilation after each phase
- React Query DevTools can be used to inspect query keys during development
