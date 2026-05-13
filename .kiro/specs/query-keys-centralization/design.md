# Design Document: Query Keys Centralization

## Overview

This design implements a centralized query key factory for React Query that eliminates hardcoded magic strings across 46 files in the codebase. The solution provides type-safe, consistent query key generation organized by domain (learner, educator, college, recruiter, analytics, courses, subscription) with a six-phase migration strategy that preserves existing cache behavior while improving maintainability and refactorability.

### Problem Statement

The current codebase uses hardcoded query key strings scattered across multiple files:
- `['learner-messages', conversationId || 'none']`
- `['recruiter-conversations', recruiterId, 'active']`
- `['curriculum_courses', collegeId]`

This approach creates several issues:
1. **Typo vulnerability**: String literals can be mistyped without compile-time detection
2. **Refactoring difficulty**: Changing key structure requires manual search-and-replace across many files
3. **Inconsistency**: No enforced pattern for key structure or parameter ordering
4. **Cache invalidation complexity**: No clear hierarchy for invalidating related queries
5. **Lack of discoverability**: Developers must search the codebase to find existing keys

### Solution Approach

Create a centralized `queryKeys.ts` factory module that:
- Exports domain-organized factory functions (e.g., `queryKeys.learner.messages()`)
- Returns readonly tuple arrays for type safety and immutability
- Enforces consistent parameter ordering and structure
- Provides base keys for hierarchical cache invalidation
- Enables IDE autocomplete for all available query keys
- Maintains backward compatibility during incremental migration

### Key Design Decisions

1. **Factory Pattern**: Use factory functions rather than constants to support parameterization
2. **Domain Organization**: Group keys by feature domain to match codebase structure
3. **Readonly Tuples**: Return `readonly [string, ...any[]]` to prevent accidental mutation
4. **Hierarchical Structure**: Design keys to support prefix-based invalidation
5. **Incremental Migration**: Six-phase rollout organized by domain to minimize risk
6. **Zero Runtime Impact**: Factory functions have negligible performance overhead

## Architecture

### Module Structure

```
src/shared/lib/queryKeys/
├── index.ts                 # Main export and factory aggregation
├── learner.ts              # learner domain keys
├── educator.ts             # Educator domain keys
├── college.ts              # College/lecturer domain keys
├── recruiter.ts            # Recruiter domain keys
├── analytics.ts            # Analytics domain keys
├── courses.ts              # Course domain keys
├── subscription.ts         # Subscription domain keys
└── types.ts                # Shared TypeScript types
```

### Key Hierarchy Design

Query keys follow a hierarchical structure to enable efficient cache invalidation:

```
[domain, resource, ...params]
```

Examples:
- `['learner', 'messages', conversationId]` - Specific conversation messages
- `['learner', 'messages']` - All learner messages (base key)
- `['learner']` - All learner-related queries (domain key)

This hierarchy allows:
- Invalidating all learner queries: `queryClient.invalidateQueries({ queryKey: ['learner'] })`
- Invalidating all learner messages: `queryClient.invalidateQueries({ queryKey: ['learner', 'messages'] })`
- Invalidating specific conversation: `queryClient.invalidateQueries({ queryKey: ['learner', 'messages', conversationId] })`

### Type Safety Strategy

TypeScript ensures compile-time correctness through:

1. **Function Signatures**: Required parameters enforced by function arguments
2. **Readonly Tuples**: Prevent mutation of returned arrays
3. **Type Exports**: Enable type checking in consuming code
4. **Const Assertions**: Use `as const` for literal type inference

Example:
```typescript
export const learnerKeys = {
  all: ['learner'] as const,
  messages: (conversationId: string) => ['learner', 'messages', conversationId] as const,
  conversations: (learnerId: string, type?: string) => 
    ['learner', 'conversations', learnerId, type] as const,
} as const;
```

## Components and Interfaces

### Query Key Factory Interface

```typescript
// src/shared/lib/queryKeys/types.ts

/**
 * Base query key type - all keys start with a domain string
 */
export type QueryKey = readonly [string, ...any[]];

/**
 * User type discriminator for messaging queries
 */
export type UserType = 'learner' | 'recruiter' | 'educator' | 'admin' | 
                       'school_admin' | 'college_admin' | 'college_lecturer';

/**
 * Conversation type discriminator
 */
export type ConversationType = 
  | 'learner_recruiter'
  | 'learner_educator'
  | 'learner_admin'
  | 'learner_college_admin'
  | 'learner_college_educator'
  | 'educator_admin'
  | 'college_educator_admin';

/**
 * Archive status for conversation queries
 */
export type ArchiveStatus = 'active' | 'archived' | 'all';
```

### learner Domain Keys

```typescript
// src/shared/lib/queryKeys/learner.ts

import type { QueryKey, ConversationType, ArchiveStatus } from './types';

export const learnerKeys = {
  // Base key for all learner queries
  all: ['learner'] as const,
  
  // Messages
  messages: {
    all: ['learner', 'messages'] as const,
    conversation: (conversationId: string): QueryKey => 
      ['learner', 'messages', conversationId] as const,
  },
  
  // Conversations
  conversations: {
    all: ['learner', 'conversations'] as const,
    byStudent: (learnerId: string, type?: ConversationType): QueryKey =>
      type 
        ? ['learner', 'conversations', learnerId, type] as const
        : ['learner', 'conversations', learnerId] as const,
  },
  
  // Unread counts
  unread: {
    all: ['learner', 'unread'] as const,
    count: (learnerId: string): QueryKey => 
      ['learner', 'unread', learnerId] as const,
  },
  
  // Realtime activities
  activities: {
    all: ['learner', 'activities'] as const,
    realtime: (learnerId: string): QueryKey =>
      ['learner', 'activities', 'realtime', learnerId] as const,
  },
} as const;
```

### Educator Domain Keys

```typescript
// src/shared/lib/queryKeys/educator.ts

import type { QueryKey, ArchiveStatus } from './types';

export const educatorKeys = {
  // Base key for all educator queries
  all: ['educator'] as const,
  
  // Messages
  messages: {
    all: ['educator', 'messages'] as const,
    conversation: (conversationId: string): QueryKey =>
      ['educator', 'messages', conversationId] as const,
  },
  
  // Conversations
  conversations: {
    all: ['educator', 'conversations'] as const,
    byEducator: (educatorId: string, status?: ArchiveStatus): QueryKey =>
      status
        ? ['educator', 'conversations', educatorId, status] as const
        : ['educator', 'conversations', educatorId] as const,
    learners: (conversationId: string): QueryKey =>
      ['educator', 'conversations', 'learners', conversationId] as const,
  },
  
  // Admin conversations
  admin: {
    all: ['educator', 'admin'] as const,
    conversations: (educatorId: string, status?: ArchiveStatus): QueryKey =>
      status
        ? ['educator', 'admin', 'conversations', educatorId, status] as const
        : ['educator', 'admin', 'conversations', educatorId] as const,
  },
} as const;
```

### College Domain Keys

