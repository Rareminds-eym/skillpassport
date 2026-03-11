# Design Document: FSD Phase 3 - High-Impact Features

## Overview

Phase 3 of the Feature-Sliced Design (FSD) migration focuses on migrating four business-critical features from the flat structure to the `features/` layer: Messaging, Courses, Student Profile, and Subscription. This phase builds upon the completed Phase 1 (shared layer) and Phase 2 (auth feature) foundations.

These features represent the most frequently-used and business-critical functionality in the application. The migration consolidates code scattered across `components/`, `services/`, `hooks/`, `stores/`, and `pages/` into cohesive feature slices while introducing significant consolidation opportunities to reduce code duplication.

### Key Design Principles

1. **Copy, Don't Move**: Preserve existing file locations while creating new FSD structure
2. **Aggressive Consolidation**: Merge duplicate components, services, and hooks
3. **Public API Pattern**: All features export through index.ts files
4. **Feature Isolation**: Each feature is self-contained with clear boundaries
5. **Backward Compatibility**: Support both old and new import paths during transition
6. **Domain Organization**: Organize large features by subdomain (individual/organization subscriptions)
7. **Template for Scale**: Establish patterns for migrating complex, multi-file features

## Architecture

### FSD Layer Context

Phase 3 expands the features/ layer with four major features:

```
app/        (Phase 6)
  ↓
pages/      (Phase 5 - will import from features)
  ↓
widgets/    (Phase 5)
  ↓
features/   ← Phase 3: Messaging, Courses, Student Profile, Subscription
  ├── auth/              ✅ Phase 2 Complete
  ├── messaging/         ← Phase 3
  ├── courses/           ← Phase 3
  ├── student-profile/   ← Phase 3
  └── subscription/      ← Phase 3
  ↓
entities/   (Phase 5)
  ↓
shared/     ✅ Phase 1 Complete
```

**Import Rules for Phase 3 Features:**
- Features CAN import from `shared/` (UI, API, config, utils, hooks)
- Features CAN import from `features/auth` (for authentication state)
- Features CANNOT import from other Phase 3 features directly
- Features CANNOT import from pages, widgets, or app layers
- Pages will import from features via public APIs

### Phase 3 Scope

Phase 3 creates four feature structures:

```
src/features/
├── messaging/          # 18 files → ~8 files (consolidation)
├── courses/            # 27 files → ~20 files (consolidation)
├── student-profile/    # 63+ files → ~35 files (aggressive consolidation)
└── subscription/       # 60+ files → ~45 files (organization)
```


## Feature 1: Messaging

### Overview

The messaging feature handles real-time communication between all user roles. Currently scattered across 18 files with significant duplication in role-specific conversation modals.

### Current State Analysis

**Files:**
- 13 UI components (12 role-specific modals + 1 shared modal)
- 1 service (messageService.ts)
- 3 hooks (useMessages, useMessageNotifications, useTypingIndicator)
- 1 store (useMessageStore.ts)

**Key Issues:**
- 12 nearly-identical conversation modal components differing only by role combinations
- Duplicate conversation creation logic
- No clear separation between UI and business logic

### Target Structure

```
features/messaging/
├── ui/
│   ├── MessageModal.tsx              # Main message interface
│   ├── ConversationModal.tsx         # Unified conversation modal
│   ├── DeleteConversationModal.tsx   # Delete confirmation
│   └── index.ts
├── model/
│   ├── useMessages.ts                # Message state and operations
│   ├── useMessageNotifications.ts    # Notification handling
│   ├── useTypingIndicator.ts         # Typing status
│   ├── messageStore.ts               # Zustand store
│   └── index.ts
├── api/
│   ├── messageService.ts             # Message CRUD operations
│   └── index.ts
├── lib/
│   ├── conversationConfig.ts         # Role-based conversation configs
│   └── index.ts
└── index.ts
```

### Consolidation Strategy

**Before:** 12 role-specific modals
- NewStudentConversationModal
- NewEducatorConversationModal
- NewAdminConversationModal
- NewCollegeAdminConversationModal
- NewSchoolAdminEducatorConversationModal
- ... (7 more variants)

