# FSD Architecture Naming Convention Violations Analysis

**Project**: SkillPassport  
**Analysis Date**: 2026-04-23  
**Architecture**: Feature-Sliced Design (FSD)

---

## Executive Summary

This document identifies naming convention violations in the codebase that deviate from Feature-Sliced Design (FSD) architecture principles. The analysis covers segment naming, file naming conventions, layer violations, and organizational structure issues.

### Impact Overview

**Scope of Changes Required**:
- **Directories to restructure**: ~35-40 directories
- **Files to move/rename**: ~800-1,000 files
- **Import statements to update**: ~2,000-3,000 imports (estimated)
- **Affected layers**: All layers (app, pages, features, entities, shared, widgets)

**Breakdown by Category**:
- Root-level violations: 6 files
- Segment naming violations: 15 directories
- File naming inconsistencies: 27 files (shared/ui) + 700+ files (features/widgets)
- Layer violations: 4 directories with ~50 files
- Deep nesting issues: 10+ directory structures

---

## 1. CRITICAL: Root-Level Violations

### `src/stores/` Directory at Root Level

**Violation**: Stores should be in the `model` segment within appropriate layers (features/entities/shared), not at the root level.

**Location**: `src/stores/`

**Files Affected**:
- `src/stores/assessmentStore.ts`
- `src/stores/authStore.ts`
- `src/stores/careerAssistantStore.ts`
- `src/stores/counsellingStore.ts`
- `src/stores/globalPresenceStore.ts`
- `src/stores/index.ts`

**Recommendation**: 
- Migrate to `src/shared/model/stores/` for global stores
- Or distribute to appropriate feature/entity model segments for domain-specific stores

---

## 2. Segment Naming Violations

### 2.1 "components" Instead of "ui"

FSD requires the `ui` segment name, not `components`.

#### Root-Level Component Directories

| Current Path | Should Be | Notes |
|-------------|-----------|-------|
| `src/app/components/` | `src/app/ui/` | App layer component |
| `src/pages/auth/components/` | `src/pages/auth/ui/` or move to features | Auth components |
| `src/pages/admin/collegeAdmin/components/` | Move to `src/features/college-admin/ui/` | Business logic in pages |
| `src/pages/admin/schoolAdmin/components/` | Move to `src/features/school-admin/ui/` | Business logic in pages |
| `src/shared/chat-ui/components/` | `src/shared/chat-ui/ui/` | Shared chat components |

#### Nested Component Directories Within UI Segments

**Violation**: Having `components/` subdirectories within `ui/` segments creates redundancy.

| Current Path | Issue | Recommendation |
|-------------|-------|----------------|
| `src/features/college-admin/ui/components/` | Redundant nesting | Flatten to `src/features/college-admin/ui/` |
| `src/features/college-admin/ui/events/components/` | Redundant nesting | Flatten to `src/features/college-admin/ui/events/` |
| `src/features/college-admin/ui/finance/components/` | Redundant nesting | Flatten to `src/features/college-admin/ui/finance/` |
| `src/features/school-admin/ui/components/` | Redundant nesting | Flatten to `src/features/school-admin/ui/` |
| `src/features/school-admin/ui/finance/components/` | Redundant nesting | Flatten to `src/features/school-admin/ui/finance/` |
| `src/features/learner-profile/ui/learnerProfileDrawer/components/` | Redundant nesting | Flatten to `ui/learnerProfileDrawer/` |
| `src/entities/learner/ui/learnerProfileDrawer/components/` | Redundant nesting | Flatten to `ui/learnerProfileDrawer/` |
| `src/app/providers/tour-wrapper/ui/components/` | Redundant nesting | Flatten to `ui/` |
| `src/features/college-admin/ui/components/Timetable/components/` | Double nesting | Flatten structure |
| `src/pages/admin/collegeAdmin/components/Timetable/components/` | Double nesting | Move to features layer |

---

### 2.2 "hooks" as Separate Segment

**Violation**: FSD requires hooks to be in the `lib` segment, not as a separate top-level segment.

