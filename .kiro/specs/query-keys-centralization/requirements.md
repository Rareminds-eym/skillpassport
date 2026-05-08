# Requirements Document

## Introduction

This feature centralizes React Query keys across the codebase by creating a single source of truth for query key generation. Currently, query keys are hardcoded magic strings scattered across approximately 46 files, making them difficult to maintain, prone to typos, and impossible to refactor safely. The solution introduces a centralized query key factory that generates type-safe, consistent query keys organized by domain, then migrates existing files incrementally through seven phases: Phase 0 creates the factory, then six migration phases cover learner messaging, educator messaging, college/recruiter messaging, admin pages, analytics/courses, and shared hooks.

## Glossary

- **Query_Key_Factory**: A centralized TypeScript module that generates React Query cache keys using factory functions organized by domain
- **Magic_String**: A hardcoded string literal used directly in code without centralized definition or type safety
- **Domain**: A logical grouping of related features (e.g., learner messaging, educator messaging, analytics)
- **Migration_Phase**: A discrete set of files to be migrated together, organized by domain or feature area
- **React_Query**: A data synchronization library for React that uses string-based cache keys to identify queries
- **Type_Safety**: Compile-time verification that prevents invalid query key usage through TypeScript types
- **Cache_Key**: A unique identifier used by React Query to store and retrieve cached data

## Requirements

### Requirement 1: Create Centralized Query Key Factory (Phase 0)

**User Story:** As a developer, I want a centralized query key factory, so that all query keys are defined in one location with consistent structure and type safety.

#### Acceptance Criteria

1. THE Query_Key_Factory SHALL be created in a new file at src/shared/lib/queryKeys/index.ts
2. THE Query_Key_Factory SHALL export factory functions organized by domain (learner, educator, college, recruiter, analytics, courses, subscription)
3. THE Query_Key_Factory SHALL generate query keys as readonly arrays to prevent accidental mutation
4. THE Query_Key_Factory SHALL support parameterized query keys that accept typed arguments (e.g., userId, conversationId)
5. THE Query_Key_Factory SHALL provide base keys for each domain that can be used for cache invalidation
6. WHEN a factory function is called with parameters, THE Query_Key_Factory SHALL return a query key array that includes the domain, resource type, and parameters in a consistent order
7. THE Query_Key_Factory SHALL use TypeScript to enforce type safety for all parameters

### Requirement 2: Migrate learner Messaging Files

**User Story:** As a developer, I want learner messaging files to use centralized query keys, so that learner message queries are consistent and maintainable.

#### Acceptance Criteria

1. WHEN Phase 1 migration is complete, THE System SHALL have replaced all hardcoded query keys in 9 learner messaging files with Query_Key_Factory calls
2. THE System SHALL migrate useStudentMessages.ts in both entities and features directories
3. THE System SHALL migrate useStudentEducatorMessages.ts, useStudentAdminMessages.ts, useStudentCollegeAdminMessages.ts, and useStudentCollegeLecturerMessages.ts
4. THE System SHALL migrate Messages.jsx, EducatorMessages.jsx, and Applications.jsx page components
5. WHEN migration is complete, THE System SHALL maintain identical query key values to preserve existing cache behavior
6. THE System SHALL verify that all migrated files compile without TypeScript errors

### Requirement 3: Migrate Educator Messaging Files

**User Story:** As a developer, I want educator messaging files to use centralized query keys, so that educator communication queries follow the same patterns as learner messaging.

#### Acceptance Criteria

1. WHEN Phase 2 migration is complete, THE System SHALL have replaced all hardcoded query keys in 8 educator messaging files with Query_Key_Factory calls
2. THE System SHALL migrate useEducatorMessages.ts, useEducatorAdminMessages.ts, useCollegeEducatorAdminMessages.ts, and useCollegeEducatorAdminConversations.ts
3. THE System SHALL migrate useConversationStudents.ts hook
4. THE System SHALL migrate Communication.tsx, AdminCommunication.tsx, and Messages.tsx page components
5. WHEN migration is complete, THE System SHALL maintain identical query key values to preserve existing cache behavior
6. THE System SHALL verify that all migrated files compile without TypeScript errors

### Requirement 4: Migrate College and Recruiter Messaging Files

**User Story:** As a developer, I want college and recruiter messaging files to use centralized query keys, so that all messaging domains use consistent query key patterns.

#### Acceptance Criteria

1. WHEN Phase 3 migration is complete, THE System SHALL have replaced all hardcoded query keys in 7 college and recruiter messaging files with Query_Key_Factory calls
2. THE System SHALL migrate useCollegeLecturerConversations.ts, useCollegeLecturerMessages.ts, and useCollegeAdminMessages.ts
3. THE System SHALL migrate useMessages.ts and useUnreadMessagesCount.ts hooks
4. THE System SHALL migrate Messages.tsx and Messages.optimized.tsx page components
5. WHEN migration is complete, THE System SHALL maintain identical query key values to preserve existing cache behavior
6. THE System SHALL verify that all migrated files compile without TypeScript errors

