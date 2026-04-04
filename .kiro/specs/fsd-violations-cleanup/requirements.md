# Requirements Document

## Introduction

This document specifies requirements for completing the Feature-Sliced Design (FSD) architectural migration. The codebase has made significant progress, moving from ~15-20% FSD compliance to ~70-80% compliance. Major achievements include:

**Completed Migration Work:**
- All legacy directories removed (src/components/, src/services/, src/hooks/, src/utils/, src/types/, src/config/, src/lib/)
- app/ layer created with proper structure (config/, layouts/, providers/, routes/)
- features/assessment/ migrated to FSD segments (api/, model/, ui/, lib/)
- Legacy import violations eliminated (features no longer import from @/services/, @/components/, @/hooks/)

**Remaining Violations:**
This cleanup effort addresses the final violations across two categories: import-level violations (entities→features, shared→features, pages imports, relative imports, internal API bypasses) and structural violations (non-FSD directories like stores/, duplicate features, incomplete features, non-standard segment names).

The FSD architecture defines a strict unidirectional dependency flow:

- **Layers (bottom to top)**: Shared → Entities → Features → Widgets → Pages → App
- **Rule**: Lower layers cannot depend on higher layers
- **Public API**: Features must expose public APIs through index files; internal structure should not be directly imported
- **Structure**: Only valid FSD layers should exist in src/; features should use standard segment names (ui/, api/, model/, lib/)

## Glossary

- **FSD**: Feature-Sliced Design, an architectural methodology that organizes code into layers with strict dependency rules
- **Layer**: A horizontal slice in FSD architecture (Shared, Entities, Features, Widgets, Pages, App)
- **Segment**: A subdirectory within a slice (ui/, api/, model/, lib/) that organizes code by technical purpose
- **Dependency_Violation**: An import statement where a lower layer imports from a higher layer
- **Public_API**: The index file of a feature that exports its public interface
- **Internal_Import**: An import that bypasses the public API by directly importing from /ui/, /api/, /model/, or /lib/ subdirectories
- **Relative_Import**: An import using relative paths (../) instead of absolute path aliases (@/)
- **Circular_Dependency**: A situation where module A depends on module B, and B depends on A (directly or transitively)
- **Non-FSD_Directory**: A directory in src/ that does not correspond to a valid FSD layer (e.g., stores/, data/, scripts/)
- **Duplicate_Feature**: Multiple feature directories implementing the same functionality in different locations
- **Incomplete_Feature**: A feature directory missing required segments or containing only one segment
- **Non-Standard_Segment**: A segment using non-FSD naming conventions (e.g., components/ instead of ui/, services/ instead of api/)
- **Domain-Specific_Code**: Code that belongs to a specific feature or entity but is incorrectly placed in the shared layer
- **Heavy_Component**: A complex component with business logic that should live in a feature rather than a page
- **Build_Artifact**: Files with non-standard extensions or migration leftovers (e.g., .PATCH.js, duplicate .js/.ts pairs)
- **Refactoring_Tool**: An automated script or tool that performs systematic code transformations
- **Build_Verification**: Running `npm run build:dev` to validate that all imports resolve correctly
- **Migration_Backup**: The `.migration-backups/` directory containing pre-migration code for reference

## Requirements

### Requirement 1: Fix Entities Importing from Features

**User Story:** As a developer, I want entities to not depend on features, so that entities remain reusable business logic components without coupling to higher-layer feature implementations.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans the entities layer, THE System SHALL identify all import statements from @/features/
2. FOR ALL identified violations in entities, THE System SHALL extract the imported functionality into the entities layer or shared layer
3. WHEN functionality cannot be moved, THE System SHALL use dependency injection to pass feature dependencies as parameters
4. THE System SHALL update all affected import statements to reference the new locations
5. AFTER refactoring, THE Build_Verification SHALL pass without entities-to-features import errors
6. THE System SHALL maintain identical runtime behavior before and after refactoring

### Requirement 2: Fix Shared Importing from Features