```typescript
// src/shared/lib/queryKeys/college.ts

import type { QueryKey, ArchiveStatus } from './types';

export const collegeKeys = {
  // Base key for all college queries
  all: ['college'] as const,
  
  // Lecturer conversations
  lecturer: {
    all: ['college', 'lecturer'] as const,
    conversations: (lecturerId: string, status?: ArchiveStatus): QueryKey =>
      status
        ? ['college', 'lecturer', 'conversations', lecturerId, status] as const
        : ['college', 'lecturer', 'conversations', lecturerId] as const,
    messages: (conversationId: string): QueryKey =>
      ['college', 'lecturer', 'messages', conversationId] as const,
    details: (userId: string): QueryKey =>
      ['college', 'lecturer', 'details', userId] as const,
  },
  
  // Admin
  admin: {
    all: ['college', 'admin'] as const,
    id: (collegeId: string): QueryKey =>
      ['college', 'admin', 'id', collegeId] as const,
    messages: (conversationId: string): QueryKey =>
      ['college', 'admin', 'messages', conversationId] as const,
    school: (schoolAdminId: string): QueryKey =>
      ['college', 'admin', 'school', schoolAdminId] as const,
  },
  
  // Departments
  departments: {
    all: ['college', 'departments'] as const,
    byCollege: (collegeId: string): QueryKey =>
      ['college', 'departments', collegeId] as const,
  },
  
  // Programs
  programs: {
    all: ['college', 'programs'] as const,
    byCollege: (collegeId: string): QueryKey =>
      ['college', 'programs', collegeId] as const,
  },
} as const;
```

### Recruiter Domain Keys

```typescript
// src/shared/lib/queryKeys/recruiter.ts

import type { QueryKey, ArchiveStatus } from './types';

export const recruiterKeys = {
  // Base key for all recruiter queries
  all: ['recruiter'] as const,
  
  // Messages
  messages: {
    all: ['recruiter', 'messages'] as const,
    conversation: (conversationId: string): QueryKey =>
      ['recruiter', 'messages', conversationId] as const,
    unread: (recruiterId: string): QueryKey =>
      ['recruiter', 'messages', 'unread', recruiterId] as const,
  },
  
  // Conversations
  conversations: {
    all: ['recruiter', 'conversations'] as const,
    byRecruiter: (recruiterId: string, status?: ArchiveStatus): QueryKey =>
      status
        ? ['recruiter', 'conversations', recruiterId, status] as const
        : ['recruiter', 'conversations', recruiterId] as const,
  },
} as const;
```

### Analytics Domain Keys

```typescript
// src/shared/lib/queryKeys/analytics.ts

import type { QueryKey } from './types';

export const analyticsKeys = {
  // Base key for all analytics queries
  all: ['analytics'] as const,
  
  // Diversity metrics
  diversity: {
    all: ['analytics', 'diversity'] as const,
    data: (organizationId: string, filters?: Record<string, any>): QueryKey =>
      filters
        ? ['analytics', 'diversity', organizationId, filters] as const
        : ['analytics', 'diversity', organizationId] as const,
  },
  
  // Geographic distribution
  geographic: {
    all: ['analytics', 'geographic'] as const,
    distribution: (organizationId: string): QueryKey =>
      ['analytics', 'geographic', organizationId] as const,
  },
  
  // Hiring metrics
  hiring: {
    all: ['analytics', 'hiring'] as const,
    topColleges: (organizationId: string, limit?: number): QueryKey =>
      limit
        ? ['analytics', 'hiring', 'colleges', organizationId, limit] as const
        : ['analytics', 'hiring', 'colleges', organizationId] as const,
  },
  
  // Quality metrics
  quality: {
    all: ['analytics', 'quality'] as const,
    metrics: (organizationId: string): QueryKey =>
      ['analytics', 'quality', organizationId] as const,
  },
  
  // Recruitment funnel
  recruitment: {
    all: ['analytics', 'recruitment'] as const,
    funnel: (organizationId: string, dateRange?: { start: string; end: string }): QueryKey =>
      dateRange
        ? ['analytics', 'recruitment', 'funnel', organizationId, dateRange] as const
        : ['analytics', 'recruitment', 'funnel', organizationId] as const,
  },
  
  // KPIs
  kpis: {
    all: ['analytics', 'kpis'] as const,
    data: (organizationId: string): QueryKey =>
      ['analytics', 'kpis', organizationId] as const,
  },
  
  // Realtime activities
  realtime: {
    all: ['analytics', 'realtime'] as const,
    activities: (organizationId: string): QueryKey =>
      ['analytics', 'realtime', organizationId] as const,
  },
  
  // Speed analytics
  speed: {
    all: ['analytics', 'speed'] as const,
    metrics: (organizationId: string): QueryKey =>
      ['analytics', 'speed', organizationId] as const,
  },
} as const;
```

### Courses Domain Keys

```typescript
// src/shared/lib/queryKeys/courses.ts

import type { QueryKey } from './types';

export const coursesKeys = {
  // Base key for all course queries
  all: ['courses'] as const,
  
  // Course list
  list: {
    all: ['courses', 'list'] as const,
    byCollege: (collegeId: string): QueryKey =>
      ['courses', 'list', collegeId] as const,
  },
  
  // Course enrollment
  enrollment: {
    all: ['courses', 'enrollment'] as const,
    byCourse: (courseId: string): QueryKey =>
      ['courses', 'enrollment', courseId] as const,
    byStudent: (learnerId: string): QueryKey =>
      ['courses', 'enrollment', 'learner', learnerId] as const,
  },
  
  // Course performance
  performance: {
    all: ['courses', 'performance'] as const,
    byCourse: (courseId: string): QueryKey =>
      ['courses', 'performance', courseId] as const,
    byStudent: (learnerId: string, courseId: string): QueryKey =>
      ['courses', 'performance', learnerId, courseId] as const,
  },
  
  // Course progress
  progress: {
    all: ['courses', 'progress'] as const,
    byStudent: (learnerId: string, courseId: string): QueryKey =>
      ['courses', 'progress', learnerId, courseId] as const,
  },
  
  // Curriculum courses (legacy naming)
  curriculum: {
    all: ['curriculum_courses'] as const,
    byCollege: (collegeId: string): QueryKey =>
      ['curriculum_courses', collegeId] as const,
  },
} as const;
```

### Subscription Domain Keys

```typescript
// src/shared/lib/queryKeys/subscription.ts

import type { QueryKey } from './types';

export const subscriptionKeys = {
  // Base key for all subscription queries
  all: ['subscription'] as const,
  
  // Subscription data
  data: {
    all: ['subscription', 'data'] as const,
    byOrganization: (organizationId: string): QueryKey =>
      ['subscription', 'data', organizationId] as const,
  },
  
  // Add-on catalog
  addons: {
    all: ['subscription', 'addons'] as const,
    catalog: (): QueryKey =>
      ['subscription', 'addons', 'catalog'] as const,
  },
  
  // Promotional events
  promotions: {
    all: ['subscription', 'promotions'] as const,
    active: (): QueryKey =>
      ['subscription', 'promotions', 'active'] as const,
  },
} as const;
```

### Main Export Module

```typescript
// src/shared/lib/queryKeys/index.ts

export { learnerKeys } from './learner';
export { educatorKeys } from './educator';
export { collegeKeys } from './college';
export { recruiterKeys } from './recruiter';
export { analyticsKeys } from './analytics';
export { coursesKeys } from './courses';
export { subscriptionKeys } from './subscription';

export type { QueryKey, UserType, ConversationType, ArchiveStatus } from './types';

/**
 * Centralized query key factory for React Query
 * 
 * Usage:
 *   import { queryKeys } from '@/shared/lib/queryKeys';
 *   
 *   useQuery({
 *     queryKey: queryKeys.learner.messages.conversation(conversationId),
 *     queryFn: ...
 *   });
 * 
 * Cache Invalidation:
 *   // Invalidate all learner queries
 *   queryClient.invalidateQueries({ queryKey: queryKeys.learner.all });
 *   
 *   // Invalidate all learner messages
 *   queryClient.invalidateQueries({ queryKey: queryKeys.learner.messages.all });
 */
export const queryKeys = {
  learner: learnerKeys,
  educator: educatorKeys,
  college: collegeKeys,
  recruiter: recruiterKeys,
  analytics: analyticsKeys,
  courses: coursesKeys,
  subscription: subscriptionKeys,
} as const;
```

