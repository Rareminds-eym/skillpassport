# Implementation Plan: FSD Phase 1 Foundation

## Overview

This plan implements Phase 1 of the Feature-Sliced Design (FSD) migration by creating the shared layer structure and migrating infrastructure components. The migration uses a copy-first strategy to maintain backward compatibility, allowing both old and new import paths to coexist during the transition.

## Tasks

- [x] 1. Create FSD folder structure
  - Create all required directories for the shared layer
  - Verify directory structure matches FSD specification
  - _Requirements: 1.1-1.12_

- [x] 2. Migrate shared UI components
  - [x] 2.1 Copy all UI components from components/ui/ to shared/ui/
    - Copy all .tsx and .ts files preserving filenames and content
    - _Requirements: 2.1, 2.3_
  
  - [x] 2.2 Create shared/ui/index.ts with component exports
    - Generate alphabetically sorted named exports for all UI components
    - _Requirements: 2.2, 12.1, 12.3, 12.4_
  
  - [x] 2.3 Verify internal imports within UI components
    - Check that UI components referencing other UI components still resolve correctly
    - _Requirements: 2.4_
  
  - [ ]* 2.4 Write property test for UI component migration
    - **Property 1: File Copy Preserves Content**
    - **Validates: Requirements 2.1, 2.3**

- [x] 3. Migrate base API client
  - [x] 3.1 Copy Supabase client to shared/api/
    - Copy lib/supabaseClient.ts to shared/api/supabaseClient.ts
    - Preserve all configuration and initialization logic
    - _Requirements: 3.1, 3.3_
  
  - [x] 3.2 Create shared/api/index.ts with client exports
    - Export supabase and supabaseAdmin from supabaseClient
    - _Requirements: 3.2, 12.1, 12.3_
  
  - [ ]* 3.3 Write property test for API client migration
    - **Property 1: File Copy Preserves Content**
    - **Validates: Requirements 3.1, 3.3**

- [x] 4. Migrate configuration files
  - [x] 4.1 Copy all config files to shared/config/
    - Copy alerts.ts, fileSizeLimits.ts, logging.ts, metrics-dashboard.ts, monitoring.ts, payment.js, registrationConfig.js, subscriptionPlans.js
    - Preserve all configuration values and logic
    - _Requirements: 4.1, 4.3_
  
  - [x] 4.2 Create shared/config/index.ts with config exports
    - Re-export all configuration modules alphabetically
    - _Requirements: 4.2, 12.1, 12.3, 12.4_
  
  - [ ]* 4.3 Write property test for config migration
    - **Property 1: File Copy Preserves Content**
    - **Validates: Requirements 4.1, 4.3**

- [x] 5. Checkpoint - Verify file structure
  - Ensure all directories created and files copied successfully, ask the user if questions arise.

- [x] 6. Migrate generic utilities
  - [x] 6.1 Copy generic utilities to shared/lib/utils/
    - Copy cn.ts, formatters.ts, fileValidation.ts, isbnValidator.ts, fingerprint.ts, chartDownload.ts
    - Exclude feature-specific utilities (authCleanup.js, authErrorHandler.js, profileCompletenessChecker.ts, subscriptionHelpers.js, organizationHelper.ts)
    - _Requirements: 5.1, 5.3, 5.4_
  
  - [x] 6.2 Create shared/lib/utils/index.ts with utility exports
    - Export all utility functions alphabetically
    - _Requirements: 5.2, 12.1, 12.3, 12.4_
  
  - [ ]* 6.3 Write property test for utility migration
    - **Property 1: File Copy Preserves Content**
    - **Property 5: Feature-Specific Modules Remain Unmigrated**
    - **Validates: Requirements 5.1, 5.3, 5.4**

- [x] 7. Migrate generic hooks
  - [x] 7.1 Copy generic hooks to shared/lib/hooks/
    - Copy use-toast.js and useresponsive.tsx
    - Exclude feature-specific hooks (useAuth.js, useMessages.ts, useStudentData.js, useCounsellingChat.ts)
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [x] 7.2 Create shared/lib/hooks/index.ts with hook exports
    - Export all hooks alphabetically
    - _Requirements: 6.2, 12.1, 12.3, 12.4_
  
  - [ ]* 7.3 Write property test for hook migration
    - **Property 1: File Copy Preserves Content**
    - **Property 5: Feature-Specific Modules Remain Unmigrated**
    - **Validates: Requirements 6.1, 6.3, 6.4**