**After:** 1 unified modal with configuration
```typescript
// features/messaging/ui/ConversationModal.tsx
interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationType: ConversationType;
}

// features/messaging/lib/conversationConfig.ts
export const conversationConfigs = {
  'student-educator': { title: 'New Conversation with Educator', ... },
  'admin-educator': { title: 'New Conversation with Educator', ... },
  // ... other configurations
};
```

### Public API

```typescript
// features/messaging/index.ts
export { MessageModal, ConversationModal } from './ui';
export { useMessages, useMessageNotifications } from './model';
export { messageService } from './api';
export type { Message, Conversation, ConversationType } from './model';
```

### Migration Impact

- **Files reduced:** 18 → 8 (56% reduction)
- **Import updates:** ~50 files
- **Consolidation:** 12 modals → 1 unified modal


## Feature 2: Courses

### Overview

The courses feature handles course management, enrollment, progress tracking, and AI-powered recommendations. Currently split between educator and student components with some duplication.

### Current State Analysis

**Files:**
- 11 UI components (7 educator + 4 student)
- 8 services (3 core + 5 recommendation engine)
- 1 hook (useCoursePerformance)
- 2 pages (CoursePlayer, Courses)

**Key Issues:**
- Separate educator/student components with overlapping functionality
- Course recommendation engine not properly organized
- CoursePlayer page should be a feature component
- No unified course state management

### Target Structure

```
features/courses/
├── ui/
│   ├── CourseCard.tsx                # Unified course card (educator/student views)
│   ├── CourseDetailDrawer.tsx        # Unified detail view
│   ├── CoursePlayer.tsx              # Video player (from pages)
│   ├── CourseFilters.tsx             # Search and filter
│   ├── CreateCourseModal.tsx         # Educator: create course
│   ├── AddLessonModal.tsx            # Educator: add lesson
│   ├── AssignEducatorModal.tsx       # Educator: assign
│   ├── ResourceUploadComponent.tsx   # Educator: upload
│   ├── QuizProgressTracker.tsx       # Student: quiz tracking
│   ├── RestoreProgressModal.tsx      # Student: restore progress
│   ├── SyncStatusIndicator.tsx       # Student: sync status
│   └── index.ts
├── model/
│   ├── useCourses.ts                 # Course list and filters
│   ├── useCourseEnrollment.ts        # Enrollment operations
│   ├── useCourseProgress.ts          # Progress tracking
│   ├── useCoursePerformance.ts       # Performance analytics
│   └── index.ts
├── api/
│   ├── courseService.ts              # Unified course CRUD
│   ├── enrollmentService.ts          # Enrollment operations
│   ├── progressService.ts            # Progress tracking
│   └── index.ts
├── lib/
│   ├── courseValidation.ts           # Validation rules
│   ├── recommendations/              # AI recommendation engine
│   │   ├── recommendationService.ts
│   │   ├── courseRepository.ts
│   │   ├── embeddingService.ts
│   │   ├── skillGapMatcher.ts
│   │   └── index.ts
│   └── index.ts
└── index.ts
```

### Consolidation Strategy

**Course Services:**
- Merge courseApiService, courseProgressService, courseEnrollmentService
- Create unified courseService with role-aware methods
- Preserve all unique functionality from each service

**Course Components:**
- Merge educator/student CourseCard into single component with view prop
- Merge educator/student CourseDetail into single drawer with role-based rendering
- Keep role-specific components (CreateCourseModal for educators only)

**Recommendation Engine:**
- Organize as submodule under lib/recommendations/
- Maintain existing AI/ML functionality
- Improve discoverability and maintainability

### Public API

```typescript
// features/courses/index.ts
export { 
  CourseCard, 
  CourseDetailDrawer, 
  CoursePlayer,
  CreateCourseModal 
} from './ui';

export { 
  useCourses, 
  useCourseEnrollment, 
  useCourseProgress 
} from './model';

export { 
  courseService, 
  enrollmentService 
} from './api';

export { getCourseRecommendations } from './lib/recommendations';

export type { Course, Lesson, Enrollment, Progress } from './model';
```

