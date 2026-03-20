# Feature-Sliced Design (FSD) Migration

## Overview

This document tracks the overall progress of migrating the codebase to Feature-Sliced Design (FSD) architecture. The migration is divided into 5 phases, each building upon the previous phase to systematically transform the flat file structure into a well-organized, feature-based architecture.

## Migration Phases

### ✅ Phase 1: Foundation (COMPLETED)
**Status**: COMPLETED  
**Spec**: `.kiro/specs/fsd-phase-1-foundation/`  
**Description**: Create shared layer structure and migrate infrastructure components  
**Key Achievements**:
- Created FSD folder structure
- Migrated shared UI components (components/ui/ → shared/ui/)
- Migrated base API client (lib/supabaseClient → shared/api/)
- Migrated configuration files (config/ → shared/config/)
- Migrated generic utilities and hooks
- Updated import paths across codebase
- Validated TypeScript compilation and application functionality

### ✅ Phase 2: Auth Feature (COMPLETED)
**Status**: COMPLETED  
**Spec**: `.kiro/specs/fsd-phase-2-auth-feature/`  
**Description**: Create auth feature structure and migrate authentication-related code  
**Key Achievements**:
- Created features/auth/ structure with ui/, api/, model/, lib/ subdirectories
- Migrated auth UI components (pages/auth/ → features/auth/ui/)
- Migrated auth services (services/auth* → features/auth/api/)
- Migrated AuthContext and useAuth (context/ → features/auth/model/)
- Migrated auth utilities (utils/auth* → features/auth/lib/)
- Updated import paths across codebase
- Validated auth flows and application functionality

### ✅ Phase 3: High-Impact Features (COMPLETED)
**Status**: COMPLETED  
**Spec**: `.kiro/specs/fsd-phase-3-high-impact/`  
**Description**: Create and migrate four major features: Messaging, Courses, Student Profile, and Subscription  
**Key Achievements**:
- **Messaging Feature**: Migrated messaging components, services, and state management with modal consolidation
- **Courses Feature**: Migrated course components, services, recommendation engine, and state management
- **Student Profile Feature**: Migrated profile drawer, tabs, modals with extensive service and hook consolidation
- **Subscription Feature**: Migrated individual, organization, and shared subscription components with payment integration
- Handled cross-feature dependencies and validated build process
- Achieved significant file reduction through consolidation

### ✅ Phase 4: Critical Cleanup (COMPLETED)
**Status**: COMPLETED  
**Spec**: `.kiro/specs/fsd-phase-4-critical-cleanup/`  
**Description**: Complete Context API → Zustand migration and eliminate legacy patterns  
**Key Achievements**:
- Completed Context API elimination (zero remaining @/context/ imports)
- Migrated 25+ files from useAuth() pattern to granular Zustand hooks
- Updated educator pages, other role pages, and hooks
- Validated complete elimination of legacy Context API patterns
- Established consistent state management patterns across codebase

### ✅ Phase 5: Service API Migration (COMPLETED)
**Status**: COMPLETED  
**Spec**: `.kiro/specs/fsd-phase-5-service-api-migration/`  
**Description**: Migrate API functions from centralized /services/ to feature-specific /api/ directories  
**Key Achievements**:
- Built comprehensive migration infrastructure with analysis tools
- Implemented API discovery and cataloging system
- Created feature mapping and classification system
- Migrated API functions to appropriate feature directories
- Integrated APIs with existing Zustand stores
- Standardized API patterns and naming conventions
- Implemented validation, rollback, and error handling systems
- Generated comprehensive migration documentation

## Overall Migration Statistics

**Total Files Migrated**: 200+ files across all phases  
**Import Updates**: 1000+ import statements updated  
**File Reduction**: ~35% reduction through consolidation  
**Features Created**: 6 features (auth, messaging, courses, student-profile, subscription, plus shared layer)  

## Architecture Compliance