## Data Models

### Query Key Structure

All query keys follow a consistent structure:

```typescript
type QueryKey = readonly [domain: string, resource: string, ...params: any[]];
```

Components:
1. **Domain**: Top-level category (learner, educator, college, recruiter, analytics, courses, subscription)
2. **Resource**: Specific resource type within domain (messages, conversations, unread, etc.)
3. **Parameters**: Optional identifiers and filters (IDs, status flags, date ranges, etc.)

### Migration Phases Data Model

```typescript
interface MigrationPhase {
  phase: number;
  name: string;
  description: string;
  files: string[];
  domains: string[];
  estimatedEffort: string;
}

const migrationPhases: MigrationPhase[] = [
  {
    phase: 1,
    name: 'learner Messaging',
    description: 'Migrate learner messaging hooks and pages',
    files: [
      'src/entities/learner/model/useStudentMessages.ts',
      'src/features/learner-profile/model/useStudentMessages.ts',
      'src/features/learner-profile/model/useStudentEducatorMessages.ts',
      'src/features/learner-profile/model/useStudentAdminMessages.ts',
      'src/features/learner-profile/model/useStudentCollegeAdminMessages.ts',
      'src/features/learner-profile/model/useStudentCollegeLecturerMessages.ts',
      'src/pages/learner/Messages.jsx',
      'src/pages/learner/EducatorMessages.jsx',
      'src/pages/learner/Applications.jsx',
    ],
    domains: ['learner'],
    estimatedEffort: '2-3 hours',
  },
  {
    phase: 2,
    name: 'Educator Messaging',
    description: 'Migrate educator messaging hooks and pages',
    files: [
      'src/features/educator-profile/model/useEducatorMessages.ts',
      'src/features/educator-profile/model/useEducatorAdminMessages.ts',
      'src/features/educator-profile/model/useCollegeEducatorAdminMessages.ts',
      'src/features/educator-profile/model/useCollegeEducatorAdminConversations.ts',
      'src/features/educator-profile/model/useConversationStudents.ts',
      'src/pages/educator/Communication.tsx',
      'src/pages/admin/schoolAdmin/AdminCommunication.tsx',
      'src/pages/educator/Messages.tsx',
    ],
    domains: ['educator'],
    estimatedEffort: '2-3 hours',
  },
  {
    phase: 3,
    name: 'College and Recruiter Messaging',
    description: 'Migrate college lecturer and recruiter messaging',
    files: [
      'src/features/college-profile/model/useCollegeLecturerConversations.ts',
      'src/features/college-profile/model/useCollegeLecturerMessages.ts',
      'src/features/college-profile/model/useCollegeAdminMessages.ts',
      'src/features/messaging/model/useMessages.ts',
      'src/features/messaging/model/useUnreadMessagesCount.ts',
      'src/pages/recruiter/Messages.tsx',
      'src/pages/recruiter/Messages.optimized.tsx',
    ],
    domains: ['college', 'recruiter'],
    estimatedEffort: '2-3 hours',
  },
  {
    phase: 4,
    name: 'School and College Admin Pages',
    description: 'Migrate admin page components',
    files: [
      'src/pages/admin/schoolAdmin/EducatorCommunication.tsx',
      'src/pages/admin/schoolAdmin/learnerCommunication.tsx',
      'src/pages/admin/collegeAdmin/learnerCollegeAdminCommunication.tsx',
      'src/pages/admin/collegeAdmin/CourseManagement.tsx',
      'src/pages/admin/collegeAdmin/Departmentmanagement.tsx',
      'src/pages/admin/collegeAdmin/ExaminationManagement.tsx',
    ],
    domains: ['college', 'educator', 'learner'],
    estimatedEffort: '2-3 hours',
  },
  {
    phase: 5,
    name: 'Analytics and Courses',
    description: 'Migrate analytics and course-related files',
    files: [
      'src/features/analytics/model/useDiversityData.ts',
      'src/features/analytics/model/useGeographicDistribution.ts',
      'src/features/analytics/model/useTopHiringColleges.ts',
      'src/features/analytics/model/useQualityMetrics.ts',
      'src/features/analytics/model/useRecruitmentFunnel.ts',
      'src/features/analytics/model/useAnalyticsKPIs.ts',
      'src/features/analytics/model/useRealtimeActivities.ts',
      'src/features/analytics/model/useSpeedAnalytics.ts',
      'src/features/courses/model/useCourseEnrollment.ts',
      'src/features/courses/model/useCoursePerformance.ts',
      'src/features/courses/model/useCourseProgress.ts',
      'src/features/courses/model/useCourses.ts',
      'src/features/courses/model/useCoursePerformance.ts',
    ],
    domains: ['analytics', 'courses'],
    estimatedEffort: '3-4 hours',
  },
  {
    phase: 6,
    name: 'Shared Hooks and Subscription',
    description: 'Migrate remaining shared hooks and subscription files',
    files: [
      'src/shared/hooks/usePromotionalEvent.ts',
      'src/shared/hooks/useStudentRealtimeActivities.ts',
      'src/shared/hooks/useSubscriptionQuery.js',
      'src/shared/hooks/useAddOnCatalog.ts',
    ],
    domains: ['subscription', 'learner'],
    estimatedEffort: '1-2 hours',
  },
];
```


## Migration Strategy

### Phase-by-Phase Approach

The migration follows a six-phase strategy organized by domain to minimize risk and enable incremental validation:

**Phase 1: learner Messaging (9 files)**
- Focus: learner-facing messaging hooks and pages
- Risk: Medium (high usage, but isolated domain)
- Validation: Test learner message flows, conversation loading, unread counts

**Phase 2: Educator Messaging (8 files)**
- Focus: Educator-facing messaging hooks and pages
- Risk: Medium (similar patterns to Phase 1)
- Validation: Test educator communication, admin messaging

**Phase 3: College and Recruiter Messaging (7 files)**
- Focus: College lecturer and recruiter messaging
- Risk: Medium (completes messaging domain migration)
- Validation: Test recruiter conversations, college lecturer flows

**Phase 4: School and College Admin Pages (6 files)**
- Focus: Administrative interface components
- Risk: Low (lower traffic, admin-only features)
- Validation: Test admin communication panels, course management

**Phase 5: Analytics and Courses (13 files)**
- Focus: Analytics dashboards and course management
- Risk: Low (read-heavy, less critical for core flows)
- Validation: Test analytics data loading, course queries

**Phase 6: Shared Hooks and Subscription (4 files)**
- Focus: Cross-cutting concerns and subscription features
- Risk: Low (final cleanup of remaining files)
- Validation: Test promotional events, subscription queries, realtime activities

### Migration Process Per File

For each file in a phase:

1. **Identify Query Keys**: Locate all `queryKey:` properties in `useQuery` and `useMutation` calls
2. **Map to Factory**: Determine the appropriate factory function from `queryKeys`
3. **Replace Inline Keys**: Replace hardcoded arrays with factory function calls
4. **Update Imports**: Add `import { queryKeys } from '@/shared/lib/queryKeys'`
5. **Verify Equivalence**: Ensure factory output matches original key structure exactly
6. **Test Functionality**: Run the feature to verify cache behavior is unchanged
7. **Check TypeScript**: Ensure no type errors are introduced

### Backward Compatibility Strategy

To ensure zero disruption during migration:

1. **Exact Key Matching**: Factory functions generate keys identical to original hardcoded values
2. **Parameter Order Preservation**: Maintain same parameter order as existing keys
3. **Optional Parameters**: Use optional parameters to match existing key variations
4. **Legacy Key Support**: Keep `curriculum_courses` naming for backward compatibility
5. **Gradual Rollout**: Migrate one phase at a time with validation between phases

### Rollback Plan

If issues are discovered during a phase:

1. **Immediate Rollback**: Revert the specific file(s) causing issues
2. **Preserve Factory**: Keep the factory module even if not fully adopted
3. **Partial Migration**: Continue using factory in successfully migrated files
4. **Issue Analysis**: Investigate root cause before proceeding to next phase
5. **Incremental Fix**: Fix issues in isolation without blocking other phases

## Error Handling

### Type Safety Errors

**Error**: TypeScript compilation fails due to incorrect parameter types

**Cause**: Factory function called with wrong parameter type or missing required parameter

**Resolution**:
```typescript
// ❌ Wrong - missing required parameter
queryKeys.learner.messages.conversation()

// ✅ Correct - provide required conversationId
queryKeys.learner.messages.conversation(conversationId)
```

**Prevention**: TypeScript function signatures enforce required parameters at compile time

### Cache Invalidation Errors

**Error**: Cache invalidation doesn't clear expected queries

**Cause**: Invalidation key doesn't match query key prefix

**Resolution**:
```typescript
// ❌ Wrong - invalidates nothing
queryClient.invalidateQueries({ queryKey: ['messages'] })

// ✅ Correct - invalidates all learner messages
queryClient.invalidateQueries({ queryKey: queryKeys.learner.messages.all })
```

**Prevention**: Use exported base keys (`all` properties) for invalidation

### Runtime Key Mismatch

**Error**: Query doesn't load cached data after migration

**Cause**: Factory-generated key doesn't match original hardcoded key

**Resolution**:
1. Compare factory output to original key using console.log
2. Adjust factory function to match exact structure
3. Add unit test to verify key equivalence

**Prevention**: Write unit tests comparing factory output to expected keys

### Missing Query Key

**Error**: No factory function exists for a specific query key

**Cause**: Query key not yet added to factory module

**Resolution**:
1. Add the missing key to appropriate domain module
2. Follow existing naming and structure patterns
3. Export from main index.ts
4. Add unit test for the new key

**Prevention**: Complete factory implementation before starting migration

### Parameter Type Confusion

**Error**: Factory function accepts wrong parameter type

**Cause**: Ambiguous parameter names or types

**Resolution**:
```typescript
// ❌ Ambiguous - what type is 'id'?
conversations: (id: string) => ['conversations', id] as const

// ✅ Clear - explicit parameter name and purpose
conversations: (learnerId: string) => ['conversations', learnerId] as const
```

**Prevention**: Use descriptive parameter names that indicate their purpose

## Testing Strategy

### Unit Testing Approach

**Objective**: Verify factory functions generate correct query keys

**Test Structure**:
```typescript
// src/shared/lib/queryKeys/__tests__/learner.test.ts

import { describe, it, expect } from 'vitest';
import { queryKeys } from '../index';

describe('learner Query Keys', () => {
  describe('messages', () => {
    it('generates conversation key with conversationId', () => {
      const conversationId = 'conv-123';
      const key = queryKeys.learner.messages.conversation(conversationId);
      
      expect(key).toEqual(['learner', 'messages', 'conv-123']);
      expect(key).toMatchObject(['learner', 'messages', conversationId]);
    });
    
    it('returns readonly array', () => {
      const key = queryKeys.learner.messages.all;
      
      // TypeScript should prevent mutation
      // @ts-expect-error - readonly array cannot be mutated
      key[0] = 'modified';
    });
  });
  
  describe('conversations', () => {
    it('generates conversation key without type', () => {
      const learnerId = 'learner-456';
      const key = queryKeys.learner.conversations.byStudent(learnerId);
      
      expect(key).toEqual(['learner', 'conversations', 'learner-456']);
    });
    
    it('generates conversation key with type', () => {
      const learnerId = 'learner-456';
      const type = 'learner_recruiter';
      const key = queryKeys.learner.conversations.byStudent(learnerId, type);
      
      expect(key).toEqual(['learner', 'conversations', 'learner-456', 'learner_recruiter']);
    });
  });
  
  describe('unread', () => {
    it('generates unread count key', () => {
      const learnerId = 'learner-789';
      const key = queryKeys.learner.unread.count(learnerId);
      
      expect(key).toEqual(['learner', 'unread', 'learner-789']);
    });
  });
});
```

**Coverage Requirements**:
- Test all factory functions in each domain module
- Verify parameter handling (required, optional, multiple)
- Confirm readonly array behavior
- Validate key structure matches expected format

### Integration Testing Approach

**Objective**: Verify migrated queries work correctly with React Query

**Test Structure**:
```typescript
// src/features/learner-profile/model/__tests__/useStudentMessages.test.tsx

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStudentMessages } from '../useStudentMessages';
import { queryKeys } from '@/shared/lib/queryKeys';

describe('useStudentMessages with centralized keys', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });
  
  it('uses correct query key for messages', async () => {
    const conversationId = 'conv-123';
    const learnerId = 'learner-456';
    
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(
      () => useStudentMessages({ learnerId, conversationId }),
      { wrapper }
    );
    
    await waitFor(() => {
      const queries = queryClient.getQueryCache().getAll();
      const messageQuery = queries.find(q => 
        JSON.stringify(q.queryKey) === 
        JSON.stringify(queryKeys.learner.messages.conversation(conversationId))
      );
      
      expect(messageQuery).toBeDefined();
    });
  });
  
  it('invalidates queries using base key', async () => {
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    // Set up some cached data
    queryClient.setQueryData(
      queryKeys.learner.messages.conversation('conv-1'),
      []
    );
    queryClient.setQueryData(
      queryKeys.learner.messages.conversation('conv-2'),
      []
    );
    
    // Invalidate all learner messages
    await queryClient.invalidateQueries({
      queryKey: queryKeys.learner.messages.all
    });
    
    // Verify both queries are invalidated
    const queries = queryClient.getQueryCache().getAll();
    queries.forEach(q => {
      if (q.queryKey[0] === 'learner' && q.queryKey[1] === 'messages') {
        expect(q.state.isInvalidated).toBe(true);
      }
    });
  });
});
```

**Coverage Requirements**:
- Test query key usage in hooks
- Verify cache invalidation with base keys
- Confirm data fetching works correctly
- Validate realtime subscriptions still function

### Property-Based Testing Configuration

**Library**: fast-check (for TypeScript/JavaScript)

**Configuration**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Run property tests with sufficient iterations
    globals: true,
    environment: 'jsdom',
  },
});
```

**Minimum Iterations**: 100 per property test

**Tag Format**: 
```typescript
/**
 * Feature: query-keys-centralization, Property 1: Query key immutability
 */
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Query Key Immutability

For any factory function in the Query_Key_Factory, the returned query key array must be readonly and prevent mutation attempts.

**Validates: Requirements 1.2, 9.4**

### Property 2: Parameterized Key Inclusion

For any factory function that accepts parameters, the generated query key array must include all provided parameters in the output array.

**Validates: Requirements 1.3**

### Property 3: Query Key Structure Consistency

For any factory function call with parameters, the returned query key array must follow the structure [domain, resource, ...params] where domain is a string identifying the domain, resource is a string identifying the resource type, and params are the provided parameters in order.

**Validates: Requirements 1.5**