### Migration Impact

- **Files reduced:** 27 → 20 (26% reduction)
- **Import updates:** ~80 files
- **Consolidation:** 3 services → 1 unified service, educator/student components merged


## Feature 3: Student Profile

### Overview

The student profile feature handles comprehensive student data management, profile viewing/editing, and document handling. Currently the most complex feature with 63+ files and significant duplication.

### Current State Analysis

**Files:**
- 28 UI components (1 main + 7 sub-components + 12 tabs + 8 modals)
- 14 services (4 variants of student service + 10 specialized services)
- 20+ hooks (individual hooks for each data domain)
- 2 internal hooks (useStudentData, useStudentActions)

**Key Issues:**
- 4 different student service implementations (studentService, studentServiceProfile, studentServiceAdapted, studentServiceReal)
- 20+ individual hooks creating fragmented state management
- No clear domain organization
- Massive duplication in data fetching logic

### Target Structure

```
features/student-profile/
├── ui/
│   ├── StudentProfileDrawer.tsx      # Main drawer component
│   ├── components/                   # Reusable sub-components
│   │   ├── Badge.tsx
│   │   ├── CertificateCard.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── TabButton.tsx
│   │   └── index.ts
│   ├── tabs/                         # Profile tabs
│   │   ├── OverviewTab.tsx
│   │   ├── AcademicTab.tsx
│   │   ├── ProjectsTab.tsx
│   │   ├── CertificatesTab.tsx
│   │   ├── AssessmentsTab.tsx
│   │   ├── ExamResultsTab.tsx
│   │   ├── CoursesTab.tsx
│   │   ├── CurriculumTab.tsx
│   │   ├── DocumentsTab.tsx
│   │   ├── NotesTab.tsx
│   │   ├── ClubsCompetitionsTab.tsx
│   │   ├── EventsTab.tsx
│   │   └── index.ts
│   ├── modals/                       # Action modals
│   │   ├── AdmissionNoteModal.tsx
│   │   ├── ApprovalModal.tsx
│   │   ├── DocumentsModal.tsx
│   │   ├── ExportModal.tsx
│   │   ├── GraduationModal.tsx
│   │   ├── MessageModal.tsx
│   │   ├── PromotionModal.tsx
│   │   └── index.ts
│   └── index.ts
├── model/
│   ├── useStudentProfile.ts          # Main profile data (consolidates 5 hooks)
│   ├── useStudentAcademics.ts        # Academic data (consolidates 4 hooks)
│   ├── useStudentPortfolio.ts        # Projects, certs, trainings (consolidates 4 hooks)
│   ├── useStudentActivity.ts         # Learning, achievements, updates (consolidates 4 hooks)
│   ├── useStudentMessages.ts         # Messaging integration (consolidates 4 hooks)
│   ├── useStudentSettings.ts         # Settings and preferences
│   └── index.ts
├── api/
│   ├── studentProfileService.ts      # Unified service (consolidates 4 variants)
│   ├── studentDocumentService.ts     # Document operations
│   ├── studentManagementService.ts   # Admin operations
│   ├── studentEnrollmentService.ts   # Enrollment operations
│   ├── studentExamService.ts         # Exam operations
│   └── index.ts
├── lib/
│   ├── profileValidation.ts          # Validation rules
│   ├── profileCompletion.ts          # Completion checker
│   ├── profileExport.ts              # PDF export
│   └── index.ts
└── index.ts
```

### Consolidation Strategy

**Student Services (4 → 1):**
```typescript
// Before: 4 separate services
- studentService.js
- studentServiceProfile.js
- studentServiceAdapted.js
- studentServiceReal.js

// After: 1 unified service
// features/student-profile/api/studentProfileService.ts
export const studentProfileService = {
  // From studentService
  getStudentById,
  updateStudent,
  
  // From studentServiceProfile
  getProfileData,
  updateProfileSection,
  
  // From studentServiceAdapted
  getAdaptedData,
  
  // From studentServiceReal
  getRealTimeData,
  subscribeToUpdates
};
```

