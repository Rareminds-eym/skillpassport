# FSD Import/Export Errors Bugfix Design

## Overview

After the FSD (Feature-Sliced Design) migration, the build fails due to 10 import/export type mismatches across multiple files. Components are attempting to use default imports when exports are named, or importing items that don't exist in the specified modules. This bugfix will systematically correct all import statements to match the actual export patterns in the FSD structure, restoring build functionality while preserving existing behavior for correctly configured imports.

The fix approach is straightforward: analyze each failing import, verify the actual export type in the target module, and update the import statement to match. No component logic changes are required - only import statement corrections.

## Glossary

- **Bug_Condition (C)**: The condition that triggers build failures - when import statements don't match the export type (default vs named) or import from incorrect module paths
- **Property (P)**: The desired behavior - all imports should match their corresponding exports and the build should complete successfully
- **Preservation**: Existing correctly configured imports and all component functionality must remain unchanged
- **Named Export**: Export syntax like `export { Component }` requiring import syntax `import { Component } from 'module'`
- **Default Export**: Export syntax like `export default Component` requiring import syntax `import Component from 'module'`
- **FSD Structure**: Feature-Sliced Design architecture organizing code by features, shared components, and widgets

## Bug Details

### Bug Condition

The bug manifests when import statements use incorrect syntax (default vs named) or reference incorrect module paths that don't export the requested items. The build process fails with TypeScript/module resolution errors because the imported items cannot be found or are accessed incorrectly.

**Formal Specification:**
```
FUNCTION isBugCondition(importStatement)
  INPUT: importStatement of type ImportDeclaration
  OUTPUT: boolean
  
  RETURN (importStatement.isDefaultImport AND targetModule.exportsAsNamed)
         OR (importStatement.isNamedImport AND targetModule.exportsAsDefault)
         OR (importStatement.importPath NOT IN targetModule.exports)
         OR (importStatement.fileExtension == '.ts' AND fileContainsJSX)
END FUNCTION
```

### Examples

1. **AppliedJobs.jsx - Button Import**
   - Current: `import Button from '@/shared/ui'` (default import)
   - Actual Export: `export { Button, buttonVariants } from './button'` (named export)
   - Expected: `import { Button } from '@/shared/ui'`

2. **Messages.jsx - Modal Imports**
   - Current: `import NewEducatorConversationModal from '@/features/messaging'` (default import)
   - Actual Export: `export type { NewEducatorConversationModal } from './ui/NewEducatorConversationModal'` (named type export)
   - Expected: `import { NewEducatorConversationModal } from '@/features/messaging'`

3. **DynamicAssessment.jsx - UI Component Imports**
   - Current: `import { RadioGroup, RadioGroupItem } from '@/shared/ui'`
   - Actual Export: Components ARE exported from `@/shared/ui/index.ts`
   - Issue: File imports correctly but may have other issues (file extension)

4. **useNotificationBroadcast.ts - File Extension**
   - Current: `.ts` file extension with JSX syntax
   - Expected: `.tsx` file extension for files containing JSX

5. **ClassesPage.tsx - Hook Imports**
   - Current: Imports from incorrect module paths
   - Expected: Import from correct paths where hooks are actually exported

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All component functionality must continue to work exactly as before
- Correctly configured imports (already using proper syntax) must remain unchanged
- Component props, state management, and business logic must be unaffected
- Build process for files without import errors must continue to work
- Runtime behavior of all components must be identical after the fix

**Scope:**
All files that do NOT have import/export mismatches should be completely unaffected by this fix. This includes:
- Files with correct named imports matching named exports
- Files with correct default imports matching default exports
- Files with correct module paths
- Files with correct file extensions (.tsx for JSX content)
- All component logic, styling, and functionality

## Hypothesized Root Cause

Based on the bug description and FSD migration context, the most likely issues are:

1. **Migration Script Assumptions**: The FSD migration script may have assumed all exports were default exports and generated default import statements, but the actual FSD structure uses named exports for most components

2. **Index File Re-exports**: The FSD structure uses index.ts files to re-export components as named exports (e.g., `export { Button } from './button'`), but consuming files still use default import syntax from the old structure

3. **Module Path Changes**: During migration, some components moved to different feature slices, but import paths weren't updated to reflect the new locations

4. **Type-Only Exports**: Some components (like modals in messaging feature) are exported as TypeScript types only, requiring different import syntax

5. **File Extension Inconsistency**: Some files containing JSX were given `.ts` extensions instead of `.tsx`, causing TypeScript compilation errors

## Correctness Properties

Property 1: Bug Condition - Import Statements Match Export Types

_For any_ import statement where the bug condition holds (isBugCondition returns true), the fixed import statement SHALL use the correct syntax (default vs named) that matches the actual export type in the target module, and SHALL reference the correct module path where the item is exported, causing the build to succeed.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10**

Property 2: Preservation - Correct Imports and Component Behavior

_For any_ import statement where the bug condition does NOT hold (isBugCondition returns false), the fixed code SHALL produce exactly the same behavior as the original code, preserving all correctly configured imports, component functionality, and build success for error-free files.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

The fix requires updating import statements in 10 files to match the actual export patterns in the FSD structure. No component logic changes are needed.

**File 1**: `src/pages/student/AppliedJobs.jsx`

**Changes**:
1. Change `import Button from '@/shared/ui'` to `import { Button } from '@/shared/ui'`

**File 2**: `src/pages/student/Messages.jsx`

**Changes**:
1. Change `import NewEducatorConversationModal from '@/features/messaging'` to `import { NewEducatorConversationModal } from '@/features/messaging'`
2. Change `import NewAdminConversationModal from '@/features/messaging'` to `import { NewAdminConversationModal } from '@/features/messaging'`

