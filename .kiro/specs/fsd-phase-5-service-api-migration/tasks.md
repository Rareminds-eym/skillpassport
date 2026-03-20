# Implementation Plan: FSD Phase 5 - Service API Migration

## Overview

This implementation plan systematically migrates API functions from the centralized `/services/` directory to feature-specific `/api/` directories following FSD methodology. The migration integrates with existing Zustand stores from Phase 4, maintains functionality, and improves code organization through a structured approach.

## Tasks

- [x] 1. Set up migration infrastructure and analysis tools
  - Create TypeScript interfaces for migration system components (APIAnalyzer, MigrationEngine, StoreIntegrator)
  - Set up migration logging and backup systems
  - Create validation utilities for pre and post-migration checks
  - _Requirements: 8.1, 8.2, 13.1_

- [x] 2. Implement API discovery and cataloging system
  - [x] 2.1 Create service directory scanner
    - Implement recursive scanning of `/services/` directory
    - Extract all service files and their metadata
    - _Requirements: 1.1_
  
  - [ ]* 2.2 Write property test for service discovery
    - **Property 1: Complete Discovery and Cataloging**
    - **Validates: Requirements 1.1, 1.2, 3.1**
  
  - [x] 2.3 Implement API function extractor
    - Parse service files to identify all exported API functions
    - Extract function signatures, dependencies, and usage patterns
    - _Requirements: 1.2_
  
  - [ ]* 2.4 Write unit tests for function extraction
    - Test extraction with various function patterns (arrow functions, async functions, class methods)
    - Test handling of TypeScript interfaces and type definitions
    - _Requirements: 1.2_

- [x] 3. Build API classification and mapping system
  - [x] 3.1 Implement feature mapping algorithm
    - Map API functions to FSD features based on usage patterns and naming conventions
    - Handle authentication → features/authentication/api/
    - Handle subscription → features/subscription/api/
    - Handle search → features/search/api/
    - Handle portfolio → features/portfolio/api/
    - _Requirements: 1.3, 2.1_
  
  - [ ]* 3.2 Write property test for classification accuracy
    - **Property 2: Accurate Classification**
    - **Validates: Requirements 1.3, 1.4, 1.5, 9.1**
  
  - [x] 3.3 Implement cross-feature dependency detector
    - Identify API functions used by multiple features
    - Classify functions as shared utilities vs feature-specific
    - _Requirements: 1.4, 1.5, 9.1_
  
  - [ ]* 3.4 Write unit tests for dependency detection
    - Test detection of circular dependencies
    - Test identification of shared vs feature-specific functions
    - _Requirements: 1.4, 9.3_

- [ ] 4. Checkpoint - Validate analysis phase
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement migration engine for file movement
  - [x] 5.1 Create feature API directory structure
    - Generate `/src/features/{feature}/api/` directories
    - Create appropriate index.ts barrel exports
    - _Requirements: 2.1, 4.2_
  
  - [ ]* 5.2 Write property test for migration placement
    - **Property 3: Correct Migration Placement**
    - **Validates: Requirements 2.1, 2.2, 2.5, 4.1**
  
  - [x] 5.3 Implement API function migration
    - Move feature-specific functions to appropriate directories
    - Group related functions in single feature API files
    - Preserve function signatures and behavior
    - _Requirements: 2.2, 2.3, 2.5_
  
  - [ ]* 5.4 Write unit tests for function migration
    - Test preservation of function signatures and TypeScript types
    - Test handling of complex function patterns
    - _Requirements: 2.3, 2.4_

- [x] 6. Implement shared utility migration
  - [x] 6.1 Create shared API directory structure
    - Set up `/src/shared/api/` directory
    - Create barrel exports for shared utilities
    - _Requirements: 4.1, 4.2_
  
  - [x] 6.2 Migrate shared API utilities
    - Move cross-feature utilities to shared directory
    - Standardize naming conventions and patterns
    - _Requirements: 4.1, 4.5_
  
  - [ ]* 6.3 Write unit tests for shared utility organization
    - Test barrel export generation
    - Test naming convention standardization
    - _Requirements: 4.2, 4.5_