**Student Hooks (20+ → 6):**
```typescript
// Before: 20+ individual hooks
useStudentData, useStudentDataById, useStudentEducation, 
useStudentExperience, useStudentSkills, useStudentProjects,
useStudentTrainings, useStudentCertificates, useStudentSettings,
useStudentLearning, useStudentAchievements, useStudentRecentUpdates,
useStudentMessages, useStudentEducatorMessages, ...

// After: 6 domain hooks
useStudentProfile      // Basic profile, education, experience, skills
useStudentAcademics    // Academic records, curriculum, exams
useStudentPortfolio    // Projects, certificates, trainings
useStudentActivity     // Learning progress, achievements, updates
useStudentMessages     // All messaging variants
useStudentSettings     // Settings and preferences
```

### Public API

```typescript
// features/student-profile/index.ts
export { StudentProfileDrawer } from './ui';

export { 
  useStudentProfile,
  useStudentAcademics,
  useStudentPortfolio,
  useStudentActivity
} from './model';

export { 
  studentProfileService,
  studentDocumentService 
} from './api';

export type { 
  StudentProfile, 
  AcademicRecord, 
  Project, 
  Certificate 
} from './model';
```

### Migration Impact

- **Files reduced:** 63+ → 35 (44% reduction)
- **Import updates:** ~100 files
- **Consolidation:** 4 services → 1, 20+ hooks → 6


## Feature 4: Subscription

### Overview

The subscription feature handles subscription plans, payment processing, organization management, and license pooling. Currently the largest feature with 60+ files requiring domain-based organization.

### Current State Analysis

**Files:**
- 43 UI components (23 individual + 20 organization)
- 4 services (subscription, payment, razorpay, receipt)
- 5 hooks (subscription, organization, payment verification, plans, query)
- 6 pages (plans, my subscription, add-ons, success, failure, invitation)
- 2 utilities (helpers, routes)

**Key Issues:**
- Individual and organization subscriptions mixed together
- No clear separation between payment and subscription logic
- Pages should be moved to feature
- Large number of components without clear organization

### Target Structure

```
features/subscription/
├── ui/
│   ├── individual/                   # Individual subscription UI
│   │   ├── SubscriptionPlans.tsx    # Plan selection (from pages)
│   │   ├── SubscriptionDashboard.tsx
│   │   ├── SubscriptionDetails.tsx
│   │   ├── AddOnMarketplace.tsx
│   │   ├── AddOnCard.tsx
│   │   ├── BundleCard.tsx
│   │   ├── ReceiptCard.tsx
│   │   ├── TransactionList.tsx
│   │   ├── UpgradePrompt.tsx
│   │   └── index.ts
│   ├── organization/                 # Organization subscription UI
│   │   ├── OrganizationDashboard.tsx
│   │   ├── LicensePoolManager.tsx
│   │   ├── BulkPurchaseWizard.tsx
│   │   ├── InvitationManager.tsx
│   │   ├── MemberAssignments.tsx
│   │   ├── BillingDashboard.tsx
│   │   ├── CreatePoolModal.tsx
│   │   ├── EditPoolModal.tsx
│   │   ├── DeletePoolModal.tsx
│   │   ├── AssignToPoolModal.tsx
│   │   └── index.ts
│   ├── shared/                       # Shared subscription UI
│   │   ├── SubscriptionGate.tsx     # Feature gating
│   │   ├── SubscriptionProtectedRoute.tsx
│   │   ├── SubscriptionStatusWidget.tsx
│   │   ├── FeatureGate.tsx
│   │   ├── PaymentSuccess.tsx       # Success page (from pages)
│   │   ├── PaymentFailure.tsx       # Failure page (from pages)
│   │   └── index.ts
│   └── index.ts
├── model/
│   ├── useSubscription.ts            # Individual subscription state
│   ├── useOrganizationSubscription.ts # Organization subscription state
│   ├── usePaymentVerification.ts     # Payment verification
│   ├── useSubscriptionPlans.ts       # Plans data
│   └── index.ts
├── api/
│   ├── subscriptionService.ts        # Subscription CRUD
│   ├── paymentService.ts             # Payment operations
│   ├── razorpayService.ts            # Razorpay integration
│   ├── organizationService.ts        # Organization operations
│   ├── licensePoolService.ts         # License pool management
│   └── index.ts
├── lib/
│   ├── subscriptionHelpers.ts        # Helper functions
│   ├── pdfReceiptGenerator.ts        # Receipt generation
│   ├── featureGating.ts              # Feature access control
│   ├── subscriptionRoutes.ts         # Route definitions
│   └── index.ts
└── index.ts
```

