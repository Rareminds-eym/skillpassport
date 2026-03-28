# Implementation Plan: FSD Phase 7 - Remaining File Migration

## Overview

This plan implements the complete migration of 270 remaining files from `.migration-backups/legacy-final-backup-2026-03-23-173634/` to the FSD structure. The implementation follows a 7-phase execution plan: Analysis & Classification, Directory Structure Creation, File Migration by Category (10 categories), Public API Creation, Import Path Updates, Validation & Verification, and Cleanup & Reporting.

## Tasks

- [x] 1. Phase 1: Analysis and Classification
  - [x] 1.1 Create file classification script
    - Implement FileClassifier with classifyFile(), determineLayer(), determineFeature() methods
    - Implement multi-factor scoring system (pathPattern: 0.4, importAnalysis: 0.3, usageAnalysis: 0.2, namingConvention: 0.1)
    - Add confidence scoring and conservative classification for scores < 0.7
    - _Requirements: 9.1, 10.1_
  
  - [x] 1.2 Implement file analysis functions
    - Create analyzeFile() to extract imports, exports, and content patterns
    - Implement extractImports() and extractExports() using AST parsing
    - Add hasBusinessLogic, composesMultipleFeatures, isSharedUtility detection
    - _Requirements: 9.1_
  
  - [x] 1.3 Run classification on all 270 backup files
    - Scan `.migration-backups/legacy-final-backup-2026-03-23-173634/` directory
    - Generate FileClassification for each file with target location
    - Output classification report with confidence scores
    - Identify files requiring manual review (confidence < 0.7)
    - _Requirements: 9.1, 10.1, 11.1_

- [x] 2. Phase 2: Directory Structure Creation
  - [x] 2.1 Extract target directories from classification report
    - Parse classification results to get unique target paths
    - Generate list of directories to create (features/, widgets/, shared/ subdirectories)
    - _Requirements: 1.1, 6.1, 7.1_
  
  - [x] 2.2 Create FSD directory structures
    - Create features/myclass/ with ui/, model/, api/, lib/ subdirectories
    - Create features/educator/ with ui/, model/, api/, lib/ subdirectories
    - Create features/admin/ with ui/, model/, api/, lib/ subdirectories
    - Create features/recruiter-pipeline/ with ui/, model/, api/, lib/ subdirectories
    - Create widgets/student-dashboard/ with ui/, model/ subdirectories
    - Create shared/ui/marketing/ directory
    - Verify all directories created successfully
    - _Requirements: 1.1, 2.1, 6.1, 7.1_