- ✅ FSD layer structure implemented (shared/, features/)
- ✅ Feature isolation maintained (no direct feature-to-feature dependencies)
- ✅ Consistent public APIs 
**Purpose:** Route-level pages that compose widgets and features (thin layer)

**Structure:** Keep existing page structure but simplify to composition only
```
pages/
├── auth/
│   ├── LoginPage.tsx          # Composes features/auth/ui components
│   ├── SignupPage.tsx
│   └── index.ts
├── student/
│   ├── DashboardPage.tsx      # Composes widgets/student-dashboard
│   ├── ProfilePage.tsx
│   └── index.ts
├── educator/
├── recruiter/
└── admin/
```

**Migration Tasks:**
- [ ] Keep page files in place initially
- [ ] Refactor pages to import from features/widgets after migration
- [ ] Remove business logic from pages (move to features)
- [ ] Pages should only handle routing and composition

---

### 3. Widgets Layer (`src/widgets/`)

**Purpose:** Large composite UI blocks that combine multiple features

**Structure:**
```
widgets/
├── student-dashboard/
│   ├── ui/
│   │   ├── StudentDashboard.tsx
│   │   ├── DashboardStats.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── useDashboardData.ts
│   │   └── index.ts
│   └── index.ts
│
├── educator-dashboard/
├── recruiter-pipeline/
├── assessment-player/
├── course-player/
└── admin-analytics/
```

**Migration Tasks:**
- [ ] Identify large composite components from `components/`
- [ ] Create widget folders with ui/model structure
- [ ] Move dashboard components → respective widget folders
- [ ] Create public API via index.ts files

---

### 4. Features Layer (`src/features/`)

**Purpose:** Business features with user interactions (main migration target)

#### 4.1 Auth Feature (`features/auth/`)

**Current Files:**
- `pages/auth/*` (UI components)
- `services/authService.js`, `services/unifiedAuthService.ts`
- `services/otpService.ts`, `services/passwordResetService.ts`
- `hooks/useAuth.js`
- `context/AuthContext.jsx`
- `utils/authCleanup.js`, `utils/authErrorHandler.js`

**Target Structure:**
```
features/auth/
├── ui/
│   ├── UnifiedLogin.tsx
│   ├── UnifiedSignup.tsx
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   ├── OTPInput.tsx
│   └── index.ts
├── model/
│   ├── useAuth.ts
│   ├── AuthContext.tsx
│   ├── authStore.ts (if needed)
│   └── index.ts
├── api/
│   ├── authService.ts
│   ├── unifiedAuthService.ts
│   ├── otpService.ts
│   ├── passwordResetService.ts
│   └── index.ts
├── lib/
│   ├── validation.ts
│   ├── tokenMonitor.ts
│   ├── authCleanup.ts
│   ├── authErrorHandler.ts
│   └── index.ts
└── index.ts (public API)
```

**Migration Tasks:**
- [x] Create `features/auth/` folder structure
- [x] Move UI components from `pages/auth/` → `features/auth/ui/` (14 components)
- [x] Move auth services → `features/auth/api/` (9 services)
- [x] Move `useAuth` hook → `features/auth/model/` (2 files)
- [x] Move auth utilities → `features/auth/lib/` (4 utilities)
- [x] Create index.ts files for public API (5 index files)
- [x] Update all imports across codebase (150+ imports)
- [x] Test auth flows (login, signup, password reset)

#### 4.2 Assessment Feature (`features/assessment/`)

**Status:** ✅ Already well-structured! Minimal changes needed.

**Current Structure:** `features/assessment/` exists with good separation

**Migration Tasks:**
- [ ] Review existing structure for FSD compliance
- [ ] Ensure public API via index.ts
- [ ] Verify no cross-feature imports
- [ ] Add missing index.ts files if needed

#### 4.3 Messaging Feature (`features/messaging/`)

**Current Files:**
- `components/messaging/*` (12+ modal components)
- `services/messageService.ts`
- `hooks/useMessages.ts`, `hooks/useMessageNotifications.tsx`
- `stores/useMessageStore.ts`