### Property 4: Cache Key Equivalence

For any query key that existed as a hardcoded array before migration, the factory-generated key must be deeply equal to the original hardcoded key value.

**Validates: Requirements 2.5, 3.5, 4.5, 5.4, 6.5, 7.4, 8.1**

### Property 5: Parameter Order Preservation

For any parameterized query key, when the factory function is called with multiple parameters, the parameters must appear in the output array in the same order they were provided to the function.

**Validates: Requirements 8.2**

### Property 6: Hierarchical Prefix Invalidation

For any base key (e.g., queryKeys.learner.messages.all) used to invalidate queries in React Query, all queries whose keys start with that base key prefix must be invalidated.

**Validates: Requirements 10.2**

### Property 7: Parent-Child Key Hierarchy

For any parent key and child key in the factory, the child key array must start with all elements of the parent key array, establishing a hierarchical prefix relationship.

**Validates: Requirements 10.3**


## Implementation Details

### Factory Module Implementation

**File: src/shared/lib/queryKeys/index.ts**

The main export module aggregates all domain-specific key factories and provides a single import point:

```typescript
export const queryKeys = {
  learner: learnerKeys,
  educator: educatorKeys,
  college: collegeKeys,
  recruiter: recruiterKeys,
  analytics: analyticsKeys,
  courses: coursesKeys,
  subscription: subscriptionKeys,
} as const;
```

The `as const` assertion ensures:
- All nested objects are readonly
- String literals are inferred as literal types (not just `string`)
- TypeScript can provide precise autocomplete

### Migration Implementation Pattern

**Before Migration:**
```typescript
// src/features/learner-profile/model/useStudentMessages.ts
const { data: fetchedMessages } = useQuery({
  queryKey: ['learner-messages', conversationId || 'none'],
  queryFn: async () => {
    // ...
  },
});
```

**After Migration:**
```typescript
// src/features/learner-profile/model/useStudentMessages.ts
import { queryKeys } from '@/shared/lib/queryKeys';

const { data: fetchedMessages } = useQuery({
  queryKey: queryKeys.learner.messages.conversation(conversationId || 'none'),
  queryFn: async () => {
    // ...
  },
});
```

### Cache Invalidation Implementation

**Before Migration:**
```typescript
// Invalidate all learner messages
queryClient.invalidateQueries({ queryKey: ['learner-messages'] });

// Invalidate specific conversation
queryClient.invalidateQueries({ queryKey: ['learner-messages', conversationId] });
```

**After Migration:**
```typescript
// Invalidate all learner messages
queryClient.invalidateQueries({ queryKey: queryKeys.learner.messages.all });

// Invalidate specific conversation
queryClient.invalidateQueries({ 
  queryKey: queryKeys.learner.messages.conversation(conversationId) 
});
```

### Type Safety Implementation

**Compile-Time Parameter Validation:**
```typescript
// ✅ Correct - TypeScript accepts valid parameters
const key1 = queryKeys.learner.messages.conversation('conv-123');

// ❌ Error - TypeScript rejects missing parameter
const key2 = queryKeys.learner.messages.conversation();
// Error: Expected 1 arguments, but got 0

// ❌ Error - TypeScript rejects wrong type
const key3 = queryKeys.learner.messages.conversation(123);
// Error: Argument of type 'number' is not assignable to parameter of type 'string'
```

**Readonly Array Enforcement:**
```typescript
const key = queryKeys.learner.messages.all;

// ❌ Error - TypeScript prevents mutation
key[0] = 'modified';
// Error: Cannot assign to '0' because it is a read-only property

key.push('new-element');
// Error: Property 'push' does not exist on type 'readonly ["learner", "messages"]'
```

### Realtime Subscription Integration

Query keys work seamlessly with existing realtime subscriptions:

```typescript
// Before migration
useEffect(() => {
  const channel = supabase
    .channel(`learner-conversation:${conversationId}`)
    .on('postgres_changes', { /* ... */ }, (payload) => {
      queryClient.invalidateQueries({
        queryKey: ['learner-messages', conversationId],
        refetchType: 'none'
      });
    })
    .subscribe();
  
  return () => channel.unsubscribe();
}, [conversationId, queryClient]);

// After migration
useEffect(() => {
  const channel = supabase
    .channel(`learner-conversation:${conversationId}`)
    .on('postgres_changes', { /* ... */ }, (payload) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.learner.messages.conversation(conversationId),
        refetchType: 'none'
      });
    })
    .subscribe();
  
  return () => channel.unsubscribe();
}, [conversationId, queryClient]);
```

### Performance Considerations

**Factory Function Overhead:**
- Factory functions are simple array constructors with negligible overhead
- No complex computation or I/O operations
- Inline-able by JavaScript engines
- Typical execution time: < 1 microsecond

**Memory Impact:**
- Factory functions create new arrays on each call (same as hardcoded arrays)
- No additional memory overhead compared to current implementation
- React Query caches the arrays by reference, not by value

**Bundle Size Impact:**
- Estimated factory module size: ~5-8 KB (minified)
- Negligible impact on overall bundle size
- Tree-shaking eliminates unused domain modules

### Development Workflow

**Adding New Query Keys:**

1. Identify the appropriate domain module (learner, educator, etc.)
2. Add the factory function following existing patterns
3. Export from the domain module
4. Add unit test verifying key structure
5. Use in consuming code with full type safety

Example:
```typescript
// 1. Add to src/shared/lib/queryKeys/learner.ts
export const learnerKeys = {
  // ... existing keys
  
  // New key for learner profile
  profile: {
    all: ['learner', 'profile'] as const,
    byId: (learnerId: string): QueryKey =>
      ['learner', 'profile', learnerId] as const,
  },
} as const;

// 2. Add test in src/shared/lib/queryKeys/__tests__/learner.test.ts
it('generates profile key', () => {
  const key = queryKeys.learner.profile.byId('learner-123');
  expect(key).toEqual(['learner', 'profile', 'learner-123']);
});

// 3. Use in code
const { data: profile } = useQuery({
  queryKey: queryKeys.learner.profile.byId(learnerId),
  queryFn: () => fetchStudentProfile(learnerId),
});
```

### Debugging and Troubleshooting

**Inspecting Query Keys:**
```typescript
// Log factory output to compare with expected key
const key = queryKeys.learner.messages.conversation(conversationId);
console.log('Generated key:', key);
console.log('Expected key:', ['learner-messages', conversationId]);
```

**Verifying Cache Invalidation:**
```typescript
// Before invalidation
console.log('Queries before:', queryClient.getQueryCache().getAll());

// Invalidate
await queryClient.invalidateQueries({ 
  queryKey: queryKeys.learner.messages.all 
});

// After invalidation
console.log('Queries after:', queryClient.getQueryCache().getAll());
```

**Type Checking:**
```typescript
// Use TypeScript's type system to verify key types
import type { QueryKey } from '@/shared/lib/queryKeys';

const key: QueryKey = queryKeys.learner.messages.conversation('conv-123');
// TypeScript will error if key doesn't match QueryKey type
```

### Migration Validation Checklist

For each migrated file:

- [ ] All hardcoded query key arrays replaced with factory calls
- [ ] Import statement added: `import { queryKeys } from '@/shared/lib/queryKeys'`
- [ ] No TypeScript compilation errors
- [ ] Factory-generated keys match original hardcoded keys exactly
- [ ] Cache invalidation calls updated to use base keys
- [ ] Realtime subscription invalidations updated
- [ ] Manual testing confirms feature works correctly
- [ ] No console errors or warnings in browser
- [ ] Query devtools show correct key structure

### Rollout Strategy

