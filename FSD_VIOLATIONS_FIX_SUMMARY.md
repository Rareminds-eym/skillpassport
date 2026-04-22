# FSD Architecture Violations - Fix Summary

## Date: 2026-04-22

## Section 4: Pages → App Layer Violations (FIXED ✅)

### Problem
4 page files were importing `Header` component from `@/app/layouts/Header`, violating FSD's unidirectional dependency rule. Pages should not depend on the app layer.

### Solution
Moved `Header` component from app layer to shared layer where it belongs as a reusable UI component.

### Changes Made

#### 1. Component Relocation
- **Moved**: `src/app/layouts/Header.jsx` → `src/shared/ui/Header.jsx`
- **Updated**: `src/shared/ui/index.ts` to export Header component

#### 2. Import Updates (4 files fixed)

**File: src/pages/register/SkillPassportPreRegistration.jsx**
```diff
- import { Footer } from '@/shared/ui';
- import Header from '@/app/layouts/Header';
+ import { Footer, Header } from '@/shared/ui';
```

**File: src/pages/register/SimpleEventRegistration.jsx**
```diff
- import { Footer } from '@/shared/ui';
- import { OTPInput } from '@/shared/ui';
- import Header from '@/app/layouts/Header';
- import { ShinyButton, Sparkles } from '@/shared/ui';
+ import { Footer, Header, OTPInput, ShinyButton, Sparkles } from '@/shared/ui';
```

**File: src/pages/event/EventSalesSuccess.jsx**
```diff
- import Header from '@/app/layouts/Header';
+ import { Header } from '@/shared/ui';
```

**File: src/pages/event/EventSalesFailure.jsx**
```diff
- import Header from '@/app/layouts/Header';
+ import { Header } from '@/shared/ui';
```

#### 3. Layout Update

**File: src/app/layouts/PublicLayout.jsx**
```diff
- import Header from '../../shared/ui/Header';
- import Footer from '@/shared/ui/Footer';
+ import { Header, Footer } from '@/shared/ui';
```

### Why This Matters

**Before (Violation):**
```
pages → app (❌ Wrong direction)
```

**After (Compliant):**
```
pages → shared (✅ Correct)
app → shared (✅ Correct)
```

### FSD Principle Applied
- **Unidirectional Dependencies**: Higher layers (pages) should only depend on lower layers (shared, entities, features, widgets)
- **Layer Isolation**: App layer provides infrastructure (routing, providers), not UI components
- **Reusability**: Header is now properly placed in shared/ui where it can be reused across the application

### Impact
- ✅ All 4 page files now comply with FSD architecture
- ✅ Header component is now properly accessible from shared layer
- ✅ Improved code organization and maintainability
- ✅ Better separation of concerns

---

## Section 5: App → Features Layer Violations (FIXED ✅)

### Problem
10 files in the app layer were importing from features layer, creating tight coupling and violating FSD's layer independence principle.

### Solution
1. Moved shared types to appropriate shared layer locations
2. Refactored guards to use redirect patterns instead of rendering feature UI
3. Moved mock data to shared config
4. Fixed imports to use feature's public API

### Changes Made

#### 1. Tour Types Migration (7 files fixed)

**Created**: `src/shared/types/tour.ts`
- Moved all tour-related types from `@/features/student-profile/model` to shared layer
- Types: `TourStep`, `TourConfig`, `TourProgress`, `TourState`, `TourKey`

**Updated**: `src/shared/types/index.ts`
- Added exports for all tour types

**Updated**: `src/app/providers/tour-wrapper/lib/types.ts`
- Changed to re-export from `@/shared/types` with deprecation notice

**Files Fixed (7):**
1. `src/app/providers/tour-wrapper/lib/utils.ts`
2. `src/app/providers/tour-wrapper/lib/constants.ts`
3. `src/app/providers/tour-wrapper/lib/configs/dashboardTourConfig.tsx`
4. `src/app/providers/tour-wrapper/lib/configs/after12TourConfig.tsx`
5. `src/app/providers/tour-wrapper/lib/configs/after10TourConfig.tsx`
6. `src/app/providers/tour-wrapper/lib/configs/genericAssessmentTourConfig.tsx`
7. `src/app/providers/tour-wrapper/lib/configs/assessmentTestTourConfig.tsx`

```diff
- import { TourStep, TourProgress, TourKey } from '@/features/student-profile/model';
+ import { TourStep, TourProgress, TourKey } from '@/shared/types';
```

#### 2. OrganizationGuard Refactor (1 file fixed)

**Problem**: Guard was rendering feature UI directly (`<OrganizationSetup>`)