**User Story:** As a developer, I want the shared layer to be independent of features, so that shared utilities and components can be reused across any feature without circular dependencies.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans the shared layer, THE System SHALL identify all import statements from @/features/
2. FOR ALL shared components importing feature types, THE System SHALL move those types to @/shared/types/
3. FOR ALL shared hooks importing feature services, THE System SHALL refactor to accept services as parameters or move services to shared
4. FOR ALL shared UI components importing feature logic, THE System SHALL extract that logic to the component's parent feature
5. AFTER refactoring, THE Build_Verification SHALL pass without shared-to-features import errors
6. THE System SHALL preserve all existing functionality without behavioral changes

### Requirement 3: Fix Pages Being Imported into Lower Layers

**User Story:** As a developer, I want pages to remain at the top layer, so that lower layers don't depend on page-level components and routing logic.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans non-page layers, THE System SHALL identify all import statements from @/pages/
2. FOR ALL page components imported into shared or app layers, THE System SHALL extract those components into appropriate lower layers
3. WHEN OrganizationSetup is imported into guards, THE System SHALL move OrganizationSetup from pages to features or widgets
4. WHEN promotional banners are imported into layouts, THE System SHALL move those components to widgets or features
5. AFTER refactoring, THE Build_Verification SHALL pass without lower-layers-to-pages import errors
6. THE System SHALL maintain all routing and navigation functionality

### Requirement 4: Replace Relative Imports with Absolute Path Aliases

**User Story:** As a developer, I want all imports to use absolute path aliases, so that import statements are clear, maintainable, and independent of file location.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans all source files, THE System SHALL identify all relative imports using ../../ or more parent directory traversals
2. FOR ALL identified relative imports, THE System SHALL convert them to absolute imports using the @/ path alias
3. THE System SHALL preserve the correct module resolution for all converted imports
4. WHEN converting imports, THE System SHALL respect FSD layer boundaries and not introduce new violations
5. AFTER refactoring, THE Build_Verification SHALL pass without module resolution errors
6. THE System SHALL process all ~100+ files with relative import violations

### Requirement 5: Enforce Feature Public API Boundaries

**User Story:** As a developer, I want all feature imports to go through public APIs, so that features can refactor their internal structure without breaking consumers.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans all source files, THE System SHALL identify all imports from @/features/*/ui/, @/features/*/api/, @/features/*/model/, or @/features/*/lib/
2. FOR ALL identified internal imports, THE System SHALL verify the component is exported from the feature's index file
3. WHEN a component is not exported, THE System SHALL add the export to the feature's public API
4. THE System SHALL update all import statements to reference the feature's index file instead of internal paths
5. AFTER refactoring, THE Build_Verification SHALL pass without internal import violations
6. THE System SHALL process all ~50+ files with internal import violations

### Requirement 6: Remove Entity Dependencies on Global Stores

**User Story:** As a developer, I want entities to not depend on global stores, so that entities remain pure, testable, and reusable without global state coupling.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans the entities layer, THE System SHALL identify all import statements from @/stores
2. FOR ALL entities importing useUser or other store hooks, THE System SHALL refactor to accept user data as parameters
3. WHEN entities need authentication context, THE System SHALL use dependency injection instead of direct store access
4. THE System SHALL update all calling code to pass required data from stores to entity functions
5. AFTER refactoring, THE Build_Verification SHALL pass without entities-to-stores import errors
6. THE System SHALL maintain all existing functionality with entities receiving data through parameters

### Requirement 7: Provide Violation Detection and Reporting

**User Story:** As a developer, I want automated violation detection, so that I can prevent new violations from being introduced after cleanup.

#### Acceptance Criteria

1. THE System SHALL create a violation detection script that scans for all 6 violation categories
2. WHEN the detection script runs, THE System SHALL output a categorized report of all violations with file paths and line numbers
3. THE System SHALL provide violation counts for each category
4. THE System SHALL support integration into CI/CD pipelines with non-zero exit codes when violations are found
5. THE System SHALL complete scanning the entire codebase in under 10 seconds
6. THE System SHALL output results in both human-readable and machine-parseable formats