| Current Path | Should Be |
|-------------|-----------|
| `src/features/career-assistant/hooks/` | `src/features/career-assistant/lib/hooks/` |
| `src/shared/chat-ui/hooks/` | `src/shared/chat-ui/lib/hooks/` |
| `src/features/college-admin/ui/components/Timetable/hooks/` | `src/features/college-admin/lib/hooks/` |
| `src/features/college-admin/ui/events/hooks/` | `src/features/college-admin/lib/hooks/` |
| `src/features/college-admin/ui/finance/hooks/` | `src/features/college-admin/lib/hooks/` |
| `src/features/school-admin/ui/finance/hooks/` | `src/features/school-admin/lib/hooks/` |
| `src/features/learner-profile/ui/hooks/` | `src/features/learner-profile/lib/hooks/` |
| `src/features/learner-profile/ui/learnerProfileDrawer/hooks/` | `src/features/learner-profile/lib/hooks/` |
| `src/entities/learner/ui/learnerProfileDrawer/hooks/` | `src/entities/learner/lib/hooks/` |

**Correctly Placed** ✓:
- `src/shared/lib/hooks/` - This is the correct FSD pattern

**Files in Violation**:
- `src/features/career-assistant/hooks/useAIFeedback.ts`
- `src/features/career-assistant/hooks/useCareerConversations.ts`
- `src/features/career-assistant/hooks/useConversationSwitcher.ts`
- `src/features/career-assistant/hooks/useOptimizedMessages.ts`
- `src/features/career-assistant/hooks/useSmartScroll.ts`
- `src/features/career-assistant/hooks/useVirtualMessage.ts`

---

### 2.3 "utils" Instead of "lib"

**Violation**: Utility functions should be in the `lib` segment.

| Current Path | Should Be | Notes |
|-------------|-----------|-------|
| `src/features/college-admin/ui/finance/utils/` | `src/features/college-admin/lib/utils/` | Also shouldn't be nested in ui |
| `src/__tests__/integration/utils/` | Acceptable | Test utilities are exempt |

**Correctly Placed** ✓:
- `src/shared/lib/utils/` - This is the correct FSD pattern

---

### 2.4 "services" Instead of "api"

**Violation**: Service files should be in the `api` segment.

| Current Path | Should Be | Notes |
|-------------|-----------|-------|
| `src/features/college-admin/ui/finance/services/` | `src/features/college-admin/api/` | Also shouldn't be nested in ui |
| `src/__tests__/services/` | Acceptable | Test files are exempt |

---

### 2.5 "types" Placement

**Violation**: Types should be in the `model` segment, not in `ui`.

| Current Path | Should Be |
|-------------|-----------|
| `src/entities/learner/ui/learnerProfileDrawer/types/` | `src/entities/learner/model/types/` |
| `src/features/learner-profile/ui/learnerProfileDrawer/types/` | `src/features/learner-profile/model/types/` |

**Acceptable Patterns**:
- `src/shared/types/` - Acceptable, though `src/shared/model/types/` would be more explicit
- `src/shared/chat-ui/types/` - Acceptable for scoped types

---

### 2.6 "stores" Subdirectory Redundancy

**Issue**: Having a `stores/` subdirectory within `model/` is redundant.

| Current Path | Recommendation |
|-------------|----------------|
| `src/shared/model/stores/` | Files should be directly in `src/shared/model/` |

**Files Affected**:
- `src/shared/model/stores/index.ts`
- `src/shared/model/stores/searchStore.ts`
- `src/shared/model/stores/themeStore.ts`
- `src/shared/model/stores/tourStore.ts`

**Note**: These files are duplicated at `src/shared/model/` level, creating confusion.

---

### 2.7 "config" Placement

**Status**: Generally correct ✓

Config directories are acceptable in multiple locations:
- `src/app/config/` ✓
- `src/shared/config/` ✓
- `src/shared/lib/config/` ✓ (acceptable duplication for scoped configs)
- `src/widgets/learner-dashboard/config/` ✓
- Feature-level configs in `lib/config/` ✓

---

## 3. File Naming Convention Violations

FSD recommends **kebab-case** for files. While **PascalCase is acceptable for React components**, consistency within the project is critical.

### 3.1 Inconsistent Naming in `src/shared/ui/`

**Issue**: Mix of kebab-case and PascalCase files.

**Kebab-case files** (majority pattern):
- `alert-dialog.jsx`
- `dropdown-menu.jsx`
- `input-otp.jsx`
- `radio-group.jsx`
- `scroll-area.jsx`
- etc.

