# Requirements Document: FSD Phase 7 - Remaining File Migration

## Introduction

This specification completes the Feature-Sliced Design (FSD) architectural migration by migrating the remaining 270 unmigrated files (44.3% of backup) from `.migration-backups/legacy-final-backup-2026-03-23-173634/` to the appropriate FSD structure. Phase 6 was marked complete but left these files in backup. The migration will organize files into features/, entities/, shared/, widgets/, and app/ layers following FSD principles.

## Glossary

- **FSD**: Feature-Sliced Design - architectural methodology organizing code by business features and technical layers
- **Migration_System**: The automated tooling and processes that move files from backup to FSD structure
- **Backup_Directory**: `.migration-backups/legacy-final-backup-2026-03-23-173634/` containing 270 unmigrated files
- **FSD_Layer**: One of the architectural layers (app/, pages/, widgets/, features/, entities/, shared/)
- **Feature_Module**: A business feature directory containing ui/, model/, api/, lib/ subdirectories
- **Public_API**: The index.ts file that exports a module's public interface
- **Import_Path**: The reference path used to import code (e.g., @/features/auth)
- **Layer_Hierarchy**: The dependency rule where higher layers can import from lower layers only
- **Shadcn_Component**: UI components from the shadcn/ui library located in components/ui/
- **Service_File**: API integration code that communicates with backend services
- **Hook_File**: React hooks providing state management and side effects
- **Test_File**: Unit or integration test files with .test.js or .spec.js extensions
- **Round_Trip**: The property that parsing then printing then parsing produces equivalent output

## Requirements

### Requirement 1: Migrate MyClass Feature Files

**User Story:** As a developer, I want MyClass feature files migrated from backup to features/myclass/, so that the MyClass functionality is available in the FSD structure.

#### Acceptance Criteria

1. THE Migration_System SHALL create features/myclass/ directory structure with ui/, model/, api/, lib/ subdirectories
2. WHEN migrating tab components from backup components/Myclass/Tabs/, THE Migration_System SHALL move them to features/myclass/ui/tabs/
3. WHEN migrating common components from backup components/Myclass/common/, THE Migration_System SHALL move them to features/myclass/ui/
4. WHEN migrating modal components from backup components/Myclass/components/, THE Migration_System SHALL move them to features/myclass/ui/modals/
5. WHEN migrating hooks from backup components/Myclass/hooks/, THE Migration_System SHALL move them to features/myclass/model/
6. WHEN migrating utilities from backup components/Myclass/utils/, THE Migration_System SHALL move them to features/myclass/lib/
7. THE Migration_System SHALL create features/myclass/index.ts exporting the public API
8. FOR ALL migrated MyClass files, THE Migration_System SHALL update internal import paths to use @/features/myclass

### Requirement 2: Migrate Student Dashboard Files

**User Story:** As a developer, I want Student Dashboard files migrated from backup to widgets/student-dashboard/, so that the student dashboard functionality is available in the FSD structure.

#### Acceptance Criteria

1. THE Migration_System SHALL create widgets/student-dashboard/ directory structure with ui/, model/ subdirectories
2. WHEN migrating components from backup components/Students/components/, THE Migration_System SHALL move them to widgets/student-dashboard/ui/
3. WHEN migrating shadcn components from backup components/Students/components/ui/, THE Migration_System SHALL move them to shared/ui/
4. WHEN migrating settings tabs from backup components/Students/components/SettingsTabs/, THE Migration_System SHALL move them to widgets/student-dashboard/ui/settings/
5. WHEN migrating profile modals from backup components/Students/components/ProfileEditModals/, THE Migration_System SHALL move them to widgets/student-dashboard/ui/modals/
6. WHEN migrating mock data from backup components/Students/data/, THE Migration_System SHALL move it to widgets/student-dashboard/model/
7. THE Migration_System SHALL create widgets/student-dashboard/index.ts exporting the public API
8. FOR ALL migrated Student Dashboard files, THE Migration_System SHALL update internal import paths to use @/widgets/student-dashboard or @/shared/ui

### Requirement 3: Migrate Homepage Marketing Files

**User Story:** As a developer, I want Homepage marketing files migrated from backup to shared/ui/marketing/, so that marketing components are available in the FSD structure.

#### Acceptance Criteria

