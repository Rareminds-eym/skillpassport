# Implementation Plan: FSD Phase 2 - Auth Feature

## Overview

This plan implements Phase 2 of the Feature-Sliced Design (FSD) migration by creating the auth feature structure and migrating all authentication-related code from the flat structure to features/auth/. The migration uses a copy-first strategy to maintain backward compatibility, allowing both old and new import paths to coexist during the transition.

## Tasks

- [x] 1. Create Auth Feature Structure
  - Create all required directories for the auth feature
  - Verify directory structure matches FSD specification
  - _Requirements: 1.1-1.6_

- [x] 2. Migrate Auth UI Components
  - [x] 2.1 Copy all UI components from pages/auth/ to features/auth/ui/
    - Copy all 13 .tsx and .jsx files preserving filenames
    - Convert .jsx files to .tsx for type safety
    - _Requirements: 2.1-2.10, 2.13_
  
  - [x] 2.2 Create features/auth/ui/index.ts with component exports
    - Generate alphabetically sorted named exports for all UI components
    - _Requirements: 2.12, 6.2_
  
  - [x] 2.3 Update internal imports within UI components
    - Update imports to reference @/shared/ui for UI components
    - Update imports to reference @/features/auth/api for auth services
    - Update imports to reference @/features/auth/model for useAuth
    - _Requirements: 2.14_
  
  - [ ]* 2.4 Write property test for UI component migration
    - **Property 1: File Copy Preserves Content**
    - **Validates: Requirements 2.1-2.10, 2.13**

- [x] 3. Migrate Auth API Services
  - [x] 3.1 Copy auth services to features/auth/api/
    - Copy authService.js → authService.ts (convert to TypeScript)
    - Copy unifiedAuthService.ts → unifiedAuthService.ts
    - Copy adminAuthService.js → adminAuthService.ts (convert to TypeScript)
    - Copy otpService.ts → otpService.ts
    - Copy passwordResetService.ts → passwordResetService.ts
    - _Requirements: 3.1-3.6, 3.8_
  
  - [x] 3.2 Update service imports to reference shared/api
    - Update Supabase client imports to @/shared/api
    - Preserve all service function signatures
    - _Requirements: 3.9_
  
  - [x] 3.3 Create features/auth/api/index.ts with service exports
    - Export all auth services with organized categories
    - _Requirements: 3.7, 6.3_
  
  - [ ]* 3.4 Write property test for API service migration
    - **Property 1: File Copy Preserves Content**
    - **Validates: Requirements 3.1-3.6, 3.8**

- [x] 4. Migrate Auth State Management
  - [x] 4.1 Copy AuthContext and useAuth to features/auth/model/
    - Copy AuthContext.jsx → AuthContext.tsx (convert to TypeScript)
    - Copy useAuth.js → useAuth.ts (convert to TypeScript)
    - _Requirements: 4.1-4.2, 4.4_
  
  - [x] 4.2 Update AuthContext imports
    - Update to import auth services from @/features/auth/api
    - Update to import Supabase client from @/shared/api
    - Preserve all authentication state logic
    - _Requirements: 4.5-4.8_
  
  - [x] 4.3 Create features/auth/model/index.ts with exports
    - Export AuthProvider, AuthContext, useAuth
    - Export types (AuthState, AuthContextType)
    - _Requirements: 4.3, 6.3_
  
  - [ ]* 4.4 Write property test for state management migration
    - **Property 1: File Copy Preserves Content**
    - **Validates: Requirements 4.1-4.2, 4.4**

- [x] 5. Migrate Auth Utilities
  - [x] 5.1 Copy auth utilities to features/auth/lib/
    - Copy authCleanup.js → authCleanup.ts (convert to TypeScript)
    - Copy authErrorHandler.js → authErrorHandler.ts (convert to TypeScript)
    - Copy roleBasedRouter.ts → roleBasedRouter.ts
    - Copy tokenMonitor.ts → tokenMonitor.ts
    - _Requirements: 5.1-5.3, 5.5_
  
  - [x] 5.2 Create features/auth/lib/index.ts with utility exports
    - Export all auth utilities alphabetically
    - _Requirements: 5.4, 6.3_
  
  - [ ]* 5.3 Write property test for utility migration
    - **Property 1: File Copy Preserves Content**
    - **Validates: Requirements 5.1-5.3, 5.5**