- [ ] 7. Build import path update system
  - [ ] 7.1 Implement codebase scanner for import references
    - Scan entire codebase for imports referencing 
    migrated functions
    - Handle both relative and absolute import paths
    - _Requirements: 3.1, 3.4_
  
  - [ ]* 7.2 Write property test for import path consistency
    - **Property 4: Import Path Consistency**
    - **Validates: Requirements 3.2, 3.3, 3.4, 4.3**
  
  - [x] 7.3 Implement import path updater
    - Update import statements to new FSD locations
    - Preserve import aliases and destructuring patterns
    - Validate that updated imports resolve correctly
    - _Requirements: 3.2, 3.3, 3.5_
  
  - [ ]* 7.4 Write unit tests for import updates
    - Test preservation of import aliases and destructuring
    - Test handling of complex import patterns
    - _Requirements: 3.2, 3.3_

- [ ] 8. Checkpoint - Validate file migration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Zustand store integration system
  - [x] 9.1 Create store integration analyzer
    - Identify API functions that should integrate with Zustand stores
    - Map functions to appropriate stores (useAuthStore, useSubscriptionStore, useSearchStore, usePortfolioStore)
    - _Requirements: 11.1, 11.2_
  
  - [ ]* 9.2 Write property test for store integration completeness
    - **Property 6: Store Integration Completeness**
    - **Validates: Requirements 11.1, 11.2, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4**
  
  - [x] 9.3 Implement authentication API store integration
    - Connect auth APIs with useAuthActions, useUser, and related hooks
    - Replace legacy context patterns with Zustand selectors
    - _Requirements: 11.4, 12.1_
  
  - [x] 9.4 Implement subscription API store integration
    - Connect subscription APIs with useSubscriptionStore actions
    - Ensure proper state updates for subscription changes
    - _Requirements: 12.2_
  
  - [x] 9.5 Implement search and portfolio API store integration
    - Connect search APIs with useSearchActions and useSearchStore
    - Connect portfolio APIs with usePortfolioActions
    - _Requirements: 12.3, 12.4_
  
  - [ ]* 9.6 Write property test for legacy pattern replacement
    - **Property 7: Legacy Pattern Replacement**
    - **Validates: Requirements 11.3, 5.1, 5.2, 5.3, 5.4**
  
  - [ ]* 9.7 Write unit tests for store integrations
    - Test integration with each Zustand store
    - Test proper state updates and re-renders
    - _Requirements: 11.5, 12.1, 12.2, 12.3, 12.4_

- [x] 10. Implement API pattern standardization
  - [x] 10.1 Standardize API function naming and signatures
    - Apply consistent naming conventions across all migrated functions
    - Standardize error handling patterns
    - _Requirements: 5.1, 5.2_
  
  - [x] 10.2 Standardize response types and request patterns
    - Ensure consistent TypeScript type definitions
    - Standardize request parameter patterns
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 10.3 Write unit tests for pattern standardization
    - Test consistent naming and error handling
    - Test TypeScript type consistency
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 11. Implement validation and testing system
  - [x] 11.1 Create pre-migration validation
    - Execute all existing tests before migration
    - Verify API endpoint accessibility
    - Validate current import paths
    - _Requirements: 7.1, 7.3_
  
  - [ ]* 11.2 Write property test for validation integrity
    - **Property 8: Validation and Testing Integrity**
    - **Validates: Requirements 7.1, 7.3, 3.5**
  
  - [x] 11.3 Create post-migration validation
    - Execute complete test suite after migration
    - Verify API endpoints remain accessible
    - Confirm store integrations work correctly
    - _Requirements: 7.1, 7.3, 7.4, 11.5_
  
  - [ ]* 11.4 Write unit tests for validation system
    - Test validation with various error scenarios
    - Test endpoint accessibility checks
    - _Requirements: 7.1, 7.3_

