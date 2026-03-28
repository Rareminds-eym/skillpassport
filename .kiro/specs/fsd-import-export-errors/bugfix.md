# Bugfix Requirements Document

## Introduction

After the FSD (Feature-Sliced Design) migration, multiple build errors are occurring due to import/export type mismatches. Components are attempting to use default imports when the exports are named, or importing items that are not exported from the specified modules. These errors prevent the build from completing and are blocking development. This bugfix will systematically correct all import/export mismatches to restore build functionality while preserving existing behavior for correctly configured imports.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN AppliedJobs.jsx imports Button using default import from @/shared/ui THEN the build fails because Button is exported as a named export

1.2 WHEN Messages.jsx imports NewEducatorConversationModal and NewAdminConversationModal using default imports from @/features/messaging THEN the build fails because these components are exported as named exports

1.3 WHEN MyClass.tsx imports SchoolMyClass and CollegeMyClass using default imports from @/features/myclass THEN the build fails because these components are exported as named exports

1.4 WHEN AchievementsPage.jsx imports AchievementsExpanded and SkillTrackerExpanded using default imports from @/features/student-profile THEN the build fails because these components are exported as named exports

1.5 WHEN DynamicAssessment.jsx imports AlertDialog and RadioGroup from @/shared/ui THEN the build fails because these components are not exported from that module

1.6 WHEN Settings.jsx imports MainSettings using default import from @/features/student-profile THEN the build fails because MainSettings is exported as a named export

1.7 WHEN ProgramSectionsPage.tsx imports ManageProgramStudentsModal using default import from @/features/college-admin THEN the build fails because ManageProgramStudentsModal is exported as a named export

1.8 WHEN ClassesPage.tsx imports useClasses and useEducatorId from incorrect module paths THEN the build fails because these hooks are not exported from the specified locations

1.9 WHEN ClassesPage.tsx imports ManageStudentsModal using default import THEN the build fails because ManageStudentsModal is exported as a named export

1.10 WHEN useNotificationBroadcast.ts contains JSX syntax THEN the build fails because .ts files cannot contain JSX syntax

### Expected Behavior (Correct)

2.1 WHEN AppliedJobs.jsx imports Button from @/shared/ui THEN the system SHALL use named import syntax `import { Button } from '@/shared/ui'`

2.2 WHEN Messages.jsx imports NewEducatorConversationModal and NewAdminConversationModal from @/features/messaging THEN the system SHALL use named import syntax for both components

2.3 WHEN MyClass.tsx imports SchoolMyClass and CollegeMyClass from @/features/myclass THEN the system SHALL use named import syntax for both components

2.4 WHEN AchievementsPage.jsx imports AchievementsExpanded and SkillTrackerExpanded from @/features/student-profile THEN the system SHALL use named import syntax for both components

2.5 WHEN DynamicAssessment.jsx needs AlertDialog and RadioGroup THEN the system SHALL import them from the correct module path where they are exported

2.6 WHEN Settings.jsx imports MainSettings from @/features/student-profile THEN the system SHALL use named import syntax `import { MainSettings } from '@/features/student-profile'`

2.7 WHEN ProgramSectionsPage.tsx imports ManageProgramStudentsModal from @/features/college-admin THEN the system SHALL use named import syntax `import { ManageProgramStudentsModal } from '@/features/college-admin'`

2.8 WHEN ClassesPage.tsx imports useClasses and useEducatorId THEN the system SHALL import them from the correct module paths where they are exported

2.9 WHEN ClassesPage.tsx imports ManageStudentsModal THEN the system SHALL use named import syntax for the component

2.10 WHEN a file contains JSX syntax THEN the system SHALL use .tsx or .jsx file extension, not .ts

### Unchanged Behavior (Regression Prevention)

3.1 WHEN files import components using correct named import syntax THEN the system SHALL CONTINUE TO build successfully without modification

3.2 WHEN files import components using correct default import syntax where default exports exist THEN the system SHALL CONTINUE TO build successfully without modification

3.3 WHEN files use correct module paths that match the FSD structure THEN the system SHALL CONTINUE TO resolve imports correctly

3.4 WHEN .tsx files contain JSX syntax THEN the system SHALL CONTINUE TO compile successfully

3.5 WHEN components are correctly exported as named exports from index files THEN the system SHALL CONTINUE TO make them available for import

3.6 WHEN the build process runs with `npm run build:dev` THEN the system SHALL CONTINUE TO report any remaining import/export errors accurately