**PascalCase files** (inconsistent):
```
Button.jsx (inconsistent with button.tsx)
CareerAIToolsGrid.tsx
ConfirmationModal.tsx
ConfirmModal.tsx
DemoModal.jsx
FeatureCard.tsx
FloatingEducatorAIButton.tsx
FloatingRecruiterAIButton.tsx
Footer.jsx
Header.jsx
ImageUpload.tsx
LazyComponentWrapper.jsx
LazyPageWrapper.jsx
LazyRoute.jsx
Loader.jsx
Modal.tsx
NotificationModal.tsx
OTPInput.jsx
Pagination.tsx
ScrollToTop.jsx
SearchBar.tsx
SEOHead.tsx
SkillVerified.tsx
SocialMediaLinks.jsx
StatusBadge.tsx
SuspenseWrapper.jsx
TabButton.tsx
```

**Recommendation**: 
- Standardize on kebab-case: `search-bar.tsx`, `footer.jsx`, `header.jsx`, etc.
- Or standardize on PascalCase for all components (less aligned with FSD)

---

### 3.2 PascalCase in Feature UI Components

**Issue**: Extensive use of PascalCase in feature components.

**Example from `src/features/college-admin/ui/`**:
- `AddDepartmentModal.tsx`
- `AddStudentModal.tsx`
- `AssignmentFileUpload.tsx`
- `CollegeCurriculumBuilderUI.tsx`
- `CreateCircularModal.tsx`
- `DepartmentDetailsDrawer.tsx`
- `FacultyLeaveManagement.tsx`
- etc. (100+ files)

**Recommendation**: 
- If project standard is kebab-case, convert to: `add-department-modal.tsx`, `add-learner-modal.tsx`, etc.
- Document the chosen convention in project guidelines

---

## 4. Layer Violations

### 4.1 Business Logic in Pages Layer

**Violation**: The `pages` layer should only compose features, not contain business logic or reusable components.

| Current Path | Issue | Recommendation |
|-------------|-------|----------------|
| `src/pages/auth/components/` | Auth components in pages | Move to `src/features/auth/ui/` |
| `src/pages/admin/collegeAdmin/components/` | Admin components in pages | Move to `src/features/college-admin/ui/` |
| `src/pages/admin/schoolAdmin/components/` | Admin components in pages | Move to `src/features/school-admin/ui/` |
| `src/pages/digital-pp/settings/` | Settings components in pages | Move to `src/features/digital-portfolio/ui/settings/` |

**FSD Principle**: Pages should be thin composition layers that import from features/widgets/entities.

---

### 4.2 Mixed Segment Types in UI

**Violation**: Non-UI segments nested within `ui/` directories.

| Current Path | Issue | Should Be |
|-------------|-------|-----------|
| `src/features/college-admin/ui/finance/hooks/` | Hooks in ui | `src/features/college-admin/lib/hooks/` |
| `src/features/college-admin/ui/finance/services/` | Services in ui | `src/features/college-admin/api/` |
| `src/features/college-admin/ui/finance/utils/` | Utils in ui | `src/features/college-admin/lib/utils/` |

**FSD Principle**: The `ui` segment should only contain presentational components, not business logic, hooks, or utilities.

---

## 5. Deep Nesting Issues

### 5.1 Excessive Directory Depth

**Issue**: Deep nesting makes navigation difficult and violates FSD's flat structure principle.

**Examples**:
```
src/features/college-admin/ui/components/Timetable/components/modals/
src/pages/admin/collegeAdmin/components/Timetable/components/
src/features/learner-profile/ui/learnerProfileDrawer/components/
```

**Recommendation**: Flatten to maximum 3-4 levels:
```
src/features/college-admin/ui/timetable/
src/features/college-admin/ui/modals/
```

---

## 6. Subdirectory Organization Issues

### 6.1 Acceptable Subdirectories in UI

**Status**: These are acceptable organizational patterns ✓

- `src/shared/ui/marketing/` - Domain-specific UI grouping
- `src/shared/ui/skeletons/` - Component type grouping
- `src/shared/ui/debug/` - Purpose-specific grouping

**Note**: These don't violate FSD as they're organizational subdirectories within the ui segment.

---

## 7. Summary by Priority

### Priority 1: Critical (Architectural Violations)

