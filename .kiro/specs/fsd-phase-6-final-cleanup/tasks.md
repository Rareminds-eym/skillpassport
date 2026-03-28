# Implementation Plan: FSD Phase 6 Final Cleanup

## Overview

This implementation plan completes the Feature-Sliced Design (FSD) architectural migration by eliminating the dual structure (legacy + FSD) and achieving 100% FSD compliance. The migration involves 1000+ files across 6 phases: analysis, infrastructure migration, feature migration, service/hook migration, page refactoring, and validation/cleanup.

## Tasks

- [x] 1. Phase 1: Analysis & Planning
  - [x] 1.1 Build codebase analysis tool
    - Create TypeScript script to scan all source files
    - Implement file classification logic (component/service/hook/util/type/config)
    - Build dependency graph analyzer
    - Generate file classification report with target locations
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 1.2 Write property test for classification consistency
    - **Property 2: Classification Consistency**
    - **Validates: Requirements 1.2, 3.2, 4.2, 5.2, 6.2, 7.2, 11.2, 12.2**
  
  - [x] 1.3 Implement circular dependency detection
    - Build dependency graph from import statements
    - Implement cycle detection algorithm
    - Generate circular dependency report with visualization
    - _Requirements: 1.1_
  
  - [x] 1.4 Create migration planning system
    - Group files into migration batches by dependency order
    - Identify files that can be migrated in parallel
    - Generate migration execution plan
    - _Requirements: 1.1_
  
  - [x] 1.5 Set up backup and rollback mechanisms
    - Implement backup system for legacy directories
    - Create rollback functionality for failed migrations
    - Add verification for backup integrity
    - _Requirements: 15.2_

- [x] 2. Phase 2: Infrastructure Migration
  - [x] 2.1 Create app/ layer structure
    - Create src/app/ directory with subdirectories (routes/, layouts/, providers/, config/)
    - Create app/index.ts as application entry point
    - _Requirements: 10.1, 10.6_
  
  - [x] 2.2 Migrate routing configuration
    - Move files from src/routes/ to app/routes/
    - Update import paths in routing files
    - Update main.tsx to import from app/routes/
    - _Requirements: 10.2_
  
  - [x] 2.3 Migrate layout components
    - Move files from src/layouts/ to app/layouts/
    - Update import paths in layout files
    - Update routing to use app/layouts/
    - _Requirements: 10.3_
  
  - [x] 2.4 Migrate provider components
    - Move files from src/providers/ to app/providers/
    - Update import paths in provider files
    - Update app entry point to use app/providers/
    - _Requirements: 10.4_
  
  - [x] 2.5 Migrate configuration files
    - Classify config files as app-specific or shared
    - Move app-specific config to app/config/
    - Move shared config to shared/config/
    - Update all import paths referencing config
    - _Requirements: 10.5, 11.1, 11.2, 11.3, 11.4_
  
  - [x] 2.6 Migrate lib/ to shared/lib/
    - Move reusable library code to shared/lib/
    - Move feature-specific lib code to features/{feature}/lib/
    - Ensure Supabase client remains in shared/api/
    - Update all import paths
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.7_
  
  - [ ]* 2.7 Write property test for directory creation
    - **Property 3: Directory Creation Idempotence**
    - **Validates: Requirements 1.3, 9.2, 9.3, 9.4**
  
  - [x] 2.8 Validate infrastructure migration
    - Run TypeScript compiler to check for errors
    - Verify all imports resolve correctly
    - Validate app/ layer only imports from lower layers
    - _Requirements: 10.7, 10.8_