1. THE Migration_System SHALL create shared/ui/marketing/ directory if it does not exist
2. WHEN migrating marketing components from backup components/Homepage/, THE Migration_System SHALL move them to shared/ui/marketing/
3. WHEN migrating gradient-bar component from backup components/Homepage/ui/gradient-bar/, THE Migration_System SHALL move it to shared/ui/marketing/
4. WHEN migrating orbit-timeline components from backup components/Homepage/ui/orbit-timeline/, THE Migration_System SHALL move them to shared/ui/marketing/
5. WHEN migrating warp-background components from backup components/Homepage/ui/warp-background/, THE Migration_System SHALL move them to shared/ui/marketing/
6. THE Migration_System SHALL update shared/ui/index.ts to export marketing components
7. FOR ALL migrated Homepage files, THE Migration_System SHALL update internal import paths to use @/shared/ui/marketing

### Requirement 4: Migrate Recruiter Pipeline Files

**User Story:** As a developer, I want Recruiter Pipeline files migrated from backup to features/recruiter-pipeline/, so that recruiter functionality is available in the FSD structure.

#### Acceptance Criteria

1. THE Migration_System SHALL create features/recruiter-pipeline/ directory structure with ui/, model/, api/, lib/ subdirectories
2. WHEN migrating recruiter components from backup components/Recruiter/components/, THE Migration_System SHALL move them to features/recruiter-pipeline/ui/
3. WHEN migrating pipeline components from backup components/Recruiter/components/pipeline/, THE Migration_System SHALL move them to features/recruiter-pipeline/ui/pipeline/
4. WHEN migrating project components from backup components/Recruiter/Projects/components/, THE Migration_System SHALL move them to features/recruiter-pipeline/ui/
5. WHEN migrating modals from backup components/Recruiter/modals/, THE Migration_System SHALL move them to features/recruiter-pipeline/ui/modals/
6. THE Migration_System SHALL create features/recruiter-pipeline/index.ts exporting the public API
7. FOR ALL migrated Recruiter files, THE Migration_System SHALL update internal import paths to use @/features/recruiter-pipeline

### Requirement 5: Migrate Assessment Test UI Files

**User Story:** As a developer, I want Assessment Test UI files migrated from backup to features/assessment/ui/, so that assessment test components are available in the FSD structure.

#### Acceptance Criteria

1. WHEN migrating assessment components from backup components/assessment/, THE Migration_System SHALL move them to features/assessment/ui/
2. WHEN migrating test UI components from backup components/assessment/test/, THE Migration_System SHALL move them to features/assessment/ui/test/
3. THE Migration_System SHALL update features/assessment/index.ts to export newly migrated components
4. FOR ALL migrated Assessment files, THE Migration_System SHALL update internal import paths to use @/features/assessment

### Requirement 6: Migrate Educator Components

**User Story:** As a developer, I want Educator components migrated from backup to features/educator/, so that educator functionality is available in the FSD structure.

#### Acceptance Criteria

1. THE Migration_System SHALL create features/educator/ directory structure with ui/, model/, api/, lib/ subdirectories
2. WHEN migrating educator components from backup components/educator/, THE Migration_System SHALL move them to features/educator/ui/
3. WHEN migrating educator modals from backup components/educator/modals/, THE Migration_System SHALL move them to features/educator/ui/modals/
4. THE Migration_System SHALL create features/educator/index.ts exporting the public API
5. FOR ALL migrated Educator files, THE Migration_System SHALL update internal import paths to use @/features/educator

### Requirement 7: Migrate Admin Components

**User Story:** As a developer, I want Admin components migrated from backup to features/admin/, so that admin functionality is available in the FSD structure.

#### Acceptance Criteria

1. THE Migration_System SHALL create features/admin/ directory structure with ui/, model/, api/, lib/ subdirectories
2. WHEN migrating admin components from backup components/admin/, THE Migration_System SHALL move them to features/admin/ui/
3. WHEN migrating admin subcomponents from backup components/admin/components/, THE Migration_System SHALL move them to features/admin/ui/
4. WHEN migrating course modals from backup components/admin/courses/, THE Migration_System SHALL move them to features/admin/ui/modals/
5. WHEN migrating admin modals from backup components/admin/modals/, THE Migration_System SHALL move them to features/admin/ui/modals/
6. THE Migration_System SHALL create features/admin/index.ts exporting the public API
7. FOR ALL migrated Admin files, THE Migration_System SHALL update internal import paths to use @/features/admin