1. **Root-level `src/stores/` directory** - Violates FSD layer structure
2. **`components` instead of `ui` segment names** - Core FSD terminology violation
3. **`hooks` as separate segment** - Should be in `lib`
4. **Business logic in pages layer** - Violates separation of concerns

**Impact**: High - These violate core FSD principles and affect architecture clarity.

---

### Priority 2: Important (Segment Organization)

5. **`utils` instead of `lib`** - Incorrect segment naming
6. **`services` instead of `api`** - Incorrect segment naming
7. **`types` in ui instead of model** - Wrong segment placement
8. **Nested segments within ui** - Hooks, services, utils shouldn't be in ui subdirectories

**Impact**: Medium - These affect code organization and discoverability.

---

### Priority 3: Consistency (Naming Standards)

9. **Mixed PascalCase/kebab-case file naming** - Inconsistent conventions
10. **Deep nesting with redundant folders** - Affects maintainability
11. **Redundant `stores` subdirectory in model** - Unnecessary nesting

**Impact**: Low-Medium - These affect code consistency and developer experience.

---

## 8. Recommended Action Plan

### Team Division Strategy

Tasks are divided between **Member A** and **Member B** to work in parallel while minimizing integration conflicts. Each phase is designed so members work on independent parts of the codebase.

---

### Phase 1: Critical Fixes (Week 1)

**Goal**: Fix architectural violations without breaking existing functionality.

**Total Impact**: ~150-200 files, 8 directories

#### Member A: Shared Layer & Root-Level Fixes

**Tasks**:
1. **Migrate `src/stores/` to `src/shared/model/`**
   - Move all store files from `src/stores/` to `src/shared/model/`
   - Update all imports across the codebase
   - Remove redundant `src/shared/model/stores/` subdirectory
   - Files: `assessmentStore.ts`, `authStore.ts`, `careerAssistantStore.ts`, `counsellingStore.ts`, `globalPresenceStore.ts`
   - **Impact**: 6 files to move, ~50-100 import statements to update

2. **Fix Shared Layer Segment Naming**
   - Rename `src/shared/chat-ui/components/` → `src/shared/chat-ui/ui/`
   - Move `src/shared/chat-ui/hooks/` → `src/shared/chat-ui/lib/hooks/`
   - Update all imports in shared layer
   - **Impact**: 2 directories, ~15 files affected

3. **Standardize Shared UI File Naming**
   - Convert PascalCase files to kebab-case in `src/shared/ui/`
   - Update all imports referencing these files
   - Files: `Button.jsx`, `Footer.jsx`, `Header.jsx`, `SearchBar.tsx`, etc.
   - **Impact**: 27 files to rename, ~200-300 import statements to update

**Member A Subtotal**: ~48 files directly changed, ~250-400 imports updated

**Deliverables**:
- Root stores migrated
- Shared layer fully FSD-compliant
- Import map document for Member B

**Dependencies**: None - works on isolated shared layer

---

#### Member B: App & Pages Layer Fixes

**Tasks**:
1. **Fix App Layer Segment Naming**
   - Rename `src/app/components/` → `src/app/ui/`
   - Flatten `src/app/providers/tour-wrapper/ui/components/` → `src/app/providers/tour-wrapper/ui/`
   - Update all imports in app layer
   - **Impact**: 2 directories, ~20 files affected

2. **Move Business Logic from Pages to Features**
   - Move `src/pages/auth/components/` → `src/features/auth/ui/`
   - Move `src/pages/admin/collegeAdmin/components/` → `src/features/college-admin/ui/`
   - Move `src/pages/admin/schoolAdmin/components/` → `src/features/school-admin/ui/`
   - Move `src/pages/digital-pp/settings/` → `src/features/digital-portfolio/ui/settings/`
   - Update page imports to reference features
   - **Impact**: 4 directories, ~50 files to move, ~100-150 import statements

3. **Update Pages to Use New Imports**
   - Update all page files to import from features instead of local components
   - Ensure pages are thin composition layers
   - **Impact**: ~30 page files to update

**Member B Subtotal**: ~100 files directly changed, ~150-200 imports updated

**Deliverables**:
- App layer FSD-compliant
- Pages layer cleaned of business logic
- Feature layer enriched with moved components

**Dependencies**: Wait for Member A's import map to update shared imports

---

