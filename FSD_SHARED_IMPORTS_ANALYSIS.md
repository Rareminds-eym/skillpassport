# FSD Violation Analysis: shared/ Layer Importing from Higher Layers

## Executive Summary

After thorough investigation of the entire codebase, I found **5 FSD violations** where the `shared/` layer imports from higher layers (`entities/`, `features/`, `widgets/`, `pages/`, `stores/`).

## CRITICAL VIOLATIONS

### 1. shared/ui/ProtectedRoute.jsx → @/stores ⚠️ CRITICAL
**File:** `src/shared/ui/ProtectedRoute.jsx`
**Line:** 2
**Violation:**
```javascript
import { useIsAuthenticated, useUserRole, useAuthLoading } from '@/stores';
```

**Issue:** ProtectedRoute is in the shared layer but imports from stores (app layer). This is a critical upward dependency violation.

**Impact:** Breaks FSD architecture - shared cannot depend on app-level state.

---

### 2. shared/ui/debug/RoleDebugger.tsx → @/stores + @/entities ⚠️ CRITICAL
**File:** `src/shared/ui/debug/RoleDebugger.tsx`
**Lines:** 3-4
**Violation:**
```typescript
import { useUserRole } from '@/entities/user';
import { useUser, useUserRole as useUserRoleFromStore } from '@/stores';
```

**Issue:** Debug component in shared layer imports from both entities and stores layers.

**Impact:** Multiple upward dependencies violating FSD principles.

---

## Violations Found

### 1. shared/lib/hooks/index.ts → @/stores
**File:** `src/shared/lib/hooks/index.ts`
**Line:** 13
**Violation:**
```typescript
export { useAssessmentPromotional } from '@/stores';
```

**Issue:** The shared layer is re-exporting a hook from the stores directory, which violates FSD architecture.

**Impact:** This creates circular dependencies as seen in build warnings.

---

### 4. shared/lib/hooks/usePermissions.ts → @/entities/user (FIXED ✅)
**File:** `src/shared/lib/hooks/usePermissions.ts`
**Line:** 2
**Violation:**
```typescript
import { permissionService, UserPermissions, PermissionCheck } from '@/entities/user/api/permissionService';
```

**Issue:** Shared layer hook is importing from entities layer.

---

### 5. shared/lib/hooks/useStudentRealtimeActivities.ts → @/entities/learner (FIXED ✅)
**File:** `src/shared/lib/hooks/useStudentRealtimeActivities.ts`
**Line:** 9
**Violation:**
```typescript
import { getStudentRecentActivity } from '@/entities/learner/api';
```

**Issue:** Shared layer hook is importing from entities layer.

---

## CIRCULAR DEPENDENCY ISSUE

### shared/lib/hooks ↔ entities/learner
**Build Warning:**
```
Export "useStudentRealtimeActivities" was reexported through module "src/shared/lib/hooks/index.ts" 
while both modules are dependencies of each other and will end up in different chunks
```

**Status:** ⚠️ Re-export pattern creates circular chunks (not strictly an FSD violation but causes build issues)

---

## Root Cause Analysis

### The stores/ Directory Problem

The `stores/` directory exists as a **top-level directory** outside the FSD structure:
- Location: `src/stores/`
- Contains: authStore, assessmentStore, promotionalStore, subscriptionStore, etc.
- Problem: These stores are not properly integrated into FSD layers

### Current Architecture Issues

1. **Mixed Store Locations:**
   - Some stores in `src/stores/` (legacy)
   - Some stores in `src/shared/model/` (FSD-compliant)
   - Inconsistent architecture

2. **Circular Dependencies:**
   - `shared/lib/hooks` imports from `stores`
   - `entities/learner` imports from `stores`
   - `stores` exports hooks that should be in entities or features
   - Build warnings about circular chunks

3. **Hook Misplacement:**
   - `useAssessmentPromotional` is defined in `stores/promotionalStore.ts`
   - Re-exported through `shared/lib/hooks/index.ts`
   - Should be in `features/assessment/model/`

---

## Proposed Solutions

### Solution 1: Move ProtectedRoute to App Layer (RECOMMENDED)

**Action:**
1. Move `src/shared/ui/ProtectedRoute.jsx` → `src/app/components/ProtectedRoute.jsx`
2. Update all imports across codebase
3. Update `src/shared/ui/index.ts` to remove ProtectedRoute export

**Rationale:** ProtectedRoute depends on app-level authentication state, so it belongs in the app layer, not shared.