### Requirement 8: Migrate Subscription Components

**User Story:** As a developer, I want Subscription components migrated from backup to features/subscription/, so that subscription functionality is available in the FSD structure.

#### Acceptance Criteria

1. WHEN features/subscription/ already exists, THE Migration_System SHALL merge backup files into existing structure
2. WHEN migrating subscription components from backup components/Subscription/, THE Migration_System SHALL move them to features/subscription/ui/
3. WHEN migrating organization shared components from backup components/Subscription/Organization/shared/, THE Migration_System SHALL move them to features/subscription/ui/organization/
4. WHEN migrating subscription tests from backup components/Subscription/__tests__/, THE Migration_System SHALL move them to features/subscription/__tests__/
5. THE Migration_System SHALL update features/subscription/index.ts to export newly migrated components
6. FOR ALL migrated Subscription files, THE Migration_System SHALL update internal import paths to use @/features/subscription

### Requirement 9: Migrate Service Files and Tests

**User Story:** As a developer, I want service files migrated from backup to appropriate feature api/ directories, so that API integration code is organized by feature.

#### Acceptance Criteria

1. WHEN migrating service files from backup services/, THE Migration_System SHALL classify each service by feature ownership
2. WHEN a service belongs to a specific feature, THE Migration_System SHALL move it to features/{feature}/api/
3. WHEN a service is shared across features, THE Migration_System SHALL move it to shared/api/
4. WHEN migrating service tests from backup services/__tests__/, THE Migration_System SHALL move them to the same directory as their corresponding service
5. THE Migration_System SHALL update service import paths across the codebase to use feature public APIs
6. THE Migration_System SHALL create or update index.ts files in api/ directories to export services
7. FOR ALL service files, THE Migration_System SHALL preserve the original file content exactly

### Requirement 10: Migrate Miscellaneous Components

**User Story:** As a developer, I want miscellaneous components migrated from backup to appropriate FSD locations, so that all remaining files are organized correctly.

#### Acceptance Criteria

1. WHEN migrating root components from backup components/, THE Migration_System SHALL classify each by purpose (shared UI, feature-specific, or widget)
2. WHEN a root component is shared UI, THE Migration_System SHALL move it to shared/ui/
3. WHEN a root component is feature-specific, THE Migration_System SHALL move it to the appropriate features/{feature}/ui/
4. WHEN migrating StudentMessaging component from backup components/StudentMessaging/, THE Migration_System SHALL move it to features/messaging/ui/
5. WHEN migrating common components from backup components/common/, THE Migration_System SHALL move them to shared/ui/
6. WHEN migrating student components from backup components/student/, THE Migration_System SHALL move them to entities/student/ui/
7. WHEN migrating modals from backup components/modals/, THE Migration_System SHALL classify by feature and move to appropriate features/{feature}/ui/modals/
8. WHEN migrating organization guard from backup components/organization/, THE Migration_System SHALL move it to features/subscription/lib/ or shared/lib/guards/
9. FOR ALL miscellaneous files, THE Migration_System SHALL update import paths to use appropriate FSD public APIs

### Requirement 11: Validate Migration Completeness

**User Story:** As a developer, I want migration completeness validated, so that I can confirm all 270 files have been successfully migrated.

#### Acceptance Criteria

1. WHEN migration is complete, THE Migration_System SHALL scan the Backup_Directory for remaining files
2. THE Migration_System SHALL generate a report listing migrated file count and remaining file count
3. IF remaining files exist in Backup_Directory, THEN THE Migration_System SHALL list them with their original paths
4. THE Migration_System SHALL verify that all migrated files exist in their target FSD locations
5. THE Migration_System SHALL verify that migrated file content matches original backup file content
6. THE Migration_System SHALL calculate migration completion percentage as (migrated files / total files) * 100

### Requirement 12: Update Import Paths

**User Story:** As a developer, I want import paths updated across the codebase, so that all references point to the new FSD locations.

#### Acceptance Criteria

1. WHEN a file is migrated, THE Migration_System SHALL scan the entire codebase for imports of that file
2. THE Migration_System SHALL replace legacy import paths with FSD public API imports
3. THE Migration_System SHALL update imports to use @/features/{feature}, @/widgets/{widget}, @/shared/{module}, or @/entities/{entity} patterns
4. THE Migration_System SHALL preserve import statement structure (named imports, default imports, type imports)
5. WHEN updating imports in migrated files, THE Migration_System SHALL update relative imports to absolute FSD imports
6. THE Migration_System SHALL verify zero legacy import paths remain after migration