- [-] 3. Phase 3: Feature Migration
  - [-] 3.1 Identify remaining feature components
    - Scan src/components/ for feature-related components
    - Classify components by feature domain (opportunities, college-admin, school-admin, digital-portfolio, ai-tutor, counselling, placement)
    - Generate migration plan for each feature
    - _Requirements: 1.1, 1.2_
  
  - [x] 3.2 Migrate opportunities feature
    - Create features/opportunities/ structure (ui/, model/, api/, lib/)
    - Move opportunity components to features/opportunities/ui/
    - Create features/opportunities/index.ts with public API
    - Update all import paths
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  
  - [x] 3.3 Migrate college-admin feature
    - Create features/college-admin/ structure
    - Move college admin components to features/college-admin/ui/
    - Create public API through index.ts
    - Update all import paths
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  
  - [x] 3.4 Migrate school-admin feature
    - Create features/school-admin/ structure
    - Move school admin components to features/school-admin/ui/
    - Create public API through index.ts
    - Update all import paths
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  
  - [x] 3.5 Migrate digital-portfolio feature
    - Create features/digital-portfolio/ structure
    - Move portfolio components to features/digital-portfolio/ui/
    - Create public API through index.ts
    - Update all import paths
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  
  - [x] 3.6 Migrate ai-tutor feature
    - Create features/ai-tutor/ structure
    - Move AI tutor components to features/ai-tutor/ui/
    - Create public API through index.ts
    - Update all import paths
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  
  - [x] 3.7 Migrate counselling feature
    - Create features/counselling/ structure
    - Move counselling components to features/counselling/ui/
    - Create public API through index.ts
    - Update all import paths
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  
  - [x] 3.8 Migrate placement feature
    - Create features/placement/ structure
    - Move placement components to features/placement/ui/
    - Create public API through index.ts
    - Update all import paths
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  
  - [x] 3.9 Refactor features/assessment structure
    - Analyze current features/assessment/ structure
    - Reorganize to proper FSD structure (ui/, model/, api/, lib/)
    - Move components to ui/, services to api/, hooks to model/, utilities to lib/
    - Update internal imports
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_
  
  - [x] 3.10 Create widgets for composite UI blocks
    - Identify components that compose multiple features (dashboards, complex forms)
    - Create widgets/student-dashboard/, widgets/educator-dashboard/, widgets/recruiter-dashboard/, widgets/admin-dashboard/
    - Move dashboard layouts to appropriate widget directories
    - Create widget public APIs through index.ts
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [ ]* 3.11 Write property test for file migration
    - **Property 1: File Migration Preserves Content**
    - **Validates: Requirements 1.4, 4.3, 4.4, 4.5, 5.3, 5.4, 5.5, 6.3, 6.4, 6.5, 7.3, 7.4, 7.5, 9.5, 9.6, 10.2, 10.3, 10.4, 11.3, 11.4, 12.3, 12.4**
  
  - [ ]* 3.12 Write property test for public API exposure
    - **Property 5: Public API Exposure**
    - **Validates: Requirements 1.5, 6.8, 7.8, 9.8**
  
  - [x] 3.13 Consolidate duplicate code
    - Identify duplicate components across features
    - Determine canonical location for each duplicate
    - Remove duplicates and update references
    - _Requirements: 1.7_
  
  - [x] 3.14 Validate feature migration
    - Verify all features follow FSD structure
    - Check that all features have public APIs
    - Validate no legacy component imports remain
    - _Requirements: 1.8_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 5. Phase 4: Service & Hook Migration
  - [x] 5.1 Catalog and classify services
    - Scan src/services/ directory (235 files)
    - Determine feature/entity ownership for each service
    - Identify shared services used by multiple features
    - Generate service migration plan
    - _Requirements: 7.1, 7.2_
  
  - [x] 5.2 Migrate feature-specific services
    - Move feature services to features/{feature}/api/
    - Update service imports within features
    - Export services through feature public APIs
    - _Requirements: 7.3, 7.8_
  
  - [x] 5.3 Migrate entity-specific services
    - Move entity services to entities/{entity}/api/
    - Update service imports within entities
    - Export services through entity public APIs
    - Fix entity layer violations (remove @/services/ imports)
    - _Requirements: 7.4, 8.1, 8.2, 8.7, 8.8_
  
  - [x] 5.4 Migrate shared services
    - Move infrastructure/generic services to shared/api/
    - Update service imports across codebase
    - Export services through shared public API
    - _Requirements: 3.6, 7.5_
  
  - [x] 5.5 Update all service import paths
    - Replace @/services/ imports with feature/entity/shared imports
    - Ensure all imports use public APIs
    - Validate zero @/services/ imports remain
    - _Requirements: 3.7, 7.6, 7.7_
  
  - [x] 5.6 Catalog and classify hooks
    - Scan src/hooks/ directory (113 files)
    - Determine feature/entity ownership for each hook
    - Identify generic/reusable hooks
    - Generate hook migration plan
    - _Requirements: 4.1, 4.2_
  
  - [x] 5.7 Migrate feature-specific hooks
    - Move feature hooks to features/{feature}/model/
    - Update hook imports within features
    - Export hooks through feature public APIs
    - _Requirements: 4.3_
  
  - [x] 5.8 Migrate entity-specific hooks
    - Move entity hooks to entities/{entity}/model/
    - Update hook imports within entities
    - Export hooks through entity public APIs
    - _Requirements: 4.4_
  
  - [x] 5.9 Migrate generic hooks
    - Move reusable hooks to shared/lib/hooks/
    - Update hook imports across codebase
    - Export hooks through shared public API
    - _Requirements: 4.5_
  
  - [x] 5.10 Update all hook import paths
    - Replace @/hooks/ imports with feature/entity/shared imports
    - Validate hook naming conventions (use* prefix)
    - Ensure zero @/hooks/ imports remain
    - _Requirements: 4.6, 4.7, 4.8_
  
  - [x] 5.11 Migrate utilities
    - Scan src/utils/ directory (58 files)
    - Move feature-specific utilities to features/{feature}/lib/
    - Move entity-specific utilities to entities/{entity}/lib/
    - Move generic utilities to shared/lib/
    - Update all import paths
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [x] 5.12 Migrate type definitions
    - Scan src/types/ directory (13 files)
    - Move entity types to entities/{entity}/model/types.ts
    - Move feature types to features/{feature}/model/types.ts
    - Move shared types to shared/types/
    - Update all import paths
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_
  
  - [ ]* 5.13 Write property test for import path updates
    - **Property 4: Import Path Update Completeness**
    - **Validates: Requirements 1.6, 4.6, 5.6, 6.6, 7.6, 11.5, 12.5**
  
  - [ ]* 5.14 Write property test for code deduplication
    - **Property 12: Code Deduplication**
    - **Validates: Requirements 1.7, 5.8, 11.8, 12.8**
  
  - [x] 5.15 Consolidate duplicate utilities and types
    - Identify duplicate utility functions
    - Identify duplicate type definitions
    - Remove duplicates and update references
    - _Requirements: 5.8, 11.8, 12.8_
  
  - [x] 5.16 Validate service and hook migration
    - Verify zero @/services/ imports remain
    - Verify zero @/hooks/ imports remain
    - Verify zero @/utils/ imports remain
    - Verify zero @/types/ imports remain
    - Check entity layer purity (no feature/widget imports)
    - _Requirements: 3.5, 3.8, 4.7, 5.7, 6.7, 8.5, 8.6_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Phase 5: Page Refactoring
  - [x] 7.1 Build business logic detection tool
    - Create AST parser to detect Supabase calls (from/rpc/auth)
    - Detect state management logic in pages
    - Detect data transformation logic in pages
    - Generate business logic violation report
    - _Requirements: 2.1_
  
  - [x] 7.2 Extract Supabase.from() calls from pages
    - Identify all supabase.from() calls in page components
    - Determine target feature for each call
    - Create service functions in features/{feature}/api/
    - Replace page calls with feature service imports
    - _Requirements: 2.2_
  
  - [x] 7.3 Extract Supabase.rpc() calls from pages
    - Identify all supabase.rpc() calls in page components
    - Determine target feature for each call
    - Create service functions in features/{feature}/api/
    - Replace page calls with feature service imports
    - _Requirements: 2.3_
  
  - [x] 7.4 Extract Supabase.auth() calls from pages
    - Identify all supabase.auth() calls in page components
    - Move auth calls to features/auth/api/
    - Replace page calls with auth feature imports
    - _Requirements: 2.4_
  
  - [x] 7.5 Extract state management from pages
    - Identify state management logic in pages (useState, useEffect with data fetching)
    - Create hooks in features/{feature}/model/
    - Replace page state logic with feature hooks
    - _Requirements: 2.5_
  
  - [x] 7.6 Extract data transformation from pages
    - Identify data transformation logic in pages
    - Create utility functions in features/{feature}/lib/
    - Replace page transformation logic with feature utilities
    - _Requirements: 2.6_
  
  - [x] 7.7 Refactor pages to composition-only
    - Update pages to import from features/ and widgets/
    - Remove all business logic from pages
    - Ensure pages only compose UI components
    - _Requirements: 2.7_
  
  - [ ]* 7.8 Write property test for business logic extraction
    - **Property 7: Business Logic Extraction**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**
  
  - [ ]* 7.9 Write property test for service import elimination
    - **Property 8: Service Import Elimination**
    - **Validates: Requirements 3.4, 3.5, 3.7, 3.8**
  
  - [x] 7.10 Eliminate direct service imports from pages
    - Scan all pages for @/services/ imports
    - Replace with feature/shared public API imports
    - Validate zero direct service imports remain
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 7.11 Validate page refactoring
    - Verify zero Supabase client usage in pages
    - Verify zero business logic in pages
    - Verify zero direct service imports in pages
    - Verify pages only import from features/, widgets/, shared/
    - _Requirements: 2.8, 3.5, 3.8_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 9. Phase 6: Validation & Cleanup
  - [x] 9.1 Build FSD compliance validator
    - Create tool to measure FSD compliance percentage
    - Count files in FSD structure vs legacy structure
    - Detect layer hierarchy violations
    - Detect public API usage violations
    - Generate compliance report
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8_
  
  - [x] 9.2 Validate layer hierarchy
    - Scan all import statements across codebase
    - Check imports follow FSD hierarchy (app → pages → widgets → features → entities → shared)
    - Detect upward dependencies (violations)
    - Validate features don't import from other features
    - Validate entities don't import from features/widgets
    - Validate shared doesn't import from higher layers
    - Generate layer violation report
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_
  
  - [ ]* 9.3 Write property test for layer hierarchy enforcement
    - **Property 13: Layer Hierarchy Enforcement**
    - **Validates: Requirements 8.5, 8.6, 9.7, 10.8, 14.2, 14.3, 14.4, 14.5, 14.6**
  
  - [ ]* 9.4 Write property test for public API usage
    - **Property 14: Public API Usage**
    - **Validates: Requirements 14.8**
  
  - [ ]* 9.5 Write property test for entity layer purity
    - **Property 15: Entity Layer Purity**
    - **Validates: Requirements 8.2, 8.3, 8.7**
  
  - [ ]* 9.6 Write property test for legacy import elimination
    - **Property 11: Legacy Import Elimination**
    - **Validates: Requirements 4.7, 5.7, 6.7, 7.7, 11.6, 12.6, 15.1**
  
  - [ ]* 9.7 Write property test for environment variable access
    - **Property 17: Environment Variable Access Pattern**
    - **Validates: Requirements 11.7**
  
  - [x] 9.3 Validate public API usage
    - Check all imports use public APIs (index.ts)
    - Detect direct internal file imports
    - Generate public API violation report
    - _Requirements: 14.8_
  
  - [x] 9.4 Run TypeScript compilation
    - Execute TypeScript compiler
    - Validate zero type errors
    - Fix any compilation errors
    - _Requirements: 16.1_
  
  - [ ]* 9.5 Write property test for TypeScript compilation
    - **Property 18: TypeScript Compilation Success**
    - **Validates: Requirements 16.1**
  
  - [x] 9.6 Run unit tests
    - Execute all unit tests
    - Validate 100% pass rate
    - Fix any failing tests
    - _Requirements: 16.2_
  
  - [x] 9.7 Run integration tests
    - Execute all integration tests for features
    - Validate all features work correctly
    - Fix any integration issues
    - _Requirements: 16.3_
  
  - [x] 9.8 Validate page rendering
    - Test render all pages without errors
    - Validate authentication flows
    - Validate data fetching
    - Validate state management
    - _Requirements: 16.4, 16.5, 16.6, 16.7_
  
  - [x] 9.9 Validate 100% FSD compliance
    - Run compliance validator
    - Verify zero files in legacy directories
    - Verify zero layer violations
    - Verify zero business logic in pages
    - Verify zero direct service imports
    - Verify 100% public API usage
    - _Requirements: 17.7_
  
  - [x] 9.10 Delete legacy directories
    - Verify zero active imports from legacy directories
    - Create final backup of legacy structure
    - Delete src/components/ directory
    - Delete src/services/ directory
    - Delete src/hooks/ directory
    - Delete src/utils/ directory
    - Delete src/types/ directory
    - Delete src/config/, src/lib/, src/layouts/, src/routes/, src/providers/ directories
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_
  
  - [x] 9.11 Generate final validation report
    - Run comprehensive validation suite
    - Generate compliance report with before/after metrics
    - Document any remaining issues or warnings
    - Provide final FSD compliance score
    - _Requirements: 16.8, 17.6_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after major phases
- Property tests validate universal correctness properties across all migrations
- Unit tests validate specific migration scenarios and edge cases
- Migration is incremental with rollback capability at each phase
- Legacy directories are only deleted after 100% validation passes
