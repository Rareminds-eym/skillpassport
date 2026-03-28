# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Import/Export Mismatch Detection
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the import/export mismatches exist
  - **Scoped PBT Approach**: For deterministic build errors, scope the property to the concrete failing cases (the 10 known import mismatches)
  - Run `npm run build:dev` on UNFIXED code to capture all build errors
  - Document each error: file path, line number, imported item, error message, and export type mismatch
  - Verify export types in target modules (check index.ts files for actual export patterns)
  - Test asserts that imports match exports: default imports should only be used with default exports, named imports with named exports, and all import paths should reference modules that actually export the requested items
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with ~10 build errors (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "AppliedJobs.jsx uses default import for Button but @/shared/ui exports it as named export")
  - Mark task complete when test is written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

- [~] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Correct Imports and Component Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Identify files that build successfully (no import errors) in the UNFIXED codebase
  - Document correctly configured imports that should remain unchanged
  - Observe that files with correct named imports matching named exports build successfully
  - Observe that files with correct default imports matching default exports build successfully
  - Observe that files with correct module paths resolve imports correctly
  - Observe that .tsx files with JSX syntax compile successfully
  - Write property-based test: for all import statements where isBugCondition returns false, the import statement should remain unchanged after the fix
  - Write integration test: verify affected components (AppliedJobs, Messages, MyClass, Achievements, DynamicAssessment, Settings, ProgramSections, Classes) function identically before and after fix
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3. Fix import/export mismatches for all 10 files

  - [ ] 3.1 Fix AppliedJobs.jsx Button import
    - Change `import Button from '@/shared/ui'` to `import { Button } from '@/shared/ui'`
    - Verify @/shared/ui/index.ts exports Button as named export
    - _Bug_Condition: isBugCondition(importStatement) where importStatement.isDefaultImport AND targetModule.exportsAsNamed for Button from @/shared/ui_
    - _Expected_Behavior: Import statement uses named import syntax matching the named export_
    - _Preservation: Files with correct imports remain unchanged, component functionality preserved_
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ] 3.2 Fix Messages.jsx modal imports
    - Change `import NewEducatorConversationModal from '@/features/messaging'` to `import { NewEducatorConversationModal } from '@/features/messaging'`
    - Change `import NewAdminConversationModal from '@/features/messaging'` to `import { NewAdminConversationModal } from '@/features/messaging'`
    - Verify @/features/messaging/index.ts exports both modals as named exports
    - _Bug_Condition: isBugCondition(importStatement) where importStatement.isDefaultImport AND targetModule.exportsAsNamed for modals from @/features/messaging_
    - _Expected_Behavior: Import statements use named import syntax matching the named exports_
    - _Preservation: Files with correct imports remain unchanged, component functionality preserved_
    - _Requirements: 1.2, 2.2, 3.1_

  - [ ] 3.3 Fix MyClass.tsx component imports
    - Change `import SchoolMyClass from '@/features/myclass'` to `import { SchoolMyClass } from '@/features/myclass'`
    - Change `import CollegeMyClass from '@/features/myclass'` to `import { CollegeMyClass } from '@/features/myclass'`
    - Verify @/features/myclass/index.ts exports both components as named exports
    - _Bug_Condition: isBugCondition(importStatement) where importStatement.isDefaultImport AND targetModule.exportsAsNamed for MyClass components_
    - _Expected_Behavior: Import statements use named import syntax matching the named exports_
    - _Preservation: Files with correct imports remain unchanged, component functionality preserved_
    - _Requirements: 1.3, 2.3, 3.1_

  - [ ] 3.4 Fix AchievementsPage.jsx component imports
    - Change `import AchievementsExpanded from '@/features/student-profile'` to `import { AchievementsExpanded } from '@/features/student-profile'`
    - Change `import SkillTrackerExpanded from '@/features/student-profile'` to `import { SkillTrackerExpanded } from '@/features/student-profile'`
    - Verify @/features/student-profile/index.ts exports both components as named exports
    - _Bug_Condition: isBugCondition(importStatement) where importStatement.isDefaultImport AND targetModule.exportsAsNamed for student-profile components_
    - _Expected_Behavior: Import statements use named import syntax matching the named exports_
    - _Preservation: Files with correct imports remain unchanged, component functionality preserved_
    - _Requirements: 1.4, 2.4, 3.1_

  - [ ] 3.5 Fix DynamicAssessment.jsx UI component imports
    - Verify current import paths for AlertDialog and RadioGroup
    - Check @/shared/ui/index.ts for actual export paths
    - If components are not re-exported in index, import from specific subdirectories
    - Update import statements to reference correct module paths
    - _Bug_Condition: isBugCondition(importStatement) where importStatement.importPath NOT IN targetModule.exports for AlertDialog and RadioGroup_
    - _Expected_Behavior: Import statements reference correct module paths where components are exported_
    - _Preservation: Files with correct imports remain unchanged, component functionality preserved_
    - _Requirements: 1.5, 2.5, 3.1_

  - [ ] 3.6 Fix Settings.jsx MainSettings import
    - Change `import MainSettings from '@/features/student-profile'` to `import { MainSettings } from '@/features/student-profile'`
    - Verify @/features/student-profile/index.ts exports MainSettings as named export
    - _Bug_Condition: isBugCondition(importStatement) where importStatement.isDefaultImport AND targetModule.exportsAsNamed for MainSettings_
    - _Expected_Behavior: Import statement uses named import syntax matching the named export_
    - _Preservation: Files with correct imports remain unchanged, component functionality preserved_
    - _Requirements: 1.6, 2.6, 3.1_

  - [ ] 3.7 Fix ProgramSectionsPage.tsx modal import
    - Change `import ManageProgramStudentsModal from '@/features/college-admin'` to `import { ManageProgramStudentsModal } from '@/features/college-admin'`
    - Verify @/features/college-admin/index.ts exports ManageProgramStudentsModal as named export
    - _Bug_Condition: isBugCondition(importStatement) where importStatement.isDefaultImport AND targetModule.exportsAsNamed for ManageProgramStudentsModal_
    - _Expected_Behavior: Import statement uses named import syntax matching the named export_
    - _Preservation: Files with correct imports remain unchanged, component functionality preserved_
    - _Requirements: 1.7, 2.7, 3.1_

  - [ ] 3.8 Fix ClassesPage.tsx hook and modal imports
    - Locate correct export path for useClasses hook (check @/features/educator or @/shared/lib/hooks)
    - Locate correct export path for useEducatorId hook
    - Update import statements to reference correct paths
    - Change `import ManageStudentsModal from [path]` to `import { ManageStudentsModal } from [path]`
    - Verify all imports match actual exports in target modules
    - _Bug_Condition: isBugCondition(importStatement) where importStatement.importPath NOT IN targetModule.exports for hooks, AND importStatement.isDefaultImport for ManageStudentsModal_
    - _Expected_Behavior: Import statements reference correct module paths and use correct syntax_
    - _Preservation: Files with correct imports remain unchanged, component functionality preserved_
    - _Requirements: 1.8, 1.9, 2.8, 2.9, 3.1_

  - [ ] 3.9 Fix useNotificationBroadcast file extension
    - Rename src/hooks/useNotificationBroadcast.ts to src/hooks/useNotificationBroadcast.tsx
    - Verify file contains JSX syntax requiring .tsx extension
    - Update any import statements referencing this file (if needed)
    - _Bug_Condition: isBugCondition(file) where file.extension == '.ts' AND fileContainsJSX_
    - _Expected_Behavior: Files containing JSX use .tsx extension_
    - _Preservation: Files with correct extensions remain unchanged, hook functionality preserved_
    - _Requirements: 1.10, 2.10, 3.4_

  - [ ] 3.10 Run build and identify any additional import errors
    - Run `npm run build:dev` after fixing files 1-9
    - Document any remaining import/export errors
    - Apply same fix pattern: verify export type, update import syntax to match
    - Continue until build succeeds with zero errors
    - _Bug_Condition: Any remaining isBugCondition(importStatement) cases_
    - _Expected_Behavior: All imports match exports, build completes successfully_
    - _Preservation: Files with correct imports remain unchanged_
    - _Requirements: All requirements from bugfix.md_

  - [ ] 3.11 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - All Imports Match Exports
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (imports matching exports)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run `npm run build:dev` on FIXED code
    - **EXPECTED OUTCOME**: Build succeeds with zero errors (confirms bug is fixed)
    - Verify all 10 import mismatches are resolved
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ] 3.12 Verify preservation tests still pass
    - **Property 2: Preservation** - Correct Imports and Component Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify files without import errors remain unchanged
    - Run application and test affected components in UI
    - Test navigation to each affected page (AppliedJobs, Messages, MyClass, Achievements, DynamicAssessment, Settings, ProgramSections, Classes)
    - Verify modals open correctly (NewEducatorConversationModal, NewAdminConversationModal, ManageProgramStudentsModal, ManageStudentsModal)
    - Verify UI components render correctly (Button, AlertDialog, RadioGroup)
    - Verify no console errors or missing component warnings
    - **EXPECTED OUTCOME**: All tests pass, no regressions (confirms preservation)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run `npm run build:dev` - verify zero errors
  - Run application - verify all affected pages load correctly
  - Verify all component functionality works identically to before the fix
  - Ask the user if questions arise
