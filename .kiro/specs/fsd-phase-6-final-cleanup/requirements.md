# Requirements Document

## Introduction

This document defines the requirements for completing the Feature-Sliced Design (FSD) architectural migration for the SkillPassport codebase. Despite completing Phases 1-5, the audit shows only 15-20% FSD compliance because legacy directories (components/, services/, hooks/, utils/, types/, config/, lib/, layouts/, routes/, providers/) still coexist with the new FSD structure. This phase eliminates the dual structure by migrating all remaining code to FSD layers and deleting legacy directories to achieve 100% FSD compliance.

## Glossary

- **Legacy_Structure**: Old directories (components/, services/, hooks/, utils/, types/, config/, lib/, layouts/, routes/, providers/) that coexist with FSD
- **FSD_Structure**: Feature-Sliced Design layers (app/, pages/, widgets/, features/, entities/, shared/)
- **Business_Logic**: Data fetching, API calls, state management, and domain logic
- **Page_Component**: Route-level component that should only compose widgets/features without business logic
- **Widget**: Composite UI block that combines multiple features/entities
- **Feature**: Business capability with user interactions (auth, messaging, courses, etc.)
- **Entity**: Business domain object (User, Course, Organization, etc.)
- **Shared_Layer**: Reusable infrastructure, UI kit, utilities, and configuration
- **App_Layer**: Application-level concerns (routing, layouts, providers, global initialization)
- **Public_API**: Exported interface through index.ts files following FSD conventions
- **Import_Violation**: Import that breaks FSD layer hierarchy rules
- **Supabase_Client**: Database client instance used for direct data access

## Requirements

### Requirement 1: Migrate Remaining Features from components/

**User Story:** As a developer, I want all feature components migrated from components/ to features/, so that business capabilities are properly encapsulated.

#### Acceptance Criteria

1. THE System SHALL identify all feature-related components in src/components/ directory
2. FOR EACH identified feature component, THE System SHALL determine the appropriate feature slice (opportunities, college-admin, digital-portfolio, ai-tutor, counselling, etc.)
3. WHEN migrating feature components, THE System SHALL create features/{feature-name}/ui/ directories if they don't exist
4. THE System SHALL move feature UI components to features/{feature-name}/ui/
5. THE System SHALL create index.ts files exposing Public_API for each feature
6. THE System SHALL update all import paths referencing migrated components
7. WHEN components share code, THE System SHALL consolidate duplicates into the canonical feature location
8. THE System SHALL validate all migrated features follow FSD structure (ui/, model/, api/, lib/ subdirectories)

### Requirement 2: Refactor Pages to Remove Business Logic

**User Story:** As a developer, I want pages to only compose widgets/features, so that business logic is properly separated from presentation.

#### Acceptance Criteria

1. THE System SHALL scan all page components in src/pages/ for Business_Logic violations
2. WHEN a Page_Component contains supabase.from() calls, THE System SHALL extract them to feature api/ directories
3. WHEN a Page_Component contains supabase.rpc() calls, THE System SHALL extract them to feature api/ directories
4. WHEN a Page_Component contains supabase.auth() calls, THE System SHALL extract them to features/auth/api/
5. WHEN a Page_Component contains state management logic, THE System SHALL extract it to feature model/ directories
6. WHEN a Page_Component contains data transformation logic, THE System SHALL extract it to feature lib/ directories
7. THE System SHALL refactor pages to import and compose from features/ and widgets/ only
8. THE System SHALL validate zero direct Supabase_Client usage remains in page components

### Requirement 3: Eliminate Direct Service Imports from Pages

**User Story:** As a developer, I want pages to use feature APIs instead of services directly, so that feature encapsulation is maintained.

#### Acceptance Criteria