**Target Structure:**
```
features/messaging/
├── ui/
│   ├── ChatWindow.tsx
│   ├── MessageModal.tsx
│   ├── ConversationList.tsx
│   ├── NewConversationModal.tsx
│   └── index.ts
├── model/
│   ├── useMessages.ts
│   ├── useMessageNotifications.ts
│   ├── useTypingIndicator.ts
│   ├── messageStore.ts
│   └── index.ts
├── api/
│   ├── messageService.ts
│   └── index.ts
└── index.ts
```

**Migration Tasks:**
- [ ] Create `features/messaging/` structure
- [ ] Consolidate 12+ message modals into reusable components
- [ ] Move message services → `features/messaging/api/`
- [ ] Move message hooks → `features/messaging/model/`
- [ ] Update imports
- [ ] Test messaging across all user roles

#### 4.4 Courses Feature (`features/courses/`)

**Current Files:**
- `components/educator/courses/*`
- `components/student/courses/*`
- `services/courseApiService.ts`, `services/courseProgressService.js`
- `services/courseEnrollmentService.js`
- `hooks/useCoursePerformance.ts`

**Target Structure:**
```
features/courses/
├── ui/
│   ├── CourseCard.tsx
│   ├── CourseDetailModal.tsx
│   ├── CoursePlayer.tsx
│   ├── CourseFilters.tsx
│   ├── CreateCourseModal.tsx
│   └── index.ts
├── model/
│   ├── useCourses.ts
│   ├── useCourseEnrollment.ts
│   ├── useCourseProgress.ts
│   └── index.ts
├── api/
│   ├── courseApiService.ts
│   ├── courseProgressService.ts
│   ├── courseEnrollmentService.ts
│   └── index.ts
├── lib/
│   ├── courseValidation.ts
│   └── index.ts
└── index.ts
```

**Migration Tasks:**
- [ ] Create `features/courses/` structure
- [ ] Merge educator/student course components
- [ ] Move course services → `features/courses/api/`
- [ ] Move course hooks → `features/courses/model/`
- [ ] Update imports
- [ ] Test course enrollment, progress tracking

#### 4.5 Student Profile Feature (`features/student-profile/`)

**Current Files:**
- `components/shared/StudentProfileDrawer/*`
- `services/studentService.js`, `services/studentServiceProfile.js`
- `hooks/useStudentData.js`, `hooks/useStudentDataById.js`
- Multiple student-related hooks (20+)

**Target Structure:**
```
features/student-profile/
├── ui/
│   ├── StudentProfileDrawer.tsx
│   ├── ProfileEditModal.tsx
│   ├── ProfileSections/
│   │   ├── OverviewTab.tsx
│   │   ├── AcademicTab.tsx
│   │   ├── ProjectsTab.tsx
│   │   └── index.ts
│   └── index.ts
├── model/
│   ├── useStudentProfile.ts
│   ├── useStudentData.ts
│   ├── useProfileCompletion.ts
│   └── index.ts
├── api/
│   ├── studentProfileService.ts
│   └── index.ts
├── lib/
│   ├── profileValidation.ts
│   ├── profileCompletenessChecker.ts
│   └── index.ts
└── index.ts
```

**Migration Tasks:**
- [ ] Create `features/student-profile/` structure
- [ ] Move StudentProfileDrawer → `features/student-profile/ui/`
- [ ] Consolidate student hooks → `features/student-profile/model/`
- [ ] Move student services → `features/student-profile/api/`
- [ ] Update imports
- [ ] Test profile viewing/editing

#### 4.6 Subscription Feature (`features/subscription/`)

**Current Files:**
- `components/Subscription/*`
- `services/Subscriptions/*`
- `hooks/Subscription/*`
- `pages/subscription/*`