- [x] 12. Implement services directory cleanup
  - [x] 12.1 Remove empty service files
    - Delete service files that have been fully migrated
    - Preserve only shared utilities in `/services/`
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 12.2 Write property test for services cleanup
    - **Property 9: Services Directory Cleanup**
    - **Validates: Requirements 6.1, 6.2, 6.4**
  
  - [x] 12.3 Create deprecation notices and documentation
    - Document what remains in `/services/` and why
    - Create deprecation notices for legacy files
    - _Requirements: 6.3, 6.5_
  
  - [ ]* 12.4 Write unit tests for cleanup validation
    - Test that no feature-specific code remains in services
    - Test proper preservation of shared utilities
    - _Requirements: 6.4_

- [x] 13. Implement rollback and error handling system
  - [x] 13.1 Create comprehensive backup system
    - Backup all files before migration starts
    - Maintain detailed change logs
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 13.2 Write property test for rollback completeness
    - **Property 10: Rollback Completeness**
    - **Validates: Requirements 8.1, 8.3, 8.4, 8.5**
  
  - [x] 13.3 Implement rollback mechanism
    - Restore files to pre-migration state on failure
    - Clean up migration artifacts
    - Validate rollback success
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [ ]* 13.4 Write unit tests for error handling
    - Test rollback with various failure scenarios
    - Test error reporting and recovery
    - _Requirements: 8.3, 8.4, 8.5_

- [ ] 14. Checkpoint - Validate complete migration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Implement architectural compliance validation
  - [x] 15.1 Validate FSD compliance and dependency management
    - Check for circular dependencies between features
    - Ensure cross-feature dependencies follow FSD best practices
    - _Requirements: 9.3, 9.5_
  
  - [ ]* 15.2 Write property test for architectural compliance
    - **Property 11: Architectural Compliance**
    - **Validates: Requirements 9.3, 9.5, 9.4**
  
  - [x] 15.3 Generate refactoring recommendations
    - Identify tightly coupled functions for refactoring
    - Document architectural decisions for cross-feature usage
    - _Requirements: 9.4, 9.2_
  
  - [ ]* 15.4 Write unit tests for compliance validation
    - Test circular dependency detection
    - Test FSD best practice validation
    - _Requirements: 9.3, 9.5_

- [x] 16. Generate comprehensive migration documentation
  - [ ] 16.1 Create migration report
    - List all moved files and functions
    - Document standardized patterns and cross-feature dependencies
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [ ]* 16.2 Write property test for comprehensive documentation
    - **Property 12: Comprehensive Documentation**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 4.4, 6.5, 9.2, 12.5**
  
  - [ ] 16.3 Document manual interventions and recommendations
    - List any required manual interventions
    - Provide future improvement recommendations
    - _Requirements: 13.4, 13.5_
  
  - [ ]* 16.4 Write unit tests for documentation generation
    - Test report completeness and accuracy
    - Test recommendation generation
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 17. Final integration and wiring
  - [x] 17.1 Wire all migration components together
    - Connect analyzer, migration engine, store integrator, and validator
    - Create main migration orchestrator
    - _Requirements: All requirements_
  
  - [x] 17.2 Create migration CLI interface
    - Provide command-line interface for running migration
    - Include options for dry-run, rollback, and validation-only modes
    - _Requirements: 8.3, 7.1_
  
  - [ ]* 17.3 Write integration tests for complete migration flow
    - Test end-to-end migration with realistic project structure
    - Test rollback scenarios and error recovery
    - _Requirements: All requirements_

- [ ] 18. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the migration process
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The migration maintains backward compatibility and provides comprehensive rollback capability
- All TypeScript types and interfaces are preserved during migration
- Zustand store integration follows patterns established in Phase 4