1. THE System SHALL identify all pages importing from src/services/ directory
2. FOR EACH service import in pages, THE System SHALL determine the owning feature
3. WHEN a service belongs to a feature, THE System SHALL ensure it exists in features/{feature-name}/api/
4. THE System SHALL refactor page imports to use feature Public_API instead of direct service imports
5. THE System SHALL validate zero imports from @/services/ exist in page components
6. WHEN services are shared across features, THE System SHALL move them to shared/api/
7. THE System SHALL update all import paths to use @/features/{feature-name} or @/shared/api
8. THE System SHALL verify pages only import from features/, widgets/, and shared/ layers

### Requirement 4: Migrate Global hooks/ to Feature model/ Directories

**User Story:** As a developer, I want hooks organized by feature, so that state management is colocated with business logic.

#### Acceptance Criteria

1. THE System SHALL catalog all hooks in src/hooks/ directory (113 files)
2. FOR EACH hook, THE System SHALL determine feature ownership based on usage analysis
3. WHEN a hook is feature-specific, THE System SHALL move it to features/{feature-name}/model/
4. WHEN a hook is entity-specific, THE System SHALL move it to entities/{entity-name}/model/
5. WHEN a hook is generic/reusable, THE System SHALL move it to shared/lib/hooks/
6. THE System SHALL update all import paths referencing migrated hooks
7. THE System SHALL validate zero imports from @/hooks/ exist after migration
8. THE System SHALL ensure hooks follow naming convention (use* prefix)

### Requirement 5: Migrate Global utils/ to shared/lib/

**User Story:** As a developer, I want utility functions in shared/lib/, so that reusable code is properly organized.

#### Acceptance Criteria

1. THE System SHALL catalog all utilities in src/utils/ directory (58 files)
2. FOR EACH utility, THE System SHALL determine if it's feature-specific or generic
3. WHEN a utility is feature-specific, THE System SHALL move it to features/{feature-name}/lib/
4. WHEN a utility is entity-specific, THE System SHALL move it to entities/{entity-name}/lib/
5. WHEN a utility is generic/reusable, THE System SHALL move it to shared/lib/
6. THE System SHALL update all import paths referencing migrated utilities
7. THE System SHALL validate zero imports from @/utils/ exist after migration
8. THE System SHALL consolidate duplicate utility functions during migration

### Requirement 6: Migrate Global types/ to Appropriate Layers

**User Story:** As a developer, I want types organized by domain, so that type definitions are colocated with their usage.

#### Acceptance Criteria

1. THE System SHALL catalog all type definitions in src/types/ directory (13 files)
2. FOR EACH type definition, THE System SHALL determine domain ownership
3. WHEN a type is entity-specific, THE System SHALL move it to entities/{entity-name}/model/types.ts
4. WHEN a type is feature-specific, THE System SHALL move it to features/{feature-name}/model/types.ts
5. WHEN a type is shared across layers, THE System SHALL move it to shared/types/
6. THE System SHALL update all import paths referencing migrated types
7. THE System SHALL validate zero imports from @/types/ exist after migration
8. THE System SHALL ensure all TypeScript interfaces are properly exported through Public_API

### Requirement 7: Migrate services/ to Feature/Entity api/ Directories

**User Story:** As a developer, I want API functions organized by feature/entity, so that data access is properly encapsulated.

#### Acceptance Criteria

1. THE System SHALL catalog all services in src/services/ directory (235 files)
2. FOR EACH service, THE System SHALL determine feature or entity ownership
3. WHEN a service is feature-specific, THE System SHALL move it to features/{feature-name}/api/
4. WHEN a service is entity-specific, THE System SHALL move it to entities/{entity-name}/api/
5. WHEN a service is infrastructure/generic, THE System SHALL move it to shared/api/
6. THE System SHALL update all import paths referencing migrated services
7. THE System SHALL validate zero imports from @/services/ exist after migration
8. THE System SHALL ensure API functions are exported through feature/entity Public_API

### Requirement 8: Fix Entities Layer API Violations

**User Story:** As a developer, I want entities to not import from services/, so that layer dependencies are correct.

#### Acceptance Criteria