### Phase 2: Feature & Entity Layer Reorganization (Week 2)

**Goal**: Reorganize features and entities to proper FSD segments.

**Total Impact**: ~400-500 files, 15 directories

#### Member A: Features (Part 1) - Admin & Education Features

**Tasks**:
1. **Fix college-admin Feature**
   - Flatten `src/features/college-admin/ui/components/` → `src/features/college-admin/ui/`
   - Flatten `src/features/college-admin/ui/events/components/` → `src/features/college-admin/ui/events/`
   - Flatten `src/features/college-admin/ui/finance/components/` → `src/features/college-admin/ui/finance/`
   - Move `src/features/college-admin/ui/finance/hooks/` → `src/features/college-admin/lib/hooks/`
   - Move `src/features/college-admin/ui/finance/services/` → `src/features/college-admin/api/`
   - Move `src/features/college-admin/ui/finance/utils/` → `src/features/college-admin/lib/utils/`
   - Flatten deep nesting: `ui/components/Timetable/components/` → `ui/timetable/`
   - **Impact**: 8 directories, ~150 files affected

2. **Fix school-admin Feature**
   - Flatten `src/features/school-admin/ui/components/` → `src/features/school-admin/ui/`
   - Flatten `src/features/school-admin/ui/finance/components/` → `src/features/school-admin/ui/finance/`
   - Move `src/features/school-admin/ui/finance/hooks/` → `src/features/school-admin/lib/hooks/`
   - **Impact**: 3 directories, ~50 files affected

3. **Fix career-assistant Feature**
   - Move `src/features/career-assistant/hooks/` → `src/features/career-assistant/lib/hooks/`
   - Update all internal imports
   - **Impact**: 1 directory, ~15 files affected

**Member A Subtotal**: ~215 files directly changed, ~300-400 imports updated

**Deliverables**:
- college-admin feature FSD-compliant
- school-admin feature FSD-compliant
- career-assistant feature FSD-compliant

**Dependencies**: None - works on independent features

---

#### Member B: Features (Part 2) & Entities - learner & Profile Features

**Tasks**:
1. **Fix learner-profile Feature**
   - Flatten `src/features/learner-profile/ui/learnerProfileDrawer/components/` → `src/features/learner-profile/ui/learner-profile-drawer/`
   - Move `src/features/learner-profile/ui/hooks/` → `src/features/learner-profile/lib/hooks/`
   - Move `src/features/learner-profile/ui/learnerProfileDrawer/hooks/` → `src/features/learner-profile/lib/hooks/`
   - Move `src/features/learner-profile/ui/learnerProfileDrawer/types/` → `src/features/learner-profile/model/types/`
   - **Impact**: 4 directories, ~70 files affected

2. **Fix learner Entity**
   - Flatten `src/entities/learner/ui/learnerProfileDrawer/components/` → `src/entities/learner/ui/learner-profile-drawer/`
   - Move `src/entities/learner/ui/learnerProfileDrawer/hooks/` → `src/entities/learner/lib/hooks/`
   - Move `src/entities/learner/ui/learnerProfileDrawer/types/` → `src/entities/learner/model/types/`
   - **Impact**: 3 directories, ~40 files affected

3. **Update Cross-References**
   - Update all imports between learner-profile feature and learner entity
   - Ensure no circular dependencies
   - **Impact**: ~50 import statements

**Member B Subtotal**: ~110 files directly changed, ~150-200 imports updated

**Deliverables**:
- learner-profile feature FSD-compliant
- learner entity FSD-compliant
- Cross-reference documentation

**Dependencies**: None - works on independent features/entities

---

### Phase 3: File Naming & Structure Consistency (Week 3)

**Goal**: Standardize naming conventions and flatten deep structures.

**Total Impact**: ~700-800 files (mostly renames), minimal directory changes

#### Member A: Features File Naming (A-M alphabetically)

**Tasks**:
1. **Standardize File Naming in Features (A-M)**
   - Features: admin, ai-tutor, analytics, assessment, auth, broadcast, career-assistant, college-admin, counselling, courses, debug, digital-portfolio, educator, educator-copilot, exams, library, marketing, messaging, myclass
   - Convert all PascalCase component files to kebab-case
   - Example: `AddDepartmentModal.tsx` → `add-department-modal.tsx`
   - Update all imports within these features
   - **Impact**: ~400-450 files to rename, ~600-800 import statements