**Target Structure:**
```
features/subscription/
├── ui/
│   ├── SubscriptionPlans.tsx
│   ├── SubscriptionDashboard.tsx
│   ├── CheckoutModal.tsx
│   ├── ReceiptCard.tsx
│   ├── organization/
│   │   ├── OrganizationDashboard.tsx
│   │   ├── LicensePoolManager.tsx
│   │   └── index.ts
│   └── index.ts
├── model/
│   ├── useSubscription.ts
│   ├── useOrganizationSubscription.ts
│   ├── usePaymentVerification.ts
│   └── index.ts
├── api/
│   ├── subscriptionService.ts
│   ├── paymentService.ts
│   ├── razorpayService.ts
│   └── index.ts
├── lib/
│   ├── subscriptionHelpers.ts
│   ├── pdfReceiptGenerator.ts
│   └── index.ts
└── index.ts
```

**Migration Tasks:**
- [ ] Create `features/subscription/` structure
- [ ] Move subscription components → `features/subscription/ui/`
- [ ] Move subscription services → `features/subscription/api/`
- [ ] Move subscription hooks → `features/subscription/model/`
- [ ] Update imports
- [ ] Test payment flows

#### 4.7 Opportunities Feature (`features/opportunities/`)

**Current Files:**
- `components/JobRecommendations.tsx`
- `services/opportunitiesService.ts`, `services/aiJobMatchingService.js`
- `hooks/useOpportunities.js`, `hooks/useAIJobMatching.js`

**Target Structure:**
```
features/opportunities/
├── ui/
│   ├── OpportunityCard.tsx
│   ├── OpportunityList.tsx
│   ├── JobFilters.tsx
│   └── index.ts
├── model/
│   ├── useOpportunities.ts
│   ├── useAIJobMatching.ts
│   └── index.ts
├── api/
│   ├── opportunitiesService.ts
│   ├── aiJobMatchingService.ts
│   └── index.ts
└── index.ts
```

**Migration Tasks:**
- [ ] Create `features/opportunities/` structure
- [ ] Move job components → `features/opportunities/ui/`
- [ ] Move opportunity services → `features/opportunities/api/`
- [ ] Move opportunity hooks → `features/opportunities/model/`
- [ ] Update imports

#### 4.8 College Admin Feature (`features/college-admin/`)

**Current Files:**
- `components/admin/collegeAdmin/*` (20+ components)
- `services/college/*` (15+ services)
- `pages/admin/collegeAdmin/*` (40+ pages)

**Target Structure:**
```
features/college-admin/
├── ui/
│   ├── departments/
│   ├── students/
│   ├── faculty/
│   ├── curriculum/
│   ├── exams/
│   └── index.ts
├── model/
│   ├── useDepartments.ts
│   ├── useStudentManagement.ts
│   └── index.ts
├── api/
│   ├── departmentService.ts
│   ├── studentAdmissionService.ts
│   ├── curriculumService.ts
│   └── index.ts
└── index.ts
```

**Migration Tasks:**
- [ ] Create `features/college-admin/` structure
- [ ] Group related admin components by subdomain
- [ ] Move college services → `features/college-admin/api/`
- [ ] Create hooks for admin operations
- [ ] Update imports

#### 4.9 Digital Portfolio Feature (`features/digital-portfolio/`)

**Current Files:**
- `components/digital-pp/*`
- `pages/digital-pp/*`
- `services/portfolioService.js`

**Target Structure:**
```
features/digital-portfolio/
├── ui/
│   ├── passport/
│   ├── portfolio/
│   ├── layouts/
│   └── index.ts
├── model/
│   ├── usePortfolio.ts
│   └── index.ts
├── api/
│   ├── portfolioService.ts
│   └── index.ts
└── index.ts
```

**Migration Tasks:**
- [ ] Create `features/digital-portfolio/` structure
- [ ] Move portfolio components → `features/digital-portfolio/ui/`
- [ ] Move portfolio service → `features/digital-portfolio/api/`
- [ ] Update imports

#### 4.10 Exams Feature (`features/exams/`)

**Status:** ✅ Already well-structured!

**Migration Tasks:**
- [ ] Review for FSD compliance
- [ ] Add missing index.ts files