- [-] 6. Create Auth Feature Public API
  - [x] 6.1 Create features/auth/index.ts
    - Export commonly used UI components
    - Export AuthProvider and useAuth
    - Export commonly used auth services
    - Export commonly used utilities
    - Export types (UserRole, AuthState)
    - _Requirements: 6.1-6.8_

- [x] 7. Checkpoint - Verify file structure
  - Ensure all directories created and files copied successfully
  - Verify all index.ts files created
  - Ask the user if questions arise

- [x] 8. Update import paths across codebase
  - [x] 8.1 Scan codebase for imports from migrated locations
    - Identify all import statements referencing pages/auth/, services/auth*, context/AuthContext, hooks/useAuth, utils/auth*
    - _Requirements: 7.8_
  
  - [x] 8.2 Update UI component imports to features/auth
    - Transform imports from @/pages/auth/* to @/features/auth or @/features/auth/ui
    - Use public API imports via index.ts
    - _Requirements: 7.1, 7.7_
  
  - [x] 8.3 Update auth service imports to features/auth
    - Transform imports from @/services/auth* to @/features/auth or @/features/auth/api
    - _Requirements: 7.2, 7.7_
  
  - [x] 8.4 Update AuthContext imports to features/auth
    - Transform imports from @/context/AuthContext to @/features/auth or @/features/auth/model
    - _Requirements: 7.4, 7.7_
  
  - [x] 8.5 Update useAuth imports to features/auth
    - Transform imports from @/hooks/useAuth to @/features/auth or @/features/auth/model
    - _Requirements: 7.5, 7.7_
  
  - [x] 8.6 Update auth utility imports to features/auth
    - Transform imports for migrated utilities to @/features/auth or @/features/auth/lib
    - _Requirements: 7.6, 7.7_
  
  - [ ]* 8.7 Write property test for import path transformation
    - **Property 3: Import Path Transformation**
    - **Validates: Requirements 7.1-7.10**

- [x] 9. Checkpoint - Verify import updates
  - Ensure all imports updated correctly
  - Ask the user if questions arise

- [-] 10. Validate TypeScript compilation
  - [ ] 10.1 Run TypeScript type checking
    - Execute npm run type-check and verify no errors
    - _Requirements: 14.6_
  
  - [x] 10.2 Verify all import paths resolve
    - Check that all updated imports resolve to correct modules
    - _Requirements: 14.2_
  
  - [ ]* 10.3 Write property test for TypeScript compilation
    - **Property 11: TypeScript Compilation Succeeds**
    - **Validates: Requirements 14.1-14.7**

- [ ] 11. Validate build process
  - [ ] 11.1 Run production build
    - Execute npm run build and verify successful completion
    - _Requirements: 14.1, 14.3_
  
  - [ ] 11.2 Verify bundle size within acceptable range
    - Compare bundle size to pre-migration baseline (within 5%)
    - _Requirements: 14.5_
  
  - [ ]* 11.3 Write unit test for build validation
    - Test that build completes successfully
    - Test bundle size within acceptable range
    - _Requirements: 14.1, 14.3, 14.5_

- [ ] 12. Validate test suite
  - [ ] 12.1 Run full test suite
    - Execute npm run test and verify all tests pass
    - _Requirements: 15.1, 15.2_
  
  - [ ] 12.2 Update test file imports if needed
    - Fix any test files with broken imports
    - _Requirements: 15.3_
  
  - [ ]* 12.3 Write property test for test suite validation
    - **Property 12: All Auth Tests Pass**
    - **Validates: Requirements 15.1-15.9**

- [-] 13. Validate auth flows
  - [-] 13.1 Test student login flow
    - Verify student can log in with valid credentials
    - Verify redirect to /student/dashboard
    - _Requirements: 8.1, 8.7, 8.8_
  
  - [ ] 13.2 Test educator login flow
    - Verify educator can log in with valid credentials
    - Verify redirect to /educator/dashboard
    - _Requirements: 8.2, 8.7, 8.8_
  
  - [ ] 13.3 Test recruiter login flow
    - Verify recruiter can log in with valid credentials
    - Verify redirect to /recruiter/dashboard
    - _Requirements: 8.3, 8.7, 8.8_
  
  - [ ] 13.4 Test admin login flow
    - Verify admin can log in with valid credentials
    - Verify redirect to admin dashboard
    - _Requirements: 8.4, 8.7, 8.8_
  
  - [ ] 13.5 Test signup flow
    - Verify user can sign up with valid information
    - Verify OTP verification if required
    - Verify redirect after successful signup
    - _Requirements: 9.1-9.9_
  
  - [ ] 13.6 Test password reset flow
    - Verify password reset OTP is sent
    - Verify OTP verification works
    - Verify password is updated
    - _Requirements: 10.1-10.9_
  
  - [ ] 13.7 Test OTP functionality
    - Verify OTP generation and sending
    - Verify OTP verification
    - Verify OTP expiration
    - _Requirements: 11.1-11.8_
  
  - [ ] 13.8 Test session management
    - Verify session persistence across page refreshes
    - Verify automatic token refresh
    - Verify logout clears session
    - _Requirements: 12.1-12.9_
  
  - [ ] 13.9 Test role-based routing
    - Verify correct dashboard redirect for each role
    - Verify role is stored in AuthContext
    - _Requirements: 13.1-13.8_
  
  - [ ]* 13.10 Write property tests for auth flows
    - **Property 4: Login Flow Preserved**
    - **Property 5: Signup Flow Preserved**
    - **Property 6: Password Reset Flow Preserved**
    - **Property 7: OTP Functionality Preserved**
    - **Property 8: Session Management Preserved**
    - **Property 9: Role-Based Routing Preserved**
    - **Validates: Requirements 8-13**

- [x] 14. Validate application functionality
  - [x] 14.1 Start development server and verify no runtime errors
    - Check console for errors during application startup
    - _Requirements: 16.1_
  
  - [x] 14.2 Test page rendering across all routes
    - Navigate to key pages and verify they render without errors
    - _Requirements: 16.2_
  
  - [x] 14.3 Verify component behavior preserved
    - Test that UI components, API calls, and utilities work as expected
    - _Requirements: 16.3-16.6_

- [x] 15. Verify backward compatibility
  - [x] 15.1 Confirm original files remain in place
    - Verify that all source files still exist in original locations
    - _Requirements: 17.1, 17.2_
  
  - [ ]* 15.2 Write property test for backward compatibility
    - **Property 10: Backward Compatibility Maintained**
    - **Validates: Requirements 17.1-17.7**

- [x] 16. Generate migration documentation
  - [x] 16.1 Create migration report with statistics
    - Document number of files migrated, imports updated, index files created
    - List all migrated files and any files that could not be migrated
    - _Requirements: 18.1-18.4_
  
  - [x] 16.2 Document deviations from plan
    - Note any changes made during implementation
    - Document any consolidation decisions
    - _Requirements: 18.5-18.8_

- [ ] 17. Final checkpoint - Complete validation
  - Ensure all tests pass, build succeeds, and application runs without errors
  - Verify all auth flows work correctly
  - Ask the user if questions arise before considering migration complete

## Notes

- Tasks marked with `*` are optional and can be skipped for faster implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the migration
- Property tests validate universal correctness properties across many inputs
- Unit tests validate specific examples and edge cases
- The migration uses a copy-first strategy to maintain backward compatibility
- Original files remain in place to support rollback if needed
- Auth feature serves as template for subsequent feature migrations

## Migration Statistics

**Files to Migrate**: 24 files
- UI Components: 13 files
- API Services: 5 files
- State Management: 2 files
- Utilities: 4 files

**Index Files to Create**: 5 files
- features/auth/ui/index.ts
- features/auth/api/index.ts
- features/auth/model/index.ts
- features/auth/lib/index.ts
- features/auth/index.ts

**Estimated Import Updates**: 200+ files across codebase

**Total Files**: 29 files (24 migrated + 5 index files)