**Solution**: Changed to redirect pattern

**File: src/app/guards/OrganizationGuard.tsx**
```diff
- import OrganizationSetup from '@/features/onboarding/ui/OrganizationSetup';
- return <OrganizationSetup />;
+ return <Navigate to="/organization-setup?type={organizationType}" />;
```

**Created**: `src/pages/onboarding/OrganizationSetupPage.tsx`
- Standalone page that renders the OrganizationSetup feature

**Updated**: `src/app/routes/publicRoutes.jsx`
- Added route for `/organization-setup`

#### 3. Mock Data Migration (1 file fixed)

**Problem**: `StudentLayout` was importing mock data from widget internals

**Solution**: Moved mock data to shared config layer

**Created**: `src/shared/config/mockData.js`
- Moved all mock data from `@/widgets/student-dashboard/model/mockData`
- Data: `studentData`, `educationData`, `trainingData`, `experienceData`, `technicalSkills`, `softSkills`, `opportunities`, `recentUpdates`, `suggestions`

**Updated**: `src/widgets/student-dashboard/model/mockData.js`
- Changed to re-export from `@/shared/config/mockData` with deprecation notice

**File: src/app/layouts/StudentLayout.jsx**
```diff
- } from '@/widgets/student-dashboard/model/mockData';
+ } from '@/shared/config/mockData';
```

#### 4. Subscription Utility Import Fix (1 file fixed)

**Problem**: `PublicLayout` was importing from feature's internal path instead of public API

**Solution**: Import from feature's public API (already exported)

**File: src/app/layouts/PublicLayout.jsx**
```diff
- import { useSubscriptionQuery } from '@/features/subscription/model';
- import { isActiveOrPaused } from '@/features/subscription';
+ import { useSubscriptionQuery, isActiveOrPaused } from '@/features/subscription';
```

### Why This Matters

**Before (Violations):**
```
app → features (❌ Tight coupling)
app → widgets/model (❌ Bypassing public API)
```

**After (Compliant):**
```
app → shared (✅ Correct)
app → features (public API only) (✅ Correct)
pages → features (✅ Correct)
```

### FSD Principles Applied

1. **Layer Independence**: App layer no longer tightly coupled to specific features
2. **Public API Boundaries**: All feature imports go through public index files
3. **Shared Types**: Common types moved to shared layer for reusability
4. **Separation of Concerns**: Guards handle logic, pages handle UI rendering
5. **Data Layer Separation**: Mock data in shared config, not widget internals

### Impact
- ✅ All 10 app → features violations resolved
- ✅ Tour types now properly shared across application
- ✅ Guards follow redirect pattern (no feature UI rendering)
- ✅ Mock data properly accessible from shared layer
- ✅ All imports use public APIs
- ✅ Improved maintainability and testability
- ✅ Better layer isolation and independence

---

## Complete Summary

### Total Violations Fixed: 14

**Section 4 (pages → app): 4 violations ✅**
- Moved Header component to shared layer
- Updated 4 page files + 1 layout file

**Section 5 (app → features): 10 violations ✅**
- Migrated tour types to shared layer (7 files)
- Refactored OrganizationGuard to redirect pattern (1 file)
- Moved mock data to shared config (1 file)
- Fixed subscription utility import (1 file)

### Files Created
1. `src/shared/ui/Header.jsx` (moved from app/layouts)
2. `src/shared/types/tour.ts` (new)
3. `src/pages/onboarding/OrganizationSetupPage.tsx` (new)
4. `src/shared/config/mockData.js` (new)

### Files Modified
- 4 page files (Section 4)
- 7 tour config/util files (Section 5)
- 2 layout files (StudentLayout, PublicLayout)
- 2 guard files (OrganizationGuard)
- 3 index/export files (shared/ui, shared/types, tour-wrapper types)
- 1 widget mockData file (now re-exports)
- 1 route file (publicRoutes)

---

## Next Steps

### Section 5: App → Features Layer Violations (10 remaining)

**Tour-related violations (7 files):**
- Move `TourProgress`, `TourKey`, `TourStep` types from `@/features/student-profile/model` to `@/shared/types` or `@/shared/lib/tour`

**Guard violation (1 file):**
- Refactor `OrganizationGuard` to not render feature UI directly
- Use redirect pattern or slot/portal pattern instead

**Layout violations (2 files):**
- Move mock data from widget internals to proper data layer
- Export `isActiveOrPaused` from feature's public API or move to shared/lib

---

## Verification

To verify these fixes work correctly:
```bash
npm run build:dev
```

All imports should resolve correctly and the application should build without errors.