#### 4.11 AI Tutor Feature (`features/ai-tutor/`)

**Current Files:**
- `components/ai-tutor/*`
- `services/tutorService.ts`
- `hooks/useTutorChat.ts`

**Target Structure:**
```
features/ai-tutor/
├── ui/
│   ├── AITutorPanel.tsx
│   ├── AITutorChat.tsx
│   ├── VideoSummarizer.tsx
│   └── index.ts
├── model/
│   ├── useTutorChat.ts
│   └── index.ts
├── api/
│   ├── tutorService.ts
│   └── index.ts
└── index.ts
```

**Migration Tasks:**
- [ ] Create `features/ai-tutor/` structure
- [ ] Move AI tutor components → `features/ai-tutor/ui/`
- [ ] Move tutor service → `features/ai-tutor/api/`
- [ ] Update imports

#### 4.12 Counselling Feature (`features/counselling/`)

**Current Files:**
- `components/counselling/*`
- `services/aiCounsellingService.ts`
- `hooks/useCounsellingChat.ts`

**Target Structure:**
```
features/counselling/
├── ui/
│   ├── ChatWindow.tsx
│   ├── SessionList.tsx
│   ├── TopicSelector.tsx
│   └── index.ts
├── model/
│   ├── useCounsellingChat.ts
│   ├── counsellingStore.ts
│   └── index.ts
├── api/
│   ├── counsellingService.ts
│   └── index.ts
└── index.ts
```

**Migration Tasks:**
- [ ] Create `features/counselling/` structure
- [ ] Move counselling components → `features/counselling/ui/`
- [ ] Move counselling service → `features/counselling/api/`
- [ ] Update imports

---

### 5. Entities Layer (`src/entities/`)

**Purpose:** Business entities representing domain objects

**Structure:**
```
entities/
├── user/
│   ├── ui/
│   │   ├── UserAvatar.tsx
│   │   ├── UserCard.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   ├── userSchema.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── userApiService.ts
│   │   └── index.ts
│   └── index.ts
│
├── student/
│   ├── ui/
│   │   ├── StudentCard.tsx
│   │   ├── StudentBadge.tsx
│   │   └── index.ts
│   ├── model/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── studentType.ts
│   │   └── index.ts
│   └── index.ts
│
├── course/
├── job/
├── assessment/
├── organization/
└── educator/
```

**Migration Tasks:**
- [ ] Identify reusable entity components
- [ ] Extract entity types from features
- [ ] Create entity UI components (cards, badges)
- [ ] Move entity-specific utilities
- [ ] Create public APIs

---

### 6. Shared Layer (`src/shared/`)

**Purpose:** Reusable infrastructure, UI kit, utilities

**Structure:**
```
shared/
├── ui/
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Loader.tsx
│   └── index.ts
│
├── lib/
│   ├── hooks/
│   │   ├── useToast.ts
│   │   ├── useDebounce.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── index.ts
│   └── index.ts
│
├── api/
│   ├── supabaseClient.ts
│   ├── apiClient.ts
│   └── index.ts
│
├── config/
│   ├── constants.ts
│   ├── env.ts
│   └── index.ts
│
└── types/
    ├── common.ts
    └── index.ts
```

**Migration Tasks:**
- [x] Move `src/components/ui/*` → `shared/ui/` (15 components)
- [x] Move `lib/supabaseClient.ts` → `shared/api/` (1 client)
- [x] Move `config/*` → `shared/config/` (9 config files)
- [x] Move generic utilities → `shared/lib/utils/` (7 utilities)
- [x] Move generic hooks → `shared/lib/hooks/` (2 hooks)
- [x] Move shared types → `shared/types/` (2 type files)
- [x] Create index.ts files (9 public API files)
- [x] **BONUS:** Migrated `shared/chat-ui/` (8 files)

---

## Migration Strategy

### Phase 1: Foundation (Week 1) ✅ COMPLETED
**Goal:** Set up FSD structure and migrate shared infrastructure