### Domain Organization Strategy

**Separation by User Type:**
- **Individual:** Personal subscriptions, add-ons, receipts
- **Organization:** Bulk purchases, license pools, member management
- **Shared:** Feature gating, status widgets, payment flows

**Service Organization:**
```typescript
// Separate concerns
subscriptionService    // Subscription CRUD
paymentService        // Payment processing
razorpayService       // Gateway integration
organizationService   // Organization management
licensePoolService    // License allocation
```

### Public API

```typescript
// features/subscription/index.ts

// Individual subscription
export { 
  SubscriptionPlans,
  SubscriptionDashboard,
  AddOnMarketplace 
} from './ui/individual';

// Organization subscription
export { 
  OrganizationDashboard,
  LicensePoolManager,
  BulkPurchaseWizard 
} from './ui/organization';

// Shared components
export { 
  SubscriptionGate,
  SubscriptionProtectedRoute,
  FeatureGate 
} from './ui/shared';

// State management
export { 
  useSubscription,
  useOrganizationSubscription,
  usePaymentVerification 
} from './model';

// Services
export { 
  subscriptionService,
  paymentService 
} from './api';

// Types
export type { 
  Subscription,
  SubscriptionPlan,
  LicensePool,
  OrganizationSubscription 
} from './model';
```

### Migration Impact

- **Files reduced:** 60+ → 45 (25% reduction through organization)
- **Import updates:** ~120 files
- **Organization:** Clear separation of individual/organization/shared domains


## Cross-Feature Dependencies

### Identified Dependencies

**Messaging ← Auth:**
- Uses `useAuth` for current user context
- Imports from `features/auth/model`

**Courses ← Auth:**
- Uses `useAuth` for role-based rendering
- Imports from `features/auth/model`

**Student Profile ← Auth:**
- Uses `useAuth` for permission checks
- Imports from `features/auth/model`

**Student Profile ← Messaging:**
- MessageModal in profile drawer
- Should import from `features/messaging/ui`

**Student Profile ← Courses:**
- CoursesTab shows enrolled courses
- Should import from `features/courses/ui`

**Subscription ← Auth:**
- Uses `useAuth` for user identification
- Imports from `features/auth/model`

### Dependency Resolution

**Allowed:**
```typescript
// All features can import from auth
import { useAuth } from '@/features/auth';

// All features can import from shared
import { Button } from '@/shared/ui';
import { supabaseClient } from '@/shared/api';
```

**Not Allowed (requires refactoring):**
```typescript
// Student Profile importing from Messaging
import { MessageModal } from '@/features/messaging'; // ❌

// Solution: Extract to shared or use composition at page level
```

**Resolution Strategy:**
1. Keep auth imports (auth is foundational)
2. Extract shared components to `shared/ui` if used across features
3. Use composition at page level for complex cross-feature interactions
4. Document dependencies for future entity layer extraction

## Migration Workflow

### Phase 3 Execution Order

**Week 1: Messaging (Simplest)**
- Day 1-2: Create structure, migrate files
- Day 3: Consolidate modals
- Day 4: Update imports, test
- Day 5: Buffer/fixes

**Week 2: Courses (Moderate)**
- Day 1-2: Create structure, migrate files
- Day 3: Consolidate services and components
- Day 4: Organize recommendation engine
- Day 5: Update imports, test

**Week 3: Subscription (Complex - Organization)**
- Day 1-2: Create structure, organize by domain
- Day 3: Migrate individual subscription
- Day 4: Migrate organization subscription
- Day 5: Update imports, test