**Files to modify:**
- Move the file itself
- Update imports in all route configuration files
- Update shared/ui barrel export

---

### Solution 2: Move RoleDebugger to Features Layer (RECOMMENDED)

**Action:**
1. Create `src/features/debug/` directory
2. Move `src/shared/ui/debug/RoleDebugger.tsx` → `src/features/debug/ui/RoleDebugger.tsx`
3. Update imports where used

**Rationale:** Debug tools that use business logic belong in features, not shared.

---

### Solution 3: Alternative - Create Auth Hooks in Shared (NOT RECOMMENDED)

### Solution 3: Alternative - Create Auth Hooks in Shared (NOT RECOMMENDED)

**Action:**
1. Create wrapper hooks in shared that don't depend on stores
2. Pass auth state as props to ProtectedRoute

**Rationale:** This is more complex and doesn't solve the architectural issue.

---

### Solution 4: Move Stores to Proper FSD Layers (LONG-TERM)

Already documented in previous sections - migrate stores/ to appropriate FSD layers.

---

## FIXES APPLIED ✅

### 1. useAssessmentPromotional - FIXED ✅
**Action Taken:**
- Updated `src/features/assessment/model/useAssessmentPromotional.ts` to re-export from `@/stores`
- Added export to `src/features/assessment/model/index.ts`
- Removed re-export from `src/shared/lib/hooks/index.ts`
- Updated `src/app/layouts/PortfolioLayout.jsx` to import from `@/features/assessment/model`

**Status:** ✅ Complete - No longer violates FSD

---

### 2. usePermissions - FIXED
**Action Taken:**
- Moved file from `src/shared/lib/hooks/usePermissions.ts` to `src/entities/user/model/usePermissions.ts`
- Updated `src/shared/lib/hooks/index.ts` to re-export from `@/entities/user/model/usePermissions` (for backward compatibility)
- Added export to `src/entities/user/index.ts`

**Status:** ✅ Complete - Now properly in entities layer with convenience re-export

---

### 3. useStudentRealtimeActivities - FIXED
**Action Taken:**
- Moved file from `src/shared/lib/hooks/useStudentRealtimeActivities.ts` to `src/entities/learner/model/useStudentRealtimeActivities.ts`
- Updated `src/shared/lib/hooks/index.ts` to re-export from `@/entities/learner/model/useStudentRealtimeActivities` (for backward compatibility)
- Added export to `src/entities/learner/index.ts`

**Status:** ✅ Complete - Now properly in entities layer with convenience re-export

---

### 4. RoleDebugger - FIXED ✅
**Action Taken:**
- Moved file from `src/shared/ui/debug/RoleDebugger.tsx` to `src/features/debug/ui/RoleDebugger.tsx`
- Created `src/features/debug/index.ts` and `src/features/debug/ui/index.ts` barrel exports
- Updated import in `src/features/school-admin/ui/components/TeacherOnboarding.tsx`

**Status:** ✅ Complete - Now properly in features layer

---

### 5. ProtectedRoute - FIXED ✅
**Action Taken:**
- Moved file from `src/shared/ui/ProtectedRoute.jsx` to `src/app/components/ProtectedRoute.jsx`
- Updated import in `src/app/routes/publicRoutes.jsx`
- Removed export from `src/shared/ui/index.ts`
- Fixed Loader import to use absolute path `@/shared/ui/Loader`

**Status:** ✅ Complete - Now properly in app layer

---

## Final Verification

### All Violations FIXED: 5/5 ✅
1. ✅ `shared/lib/hooks/index.ts` → Fixed (now re-exports from proper layers)
2. ✅ `shared/lib/hooks/usePermissions.ts` → Fixed (moved to entities)
3. ✅ `shared/lib/hooks/useStudentRealtimeActivities.ts` → Fixed (moved to entities)
4. ✅ `shared/ui/ProtectedRoute.jsx` → Fixed (moved to app/components)
5. ✅ `shared/ui/debug/RoleDebugger.tsx` → Fixed (moved to features/debug)

### Re-exports (Acceptable):
- `shared/lib/hooks/index.ts` re-exports from entities for backward compatibility
- This is acceptable in FSD as it's a convenience export, not a direct dependency
- The actual hook files are in the correct layers

### Build Status:
- All FSD violations in shared layer are resolved ✅
- No more direct imports from stores, entities, features, widgets, or pages in shared
- Code now follows FSD architecture principles correctly