1. THE System SHALL identify all imports from @/services/ in src/entities/ directory
2. FOR EACH entity importing from services/, THE System SHALL move the service to entities/{entity-name}/api/
3. THE System SHALL refactor entity imports to use local api/ directory
4. THE System SHALL validate entities only contain types, validation, and pure functions
5. THE System SHALL ensure entities do not import from features/ layer (upward dependency violation)
6. THE System SHALL verify entities only import from shared/ layer and other entities
7. THE System SHALL validate zero @/services/ imports exist in entities/ after migration
8. THE System SHALL ensure entity api/ directories only contain entity-specific data access

### Requirement 9: Create Proper Widgets for Composite UI Blocks

**User Story:** As a developer, I want widgets for composite UI sections, so that complex interfaces are properly structured.

#### Acceptance Criteria

1. THE System SHALL identify composite UI components that combine multiple features/entities
2. FOR EACH identified composite component, THE System SHALL create widgets/{widget-name}/ directory
3. THE System SHALL create widgets/{widget-name}/ui/ for widget UI components
4. THE System SHALL create widgets/{widget-name}/model/ for widget-specific state management
5. THE System SHALL move dashboard layouts to appropriate widget directories (student-dashboard, educator-dashboard, recruiter-dashboard, admin-dashboard)
6. THE System SHALL move complex forms to widget directories if they compose multiple features
7. THE System SHALL ensure widgets only import from features/, entities/, and shared/ layers
8. THE System SHALL validate widgets expose Public_API through index.ts files

### Requirement 10: Create app/ Layer for Application Concerns

**User Story:** As a developer, I want application-level code in app/ layer, so that routing, layouts, and providers are properly organized.

#### Acceptance Criteria

1. THE System SHALL create src/app/ directory structure
2. THE System SHALL move routing configuration from src/routes/ to app/routes/
3. THE System SHALL move layout components from src/layouts/ to app/layouts/
4. THE System SHALL move provider components from src/providers/ to app/providers/
5. THE System SHALL move global configuration from src/config/ to app/config/ or shared/config/
6. THE System SHALL create app/index.ts as application entry point
7. THE System SHALL update main.tsx to import from app/ layer
8. THE System SHALL validate app/ layer only imports from lower layers (pages, widgets, features, entities, shared)

### Requirement 11: Migrate config/ to shared/config/

**User Story:** As a developer, I want configuration in shared/config/, so that app settings are centralized.

#### Acceptance Criteria

1. THE System SHALL identify all configuration files in src/config/ directory
2. FOR EACH configuration file, THE System SHALL determine if it's app-level or shared
3. WHEN configuration is app-specific, THE System SHALL move it to app/config/
4. WHEN configuration is shared/reusable, THE System SHALL move it to shared/config/
5. THE System SHALL update all import paths referencing migrated configuration
6. THE System SHALL validate zero imports from @/config/ exist after migration
7. THE System SHALL ensure environment variables are accessed through shared/config/
8. THE System SHALL consolidate duplicate configuration during migration

### Requirement 12: Migrate lib/ to shared/lib/

**User Story:** As a developer, I want library code in shared/lib/, so that infrastructure utilities are properly organized.

#### Acceptance Criteria

1. THE System SHALL identify all library code in src/lib/ directory
2. FOR EACH library module, THE System SHALL determine if it's feature-specific or shared
3. WHEN library code is feature-specific, THE System SHALL move it to features/{feature-name}/lib/
4. WHEN library code is shared/reusable, THE System SHALL move it to shared/lib/
5. THE System SHALL update all import paths referencing migrated library code
6. THE System SHALL validate zero imports from @/lib/ exist after migration
7. THE System SHALL ensure Supabase_Client remains in shared/api/
8. THE System SHALL consolidate duplicate library code during migration

### Requirement 13: Fix features/assessment Legacy Structure

**User Story:** As a developer, I want features/assessment refactored to proper FSD structure, so that it follows layer conventions.

#### Acceptance Criteria