**Week 4: Student Profile (Most Complex - Consolidation)**
- Day 1-2: Create structure, migrate UI
- Day 3: Consolidate services (4 → 1)
- Day 4: Consolidate hooks (20+ → 6)
- Day 5: Update imports, test

### Validation Checkpoints

After each feature migration:
1. ✅ TypeScript compilation passes
2. ✅ All imports resolve correctly
3. ✅ Feature functionality works (manual testing)
4. ✅ No console errors
5. ✅ Public API documented

After Phase 3 complete:
1. ✅ Build process succeeds
2. ✅ Test suite passes
3. ✅ All four features functional
4. ✅ Import paths updated across codebase
5. ✅ Documentation complete

## Consolidation Patterns

### Pattern 1: Role-Specific Component Consolidation

**Before:**
```typescript
// 12 separate files
NewStudentConversationModal.tsx
NewEducatorConversationModal.tsx
NewAdminConversationModal.tsx
// ... 9 more
```

**After:**
```typescript
// 1 file with configuration
ConversationModal.tsx

interface ConversationModalProps {
  conversationType: ConversationType;
  // ... other props
}

const conversationConfigs = {
  'student-educator': { /* config */ },
  'admin-educator': { /* config */ },
  // ...
};
```

### Pattern 2: Service Consolidation

**Before:**
```typescript
// Multiple service files
studentService.js
studentServiceProfile.js
studentServiceAdapted.js
studentServiceReal.js
```

**After:**
```typescript
// Single unified service
export const studentProfileService = {
  // Combine all methods
  getById: () => {},
  getProfile: () => {},
  getAdapted: () => {},
  getRealTime: () => {},
  // ...
};
```

### Pattern 3: Hook Consolidation by Domain

**Before:**
```typescript
// 20+ individual hooks
useStudentData()
useStudentEducation()
useStudentExperience()
useStudentSkills()
// ... 16 more
```

**After:**
```typescript
// 6 domain hooks
useStudentProfile()    // Returns: data, education, experience, skills
useStudentAcademics()  // Returns: curriculum, exams, grades
useStudentPortfolio()  // Returns: projects, certificates, trainings
// ... 3 more
```

## Success Metrics

### Code Reduction
- **Messaging:** 18 → 8 files (56% reduction)
- **Courses:** 27 → 20 files (26% reduction)
- **Student Profile:** 63+ → 35 files (44% reduction)
- **Subscription:** 60+ → 45 files (25% reduction)
- **Total:** 168+ → 108 files (36% reduction)

### Import Updates
- **Estimated:** 350+ import statements across codebase
- **Files affected:** 200+ files

### Consolidation Achievements
- **Messaging modals:** 12 → 1 unified component
- **Student services:** 4 → 1 unified service
- **Student hooks:** 20+ → 6 domain hooks
- **Course services:** 3 → 1 unified service

### Quality Improvements
- Clear feature boundaries
- Reduced code duplication
- Improved discoverability
- Better maintainability
- Scalable patterns established

## Risk Mitigation

### High-Risk Areas

1. **Student Profile Consolidation**
   - Risk: Breaking existing functionality during hook consolidation
   - Mitigation: Thorough testing, maintain backward compatibility temporarily

2. **Payment Integration**
   - Risk: Breaking Razorpay integration
   - Mitigation: Careful service migration, test payment flows extensively

3. **Real-Time Messaging**
   - Risk: Breaking Supabase real-time subscriptions
   - Mitigation: Test real-time functionality, verify subscriptions work

4. **Course Recommendation Engine**
   - Risk: Breaking AI/ML functionality
   - Mitigation: Migrate as complete submodule, test recommendations

### Rollback Strategy

- Preserve all original files during migration
- Support both old and new import paths
- Feature flags for gradual rollout
- Git branches for each feature migration
- Comprehensive testing before removing old structure

## Next Steps

After Phase 3 completion:
1. Document consolidation patterns for Phase 4
2. Identify entity extraction opportunities
3. Plan Phase 4 (role-specific features)
4. Update team documentation
5. Conduct retrospective on consolidation approach