**Tasks:**
1. ✅ Create FSD folder structure
2. ✅ Migrate `shared/` layer:
   - [x] `shared/ui/` ← `components/ui/` (15 components migrated)
   - [x] `shared/api/` ← `lib/supabaseClient.ts` (1 client migrated)
   - [x] `shared/config/` ← `config/` (9 config files migrated)
   - [x] `shared/lib/` ← generic utilities (7 utilities + 2 hooks migrated)
   - [x] `shared/types/` ← shared types (2 type files created)
   - [x] **BONUS:** `shared/chat-ui/` ← chat UI components (8 files migrated)
3. ✅ Create index.ts files for public APIs (9 index files created)
4. ✅ Update imports in existing code (200+ imports updated)
5. ✅ Test that app still works (all pages render successfully)

**Success Criteria:**
- ✅ All shared components accessible via `shared/ui`
- ✅ Supabase client accessible via `shared/api`
- ✅ No broken imports
- ✅ App runs without errors

**Migration Report:** See `.kiro/specs/fsd-phase-1-foundation/MIGRATION_REPORT.md` for detailed statistics

### Phase 2: Auth Feature (Week 1-2) ✅ COMPLETED
**Goal:** Migrate authentication feature as a template

**Tasks:**
1. ✅ Create `features/auth/` structure
2. ✅ Move auth UI components (14 components migrated)
3. ✅ Move auth services (9 services migrated)
4. ✅ Move auth hooks and context (2 files migrated)
5. ✅ Move auth utilities (4 utilities migrated)
6. ✅ Create public API (5 index files created)
7. ✅ Update all auth imports across codebase (150+ imports updated)
8. ✅ Test all auth flows

**Success Criteria:**
- ✅ Login/signup works
- ✅ Password reset works
- ✅ OTP verification works
- ✅ Token refresh works
- ✅ All auth imports use `features/auth`

**Migration Report:** See `.kiro/specs/fsd-phase-2-auth-feature/MIGRATION_REPORT.md` for detailed statistics

### Phase 3: High-Impact Features (Week 2-4) ✅ COMPLETED
**Goal:** Migrate frequently-used features

**Priority Order:**
1. ✅ `features/messaging/` (used by all roles)
2. ✅ `features/courses/` (core functionality)
3. ✅ `features/student-profile/` (heavily used)
4. ✅ `features/subscription/` (business critical)

**Tasks per feature:**
- ✅ Create feature structure
- ✅ Move UI components
- ✅ Move services
- ✅ Move hooks
- ✅ Move utilities
- ✅ Create public API
- ✅ Update imports
- ✅ Consolidate duplicate code

**Migration Results:**
- ✅ Messaging: 18 → 8 files (56% reduction)
- ✅ Courses: 27 → 20 files (26% reduction)
- ✅ Student Profile: 63+ → 35 files (44% reduction)
- ✅ Subscription: 60+ → 45 files (25% reduction)
- ✅ ~350+ import statements updated across codebase
- ✅ All features accessible via public APIs

### Phase 4: Role-Specific Features (Week 4-8)
**Goal:** Migrate admin and role-specific features

**Features:**
1. `features/college-admin/`
2. `features/school-admin/`
3. `features/recruiter-pipeline/`
4. `features/opportunities/`
5. `features/digital-portfolio/`
6. `features/ai-tutor/`
7. `features/counselling/`

### Phase 5: Entities & Widgets (Week 8-9)
**Goal:** Extract reusable entities and create widgets

**Tasks:**
1. Identify entity components
2. Create `entities/` structure
3. Move entity components
4. Create `widgets/` for dashboards
5. Update imports

### Phase 6: Cleanup & Optimization (Week 9-10)
**Goal:** Remove old structure and optimize

**Tasks:**
1. Delete old `components/` folder
2. Delete old `services/` folder
3. Delete old `hooks/` folder
4. Update documentation
5. Run full test suite
6. Performance audit
7. Code review

---