1. THE System SHALL analyze features/assessment/ internal structure
2. WHEN features/assessment uses legacy patterns, THE System SHALL refactor to FSD structure
3. THE System SHALL ensure features/assessment has proper ui/, model/, api/, lib/ subdirectories
4. THE System SHALL move assessment components to features/assessment/ui/
5. THE System SHALL move assessment services to features/assessment/api/
6. THE System SHALL move assessment hooks to features/assessment/model/
7. THE System SHALL move assessment utilities to features/assessment/lib/
8. THE System SHALL validate features/assessment follows FSD conventions

### Requirement 14: Validate All Imports Follow FSD Layer Rules

**User Story:** As a developer, I want import validation, so that layer dependencies are enforced.

#### Acceptance Criteria

1. THE System SHALL scan all import statements across the codebase
2. THE System SHALL validate imports follow FSD hierarchy (app → pages → widgets → features → entities → shared)
3. WHEN detecting upward dependencies, THE System SHALL report them as Import_Violation
4. THE System SHALL validate features do not import from other features directly
5. THE System SHALL validate entities do not import from features or widgets
6. THE System SHALL validate shared layer does not import from any higher layer
7. THE System SHALL generate import violation report with file locations and recommendations
8. THE System SHALL validate all imports use Public_API paths (through index.ts)

### Requirement 15: Delete Legacy Directory Structure

**User Story:** As a developer, I want legacy directories deleted, so that only FSD structure remains.

#### Acceptance Criteria

1. WHEN all code is migrated from Legacy_Structure, THE System SHALL validate zero active imports remain
2. THE System SHALL create backup of Legacy_Structure before deletion
3. THE System SHALL delete src/components/ directory after validation
4. THE System SHALL delete src/services/ directory after validation
5. THE System SHALL delete src/hooks/ directory after validation
6. THE System SHALL delete src/utils/ directory after validation
7. THE System SHALL delete src/types/ directory after validation
8. THE System SHALL delete src/config/, src/lib/, src/layouts/, src/routes/, src/providers/ directories after validation

### Requirement 16: Validate Application Functionality

**User Story:** As a developer, I want comprehensive validation, so that the application works identically after migration.

#### Acceptance Criteria

1. THE System SHALL run TypeScript compiler and validate zero type errors
2. THE System SHALL run all unit tests and validate 100% pass rate
3. THE System SHALL run integration tests for all features
4. THE System SHALL validate all pages render without errors
5. THE System SHALL validate authentication flows work correctly
6. THE System SHALL validate data fetching works correctly
7. THE System SHALL validate state management works correctly
8. THE System SHALL generate validation report with test results and metrics

### Requirement 17: Measure FSD Compliance

**User Story:** As a technical lead, I want FSD compliance metrics, so that I can verify migration completion.

#### Acceptance Criteria

1. THE System SHALL calculate percentage of code in FSD_Structure vs Legacy_Structure
2. THE System SHALL count files in each FSD layer (app, pages, widgets, features, entities, shared)
3. THE System SHALL count Import_Violation instances
4. THE System SHALL count pages with Business_Logic violations
5. THE System SHALL count direct service imports from pages
6. THE System SHALL generate compliance report with before/after metrics
7. THE System SHALL validate 100% FSD compliance after migration
8. THE System SHALL provide compliance score with breakdown by category

### Requirement 18: Generate Migration Documentation

**User Story:** As a developer, I want migration documentation, so that I understand the new structure and how to work with it.

#### Acceptance Criteria

1. THE System SHALL document the final FSD directory structure
2. THE System SHALL provide import path migration guide for common patterns
3. THE System SHALL document Public_API for each feature and entity
4. THE System SHALL provide examples of creating new features following FSD
5. THE System SHALL document layer rules and import restrictions
6. THE System SHALL provide troubleshooting guide for common issues
7. THE System SHALL document architectural decisions made during migration
8. THE System SHALL generate before/after code examples for typical use cases