- [x] 3. Phase 3: File Migration - Category 1 (MyClass Feature)
  - [x] 3.1 Migrate MyClass tab components
    - Move components/Myclass/Tabs/* to features/myclass/ui/tabs/
    - Preserve file content exactly (byte-for-byte)
    - Verify content preservation after migration
    - _Requirements: 1.2, 11.5, 15.1_
  
  - [x] 3.2 Migrate MyClass common components
    - Move components/Myclass/common/* to features/myclass/ui/
    - Preserve file content and metadata
    - _Requirements: 1.3, 15.1, 15.2_
  
  - [x] 3.3 Migrate MyClass modal components
    - Move components/Myclass/components/* to features/myclass/ui/modals/
    - Preserve file content exactly
    - _Requirements: 1.4, 15.1_
  
  - [x] 3.4 Migrate MyClass hooks
    - Move components/Myclass/hooks/* to features/myclass/model/
    - Preserve file content exactly
    - _Requirements: 1.5, 15.1_
  
  - [x] 3.5 Migrate MyClass utilities
    - Move components/Myclass/utils/* to features/myclass/lib/
    - Preserve file content exactly
    - _Requirements: 1.6, 15.1_

- [x] 4. Phase 3: File Migration - Category 2 (Educator Components)
  - [x] 4.1 Migrate educator components
    - Move components/educator/* to features/educator/ui/
    - Preserve file content exactly
    - _Requirements: 6.2, 15.1_
  
  - [x] 4.2 Migrate educator modals
    - Move components/educator/modals/* to features/educator/ui/modals/
    - Preserve file content exactly
    - _Requirements: 6.3, 15.1_

- [x] 5. Phase 3: File Migration - Category 3 (Admin Components)
  - [x] 5.1 Migrate admin root components
    - Move components/admin/* (root level) to features/admin/ui/
    - Preserve file content exactly
    - _Requirements: 7.2, 15.1_
  
  - [x] 5.2 Migrate admin subcomponents
    - Move components/admin/components/* to features/admin/ui/
    - Preserve file content exactly
    - _Requirements: 7.3, 15.1_
  
  - [x] 5.3 Migrate admin course modals
    - Move components/admin/courses/* to features/admin/ui/modals/
    - Preserve file content exactly
    - _Requirements: 7.4, 15.1_
  
  - [x] 5.4 Migrate admin modals
    - Move components/admin/modals/* to features/admin/ui/modals/
    - Preserve file content exactly
    - _Requirements: 7.5, 15.1_

- [x] 6. Phase 3: File Migration - Category 4 (Recruiter Pipeline)
  - [x] 6.1 Migrate recruiter components
    - Move components/Recruiter/components/* to features/recruiter-pipeline/ui/
    - Preserve file content exactly
    - _Requirements: 4.2, 15.1_
  
  - [x] 6.2 Migrate recruiter pipeline components
    - Move components/Recruiter/components/pipeline/* to features/recruiter-pipeline/ui/pipeline/
    - Preserve file content exactly
    - _Requirements: 4.3, 15.1_
  
  - [x] 6.3 Migrate recruiter project components
    - Move components/Recruiter/Projects/components/* to features/recruiter-pipeline/ui/
    - Preserve file content exactly
    - _Requirements: 4.4, 15.1_
  
  - [x] 6.4 Migrate recruiter modals
    - Move components/Recruiter/modals/* to features/recruiter-pipeline/ui/modals/
    - Preserve file content exactly
    - _Requirements: 4.5, 15.1_

- [x] 7. Phase 3: File Migration - Category 5 (Assessment Test UI)
  - [x] 7.1 Migrate assessment components
    - Move components/assessment/* to features/assessment/ui/
    - Preserve file content exactly
    - _Requirements: 5.1, 15.1_
  
  - [x] 7.2 Migrate assessment test components
    - Move components/assessment/test/* to features/assessment/ui/test/
    - Preserve file content exactly
    - _Requirements: 5.2, 15.1_

- [x] 8. Phase 3: File Migration - Category 6 (Student Dashboard)
  - [x] 8.1 Migrate student dashboard components
    - Move components/Students/components/* to widgets/student-dashboard/ui/
    - Exclude shadcn components (components/Students/components/ui/*)
    - Preserve file content exactly
    - _Requirements: 2.2, 15.1_
  
  - [x] 8.2 Migrate shadcn components to shared
    - Move components/Students/components/ui/* to shared/ui/
    - Preserve file content exactly
    - _Requirements: 2.3, 15.1_
  
  - [x] 8.3 Migrate settings tabs
    - Move components/Students/components/SettingsTabs/* to widgets/student-dashboard/ui/settings/
    - Preserve file content exactly
    - _Requirements: 2.4, 15.1_
  
  - [x] 8.4 Migrate profile modals
    - Move components/Students/components/ProfileEditModals/* to widgets/student-dashboard/ui/modals/
    - Preserve file content exactly
    - _Requirements: 2.5, 15.1_
  
  - [x] 8.5 Migrate mock data
    - Move components/Students/data/* to widgets/student-dashboard/model/
    - Preserve file content exactly
    - _Requirements: 2.6, 15.1_

- [x] 9. Phase 3: File Migration - Category 7 (Homepage Marketing)
  - [x] 9.1 Migrate homepage marketing components
    - Move components/Homepage/* to shared/ui/marketing/
    - Preserve file content exactly
    - _Requirements: 3.2, 15.1_
  
  - [x] 9.2 Migrate gradient-bar component
    - Move components/Homepage/ui/gradient-bar/* to shared/ui/marketing/
    - Preserve file content exactly
    - _Requirements: 3.3, 15.1_
  
  - [x] 9.3 Migrate orbit-timeline components
    - Move components/Homepage/ui/orbit-timeline/* to shared/ui/marketing/
    - Preserve file content exactly
    - _Requirements: 3.4, 15.1_
  
  - [x] 9.4 Migrate warp-background components
    - Move components/Homepage/ui/warp-background/* to shared/ui/marketing/
    - Preserve file content exactly
    - _Requirements: 3.5, 15.1_

- [x] 10. Phase 3: File Migration - Category 8 (Subscription Components)
  - [x] 10.1 Migrate subscription components
    - Move components/Subscription/* to features/subscription/ui/
    - Merge with existing features/subscription/ structure
    - Preserve file content exactly
    - _Requirements: 8.2, 15.1_
  
  - [x] 10.2 Migrate organization shared components
    - Move components/Subscription/Organization/shared/* to features/subscription/ui/organization/
    - Preserve file content exactly
    - _Requirements: 8.3, 15.1_
  
  - [x] 10.3 Migrate subscription tests
    - Move components/Subscription/__tests__/* to features/subscription/__tests__/
    - Preserve file content exactly
    - _Requirements: 8.4, 15.1_

- [-] 11. Phase 3: File Migration - Category 9 (Service Files)
  - [x] 11.1 Classify service files by feature ownership
    - Analyze each service in services/* directory
    - Determine if service is feature-specific (1 feature) or shared (2+ features)
    - Generate service classification mapping
    - _Requirements: 9.1, 11.1_
  
  - [x] 11.2 Migrate feature-specific services
    - Move services used by single feature to features/{feature}/api/
    - Preserve file content exactly
    - _Requirements: 9.2, 15.1_
  
  - [x] 11.3 Migrate shared services
    - Move services used by multiple features to shared/api/
    - Preserve file content exactly
    - _Requirements: 9.3, 15.1_
  
  - [x] 11.4 Migrate service tests
    - Move services/__tests__/* to same directory as corresponding service
    - Preserve file content exactly
    - _Requirements: 9.4, 15.1_

- [-] 12. Phase 3: File Migration - Category 10 (Miscellaneous Components)
  - [x] 12.1 Classify miscellaneous root components
    - Analyze components/* (root level) for purpose
    - Determine if shared UI, feature-specific, or widget
    - Generate classification mapping
    - _Requirements: 10.1_
  
  - [x] 12.2 Migrate shared UI components
    - Move shared UI components to shared/ui/
    - Preserve file content exactly
    - _Requirements: 10.2, 15.1_
  
  - [x] 12.3 Migrate feature-specific components
    - Move feature-specific components to features/{feature}/ui/
    - Preserve file content exactly
    - _Requirements: 10.3, 15.1_
  
  - [x] 12.4 Migrate StudentMessaging component
    - Move components/StudentMessaging/* to features/messaging/ui/
    - Preserve file content exactly
    - _Requirements: 10.4, 15.1_
  
  - [x] 12.5 Migrate common components
    - Move components/common/* to shared/ui/
    - Preserve file content exactly
    - _Requirements: 10.5, 15.1_
  
  - [x] 12.6 Migrate student entity components
    - Move components/student/* to entities/student/ui/
    - Preserve file content exactly
    - _Requirements: 10.6, 15.1_
  
  - [x] 12.7 Migrate modals by feature
    - Classify components/modals/* by feature
    - Move to appropriate features/{feature}/ui/modals/
    - Preserve file content exactly
    - _Requirements: 10.7, 15.1_
  
  - [x] 12.8 Migrate organization guard
    - Move components/organization/* to shared/lib/guards/
    - Preserve file content exactly
    - _Requirements: 10.8, 15.1_

- [x] 13. Checkpoint - Verify file migration completeness
  - Ensure all 270 files migrated successfully
  - Verify content preservation for all files
  - Check for any migration errors or conflicts
  - Ask the user if questions arise

- [ ] 14. Phase 4: Public API Creation
  - [x] 14.1 Create features/myclass/index.ts
    - Export UI components from ./ui, ./ui/tabs, ./ui/modals
    - Export hooks from ./model
    - Export services from ./api
    - Export utilities from ./lib
    - Export types from ./model/types
    - _Requirements: 1.7, 14.1, 14.2_
  
  - [x] 14.2 Create features/educator/index.ts
    - Export UI components from ./ui, ./ui/modals
    - Export hooks from ./model
    - Export services from ./api
    - Export utilities from ./lib
    - _Requirements: 6.4, 14.1, 14.2_
  
  - [x] 14.3 Create features/admin/index.ts
    - Export UI components from ./ui, ./ui/modals
    - Export hooks from ./model
    - Export services from ./api
    - Export utilities from ./lib
    - _Requirements: 7.6, 14.1, 14.2_
  
  - [x] 14.4 Create features/recruiter-pipeline/index.ts
    - Export UI components from ./ui, ./ui/pipeline, ./ui/modals
    - Export hooks from ./model
    - Export services from ./api
    - Export utilities from ./lib
    - _Requirements: 4.6, 14.1, 14.2_
  
  - [x] 14.5 Update features/assessment/index.ts
    - Add exports for newly migrated UI components
    - Add exports from ./ui/test
    - _Requirements: 5.3, 14.5_
  
  - [x] 14.6 Create widgets/student-dashboard/index.ts
    - Export UI components from ./ui, ./ui/settings, ./ui/modals
    - Export hooks from ./model
    - Export types from ./model/types
    - _Requirements: 2.7, 14.1, 14.2_
  
  - [x] 14.7 Update shared/ui/index.ts
    - Add exports for marketing components from ./marketing
    - Add exports for shadcn components
    - Organize exports by category
    - _Requirements: 3.6, 14.5_
  
  - [x] 14.8 Update features/subscription/index.ts
    - Add exports for newly migrated components
    - Add exports from ./ui/organization
    - _Requirements: 8.5, 14.5_
  
  - [x] 14.9 Create/update API index files
    - Create index.ts in features/{feature}/api/ directories
    - Create/update shared/api/index.ts
    - Export all services
    - _Requirements: 9.6, 14.1, 14.2_

- [ ] 15. Phase 5: Import Path Updates
  - [ ] 15.1 Implement import discovery system
    - Create findAllImports() using static analysis, AST parsing, and regex
    - Implement searchByPath(), searchByRelativePaths(), searchByAliases()
    - Add deduplication logic for import references
    - _Requirements: 12.1_
  
  - [ ] 15.2 Generate path mappings for all migrated files
    - Create PathMapping for each migrated file (oldPath → newPath → publicAPIPath)
    - Map legacy paths to FSD public API patterns
    - _Requirements: 12.2, 12.3_
  
  - [ ] 15.3 Update imports for MyClass feature
    - Find all imports of components/Myclass/* paths
    - Transform to @/features/myclass public API imports
    - Preserve import structure (default, named, type imports)
    - Validate import resolution
    - _Requirements: 1.8, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 15.4 Update imports for Educator feature
    - Find all imports of components/educator/* paths
    - Transform to @/features/educator public API imports
    - Validate import resolution
    - _Requirements: 6.5, 12.2, 12.3, 12.4_
  
  - [ ] 15.5 Update imports for Admin feature
    - Find all imports of components/admin/* paths
    - Transform to @/features/admin public API imports
    - Validate import resolution
    - _Requirements: 7.7, 12.2, 12.3, 12.4_
  
  - [ ] 15.6 Update imports for Recruiter Pipeline feature
    - Find all imports of components/Recruiter/* paths
    - Transform to @/features/recruiter-pipeline public API imports
    - Validate import resolution
    - _Requirements: 4.7, 12.2, 12.3, 12.4_
  
  - [ ] 15.7 Update imports for Assessment feature
    - Find all imports of components/assessment/* paths
    - Transform to @/features/assessment public API imports
    - Validate import resolution
    - _Requirements: 5.4, 12.2, 12.3, 12.4_
  
  - [ ] 15.8 Update imports for Student Dashboard widget
    - Find all imports of components/Students/* paths
    - Transform to @/widgets/student-dashboard or @/shared/ui public API imports
    - Validate import resolution
    - _Requirements: 2.8, 12.2, 12.3, 12.4_
  
  - [ ] 15.9 Update imports for Homepage marketing
    - Find all imports of components/Homepage/* paths
    - Transform to @/shared/ui/marketing public API imports
    - Validate import resolution
    - _Requirements: 3.7, 12.2, 12.3, 12.4_
  
  - [ ] 15.10 Update imports for Subscription feature
    - Find all imports of components/Subscription/* paths
    - Transform to @/features/subscription public API imports
    - Validate import resolution
    - _Requirements: 8.6, 12.2, 12.3, 12.4_
  
  - [ ] 15.11 Update imports for service files
    - Find all imports of services/* paths
    - Transform to feature public API or @/shared/api imports
    - Validate import resolution
    - _Requirements: 9.5, 12.2, 12.3, 12.4_
  
  - [ ] 15.12 Update imports for miscellaneous components
    - Find all imports of miscellaneous component paths
    - Transform to appropriate FSD public API imports
    - Validate import resolution
    - _Requirements: 10.9, 12.2, 12.3, 12.4_

- [ ] 16. Checkpoint - Verify import path updates
  - Ensure all legacy import paths updated
  - Verify all imports resolve correctly
  - Check for any broken imports
  - Ask the user if questions arise

- [ ] 17. Phase 6: Validation and Verification
  - [ ] 17.1 Validate migration completeness
    - Scan backup directory for remaining files (should be 0)
    - Generate completeness report with migrated/remaining counts
    - Calculate completion percentage (should be 100%)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 17.2 Validate content preservation
    - Verify all migrated files match original backup content
    - Check file permissions preserved
    - Verify round-trip property (parse → print → parse produces equivalent output)
    - _Requirements: 11.5, 15.1, 15.2, 15.6_
  
  - [ ] 17.3 Validate layer hierarchy compliance
    - Scan all files for imports
    - Check each import follows FSD layer hierarchy rules
    - Detect features importing from other features
    - Generate violation report if any found
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [ ] 17.4 Validate import resolution
    - Verify all imports resolve correctly in TypeScript
    - Check all imports use FSD public API patterns
    - Detect any broken imports
    - _Requirements: 12.6, 16.3, 16.4_
  
  - [ ] 17.5 Validate TypeScript compilation
    - Run TypeScript compiler (tsc --noEmit)
    - Report all type errors with file paths and line numbers
    - Categorize errors by type
    - _Requirements: 16.1, 16.2, 16.5_
  
  - [ ] 17.6 Validate public API completeness
    - Verify all modules have index.ts files
    - Check all public components/hooks/services exported
    - Ensure no internal implementation details exported
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 18. Phase 7: Cleanup and Reporting
  - [ ] 18.1 Generate migration report
    - Include total files migrated by category
    - Include total import paths updated
    - List any files that could not be migrated
    - Include before/after directory structure comparison
    - Calculate FSD compliance percentage
    - List any layer hierarchy violations
    - Provide next steps
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_
  
  - [ ] 18.2 Archive backup directory
    - Create archive of `.migration-backups/legacy-final-backup-2026-03-23-173634/`
    - Verify archive integrity
    - _Requirements: 15.5_
  
  - [ ] 18.3 Clean up temporary migration artifacts
    - Remove temporary classification files
    - Remove migration logs (after archiving)
    - Clean up any temporary directories

- [ ] 19. Final checkpoint - Manual verification
  - Run development server and verify application loads
  - Test key features from each migrated category
  - Run test suite and verify all tests pass
  - Check for console errors
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

## Notes

- All file migrations must preserve content exactly (byte-for-byte)
- Import path updates must preserve import structure (default, named, type imports)
- Each migration category should be validated before proceeding to next
- Checkpoints ensure incremental validation and provide opportunity for user feedback
- TypeScript compilation must succeed with zero errors before completion
- All imports must follow FSD layer hierarchy rules (app > pages > widgets > features > entities > shared)
- Features cannot import from other features directly