## Implementation Guidelines

### Public API Pattern

Every feature/entity/shared module must export via `index.ts`:

```typescript
// features/auth/index.ts
export { UnifiedLogin, UnifiedSignup } from './ui';
export { useAuth, AuthContext } from './model';
export { authService } from './api';
```

### Import Rules

✅ **Allowed:**
```typescript
// Page importing from feature
import { UnifiedLogin } from '@/features/auth';

// Feature importing from entity
import { StudentCard } from '@/entities/student';

// Feature importing from shared
import { Button } from '@/shared/ui';
```

❌ **Not Allowed:**
```typescript
// Feature importing from another feature
import { CourseCard } from '@/features/courses'; // ❌

// Lower layer importing from higher layer
import { Dashboard } from '@/pages/student'; // ❌

// Direct internal imports (bypass public API)
import { authService } from '@/features/auth/api/authService'; // ❌
```

### File Naming Conventions

- Components: PascalCase (`StudentCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Services: camelCase with `Service` suffix (`authService.ts`)
- Utils: camelCase (`formatters.ts`)
- Types: camelCase or PascalCase (`types.ts`, `Student.ts`)
- Index files: `index.ts` (public API)

### Testing Strategy

After each feature migration:
1. Run unit tests for that feature
2. Run integration tests
3. Manual testing of feature flows
4. Check for console errors
5. Verify no broken imports

---

## Rollback Plan

If migration causes critical issues:

1. **Git branches:** Each phase in separate branch
2. **Feature flags:** Toggle between old/new structure
3. **Parallel structure:** Keep old structure until migration complete
4. **Incremental rollout:** Migrate one feature at a time

---

## Success Metrics

### Code Organization
- [ ] All 535+ components organized into features/entities/shared
- [ ] No circular dependencies
- [ ] Clear import hierarchy
- [ ] Public APIs for all modules

### Developer Experience
- [ ] Faster file discovery (< 10 seconds to find any component)
- [ ] Clear feature boundaries
- [ ] Easier onboarding for new developers
- [ ] Reduced merge conflicts

### Performance
- [ ] No performance regression
- [ ] Bundle size unchanged or reduced
- [ ] Build time unchanged or faster

### Quality
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] All features working as before

---

## Resources

- [Feature-Sliced Design Documentation](https://feature-sliced.design/)
- [FSD Examples](https://github.com/feature-sliced/examples)
- Project-specific migration guide (this document)

---

## Notes

- **Already FSD-compliant features:** `assessment/`, `career-assistant/`, `educator-copilot/`, `recruiter-copilot/`, `exams/`
- **Largest migration:** `components/` folder (535 files)
- **Most complex:** College admin features (40+ pages, 20+ components)
- **Business critical:** Auth, subscription, courses, messaging

---

## Timeline Summary

| Phase | Duration | Focus | Status |
|-------|----------|-------|--------|
| Phase 1 | Week 1 | Foundation & Shared | ✅ COMPLETED |
| Phase 2 | Week 1-2 | Auth Feature | ✅ COMPLETED |
| Phase 3 | Week 2-4 | High-Impact Features | ✅ COMPLETED |
| Phase 4 | Week 4-8 | Role-Specific Features | 🔜 Next |
| Phase 5 | Week 8-9 | Entities & Widgets | ⏳ Pending |
| Phase 6 | Week 9-10 | Cleanup & Optimization | ⏳ Pending |

**Total Estimated Time:** 10 weeks  
**Completed:** Phase 1 (44 files migrated) + Phase 2 (29 files migrated) + Phase 3 (108 files migrated) = 181 files total

---

## Getting Started

1. Review this specification thoroughly
2. Set up git branch: `git checkout -b fsd-migration-phase-1`
3. Start with Phase 1: Foundation
4. Follow the checklist for each phase
5. Test thoroughly after each migration
6. Document any deviations or issues
7. Request code review before merging

---

*This specification should be treated as a living document. Update it as you discover new patterns or challenges during migration.*