### Requirement 8: Maintain Build Stability Throughout Refactoring

**User Story:** As a developer, I want the build to remain stable during refactoring, so that I can incrementally fix violations without breaking the application.

#### Acceptance Criteria

1. AFTER each violation category is fixed, THE Build_Verification SHALL pass successfully
2. WHEN a refactoring introduces new errors, THE System SHALL roll back that change and try an alternative approach
3. THE System SHALL fix violations in dependency order (shared first, then entities, then features, etc.)
4. WHEN multiple files have the same violation pattern, THE System SHALL fix all occurrences atomically
5. THE System SHALL preserve all existing functionality as verified by successful builds
6. AFTER all refactoring is complete, THE Build_Verification SHALL pass with zero FSD violations

### Requirement 9: Document Refactoring Patterns and Decisions

**User Story:** As a developer, I want refactoring patterns documented, so that I understand how violations were fixed and can apply the same patterns to new code.

#### Acceptance Criteria

1. FOR EACH violation category, THE System SHALL document the refactoring pattern used
2. THE System SHALL provide before/after code examples for each pattern
3. WHEN functionality is moved between layers, THE System SHALL document the rationale
4. THE System SHALL document any breaking changes or API modifications
5. THE System SHALL create a migration guide for developers working on feature branches
6. THE System SHALL include the documentation in the .kiro/specs/fsd-violations-cleanup/ directory

### Requirement 10: Validate FSD Compliance Post-Cleanup

**User Story:** As a developer, I want comprehensive validation after cleanup, so that I can confirm all violations are resolved and no new violations were introduced.

#### Acceptance Criteria

1. AFTER all refactoring is complete, THE System SHALL run the violation detection script
2. THE System SHALL verify zero violations in all 6 categories
3. THE Build_Verification SHALL complete successfully with no import errors
4. THE System SHALL verify all feature public APIs are properly structured
5. THE System SHALL confirm all layers follow unidirectional dependency flow
6. THE System SHALL generate a final compliance report showing before/after violation counts

### Requirement 11: Relocate Non-FSD Layers from src/

**User Story:** As a developer, I want non-FSD directories removed from src/, so that the src/ directory contains only valid FSD layers and the architecture remains clean.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans src/, THE System SHALL identify all directories that are not valid FSD layers
2. FOR ALL Zustand stores in src/stores/, THE System SHALL move them to the appropriate feature or entity model/ segments
3. FOR ALL data directories in src/data/, THE System SHALL move them to the owning slice's model/ segment
4. FOR ALL Cloudflare Worker utilities in src/functions-lib/, THE System SHALL move them outside src/ to a functions/ directory
5. FOR ALL migration scripts in src/scripts/ and src/migration/, THE System SHALL move them to root scripts/ directory or delete if obsolete
6. WHEN src/types.tsx exists at root, THE System SHALL move it to shared/types/
7. AFTER refactoring, THE Build_Verification SHALL pass with all imports updated to new locations

### Requirement 12: Consolidate Duplicate Feature Folders

**User Story:** As a developer, I want duplicate feature implementations consolidated, so that there is a single source of truth for each feature without redundant code.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans features/, THE System SHALL identify all duplicate feature directories
2. FOR ALL components in src/features/admin/ui/collegeAdmin/, THE System SHALL merge them into src/features/college-admin/
3. FOR ALL components in src/features/admin/ui/universityAdmin/, THE System SHALL move them to features/university-admin/
4. WHEN src/features/student-dashboard/ contains only api/, THE System SHALL merge it with widgets/student-dashboard/ or delete if redundant
5. WHEN src/features/digital-passport/ contains only ui/, THE System SHALL add missing model/ and lib/ segments or merge with complete implementation
6. AFTER consolidation, THE System SHALL update all import statements to reference the canonical feature location
7. THE Build_Verification SHALL pass with no duplicate feature references

### Requirement 13: Complete Incomplete Feature Structures