### Requirement 13: Maintain FSD Layer Hierarchy

**User Story:** As a developer, I want FSD layer hierarchy enforced, so that the architecture remains compliant with FSD principles.

#### Acceptance Criteria

1. WHEN placing files in features/ layer, THE Migration_System SHALL ensure they only import from entities/ and shared/ layers
2. WHEN placing files in widgets/ layer, THE Migration_System SHALL ensure they only import from features/, entities/, and shared/ layers
3. WHEN placing files in entities/ layer, THE Migration_System SHALL ensure they only import from shared/ layer
4. WHEN placing files in shared/ layer, THE Migration_System SHALL ensure they do not import from any higher layers
5. IF a file violates Layer_Hierarchy rules, THEN THE Migration_System SHALL report the violation with file path and violating import
6. THE Migration_System SHALL prevent features from importing from other features directly

### Requirement 14: Create Public APIs

**User Story:** As a developer, I want public APIs created for all migrated modules, so that module interfaces are clearly defined.

#### Acceptance Criteria

1. WHEN creating a new feature directory, THE Migration_System SHALL create features/{feature}/index.ts
2. WHEN creating a new widget directory, THE Migration_System SHALL create widgets/{widget}/index.ts
3. THE Public_API file SHALL export all components, hooks, services, and utilities intended for external use
4. THE Public_API file SHALL not export internal implementation details
5. WHEN migrating to an existing feature, THE Migration_System SHALL update the existing index.ts to include new exports
6. THE Migration_System SHALL organize exports by category (UI components, hooks, services, utilities)

### Requirement 15: Preserve File Content and Metadata

**User Story:** As a developer, I want file content and metadata preserved during migration, so that no code or history is lost.

#### Acceptance Criteria

1. WHEN migrating a file, THE Migration_System SHALL copy the exact file content without modification
2. THE Migration_System SHALL preserve file permissions during migration
3. THE Migration_System SHALL preserve file timestamps where possible
4. IF a file already exists at the target location, THEN THE Migration_System SHALL report a conflict and skip migration
5. THE Migration_System SHALL create a migration log recording source path, target path, and timestamp for each file
6. FOR ALL migrated files, parsing then printing then parsing SHALL produce equivalent output (round-trip property)

### Requirement 16: Handle TypeScript Compilation

**User Story:** As a developer, I want TypeScript compilation to succeed after migration, so that the codebase remains type-safe.

#### Acceptance Criteria

1. WHEN migration is complete, THE Migration_System SHALL run TypeScript compiler
2. IF TypeScript compilation fails, THEN THE Migration_System SHALL report all type errors with file paths and line numbers
3. THE Migration_System SHALL verify that import path updates resolve correctly in TypeScript
4. THE Migration_System SHALL verify that all type imports are updated to new FSD locations
5. WHEN type errors exist, THE Migration_System SHALL categorize them by error type (missing import, type mismatch, etc.)

### Requirement 17: Validate Application Functionality

**User Story:** As a developer, I want application functionality validated after migration, so that I can confirm no features are broken.

#### Acceptance Criteria

1. WHEN migration is complete, THE Migration_System SHALL recommend running the development server
2. THE Migration_System SHALL provide a checklist of features to manually test
3. THE Migration_System SHALL recommend running the test suite
4. IF tests fail, THEN THE Migration_System SHALL report which tests failed and their error messages
5. THE Migration_System SHALL verify that all pages render without console errors

### Requirement 18: Generate Migration Report

**User Story:** As a developer, I want a migration report generated, so that I can review what was migrated and identify any issues.

#### Acceptance Criteria

1. WHEN migration is complete, THE Migration_System SHALL generate a migration report
2. THE migration report SHALL include total files migrated, organized by category (MyClass, Student Dashboard, etc.)
3. THE migration report SHALL include total import paths updated
4. THE migration report SHALL list any files that could not be migrated with reasons
5. THE migration report SHALL include before/after directory structure comparison
6. THE migration report SHALL include FSD compliance percentage
7. THE migration report SHALL list any layer hierarchy violations detected
8. THE migration report SHALL provide next steps for completing the migration