2. **Flatten Deep Structures**
   - Remove unnecessary nesting levels
   - Ensure maximum 3-4 directory depth
   - **Impact**: ~5-10 directories

**Member A Subtotal**: ~400-450 files renamed, ~600-800 imports updated

**Deliverables**:
- Features A-M with consistent kebab-case naming
- Flattened directory structures
- Import update list for cross-feature references

**Dependencies**: Phase 2 must be complete

---

#### Member B: Features File Naming (N-Z alphabetically) & Widgets

**Tasks**:
1. **Standardize File Naming in Features (N-Z)**
   - Features: notifications, onboarding, opportunities, placement, promotional, recruiter, recruiter-copilot, recruiter-pipeline, school-admin, learner-profile, subscription, university-admin, university-ai
   - Convert all PascalCase component files to kebab-case
   - Update all imports within these features
   - **Impact**: ~250-300 files to rename, ~400-500 import statements

2. **Standardize Widget File Naming**
   - All widgets: admin-dashboard, admin-navigation, educator-dashboard, exam-workflow, kpi-dashboard, message-modal, myclass, recruiter-dashboard, shared, learner-dashboard, learner-profile-drawer
   - Convert PascalCase files to kebab-case
   - Update all imports
   - **Impact**: ~100-150 files to rename, ~200-300 import statements

**Member B Subtotal**: ~350-450 files renamed, ~600-800 imports updated

**Deliverables**:
- Features N-Z with consistent kebab-case naming
- All widgets with consistent naming
- Import update list for cross-feature references

**Dependencies**: Phase 2 must be complete

---

### Phase 4: Integration & Testing (Week 4)

**Goal**: Merge all changes, resolve conflicts, and verify functionality.

**Total Impact**: All previous changes integrated, ~100-200 additional fixes expected

#### Member A: Integration Lead

**Tasks**:
1. **Merge & Resolve Conflicts**
   - Merge all branches from Phase 1-3
   - Resolve any import conflicts
   - Update barrel exports (index.ts files)

2. **Build Verification**
   - Run `npm run build:dev` to catch import/export errors
   - Fix any remaining import issues
   - Verify no circular dependencies

3. **Update Documentation**
   - Update project README with new structure
   - Document FSD conventions for team
   - Create import/export guidelines

**Deliverables**:
- Fully integrated codebase
- Successful build
- Updated documentation

---

#### Member B: Testing & Validation

**Tasks**:
1. **Automated Testing**
   - Run full test suite
   - Fix any broken tests due to import changes
   - Add tests for critical paths

2. **Manual Testing**
   - Test key user flows (auth, dashboard, profile, etc.)
   - Verify no broken imports in production build
   - Check for console errors

3. **Create Migration Guide**
   - Document all file/folder moves
   - Create before/after import examples
   - List breaking changes for other developers

**Deliverables**:
- All tests passing
- Manual testing report
- Migration guide for team

---

## 9. Dependency Management Strategy

### Avoiding Integration Conflicts

**Strategy 1: Layer Isolation**
- Member A focuses on shared/app layers
- Member B focuses on pages/features layers
- Minimal overlap in Phase 1

**Strategy 2: Alphabetical Division**
- Phase 3 splits features alphabetically
- No feature is touched by both members
- Clear ownership boundaries

**Strategy 3: Communication Protocol**
- Daily sync meetings (15 min)
- Shared import mapping document
- Immediate conflict resolution

**Strategy 4: Branch Strategy**
```
main
├── phase1-member-a (shared & root fixes)
├── phase1-member-b (app & pages fixes)
├── phase2-member-a (admin features)
├── phase2-member-b (learner features)
├── phase3-member-a (features A-M)
├── phase3-member-b (features N-Z)
└── phase4-integration (final merge)
```

### Merge Points

**After Phase 1**: 
- Member A merges first (shared layer is foundation)
- Member B merges next (depends on shared imports)
- Resolve conflicts in app/pages imports

**After Phase 2**:
- Both merge simultaneously (independent features)
- No conflicts expected (different features)

**After Phase 3**:
- Both merge simultaneously (alphabetical split)
- No conflicts expected (different files)

**Phase 4**:
- Final integration branch
- Both members collaborate on resolution

### Critical Path Items