**File 3**: `src/pages/student/MyClass.tsx`

**Changes**:
1. Change `import SchoolMyClass from '@/features/myclass'` to `import { SchoolMyClass } from '@/features/myclass'`
2. Change `import CollegeMyClass from '@/features/myclass'` to `import { CollegeMyClass } from '@/features/myclass'`

**File 4**: `src/pages/student/AchievementsPage.jsx`

**Changes**:
1. Change `import AchievementsExpanded from '@/features/student-profile'` to `import { AchievementsExpanded } from '@/features/student-profile'`
2. Change `import SkillTrackerExpanded from '@/features/student-profile'` to `import { SkillTrackerExpanded } from '@/features/student-profile'`

**File 5**: `src/pages/student/DynamicAssessment.jsx`

**Changes**:
1. Verify AlertDialog and RadioGroup imports are correct (they appear to be exported from @/shared/ui)
2. If build still fails, investigate specific component export paths
3. May need to import from specific subdirectories if not re-exported in index

**File 6**: `src/pages/student/Settings.jsx`

**Changes**:
1. Change `import MainSettings from '@/features/student-profile'` to `import { MainSettings } from '@/features/student-profile'`

**File 7**: `src/pages/college-admin/ProgramSectionsPage.tsx`

**Changes**:
1. Change `import ManageProgramStudentsModal from '@/features/college-admin'` to `import { ManageProgramStudentsModal } from '@/features/college-admin'`

**File 8**: `src/pages/educator/ClassesPage.tsx`

**Changes**:
1. Locate correct export path for `useClasses` hook
2. Locate correct export path for `useEducatorId` hook
3. Update import statements to reference correct paths
4. Change `import ManageStudentsModal from [path]` to `import { ManageStudentsModal } from [path]`

**File 9**: `src/hooks/useNotificationBroadcast.ts`

**Changes**:
1. Rename file from `.ts` to `.tsx` extension to allow JSX syntax

**File 10**: Additional files identified during build testing

**Changes**:
1. Apply same pattern: verify export type, update import syntax to match

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, run the build on unfixed code to confirm all 10 errors, then systematically fix each import and verify the build succeeds after all fixes are applied.

### Exploratory Bug Condition Checking

**Goal**: Surface all import/export mismatches by running the build BEFORE implementing fixes. Confirm the exact error messages and affected files.

**Test Plan**: Run `npm run build:dev` on the UNFIXED code to observe all build failures. Document each error message, file path, line number, and the specific import causing the issue.

**Test Cases**:
1. **Build Unfixed Code**: Run `npm run build:dev` (will fail with 10+ errors)
2. **Document Each Error**: Record file path, line number, imported item, and error message
3. **Verify Export Types**: For each failing import, check the target module's index.ts to confirm export type
4. **Identify Patterns**: Group errors by type (default vs named, missing exports, wrong paths)

**Expected Counterexamples**:
- "Module has no default export" errors for components exported as named exports
- "Module does not export member" errors for incorrect import paths
- "Cannot use JSX unless the '--jsx' flag is provided" for .ts files with JSX
- Possible causes: migration script assumptions, index file re-export patterns, moved components

### Fix Checking

**Goal**: Verify that for all imports where the bug condition holds, the fixed import statements match the actual exports and the build succeeds.

**Pseudocode:**
```
FOR ALL importStatement WHERE isBugCondition(importStatement) DO
  fixedImport := updateImportSyntax(importStatement, targetModule.exportType)
  result := runBuild()
  ASSERT result.success == true
  ASSERT result.errors.length < previousErrors.length
END FOR
```

**Test Plan**:
1. Fix imports in batches by file
2. Run `npm run build:dev` after each file is fixed
3. Verify error count decreases
4. Continue until build succeeds with zero errors

### Preservation Checking

**Goal**: Verify that for all imports where the bug condition does NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL importStatement WHERE NOT isBugCondition(importStatement) DO
  ASSERT importStatement remains unchanged
  ASSERT component functionality remains identical
  ASSERT build continues to succeed for this file
END FOR
```

**Testing Approach**: Property-based testing is not applicable here since we're fixing syntax errors, not logic. Instead, we rely on:
- Build success as proof that imports are correct
- Manual verification that unchanged files remain untouched
- Runtime testing of affected components to ensure functionality is preserved

**Test Plan**: 
1. Before fixing, identify files that build successfully (no import errors)
2. After fixing, verify those files were not modified
3. Run the application and manually test affected components
4. Verify all features work identically to before the fix

**Test Cases**:
1. **Unchanged Files**: Verify files without import errors remain unmodified
2. **Component Functionality**: Test each affected component in the UI
3. **Build Success**: Verify `npm run build:dev` completes with zero errors
4. **Runtime Behavior**: Verify no console errors or runtime issues

### Unit Tests

- No unit tests required - this is a build-time syntax fix
- Build success is the primary validation
- Component functionality tests (if they exist) should continue to pass

### Property-Based Tests

- Not applicable for import/export syntax fixes
- Build process itself acts as the property test: "all imports must resolve correctly"

### Integration Tests

- Run full application after fixes to verify all pages load
- Test navigation to each affected page (AppliedJobs, Messages, MyClass, Achievements, DynamicAssessment, Settings, ProgramSections, Classes)
- Verify modals open correctly (NewEducatorConversationModal, NewAdminConversationModal, ManageProgramStudentsModal, ManageStudentsModal)
- Verify UI components render correctly (Button, AlertDialog, RadioGroup)
- Verify no console errors or missing component warnings