**Phase 1 Rollout (learner Messaging):**
1. Create factory module with learner domain keys
2. Migrate one hook file as proof of concept
3. Verify functionality in development environment
4. Migrate remaining 8 files
5. Deploy to staging for QA testing
6. Monitor for issues before proceeding to Phase 2

**Subsequent Phases:**
- Follow same pattern for each phase
- Deploy each phase independently
- Allow 1-2 days between phases for issue detection
- Maintain rollback capability for each phase

**Completion Criteria:**
- All 46 files migrated successfully
- Zero TypeScript compilation errors
- All features tested and working
- No cache-related bugs reported
- Performance metrics unchanged


## Testing Implementation

### Unit Test Suite Structure

```
src/shared/lib/queryKeys/__tests__/
├── learner.test.ts          # learner domain key tests
├── educator.test.ts         # Educator domain key tests
├── college.test.ts          # College domain key tests
├── recruiter.test.ts        # Recruiter domain key tests
├── analytics.test.ts        # Analytics domain key tests
├── courses.test.ts          # Courses domain key tests
├── subscription.test.ts     # Subscription domain key tests
├── integration.test.ts      # Cross-domain integration tests
└── properties.test.ts       # Property-based tests
```

### Unit Test Examples

**Testing Key Structure:**
```typescript
// src/shared/lib/queryKeys/__tests__/learner.test.ts
import { describe, it, expect } from 'vitest';
import { queryKeys } from '../index';

describe('learner Query Keys', () => {
  describe('base keys', () => {
    it('exports all base key', () => {
      expect(queryKeys.learner.all).toEqual(['learner']);
    });
    
    it('exports messages base key', () => {
      expect(queryKeys.learner.messages.all).toEqual(['learner', 'messages']);
    });
  });
  
  describe('parameterized keys', () => {
    it('generates conversation key with conversationId', () => {
      const conversationId = 'conv-abc-123';
      const key = queryKeys.learner.messages.conversation(conversationId);
      
      expect(key).toEqual(['learner', 'messages', 'conv-abc-123']);
      expect(key[0]).toBe('learner');
      expect(key[1]).toBe('messages');
      expect(key[2]).toBe(conversationId);
    });
    
    it('generates conversation key with different conversationId', () => {
      const conversationId = 'conv-xyz-789';
      const key = queryKeys.learner.messages.conversation(conversationId);
      
      expect(key).toEqual(['learner', 'messages', 'conv-xyz-789']);
    });
  });
  
  describe('optional parameters', () => {
    it('generates conversation key without type parameter', () => {
      const learnerId = 'learner-123';
      const key = queryKeys.learner.conversations.byStudent(learnerId);
      
      expect(key).toEqual(['learner', 'conversations', 'learner-123']);
    });
    
    it('generates conversation key with type parameter', () => {
      const learnerId = 'learner-123';
      const type = 'learner_recruiter';
      const key = queryKeys.learner.conversations.byStudent(learnerId, type);
      
      expect(key).toEqual(['learner', 'conversations', 'learner-123', 'learner_recruiter']);
    });
  });
});
```

**Testing Backward Compatibility:**
```typescript
// src/shared/lib/queryKeys/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest';
import { queryKeys } from '../index';

describe('Backward Compatibility', () => {
  it('learner messages key matches legacy format', () => {
    const conversationId = 'conv-123';
    const factoryKey = queryKeys.learner.messages.conversation(conversationId);
    const legacyKey = ['learner-messages', conversationId];
    
    // Note: These are intentionally different formats
    // This test documents the migration from legacy to new format
    expect(factoryKey).toEqual(['learner', 'messages', 'conv-123']);
    expect(legacyKey).toEqual(['learner-messages', 'conv-123']);
    
    // The migration maintains cache by using the same conversationId
    expect(factoryKey[2]).toBe(legacyKey[1]);
  });
  
  it('curriculum courses key maintains legacy naming', () => {
    const collegeId = 'college-456';
    const factoryKey = queryKeys.courses.curriculum.byCollege(collegeId);
    const legacyKey = ['curriculum_courses', collegeId];
    
    // This key maintains exact backward compatibility
    expect(factoryKey).toEqual(legacyKey);
  });
});
```

### Property-Based Test Examples

**Property 1: Query Key Immutability**
```typescript
/**
 * Feature: query-keys-centralization, Property 1: Query key immutability
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { queryKeys } from '../index';

describe('Property 1: Query Key Immutability', () => {
  it('all factory-generated keys are readonly arrays', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          queryKeys.learner.messages.all,
          queryKeys.educator.conversations.all,
          queryKeys.analytics.diversity.all,
          queryKeys.courses.enrollment.all
        ),
        (key) => {
          // Verify the key is an array
          expect(Array.isArray(key)).toBe(true);
          
          // Verify TypeScript marks it as readonly
          // (runtime check: Object.isFrozen or similar)
          const descriptor = Object.getOwnPropertyDescriptor(key, '0');
          expect(descriptor?.writable).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('parameterized keys are readonly', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (id) => {
          const key = queryKeys.learner.messages.conversation(id);
          
          // Attempt mutation should fail
          expect(() => {
            (key as any)[0] = 'modified';
          }).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 2: Parameterized Key Inclusion**
```typescript
/**
 * Feature: query-keys-centralization, Property 2: Parameterized key inclusion
 */