- [x] 8. Create shared types structure
  - [x] 8.1 Create shared/types/ directory structure
    - Create shared/types/index.ts and shared/types/common.ts
    - Defer most type migrations to feature-specific phases
    - _Requirements: 7.1, 7.2, 12.1_

- [x] 9. Update import paths across codebase
  - [x] 9.1 Scan codebase for imports from migrated locations
    - Identify all import statements referencing components/ui/, lib/supabaseClient, config/, migrated utils, migrated hooks
    - _Requirements: 8.8_
  
  - [x] 9.2 Update UI component imports to shared/ui
    - Transform imports from @/components/ui/* to @/shared/ui
    - Use public API imports via index.ts
    - _Requirements: 8.1, 8.7_
  
  - [x] 9.3 Update API client imports to shared/api
    - Transform imports from @/lib/supabaseClient to @/shared/api
    - _Requirements: 8.2, 8.7_
  
  - [x] 9.4 Update config imports to shared/config
    - Transform imports from @/config/* to @/shared/config
    - _Requirements: 8.3, 8.7_
  
  - [x] 9.5 Update utility imports to shared/lib/utils
    - Transform imports for migrated utilities to @/shared/lib/utils
    - _Requirements: 8.4, 8.7_
  
  - [x] 9.6 Update hook imports to shared/lib/hooks
    - Transform imports for migrated hooks to @/shared/lib/hooks
    - _Requirements: 8.5, 8.7_
  
  - [ ]* 9.7 Write property test for import path transformation
    - **Property 3: Import Path Transformation**
    - **Validates: Requirements 8.1-8.8**

- [x] 10. Checkpoint - Verify import updates
  - Ensure all imports updated correctly, ask the user if questions arise.

- [x] 11. Validate TypeScript compilation
  - [x] 11.1 Run TypeScript type checking
    - Execute npm run type-check and verify no errors
    - _Requirements: 10.2_
  
  - [x] 11.2 Verify all import paths resolve
    - Check that all updated imports resolve to correct modules
    - _Requirements: 10.2_

- [ ] 12. Validate build process
  - [ ] 12.1 Run production build
    - Execute npm run build and verify successful completion
    - _Requirements: 10.1, 10.3_
  
  - [x] 12.2 Verify bundle size within acceptable range
    - Compare bundle size to pre-migration baseline (within 5%)
    - _Requirements: 10.5_
  
  - [ ]* 12.3 Write unit test for build validation
    - Test that build completes successfully
    - Test bundle size within acceptable range
    - _Requirements: 10.1, 10.3, 10.5_

- [-] 13. Validate test suite
  - [ ] 13.1 Run full test suite
    - Execute npm run test and verify all tests pass
    - _Requirements: 11.1, 11.2_
  
  - [ ] 13.2 Update test file imports if needed
    - Fix any test files with broken imports
    - _Requirements: 11.3_
  
  - [ ]* 13.3 Write unit tests for test suite validation
    - Test that all existing tests pass after migration
    - _Requirements: 11.1, 11.2_

- [x] 14. Validate application functionality
  - [x] 14.1 Start development server and verify no runtime errors
    - Check console for errors during application startup
    - _Requirements: 9.1_
  
  - [x] 14.2 Test page rendering across all routes
    - Navigate to key pages and verify they render without errors
    - _Requirements: 9.2_
  
  - [x] 14.3 Verify component behavior preserved
    - Test that UI components, API calls, and utilities work as expected
    - _Requirements: 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 14.4 Write property test for page rendering
    - **Property 7: All Pages Render Successfully**
    - **Validates: Requirements 9.2**

- [x] 15. Verify backward compatibility
  - [x] 15.1 Confirm original files remain in place
    - Verify that all source files still exist in original locations
    - _Requirements: 13.1, 13.2_
  
  - [ ]* 15.2 Write property test for backward compatibility
    - **Property 6: Backward Compatibility Maintained**
    - **Validates: Requirements 13.1, 13.2, 13.3**

- [x] 16. Generate migration documentation
  - [x] 16.1 Create migration report with statistics
    - Document number of files migrated, imports updated, index files created
    - List all migrated files and any files that could not be migrated
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [x] 16.2 Document deviations from plan
    - Note any changes made during implementation
    - _Requirements: 14.5_

- [ ] 17. Final checkpoint - Complete validation
  - Ensure all tests pass, build succeeds, and application runs without errors. Ask the user if questions arise before considering migration complete.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the migration
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- The migration uses a copy-first strategy to maintain backward compatibility
- Original files remain in place to support rollback if needed