### Requirement 5: Migrate School and College Admin Pages (Phase 4)

**User Story:** As a developer, I want admin page components to use centralized query keys, so that administrative features have consistent query management.

#### Acceptance Criteria

1. WHEN Phase 4 migration is complete, THE System SHALL have replaced all hardcoded query keys in 6 admin page files with Query_Key_Factory calls
2. THE System SHALL migrate EducatorCommunication.tsx, learnerCommunication.tsx, and learnerCollegeAdminCommunication.tsx
3. THE System SHALL migrate CourseManagement.tsx, Departmentmanagement.tsx, and ExaminationManagement.tsx
4. WHEN migration is complete, THE System SHALL maintain identical query key values to preserve existing cache behavior
5. THE System SHALL verify that all migrated files compile without TypeScript errors

### Requirement 6: Migrate Analytics and Course Files (Phase 5)

**User Story:** As a developer, I want analytics and course files to use centralized query keys, so that data queries are organized separately from messaging queries.

#### Acceptance Criteria

1. WHEN Phase 5 migration is complete, THE System SHALL have replaced all hardcoded query keys in 13 analytics and course files with Query_Key_Factory calls
2. THE System SHALL migrate useDiversityData.ts, useGeographicDistribution.ts, useTopHiringColleges.ts, useQualityMetrics.ts, and useRecruitmentFunnel.ts
3. THE System SHALL migrate useCoursePerformance.ts, useAnalyticsKPIs.ts, useRealtimeActivities.ts, and useSpeedAnalytics.ts
4. THE System SHALL migrate useCourseEnrollment.ts, useCoursePerformance.ts, useCourseProgress.ts, and useCourses.ts
5. WHEN migration is complete, THE System SHALL maintain identical query key values to preserve existing cache behavior
6. THE System SHALL verify that all migrated files compile without TypeScript errors

### Requirement 7: Migrate Shared Hooks and Subscription Files (Phase 6)

**User Story:** As a developer, I want shared hooks and subscription files to use centralized query keys, so that all query keys across the entire codebase are centralized.

#### Acceptance Criteria

1. WHEN Phase 6 migration is complete, THE System SHALL have replaced all hardcoded query keys in 4 shared hook files with Query_Key_Factory calls
2. THE System SHALL migrate usePromotionalEvent.ts, useStudentRealtimeActivities.ts, useSubscriptionQuery.js, and useAddOnCatalog.ts
3. WHEN Phase 6 is complete, THE System SHALL have migrated all 46 files identified in the migration plan (1 factory file in Phase 0 + 45 migration files in Phases 1-6)
4. WHEN migration is complete, THE System SHALL maintain identical query key values to preserve existing cache behavior
5. THE System SHALL verify that all migrated files compile without TypeScript errors

### Requirement 8: Maintain Cache Behavior During Migration

**User Story:** As a developer, I want the migration to preserve existing cache behavior, so that users experience no disruption during the rollout.

#### Acceptance Criteria

1. FOR ALL migrated query keys, THE Query_Key_Factory SHALL generate keys that are deeply equal to the original hardcoded keys
2. WHEN a query key includes parameters, THE Query_Key_Factory SHALL maintain the same parameter order and structure as the original implementation
3. THE System SHALL verify cache key equivalence through unit tests comparing factory output to original hardcoded values
4. IF a query key format must change, THEN THE System SHALL document the change and provide a cache invalidation strategy

### Requirement 9: Provide Type Safety for Query Keys

**User Story:** As a developer, I want TypeScript to catch query key errors at compile time, so that I cannot create invalid or mismatched query keys.

#### Acceptance Criteria

1. THE Query_Key_Factory SHALL use TypeScript function signatures to enforce required parameters for each query key type
2. WHEN a developer calls a factory function with incorrect parameter types, THE TypeScript_Compiler SHALL produce a compile-time error
3. THE Query_Key_Factory SHALL export TypeScript types for all query key return values
4. THE System SHALL prevent query key mutation by typing all returned arrays as readonly tuples

### Requirement 10: Support Query Cache Invalidation

**User Story:** As a developer, I want to invalidate related queries efficiently, so that I can clear caches by domain or resource type without knowing every specific query key.

#### Acceptance Criteria

1. THE Query_Key_Factory SHALL export base key constants for each domain (e.g., learnerMessaging, educatorMessaging, analytics)
2. WHEN a developer invalidates a base key, THE React_Query SHALL invalidate all queries that start with that base key prefix
3. THE Query_Key_Factory SHALL organize keys hierarchically so that invalidating a parent key invalidates all child keys
4. THE System SHALL document the key hierarchy and invalidation patterns for each domain