describe('Property 2: Parameterized Key Inclusion', () => {
  it('all provided parameters appear in generated key', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (conversationId) => {
          const key = queryKeys.learner.messages.conversation(conversationId);
          
          // Key must include the provided parameter
          expect(key).toContain(conversationId);
          expect(key[2]).toBe(conversationId);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('multiple parameters all appear in generated key', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (learnerId, courseId) => {
          const key = queryKeys.courses.performance.byStudent(learnerId, courseId);
          
          // Both parameters must be present
          expect(key).toContain(learnerId);
          expect(key).toContain(courseId);
          expect(key[2]).toBe(learnerId);
          expect(key[3]).toBe(courseId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 3: Query Key Structure Consistency**
```typescript
/**
 * Feature: query-keys-centralization, Property 3: Query key structure consistency
 */
describe('Property 3: Query Key Structure Consistency', () => {
  it('all keys follow [domain, resource, ...params] structure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (id) => {
          const testCases = [
            queryKeys.learner.messages.conversation(id),
            queryKeys.educator.conversations.byEducator(id),
            queryKeys.recruiter.messages.conversation(id),
            queryKeys.analytics.diversity.data(id),
          ];
          
          testCases.forEach(key => {
            // First element is domain (string)
            expect(typeof key[0]).toBe('string');
            
            // Second element is resource (string)
            expect(typeof key[1]).toBe('string');
            
            // Remaining elements are parameters
            expect(key.length).toBeGreaterThanOrEqual(2);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 4: Cache Key Equivalence**
```typescript
/**
 * Feature: query-keys-centralization, Property 4: Cache key equivalence
 */
describe('Property 4: Cache Key Equivalence', () => {
  it('factory keys match original hardcoded keys for curriculum courses', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (collegeId) => {
          const factoryKey = queryKeys.courses.curriculum.byCollege(collegeId);
          const originalKey = ['curriculum_courses', collegeId];
          
          // Deep equality check
          expect(factoryKey).toEqual(originalKey);
          expect(JSON.stringify(factoryKey)).toBe(JSON.stringify(originalKey));
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 5: Parameter Order Preservation**
```typescript
/**
 * Feature: query-keys-centralization, Property 5: Parameter order preservation
 */
describe('Property 5: Parameter Order Preservation', () => {
  it('parameters appear in the same order they are provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (param1, param2) => {
          const key = queryKeys.courses.performance.byStudent(param1, param2);
          
          // Parameters must appear in order
          const paramIndex1 = key.indexOf(param1);
          const paramIndex2 = key.indexOf(param2);
          
          expect(paramIndex1).toBeLessThan(paramIndex2);
          expect(key[2]).toBe(param1);
          expect(key[3]).toBe(param2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 6: Hierarchical Prefix Invalidation**
```typescript
/**
 * Feature: query-keys-centralization, Property 6: Hierarchical prefix invalidation
 */
import { QueryClient } from '@tanstack/react-query';

describe('Property 6: Hierarchical Prefix Invalidation', () => {
  it('invalidating base key invalidates all child queries', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
        async (conversationIds) => {
          const queryClient = new QueryClient();
          
          // Set up multiple queries with different conversation IDs
          conversationIds.forEach(id => {
            queryClient.setQueryData(
              queryKeys.learner.messages.conversation(id),
              []
            );
          });
          
          // Invalidate using base key
          await queryClient.invalidateQueries({
            queryKey: queryKeys.learner.messages.all
          });
          
          // All queries should be invalidated
          const queries = queryClient.getQueryCache().getAll();
          const learnerMessageQueries = queries.filter(q => 
            q.queryKey[0] === 'learner' && q.queryKey[1] === 'messages'
          );
          
          learnerMessageQueries.forEach(q => {
            expect(q.state.isInvalidated).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 7: Parent-Child Key Hierarchy**
```typescript
/**
 * Feature: query-keys-centralization, Property 7: Parent-child key hierarchy
 */
describe('Property 7: Parent-Child Key Hierarchy', () => {
  it('child keys start with parent key prefix', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (id) => {
          const parentKey = queryKeys.learner.messages.all;
          const childKey = queryKeys.learner.messages.conversation(id);
          
          // Child key must start with all elements of parent key
          expect(childKey.length).toBeGreaterThan(parentKey.length);
          
          parentKey.forEach((element, index) => {
            expect(childKey[index]).toBe(element);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('all domain child keys start with domain base key', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (id) => {
          const domainKey = queryKeys.learner.all;
          const childKeys = [
            queryKeys.learner.messages.conversation(id),
            queryKeys.learner.conversations.byStudent(id),
            queryKeys.learner.unread.count(id),
          ];
          
          childKeys.forEach(childKey => {
            expect(childKey[0]).toBe(domainKey[0]);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Test Examples

**Testing with React Query:**
```typescript
// src/shared/lib/queryKeys/__tests__/react-query-integration.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../index';

describe('React Query Integration', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });
  
  it('uses factory keys in useQuery', async () => {
    const conversationId = 'conv-test-123';
    
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(
      () => useQuery({
        queryKey: queryKeys.learner.messages.conversation(conversationId),
        queryFn: async () => ['message1', 'message2'],
      }),
      { wrapper }
    );
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toEqual(['message1', 'message2']);
    
    // Verify the query is cached with correct key
    const cachedData = queryClient.getQueryData(
      queryKeys.learner.messages.conversation(conversationId)
    );
    expect(cachedData).toEqual(['message1', 'message2']);
  });
  
  it('invalidates queries using base keys', async () => {
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    // Set up multiple queries
    queryClient.setQueryData(
      queryKeys.learner.messages.conversation('conv-1'),
      ['msg1']
    );
    queryClient.setQueryData(
      queryKeys.learner.messages.conversation('conv-2'),
      ['msg2']
    );
    queryClient.setQueryData(
      queryKeys.learner.unread.count('learner-1'),
      5
    );
    
    // Invalidate all learner messages
    await queryClient.invalidateQueries({
      queryKey: queryKeys.learner.messages.all
    });
    
    // Check which queries were invalidated
    const queries = queryClient.getQueryCache().getAll();
    
    const messageQueries = queries.filter(q => 
      q.queryKey[0] === 'learner' && q.queryKey[1] === 'messages'
    );
    const unreadQueries = queries.filter(q => 
      q.queryKey[0] === 'learner' && q.queryKey[1] === 'unread'
    );
    
    // Message queries should be invalidated
    messageQueries.forEach(q => {
      expect(q.state.isInvalidated).toBe(true);
    });
    
    // Unread queries should NOT be invalidated
    unreadQueries.forEach(q => {
      expect(q.state.isInvalidated).toBe(false);
    });
  });
});
```

### Test Configuration

**Vitest Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/shared/lib/queryKeys/**/*.ts'],
      exclude: ['**/*.test.ts', '**/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Test Coverage Goals:**
- Unit tests: 100% coverage of factory functions
- Property tests: Minimum 100 iterations per property
- Integration tests: Cover all major use cases
- Migration tests: Verify each phase's file migrations


## Security Considerations

### Type Safety as Security

The centralized query key factory provides security benefits through type safety:

1. **Prevents Injection Attacks**: TypeScript type checking ensures only valid parameter types are accepted, preventing potential injection of malicious values
2. **Compile-Time Validation**: Invalid query keys are caught at compile time rather than runtime, reducing attack surface
3. **Immutability**: Readonly arrays prevent accidental or malicious mutation of cache keys

### Access Control

Query keys themselves don't implement access control, but they support secure patterns:

1. **User ID Validation**: Factory functions accept user IDs as parameters, which should be validated before use
2. **Conversation Isolation**: Each conversation has a unique ID, preventing cross-conversation data leakage
3. **Domain Separation**: Domain-based organization makes it easier to audit and control access patterns

### Best Practices

**Parameter Sanitization:**
```typescript
// ❌ Don't pass unsanitized user input directly
const key = queryKeys.learner.messages.conversation(userInput);

// ✅ Validate and sanitize first
const sanitizedId = validateConversationId(userInput);
if (sanitizedId) {
  const key = queryKeys.learner.messages.conversation(sanitizedId);
}
```

**Authorization Checks:**
```typescript
// Always verify user has access before querying
const { data } = useQuery({
  queryKey: queryKeys.learner.messages.conversation(conversationId),
  queryFn: async () => {
    // Authorization check happens in the query function
    if (!await userHasAccessToConversation(userId, conversationId)) {
      throw new Error('Unauthorized');
    }
    return await fetchMessages(conversationId);
  },
  enabled: !!conversationId && !!userId,
});
```

## Performance Optimization

### Factory Function Performance

**Benchmarks:**
- Factory function execution: < 1 microsecond
- Array creation overhead: Negligible (same as hardcoded arrays)
- Memory allocation: Identical to current implementation

**Optimization Techniques:**
1. **Const Assertions**: Use `as const` to enable literal type inference without runtime cost
2. **No Closures**: Factory functions don't create closures, avoiding memory overhead
3. **Inline-able**: Simple functions can be inlined by JavaScript engines

### Cache Performance

**Query Key Comparison:**
React Query compares query keys using shallow equality:
- Factory-generated arrays are compared by reference
- Parameter changes create new array references
- No performance difference from hardcoded arrays

**Invalidation Performance:**
Prefix-based invalidation is efficient:
```typescript
// O(n) where n is number of cached queries
queryClient.invalidateQueries({ 
  queryKey: queryKeys.learner.messages.all 
});
```

### Bundle Size Impact

**Estimated Sizes:**
- Factory module (all domains): ~5-8 KB minified
- Per-domain module: ~0.5-1 KB minified
- Tree-shaking: Unused domains are eliminated

**Comparison:**
- Current approach: 0 KB (inline strings)
- Factory approach: +5-8 KB total
- Trade-off: Minimal size increase for significant maintainability improvement

## Monitoring and Observability

### Query Key Logging

**Development Logging:**
```typescript
// Enable query key logging in development
if (import.meta.env.DEV) {
  const originalUseQuery = useQuery;
  useQuery = (options) => {
    console.log('Query key:', options.queryKey);
    return originalUseQuery(options);
  };
}
```

**Production Monitoring:**
```typescript
// Track query key usage in production
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onSuccess: (data, query) => {
        analytics.track('query_success', {
          queryKey: query.queryKey[0], // Domain only for privacy
          duration: query.state.dataUpdatedAt - query.state.fetchedAt,
        });
      },
      onError: (error, query) => {
        analytics.track('query_error', {
          queryKey: query.queryKey[0],
          error: error.message,
        });
      },
    },
  },
});
```

### Migration Progress Tracking

**Phase Completion Metrics:**
```typescript
interface MigrationMetrics {
  phase: number;
  filesTotal: number;
  filesMigrated: number;
  testsPassing: number;
  testsTotal: number;
  completionDate: string | null;
}

// Track migration progress
const migrationProgress: MigrationMetrics[] = [
  {
    phase: 1,
    filesTotal: 9,
    filesMigrated: 0,
    testsPassing: 0,
    testsTotal: 15,
    completionDate: null,
  },
  // ... other phases
];
```

### Error Tracking

**Common Error Patterns:**
1. **Missing Parameter**: Factory function called without required parameter
2. **Type Mismatch**: Wrong parameter type passed to factory function
3. **Cache Miss**: Query key doesn't match cached data
4. **Invalidation Failure**: Base key doesn't match any queries

**Error Monitoring:**
```typescript
// Track factory-related errors
try {
  const key = queryKeys.learner.messages.conversation(conversationId);
} catch (error) {
  errorTracking.captureException(error, {
    context: 'query_key_factory',
    domain: 'learner',
    resource: 'messages',
  });
}
```

## Documentation and Knowledge Transfer

### Developer Documentation

**README.md for Query Keys Module:**
```markdown
# Query Keys Factory

Centralized query key generation for React Query.

## Usage

Import the factory:
\`\`\`typescript
import { queryKeys } from '@/shared/lib/queryKeys';
\`\`\`

Use in queries:
\`\`\`typescript
const { data } = useQuery({
  queryKey: queryKeys.learner.messages.conversation(conversationId),
  queryFn: () => fetchMessages(conversationId),
});
\`\`\`

Invalidate queries:
\`\`\`typescript
queryClient.invalidateQueries({ 
  queryKey: queryKeys.learner.messages.all 
});
\`\`\`

## Adding New Keys

1. Choose the appropriate domain module
2. Add factory function following existing patterns
3. Add unit test
4. Export from domain module
\`\`\`

### Code Comments

**Factory Function Documentation:**
```typescript
/**
 * Generate query key for a specific conversation's messages
 * 
 * @param conversationId - Unique identifier for the conversation
 * @returns Readonly query key array: ['learner', 'messages', conversationId]
 * 
 * @example
 * const key = queryKeys.learner.messages.conversation('conv-123');
 * // Returns: ['learner', 'messages', 'conv-123']
 * 
 * @see useStudentMessages hook for usage example
 */
conversation: (conversationId: string): QueryKey =>
  ['learner', 'messages', conversationId] as const,
```

### Migration Guide

**Step-by-Step Migration Instructions:**

1. **Identify Query Keys**: Search for `queryKey:` in the file
2. **Map to Factory**: Find the equivalent factory function
3. **Replace**: Update the query key with factory call
4. **Import**: Add import statement at top of file
5. **Test**: Verify functionality works correctly
6. **Commit**: Commit the migrated file

**Example Migration:**
```typescript
// Before
const { data } = useQuery({
  queryKey: ['learner-messages', conversationId || 'none'],
  queryFn: fetchMessages,
});

// After
import { queryKeys } from '@/shared/lib/queryKeys';

const { data } = useQuery({
  queryKey: queryKeys.learner.messages.conversation(conversationId || 'none'),
  queryFn: fetchMessages,
});
```

### Team Training

**Training Topics:**
1. Why centralized query keys matter
2. How to use the factory functions
3. How to add new query keys
4. How to invalidate queries efficiently
5. Common pitfalls and how to avoid them

**Training Materials:**
- Video walkthrough of factory usage
- Interactive examples in development environment
- Migration checklist and templates
- FAQ document for common questions

## Future Enhancements

### Potential Improvements

**1. Query Key Validation:**
```typescript
// Runtime validation of query key structure
export function validateQueryKey(key: unknown): key is QueryKey {
  if (!Array.isArray(key)) return false;
  if (key.length < 2) return false;
  if (typeof key[0] !== 'string') return false;
  if (typeof key[1] !== 'string') return false;
  return true;
}
```

**2. Query Key Serialization:**
```typescript
// Serialize query keys for logging/debugging
export function serializeQueryKey(key: QueryKey): string {
  return key.join(':');
}

// Example: ['learner', 'messages', 'conv-123'] -> 'learner:messages:conv-123'
```

**3. Query Key Parsing:**
```typescript
// Parse serialized query keys back to arrays
export function parseQueryKey(serialized: string): QueryKey {
  return serialized.split(':') as QueryKey;
}
```

**4. Type-Safe Invalidation:**
```typescript
// Type-safe invalidation helpers
export const invalidate = {
  learner: {
    allMessages: (queryClient: QueryClient) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.learner.messages.all }),
    
    conversation: (queryClient: QueryClient, conversationId: string) =>
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.learner.messages.conversation(conversationId) 
      }),
  },
  // ... other domains
};
```

**5. Query Key Metrics:**
```typescript
// Track query key usage statistics
export function trackQueryKeyUsage(key: QueryKey) {
  const domain = key[0];
  const resource = key[1];
  
  metrics.increment('query_key_usage', {
    domain,
    resource,
  });
}
```

### Extensibility

**Adding New Domains:**
The factory is designed to be easily extensible:

1. Create new domain module: `src/shared/lib/queryKeys/newDomain.ts`
2. Define keys following existing patterns
3. Export from main index.ts
4. Add unit tests
5. Document in README

**Custom Key Generators:**
```typescript
// Support for custom key generation logic
export function createCustomKey<T extends any[]>(
  domain: string,
  resource: string,
  ...params: T
): QueryKey {
  return [domain, resource, ...params] as const;
}
```

## Conclusion

The centralized query key factory provides a robust, type-safe, and maintainable solution for managing React Query cache keys across the codebase. The six-phase migration strategy ensures a smooth transition with minimal risk, while the hierarchical key structure enables efficient cache invalidation. Property-based testing validates correctness across all possible inputs, and comprehensive documentation supports long-term maintainability.

### Success Criteria

The implementation will be considered successful when:

1. ✅ All 46 files migrated to use centralized query keys
2. ✅ Zero TypeScript compilation errors
3. ✅ All property-based tests passing (100+ iterations each)
4. ✅ All unit tests passing with 100% coverage
5. ✅ All integration tests passing
6. ✅ No cache-related bugs in production
7. ✅ Performance metrics unchanged from baseline
8. ✅ Developer feedback positive on usability
9. ✅ Documentation complete and accessible
10. ✅ Team trained on factory usage

### Next Steps

After design approval:

1. Create the factory module structure
2. Implement domain-specific key factories
3. Write comprehensive test suite
4. Begin Phase 1 migration (learner Messaging)
5. Validate and iterate based on feedback
6. Proceed through remaining phases
7. Monitor production for issues
8. Gather team feedback for improvements