**User Story:** As a developer, I want all features to have complete FSD segment structures, so that features follow consistent organization patterns.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans features/, THE System SHALL identify all features missing required segments
2. WHEN src/features/admin/ is missing model/ and lib/ segments, THE System SHALL create them or move functionality from incomplete locations
3. WHEN src/features/analytics/ is missing ui/ segment, THE System SHALL create it or move UI components from other locations
4. WHEN src/features/recruiter/ contains only ui/, THE System SHALL add model/ and api/ segments with appropriate functionality
5. FOR ALL incomplete features, THE System SHALL ensure they have at least ui/ and model/ segments
6. AFTER completion, THE Build_Verification SHALL pass with all features properly structured
7. THE System SHALL document which segments were added and what functionality was moved

### Requirement 14: Standardize FSD Segment Names

**User Story:** As a developer, I want all features to use standard FSD segment names, so that the codebase follows consistent naming conventions.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans features/, THE System SHALL identify all non-standard segment names
2. FOR ALL features using components/ instead of ui/, THE System SHALL rename the directory to ui/
3. FOR ALL features using services/ instead of api/, THE System SHALL rename the directory to api/
4. FOR ALL features using utils/ instead of lib/, THE System SHALL rename the directory to lib/
5. FOR ALL features with types/ segments, THE System SHALL move types to model/ or shared/types/
6. FOR ALL features with prompts/, config/, or handlers/ segments, THE System SHALL move them to lib/ or model/ as appropriate
7. AFTER standardization, THE Build_Verification SHALL pass with all imports updated to standard segment names

### Requirement 15: Remove Domain-Specific Code from Shared Layer

**User Story:** As a developer, I want shared layer to contain only generic reusable code, so that domain-specific logic lives in appropriate features or entities.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans shared/, THE System SHALL identify all domain-specific components and services
2. FOR ALL role-specific UI components in shared/ui/, THE System SHALL move them to appropriate feature ui/ segments
3. FOR ALL feature-level components like KPICard and KPIDashboard in shared/ui/, THE System SHALL move them to features/analytics/ui/
4. FOR ALL entity-specific components like StudentProfileDrawer in shared/ui/, THE System SHALL move them to appropriate entity or feature ui/
5. FOR ALL domain services in shared/api/, THE System SHALL move them to appropriate feature api/ segments
6. FOR ALL auth guards and routers in shared/lib/, THE System SHALL move them to features/auth/lib/ or app/guards/
7. AFTER refactoring, THE Build_Verification SHALL pass with shared layer containing only generic utilities

### Requirement 16: Extract Heavy Components from Pages Layer

**User Story:** As a developer, I want pages to be thin routing components, so that business logic and heavy components live in features or widgets.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans pages/, THE System SHALL identify all heavy components and complete features within pages
2. FOR ALL components in pages/admin/collegeAdmin/components/, THE System SHALL move them to features/college-admin/ui/
3. FOR ALL complete features like pages/admin/collegeAdmin/finance/, THE System SHALL move them to features/college-finance/
4. FOR ALL components in pages/admin/schoolAdmin/components/, THE System SHALL move them to features/school-admin/ui/
5. WHEN ToastProvider exists in pages/, THE System SHALL move it to app/providers/
6. AFTER extraction, THE System SHALL update page components to import from new feature locations
7. THE Build_Verification SHALL pass with pages containing only routing and composition logic

### Requirement 17: Remove Build Artifacts and Migration Leftovers

**User Story:** As a developer, I want build artifacts and migration leftovers removed, so that the codebase contains only production code.

#### Acceptance Criteria

1. WHEN the Refactoring_Tool scans the codebase, THE System SHALL identify all files with non-standard extensions
2. FOR ALL files with .PATCH.js extension, THE System SHALL remove them or rename to standard extensions
3. FOR ALL duplicate .js/.ts file pairs in shared/api/, THE System SHALL keep only the TypeScript version
4. FOR ALL markdown files inside feature directories, THE System SHALL move them to docs/ or delete if obsolete
5. WHEN data/ segments exist inside features, THE System SHALL rename them to model/ segments
6. AFTER cleanup, THE Build_Verification SHALL pass with no artifact-related errors
7. THE System SHALL document all removed artifacts for reference