**Must Complete Before Next Phase**:
- Phase 1 Member A → Phase 1 Member B (shared imports needed)
- Phase 1 → Phase 2 (foundation must be solid)
- Phase 2 → Phase 3 (structure must be correct before renaming)
- Phase 3 → Phase 4 (all changes must be ready for integration)

### Rollback Strategy

**If Issues Arise**:
1. Each phase has its own branch
2. Can rollback to previous phase
3. Fix issues in isolation
4. Re-merge when ready

**Checkpoints**:
- End of each phase: build verification
- End of each phase: test suite run
- End of each phase: manual smoke test

---

## 10. Task Timeline & Milestones

### Overall Statistics

**Total Scope**:
- **Directories to restructure**: 35-40 directories
- **Files to move/rename**: 800-1,000 files
- **Import statements to update**: 2,000-3,000 imports (estimated)
- **Features affected**: 32 features
- **Widgets affected**: 11 widgets
- **Entities affected**: 2 entities

**Work Distribution**:
- **Member A**: ~650-700 files (48% shared/admin features + A-M features)
- **Member B**: ~450-500 files (52% app/pages/learner features + N-Z features + widgets)

---

### Week 1: Phase 1 - Critical Fixes

**Scope**: ~150-200 files, 8 directories

- **Day 1-2**: Member A (Shared layer) + Member B (App layer) work in parallel
  - Member A: 48 files, ~250-400 imports
  - Member B: 100 files, ~150-200 imports
- **Day 3**: Member A completes, provides import map
- **Day 4-5**: Member B completes using import map, moves pages logic
- **Checkpoint**: Build verification, no broken imports

---

### Week 2: Phase 2 - Feature Reorganization

**Scope**: ~400-500 files, 15 directories

- **Day 1-3**: Member A (college-admin, school-admin, career-assistant)
  - Member A: 215 files, ~300-400 imports
- **Day 1-3**: Member B (learner-profile, learner entity) - parallel work
  - Member B: 110 files, ~150-200 imports
- **Day 4-5**: Both members test their features independently
- **Checkpoint**: Feature-level build verification

---

### Week 3: Phase 3 - File Naming Standardization

**Scope**: ~700-800 files (mostly renames), minimal directory changes

- **Day 1-4**: Member A (Features A-M) + Member B (Features N-Z, Widgets) - parallel work
  - Member A: 400-450 files, ~600-800 imports
  - Member B: 350-450 files, ~600-800 imports
- **Day 5**: Cross-check imports between features
- **Checkpoint**: Full codebase build verification

---

### Week 4: Phase 4 - Integration & Testing

**Scope**: Integration + ~100-200 additional fixes

- **Day 1-2**: Member A (Integration) + Member B (Testing) - parallel work
- **Day 3**: Joint conflict resolution
- **Day 4-5**: Final verification and documentation
- **Checkpoint**: Production-ready codebase

---

### Cumulative Progress Tracking

| Phase | Member A Files | Member B Files | Total Files | Cumulative |
|-------|---------------|---------------|-------------|------------|
| Phase 1 | 48 | 100 | 148 | 148 |
| Phase 2 | 215 | 110 | 325 | 473 |
| Phase 3 | 425 | 400 | 825 | 1,298 |
| Phase 4 | Integration | Testing | ~100-200 | ~1,400-1,500 |

**Note**: Phase 3 numbers include renames which are less risky than moves.

---

## 11. FSD Segment Reference

For reference, here are the standard FSD segments:

| Segment | Purpose | Examples |
|---------|---------|----------|
| `ui` | Presentational components | Components, layouts, views |
| `api` | Backend interactions | API calls, services, requests |
| `model` | Business logic & state | Stores, types, schemas, constants |
| `lib` | Utilities & helpers | Hooks, utils, helpers, formatters |
| `config` | Configuration | Constants, settings, feature flags |

**Note**: Segments are optional - only use what you need for each slice.

---

## 12. Conclusion

The codebase has a solid FSD foundation but requires systematic refactoring to fully align with FSD naming conventions. The most critical issues are:

1. Root-level stores directory
2. Use of "components" instead of "ui"
3. Misplaced hooks outside the lib segment
4. Business logic in the pages layer

Addressing these violations will improve code organization, maintainability, and alignment with FSD best practices.

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-23
